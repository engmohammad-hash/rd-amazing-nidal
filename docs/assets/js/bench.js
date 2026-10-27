/* Scrolling speed test, loaded by the home page when its address ends in #bench.
   Starts scrolling soon after the film appears, the way an eager visitor would, and scrolls through
   the story (down, then a little back up) while timing every frame and how far the picture trails
   the scroll. The result goes to document.title (read by tools/run_bench.py) and, when served by
   tools/frame_server.py, to tools/bench.log. */
(function () {
  var S = window.__story;
  var story = document.getElementById('story');
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  async function run() {
    var t0 = performance.now(), loadedAt = t0, fontsAt = -1, scrollAt = 0;
    if (document.fonts) document.fonts.ready.then(function () { fontsAt = performance.now(); });
    var firstSharpAt = -1;
    (function watch() { if (S.filmSharp) firstSharpAt = performance.now(); else requestAnimationFrame(watch); })();
    while (!document.querySelector('.film.ready') && performance.now() - t0 < 30000) await wait(100);
    var readyAfter = performance.now() - t0;
    await wait(2000);

    var long = [];
    var po = new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { long.push(e.duration); }); });
    try { po.observe({ type: 'longtask' }); } catch (e) {}

    var top = story.offsetTop, total = story.offsetHeight - innerHeight;

    // a reader glides to the second act in a second and stops to read: how long until that frame is sharp
    await new Promise(function (resolve) {
      var g0 = performance.now();
      (function glide(now) {
        var k = Math.min(1, (now - g0) / 1000);
        window.scrollTo({ top: top + total * .4 * k, behavior: 'instant' });
        if (k < 1) requestAnimationFrame(glide); else resolve();
      })(g0);
    });
    var glideAt = performance.now();
    await wait(400);   // the picture eases into place
    while (!S.filmSharp && performance.now() - glideAt < 15000) await wait(50);
    var sharpAfterGlide = performance.now() - glideAt;
    var gaps = [], trail = [], sharpTicks = 0, shown0 = S.filmShown || 0, fetchedAtStart = S.filmFetched || 0, smallAtStart = S.filmSmall || 0, dur = 14000;
    await new Promise(function (resolve) {
      var start = performance.now(), last = start;
      scrollAt = start;
      function step(now) {
        gaps.push(now - last); last = now;
        trail.push(S.filmGap || 0);
        if (S.filmSharp) sharpTicks++;
        var k = Math.min(1, (now - start) / dur);
        var pos = k < .8 ? k / .8 : 1 - (k - .8) / .2 * .3;
        window.scrollTo({ top: top + total * pos * .97, behavior: 'instant' });   // the site's smooth scrolling is for anchor links only
        if (k < 1) requestAnimationFrame(step); else resolve();
      }
      requestAnimationFrame(step);
    });
    po.disconnect();
    gaps.shift();
    // a reader who stops: how long until the frame on screen is the sharp one
    var stopAt = performance.now();
    var atStop = S.state ? S.state() : null, atStop2s = null;
    setTimeout(function () { atStop2s = S.state ? S.state() : null; }, 2000);
    while (!S.filmSharp && performance.now() - stopAt < 15000) await wait(50);
    var sharpAfterStop = performance.now() - stopAt;

    var sorted = gaps.slice().sort(function (a, b) { return a - b; });
    var mean = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; };
    var result = {
      run: (location.search.match(/[?&]run=(\d+)/) || [])[1] || '',
      where: location.host,
      fps: +(1000 / mean(gaps)).toFixed(1),
      p95ms: +sorted[Math.floor(sorted.length * .95)].toFixed(1),
      worstMs: +sorted[sorted.length - 1].toFixed(1),
      longTasks: long.length,
      longestTaskMs: Math.round(Math.max.apply(null, [0].concat(long))),
      testLoadedAtMs: Math.round(loadedAt),
      filmReadyAfterMs: Math.round(readyAfter),
      smallFramesAtStart: smallAtStart,
      sharpFramesAtStart: fetchedAtStart,
      sharpFramesAtEnd: S.filmFetched || 0,
      sharpShownShare: Math.round(sharpTicks / trail.length * 100) + '%',
      pictureTrailsByFrames: +mean(trail).toFixed(1),
      ticksMoreThan3Behind: Math.round(trail.filter(function (g) { return g > 3; }).length / trail.length * 100) + '%',
      filmFramesShown: (S.filmShown || 0) - shown0,
      fontsReadyAtMs: Math.round(fontsAt),
      firstSharpAtMs: Math.round(firstSharpAt),
      sharpAfterStopMs: Math.round(sharpAfterStop),
      sharpAfterGlideMs: Math.round(sharpAfterGlide),
      lineKBps: S.lineKBps || 0,
      mode: S.live ? 'live' : 'frames',
      liveMs: S.liveMs || 0,
      noLiveBecause: S.liveSkip || S.liveFail || '',
      atStop: atStop,
      atStop2s: atStop2s,
      scrollStartAtMs: Math.round(scrollAt),
      viewport: innerWidth + 'x' + innerHeight + '@' + devicePixelRatio,
    };
    document.title = 'BENCH DONE ' + JSON.stringify(result);
    if (/^(localhost|127\.0\.0\.1)/.test(location.host)) {
      await fetch('/bench', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }).catch(function () {});
    }
  }
  run();
})();
