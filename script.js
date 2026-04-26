/* =========================================================
   Joel Shapiro Personal Site
   Small bits of life: typewriter dialog + animated stat bars
   ========================================================= */

(function () {
  'use strict';

  /* ---------- Typewriter on the about-me dialog ---------- */
  function setupTypewriter() {
    var paragraphs = document.querySelectorAll('[data-typewriter]');
    if (!paragraphs.length) return;

    // Cache the original text and clear it so the lines start empty.
    var queue = [];
    paragraphs.forEach(function (p) {
      queue.push({ el: p, text: p.textContent });
      p.textContent = '';
      p.style.minHeight = '1em';
    });

    var typed = false;
    function type() {
      if (typed) return;
      typed = true;
      var i = 0;
      function next() {
        if (i >= queue.length) return;
        var item = queue[i];
        var n = 0;
        function step() {
          if (n < item.text.length) {
            item.el.textContent += item.text.charAt(n);
            n++;
            setTimeout(step, 14);
          } else {
            i++;
            setTimeout(next, 220);
          }
        }
        step();
      }
      next();
    }

    // Trigger when the about section scrolls into view.
    var about = document.getElementById('about');
    if (!about || !('IntersectionObserver' in window)) {
      type();
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          type();
          obs.disconnect();
        }
      });
    }, { threshold: 0.25 });
    obs.observe(about);
  }

  /* ---------- Animate stat bars + skill stars when in view ---------- */
  function setupStatBars() {
    var bars = document.querySelectorAll('.bar, .stars');
    if (!bars.length) return;

    if (!('IntersectionObserver' in window)) {
      bars.forEach(function (b) {
        b.style.setProperty('--fill', (b.dataset.fill || '0') + '%');
      });
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var b = entry.target;
          // Stagger within the parent UL so each list cascades on its own.
          var idx = Array.prototype.indexOf.call(b.parentElement.parentElement.children, b.parentElement);
          setTimeout(function () {
            b.style.setProperty('--fill', (b.dataset.fill || '0') + '%');
          }, idx * 90);
          obs.unobserve(b);
        }
      });
    }, { threshold: 0.25 });

    bars.forEach(function (b) { obs.observe(b); });
  }

  /* ---------- Konami code easter egg ---------- */
  function setupKonami() {
    var seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    var pos = 0;
    document.addEventListener('keydown', function (e) {
      var key = e.key;
      if (key === seq[pos] || key.toLowerCase() === seq[pos]) {
        pos++;
        if (pos === seq.length) {
          pos = 0;
          var jolt = document.querySelector('.sprite.ampharos img');
          if (jolt) {
            jolt.style.transition = 'filter 0.4s';
            jolt.style.filter = 'drop-shadow(0 0 16px #f8c038) drop-shadow(0 0 32px #f8c038)';
            setTimeout(function () { jolt.style.filter = ''; }, 2000);
          }
        }
      } else {
        pos = 0;
      }
    });
  }

  /* ---------- Pokedex modal open / close ---------- */
  var lastFocused = null;

  function openDex(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var closeBtn = modal.querySelector('.dex-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeDex(modal) {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') {
      try { lastFocused.focus(); } catch (e) {}
    }
  }

  function setupDexModals() {
    var modals = document.querySelectorAll('.dex-modal');
    if (!modals.length) return;
    modals.forEach(function (m) {
      m.addEventListener('click', function (e) {
        var t = e.target;
        if (t && (t.matches('[data-close]') || t.closest('[data-close]'))) {
          closeDex(m);
        }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      modals.forEach(function (m) {
        if (m.getAttribute('aria-hidden') === 'false') closeDex(m);
      });
    });
  }

  /* ---------- Pokedex cursor + 2-second hold to scan ---------- */
  function setupPokedexCursor() {
    var scene = document.querySelector('.battle-scene');
    var cursor = document.querySelector('.dex-cursor');
    if (!scene || !cursor) return;

    var trainer = scene.querySelector('.sprite.trainer');
    var ampharos = scene.querySelector('.sprite.ampharos');
    if (!trainer && !ampharos) return;

    var HOLD_MS = 2000;
    var holdRAF = null;
    var holdStart = 0;
    var holdTarget = null;
    var holdModalId = null;

    // Disable JS cursor on coarse pointers (touch); fall back to tap-to-open.
    var isFinePointer = window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function targetFromEvent(e) {
      var path = e.target;
      if (trainer && trainer.contains(path)) {
        return { el: trainer, modal: 'dex-joel' };
      }
      if (ampharos && ampharos.contains(path)) {
        return { el: ampharos, modal: 'dex-ampharos' };
      }
      return null;
    }

    function placeCursor(x, y) {
      cursor.style.transform =
        'translate(' + x + 'px,' + y + 'px) rotate(-12deg) scale(' +
        (cursor.classList.contains('glow') ? 1.08 : 1) + ')';
    }

    function onSceneEnter() {
      if (!isFinePointer) return;
      cursor.classList.add('active');
    }
    function onSceneLeave() {
      cursor.classList.remove('active', 'glow', 'charging');
      cancelHold();
    }
    function onSceneMove(e) {
      if (!isFinePointer) return;
      placeCursor(e.clientX, e.clientY);
      var t = targetFromEvent(e);
      if (t) cursor.classList.add('glow');
      else   cursor.classList.remove('glow');
      // If we were holding and have wandered off the target, abort.
      if (holdTarget && (!t || t.el !== holdTarget)) cancelHold();
    }

    function startHold(e) {
      // Only respond to primary button (mouse) or any touch/pen.
      if (e.button !== undefined && e.button !== 0) return;
      var t = targetFromEvent(e);
      if (!t) return;
      e.preventDefault();
      holdTarget = t.el;
      holdModalId = t.modal;
      holdStart = performance.now();
      cursor.classList.add('charging');

      // Touch / coarse pointer: skip the 2s hold and just open on tap.
      if (!isFinePointer) {
        cancelHold();
        openDex(holdModalId);
        return;
      }

      function tick() {
        var p = (performance.now() - holdStart) / HOLD_MS;
        cursor.style.setProperty('--p', Math.min(p, 1) * 360 + 'deg');
        if (p >= 1) {
          var id = holdModalId;
          cancelHold();
          openDex(id);
          return;
        }
        holdRAF = requestAnimationFrame(tick);
      }
      holdRAF = requestAnimationFrame(tick);
    }

    function cancelHold() {
      if (holdRAF) cancelAnimationFrame(holdRAF);
      holdRAF = null;
      holdTarget = null;
      holdModalId = null;
      cursor.classList.remove('charging');
      cursor.style.setProperty('--p', '0deg');
    }

    scene.addEventListener('mouseenter', onSceneEnter);
    scene.addEventListener('mouseleave', onSceneLeave);
    scene.addEventListener('mousemove',  onSceneMove);
    scene.addEventListener('mousedown',  startHold);
    document.addEventListener('mouseup', cancelHold);
    window.addEventListener('blur', cancelHold);

    // Touch fallback so mobile users can still pop the dex.
    scene.addEventListener('touchstart', function (e) {
      var touch = e.touches && e.touches[0];
      if (!touch) return;
      var fakeEvt = { target: document.elementFromPoint(touch.clientX, touch.clientY), preventDefault: function () { e.preventDefault(); } };
      startHold(fakeEvt);
    }, { passive: false });

    // Suppress Ampharos link navigation while the cursor is in scan mode.
    var ampharosLink = ampharos && ampharos.querySelector('a');
    if (ampharosLink) {
      ampharosLink.addEventListener('click', function (e) {
        if (isFinePointer) e.preventDefault();
      });
    }
  }

  /* ---------- Scroll progress bar ---------- */
  function setupScrollProgress() {
    var bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    var rafPending = false;

    function update() {
      rafPending = false;
      var doc = document.documentElement;
      var max = (doc.scrollHeight || document.body.scrollHeight) - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      if (pct < 0) pct = 0;
      if (pct > 100) pct = 100;
      bar.style.width = pct + '%';
    }
    function onScroll() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- Scroll reveal ---------- */
  function setupReveal() {
    var els = document.querySelectorAll('.dialog-box, .battle-scene');
    if (!els.length) return;

    // Apply the hidden state via JS so noscript users still see the content.
    els.forEach(function (el) { el.classList.add('reveal'); });

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

    els.forEach(function (el) { obs.observe(el); });
  }

  /* ---------- Smooth nav anchor scroll with sticky-nav offset ---------- */
  function setupNavAnchors() {
    var nav = document.querySelector('.nav-pill');
    if (!nav) return;
    var links = nav.querySelectorAll('a[href^="#"]');
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        var navBottom = nav.getBoundingClientRect().bottom;
        var top = target.getBoundingClientRect().top + window.scrollY - navBottom - 12;
        window.scrollTo({ top: top, behavior: 'smooth' });
        history.replaceState(null, '', '#' + id);
      });
    });
  }

  /* ---------- Init ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupTypewriter();
      setupStatBars();
      setupKonami();
      setupDexModals();
      setupPokedexCursor();
      setupScrollProgress();
      setupReveal();
      setupNavAnchors();
    });
  } else {
    setupTypewriter();
    setupStatBars();
    setupKonami();
    setupDexModals();
    setupPokedexCursor();
    setupScrollProgress();
    setupReveal();
    setupNavAnchors();
  }
})();
