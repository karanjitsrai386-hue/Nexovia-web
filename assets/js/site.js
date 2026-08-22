/* ============================================================
   NEXOVIA — site behaviour
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------- Scroll reveal ---------- */
  var rvs = document.querySelectorAll('.rv');
  if (rvs.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      rvs.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
      rvs.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        cio.unobserve(el);
        var target = parseFloat(el.getAttribute('data-count'));
        var dur = 1200;
        var t0 = performance.now();
        var step = function (t) {
          var p = Math.min((t - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = target * eased;
          el.textContent = target % 1 === 0 ? Math.round(val) : val.toFixed(1);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Detection tabs ---------- */
  /* The detection tabs stay hand-rolled rather than moving to the Watermelon
     `tabs` primitive (PLAN.md phase 6 ranked that swap #2 and called it a
     "straight swap" — measured, it is not). This widget's whole job is the
     video coupling below: the selected pane plays, every other pane pauses,
     which keeps three <video preload="none"> elements from all decoding at
     once. Radix Tabs does not do that, so a swap means re-adding it by hand
     against a hydrated React island, on the homepage, for one widget on one
     page. What the hand-rolled version was actually missing was ARIA wiring,
     which is cheaper to add than to migrate.

     Wired here rather than in the markup so the four tiles stay plain HTML. */
  document.querySelectorAll('[data-tabs]').forEach(function (group, gi) {
    var tabs = group.querySelectorAll('.det-tab');
    var panes = group.querySelectorAll('.det-pane');

    /* tab <-> panel association: a screen reader could previously see the tabs
       and the panes but nothing tying them together, and the panes were not
       announced as panels at all. */
    tabs.forEach(function (t, i) {
      var tid = 'nx-tab-' + gi + '-' + i;
      var pid = 'nx-panel-' + gi + '-' + i;
      t.id = tid;
      t.setAttribute('aria-controls', pid);
      if (panes[i]) {
        panes[i].id = pid;
        panes[i].setAttribute('role', 'tabpanel');
        panes[i].setAttribute('aria-labelledby', tid);
      }
    });

    var select = function (idx) {
      tabs.forEach(function (t, i) {
        var on = i === idx;
        t.setAttribute('aria-selected', String(on));
        /* roving tabindex: only the selected tab is in the tab order, so Tab
           moves past the tablist to the panel instead of stopping on all four */
        t.tabIndex = on ? 0 : -1;
      });
      panes.forEach(function (p, i) {
        p.hidden = i !== idx;
        var v = p.querySelector('video');
        if (!v) return;
        if (i === idx) { v.play().catch(function () {}); }
        else { v.pause(); }
      });
    };

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); tabs[n].focus(); select(n); }
      });
    });

    select(0);
  });

  /* ---------- Lazy-play videos only when visible ---------- */
  var vids = document.querySelectorAll('video[data-autoplay]');
  if (vids.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (v.closest('.det-pane') && v.closest('.det-pane').hidden) return;
        if (e.isIntersecting) { v.play().catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* ---------- FAQ accordion ---------- */
  /* FAQ disclosure.

     The markup already carried aria-expanded and aria-controls, so this is not
     the usual "no ARIA at all" case. The gap was the collapse technique: panels
     close via `grid-template-rows: 0fr` with `overflow: hidden`, which hides
     them visually but leaves the content in the accessibility tree. A screen
     reader still walked all ten answers whether or not they were open.

     `inert` fixes exactly that — it takes the subtree out of the a11y tree and
     the tab order while leaving it in layout, so the 0fr/1fr height transition
     still animates. `hidden` would have killed the animation.

     Checked before writing this: there are no anchors or controls inside any
     panel, so nothing was tab-reachable while closed. This is a screen-reader
     correctness fix, not a focus-trap fix. */
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    var inner = panel.firstElementChild || panel;

    /* Point the panel back at its question, so a screen reader announcing the
       region says which one it belongs to. */
    if (!btn.id) btn.id = btn.getAttribute('aria-controls') + '-q';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', btn.id);

    var set = function (open) {
      btn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('open', open);
      inner.inert = !open;
    };

    set(btn.getAttribute('aria-expanded') === 'true');

    btn.addEventListener('click', function () {
      set(btn.getAttribute('aria-expanded') !== 'true');
    });
  });

  /* ---------- Live HUD clock on feed mocks ---------- */
  document.querySelectorAll('[data-clock]').forEach(function (el) {
    if (reduce) return;
    var s = 0;
    setInterval(function () {
      s++;
      var m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      var sec = String(s % 60).padStart(2, '0');
      var f = String(Math.floor(Math.random() * 30)).padStart(2, '0');
      el.textContent = '00:' + m + ':' + sec + ':' + f;
    }, 1000);
  });

  /* ---------- Contact form (no backend yet → mailto handoff) ---------- */
  /* Contact form.

     This used to be mailto-only: build a mailto: URL, navigate to it, then
     reveal a note. The enquiry therefore only arrived if the visitor had a mail
     client configured AND pressed send in it — on desktop Chrome with none set
     up, the click did nothing at all. It now POSTs to a Pages Function and only
     claims success when that function says so. mailto survives as the fallback
     for when the endpoint is unconfigured or down. */
  document.querySelectorAll('form[data-contact]').forEach(function (form) {
    var btn = form.querySelector('[data-submit]');
    var label = btn ? btn.textContent : '';

    function show(which) {
      form.querySelectorAll('.form-msg').forEach(function (m) { m.hidden = true; });
      var el = form.querySelector('.form-' + which);
      if (el) el.hidden = false;
    }

    function mailtoFallback() {
      var to = form.getAttribute('data-mailto');
      if (!to) return;
      var d = new FormData(form);
      var subject = 'Nexovia demo request — ' + (d.get('company') || d.get('name') || 'new enquiry');
      var body = [];
      d.forEach(function (v, k) {
        if (k !== 'website' && String(v).trim()) {
          body.push(k.replace(/_/g, ' ').toUpperCase() + ':\n' + v + '\n');
        }
      });
      window.location.href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body.join('\n'));
    }

    form.addEventListener('submit', function (e) {
      /* Let the browser run native validation first — the fields carry
         `required` and type=email, so there is no reason to reimplement it. */
      if (!form.checkValidity()) return;
      e.preventDefault();

      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      form.querySelectorAll('.form-msg').forEach(function (m) { m.hidden = true; });

      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { accept: 'application/json' } })
        .then(function (res) {
          return res.json().catch(function () { return { ok: res.ok }; });
        })
        .then(function (data) {
          var reason = data && data.reason;
          if (data && data.ok) {
            show('ok');
            form.reset();
            return;
          }
          /* Their input is wrong — do not open a mail client, they should fix
             the field. In practice native validation catches these first. */
          if (reason === 'missing-required' || reason === 'bad-email' ||
              reason === 'too-long' || reason === 'bad-request') {
            show('err');
            return;
          }
          /* Everything else is our fault, not theirs: no provider key yet,
             the provider failed, or the function is not deployed and we got a
             404. In all of those the visitor still deserves a working route,
             so open the mail client and say plainly that we could not send. */
          show('fallback');
          mailtoFallback();
        })
        .catch(function () {
          /* Offline, or the function is not deployed — same honest fallback. */
          show('fallback');
          mailtoFallback();
        })
        .then(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
    });
  });

})();

/* ============================================================
   Signal path — click a stage  (2026-08-22)
   ============================================================

   Replaces the scroll-scrub that used to drive this section. See the markup
   comment in src/pages/index.astro for why.

   Element-guarded like everything else in this file, because Base.astro
   re-executes these scripts on every client-side navigation and the homepage
   is not the only page that loads them. */
(function () {
  'use strict';

  document.querySelectorAll('[data-path]').forEach(function (rig) {
    var tabs = [].slice.call(rig.querySelectorAll('.path-seg'));
    var legs = [].slice.call(rig.querySelectorAll('.path-leg'));
    var art  = rig.querySelector('[data-flow]');
    if (!tabs.length || tabs.length !== legs.length) return;

    function select(i) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        /* roving tabindex: only the selected tab is in the tab order, so Tab
           leaves the group rather than walking all five. */
        t.tabIndex = on ? 0 : -1;
        legs[k].hidden = !on;
      });
      if (art) art.setAttribute('data-active', String(i + 1));
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
    });

    /* Arrow keys move between stages, which is what a tablist owes a keyboard
       user — and Home/End jump to the ends of the path. */
    rig.querySelector('.path-bar').addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      select(next);
      tabs[next].focus();
    });

    select(0);
  });
})();
