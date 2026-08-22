/* ============================================================
   NEXOVIA — Signal-path workflow diagram
   Resolution-independent SVG (viewBox 1920x720) injected into
   any element carrying [data-flow]. Stays sharp at 4K/5K.

   Camera → Ethernet/PoE → Switch → Nexovia Hive → Stream → Analytics
   ============================================================ */
(function () {
  'use strict';

  var A = 'var(--nx-accent)';
  var BD = 'var(--nx-border-lit)';
  var SF = 'var(--surface)';
  var T3 = 'var(--text-3)';
  var DG = 'var(--danger)';
  var WN = 'var(--warn)';
  var CY = 'var(--cyan)';

  /* ---------- one camera unit ---------- */
  function camera(y, id, delay) {
    return '' +
    '<g class="node-in" style="--d:' + delay + 's">' +
      '<rect x="40" y="' + y + '" width="126" height="68" rx="6" fill="' + SF + '" stroke="' + BD + '" stroke-width="1.5"/>' +
      '<circle cx="118" cy="' + (y + 34) + '" r="17" fill="none" stroke="' + T3 + '" stroke-width="1.6"/>' +
      '<circle cx="118" cy="' + (y + 34) + '" r="7.5" fill="' + T3 + '" opacity="0.75"/>' +
      '<circle cx="118" cy="' + (y + 34) + '" r="3" fill="#000"/>' +
      '<circle cx="58" cy="' + (y + 14) + '" r="3.5" fill="' + A + '" class="blink-slow"/>' +
      '<text x="70" y="' + (y + 19) + '" font-family="var(--mono)" font-size="12" fill="' + A + '" letter-spacing="1.4">' + id + '</text>' +
      '<text x="56" y="' + (y + 50) + '" font-family="var(--mono)" font-size="11" fill="' + T3 + '" letter-spacing="1">RTSP</text>' +
      /* wall mount */
      '<path d="M40 ' + (y + 24) + ' h-14 v20 h14" fill="none" stroke="' + BD + '" stroke-width="1.5"/>' +
    '</g>';
  }

  /* ---------- a video-wall tile with a live detection box ---------- */
  function tile(x, y, label, conf, color, kind) {
    var w = 139, h = 145;
    var scene = '';

    if (kind === 'aisle') {
      scene =
        '<rect x="' + (x + 8) + '" y="' + (y + 34) + '" width="30" height="103" fill="#161c26"/>' +
        '<rect x="' + (x + 101) + '" y="' + (y + 34) + '" width="30" height="103" fill="#161c26"/>' +
        '<rect x="' + (x + 8) + '" y="' + (y + 56) + '" width="30" height="3" fill="#222b38"/>' +
        '<rect x="' + (x + 101) + '" y="' + (y + 56) + '" width="30" height="3" fill="#222b38"/>' +
        '<rect x="' + (x + 8) + '" y="' + (y + 92) + '" width="30" height="3" fill="#222b38"/>' +
        '<rect x="' + (x + 101) + '" y="' + (y + 92) + '" width="30" height="3" fill="#222b38"/>';
    } else if (kind === 'room') {
      scene =
        '<rect x="' + (x + 6) + '" y="' + (y + 96) + '" width="127" height="41" fill="#141a23"/>' +
        '<rect x="' + (x + 22) + '" y="' + (y + 40) + '" width="34" height="24" fill="#1b222d"/>' +
        '<rect x="' + (x + 88) + '" y="' + (y + 44) + '" width="26" height="18" fill="#1b222d"/>';
    } else if (kind === 'lot') {
      scene =
        '<rect x="' + (x + 6) + '" y="' + (y + 104) + '" width="127" height="33" fill="#131922"/>' +
        '<path d="M' + (x + 20) + ' ' + (y + 137) + ' L' + (x + 44) + ' ' + (y + 104) + '" stroke="#232c39" stroke-width="2"/>' +
        '<path d="M' + (x + 68) + ' ' + (y + 137) + ' L' + (x + 84) + ' ' + (y + 104) + '" stroke="#232c39" stroke-width="2"/>';
    } else {
      scene =
        '<rect x="' + (x + 6) + '" y="' + (y + 88) + '" width="127" height="49" fill="#141a23"/>' +
        '<circle cx="' + (x + 104) + '" cy="' + (y + 46) + '" r="14" fill="#1b222d"/>';
    }

    /* detection rectangle geometry per tile */
    var bx = x + 40, by = y + 52, bw = 52, bh = 74;
    var chipW = (label.length + conf.length + 1) * 6.4 + 10;

    return '' +
    '<g class="node-in" style="--d:0.85s">' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#0a0e14" stroke="' + BD + '" stroke-width="1.2"/>' +
      scene +
      /* detection box */
      '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" fill="none" stroke="' + color + '" stroke-width="2"/>' +
      '<rect x="' + bx + '" y="' + (by - 15) + '" width="' + chipW + '" height="15" fill="' + color + '"/>' +
      '<text x="' + (bx + 5) + '" y="' + (by - 4) + '" font-family="var(--mono)" font-size="10.5" fill="#03080c" letter-spacing="0.3">' + label + ' ' + conf + '</text>' +
      /* live dot */
      '<circle cx="' + (x + 12) + '" cy="' + (y + 13) + '" r="3.2" fill="' + DG + '" class="blink"/>' +
      '<text x="' + (x + 21) + '" y="' + (y + 17) + '" font-family="var(--mono)" font-size="9.5" fill="rgba(255,255,255,0.6)" letter-spacing="1">LIVE</text>' +
    '</g>';
  }

  /* ---------- alert row inside the console ---------- */
  function alertRow(y, time, text, color, delay) {
    return '' +
    '<g class="node-in" style="--d:' + delay + 's">' +
      '<rect x="1580" y="' + y + '" width="280" height="38" fill="#0c1118" stroke="' + BD + '" stroke-width="1"/>' +
      '<rect x="1580" y="' + y + '" width="3" height="38" fill="' + color + '"/>' +
      '<circle cx="1598" cy="' + (y + 19) + '" r="4" fill="' + color + '"/>' +
      '<text x="1611" y="' + (y + 16) + '" font-family="var(--mono)" font-size="12" fill="#e3e8f0">' + text + '</text>' +
      '<text x="1611" y="' + (y + 30) + '" font-family="var(--mono)" font-size="10.5" fill="' + T3 + '" letter-spacing="0.6">' + time + '</text>' +
    '</g>';
  }

  /* ---------- latency budget segment ---------- */
  function seg(x, w, ms, name, fill) {
    return '' +
    '<g>' +
      '<rect x="' + x + '" y="616" width="' + (w - 3) + '" height="34" fill="' + fill + '" opacity="0.16"/>' +
      '<rect x="' + x + '" y="616" width="3" height="34" fill="' + fill + '"/>' +
      '<text x="' + (x + 12) + '" y="639" font-family="var(--mono)" font-size="13" fill="' + fill + '" letter-spacing="0.8">' + ms + '</text>' +
      '<text x="' + (x + 12) + '" y="672" font-family="var(--mono)" font-size="11.5" fill="' + T3 + '" letter-spacing="2">' + name + '</text>' +
    '</g>';
  }


  /* ---------- stage group ----------
     Opens one of the five clickable regions. Two things ride along:

     The hit rect. An SVG <g> only receives pointer events where something is
     actually painted, so without this you would have to hit a 1.5px camera
     outline to select a stage. fill-opacity 0 still takes clicks — fill="none"
     does not — so the rect is invisible and the whole column is a target.

     The marker label. "03 · EDGE INFERENCE" and its siblings used to sit in
     one shared group outside the five, so they neither dimmed with their
     stage nor answered a click on the words themselves. */
  function fxOpen(n, label, hitX, hitW, labelX) {
    return '<g class="fx" data-fx="' + n + '">' +
      '<rect class="fx-hit" x="' + hitX + '" y="8" width="' + hitW + '" height="575" fill="#000" fill-opacity="0"/>' +
      '<text class="fx-label" x="' + labelX + '" y="30" font-family="var(--mono)" font-size="13" letter-spacing="3" fill="' + T3 + '">' + label + '</text>' +
      '<rect class="fx-rule" x="' + labelX + '" y="38" width="' + (label.length * 8.1) + '" height="1.5" fill="var(--nx-accent)"/>';
  }
  var svg = '' +
'<svg class="flow-svg" viewBox="0 0 1920 692" xmlns="http://www.w3.org/2000/svg" role="img" ' +
'aria-label="Nexovia signal path: IP cameras connect over Cat6 Ethernet and PoE into a network switch, then a single Ethernet run carries every stream into the Nexovia Hive, where feeds are decoded, run through GPU inference and an event engine on-device, then pushed over an encrypted tunnel to the live stream wall and the analytics console. End-to-end latency stays under 50 milliseconds.">' +

  '<defs>' +
    '<linearGradient id="hiveFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#101822"/>' +
      '<stop offset="100%" stop-color="#080c11"/>' +
    '</linearGradient>' +
    '<linearGradient id="cableCore" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="' + A + '" stop-opacity="0.25"/>' +
      '<stop offset="100%" stop-color="' + A + '" stop-opacity="0.7"/>' +
    '</linearGradient>' +
    '<filter id="hiveGlow" x="-30%" y="-30%" width="160%" height="160%">' +
      '<feGaussianBlur stdDeviation="14" result="b"/>' +
      '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
    '</filter>' +
    '<clipPath id="scanClip"><rect x="690" y="272" width="370" height="76"/></clipPath>' +
  '</defs>' +

  /* ================= stage markers ================= */

  /* ================= 01 cameras ================= */
  fxOpen(1, '01 · CAPTURE', 8, 182, 40) +
  camera(70,  'CAM_01', 0) +
  camera(180, 'CAM_02', 0.08) +
  camera(290, 'CAM_03', 0.16) +
  camera(400, 'CAM_04', 0.24) +
  '<text x="103" y="530" font-family="var(--mono)" font-size="13" fill="' + T3 + '" text-anchor="middle" letter-spacing="1.6">ANY IP CAMERA</text>' +
  '<text x="103" y="550" font-family="var(--mono)" font-size="11" fill="var(--text-4)" text-anchor="middle" letter-spacing="1.4">KEEP WHAT YOU OWN</text>' +

  '</g>' +

  /* ================= 02 Cat6 runs into the switch ================= */
  fxOpen(2, '02 · TRANSPORT', 190, 465, 222) +
  '<g fill="none" stroke-linecap="round">' +
    /* dark jacket */
    '<path d="M166 104 C 286 104, 300 290, 410 290" stroke="#131922" stroke-width="9"/>' +
    '<path d="M166 214 C 300 214, 320 290, 410 290" stroke="#131922" stroke-width="9"/>' +
    '<path d="M166 324 C 300 324, 320 290, 410 290" stroke="#131922" stroke-width="9"/>' +
    '<path d="M166 434 C 286 434, 300 290, 410 290" stroke="#131922" stroke-width="9"/>' +
    /* live core */
    '<path d="M166 104 C 286 104, 300 290, 410 290" stroke="url(#cableCore)" stroke-width="2" class="dash-flow"/>' +
    '<path d="M166 214 C 300 214, 320 290, 410 290" stroke="url(#cableCore)" stroke-width="2" class="dash-flow"/>' +
    '<path d="M166 324 C 300 324, 320 290, 410 290" stroke="url(#cableCore)" stroke-width="2" class="dash-flow"/>' +
    '<path d="M166 434 C 286 434, 300 290, 410 290" stroke="url(#cableCore)" stroke-width="2" class="dash-flow"/>' +
  '</g>' +

  /* packets riding the cables */
  '<g>' +
    '<circle r="4" fill="' + A + '"><animateMotion dur="2.1s" repeatCount="indefinite" path="M166 104 C 286 104, 300 290, 410 290"/></circle>' +
    '<circle r="4" fill="' + A + '"><animateMotion dur="2.4s" begin="0.4s" repeatCount="indefinite" path="M166 214 C 300 214, 320 290, 410 290"/></circle>' +
    '<circle r="4" fill="' + A + '"><animateMotion dur="2.2s" begin="0.8s" repeatCount="indefinite" path="M166 324 C 300 324, 320 290, 410 290"/></circle>' +
    '<circle r="4" fill="' + A + '"><animateMotion dur="2.6s" begin="1.2s" repeatCount="indefinite" path="M166 434 C 286 434, 300 290, 410 290"/></circle>' +
  '</g>' +

  '<text x="266" y="530" font-family="var(--mono)" font-size="13" fill="' + T3 + '" text-anchor="middle" letter-spacing="1.6">CAT5e / CAT6</text>' +
  '<text x="266" y="550" font-family="var(--mono)" font-size="11" fill="var(--text-4)" text-anchor="middle" letter-spacing="1.4">POE · 802.3af/at</text>' +

  /* ================= PoE switch ================= */
  '<g class="node-in" style="--d:0.35s">' +
    '<rect x="410" y="250" width="130" height="80" rx="5" fill="' + SF + '" stroke="' + BD + '" stroke-width="1.5"/>' +
    '<rect x="424" y="296" width="12" height="18" rx="2" fill="#2a3542"/>' +
    '<rect x="440" y="296" width="12" height="18" rx="2" fill="#2a3542"/>' +
    '<rect x="456" y="296" width="12" height="18" rx="2" fill="#2a3542"/>' +
    '<rect x="472" y="296" width="12" height="18" rx="2" fill="' + A + '" opacity="0.55"/>' +
    '<rect x="488" y="296" width="12" height="18" rx="2" fill="' + A + '" opacity="0.55"/>' +
    '<rect x="504" y="296" width="12" height="18" rx="2" fill="#2a3542"/>' +
    '<circle cx="424" cy="268" r="3.5" fill="' + A + '" class="blink"/>' +
    '<circle cx="438" cy="268" r="3.5" fill="' + A + '" opacity="0.35"/>' +
    '<text x="452" y="272" font-family="var(--mono)" font-size="11" fill="' + T3 + '" letter-spacing="1.4">PoE 48V</text>' +
  '</g>' +
  '<text x="475" y="360" font-family="var(--mono)" font-size="13" fill="' + T3 + '" text-anchor="middle" letter-spacing="1.6">NETWORK SWITCH</text>' +

  /* ================= the single Ethernet run into the Hive ================= */
  '<g fill="none" stroke-linecap="round">' +
    '<path d="M540 290 H 618" stroke="#0f1620" stroke-width="20"/>' +
    '<path d="M540 290 H 618" stroke="#1b2430" stroke-width="14"/>' +
    '<path d="M540 290 H 618" stroke="' + A + '" stroke-width="3" opacity="0.55" class="dash-flow"/>' +
  '</g>' +

  /* RJ45 plug seated into the Hive */
  '<g class="node-in" style="--d:0.5s">' +
    '<path d="M614 272 h30 v36 h-30 v-8 h-6 v-20 h6 z" fill="#1b2430" stroke="' + A + '" stroke-width="1.4" opacity="0.9"/>' +
    '<g stroke="' + A + '" stroke-width="1.2" opacity="0.75">' +
      '<path d="M620 275 v8"/><path d="M623.5 275 v8"/><path d="M627 275 v8"/><path d="M630.5 275 v8"/>' +
      '<path d="M634 275 v8"/><path d="M637.5 275 v8"/><path d="M641 275 v8"/>' +
    '</g>' +
    '<circle r="4.5" fill="' + A + '"><animateMotion dur="1.3s" repeatCount="indefinite" path="M540 290 H 660"/></circle>' +
    '<circle r="4.5" fill="' + A + '"><animateMotion dur="1.3s" begin="0.45s" repeatCount="indefinite" path="M540 290 H 660"/></circle>' +
  '</g>' +
  '<text x="590" y="360" font-family="var(--mono)" font-size="12" fill="' + A + '" text-anchor="middle" letter-spacing="1.4">RJ45</text>' +
  '<text x="590" y="378" font-family="var(--mono)" font-size="10.5" fill="var(--text-4)" text-anchor="middle" letter-spacing="1.2">ONE UPLINK</text>' +

  '</g>' +

  /* ================= 03 THE NEXOVIA HIVE ================= */
  fxOpen(3, '03 · EDGE INFERENCE', 655, 440, 660) +
  '<g class="node-in" style="--d:0.6s">' +
    '<rect x="660" y="90" width="430" height="420" rx="10" fill="url(#hiveFill)" stroke="' + A + '" stroke-width="2" filter="url(#hiveGlow)" opacity="0.98"/>' +
    '<rect x="660" y="90" width="430" height="420" rx="10" fill="none" stroke="' + A + '" stroke-width="1" class="pulse-ring"/>' +

    /* chassis header */
    '<path d="M660 140 H1090" stroke="' + BD + '" stroke-width="1.2"/>' +
    '<text x="690" y="122" font-family="var(--mono)" font-size="15" fill="' + A + '" letter-spacing="4">◆ NEXOVIA HIVE</text>' +
    '<circle cx="1030" cy="116" r="4" fill="' + A + '" class="blink"/>' +
    '<circle cx="1046" cy="116" r="4" fill="' + A + '" opacity="0.45"/>' +
    '<circle cx="1062" cy="116" r="4" fill="' + WN + '" opacity="0.5"/>' +

    /* --- block 1 : decode --- */
    '<rect x="690" y="170" width="370" height="76" rx="4" fill="#0c1119" stroke="' + BD + '" stroke-width="1.2"/>' +
    '<rect x="690" y="170" width="4" height="76" fill="' + CY + '" opacity="0.8"/>' +
    '<text x="710" y="199" font-family="var(--sans)" font-weight="600" font-size="18" fill="#fff">Stream decode</text>' +
    '<text x="710" y="224" font-family="var(--mono)" font-size="13" fill="' + T3 + '" letter-spacing="0.5">16 × RTSP / ONVIF · H.264 · H.265</text>' +
    '<text x="1040" y="199" font-family="var(--mono)" font-size="13" fill="' + CY + '" text-anchor="end">9ms</text>' +

    /* --- block 2 : inference (with scanning line) --- */
    '<rect x="690" y="272" width="370" height="76" rx="4" fill="#0c1119" stroke="' + A + '" stroke-width="1.4"/>' +
    '<rect x="690" y="272" width="4" height="76" fill="' + A + '"/>' +
    '<g clip-path="url(#scanClip)">' +
      '<rect x="690" y="266" width="370" height="2" fill="' + A + '" opacity="0.7" class="scan-line"/>' +
    '</g>' +
    '<text x="710" y="301" font-family="var(--sans)" font-weight="600" font-size="18" fill="#fff">GPU inference</text>' +
    '<text x="710" y="326" font-family="var(--mono)" font-size="13" fill="' + T3 + '" letter-spacing="0.5">detect · pose · track · re-identify</text>' +
    '<text x="1040" y="301" font-family="var(--mono)" font-size="13" fill="' + A + '" text-anchor="end">23ms</text>' +

    /* --- block 3 : event engine --- */
    '<rect x="690" y="374" width="370" height="76" rx="4" fill="#0c1119" stroke="' + BD + '" stroke-width="1.2"/>' +
    '<rect x="690" y="374" width="4" height="76" fill="' + WN + '" opacity="0.85"/>' +
    '<text x="710" y="403" font-family="var(--sans)" font-weight="600" font-size="18" fill="#fff">Event engine</text>' +
    '<text x="710" y="428" font-family="var(--mono)" font-size="13" fill="' + T3 + '" letter-spacing="0.5">zones · rules · dedupe · clip sealing</text>' +
    '<text x="1040" y="403" font-family="var(--mono)" font-size="13" fill="' + WN + '" text-anchor="end">4ms</text>' +

    /* internal arrows */
    '<g stroke="' + A + '" stroke-width="1.6" opacity="0.55" fill="none">' +
      '<path d="M875 246 V266" class="dash-slow"/>' +
      '<path d="M869 262 L875 269 L881 262"/>' +
      '<path d="M875 348 V368" class="dash-slow"/>' +
      '<path d="M869 364 L875 371 L881 364"/>' +
    '</g>' +

    '<text x="875" y="484" font-family="var(--mono)" font-size="12.5" fill="' + A + '" text-anchor="middle" letter-spacing="2.4" opacity="0.8">RUNS ON-DEVICE · NO CLOUD ROUND TRIP</text>' +
  '</g>' +

  '</g>' +

  /* ================= 04 encrypted tunnel + stream wall ================= */
  fxOpen(4, '04 · STREAM', 1095, 450, 1200) +
  '<g fill="none">' +
    '<path d="M1090 290 H1200" stroke="#131922" stroke-width="9" stroke-linecap="round"/>' +
    '<path d="M1090 290 H1200" stroke="' + A + '" stroke-width="2" opacity="0.6" class="dash-flow"/>' +
    '<circle r="4" fill="' + A + '"><animateMotion dur="1.4s" repeatCount="indefinite" path="M1090 290 H1200"/></circle>' +
  '</g>' +
  '<g>' +
    '<rect x="1120" y="222" width="52" height="40" rx="3" fill="' + SF + '" stroke="' + BD + '" stroke-width="1.2"/>' +
    '<path d="M1134 222 v-8 a12 12 0 0 1 24 0 v8" fill="none" stroke="' + A + '" stroke-width="1.8"/>' +
    '<circle cx="1146" cy="240" r="4" fill="' + A + '"/>' +
    '<path d="M1146 244 v7" stroke="' + A + '" stroke-width="1.8"/>' +
  '</g>' +
  '<text x="1145" y="360" font-family="var(--mono)" font-size="12.5" fill="' + T3 + '" text-anchor="middle" letter-spacing="1.4">TLS TUNNEL</text>' +
  '<text x="1145" y="378" font-family="var(--mono)" font-size="10.5" fill="var(--text-4)" text-anchor="middle" letter-spacing="1.2">NO OPEN PORTS</text>' +

  /* ================= 04 live stream wall ================= */
  tile(1200, 150, 'PERSON', '0.94', A,  'aisle') +
  tile(1351, 150, 'THEFT',  '0.94', DG, 'aisle') +
  tile(1200, 305, 'FALL',   '0.92', WN, 'room')  +
  tile(1351, 305, 'VEHICLE','0.88', CY, 'lot')   +
  '<text x="1345" y="490" font-family="var(--mono)" font-size="13" fill="' + T3 + '" text-anchor="middle" letter-spacing="1.6">LIVE STREAM + AI OVERLAY</text>' +
  '<text x="1345" y="510" font-family="var(--mono)" font-size="11" fill="var(--text-4)" text-anchor="middle" letter-spacing="1.4">PHONE · DESKTOP · CONTROL ROOM</text>' +

  /* link stream → analytics */
  '<g fill="none">' +
    '<path d="M1490 300 H1560" stroke="#131922" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M1490 300 H1560" stroke="' + A + '" stroke-width="1.8" opacity="0.55" class="dash-flow"/>' +
    '<circle r="3.6" fill="' + A + '"><animateMotion dur="1.1s" repeatCount="indefinite" path="M1490 300 H1560"/></circle>' +
  '</g>' +

  '</g>' +

  /* ================= 05 analytics console ================= */
  fxOpen(5, '05 · ANALYTICS', 1545, 375, 1560) +
  '<g class="node-in" style="--d:0.95s">' +
    '<rect x="1560" y="110" width="320" height="390" rx="8" fill="url(#hiveFill)" stroke="' + BD + '" stroke-width="1.5"/>' +
    '<path d="M1560 152 H1880" stroke="' + BD + '" stroke-width="1.2"/>' +
    '<circle cx="1580" cy="131" r="4" fill="' + A + '" class="blink"/>' +
    '<text x="1594" y="136" font-family="var(--mono)" font-size="13" fill="#fff" letter-spacing="2.4">NEXOVIA CONSOLE</text>' +
    '<text x="1862" y="136" font-family="var(--mono)" font-size="11" fill="' + A + '" text-anchor="end" letter-spacing="1">LIVE</text>' +
  '</g>' +

  alertRow(172, 'AISLE_3 · 16:04:14 · clip sealed', 'Theft — concealment', DG, 1.02) +
  alertRow(218, 'ROOM_01 · 00:46:31 · EMS prompt',  'Fall detected',       WN, 1.08) +
  alertRow(264, 'LOT_N · 02:11:07 · plate logged',  'After-hours vehicle', CY, 1.14) +

  /* chart */
  '<g class="node-in" style="--d:1.2s">' +
    '<text x="1580" y="332" font-family="var(--mono)" font-size="11" fill="' + T3 + '" letter-spacing="2.2">EVENTS · LAST 7 DAYS</text>' +
    '<g fill="' + A + '" opacity="0.75">' +
      '<rect x="1580" y="392" width="24" height="46" class="bar-grow" style="animation-delay:0s"/>' +
      '<rect x="1612" y="376" width="24" height="62" class="bar-grow" style="animation-delay:0.2s"/>' +
      '<rect x="1644" y="404" width="24" height="34" class="bar-grow" style="animation-delay:0.4s"/>' +
      '<rect x="1676" y="358" width="24" height="80" class="bar-grow" style="animation-delay:0.6s"/>' +
      '<rect x="1708" y="386" width="24" height="52" class="bar-grow" style="animation-delay:0.8s"/>' +
      '<rect x="1740" y="348" width="24" height="90" class="bar-grow" style="animation-delay:1s"/>' +
    '</g>' +
    '<rect x="1772" y="366" width="24" height="72" fill="' + DG + '" opacity="0.8" class="bar-grow" style="animation-delay:1.2s"/>' +
    '<path d="M1580 438 H1860" stroke="' + BD + '" stroke-width="1"/>' +
    '<text x="1816" y="382" font-family="var(--serif)" font-size="30" fill="#fff">98%</text>' +
    '<text x="1816" y="400" font-family="var(--mono)" font-size="10" fill="' + T3 + '" letter-spacing="1.2">REVIEWED</text>' +
    '<text x="1580" y="468" font-family="var(--mono)" font-size="11.5" fill="' + T3 + '" letter-spacing="1.2">Search: “red hoodie, aisle 3, after 4pm”</text>' +
    '<rect x="1576" y="454" width="2" height="18" fill="' + A + '" class="blink"/>' +
  '</g>' +

  '</g>' +

  /* ================= latency budget strip ================= */
  '<text x="40" y="590" font-family="var(--mono)" font-size="12.5" fill="' + T3 + '" letter-spacing="3">END-TO-END LATENCY BUDGET</text>' +
  '<text x="1880" y="590" font-family="var(--mono)" font-size="12.5" fill="' + A + '" text-anchor="end" letter-spacing="3">UNDER 50 MS · CAMERA TO ALERT</text>' +
  seg(40,   221, '6ms',  'INGEST',    CY) +
  seg(261,  331, '9ms',  'DECODE',    CY) +
  seg(592,  846, '23ms', 'INFERENCE', A)  +
  seg(1438, 147, '4ms',  'EVENT',     WN) +
  seg(1585, 295, '8ms',  'PUSH',      A)  +

'</svg>';

  document.querySelectorAll('[data-flow]').forEach(function (host) {
    host.innerHTML = svg;
  });
})();
