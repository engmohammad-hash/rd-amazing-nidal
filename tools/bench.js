/* Scrolling speed test, loaded by the home page when its address ends in #bench.
   Waits for the film, scrolls through the story like a reader (down, then a little back up)
   while timing every frame, and posts the result to tools/frame_server.py, which appends it to tools/bench.log. */
(function () {
  var S = window.__story;
  var story = document.getElementById('story');
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  async function run() {
    var t0 = performance.now();
    while (!document.querySelector('.film.ready') && performance.now() - t0 < 30000) await wait(200);
    await wait(6000);   // let the first frames arrive, as a visitor reading the hero would

    var long = [];
    var po = new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { long.push(e.duration); }); });
    try { po.observe({ type: 'longtask' }); } catch (e) {}

    var top = story.offsetTop, total = story.offsetHeight - innerHeight;
    var gaps = [], shown0 = S.filmShown || 0, dur = 14000;
    await new Promise(function (resolve) {
      var start = performance.now(), last = start;
      function step(now) {
        gaps.push(now - last); last = now;
        var k = Math.min(1, (now - start) / dur);
        var pos = k < .8 ? k / .8 : 1 - (k - .8) / .2 * .3;
        window.scrollTo(0, top + total * pos * .97);
        if (k < 1) requestAnimationFrame(step); else resolve();
      }
      requestAnimationFrame(step);
    });
    po.disconnect();
    gaps.shift();

    var sorted = gaps.slice().sort(function (a, b) { return a - b; });
    var mean = gaps.reduce(function (a, b) { return a + b; }, 0) / gaps.length;
    var result = {
      mode: S.filmMode, set: S.filmSet,
      fps: +(1000 / mean).toFixed(1),
      p95ms: +sorted[Math.floor(sorted.length * .95)].toFixed(1),
      worstMs: +sorted[sorted.length - 1].toFixed(1),
      jankyFrames: gaps.filter(function (g) { return g > 34; }).length,
      framesTimed: gaps.length,
      filmFramesShown: (S.filmShown || 0) - shown0,
      longTasks: long.length,
      longestTaskMs: Math.round(Math.max.apply(null, [0].concat(long))),
      viewport: innerWidth + 'x' + innerHeight + '@' + devicePixelRatio,
    };
    await fetch('/bench', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }).catch(function () {});
    document.title = 'BENCH DONE ' + JSON.stringify(result);
  }
  run();
})();
