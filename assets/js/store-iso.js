/* ============================================================
   NEXOVIA — isometric store scene

   The signal path as a place rather than a diagram: a small shop
   floor with the Hive and a PoE switch behind the counter, Cat6
   running up to three ceiling cameras, and incidents firing on
   the floor.

   Projection is a plain 2:1 dimetric — the same family as the
   Hive teardown, so the two read as the same drawing system:

     screen_x = OX + (gx - gy) * U
     screen_y = OY + (gx + gy) * V - gz * Z

   One grid unit is roughly half a metre. Everything is authored
   in grid units and projected once, so the scene can be re-posed
   by moving numbers rather than by editing path data.

   Injected into [data-store-iso].
   ============================================================ */
(function () {
  'use strict';

  var U = 44, V = 22, Z = 30;      /* half-width, half-depth, height unit */
  var OX = 430, OY = 158;

  /* Floor is 12 x 9 units. Extremes land at x=34..958, y=38..620,
     which is why the viewBox below is 1040 x 700. */
  var VW = 1040, VH = 700;

  function P(gx, gy, gz) {
    return [
      OX + (gx - gy) * U,
      OY + (gx + gy) * V - (gz || 0) * Z
    ];
  }
  function pt(gx, gy, gz) { var p = P(gx, gy, gz); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }
  function poly(list) { return list.map(function (a) { return pt(a[0], a[1], a[2]); }).join(' '); }

  /* Length of a projected polyline, so each pulse can travel at a
     speed set by the geometry instead of by a guessed constant. */
  function plen(list) {
    var t = 0;
    for (var i = 1; i < list.length; i++) {
      var a = P(list[i - 1][0], list[i - 1][1], list[i - 1][2]);
      var b = P(list[i][0], list[i][1], list[i][2]);
      t += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return t;
  }

  var TOP = '#131b25', LEFT = '#0a0f16', RIGHT = '#0d141d';
  var LINE = '#212a36', LINE_2 = '#1a212b';
  var ACC = '#00ff88', ACC_M = '#3f9e6e', ACC_L = '#2c6b4c';
  var T3 = '#737d8c', T4 = '#5c6675';

  /* A rectangular solid, drawn back-to-front: top, then the two
     faces that point at the viewer. */
  function box(x0, y0, x1, y1, z0, z1, o) {
    o = o || {};
    var top = o.top || TOP, l = o.left || LEFT, r = o.right || RIGHT;
    var s = o.stroke || LINE;
    return '' +
      '<polygon points="' + poly([[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]]) + '" fill="' + l + '" stroke="' + s + '" stroke-width="1"/>' +
      '<polygon points="' + poly([[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],[x1,y0,z0]]) + '" fill="' + r + '" stroke="' + s + '" stroke-width="1"/>' +
      '<polygon points="' + poly([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]) + '" fill="' + top + '" stroke="' + s + '" stroke-width="1"/>';
  }

  /* ---------- floor ---------- */
  var svg = [];
  svg.push('<polygon points="' + poly([[0,0,0],[12,0,0],[12,9,0],[0,9,0]]) + '" fill="#080b11" stroke="' + LINE_2 + '" stroke-width="1.2"/>');

  /* floor grid — every 1.5 units, kept very quiet so it reads as a
     surveyed plan rather than graph paper */
  var g;
  for (g = 1.5; g < 12; g += 1.5) {
    svg.push('<line x1="' + P(g,0,0)[0].toFixed(1) + '" y1="' + P(g,0,0)[1].toFixed(1) +
             '" x2="' + P(g,9,0)[0].toFixed(1) + '" y2="' + P(g,9,0)[1].toFixed(1) +
             '" stroke="' + LINE_2 + '" stroke-width="0.7" opacity="0.55"/>');
  }
  for (g = 1.5; g < 9; g += 1.5) {
    svg.push('<line x1="' + P(0,g,0)[0].toFixed(1) + '" y1="' + P(0,g,0)[1].toFixed(1) +
             '" x2="' + P(12,g,0)[0].toFixed(1) + '" y2="' + P(12,g,0)[1].toFixed(1) +
             '" stroke="' + LINE_2 + '" stroke-width="0.7" opacity="0.55"/>');
  }

  /* ---------- two cutaway walls ---------- */
  svg.push('<polygon points="' + poly([[0,0,0],[12,0,0],[12,0,2.1],[0,0,2.1]]) + '" fill="#070a0f" stroke="' + LINE_2 + '" stroke-width="1"/>');
  svg.push('<polygon points="' + poly([[0,0,0],[0,9,0],[0,9,2.1],[0,0,2.1]]) + '" fill="#05080c" stroke="' + LINE_2 + '" stroke-width="1"/>');

  /* ---------- counter, back left ---------- */
  svg.push(box(0.7, 0.7, 3.4, 2.1, 0, 1.0, { top: '#111820' }));

  /* ---------- the Hive, on the counter ---------- */
  svg.push(box(1.1, 1.0, 2.0, 1.75, 1.0, 1.42, { top: '#18212c', left: '#0d131a', right: '#111822', stroke: '#2c3746' }));
  /* status LED */
  svg.push('<circle cx="' + P(1.9,1.05,1.42)[0].toFixed(1) + '" cy="' + P(1.9,1.05,1.42)[1].toFixed(1) +
           '" r="3.4" fill="' + ACC + '" class="si-led"/>');

  /* ---------- PoE switch, beside it ---------- */
  svg.push(box(2.35, 1.0, 3.1, 1.7, 1.0, 1.18, { top: '#141c26', left: '#0c1118', right: '#101720', stroke: '#28323f' }));
  /* port lights */
  for (var i = 0; i < 4; i++) {
    var px = 2.5 + i * 0.15;
    svg.push('<circle cx="' + P(px,1.06,1.18)[0].toFixed(1) + '" cy="' + P(px,1.06,1.18)[1].toFixed(1) +
             '" r="1.7" fill="' + ACC_M + '" class="si-port" style="animation-delay:' + (i * 0.18).toFixed(2) + 's"/>');
  }

  /* ---------- aisle shelving ---------- */
  svg.push(box(4.6, 1.4, 5.8, 7.0, 0, 1.55));
  svg.push(box(7.6, 1.4, 8.8, 7.0, 0, 1.55));

  /* ---------- cameras + their cable runs ----------
     Each run leaves the switch, climbs to ceiling height and
     travels to the camera. Authored as grid points so the pulse
     length is derived, not guessed. */
  var CEIL = 3.3;
  var SW = [2.72, 1.35, 1.18];

  var cams = [
    { at: [5.2, 0.75, CEIL], look: [5.2, 4.2], label: 'CAM_01' },
    { at: [8.2, 0.75, CEIL], look: [8.2, 4.2], label: 'CAM_02' },
    { at: [11.2, 3.4, CEIL], look: [9.9, 5.4], label: 'CAM_03' }
  ];

  var cables = [];
  cams.forEach(function (c) {
    cables.push([
      [SW[0], SW[1], SW[2]],
      [SW[0], SW[1], CEIL + 0.25],
      [c.at[0], SW[1], CEIL + 0.25],
      [c.at[0], c.at[1], CEIL + 0.25],
      [c.at[0], c.at[1], c.at[2]]
    ]);
  });

  /* static cable lines first, so pulses ride on top of them */
  cables.forEach(function (path) {
    svg.push('<polyline points="' + poly(path) + '" fill="none" stroke="' + LINE +
             '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>');
  });

  /* detection footprints — a floor rhombus plus two leader lines
     reads as a camera cone far more reliably than a 3D frustum */
  cams.forEach(function (c, n) {
    var lx = c.look[0], ly = c.look[1], s = 1.15;
    svg.push('<polygon points="' + poly([[lx-s,ly-s,0],[lx+s,ly-s,0],[lx+s,ly+s,0],[lx-s,ly+s,0]]) +
             '" fill="' + ACC + '" fill-opacity="0.055" stroke="' + ACC_L +
             '" stroke-width="1" stroke-dasharray="4 4" class="si-cone" style="animation-delay:' + (n * 0.9).toFixed(2) + 's"/>');
    svg.push('<line x1="' + pt(c.at[0],c.at[1],c.at[2]).split(',')[0] + '" y1="' + pt(c.at[0],c.at[1],c.at[2]).split(',')[1] +
             '" x2="' + pt(lx-s,ly-s,0).split(',')[0] + '" y2="' + pt(lx-s,ly-s,0).split(',')[1] +
             '" stroke="' + ACC_L + '" stroke-width="0.8" opacity="0.5"/>');
    svg.push('<line x1="' + pt(c.at[0],c.at[1],c.at[2]).split(',')[0] + '" y1="' + pt(c.at[0],c.at[1],c.at[2]).split(',')[1] +
             '" x2="' + pt(lx+s,ly+s,0).split(',')[0] + '" y2="' + pt(lx+s,ly+s,0).split(',')[1] +
             '" stroke="' + ACC_L + '" stroke-width="0.8" opacity="0.5"/>');
  });

  /* travelling pulses */
  cables.forEach(function (path, n) {
    var L = plen(path);
    svg.push('<polyline points="' + poly(path) + '" fill="none" stroke="' + ACC +
             '" stroke-width="2.4" stroke-linecap="round" class="si-pulse" ' +
             'style="--l:' + L.toFixed(1) + '; stroke-dasharray: 20 ' + L.toFixed(1) +
             '; animation-delay:' + (n * 0.5).toFixed(2) + 's"/>');
  });

  /* camera bodies, drawn last on their runs so they sit on top */
  cams.forEach(function (c) {
    var p = P(c.at[0], c.at[1], c.at[2]);
    svg.push('<g class="si-cam">' +
      '<line x1="' + p[0].toFixed(1) + '" y1="' + (p[1] - 14).toFixed(1) + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="' + LINE + '" stroke-width="1.6"/>' +
      '<rect x="' + (p[0] - 9).toFixed(1) + '" y="' + p[1].toFixed(1) + '" width="18" height="9" fill="#161e28" stroke="#2c3746" stroke-width="1"/>' +
      '<circle cx="' + p[0].toFixed(1) + '" cy="' + (p[1] + 4.5).toFixed(1) + '" r="2.4" fill="' + ACC_M + '"/>' +
      '</g>');
  });

  /* ---------- incident badges ----------
     Anchored to a floor point and lifted, with a leader down to
     the spot, so they read as annotations on the scene. */
  function badge(gx, gy, text, conf, cls, delay) {
    var f = P(gx, gy, 0);
    var a = P(gx, gy, 2.35);
    var w = (text.length + conf.length) * 7.4 + 26;
    return '<g class="' + cls + '" style="animation-delay:' + delay + 's">' +
      '<line x1="' + f[0].toFixed(1) + '" y1="' + f[1].toFixed(1) + '" x2="' + a[0].toFixed(1) + '" y2="' + a[1].toFixed(1) + '" stroke="' + ACC + '" stroke-width="1" opacity="0.55"/>' +
      '<circle cx="' + f[0].toFixed(1) + '" cy="' + f[1].toFixed(1) + '" r="3.4" fill="none" stroke="' + ACC + '" stroke-width="1.4"/>' +
      '<rect x="' + (a[0] - w / 2).toFixed(1) + '" y="' + (a[1] - 24).toFixed(1) + '" width="' + w.toFixed(1) + '" height="22" fill="#05070a" stroke="' + ACC + '" stroke-width="1.2"/>' +
      '<text x="' + a[0].toFixed(1) + '" y="' + (a[1] - 9).toFixed(1) + '" text-anchor="middle" font-family="var(--mono), monospace" font-size="11.5" letter-spacing="1.4" fill="' + ACC + '">' + text + ' ' + conf + '</text>' +
      '</g>';
  }
  svg.push(badge(5.2, 4.2, 'THEFT', '0.94', 'si-badge si-b1', 0));
  svg.push(badge(9.9, 5.4, 'FALL', '0.93', 'si-badge si-b2', 4));

  /* ---------- quiet labels ---------- */
  function tag(gx, gy, gz, s, anchor, dy) {
    var p = P(gx, gy, gz);
    return '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + (dy || 0)).toFixed(1) + '" text-anchor="' + (anchor || 'middle') +
      '" font-family="var(--mono), monospace" font-size="11" letter-spacing="1.6" fill="' + T4 + '">' + s + '</text>';
  }
  svg.push(tag(1.55, 2.5, 1.0, 'NEXOVIA HIVE', 'middle', 16));
  svg.push(tag(3.1, 2.5, 1.0, 'PoE SWITCH', 'middle', 30));
  svg.push(tag(5.2, 7.6, 0, 'AISLE_1', 'middle', 14));
  svg.push(tag(8.2, 7.6, 0, 'AISLE_2', 'middle', 14));

  var style =
    '<style>' +
    '.si-pulse { animation: si-run 2.4s linear infinite; }' +
    '@keyframes si-run { from { stroke-dashoffset: 0; } to { stroke-dashoffset: calc(-1 * var(--l) * 1px); } }' +
    '.si-led { animation: si-blink 2s ease-in-out infinite; }' +
    '@keyframes si-blink { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }' +
    '.si-port { animation: si-blink 1.6s ease-in-out infinite; }' +
    '.si-cone { animation: si-breathe 4.5s ease-in-out infinite; }' +
    '@keyframes si-breathe { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }' +
    '.si-badge { opacity: 0; animation: si-pop 8s ease-in-out infinite; }' +
    '@keyframes si-pop { 0%,2% { opacity: 0; } 6%,34% { opacity: 1; } 40%,100% { opacity: 0; } }' +
    '@media (prefers-reduced-motion: reduce) {' +
    '  .si-pulse, .si-led, .si-port, .si-cone { animation: none; }' +
    '  .si-badge { animation: none; opacity: 1; }' +
    '}' +
    '</style>';

  var markup =
    '<svg class="si-svg" viewBox="0 0 ' + VW + ' ' + VH + '" xmlns="http://www.w3.org/2000/svg" ' +
    'role="img" aria-label="Isometric store floor: the Nexovia Hive and a PoE switch behind the counter, ' +
    'Cat6 running to three ceiling cameras, with theft and fall incidents flagged on the shop floor.">' +
    style + svg.join('') + '</svg>';

  document.querySelectorAll('[data-store-iso]').forEach(function (h) { h.innerHTML = markup; });
})();
