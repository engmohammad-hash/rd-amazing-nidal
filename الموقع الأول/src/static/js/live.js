/* Live 3D for capable devices: the very scene the film's frames were rendered from, drawn in the browser at the
   screen's own resolution and refresh rate, so it is sharp on any phone and moves with every pixel of scroll
   instead of stepping from frame to frame.

   site.js imports this only after its quick checks pass (WebGL2, a real GPU, not a 2010-era Intel one).
   The film of frames keeps playing underneath while this builds; it takes over only if the device draws a frame
   well inside its budget, and hands back if it ever falls behind for long. */
import { createStage } from '../scenes/common.js';

const BUDGET_MS = 10;        // a frame of update + draw + GPU finish; leaves room for the page at 60-120 Hz
const MAX_PIXELS = 3.2e6;    // about 2560 x 1250, or a phone at 2.5x
const nextFrame = () => new Promise(r => requestAnimationFrame(r));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export async function start({ stageEl, storyEl, sceneId, root, S, onLive, onFail }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'film live';
  canvas.setAttribute('aria-hidden', 'true');
  stageEl.insertBefore(canvas, stageEl.querySelector('.film').nextSibling);

  let stage, scene, alive = true, scale = Math.min(window.devicePixelRatio || 1, 2.5), css = [0, 0];
  const fail = why => {
    if (!alive) return;
    alive = false;
    canvas.remove();
    try { stage && stage.renderer.dispose(); } catch (e) {}
    onFail(why);
  };
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fail('context lost'); });

  try {
    const mod = await import(`../scenes/${sceneId}.js`);
    stage = await createStage(canvas, { assets: root + 'assets/img/', live: true });
    stage.setWords(mod.words || []);
    scene = await mod.default(stage);
  } catch (e) { fail('build: ' + (e && e.message)); return; }

  function fit(force) {
    const w = stageEl.clientWidth, h = stageEl.clientHeight;
    if (!force && Math.abs(w - css[0]) < 2 && Math.abs(h - css[1]) < 2) return;
    css = [w, h];
    let k = scale;
    if (w * h * k * k > MAX_PIXELS) k = Math.sqrt(MAX_PIXELS / (w * h));
    stage.resize(Math.round(w * k), Math.round(h * k), w, h, 'film');
  }

  const gl = stage.renderer.getContext(), px = new Uint8Array(4);
  function draw(p) { stage.updateCommon(p); scene.update(p); stage.render(); }
  function timed(p) {
    const t0 = performance.now();
    draw(p);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);   // waits for the GPU, so the time is real
    return performance.now() - t0;
  }
  async function bench(n) {
    const times = [];
    for (let i = 0; i < n; i++) { times.push(timed(clamp(S.p + (i - n / 2) * .01))); await nextFrame(); }
    times.sort((a, b) => a - b);
    return times[Math.floor(n / 2)];
  }

  try {
    fit(true);
    // one pass over the whole film compiles every material it will ever show, so no shader stalls later
    for (let i = 0; i <= 12 && alive; i++) { draw(i / 12); await nextFrame(); }
    let ms = await bench(12);
    if (ms > BUDGET_MS && alive && !S.liveForced) { scale *= .7; fit(true); ms = await bench(10); }
    S.liveMs = Math.round(ms * 10) / 10;
    if (ms > BUDGET_MS && !S.liveForced) { fail('slow: ' + S.liveMs + ' ms'); return; }
  } catch (e) { fail('bench: ' + (e && e.message)); return; }
  if (!alive) return;

  // show it: draw where the reader is, then fade in over the film
  let lastP = -1, onScreen = true;
  draw(S.p); lastP = S.p;
  canvas.classList.add('ready');
  onLive();

  new IntersectionObserver(es => { onScreen = es[0].isIntersecting; }).observe(storyEl);
  let resizeT = 0;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { fit(false); lastP = -1; }, 150); });

  // watchdog: frames that keep taking far longer than the screen's own interval mean this device is struggling.
  // First the resolution drops a step (twice at most), then the film of frames takes over again.
  let slow = 0, steps = 0, prev = performance.now();
  (function loop(now) {
    if (!alive) return;
    const gap = now - prev; prev = now;
    const p = S.p;
    if (onScreen && Math.abs(p - lastP) > 1e-6) {
      draw(p); lastP = p;
      slow = gap > 34 ? slow + 1 : Math.max(0, slow - 2);
      if (slow > 45 && !S.liveForced) {
        slow = 0;
        if (steps < 2) { steps++; scale *= .75; fit(true); lastP = -1; }
        else { fail('fell behind'); return; }
      }
    }
    requestAnimationFrame(loop);
  })(prev);
}
