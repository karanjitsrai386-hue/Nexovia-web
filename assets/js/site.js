/* ============================================================
   NEXOVIA — site behaviour
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav: scrolled state ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Nav: mobile toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var mobile = document.querySelector('.nav-mobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', function () {
      var open = mobile.classList.toggle('open');
      toggle.textContent = open ? 'CLOSE' : 'MENU';
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- Active nav link ---------- */
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === here) a.classList.add('active');
  });

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
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', String(!open));
      if (panel) panel.classList.toggle('open', !open);
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
  document.querySelectorAll('form[data-mailto]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var to = form.getAttribute('data-mailto');
      var d = new FormData(form);
      var subject = 'Nexovia demo request — ' + (d.get('company') || d.get('name') || 'new enquiry');
      var body = [];
      d.forEach(function (v, k) {
        if (String(v).trim()) body.push(k.replace(/_/g, ' ').toUpperCase() + ':\n' + v + '\n');
      });
      window.location.href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body.join('\n'));

      var note = form.querySelector('.form-sent');
      if (note) note.hidden = false;
    });
  });

})();
