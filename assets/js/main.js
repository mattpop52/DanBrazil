/* =========================================================================
   DANIEL BRAZIL — recording studio
   Vanilla JS. No dependencies, no build step.

   Everything scroll-driven shares ONE rAF loop and ONE IntersectionObserver
   pool, so the page stays cheap. Every effect is a no-op when the user has
   asked for reduced motion, and none of them are required to read the page.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var desktop = window.matchMedia('(min-width: 1200px)');

  // Safari only grew addEventListener on MediaQueryList in 14.
  function onMediaChange(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  var prefersReduced = reduce.matches;
  onMediaChange(reduce, function (e) {
    prefersReduced = e.matches;
    root.classList.toggle('reduce-motion', e.matches);
  });

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------------------------------------------------------------------
     Shared rAF loop. Register a function; it runs once per frame while at
     least one subscriber is active.
     --------------------------------------------------------------------- */
  var frameTasks = [];
  var frameQueued = false;
  var lastTime = 0;

  function onFrame(fn) { frameTasks.push(fn); requestFrame(); }

  function requestFrame() {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(tick);
  }

  function tick(now) {
    frameQueued = false;
    var dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
    lastTime = now;
    for (var i = 0; i < frameTasks.length; i++) frameTasks[i](dt, now);
    if (frameTasks.length) {
      frameQueued = true;
      requestAnimationFrame(tick);
    }
  }

  /* Scroll bookkeeping — read once per frame, never inside listeners. */
  var scrollY = window.pageYOffset;
  var viewH = window.innerHeight;
  var docH = document.documentElement.scrollHeight;

  window.addEventListener('scroll', function () { scrollY = window.pageYOffset; }, { passive: true });
  window.addEventListener('resize', function () {
    viewH = window.innerHeight;
    docH = document.documentElement.scrollHeight;
  }, { passive: true });

  /* =====================================================================
     1. Environment flags
     ===================================================================== */
  function initFlags() {
    if (finePointer.matches) root.classList.add('has-fine-pointer');
    onMediaChange(finePointer, function (e) {
      root.classList.toggle('has-fine-pointer', e.matches);
    });
  }

  /* =====================================================================
     2. Loader — never blocks for long, skipped under reduced motion
     ===================================================================== */
  function initLoader() {
    var loader = $('#loader');
    if (!loader) return;

    if (prefersReduced) { loader.remove(); return; }

    var countEl = $('#loaderCount');
    var barEl = $('#loaderBar');
    var value = 0;
    var pageLoaded = false;
    var start = performance.now();
    var MAX_MS = 900;

    window.addEventListener('load', function () { pageLoaded = true; });

    var timer = setInterval(function () {
      var elapsed = performance.now() - start;
      // Race to 100: whichever happens first, page load or the hard cap.
      var ceiling = pageLoaded || elapsed > MAX_MS ? 100 : 92;
      value = Math.min(ceiling, value + Math.random() * 11 + 4);
      var shown = Math.round(value);
      if (countEl) countEl.textContent = shown;
      if (barEl) barEl.style.width = shown + '%';

      if (value >= 100) {
        clearInterval(timer);
        setTimeout(function () {
          loader.classList.add('is-done');
          root.classList.add('is-loaded');
          setTimeout(function () { loader.remove(); }, 700);
        }, 160);
      }
    }, 90);

    // Belt and braces: if anything above goes wrong, the loader still leaves.
    setTimeout(function () {
      clearInterval(timer);
      if (document.body.contains(loader)) {
        loader.classList.add('is-done');
        setTimeout(function () { loader.remove(); }, 700);
      }
    }, MAX_MS + 2200);
  }

  /* =====================================================================
     3. Header — solid past the hero, hides on scroll down
     ===================================================================== */
  function initHeader() {
    var header = $('#header');
    if (!header) return;

    var prev = scrollY;
    var menuOpen = function () { return document.body.classList.contains('is-locked'); };

    onFrame(function () {
      var y = scrollY;
      header.classList.toggle('is-solid', y > 40);

      var goingDown = y > prev && y - prev > 2;
      var goingUp = y < prev - 2;

      if (menuOpen()) header.classList.remove('is-hidden');
      else if (goingDown && y > 400) header.classList.add('is-hidden');
      else if (goingUp) header.classList.remove('is-hidden');

      prev = y;
    });
  }

  /* =====================================================================
     4. Scroll progress bar
     ===================================================================== */
  function initProgress() {
    var bar = $('#scrollProgress');
    if (!bar) return;
    var since = 0;
    onFrame(function (dt) {
      // Page height changes when accordions open — re-measure a few times a
      // second rather than every frame.
      since += dt;
      if (since > 0.25) { since = 0; docH = document.documentElement.scrollHeight; }
      var max = Math.max(1, docH - viewH);
      bar.style.width = clamp(scrollY / max, 0, 1) * 100 + '%';
    });
  }

  /* =====================================================================
     5. Mobile menu
     ===================================================================== */
  function initMenu() {
    var burger = $('#burger');
    var menu = $('#mobileMenu');
    if (!burger || !menu) return;

    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      menu.classList.add('is-open');
      menu.removeAttribute('inert');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('is-locked');
      var first = $('a', menu);
      if (first) setTimeout(function () { first.focus(); }, 220);
    }

    function close() {
      menu.classList.remove('is-open');
      menu.setAttribute('inert', '');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('is-locked');
      if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();
    }

    burger.addEventListener('click', function () {
      burger.getAttribute('aria-expanded') === 'true' ? close() : open();
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) close();
    });

    // If the viewport grows past mobile while the menu is open, tidy up.
    onMediaChange(window.matchMedia('(min-width: 810px)'), function (e) {
      if (e.matches && menu.classList.contains('is-open')) close();
    });
  }

  /* =====================================================================
     6. Scroll reveal — one observer for every [data-reveal]
     ===================================================================== */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (prefersReduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    items.forEach(function (el) {
      var d = el.getAttribute('data-reveal-delay');
      if (d) el.style.setProperty('--reveal-delay', d + 'ms');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* =====================================================================
     7. Statement — character-by-character reveal against scroll progress
     ===================================================================== */
  function initCharReveal() {
    var el = $('[data-char-reveal]');
    if (!el) return;

    var text = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', text);

    if (prefersReduced) return;

    // Split into words so nothing breaks mid-word, and into characters so
    // each one can light independently. The spans are hidden from AT — the
    // container's aria-label carries the sentence.
    var frag = document.createDocumentFragment();
    var accentFrom = text.indexOf('—');
    if (accentFrom < 0) accentFrom = text.length;

    var chars = [];
    var words = text.split(' ');
    var cursor = 0;

    words.forEach(function (word, wi) {
      var wordEl = document.createElement('span');
      wordEl.className = 'db-word';
      wordEl.style.display = 'inline-block';
      wordEl.style.whiteSpace = 'nowrap';

      for (var i = 0; i < word.length; i++) {
        var c = document.createElement('span');
        c.className = 'db-char' + (cursor + i > accentFrom ? ' is-accent' : '');
        c.setAttribute('aria-hidden', 'true');
        c.textContent = word[i];
        wordEl.appendChild(c);
        chars.push(c);
      }
      frag.appendChild(wordEl);
      cursor += word.length + 1;

      if (wi < words.length - 1) {
        var sp = document.createElement('span');
        sp.className = 'db-char';
        sp.setAttribute('aria-hidden', 'true');
        sp.textContent = ' ';
        frag.appendChild(sp);
        chars.push(sp);
      }
    });

    el.textContent = '';
    el.appendChild(frag);

    var lit = -1;

    onFrame(function () {
      var rect = el.getBoundingClientRect();
      // 0 when the block's top reaches 78% of the viewport,
      // 1 when its bottom passes 32% — a comfortable read-along.
      var startAt = viewH * 0.78;
      var endAt = viewH * 0.32;
      var span = (rect.height + (startAt - endAt)) || 1;
      var progress = clamp((startAt - rect.top) / span, 0, 1);

      var target = Math.round(progress * chars.length);
      if (target === lit) return;

      if (target > lit) {
        for (var i = Math.max(lit, 0); i < target; i++) chars[i].classList.add('is-lit');
      } else {
        for (var j = lit - 1; j >= target; j--) if (chars[j]) chars[j].classList.remove('is-lit');
      }
      lit = target;
    });
  }

  /* =====================================================================
     8. Marquees — duplicated track, constant px/s regardless of width
     ===================================================================== */
  function initMarquees() {
    $$('[data-marquee]').forEach(function (marquee) {
      var track = $('.db-marquee__track', marquee);
      var group = $('.db-marquee__group', track);
      if (!track || !group) return;

      if (prefersReduced) return;

      var speed = parseFloat(marquee.getAttribute('data-speed')) || 40;   // px per second
      var reversed = marquee.getAttribute('data-direction') === 'reverse';
      var groupWidth = 0;
      var offset = 0;
      var paused = false;

      function fill() {
        // Reset to a single group, then clone until we cover 2x the viewport.
        while (track.children.length > 1) track.removeChild(track.lastChild);
        groupWidth = group.getBoundingClientRect().width;
        if (!groupWidth) return;
        var needed = Math.ceil((window.innerWidth * 2) / groupWidth) + 1;
        for (var i = 1; i < needed; i++) {
          var clone = group.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
        }
      }

      fill();
      window.addEventListener('resize', debounce(fill, 200), { passive: true });

      // The group is measured with whatever font is active. Re-measure once the
      // webfont has swapped in, or the loop seam lands in the wrong place.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { offset = 0; fill(); });
      }

      marquee.addEventListener('pointerenter', function () { paused = true; });
      marquee.addEventListener('pointerleave', function () { paused = false; });
      marquee.addEventListener('pointercancel', function () { paused = false; });

      onFrame(function (dt) {
        if (paused || !groupWidth) return;
        // Only animate what is on screen.
        var rect = marquee.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > viewH + 200) return;

        offset += speed * dt;
        if (offset >= groupWidth) offset -= groupWidth;
        var x = reversed ? offset - groupWidth : -offset;
        track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      });
    });
  }

  /* =====================================================================
     9. Photo ticker — drifts on its own, accelerates while the page is
        scrolling, and can be dragged. Ported from the reference's mechanics,
        minus its wheel hijack (which trapped the page scroll).
     ===================================================================== */
  function initTickers() {
    $$('[data-ticker]').forEach(function (ticker) {
      var track = $('.db-ticker__track', ticker);
      if (!track) return;

      var originals = $$('.db-polaroid', track);
      if (!originals.length) return;

      // Deterministic tilt, so the layout is identical on every load.
      var maxTilt = parseFloat(ticker.getAttribute('data-tilt')) || 8;
      function tiltFor(i) {
        return ((Math.sin(i * 123.456) * maxTilt) - maxTilt / 2) * 0.5;
      }
      originals.forEach(function (el, i) {
        el.style.setProperty('--tilt', tiltFor(i).toFixed(2) + 'deg');
      });

      if (prefersReduced) return;

      var baseSpeed = parseFloat(ticker.getAttribute('data-speed')) || 50;  // px/s
      var cycle = 0;
      var offset = 0;
      var boost = 0;
      var boostTimer = null;
      var paused = false;
      var clones = [];

      function measure() {
        clones.forEach(function (c) { c.remove(); });
        clones = [];

        var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        cycle = originals.reduce(function (sum, el) {
          return sum + el.getBoundingClientRect().width + gap;
        }, 0);
        if (!cycle) return;

        // Enough copies to cover the strip twice over, so the seam never shows.
        var copies = Math.ceil((window.innerWidth * 2) / cycle) + 1;
        for (var c = 0; c < copies; c++) {
          originals.forEach(function (el, i) {
            var clone = el.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            clone.style.setProperty('--tilt', tiltFor(i + (c + 1) * originals.length).toFixed(2) + 'deg');
            $$('a, button', clone).forEach(function (f) { f.setAttribute('tabindex', '-1'); });
            track.appendChild(clone);
            clones.push(clone);
          });
        }
      }

      measure();
      window.addEventListener('resize', debounce(function () { offset = 0; measure(); }, 200), { passive: true });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { offset = 0; measure(); });
      }

      // Scrolling the page speeds the strip up, decaying back after 150ms idle.
      var lastY = scrollY;
      window.addEventListener('scroll', function () {
        boost = Math.min(Math.abs(window.pageYOffset - lastY) * 2, 900);
        lastY = window.pageYOffset;
        clearTimeout(boostTimer);
        boostTimer = setTimeout(function () { boost = 0; }, 150);
      }, { passive: true });

      ticker.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'touch') paused = true;
      });
      ticker.addEventListener('pointerleave', function () { paused = false; });

      // Drag to scrub.
      var dragging = false, dragStart = 0, dragFrom = 0, pointerId = null;

      ticker.addEventListener('pointerdown', function (e) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        dragging = true;
        pointerId = e.pointerId;
        dragStart = e.clientX;
        dragFrom = offset;
        ticker.classList.add('is-dragging');
        ticker.setPointerCapture(e.pointerId);
      });

      ticker.addEventListener('pointermove', function (e) {
        if (!dragging || e.pointerId !== pointerId) return;
        offset = dragFrom - (e.clientX - dragStart);
        if (cycle) offset = ((offset % cycle) + cycle) % cycle;
      });

      function endDrag(e) {
        if (!dragging || (e && e.pointerId !== pointerId)) return;
        dragging = false;
        pointerId = null;
        ticker.classList.remove('is-dragging');
      }
      ticker.addEventListener('pointerup', endDrag);
      ticker.addEventListener('pointercancel', endDrag);

      onFrame(function (dt) {
        if (!cycle) return;
        var rect = ticker.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > viewH + 200) return;   // off screen, skip

        if (!paused && !dragging) {
          offset += (baseSpeed + boost) * dt;
          if (offset >= cycle) offset -= cycle;
        }
        track.style.transform = 'translate3d(' + (-offset).toFixed(2) + 'px,0,0)';
      });
    });
  }

  /* =====================================================================
     10. Equipment panels — expanding columns on desktop, accordion below
     ===================================================================== */
  function initPanels() {
    var wrap = $('#equipPanels');
    if (!wrap) return;

    var panels = $$('[data-panel]', wrap);

    function setOpen(panel, open) {
      panel.classList.toggle('is-open', open);
      var tab = $('.db-panel__tab', panel);
      if (tab) tab.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    panels.forEach(function (panel) {
      var tab = $('.db-panel__tab', panel);
      if (!tab) return;

      tab.addEventListener('click', function () {
        var isOpen = panel.classList.contains('is-open');

        // On desktop the row always shows one open panel; closing the only
        // open one would leave an empty strip, so that click is a no-op.
        if (isOpen && desktop.matches) return;

        panels.forEach(function (p) { setOpen(p, false); });
        setOpen(panel, !isOpen || desktop.matches);
      });

      // Hovering a closed column on desktop opens it — same as the tabs
      // pattern on the reference site, but click still works for keyboards.
      tab.addEventListener('pointerenter', function (e) {
        if (!desktop.matches || e.pointerType === 'touch') return;
        if (panel.classList.contains('is-open')) return;
        panels.forEach(function (p) { setOpen(p, p === panel); });
      });
    });

    onMediaChange(desktop, function (e) {
      if (e.matches && !$('.db-panel.is-open', wrap)) setOpen(panels[0], true);
    });
  }

  /* =====================================================================
     11. FAQ accordion
     ===================================================================== */
  function initAccordion() {
    $$('[data-acc]').forEach(function (item) {
      var btn = $('.db-acc__q', item);
      if (!btn) return;
      btn.addEventListener('click', function () {
        var open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  /* =====================================================================
     12. Parallax — hero media and anything with [data-parallax]
     ===================================================================== */
  function initParallax() {
    var heroImg = $('.db-hero__media img');
    var items = $$('[data-parallax]');
    if (prefersReduced || (!heroImg && !items.length)) return;

    onFrame(function () {
      if (heroImg) {
        var p = clamp(scrollY / Math.max(viewH, 1), 0, 1);
        heroImg.style.transform =
          'translate3d(0,' + (p * 14).toFixed(2) + '%,0) scale(' + (1.08 - p * 0.06).toFixed(4) + ')';
      }

      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > viewH + 100) continue;
        var amount = parseFloat(el.getAttribute('data-parallax')) || 0;
        var centre = rect.top + rect.height / 2;
        var offset = (centre - viewH / 2) * amount;
        var target = el.tagName === 'FIGURE' ? $('img', el) || el : el;
        target.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)';
      }
    });
  }

  /* =====================================================================
     13. Custom cursor + magnetic buttons (fine pointers only)
     ===================================================================== */
  function initCursor() {
    if (!finePointer.matches || prefersReduced) return;

    var dot = $('#cursorDot');
    var ring = $('#cursorRing');
    if (!dot || !ring) return;

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    var seen = false;

    // Stay invisible until the pointer actually moves, so the dot never
    // parks itself in the middle of the hero on a fresh load.
    dot.style.opacity = ring.style.opacity = '0';

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      mx = e.clientX; my = e.clientY;
      if (!seen) {
        rx = mx; ry = my; seen = true;
        dot.style.opacity = ring.style.opacity = '1';
      }
    }, { passive: true });

    document.addEventListener('pointerover', function (e) {
      if (!e.target.closest) return;
      var hot = e.target.closest('a, button, [data-magnetic], input, select, textarea, summary');
      ring.classList.toggle('is-hot', !!hot);
    });

    onFrame(function () {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px,0)';
    });
  }

  function initMagnetic() {
    if (!finePointer.matches || prefersReduced) return;

    $$('[data-magnetic]').forEach(function (el) {
      var raf = null;

      el.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = el.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
          var dy = (e.clientY - (r.top + r.height / 2)) * 0.32;
          el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
        });
      });

      function release() {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        el.style.transform = '';
      }
      el.addEventListener('pointerleave', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('blur', release);
    });
  }

  /* =====================================================================
     14. Active nav link
     ===================================================================== */
  function initScrollSpy() {
    var links = $$('.db-nav__link');
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    links.forEach(function (link) {
      var id = link.getAttribute('href');
      if (id && id.charAt(0) === '#' && id.length > 1) {
        var section = document.getElementById(id.slice(1));
        if (section) map[id.slice(1)] = link;
      }
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-current'); });
          link.classList.add('is-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* =====================================================================
     15. Booking form — posts to an endpoint if one is set, otherwise
         falls back to a pre-filled email.
     ===================================================================== */
  function initForm() {
    var form = $('#bookingForm');
    if (!form) return;

    var status = $('#formStatus');
    var submit = $('button[type="submit"]', form);

    function setError(field, on) {
      var wrap = field.closest('.db-field');
      if (wrap) wrap.classList.toggle('has-error', on);
      var msg = form.querySelector('[data-error-for="' + field.id + '"]');
      if (msg) msg.hidden = !on;
      field.setAttribute('aria-invalid', on ? 'true' : 'false');
    }

    function validate() {
      var bad = null;
      $$('[required]', form).forEach(function (field) {
        var ok = field.value.trim() !== '' && field.checkValidity();
        setError(field, !ok);
        if (!ok && !bad) bad = field;
      });
      return bad;
    }

    $$('[required]', form).forEach(function (field) {
      field.addEventListener('input', function () {
        if (field.closest('.db-field').classList.contains('has-error')) {
          setError(field, !(field.value.trim() !== '' && field.checkValidity()));
        }
      });
    });

    function say(msg, tone) {
      if (!status) return;
      status.textContent = msg;
      status.classList.toggle('is-ok', tone === 'ok');
      status.classList.toggle('is-bad', tone === 'bad');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (form.querySelector('[name="company"]') && form.querySelector('[name="company"]').value) return;

      var bad = validate();
      if (bad) { say('Please check the highlighted fields.', 'bad'); bad.focus(); return; }

      var data = new FormData(form);
      data.delete('company');
      var endpoint = form.getAttribute('data-endpoint');

      if (endpoint) {
        if (submit) submit.disabled = true;
        say('Sending…', '');
        fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (res) {
            if (!res.ok) throw new Error(res.status);
            form.reset();
            say('Thanks — I’ll come back to you within two working days.', 'ok');
          })
          .catch(function () {
            say('That didn’t send. Please email me directly instead.', 'bad');
          })
          .finally(function () { if (submit) submit.disabled = false; });
        return;
      }

      // No endpoint configured: hand off to the visitor's mail client.
      var to = form.getAttribute('data-mailto') || '';
      var subject = 'Studio enquiry — ' + (data.get('service') || 'General');
      var message = String(data.get('message') || '');
      // Browsers cap mailto: URLs around 2000 characters. Keep well inside that
      // and tell the visitor rather than silently losing the end of their note.
      var trimmed = message.length > 1200;
      if (trimmed) message = message.slice(0, 1200) + '\n\n[…continued — please paste the rest]';

      var body = [
        'Name: ' + (data.get('name') || ''),
        'Email: ' + (data.get('email') || ''),
        'Service: ' + (data.get('service') || ''),
        'Preferred dates: ' + (data.get('dates') || '—'),
        '',
        message
      ].join('\n');

      window.location.href =
        'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      say(trimmed
        ? 'Opening your email app — your message was long, so please check nothing is missing.'
        : 'Opening your email app…', 'ok');
    });
  }

  /* =====================================================================
     16. Odds and ends
     ===================================================================== */
  function initYear() {
    var el = $('#year');
    if (el) el.textContent = new Date().getFullYear();
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  /* =====================================================================
     Boot
     ===================================================================== */
  function boot() {
    initFlags();
    initLoader();
    initHeader();
    initProgress();
    initMenu();
    initReveal();
    initCharReveal();
    initMarquees();
    initTickers();
    initPanels();
    initAccordion();
    initParallax();
    initCursor();
    initMagnetic();
    initScrollSpy();
    initForm();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
