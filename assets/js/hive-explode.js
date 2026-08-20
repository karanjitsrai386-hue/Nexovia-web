/* ============================================================
   NEXOVIA — Hive exploded view
   Scroll-scrubbed isometric teardown of the Hive enclosure.

   Geometry is a true isometric projection at K px/mm, built from
   the AI module and carrier board's real dimensions — carrier board
   100 x 79 mm, SO-DIMM module 69.6 x 45 mm — so the layers sit in
   correct proportion to one another rather than as uniform tiles.

   Injected into [data-hive-explode]; every layer derives its
   travel from a single --p (0 -> 1) set on the enclosing .scrub.
   ============================================================ */
(function () {
  'use strict';

  var A  = 'var(--nx-accent)';
  var BD = 'var(--nx-border-lit)';
  var T3 = 'var(--text-3)';
  var T4 = 'var(--text-4)';

  var CX = 545;      /* stack centreline */
  var K  = 3.4;      /* px per mm */

  /* corners of an a x b mm rectangle, relative to its own centroid.
     order: top, right, bottom, left (clockwise on screen) */
  function box(a, b) {
    return [
      [-(a - b) * K / 2, -(a + b) * K / 4],
      [ (a + b) * K / 2,  (a - b) * K / 4],
      [ (a - b) * K / 2,  (a + b) * K / 4],
      [-(a + b) * K / 2, -(a - b) * K / 4]
    ];
  }

  /* a point at (u,v) mm inside that rectangle, relative to centroid */
  function pt(a, b, u, v) {
    return [(u - v) * K - (a - b) * K / 2, (u + v) * K / 2 - (a + b) * K / 4];
  }

  /* rounded 4-gon path */
  function plate(y, a, b, f) {
    var p = box(a, b), d = '', i;
    f = f || 0.1;
    var mix = function (P, Q) { return [P[0] + f * (Q[0] - P[0]), P[1] + f * (Q[1] - P[1])]; };
    var abs = function (P) { return (CX + P[0]) + ' ' + (y + P[1]); };
    d = 'M' + abs(mix(p[3], p[0]));
    for (i = 0; i < 4; i++) {
      var P = p[i], Pp = p[(i + 3) % 4], Pn = p[(i + 1) % 4];
      d += 'L' + abs(mix(P, Pp)) + 'Q' + abs(P) + ' ' + abs(mix(P, Pn));
    }
    return d + 'Z';
  }

  /* the two front-facing side walls (edges left->bottom and bottom->right) */
  function walls(y, a, b, t, fl, fr) {
    var p = box(a, b);
    var X = function (P, dy) { return (CX + P[0]) + ' ' + (y + P[1] + (dy || 0)); };
    return '<path d="M' + X(p[3]) + 'L' + X(p[2]) + 'L' + X(p[2], t) + 'L' + X(p[3], t) + 'Z" fill="' + fl + '"/>' +
           '<path d="M' + X(p[2]) + 'L' + X(p[1]) + 'L' + X(p[1], t) + 'L' + X(p[2], t) + 'Z" fill="' + fr + '"/>';
  }

  /* a circle of radius r mm lands as a 2:1 ellipse */
  function disc(y, a, b, u, v, r, fill, stroke, sw) {
    var c = pt(a, b, u, v), rx = r * K * 1.414;
    return '<ellipse cx="' + (CX + c[0]) + '" cy="' + (y + c[1]) + '" rx="' + rx.toFixed(1) +
           '" ry="' + (rx / 2).toFixed(1) + '" fill="' + fill + '"' +
           (stroke ? ' stroke="' + stroke + '" stroke-width="' + (sw || 1.2) + '"' : '') + '/>';
  }

  /* an SMD part: small filled quad spanning u0..u1, v0..v1 mm */
  function part(y, a, b, u0, v0, u1, v1, fill, stroke) {
    var P = [pt(a, b, u0, v0), pt(a, b, u1, v0), pt(a, b, u1, v1), pt(a, b, u0, v1)];
    var d = 'M' + P.map(function (q) { return (CX + q[0]) + ' ' + (y + q[1]); }).join('L') + 'Z';
    return '<path d="' + d + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1"' : '') + '/>';
  }

  /* a connector body standing proud of the board edge */
  function conn(y, a, b, u0, v0, u1, v1, h, top, face) {
    var P0 = pt(a, b, u0, v0), P1 = pt(a, b, u1, v0), P2 = pt(a, b, u1, v1), P3 = pt(a, b, u0, v1);
    var q = function (p, dy) { return (CX + p[0]) + ' ' + (y + p[1] - (dy || 0)); };
    return '<path d="M' + q(P0, h) + 'L' + q(P1, h) + 'L' + q(P2, h) + 'L' + q(P3, h) + 'Z" fill="' + top + '"/>' +
           '<path d="M' + q(P3, h) + 'L' + q(P2, h) + 'L' + q(P2) + 'L' + q(P3) + 'Z" fill="' + face + '"/>' +
           '<path d="M' + q(P2, h) + 'L' + q(P1, h) + 'L' + q(P1) + 'L' + q(P2) + 'Z" fill="' + face + '" opacity="0.7"/>';
  }

  function label(y, n, title, sub) {
    return '<g class="xl-label">' +
      '<path d="M925 ' + y + 'H1020" stroke="' + A + '" stroke-width="1.2" opacity="0.45"/>' +
      '<circle cx="925" cy="' + y + '" r="4" fill="none" stroke="' + A + '" stroke-width="1.5"/>' +
      '<text x="1038" y="' + (y - 9) + '" font-family="var(--mono)" font-size="14" fill="' + A + '" letter-spacing="3">' + n + '</text>' +
      '<text x="1038" y="' + (y + 16) + '" font-family="var(--sans)" font-weight="600" font-size="24" fill="#fff">' + title + '</text>' +
      '<text x="1038" y="' + (y + 40) + '" font-family="var(--mono)" font-size="13.5" fill="' + T3 + '" letter-spacing="1.3">' + sub + '</text>' +
    '</g>';
  }

  var Y = [675, 693, 711, 729, 747, 765];

  /* ---- component footprints (mm) ---- */
  var SHELL = [104, 100], FAN = [40, 40], SINK = [68, 46], MOD = [69.6, 45], CARR = [100, 79];

  /* fan blades — sickle profile, 11 up, matching the dev-kit blower */
  function fanBlades(y) {
    var c = pt(FAN[0], FAN[1], 20, 20), out = '';
    var P = function (r, t) {
      return (CX + c[0] + r * K * 1.414 * Math.cos(t)).toFixed(1) + ' ' +
             (y + c[1] + r * K * 0.707 * Math.sin(t)).toFixed(1);
    };
    for (var i = 0; i < 11; i++) {
      var a0 = i * 2 * Math.PI / 11;
      out += '<path d="M' + P(5.5, a0) + 'Q' + P(11, a0 + 0.42) + ' ' + P(16.2, a0 + 0.86) +
             '" fill="none" stroke="#525d6d" stroke-width="8" stroke-linecap="round"/>';
    }
    return out;
  }

  /* heatsink fin field */
  function fins(y) {
    var out = '', a = SINK[0], b = SINK[1];
    for (var v = 4; v <= 42; v += 3.6) {
      var s = pt(a, b, 3, v), e = pt(a, b, 65, v);
      out += '<path d="M' + (CX + s[0]).toFixed(1) + ' ' + (y + s[1]).toFixed(1) +
             'L' + (CX + e[0]).toFixed(1) + ' ' + (y + e[1]).toFixed(1) + '" stroke="#05080b" stroke-width="3.4"/>';
    }
    return out;
  }

  var svg = '' +
'<svg class="xl-svg" viewBox="0 0 1500 1360" xmlns="http://www.w3.org/2000/svg" role="img" ' +
'aria-label="Exploded isometric view of the Nexovia Hive: black top shell with a square fan window, a blower, a finned heatsink, the AI analytics module on its SO-DIMM card with SoC and LPDDR5 packages, the carrier board carrying the SO-DIMM socket, CAM0 and CAM1 connectors, a 40-pin header, M.2 slot and the DC, HDMI, dual USB-A and gigabit Ethernet port bank, and the base tray.">' +

  '<defs>' +
    '<linearGradient id="xlShell" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#232a33"/><stop offset="46%" stop-color="#101419"/><stop offset="100%" stop-color="#070a0d"/></linearGradient>' +
    '<linearGradient id="xlPcb" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#16281e"/><stop offset="100%" stop-color="#08110c"/></linearGradient>' +
    '<linearGradient id="xlMod" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#1b2230"/><stop offset="100%" stop-color="#0a0e15"/></linearGradient>' +
    '<linearGradient id="xlSink" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#2a323d"/><stop offset="100%" stop-color="#0e1217"/></linearGradient>' +
    '<radialGradient id="xlDie"><stop offset="0%" stop-color="' + A + '" stop-opacity="0.55"/>' +
      '<stop offset="100%" stop-color="' + A + '" stop-opacity="0"/></radialGradient>' +
    '<filter id="xlBlur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="18"/></filter>' +
    '<mask id="lidWindow">' +
      '<rect x="0" y="0" width="1500" height="1360" fill="#fff"/>' +
      '<path d="' + plate(Y[0], 46, 46, 0.14) + '" fill="#000"/>' +
    '</mask>' +
  '</defs>' +

  '<ellipse cx="' + CX + '" cy="906" rx="330" ry="58" fill="#000" opacity="0.55" filter="url(#xlBlur)"/>' +

  /* ═══ 06 · BASE TRAY ═══ */
  '<g class="xl xl-6">' +
    walls(Y[5], SHELL[0], SHELL[1], 30, '#080b0f', '#040608') +
    '<path d="' + plate(Y[5], SHELL[0], SHELL[1], 0.11) + '" fill="url(#xlShell)" stroke="' + BD + '" stroke-width="1.6"/>' +
    '<path d="' + plate(Y[5], 92, 88, 0.11) + '" fill="none" stroke="' + BD + '" stroke-width="1" opacity="0.4"/>' +
    /* board standoffs */
    disc(Y[5], SHELL[0], SHELL[1], 16, 14, 2.6, '#05080b', '#333b46') +
    disc(Y[5], SHELL[0], SHELL[1], 88, 14, 2.6, '#05080b', '#333b46') +
    disc(Y[5], SHELL[0], SHELL[1], 16, 86, 2.6, '#05080b', '#333b46') +
    disc(Y[5], SHELL[0], SHELL[1], 88, 86, 2.6, '#05080b', '#333b46') +
    label(Y[5], '06', 'Base tray', 'BLACK SHELL · WALL / DIN MOUNT') +
  '</g>' +

  /* ═══ 05 · CARRIER BOARD ═══ */
  '<g class="xl xl-5">' +
    walls(Y[4], CARR[0], CARR[1], 8, '#08120c', '#050b07') +
    '<path d="' + plate(Y[4], CARR[0], CARR[1], 0.045) + '" fill="url(#xlPcb)" stroke="#22482f" stroke-width="1.5"/>' +
    /* corner mounting holes */
    disc(Y[4], CARR[0], CARR[1], 5, 5, 1.7, '#04080 6'.replace(' ', ''), '#3f6b4e') +
    disc(Y[4], CARR[0], CARR[1], 95, 5, 1.7, '#040806', '#3f6b4e') +
    disc(Y[4], CARR[0], CARR[1], 5, 74, 1.7, '#040806', '#3f6b4e') +
    disc(Y[4], CARR[0], CARR[1], 95, 74, 1.7, '#040806', '#3f6b4e') +
    /* SO-DIMM socket the module drops into */
    part(Y[4], CARR[0], CARR[1], 14, 34, 86, 40, '#0d141b', '#4a5563') +
    part(Y[4], CARR[0], CARR[1], 14, 40, 86, 41.6, '#c8a24a') +
    /* CAM0 / CAM1 FPC connectors */
    part(Y[4], CARR[0], CARR[1], 4, 12, 8, 30, '#d3d9e0', '#8e969f') +
    part(Y[4], CARR[0], CARR[1], 4, 34, 8, 52, '#d3d9e0', '#8e969f') +
    /* 40-pin header, colour-coded jumpers */
    (function () {
      var c = ['#3fae5a', '#3fae5a', '#e0c341', '#e0c341', '#d24b3f', '#d24b3f', '#3f7fd2', '#3f7fd2', '#9a56c4', '#9a56c4'], o = '';
      for (var i = 0; i < 10; i++) o += part(Y[4], CARR[0], CARR[1], 90, 12 + i * 4.4, 96, 15 + i * 4.4, c[i], '');
      return o;
    })() +
    /* M.2 Key M slot */
    part(Y[4], CARR[0], CARR[1], 30, 60, 78, 66, '#0c1218', '#3c6ea0') +
    /* component field */
    part(Y[4], CARR[0], CARR[1], 20, 48, 30, 55, '#182a20', '') +
    part(Y[4], CARR[0], CARR[1], 34, 48, 42, 54, '#182a20', '') +
    part(Y[4], CARR[0], CARR[1], 62, 46, 72, 53, '#182a20', '') +
    part(Y[4], CARR[0], CARR[1], 22, 22, 34, 28, '#182a20', '') +
    part(Y[4], CARR[0], CARR[1], 48, 20, 58, 26, '#182a20', '') +
    /* port bank along the front edge */
    conn(Y[4], CARR[0], CARR[1], 12, 70, 24, 79, 13, '#0d0f12', '#191c21') +
    disc(Y[4], CARR[0], CARR[1], 18, 79, 3.2, '#000', '#4a525d') +
    conn(Y[4], CARR[0], CARR[1], 30, 70, 45, 79, 12, '#c07a35', '#8a561f') +
    conn(Y[4], CARR[0], CARR[1], 50, 70, 63, 79, 12, '#aab2bb', '#2f6fd0') +
    conn(Y[4], CARR[0], CARR[1], 66, 70, 79, 79, 12, '#aab2bb', '#2f6fd0') +
    conn(Y[4], CARR[0], CARR[1], 83, 68, 97, 79, 14, '#b6bec7', '#767f8a') +
    /* microSD + USB-C on the opposite flank */
    part(Y[4], CARR[0], CARR[1], 56, 4, 68, 8, '#8e969f', '') +
    part(Y[4], CARR[0], CARR[1], 74, 4, 82, 7.5, '#5a636d', '') +
    label(Y[4], '05', 'Carrier board', '100 × 79 mm · GbE · M.2 · 40-PIN') +
  '</g>' +

  /* ═══ 04 · AI ANALYTICS MODULE ═══ */
  '<g class="xl xl-4">' +
    walls(Y[3], MOD[0], MOD[1], 7, '#0b1119', '#070a0f') +
    '<path d="' + plate(Y[3], MOD[0], MOD[1], 0.05) + '" fill="url(#xlMod)" stroke="' + A + '" stroke-width="1.5"/>' +
    '<circle cx="' + CX + '" cy="' + Y[3] + '" r="78" fill="url(#xlDie)"/>' +
    /* SoC package + lid */
    part(Y[3], MOD[0], MOD[1], 22, 12, 48, 33, '#0f1620', '#5d6a7a') +
    part(Y[3], MOD[0], MOD[1], 25, 15, 45, 30, '#1c2532', '#7d8b9c') +
    /* LPDDR5 packages */
    part(Y[3], MOD[0], MOD[1], 8, 12, 19, 22, '#12161d', '#3f4653') +
    part(Y[3], MOD[0], MOD[1], 8, 25, 19, 35, '#12161d', '#3f4653') +
    part(Y[3], MOD[0], MOD[1], 52, 12, 63, 22, '#12161d', '#3f4653') +
    part(Y[3], MOD[0], MOD[1], 52, 25, 63, 35, '#12161d', '#3f4653') +
    /* SO-DIMM gold edge fingers */
    part(Y[3], MOD[0], MOD[1], 10, 41.5, 60, 44, '#c8a24a') +
    label(Y[3], '04', 'AI analytics module', '69.6 × 45 mm SO-DIMM · INTEGRATED GPU') +
  '</g>' +

  /* ═══ 03 · HEATSINK ═══ */
  '<g class="xl xl-3">' +
    walls(Y[2], SINK[0], SINK[1], 22, '#0e1217', '#080b10') +
    '<path d="' + plate(Y[2], SINK[0], SINK[1], 0.06) + '" fill="url(#xlSink)" stroke="' + BD + '" stroke-width="1.5"/>' +
    '<g opacity="0.85">' + fins(Y[2]) + '</g>' +
    /* four spring-loaded mount screws */
    disc(Y[2], SINK[0], SINK[1], 4, 4, 1.9, '#0a0d12', '#59636f') +
    disc(Y[2], SINK[0], SINK[1], 64, 4, 1.9, '#0a0d12', '#59636f') +
    disc(Y[2], SINK[0], SINK[1], 4, 42, 1.9, '#0a0d12', '#59636f') +
    disc(Y[2], SINK[0], SINK[1], 64, 42, 1.9, '#0a0d12', '#59636f') +
    label(Y[2], '03', 'Heatsink', 'DIE-CAST FIN STACK') +
  '</g>' +

  /* ═══ 02 · BLOWER ═══ */
  '<g class="xl xl-2">' +
    walls(Y[1], FAN[0], FAN[1], 10, '#0d1117', '#080b10') +
    '<path d="' + plate(Y[1], FAN[0], FAN[1], 0.13) + '" fill="#161b23" stroke="#4c5666" stroke-width="1.7"/>' +
    disc(Y[1], FAN[0], FAN[1], 20, 20, 17.5, '#191f28', '#5b6675', 1.6) +
    fanBlades(Y[1]) +
    disc(Y[1], FAN[0], FAN[1], 20, 20, 6, '#252d38', '#6c7787', 1.4) +
    disc(Y[1], FAN[0], FAN[1], 20, 20, 1.6, '#828d9c') +
    /* corner fixings */
    disc(Y[1], FAN[0], FAN[1], 3.5, 3.5, 1.6, '#0a0d12', '#5a636f') +
    disc(Y[1], FAN[0], FAN[1], 36.5, 3.5, 1.6, '#0a0d12', '#5a636f') +
    disc(Y[1], FAN[0], FAN[1], 3.5, 36.5, 1.6, '#0a0d12', '#5a636f') +
    disc(Y[1], FAN[0], FAN[1], 36.5, 36.5, 1.6, '#0a0d12', '#5a636f') +
    label(Y[1], '02', 'Blower', 'ACTIVE COOLING · PWM') +
  '</g>' +

  /* ═══ 01 · TOP SHELL ═══ */
  '<g class="xl xl-1">' +
    '<g mask="url(#lidWindow)">' +
      walls(Y[0], SHELL[0], SHELL[1], 24, '#0c0f15', '#06080c') +
      '<path d="' + plate(Y[0], SHELL[0], SHELL[1], 0.11) + '" fill="url(#xlShell)" stroke="' + BD + '" stroke-width="1.8"/>' +
    '</g>' +
    /* window lip */
    '<path d="' + plate(Y[0], 46, 46, 0.14) + '" fill="none" stroke="#454f5d" stroke-width="1.8"/>' +
    '<path d="' + plate(Y[0], 52, 52, 0.14) + '" fill="none" stroke="#2a323d" stroke-width="1.2"/>' +
    /* etched mark */
    '<g opacity="0.92">' +
      '<path d="M' + (CX + 118) + ' ' + (Y[0] - 74) + 'l26 13 l0 23 l-26 -13 z" fill="none" stroke="' + A + '" stroke-width="2.2"/>' +
      '<text x="' + (CX + 160) + '" y="' + (Y[0] - 53) + '" font-family="var(--mono)" font-size="15" fill="#fff" letter-spacing="4.5">NEXOVIA</text>' +
    '</g>' +
    /* lid fixings */
    disc(Y[0], SHELL[0], SHELL[1], 8, 8, 2.2, '#0a0d12', '#4d5765') +
    disc(Y[0], SHELL[0], SHELL[1], 96, 8, 2.2, '#0a0d12', '#4d5765') +
    disc(Y[0], SHELL[0], SHELL[1], 8, 92, 2.2, '#0a0d12', '#4d5765') +
    disc(Y[0], SHELL[0], SHELL[1], 96, 92, 2.2, '#0a0d12', '#4d5765') +
    label(Y[0], '01', 'Top shell', 'FAN WINDOW · SEALED') +
  '</g>' +

  '<g class="xl-closed">' +
    '<text x="' + CX + '" y="1014" text-anchor="middle" font-family="var(--mono)" font-size="15" fill="' + T3 + '" letter-spacing="4">THE NEXOVIA HIVE · SEALED</text>' +
    '<text x="' + CX + '" y="1042" text-anchor="middle" font-family="var(--mono)" font-size="12.5" fill="' + T4 + '" letter-spacing="2.4">SCROLL TO OPEN</text>' +
  '</g>' +

'</svg>';

  /* The six callouts again, as data. The SVG draws them at x=1038 with leader
     lines, which is why the artwork needs 1500 units of width and why the phone
     layout used to scroll sideways through 1040px of it — you landed on empty
     margin and never saw a label. Below 900px these render as an ordinary list
     under a diagram that fits the screen instead. */
  var PARTS = [
    ['01', 'Top shell', 'Fan window · sealed'],
    ['02', 'Blower', 'Active cooling · PWM'],
    ['03', 'Heatsink', 'Die-cast fin stack'],
    ['04', 'AI analytics module', '69.6 × 45 mm SO-DIMM · integrated GPU'],
    ['05', 'Carrier board', '100 × 79 mm · GbE · M.2 · 40-pin'],
    ['06', 'Base tray', 'Black shell · wall / DIN mount']
  ];

  var list = '<ol class="xl-list">' + PARTS.map(function (p) {
    return '<li><b>' + p[0] + '</b><span><strong>' + p[1] + '</strong>' + p[2] + '</span></li>';
  }).join('') + '</ol>';

  /* No early return on an empty host list any more.

     This file does two separable jobs: it injects the teardown SVG, and it
     drives every .scrub rig on the page from scroll. Those were coupled by an
     `if (!hosts.length) return;` here, which was harmless while the teardown was
     the only scrub in the site — and silently wrong the moment Phase 5.2 added
     the pinned signal path to the homepage, which has no [data-hive-explode].
     The rig loop below never ran there: --p stayed unset, no stage ever went
     live, and the section rendered as a tall empty pin with no error to show
     for it.

     An empty NodeList forEach is a no-op, so the injection simply does nothing
     on pages without a host, and the driver runs everywhere. */
  var hosts = document.querySelectorAll('[data-hive-explode], [data-hive-still]');
  hosts.forEach(function (h) { h.innerHTML = svg + list; });

  /* The viewBox has to change with the breakpoint — CSS cannot touch it, and a
     transform would scale the labels back into the frame along with the art.
     Cropping to the left 1000 units drops the label column entirely, so the
     stack itself can fill a phone screen at a readable size. */
  var FULL = '0 0 1500 1360';
  var CROP = '150 0 850 1360';
  function fitViewBox() {
    var small = window.innerWidth <= 900;
    document.querySelectorAll('.xl-svg').forEach(function (s) {
      s.setAttribute('viewBox', small ? CROP : FULL);
    });
  }
  fitViewBox();
  window.addEventListener('resize', fitViewBox);

  var rigs = [].slice.call(document.querySelectorAll('.scrub'));
  if (!rigs.length) return;

  /* Evaluated on every pass, not just at load — the CSS drops the sticky rig
     below 900px, so a resize across that line has to flip the behaviour too. */
  var mqSmall  = window.matchMedia('(max-width: 900px)');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Phase 5.1 / 5.2 — chapters off the same --p ----------

     One function serves both items, because they are the same question asked
     twice: which stage is the scroll currently in.

     A rig opts in with `data-chapters="5"`. The counter element is
     [data-scrub-counter]; the stacking copy blocks are [data-step], in order.

     `flat` matters. Below 900px, under reduced motion, and on any rig too
     short to scrub, --p is pinned at 1 so the diagram renders fully open. A
     counter derived from progress would then read "05 / 05" over a stack the
     reader has not stepped through, and every step would show as spent. So a
     flat rig gets the class instead and the CSS shows the blocks plainly. */
  function paintChapters(rig, p, flat) {
    var n = parseInt(rig.getAttribute('data-chapters') || '0', 10);
    if (!n) return;

    rig.classList.toggle('is-flat', !!flat);

    /* p is 0..1 inclusive; at exactly 1 the floor would land one past the end */
    var i = Math.min(n, Math.floor(p * n) + 1);

    var counter = rig.querySelector('[data-scrub-counter]');
    if (counter && !flat) {
      var pad = function (v) { return v < 10 ? '0' + v : String(v); };
      var txt = '[ ' + pad(i) + ' / ' + pad(n) + ' ]';
      if (counter.textContent !== txt) counter.textContent = txt;
    }

    var steps = rig.querySelectorAll('[data-step]');
    if (!steps.length) return;
    for (var k = 0; k < steps.length; k++) {
      /* live = the stage you are in, spent = stages already passed. Nothing is
         ever removed — the reference stacks copy rather than swapping it. */
      steps[k].classList.toggle('is-live', !flat && k === i - 1);
      steps[k].classList.toggle('is-spent', !flat && k < i - 1);
    }
  }

  var ticking = false;
  function update() {
    ticking = false;
    var alwaysOpen = mqSmall.matches || mqReduce.matches;
    rigs.forEach(function (rig) {
      var p, flat = alwaysOpen;
      if (alwaysOpen) {
        p = 1;
      } else {
        var travel = rig.offsetHeight - window.innerHeight;
        if (travel <= 0) { p = 1; flat = true; }
        else {
          p = (window.scrollY - rig.offsetTop) / travel;
          p = p < 0 ? 0 : p > 1 ? 1 : p;
        }
      }
      rig.style.setProperty('--p', p.toFixed(4));
      paintChapters(rig, p, flat);
    });
  }
  /* ---------- pause the loops while the rig is being scrubbed ----------

     Measured on a 6x-throttled CPU, the homepage signal path dropped 69% of
     its frames during a scrub: 2,085ms of style recalculation and 499ms of
     layout against 259ms of script. It is not the scrubbing that costs — the
     teardown on /hive rewrites --p over 223 descendants the same way and holds
     3-5%. The difference is that the signal path has 31 infinite SVG
     animations (dashmove, blink, bargrow) living inside the very subtree whose
     custom property is being rewritten every frame, so each frame invalidates
     both. Pausing them for the duration of the scrub takes 69% down to 24%.

     140ms of idle before resuming: long enough to cover the gap between wheel
     events in one gesture, short enough that the diagram is moving again
     before anyone has finished looking back at it. */
  var scrubbing = false;
  var idleTimer;
  function setScrubbing(on) {
    if (scrubbing === on) return;
    scrubbing = on;
    rigs.forEach(function (rig) {
      if (on) rig.setAttribute('data-scrubbing', '');
      else rig.removeAttribute('data-scrubbing');
    });
  }

  function onScroll() {
    setScrubbing(true);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { setScrubbing(false); }, 140);
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  if (mqSmall.addEventListener) {
    mqSmall.addEventListener('change', update);
    mqReduce.addEventListener('change', update);
  }
  update();
})();
