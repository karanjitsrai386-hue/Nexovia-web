/* ============================================================
   NEXOVIA — 3D store scene, looping film

   Real-time WebGL playing on a timer, not on scroll. One ~26s
   take that loops, in the shape Coram uses: travel through the
   hardware, out to the room, then land on the incidents.

     00.0  the Hive          04.8  the switch
     08.8  the cable runs    13.6  the whole floor
     17.2  a fall            22.6  a possible theft

   The Hive is modelled to the real case already drawn on the
   site: 104 x 100 mm shell, 40 x 40 mm fan window, and the
   DC / HDMI / USB / RJ45 port bank. Scale is metres, so it is
   genuinely a small box on a counter.

   Cable is drawn on progressively and each camera only powers up
   when its own run lands, so the wiring reads as the cause.

   Mounts into [data-store-3d]. The host element gets:
     host.onChapter = (index) => {}
   and receives a --fade custom property for the loop seam.
   ============================================================ */
import * as THREE from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const host = document.querySelector('[data-store-3d]');
if (host) init(host);

function init(host) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ACCENT = 0x00ff88;
  const YELLOW = 0xf5c33b;      /* fall  — the app's caution box */
  const RED    = 0xff4d4d;      /* theft — the app's alert box   */
  const EDGE   = 0x2a3441;

  const LOOP = 28;              /* seconds */
  const FREEZE = (() => {
    const m = /[?&]t=([0-9.]+)/.exec(location.search);
    return m ? parseFloat(m[1]) : null;
  })();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 200);

  /* A WebGL context is not guaranteed. iOS drops them under memory pressure
     and refuses new ones when too many are live; a machine with no usable GPU
     path refuses outright. There was no handling for either, so a refused
     context left an empty box where the hero should be. Now the poster inside
     [data-store-3d] is simply never stood down. */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (err) {
    return;
  }
  /* Constructing the renderer is not proof of a context. With WebGL refused,
     three.js (r160) throws nothing and reports a context it does not have: it
     hands back a renderer whose canvas draws nothing, render() quietly no-ops,
     and every frame reports success — so the film looked "ready" over a blank
     canvas and the poster stood down for nothing.

     So ask the canvas, which cannot lie about it. Re-requesting a context of
     the type already created returns that same context, so this costs nothing
     when WebGL is healthy. */
  const probe = renderer.domElement;
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;
  /* A flag, not just the attribute: the frame loop re-asserts data-film every
     frame, so clearing the attribute alone is undone on the very next tick. */
  let contextLost = false;
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    /* preventDefault is what makes a restore possible at all */
    e.preventDefault();
    contextLost = true;
    delete host.dataset.film;
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    contextLost = false;
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.55;
  /* soft shadows: contact shadows under the hardware and the figures
     are what stop everything looking like it is floating */
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block' });

  /* ---------- helpers ----------
     Hardware gets rounded edges. A perfectly sharp 90-degree corner
     is the loudest tell of cheap 3D — real objects catch a highlight
     on every edge, and that single change does more for the render
     than any amount of extra light. */
  function solid(geo, color, opts = {}) {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color, roughness: opts.roughness ?? 0.92, metalness: opts.metalness ?? 0.05
    }));
    mesh.castShadow = opts.cast !== false;
    mesh.receiveShadow = true;
    g.add(mesh);
    if (opts.edges !== false) {
      /* a rounded solid needs a slacker threshold or every bevel
         facet shows up as a line */
      g.add(new THREE.LineSegments(
        new THREE.EdgesGeometry(geo, opts.round ? 60 : 25),
        new THREE.LineBasicMaterial({ color: opts.edgeColor ?? EDGE })
      ));
    }
    g.userData.mesh = mesh;
    return g;
  }
  function boxAt(w, h, d, x, y, z, color, opts = {}) {
    const r = opts.round;
    const geo = r
      ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2))
      : new THREE.BoxGeometry(w, h, d);
    const g = solid(geo, color, opts);
    g.position.set(x, y, z);
    scene.add(g);
    return g;
  }

  function labelSprite(text, hex) {
    const pad = 16, fs = 32;
    const m = document.createElement('canvas').getContext('2d');
    m.font = `500 ${fs}px "DM Mono", ui-monospace, monospace`;
    /* letterSpacing has to be set BEFORE measuring, or a long label
       is measured narrower than it draws and the tail gets clipped */
    m.letterSpacing = '2px';
    const w = Math.ceil(m.measureText(text).width) + pad * 2;
    const h = fs + pad * 1.3;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const css = '#' + hex.toString(16).padStart(6, '0');
    g.fillStyle = 'rgba(5,7,10,0.95)'; g.fillRect(0, 0, w, h);
    g.strokeStyle = css; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
    g.font = `500 ${fs}px "DM Mono", ui-monospace, monospace`;
    g.fillStyle = css; g.textBaseline = 'middle'; g.letterSpacing = '2px';
    g.fillText(text, pad, h / 2 + 1);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(w * 0.0026, h * 0.0026, 1);
    sp.renderOrder = 12;
    return sp;
  }

  const smooth  = (t) => t * t * (3 - 2 * t);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const W_      = (t, a, b) => smooth(clamp01((t - a) / (b - a)));   /* eased ramp over [a,b] seconds */

  /* ---------- room ---------- */
  const RW = 12, RD = 9, WALL_H = 3.2;

  const floor = solid(new THREE.BoxGeometry(RW, 0.12, RD), 0x080b11, { edgeColor: 0x1a212b });
  floor.position.set(0, -0.06, 0);
  scene.add(floor);

  const gridPts = [];
  for (let x = -RW / 2; x <= RW / 2 + 0.001; x += 1.5) gridPts.push(x, 0.005, -RD / 2, x, 0.005, RD / 2);
  for (let z = -RD / 2; z <= RD / 2 + 0.001; z += 1.5) gridPts.push(-RW / 2, 0.005, z, RW / 2, 0.005, z);
  const gg = new THREE.BufferGeometry();
  gg.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
  scene.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0x161d26 })));

  boxAt(RW, WALL_H, 0.14, 0, WALL_H / 2, -RD / 2, 0x070a0f, { edgeColor: 0x1a212b });
  boxAt(0.14, WALL_H, RD, -RW / 2, WALL_H / 2, 0, 0x05080c, { edgeColor: 0x1a212b });
  /* right-hand wall. It sits between the key light and the room, so it
     is explicitly excluded from the shadow pass — otherwise it throws
     the whole floor into shade. */
  boxAt(0.14, WALL_H, RD, RW / 2, WALL_H / 2, 0, 0x05080c, { edgeColor: 0x1a212b, cast: false });
  boxAt(3.0, 0.95, 1.2, -4.2, 0.475, -3.2, 0x232d39);                 /* counter */

  /* ---------- ceiling ----------
     The cameras used to hang off nothing. A ceiling gives every mount
     something to bolt to. Its normal points down, so the high wide
     shot sits behind it and it back-face culls — the room reads as
     enclosed from inside without the ceiling hiding the floor from
     above, and no second material is needed to do it. */
  const CEIL_Y = WALL_H;
  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0x0b0f16, roughness: 0.96, metalness: 0,
    transparent: true, opacity: 1, depthWrite: false
  });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), ceilMat);
  ceiling.rotation.x = Math.PI / 2;      /* normal now points down */
  ceiling.position.set(0, CEIL_Y, 0);
  ceiling.castShadow = false;
  ceiling.receiveShadow = false;
  scene.add(ceiling);

  /* the cable tray the uplinks ride in, and the height they ride at */
  const TRAY_Z = -RD / 2 + 0.55;
  const TRAY_Y = CEIL_Y - 0.055;
  const RUN_Y  = TRAY_Y - 0.048;

  /* ---------- the Hive ----------
     104 x 100 mm shell, 50 mm tall, matching the case drawn in
     hive-explode.js. At this scale it really is a small box. */
  const HX = -4.85, HZ = -3.15, HTOP = 0.95;
  const HW = 0.104, HH = 0.050, HD = 0.100;
  const hiveY = HTOP + HH / 2;

  /* base tray, 30 mm, and top shell, 24 mm — the two-part case from
     the exploded view, with the seam reading between them */
  boxAt(HW, 0.030, HD, HX, HTOP + 0.015, HZ, 0x07090d, { metalness: 0.35, roughness: 0.55, edgeColor: 0x39434f, round: 0.003 });
  boxAt(HW, 0.024, HD, HX, HTOP + 0.042, HZ, 0x0c0f15, { metalness: 0.42, roughness: 0.44, edgeColor: 0x4a5765, round: 0.003 });
  const LID = HTOP + 0.054;

  /* 46 mm fan window with its lip ring */
  boxAt(0.046, 0.0025, 0.046, HX, LID + 0.0005, HZ, 0x05080b, { edgeColor: 0x454f5d, metalness: 0.3, cast: false });
  const lip = new THREE.Mesh(
    new THREE.RingGeometry(0.024, 0.027, 4, 1, Math.PI / 4),
    new THREE.MeshStandardMaterial({ color: 0x2a323d, roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide })
  );
  lip.position.set(HX, LID + 0.0016, HZ);
  lip.rotation.x = -Math.PI / 2;
  scene.add(lip);

  const fan = new THREE.Group();
  for (let b = 0; b < 9; b++) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.019, 0.0016, 0.0046),
      new THREE.MeshStandardMaterial({ color: 0x525d6d, roughness: 0.55, metalness: 0.35 })
    );
    blade.position.set(Math.cos(b / 9 * Math.PI * 2) * 0.010, 0, Math.sin(b / 9 * Math.PI * 2) * 0.010);
    blade.rotation.y = b / 9 * Math.PI * 2;
    fan.add(blade);
  }
  fan.position.set(HX, LID - 0.005, HZ);
  scene.add(fan);

  /* four lid fixings */
  [[-0.040, -0.038], [0.040, -0.038], [-0.040, 0.038], [0.040, 0.038]].forEach(([dx, dz]) => {
    const s = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0022, 0.0022, 0.0016, 10),
      new THREE.MeshStandardMaterial({ color: 0x4d5765, roughness: 0.4, metalness: 0.7 })
    );
    s.position.set(HX + dx, LID + 0.0008, HZ + dz);
    scene.add(s);
  });

  /* etched NEXOVIA mark on the lid */
  const etch = document.createElement('canvas');
  etch.width = 256; etch.height = 64;
  {
    const g = etch.getContext('2d');
    g.clearRect(0, 0, 256, 64);
    g.strokeStyle = '#00ff88'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(12, 14); g.lineTo(40, 28); g.lineTo(40, 52); g.lineTo(12, 38); g.closePath(); g.stroke();
    g.fillStyle = '#ffffff';
    g.font = '500 26px "DM Mono", ui-monospace, monospace';
    g.letterSpacing = '7px';
    g.textBaseline = 'middle';
    g.fillText('NEXOVIA', 56, 34);
  }
  const etchTex = new THREE.CanvasTexture(etch);
  etchTex.colorSpace = THREE.SRGBColorSpace;
  const etchPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.052, 0.013),
    new THREE.MeshBasicMaterial({ map: etchTex, transparent: true, opacity: 0.9, depthWrite: false })
  );
  etchPlane.position.set(HX + 0.010, LID + 0.0012, HZ + 0.036);
  etchPlane.rotation.x = -Math.PI / 2;
  scene.add(etchPlane);

  /* port bank: DC, HDMI, 2 x USB-A, gigabit Ethernet */
  const PORTW = [0.006, 0.014, 0.011, 0.011, 0.013];
  let px = HX - 0.040;
  const hivePorts = [];
  PORTW.forEach((w) => {
    const pb = boxAt(w, 0.010, 0.004, px + w / 2, HTOP + 0.016, HZ + HD / 2 + 0.0005, 0x05080b,
      { edgeColor: 0x4a5764, metalness: 0.45, cast: false });
    hivePorts.push(pb.position.clone());
    px += w + 0.006;
  });
  const HIVE_RJ45 = hivePorts[hivePorts.length - 1].clone();

  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 10, 10), new THREE.MeshBasicMaterial({ color: ACCENT }));
  led.position.set(HX + 0.044, HTOP + 0.032, HZ + HD / 2 + 0.001);
  scene.add(led);
  const hiveGlow = new THREE.PointLight(ACCENT, 0, 0.34, 2);
  hiveGlow.position.set(HX + 0.03, HTOP + 0.015, HZ + 0.065);
  scene.add(hiveGlow);

  /* ---------- PoE switch, 150 x 100 mm ----------
     A brushed metal chassis with a real port bank: eight recessed RJ45
     cavities, a link LED over each, and vent slots along the lid. A
     plain black slab reads as a prop; the ports are what make it read
     as network kit.

     The bank sits on the BACK face. Everything then leaves rearward and
     drops straight down behind the counter, so the front of the kit is
     clean and no lead ever crosses in front of it. */
  const SX = -4.60, SZ = -3.14, STOP = HTOP + 0.030;
  boxAt(0.150, 0.030, 0.100, SX, HTOP + 0.015, SZ, 0x2b333d,
    { metalness: 0.72, roughness: 0.38, edgeColor: 0x545f6d, round: 0.0025 });

  /* vent slots along the lid */
  for (let v = 0; v < 6; v++) {
    boxAt(0.084, 0.0012, 0.0035, SX, STOP + 0.0006, SZ - 0.026 + v * 0.010, 0x11161d,
      { edges: false, metalness: 0.4, cast: false });
  }

  const ports = [];
  const SW_PORT = [];
  for (let i = 0; i < 8; i++) {
    const cx = SX - 0.063 + i * 0.018;
    /* recessed RJ45 cavity */
    boxAt(0.013, 0.011, 0.005, cx, HTOP + 0.013, SZ - 0.050 - 0.0005, 0x04070a,
      { edgeColor: 0x5b6674, metalness: 0.5, cast: false });
    SW_PORT.push(new THREE.Vector3(cx, HTOP + 0.013, SZ - 0.052));

    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.0022, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    );
    p.position.set(cx, HTOP + 0.0255, SZ - 0.0505);
    p.visible = false;
    scene.add(p);
    ports.push(p);
  }

  /* ---------- aisle shelving ----------

     Built as a double-sided gondola: decks cantilevered off ONE spine down the
     middle, both long faces open.

     It used to be the other way round — two 0.06 x 1.8 x 5.0 skins down the
     OUTSIDE of each unit, at cx ± 0.47. That sealed the goods in behind a pair
     of solid five-metre walls and occluded everything past them, which is what
     the client saw: "why is there like a wall blocking the people with the
     goods". It also made no sense as shop fitting — you could not have reached
     the stock, and the browse animation reaches toward a shelf face that was
     boarded over.

     The spine is thin (0.04) and sits at cx, between the two stock rows at
     cx-0.22 and cx+0.16, so it clears the goods at their widest. It stops at
     1.62, just above the top deck at 1.37, so the unit still reads as a solid
     run from the side without walling off the aisle beyond it. */
  function shelf(cx, cz) {
    boxAt(1.0, 0.08, 5.0, cx, 0.05, cz, 0x1e2833);
    boxAt(1.0, 0.06, 5.0, cx, 0.72, cz, 0x222d39);
    boxAt(1.0, 0.06, 5.0, cx, 1.34, cz, 0x222d39);
    boxAt(0.04, 1.62, 5.0, cx, 0.81, cz, 0x27323e);
  }
  shelf(-1.4, 0.2);
  shelf(2.2, 0.2);

  /* ---------- stock on the shelves ----------

     Empty shelving read as an architectural render rather than a shop, which
     mattered most in the two chapters that carry the argument: a person taking
     something off a bare shelf does not look like theft, and an aisle with
     nothing in it does not look like somewhere a fall would go unnoticed.

     InstancedMesh rather than ~230 separate meshes — one draw call for the
     boxes, one for the bottles. These carry no EdgesGeometry either, unlike
     everything from boxAt(): at this size the wireframe reads as visual noise
     and doubles the geometry for objects a metre from camera at their closest.

     Seeded PRNG so the shelves are laid out identically on every load. With
     Math.random the scene reshuffled on each visit, and the theft chapter — the
     camera pushing toward one specific shelf — landed differently every time. */
  function stockShelves() {
    let seed = 0x9e3779b9;
    const rnd = () => {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return ((seed >>> 0) % 100000) / 100000;
    };

    /* Deck surfaces: base top, then the two boards. */
    const DECKS = [0.09, 0.75, 1.37];
    const SHELVES = [-1.4, 2.2];
    /* Muted, in the room's own palette — goods should read as mass, not as a
       colour story competing with the green. */
    const TONES = [0x2f3a47, 0x38424f, 0x2a343f, 0x424c58, 0x333e4a, 0x3d4854];

    const boxes = [];
    const bottles = [];
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();

    for (const cx of SHELVES) {
      for (const deckY of DECKS) {
        /* two rows across the shelf's 1.0m depth, front and back */
        for (const row of [-0.22, 0.16]) {
          let z = -2.05;
          while (z < 2.45) {
            const kind = rnd();
            if (kind > 0.82) {
              /* a bottle: taller, narrower, occasionally a run of them */
              const h = 0.16 + rnd() * 0.1;
              const r = 0.032 + rnd() * 0.014;
              pos.set(cx + row + (rnd() - 0.5) * 0.05, deckY + h / 2, z + r);
              scl.set(r * 2, h, r * 2);
              m4.compose(pos, q, scl);
              bottles.push(m4.clone());
              z += r * 2 + 0.012;
            } else {
              const w = 0.09 + rnd() * 0.13;
              const h = 0.11 + rnd() * 0.14;
              const d = 0.1 + rnd() * 0.1;
              pos.set(cx + row + (rnd() - 0.5) * 0.06, deckY + h / 2, z + d / 2);
              /* a few sitting slightly askew — a perfectly faced shelf looks
                 like a planogram, not a shop anyone has shopped in */
              q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (rnd() - 0.5) * 0.22);
              scl.set(w, h, d);
              m4.compose(pos, q, scl);
              boxes.push({ m: m4.clone(), tone: TONES[(boxes.length + Math.floor(rnd() * 6)) % TONES.length] });
              q.identity();
              z += d + 0.02 + rnd() * 0.05;
            }
            /* leave the odd gap — a sold-out facing */
            if (rnd() > 0.9) z += 0.12 + rnd() * 0.16;
          }
        }
      }
    }

    /* one mesh per tone keeps per-instance colour out of it, which needs
       vertexColors plumbing this scene does not otherwise use */
    for (const tone of TONES) {
      const mine = boxes.filter((b) => b.tone === tone);
      if (!mine.length) continue;
      const im = new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: tone, roughness: 0.94, metalness: 0.04 }),
        mine.length
      );
      mine.forEach((b, i) => im.setMatrixAt(i, b.m));
      im.instanceMatrix.needsUpdate = true;
      im.castShadow = true;
      im.receiveShadow = true;
      scene.add(im);
    }

    if (bottles.length) {
      const im = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
        new THREE.MeshStandardMaterial({ color: 0x36414d, roughness: 0.6, metalness: 0.12 }),
        bottles.length
      );
      bottles.forEach((m, i) => im.setMatrixAt(i, m));
      im.instanceMatrix.needsUpdate = true;
      im.castShadow = true;
      im.receiveShadow = true;
      scene.add(im);
    }

    return boxes.length + bottles.length;
  }
  stockShelves();

  /* ---------- people ----------
     A person, not a shop dummy. Three things separate the two, and the
     old rig missed all three.

     Joints. An arm that is one rigid tube from shoulder to hand reads as
     a mannequin however well it is shaped, because the silhouette never
     bends where a real one does. Every limb here has its real joint:
     shoulder -> elbow -> hand, hip -> knee -> foot.

     Clothing. One uniform plastic tone is the loudest dummy tell there
     is. Shirt, trousers, skin and shoes are separate tones, held
     desaturated so they sit inside the scene palette rather than turning
     the shot into a toy aisle.

     Asymmetry. Perfect bilateral symmetry is the second loudest tell.
     Each figure takes a seeded offset: weight on one hip, one knee softer
     than the other, head turned a few degrees, arms at different angles.

     Each surface is still a lathe — a profile spun about its own axis and
     flattened front-to-back, because a person is wider than they are
     deep. The joints the animation drives (torso, armL/R, legL/R) keep
     their names; elbows and knees are nested inside them. */
  const LOOKS = {
    /* a shopper and a member of staff, not the same figure twice */
    shopper: { shirt: 0x8b95a2, trouser: 0x2a323d, skin: 0xa8907f, shoe: 0x14181e, hair: 0x241d18, tall: 1.02  },
    subject: { shirt: 0x5b6572, trouser: 0x2f2b27, skin: 0x8b7159, shoe: 0x121417, hair: 0x14100d, tall: 0.965 },
    /* Background shoppers. Three more sets so the floor is not the same two
       figures repeated — height and skin vary as much as clothing, because a
       crowd of one build reads as clones however you dress it. */
    browseA: { shirt: 0x6f7a86, trouser: 0x232a33, skin: 0x6b4f3a, shoe: 0x14181e, hair: 0x120e0a, tall: 1.06 },
    browseB: { shirt: 0x9aa3ae, trouser: 0x3a3630, skin: 0xc0a58e, shoe: 0x1a1d22, hair: 0x4a3a28, tall: 0.94 },
    browseC: { shirt: 0x7b8592, trouser: 0x272f39, skin: 0x8f6f52, shoe: 0x161a20, hair: 0x1d1712, tall: 1.0  }
  };
  function wardrobe(look) {
    return {
      shirt:   new THREE.MeshStandardMaterial({ color: look.shirt,   roughness: 0.80, metalness: 0.02 }),
      trouser: new THREE.MeshStandardMaterial({ color: look.trouser, roughness: 0.86, metalness: 0.02 }),
      skin:    new THREE.MeshStandardMaterial({ color: look.skin,    roughness: 0.68, metalness: 0.0  }),
      shoe:    new THREE.MeshStandardMaterial({ color: look.shoe,    roughness: 0.60, metalness: 0.08 }),
      hair:    new THREE.MeshStandardMaterial({ color: look.hair,    roughness: 0.94, metalness: 0.0  }),
      eye:     new THREE.MeshStandardMaterial({ color: 0x191512,     roughness: 0.30, metalness: 0.0  })
    };
  }

  function lathed(profile, depth) {
    const geo = new THREE.LatheGeometry(
      profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0008), y)), 22
    );
    geo.scale(1, 1, depth);
    geo.computeVertexNormals();
    return geo;
  }

  /* [radius, height] in metres, bottom to top. Heights are relative to
     the part own joint, so a pivot rotation swings the whole limb. */
  const G_CHEST = lathed([
    [0.004, -0.070], [0.150, -0.066], [0.165, -0.040], [0.162,  0.010],
    [0.152,  0.070], [0.158,  0.130], [0.176,  0.230], [0.188,  0.310],
    [0.184,  0.358], [0.150,  0.400], [0.086,  0.428], [0.046,  0.438],
    [0.004,  0.442]
  ], 0.66);
  const G_PELVIS = lathed([
    [0.004, -0.122], [0.118, -0.116], [0.142, -0.084], [0.154, -0.044],
    [0.150, -0.010], [0.130,  0.008], [0.080,  0.016], [0.004,  0.018]
  ], 0.78);
  const G_UPPERARM = lathed([
    [0.004, -0.312], [0.050, -0.300], [0.056, -0.270], [0.060, -0.200],
    [0.067, -0.120], [0.074, -0.050], [0.077,  0.000], [0.058,  0.020],
    [0.004,  0.030]
  ], 0.88);
  const G_FOREARM = lathed([
    [0.004, -0.268], [0.036, -0.258], [0.039, -0.240], [0.045, -0.190],
    [0.053, -0.110], [0.058, -0.045], [0.060,  0.000], [0.048,  0.022],
    [0.004,  0.036]
  ], 0.86);
  const G_THIGH = lathed([
    [0.004, -0.452], [0.056, -0.442], [0.060, -0.420], [0.066, -0.360],
    [0.078, -0.250], [0.088, -0.130], [0.093, -0.050], [0.094,  0.000],
    [0.072,  0.028], [0.004,  0.044]
  ], 0.90);
  const G_SHIN = lathed([
    [0.004, -0.430], [0.040, -0.420], [0.044, -0.400], [0.050, -0.340],
    [0.062, -0.230], [0.068, -0.150], [0.064, -0.070], [0.060,  0.000],
    [0.050,  0.024], [0.004,  0.038]
  ], 0.88);
  /* a jaw and a crown, so the head is not an egg on a stick */
  const G_HEAD = lathed([
    [0.004, 0.000], [0.044, 0.007], [0.068, 0.024], [0.081, 0.050],
    [0.088, 0.084], [0.091, 0.116], [0.088, 0.150], [0.078, 0.181],
    [0.057, 0.206], [0.030, 0.221], [0.004, 0.226]
  ], 1.10);
  const G_HAIR = (() => {
    const g = new THREE.SphereGeometry(0.094, 18, 14);
    g.scale(0.99, 0.94, 1.06);
    return g;
  })();
  const G_EYE  = new THREE.SphereGeometry(0.0082, 10, 8);
  const G_NECK = new THREE.CylinderGeometry(0.048, 0.060, 0.10, 14);
  const G_HAND = new RoundedBoxGeometry(0.052, 0.098, 0.026, 2, 0.012);
  const G_FOOT = new RoundedBoxGeometry(0.090, 0.052, 0.232, 2, 0.022);

  /* arms rest a little clear of the body */
  const ARM_SPLAY = 0.055;

  function part(geo, mat, parent, y) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    if (y !== undefined) m.position.y = y;
    parent.add(m);
    return m;
  }

  function makePerson(x, z, seed, look) {
    const g = new THREE.Group();
    const S = seed;                       /* -1 .. 1, drives the asymmetry */
    const M = wardrobe(look);

    part(G_PELVIS, M.trouser, g, 0.950);

    const torso = new THREE.Group();      /* pivots at the waist */
    torso.position.set(0, 0.950, 0);
    part(G_CHEST, M.shirt, torso);
    part(G_NECK, M.skin, torso, 0.470);
    const head = part(G_HEAD, M.skin, torso, 0.525);
    head.rotation.y = S * 0.22;           /* nobody stares dead ahead */
    head.rotation.x = 0.06;               /* and nobody holds it perfectly level */
    const hair = part(G_HAIR, M.hair, head, 0.146);
    hair.position.z = -0.013;             /* set back, so it caps the skull and not the face */
    [-1, 1].forEach((e) => {
      const eye = part(G_EYE, M.eye, head, 0.132);
      eye.position.set(e * 0.033, 0.133, 0.0765);
      eye.castShadow = false;
    });
    g.add(torso);

    function arm(side) {                  /* shoulder -> elbow -> hand */
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.172, 0.372, 0);
      part(G_UPPERARM, M.shirt, shoulder);
      const elbow = new THREE.Group();
      elbow.position.y = -0.300;
      part(G_FOREARM, M.skin, elbow);
      const hand = part(G_HAND, M.skin, elbow, -0.318);
      hand.position.z = 0.004;
      shoulder.add(elbow);
      torso.add(shoulder);
      return { shoulder, elbow };
    }
    function leg(side) {                  /* hip -> knee -> foot */
      const hip = new THREE.Group();
      hip.position.set(side * 0.088, 0.900, 0);
      part(G_THIGH, M.trouser, hip);
      const knee = new THREE.Group();
      knee.position.y = -0.440;
      part(G_SHIN, M.trouser, knee);
      const foot = part(G_FOOT, M.shoe, knee, -0.428);
      foot.position.z = 0.058;
      hip.add(knee);
      g.add(hip);
      return { hip, knee };
    }

    const aL = arm(-1), aR = arm(1);
    const lL = leg(-1), lR = leg(1);

    /* Rest pose is stored, not baked, because the animation assigns these
       channels outright — it has to add to the rest, not replace it. */
    const rest = {
      armLX: -0.05 + S * 0.06,        armRX: -0.05 - S * 0.05,
      armLZ: -ARM_SPLAY - S * 0.02,   armRZ:  ARM_SPLAY - S * 0.02,
      elbowLX: -0.16 - S * 0.07,      elbowRX: -0.13 + S * 0.06,
      legLX: S * 0.05,                legRX: -S * 0.04,
      kneeLX: 0.05 + S * 0.06,        kneeRX: 0.03 - S * 0.04,
      torsoZ: S * 0.02
    };
    aL.shoulder.rotation.set(rest.armLX, 0, rest.armLZ);
    aR.shoulder.rotation.set(rest.armRX, 0, rest.armRZ);
    aL.elbow.rotation.x = rest.elbowLX;
    aR.elbow.rotation.x = rest.elbowRX;
    lL.hip.rotation.x = rest.legLX;
    lR.hip.rotation.x = rest.legRX;
    lL.knee.rotation.x = rest.kneeLX;
    lR.knee.rotation.x = rest.kneeRX;
    torso.rotation.z = rest.torsoZ;

    g.position.set(x, 0, z);
    g.scale.setScalar(look.tall);         /* people are not all one height */
    scene.add(g);
    return {
      g, torso, head, rest,
      armL: aL.shoulder, armR: aR.shoulder,
      elbowL: aL.elbow,  elbowR: aR.elbow,
      legL: lL.hip,      legR: lR.hip,
      kneeL: lL.knee,    kneeR: lR.knee,
      home: new THREE.Vector3(x, 0, z)
    };
  }
  const FLOOR_BOX = new THREE.Box3();
  /* Nothing about a figure may ever sit below y=0. Measure its real world
     bounds and lift it by whatever went under. Two boxes a frame is noise
     next to the render, and it makes a limb through the floor structurally
     impossible rather than a thing to keep re-checking by eye. */
  function keepOnFloor(who, baseY) {
    who.g.position.y = baseY;
    who.g.updateMatrixWorld(true);
    FLOOR_BOX.setFromObject(who.g);
    const under = -FLOOR_BOX.min.y;
    if (under > 0) who.g.position.y = baseY + under + 0.003;
  }
  const faller = makePerson(-2.95, 1.10, -0.6, LOOKS.shopper);
  const thief  = makePerson(0.42, 0.55, 0.7, LOOKS.subject);

  /* ---------- background shoppers ----------

     The shop had stock but nobody in it, so the two incidents were the only
     human activity in the film. That made them read as "here is a person" when
     they need to read as "here is a person doing something wrong" — a fall and
     a theft only land as deviation if there is a normal to deviate from.

     Placed in the three clear lanes and well away from both actors and the
     camera path: shelves occupy x -1.9..-0.9 and 1.7..2.7, the faller is at
     z 1.10 in the left lane and the thief at z 0.55 in the middle.

     Idle only — a weight shift, a slow head turn, an arm that moves as if
     reaching a shelf. Nobody walks. Walk cycles on figures this simple read as
     a shuffle, and the eye should go to the incident, not to the extras. */
  const browsers = [
    { p: makePerson(-2.90, -1.65, 3.1, LOOKS.browseA), face: 0.9,  rate: 0.42, phase: 0.0 },
    { p: makePerson( 1.05, -1.15, 5.7, LOOKS.browseB), face: -1.4, rate: 0.31, phase: 2.1 },
    { p: makePerson( 3.35,  0.95, 8.3, LOOKS.browseC), face: 2.4,  rate: 0.37, phase: 4.3 }
  ];
  browsers.forEach((b) => { b.p.g.rotation.y = b.face; });

  function idleBrowsers(t) {
    for (const b of browsers) {
      const s = t * b.rate + b.phase;
      const who = b.p;
      /* weight shifting foot to foot, and the torso following it a beat later */
      who.g.rotation.y = b.face + Math.sin(s * 0.6) * 0.09;
      who.torso.rotation.z = who.rest.torsoZ + Math.sin(s * 0.6 - 0.5) * 0.035;
      who.head.rotation.y = Math.sin(s * 0.44 + 1.2) * 0.42;
      who.head.rotation.x = Math.sin(s * 0.29) * 0.1;
      /* the near arm lifts toward the shelf now and then, and holds there —
         smoothstep on a slow sine so it does not look like a metronome */
      const raw = (Math.sin(s * 0.35) + 1) / 2;
      const reach = raw * raw * (3 - 2 * raw);
      who.armR.rotation.x = -reach * 1.05;
      who.elbowR.rotation.x = -reach * 0.7;
      who.armL.rotation.x = Math.sin(s * 0.6 + 3.1) * 0.06;
    }
  }

  /* ---------- detection boxes ---------- */
  function detBox(w, h, d, text, hex) {
    const g = new THREE.Group();
    const cage = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
      new THREE.LineBasicMaterial({ color: hex, transparent: true })
    );
    const fill = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.05, depthWrite: false })
    );
    const chip = labelSprite(text, hex);
    chip.position.set(0, h / 2 + 0.30, 0);
    g.add(cage, fill, chip);
    g.visible = false;
    scene.add(g);
    return { g, cage, fill, chip };
  }
  const fallBox  = detBox(0.82, 0.55, 2.05, 'FALL 0.93', YELLOW);
  const theftBox = detBox(0.78, 1.76, 0.78, 'POSSIBLE THEFT 0.94', RED);

  /* ---------- cameras ---------- */
  const CEIL = 2.9;
  /* one camera per aisle, looking down it. Shelf 1 occupies x -1.9..-0.9 and
     shelf 2 x 1.7..2.7, so these x positions are the three clear lanes. */
  const cams = [
    { pos: new THREE.Vector3(-2.90, CEIL, -3.7), look: new THREE.Vector3(-2.95, 0, 1.15) },
    { pos: new THREE.Vector3( 0.40, CEIL, -3.7), look: new THREE.Vector3( 0.45, 0, 1.05) },
    { pos: new THREE.Vector3( 5.30, CEIL,  0.6), look: new THREE.Vector3( 4.10, 0, 2.60) }
  ];

  /* the tray: a spine along the back of the room, plus a spur out to
     any camera that does not sit on that line. Camera 3 is the reason
     this exists — it used to hang in open air halfway across the floor. */
  boxAt(RW - 0.28, 0.05, 0.30, 0, TRAY_Y, TRAY_Z, 0x1b232d, { edgeColor: 0x39434f, cast: false });
  cams.forEach((c) => {
    const span = c.pos.z - TRAY_Z;
    if (Math.abs(span) < 0.35) return;
    boxAt(0.16, 0.05, Math.abs(span) + 0.30, c.pos.x, TRAY_Y, TRAY_Z + span / 2, 0x1b232d,
      { edgeColor: 0x39434f, cast: false });
  });

  cams.forEach((c) => {
    /* mount plate bolted to the ceiling — the stalk now lands on
       something instead of stopping in mid-air */
    const plate = solid(new THREE.CylinderGeometry(0.078, 0.070, 0.020, 18), 0x1e2732,
      { metalness: 0.4, roughness: 0.5, edges: false });
    plate.position.set(c.pos.x, CEIL_Y - 0.013, c.pos.z);
    scene.add(plate);

    const stalk = solid(new THREE.CylinderGeometry(0.022, 0.022, 0.30, 10), 0x1a222c, { edges: false });
    stalk.position.copy(c.pos).add(new THREE.Vector3(0, 0.155, 0));
    scene.add(stalk);

    const body = solid(new THREE.BoxGeometry(0.26, 0.14, 0.16), 0x161e28, { metalness: 0.3, edgeColor: 0x3a4757 });
    body.position.copy(c.pos); body.lookAt(c.look);
    scene.add(body);

    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.055, 0.05, 14),
      new THREE.MeshStandardMaterial({ color: 0x05080c, roughness: 0.3, metalness: 0.6 })
    );
    lens.position.copy(c.pos); lens.lookAt(c.look); lens.translateZ(0.10); lens.rotateX(Math.PI / 2);
    scene.add(lens);

    const cled = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), new THREE.MeshBasicMaterial({ color: ACCENT }));
    cled.position.copy(c.pos).add(new THREE.Vector3(0, 0.09, 0));
    cled.visible = false;
    scene.add(cled);
    c.led = cled;

    const dist = c.pos.distanceTo(c.look);
    const dir = new THREE.Vector3().subVectors(c.look, c.pos).normalize();
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.95, dist, 26, 1, true),
      new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    cone.position.copy(c.pos).add(dir.clone().multiplyScalar(dist / 2));
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
    scene.add(cone);
    c.cone = cone;

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.86, 0.95, 40),
      new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.position.set(c.look.x, 0.02, c.look.z);
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
    c.ring = ring;

    /* Filled footprint inside the ring. The ring alone drew an outline the eye
       read as a decorative circle; the fill is what makes it read as an area
       this camera is covering. Sits a hair under the ring so the two do not
       z-fight on the floor plane, and stays faint — it is ground the shopper
       walks over, not a light. */
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.88, 40),
      new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    disc.position.set(c.look.x, 0.015, c.look.z);
    disc.rotation.x = -Math.PI / 2;
    scene.add(disc);
    c.disc = disc;
  });

  /* ---------- cabling ----------
     Every run is built twice: the physical Cat6, and a sheath over it
     that energises as the run lands and carries the "power is flowing"
     read.

     Two things stopped this reading as ethernet. The gauge was 24 mm —
     twice the width of the 13 mm RJ45 socket it was supposedly plugged
     into, which is why it looked like a hose lying against the hardware
     rather than a lead going into it. And there was no connector at all:
     a bare tube stopped in front of the port. Cat6 is now sized to its
     socket, and every end gets a real moulded plug, latch and boot,
     seated into the cavity.

     The sheath is MeshBasic with toneMapped off. That matters: the old
     emissive-standard sheath went through ACES tone mapping at exposure
     1.55, which lifts a bright channel into the highlight roll-off and
     desaturates it, so #00ff88 was landing on screen as pale mint. Basic
     + toneMapped:false writes the brand hex through untouched. */
  const runs = [];

  /* An RJ45 plug, built pointing along +Z out of the socket face. */
  const PLUG_BODY  = new RoundedBoxGeometry(0.0126, 0.0106, 0.021, 2, 0.0016);
  const PLUG_LATCH = new RoundedBoxGeometry(0.0050, 0.0030, 0.0105, 1, 0.0010);
  const PLUG_BOOT  = new RoundedBoxGeometry(0.0100, 0.0090, 0.0135, 2, 0.0035);
  const PLUG_MAT   = new THREE.MeshStandardMaterial({ color: 0x6b7581, roughness: 0.38, metalness: 0.12 });
  const LATCH_MAT  = new THREE.MeshStandardMaterial({ color: 0x59626d, roughness: 0.40, metalness: 0.10 });

  function rj45(pos, dir, bootColor) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(PLUG_BODY, PLUG_MAT);
    body.position.z = 0.0075;                 /* 3 mm seated inside the cavity */
    body.castShadow = true;
    const latch = new THREE.Mesh(PLUG_LATCH, LATCH_MAT);
    latch.position.set(0, 0.0066, 0.0115);
    latch.rotation.x = -0.30;                 /* the clip springs back over the plug */
    const boot = new THREE.Mesh(PLUG_BOOT, new THREE.MeshStandardMaterial({
      color: bootColor, roughness: 0.72, metalness: 0.05
    }));
    boot.position.z = 0.0245;
    boot.castShadow = true;
    g.add(body, latch, boot);
    g.position.copy(pos);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
    scene.add(g);
    return g;
  }
  const PLUG_LEN = 0.030;                     /* port face to where the jacket starts */

  /* Round the corners of a polyline. Given the corner vertices of a run,
     each interior vertex is replaced by a tangent arc of the given radius,
     sampled densely enough that the spline through the result has no facet
     at the join. Legs shorter than twice the radius get a proportionally
     smaller one rather than overrunning into the next corner. */
  function fillet(pts, radius, seg = 9) {
    const out = [pts[0].clone()];
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i];
      const va = new THREE.Vector3().subVectors(pts[i - 1], p);
      const vb = new THREE.Vector3().subVectors(pts[i + 1], p);
      const la = va.length(), lb = vb.length();
      if (la < 1e-5 || lb < 1e-5) continue;
      va.divideScalar(la); vb.divideScalar(lb);
      const theta = Math.acos(Math.max(-1, Math.min(1, va.dot(vb))));
      if (theta > Math.PI - 0.03) { out.push(p.clone()); continue; }   /* already straight */
      const d = Math.min(radius / Math.tan(theta / 2), la * 0.45, lb * 0.45);
      const ta = p.clone().addScaledVector(va, d);
      const tb = p.clone().addScaledVector(vb, d);
      for (let k = 0; k <= seg; k++) {
        const t = k / seg, u = 1 - t;
        out.push(new THREE.Vector3(
          u * u * ta.x + 2 * u * t * p.x + t * t * tb.x,
          u * u * ta.y + 2 * u * t * p.y + t * t * tb.y,
          u * u * ta.z + 2 * u * t * p.z + t * t * tb.z));
      }
    }
    out.push(pts[pts.length - 1].clone());
    return out;
  }

  function cable(pts, opts = {}) {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const r = opts.radius ?? 0.0032;

    /* ~7 mm per segment, so a 45 mm bend radius always gets several */
    const segs = Math.min(1800, Math.max(140, Math.round(curve.getLength() * 145)));
    const geo = new THREE.TubeGeometry(curve, segs, r, 8, false);
    const jacket = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: opts.color ?? 0x232b34, roughness: 0.82, metalness: 0.1
    }));
    jacket.castShadow = true;
    scene.add(jacket);

    const glowGeo = new THREE.TubeGeometry(curve, segs, r * 1.10, 8, false);
    scene.add(new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
      color: ACCENT, toneMapped: false
    })));

    geo.setDrawRange(0, 0);
    glowGeo.setDrawRange(0, 0);
    return { curve, geo, glowGeo, total: geo.index.count, glowTotal: glowGeo.index.count };
  }

  /* the patch lead from the Hive's RJ45 to the switch — short, with
     the droop a real lead has */
  const OUT  = new THREE.Vector3(0, 0,  1);   /* the Hive bank faces the front */
  const BACK = new THREE.Vector3(0, 0, -1);   /* the switch bank faces the rear */
  rj45(HIVE_RJ45, OUT, 0x2c353f);
  rj45(SW_PORT[7], BACK, 0x2c353f);
  const patchStart = HIVE_RJ45.clone().add(new THREE.Vector3(0, 0, PLUG_LEN));
  const patchEnd   = SW_PORT[7].clone().add(new THREE.Vector3(0, 0, -PLUG_LEN));
  const GAP = -4.737;                         /* clear air between Hive and switch */
  const patch = cable([
    patchStart,
    new THREE.Vector3(patchStart.x + 0.028, HTOP + 0.008, patchStart.z + 0.030),
    new THREE.Vector3(GAP, HTOP + 0.006, patchStart.z + 0.015),
    new THREE.Vector3(GAP, HTOP + 0.006, SZ - 0.042),        /* back through the gap */
    new THREE.Vector3(GAP + 0.018, HTOP + 0.006, patchEnd.z - 0.018),
    new THREE.Vector3(patchEnd.x - 0.040, HTOP + 0.007, patchEnd.z - 0.030),
    patchEnd
  ], { radius: 0.0032, color: 0x2c353f });
  runs.push({ ...patch, dot: null, cam: null, from: 2.0, to: 3.6 });

  /* switch uplinks out to each camera */
  cams.forEach((c, n) => {
    rj45(SW_PORT[n], BACK, 0x232b34);
    const start = SW_PORT[n].clone().add(new THREE.Vector3(0, 0, -PLUG_LEN));
    const bx = SX - 0.013 + n * 0.013;             /* 13 mm lanes: a bundle, not a fan */
    const bz = TRAY_Z - 0.013 + n * 0.013;
    const r = cable(fillet([
      start,
      new THREE.Vector3(start.x, HTOP + 0.012, SZ - 0.105),  /* straight out of the boot first */
      new THREE.Vector3(bx, HTOP + 0.012, SZ - 0.175),       /* then converge into the bundle */
      new THREE.Vector3(bx, HTOP + 0.012, -3.862),           /* straight back, well past the counter edge */
      new THREE.Vector3(bx, 0.034, -3.908),                  /* down behind the counter */
      new THREE.Vector3(bx, 0.030, -4.258),                  /* along the floor */
      new THREE.Vector3(bx, RUN_Y, -4.276),                  /* up the wall as one bundle */
      new THREE.Vector3(bx, RUN_Y, bz),                      /* onto the ceiling, into the tray */
      new THREE.Vector3(c.pos.x, RUN_Y, bz),                 /* along the tray, peeling off one at a time */
      new THREE.Vector3(c.pos.x, RUN_Y, c.pos.z),            /* out along the spur */
      c.pos.clone().add(new THREE.Vector3(0, 0.215, 0))      /* down into the mount */
    ], 0.045));

    /* a cable gland where the run enters the mount, so the cable does
       not simply vanish into the stalk */
    const gland = solid(new THREE.CylinderGeometry(0.026, 0.020, 0.030, 12), 0x2b333d,
      { metalness: 0.5, roughness: 0.4, edges: false });
    gland.position.copy(c.pos).add(new THREE.Vector3(0, 0.215, 0));
    scene.add(gland);

    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10),
      new THREE.MeshBasicMaterial({ color: ACCENT, toneMapped: false }));
    dot.visible = false;
    scene.add(dot);

    runs.push({ ...r, dot, cam: c, from: 8.4 + n * 1.1, to: 10.6 + n * 1.3 });
  });

  /* ---------- lighting ---------- */
  scene.add(new THREE.AmbientLight(0x33465e, 1.15));
  const key = new THREE.DirectionalLight(0xe6f1fc, 1.55);
  key.position.set(7, 11, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 34;
  key.shadow.camera.left = -9; key.shadow.camera.right = 9;
  key.shadow.camera.top = 9;   key.shadow.camera.bottom = -9;
  key.shadow.bias = -0.0012;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x5f92bd, 0.75); rim.position.set(-8, 5, -7); scene.add(rim);

  /* An environment map is the cheapest realism there is: it gives every
     metal surface something to reflect. RoomEnvironment ships with three,
     so this costs no download. */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.22;

  /* ---------- the shot, keyed in seconds ---------- */
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  /* Each beat is keyed twice — arrive, then hold. Without the hold
     the camera leaves for the next mark the instant it lands, which
     is what makes an auto-playing shot feel restless. */
  /* The switch-to-cameras move used to be one 2.4s swing that threw the
     target 5 metres across the room — a whip pan, not a shot. It is now
     four legs with a hold on each: leave the switch, climb the wall with
     the cable, ride the tray, then track along the camera line. Same
     journey, roughly three times the screen time. */
  const shots = [
    { t:  0.0, pos: V(-4.57, 1.23, -2.88), tgt: V(HX + 0.02, HTOP + 0.026, HZ) },
    { t:  3.4, pos: V(-4.52, 1.21, -2.83), tgt: V(HX + 0.02, HTOP + 0.026, HZ) },  /* hold  */
    /* the bank is on the back now, so the switch beat sits behind and
       above it — the plugs and the run down are the subject, and aiming
       left of the kit keeps it clear of the copy */
    { t:  4.8, pos: V(-3.58, 2.02, -4.08), tgt: V(-4.28, 0.92, -2.92)          },
    { t:  6.6, pos: V(-3.64, 1.92, -4.02), tgt: V(-4.28, 0.92, -2.92)          },  /* hold  */
    /* the run drops straight down behind the counter and climbs the back
       wall, so the shot only has to fall with it and lift once */
    { t:  8.8, pos: V(-3.45, 1.10, -3.34), tgt: V(-4.62, 0.42, -3.86)          },
    { t: 11.2, pos: V(-3.28, 1.62, -2.98), tgt: V(-4.58, 2.30, -4.16)          },
    { t: 13.6, pos: V(-1.00, 6.50, 12.20), tgt: V(-0.10, 0.90, -0.20)          },
    { t: 15.8, pos: V(-0.62, 6.22, 11.45), tgt: V(-0.10, 0.90, -0.20)          },  /* hold  */
    { t: 17.2, pos: V(-5.30, 1.92,  3.58), tgt: V(-2.66, 0.28,  2.42)          },
    { t: 21.0, pos: V(-5.14, 1.79,  3.40), tgt: V(-2.66, 0.28,  2.42)          },  /* hold  */
    { t: 22.6, pos: V(-1.05, 1.95,  4.35), tgt: V( 0.30, 0.95,  0.60)          },
    { t: 27.0, pos: V(-0.55, 2.20,  4.95), tgt: V( 0.40, 0.95,  0.85)          },  /* drift */
    { t: 28.0, pos: V(-0.55, 2.20,  4.95), tgt: V( 0.40, 0.95,  0.85)          }
  ];
  const CHAPTERS = [0, 4.8, 8.8, 13.6, 17.2, 22.6];

  const camPos = shots[0].pos.clone();
  const camTgt = shots[0].tgt.clone();

  function frameShot(t) {
    let a = shots[0], b = shots[shots.length - 1];
    for (let i = 0; i < shots.length - 1; i++) {
      if (t >= shots[i].t && t <= shots[i + 1].t) { a = shots[i]; b = shots[i + 1]; break; }
    }
    const k = smooth(clamp01((t - a.t) / Math.max(0.001, b.t - a.t)));
    camPos.lerpVectors(a.pos, b.pos, k);
    camTgt.lerpVectors(a.tgt, b.tgt, k);
  }

  let chapter = -1;

  function apply(t) {
    frameShot(t);

    const hiveOn = W_(t, 0.2, 1.4);
    hiveGlow.intensity = hiveOn * 0.07;
    led.visible = hiveOn > 0.15;

    const swOn = W_(t, 4.5, 5.7);
    ports.forEach((p, i) => { p.visible = swOn > (i + 1) / 9; });

    runs.forEach((r) => {
      /* the jacket is existing cable — present from the first frame */
      r.geo.setDrawRange(0, r.total);
      /* only the power travels */
      const gf = W_(t, r.from, r.to);
      r.glowGeo.setDrawRange(0, Math.floor(r.glowTotal * gf));

      /* Coverage read, raised 2026-08-19 — the client could not tell what each
         camera actually watches.

         The weight goes on the FLOOR footprint, not the volume. The cone is the
         part that turned into vivid green slabs under bloom, so it only comes up
         from 0.075 to 0.115; the disc and ring carry the meaning instead, and
         being flat on the floor they cannot stack into a haze the way overlapping
         cones do. */
      const live = gf >= 0.999;
      if (r.cam) {
        r.cam.led.visible = live;
        r.cam.cone.material.opacity = live ? 0.115 : 0;
        r.cam.ring.material.opacity = live ? 0.5 : 0;
        r.cam.disc.material.opacity = live ? 0.075 : 0;
      }
      if (r.dot) r.dot.visible = live;
    });

    /* --- the fall: topple about the heels ---
       Two things put the old fall through the floor. The arms swung
       -1.5 rad about their own X; once the body is face down that axis
       points straight into the ground, so the hands ended up buried.
       They now spread about Z instead, which after the topple is the
       floor plane, so they land beside the body where they belong.

       And the body rotates about its heels at y=0, which leaves its
       axis ON the floor and therefore half its thickness under it. It
       gets lifted by that half-thickness as it goes over. */
    const fk = clamp01((t - 17.9) / 0.85);
    const fe = fk * fk;                                  /* accelerating, like gravity */
    const R = faller.rest;
    faller.g.rotation.x = fe * (Math.PI / 2) * 0.98;
    faller.torso.rotation.x = Math.sin(fk * Math.PI) * 0.22 + fe * 0.05;
    const fallLift = smooth(clamp01((fe - 0.72) / 0.28)) * 0.125;       /* only once it is flattening */
    faller.armL.rotation.x = R.armLX * (1 - fe);         /* unwind out of the floor */
    faller.armR.rotation.x = R.armRX * (1 - fe);
    faller.armL.rotation.z = R.armLZ - fe * 1.02;        /* flung out, inside the floor plane */
    faller.armR.rotation.z = R.armRZ + fe * 0.88;
    faller.elbowL.rotation.x = R.elbowLX * (1 - fe);
    faller.elbowR.rotation.x = R.elbowRX * (1 - fe);
    faller.elbowL.rotation.z = -fe * 0.58;               /* the bend stays in the plane too */
    faller.elbowR.rotation.z =  fe * 0.44;
    faller.legL.rotation.x = R.legLX + fe * 0.25;
    faller.legR.rotation.x = R.legRX + fe * 0.18;
    faller.kneeL.rotation.x = R.kneeLX + fe * 0.34;      /* heels come up, so the toes clear */
    faller.kneeR.rotation.x = R.kneeRX + fe * 0.26;
    if (t < 17.7) {                                      /* small idle sway before it happens */
      faller.g.rotation.z = Math.sin(t * 1.1) * 0.012;
    }
    keepOnFloor(faller, fallLift);

    const fIn = W_(t, 18.8, 19.4);
    fallBox.g.visible = fIn > 0.02 && t < 21.9;
    fallBox.g.position.set(faller.home.x, 0.30, faller.home.z + 0.85);
    fallBox.cage.material.opacity = fIn;
    fallBox.fill.material.opacity = 0.05 * fIn;
    fallBox.chip.material.opacity = fIn;

    /* --- the theft: reach to the shelf, bring it in, move off --- */
    const reach   = W_(t, 22.9, 23.7);
    const conceal = W_(t, 23.9, 24.6);
    const leave   = W_(t, 25.0, 26.8);
    const T = thief.rest;
    thief.armR.rotation.x = T.armRX - reach * 1.35 + conceal * 1.15;
    thief.armR.rotation.z = T.armRZ + reach * 0.30 - conceal * 0.26;
    /* the elbow folds as the item comes in to the body — a straight arm
       reaching and returning is the motion that reads as a mannequin */
    thief.elbowR.rotation.x = T.elbowRX + reach * 0.20 - conceal * 1.05;
    thief.torso.rotation.x = reach * 0.16 - conceal * 0.16;
    thief.g.rotation.y = -0.5 + leave * 0.9;
    thief.g.position.z = thief.home.z + leave * 0.85;
    thief.armL.rotation.x = T.armLX + Math.sin(t * 2.2) * 0.06 - leave * 0.25;
    thief.elbowL.rotation.x = T.elbowLX - leave * 0.30;
    /* walking off: the legs have knees now, so use them */
    const stride = leave > 0.02 ? Math.sin(t * 5.2) : 0;
    thief.legL.rotation.x = T.legLX + stride * 0.34 * leave;
    thief.legR.rotation.x = T.legRX - stride * 0.34 * leave;
    thief.kneeL.rotation.x = T.kneeLX + Math.max(0, -stride) * 0.45 * leave;
    thief.kneeR.rotation.x = T.kneeRX + Math.max(0,  stride) * 0.45 * leave;

    keepOnFloor(thief, 0);

    const tIn = W_(t, 24.7, 25.3);
    theftBox.g.visible = tIn > 0.02;
    theftBox.g.position.set(thief.g.position.x, 0.90, thief.g.position.z);
    theftBox.cage.material.opacity = tIn;
    theftBox.fill.material.opacity = 0.05 * tIn;
    theftBox.chip.material.opacity = tIn;

    let c = 0;
    CHAPTERS.forEach((at, i) => { if (t >= at) c = i; });
    if (c !== chapter) {
      chapter = c;
      if (typeof host.onChapter === 'function') host.onChapter(c);
    }
  }

  /* The camera's 42 is a VERTICAL fov, so leaving it fixed means the
     horizontal field shrinks with the aspect ratio. On a phone held upright
     (390x726, aspect 0.54) that cropped the store to a narrow vertical slice —
     the shot was mostly empty floor and ceiling with the shelves and the
     counter pushed off both sides. It read as a dark wedge, not a room.

     So below 16:9 we hold the HORIZONTAL field constant and widen the vertical
     one to suit. The framing a phone gets is then the same width of store a
     laptop gets, just taller, which is what the camera path was composed for.
     Above 16:9 nothing changes. */
  const BASE_FOV = 42;
  const BASE_ASPECT = 16 / 9;
  const HALF_H_FOV = Math.atan(Math.tan((BASE_FOV * Math.PI) / 360) * BASE_ASPECT);

  /* Holding the horizontal field constant stops the store cropping to a slice,
     but on a phone it still framed tight: you got the same width of room a
     laptop gets, in a viewport a third as wide, with the copy overlaid on top
     of it. There was very little room left to actually see.

     So portrait also pulls back. The factor ramps in as the viewport narrows —
     nothing at 16:9, up to 1.32x horizontal field by 0.5 aspect (a phone held
     upright) — rather than switching at a breakpoint, so a tablet rotating
     through the middle does not jump. */
  const PORTRAIT_PULLBACK = 1.32;
  const PULLBACK_FLOOR = 0.5;

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;

    if (aspect >= BASE_ASPECT) {
      camera.fov = BASE_FOV;
    } else {
      /* 0 at 16:9, 1 at 0.5 and below */
      const t = Math.min(1, Math.max(0, (BASE_ASPECT - aspect) / (BASE_ASPECT - PULLBACK_FLOOR)));
      const halfH = Math.atan(Math.tan(HALF_H_FOV) * (1 + (PORTRAIT_PULLBACK - 1) * t));
      camera.fov = (2 * Math.atan(Math.tan(halfH) / aspect) * 180) / Math.PI;
    }
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let running = true;
  const clock = new THREE.Clock();

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);

    const raw = clock.getElapsedTime();
    /* ?t=<seconds> freezes the film on one beat — verification only */
    /* reduced motion parks on the whole-floor beat: every camera is
       live and every cable run has landed, so it is the one frame that
       carries the entire film */
    const t = FREEZE !== null ? FREEZE : (reduce ? 14.5 : raw % LOOP);

    apply(t);

    /* a hard cut back to a close-up would read as a glitch, so the
       seam dips through black the way a product loop does */
    const fade = reduce ? 0 : Math.max(1 - W_(t, 0.0, 0.9), W_(t, 27.1, 28.0));
    host.style.setProperty('--fade', fade.toFixed(3));

    /* the camera eases toward its keyed position rather than
       snapping, which is most of what makes the move feel shot */
    camera.position.lerp(camPos, (reduce || FREEZE !== null) ? 1 : 0.09);
    camera.lookAt(camTgt);

    /* dissolve the ceiling out as the shot rises through it */
    ceilMat.opacity = clamp01((CEIL_Y - camera.position.y) / 0.35);
    ceiling.visible = ceilMat.opacity > 0.01;

    if (!reduce) {
      fan.rotation.y = raw * 9.0;
      runs.forEach((r, n) => {
        if (!r.dot || !r.dot.visible) return;
        r.dot.position.copy(r.curve.getPointAt((raw * 0.18 + n * 0.31) % 1));
      });
      const b = 0.55 + Math.sin(raw * 3.1) * 0.45;
      led.material.color.setRGB(0, b, b * 0.53);
      /* the extras keep browsing all the way through the loop; they are the
         "normal" the fall and the theft are a departure from */
      idleBrowsers(clock.elapsedTime);
    }

    if (contextLost) return;
    renderer.render(scene, camera);

    /* the poster behind the canvas steps aside once there is a real frame to
       step aside for, and comes back if the context goes away */
    if (!host.dataset.film) host.dataset.film = 'ready';
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      const vis = es[0].isIntersecting;
      if (vis && !running) { running = true; frame(); }
      running = vis;
    }, { threshold: 0 }).observe(host);
  }

  frame();
}
