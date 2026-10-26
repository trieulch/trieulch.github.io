(function () {
  var cv = document.getElementById('field');
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1;
  var parts = [], ripples = [];
  var colors = { base: [190, 205, 215], acc: [227, 168, 87], blue: [140, 200, 255] };

  function rgbArr(str, fallback) {
    var a = str.split(',').map(function (n) { return parseFloat(n); });
    return a.length === 3 && a.every(function (n) { return !isNaN(n); }) ? a : fallback;
  }
  function mix(c, t) {
    var b = colors.blue;
    return Math.round(c[0] + (b[0] - c[0]) * t) + ',' +
           Math.round(c[1] + (b[1] - c[1]) * t) + ',' +
           Math.round(c[2] + (b[2] - c[2]) * t);
  }
  var ptr = { x: -9999, y: -9999 };
  var hint = document.getElementById('hint');

  function readColors() {
    var s = getComputedStyle(document.documentElement);
    colors.base = rgbArr(s.getPropertyValue('--particle-rgb'), colors.base);
    colors.acc = rgbArr(s.getPropertyValue('--accent-rgb'), colors.acc);
    colors.blue = rgbArr(s.getPropertyValue('--blue-rgb'), colors.blue);
    if (reduce) draw();
  }

  function make(x, y, burst) {
    var ang = Math.random() * Math.PI * 2;
    var sp = burst ? 1.4 + Math.random() * 2.2 : 0.06 + Math.random() * 0.2;
    var bx = burst ? 0 : Math.cos(ang) * sp;
    var by = burst ? 0 : Math.sin(ang) * sp;
    return {
      x: x, y: y,
      vx: burst ? Math.cos(ang) * sp : bx,
      vy: burst ? Math.sin(ang) * sp : by,
      bx: bx, by: by,
      r: 1 + Math.random() * 1.5,
      acc: Math.random() < 0.12,
      tint: burst ? 1 : 0,
      life: burst ? 1 : -1
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.min(130, Math.round((W * H) / 11000));
    var base = parts.filter(function (p) { return p.life < 0; });
    var burst = parts.filter(function (p) { return p.life >= 0; });
    while (base.length < n) base.push(make(Math.random() * W, Math.random() * H, false));
    base.length = n;
    parts = base.concat(burst);
    if (reduce) draw();
  }

  function step() {
    var i, p, dx, dy, d;
    for (i = parts.length - 1; i >= 0; i--) {
      p = parts[i];
      dx = p.x - ptr.x; dy = p.y - ptr.y;
      d = Math.sqrt(dx * dx + dy * dy);
      if (d < 110 && d > 0.1) {
        var f = (1 - d / 110) * 0.35;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      p.vx += (p.bx - p.vx) * 0.02;
      p.vy += (p.by - p.vy) * 0.02;
      p.x += p.vx;
      p.y += p.vy;
      if (p.tint > 0 && p.life < 0) p.tint = Math.max(0, p.tint - 0.0022);
      if (p.life >= 0) {
        p.life -= 0.011;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
      } else {
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
      }
    }
    for (i = ripples.length - 1; i >= 0; i--) {
      ripples[i].r += 4.5;
      ripples[i].a -= 0.025;
      if (ripples[i].a <= 0) ripples.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var i, j, a, b, dx, dy, d, al;
    ctx.lineWidth = 1;
    for (i = 0; i < parts.length; i++) {
      a = parts[i];
      for (j = i + 1; j < parts.length; j++) {
        b = parts[j];
        dx = a.x - b.x; dy = a.y - b.y;
        if (dx > 100 || dx < -100 || dy > 100 || dy < -100) continue;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) {
          al = (1 - d / 100) * 0.16;
          ctx.strokeStyle = 'rgba(' + colors.base + ',' + al.toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (i = 0; i < parts.length; i++) {
      a = parts[i];
      al = a.life >= 0 ? 0.8 * a.life : (a.acc ? 0.85 : 0.5);
      ctx.fillStyle = 'rgba(' + mix(a.acc ? colors.acc : colors.base, a.tint) + ',' + (a.tint > 0 ? Math.max(al, 0.9 * (a.life >= 0 ? a.life : 1) * a.tint) : al).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
    }
    for (i = 0; i < ripples.length; i++) {
      ctx.strokeStyle = 'rgba(' + colors.blue.join(',') + ',' + (ripples[i].a * 0.55).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(ripples[i].x, ripples[i].y, ripples[i].r, 0, 6.2832); ctx.stroke();
    }
  }

  function loop() {
    step(); draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('pointermove', function (e) { ptr.x = e.clientX; ptr.y = e.clientY; });
  document.addEventListener('pointerleave', function () { ptr.x = ptr.y = -9999; });

  window.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('a, button')) return;
    var x = e.clientX, y = e.clientY, i, p, dx, dy, d, f;
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      dx = p.x - x; dy = p.y - y;
      d = Math.sqrt(dx * dx + dy * dy);
      if (d < 220 && d > 0.1) {
        f = (1 - d / 220) * 5;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
        if (p.life < 0) p.tint = 1;
      }
    }
    var burstCount = parts.filter(function (q) { return q.life >= 0; }).length;
    for (i = 0; i < 7 && burstCount + i < 60; i++) parts.push(make(x, y, true));
    ripples.push({ x: x, y: y, r: 0, a: 1 });
    if (hint) hint.classList.add('gone');
    if (reduce) draw();
  });

  window.addEventListener('resize', resize);
  var mq = window.matchMedia('(prefers-color-scheme: light)');
  if (mq.addEventListener) mq.addEventListener('change', readColors);
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  readColors();
  resize();
  if (reduce) draw(); else requestAnimationFrame(loop);

  // Copy email
  var btn = document.getElementById('copy');
  var addr = document.getElementById('addr');
  var tag = document.getElementById('tag');
  if (btn) btn.addEventListener('click', function () {
    if (!addr.hidden) { addr.hidden = true; tag.hidden = true; return; }
    addr.hidden = false; tag.hidden = false;
    function done() { tag.textContent = 'copied'; setTimeout(function () { tag.textContent = 'copy'; }, 1600); }
    function fallback() {
      var r = document.createRange(); r.selectNodeContents(addr);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      tag.textContent = 'selected';
      setTimeout(function () { tag.textContent = 'copy'; }, 1600);
    }
    try {
      navigator.clipboard.writeText(addr.textContent).then(done, fallback);
    } catch (err) { fallback(); }
  });
})();
