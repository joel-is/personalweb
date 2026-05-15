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
    // Restore the native cursor while a Pokedex modal is open so the close
    // button and content are easy to interact with.
    document.body.classList.add('dex-open');
    var closeBtn = modal.querySelector('.dex-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeDex(modal) {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Only drop the dex-open class once every Pokedex modal is closed.
    if (!document.querySelector('.dex-modal[aria-hidden="false"]')) {
      document.body.classList.remove('dex-open');
    }
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

  /* ---------- Pokedex cursor + hold-to-scan for project cards ---------- */
  function setupProjectScans() {
    var cards = document.querySelectorAll('.project-card');
    var cursor = document.querySelector('.dex-cursor');
    if (!cards.length || !cursor) return;

    var isFinePointer = window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    var HOLD_MS = 2000;
    var holdRAF = null;
    var holdStart = 0;
    var holdModalId = null;

    function placeCursor(x, y) {
      cursor.style.transform =
        'translate(' + x + 'px,' + y + 'px) rotate(-12deg) scale(' +
        (cursor.classList.contains('glow') ? 1.08 : 1) + ')';
    }

    function cancelHold() {
      if (holdRAF) cancelAnimationFrame(holdRAF);
      holdRAF = null;
      holdModalId = null;
      cursor.classList.remove('charging');
      cursor.style.setProperty('--p', '0deg');
    }

    cards.forEach(function (card) {
      var modalId = card.getAttribute('data-dex-target');

      card.addEventListener('mouseenter', function () {
        if (!isFinePointer) return;
        cursor.classList.add('active', 'glow');
      });

      card.addEventListener('mouseleave', function () {
        cursor.classList.remove('active', 'glow', 'charging');
        cancelHold();
      });

      card.addEventListener('mousemove', function (e) {
        if (!isFinePointer) return;
        placeCursor(e.clientX, e.clientY);
      });

      card.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        if (!isFinePointer) {
          openDex(modalId);
          gainXp(15);
          return;
        }
        holdModalId = modalId;
        holdStart = performance.now();
        cursor.classList.add('charging');

        function tick() {
          var p = (performance.now() - holdStart) / HOLD_MS;
          cursor.style.setProperty('--p', Math.min(p, 1) * 360 + 'deg');
          if (p >= 1) {
            var id = holdModalId;
            cancelHold();
            cursor.classList.remove('active', 'glow');
            openDex(id);
            gainXp(15);
            return;
          }
          holdRAF = requestAnimationFrame(tick);
        }
        holdRAF = requestAnimationFrame(tick);
      });

      card.addEventListener('touchstart', function (e) {
        var touch = e.touches && e.touches[0];
        if (!touch) return;
        e.preventDefault();
        openDex(modalId);
        gainXp(15);
      }, { passive: false });
    });

    document.addEventListener('mouseup', cancelHold);
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

  /* =========================================================
     Starter system: cursor, XP bar, evolution
     ========================================================= */

  // Each line: [base, mid, final]
  var EVO_LINES = {
    chimchar: ['chimchar', 'monferno', 'infernape'],
    turtwig:  ['turtwig',  'grotle',   'torterra'],
    piplup:   ['piplup',   'prinplup', 'empoleon']
  };
  var SPRITE_BASE = 'https://img.pokemondb.net/sprites/diamond-pearl/normal/';
  var STORAGE_KEY = 'joel-starter-state-v1';
  var XP_TO_EVOLVE = 100;

  function spriteUrl(name) { return SPRITE_BASE + name + '.png'; }

  var starterState = null; // { line, stage, xp }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !EVO_LINES[s.line]) return null;
      if (typeof s.stage !== 'number') s.stage = 0;
      if (typeof s.xp    !== 'number') s.xp = 0;
      s.stage = Math.max(0, Math.min(2, s.stage));
      s.xp    = Math.max(0, Math.min(XP_TO_EVOLVE, s.xp));
      return s;
    } catch (e) { return null; }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(starterState)); }
    catch (e) {}
  }
  function clearState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function currentSpriteName() {
    if (!starterState) return null;
    return EVO_LINES[starterState.line][starterState.stage];
  }
  function nextSpriteName() {
    if (!starterState || starterState.stage >= 2) return null;
    return EVO_LINES[starterState.line][starterState.stage + 1];
  }

  /* ---------- Cursor that follows the mouse globally ---------- */
  function setupStarterCursor() {
    var cursor = document.getElementById('starter-cursor');
    var img    = document.getElementById('starter-cursor-img');
    if (!cursor || !img) return;

    var isFinePointer = window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isFinePointer) return;

    var battle = document.querySelector('.battle-scene');
    var lastInBattle = false;

    function refresh() {
      if (!starterState) {
        cursor.classList.remove('active');
        document.body.classList.remove('starter-active');
        return;
      }
      img.src = spriteUrl(currentSpriteName());
      cursor.classList.add('active');
      document.body.classList.add('starter-active');
    }

    function onMove(e) {
      cursor.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      // Hide whenever the Pokedex cursor takes over (battle scene or project cards).
      var inBattle = battle && battle.contains(e.target);
      var inProject = !!e.target.closest && !!e.target.closest('.project-card');
      var shouldHide = inBattle || inProject;
      if (shouldHide !== lastInBattle) {
        cursor.classList.toggle('hidden', shouldHide);
        lastInBattle = shouldHide;
      }
    }
    function onLeave() {
      cursor.classList.add('hidden');
    }
    function onEnter() {
      cursor.classList.remove('hidden');
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    // Expose so other modules can refresh the displayed sprite after evolve.
    setupStarterCursor.refresh = refresh;
    refresh();
  }

  /* ---------- XP bar UI ---------- */
  function setupXpBar() {
    var bar     = document.getElementById('xp-bar');
    var sprite  = document.getElementById('xp-bar-sprite');
    var nameEl  = document.getElementById('xp-bar-name');
    var stageEl = document.getElementById('xp-bar-stage');
    var fillEl  = document.getElementById('xp-bar-fill');
    var pctEl   = document.getElementById('xp-bar-pct');
    var resetBtn = document.getElementById('xp-bar-reset');
    if (!bar || !fillEl) return;

    function render() {
      if (!starterState) {
        bar.classList.remove('shown');
        bar.setAttribute('aria-hidden', 'true');
        return;
      }
      var name = currentSpriteName();
      sprite.src = spriteUrl(name);
      nameEl.textContent = name.toUpperCase();
      stageEl.textContent = String(starterState.stage + 1);
      var atMax = starterState.stage >= 2;
      var pct = atMax ? 100 : Math.min(100, Math.round(starterState.xp));
      fillEl.style.width = pct + '%';
      pctEl.textContent = atMax ? 'MAX' : pct + '%';
      fillEl.classList.toggle('full', atMax);
      bar.classList.add('shown');
      bar.setAttribute('aria-hidden', 'false');
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (!confirm('Pick a different starter? Your current Pokemon will be retired.')) return;
        clearState();
        starterState = null;
        render();
        if (setupStarterCursor.refresh) setupStarterCursor.refresh();
        showStarterPicker();
      });
    }

    setupXpBar.render = render;
    render();
  }

  /* ---------- Award XP from interactions ---------- */
  var lastScrollXpTime = 0;
  var pendingEvolution = false;

  function gainXp(amount) {
    if (!starterState || pendingEvolution) return;
    if (starterState.stage >= 2) return; // already final form
    starterState.xp += amount;
    if (starterState.xp >= XP_TO_EVOLVE) {
      starterState.xp = XP_TO_EVOLVE;
      saveState();
      if (setupXpBar.render) setupXpBar.render();
      runEvolution();
    } else {
      saveState();
      if (setupXpBar.render) setupXpBar.render();
    }
  }

  function setupXpEarning() {
    // Scroll: small XP gain, throttled.
    window.addEventListener('scroll', function () {
      var now = Date.now();
      if (now - lastScrollXpTime < 220) return;
      lastScrollXpTime = now;
      gainXp(0.6);
    }, { passive: true });

    // Any click on the page: tiny gain.
    document.addEventListener('click', function (e) {
      // Skip clicks inside the starter modal (those are setup, not engagement).
      if (e.target.closest('.starter-modal')) return;
      // Bigger gain for clicks on real interactive things.
      var t = e.target.closest('a, button, .social-link, .nav-pill a, .pokeball-btn');
      gainXp(t ? 6 : 2);
    });

    // Resume download: jump straight to next stage.
    var resumeBtn = document.querySelector('a.pokeball-btn[download]');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', function () {
        if (!starterState) return;
        if (starterState.stage >= 2) return;
        // Force a level-up regardless of current XP.
        starterState.xp = XP_TO_EVOLVE;
        saveState();
        if (setupXpBar.render) setupXpBar.render();
        runEvolution();
      });
    }
  }

  /* ---------- Evolution animation ---------- */
  function runEvolution() {
    if (!starterState || pendingEvolution) return;
    if (starterState.stage >= 2) return;
    pendingEvolution = true;

    var overlay  = document.getElementById('evo-overlay');
    var spriteEl = document.getElementById('evo-sprite');
    var textEl   = document.getElementById('evo-text');
    if (!overlay || !spriteEl) {
      // Fallback: just bump the stage.
      starterState.stage += 1;
      starterState.xp = 0;
      saveState();
      if (setupXpBar.render) setupXpBar.render();
      if (setupStarterCursor.refresh) setupStarterCursor.refresh();
      pendingEvolution = false;
      return;
    }

    var oldName = currentSpriteName();
    var newName = nextSpriteName();
    spriteEl.src = spriteUrl(oldName);
    textEl.textContent = '';
    overlay.setAttribute('aria-hidden', 'false');

    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function flash() { overlay.classList.add('flashing'); }
    function unflash() { overlay.classList.remove('flashing'); }

    var t = 0;
    function step(delay, fn) {
      t += delay;
      setTimeout(fn, t);
    }

    if (reduceMotion) {
      // Skip dramatic effects: swap sprite immediately and close.
      starterState.stage += 1;
      starterState.xp = 0;
      saveState();
      spriteEl.src = spriteUrl(newName);
      textEl.textContent = oldName.toUpperCase() + ' evolved into ' + newName.toUpperCase() + '!';
      setTimeout(function () {
        overlay.setAttribute('aria-hidden', 'true');
        if (setupXpBar.render) setupXpBar.render();
        if (setupStarterCursor.refresh) setupStarterCursor.refresh();
        pendingEvolution = false;
      }, 1500);
      return;
    }

    // Choreography: silhouette toggles -> flash -> swap sprite -> reveal text.
    overlay.classList.add('silhouette');
    step(0,    function () { /* old as silhouette */ });
    step(280,  function () { overlay.classList.remove('silhouette'); });
    step(280,  function () { overlay.classList.add('silhouette'); });
    step(280,  function () { overlay.classList.remove('silhouette'); });
    step(280,  function () { overlay.classList.add('silhouette'); flash(); });
    step(420,  function () {
      // Big white-out: swap to the new sprite mid-flash, drop silhouette.
      spriteEl.src = spriteUrl(newName);
      overlay.classList.remove('silhouette');
      overlay.classList.add('morphing');
    });
    step(80,   function () { unflash(); });
    step(420,  function () {
      overlay.classList.remove('morphing');
      // Update state once the new sprite is on screen.
      starterState.stage += 1;
      starterState.xp = 0;
      saveState();
      textEl.textContent = oldName.toUpperCase() + ' evolved into ' + newName.toUpperCase() + '!';
    });
    step(2000, function () {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('flashing', 'morphing', 'silhouette');
      if (setupXpBar.render) setupXpBar.render();
      if (setupStarterCursor.refresh) setupStarterCursor.refresh();
      pendingEvolution = false;
    });
  }

  /* ---------- Starter picker modal ---------- */
  function showStarterPicker() {
    var modal = document.getElementById('starter-modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function hideStarterPicker() {
    var modal = document.getElementById('starter-modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function setupStarterPicker() {
    var modal = document.getElementById('starter-modal');
    if (!modal) return;
    var picks = modal.querySelectorAll('.starter-pick');
    picks.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var line = btn.getAttribute('data-starter');
        if (!EVO_LINES[line]) return;
        starterState = { line: line, stage: 0, xp: 0 };
        saveState();
        hideStarterPicker();
        if (setupXpBar.render) setupXpBar.render();
        if (setupStarterCursor.refresh) setupStarterCursor.refresh();
      });
    });
  }

  /* ---------- Init: starter system ---------- */
  function setupStarterSystem() {
    starterState = loadState();
    setupStarterPicker();
    setupStarterCursor();
    setupXpBar();
    setupXpEarning();
    if (!starterState) showStarterPicker();
  }

  /* ---------- Init ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupTypewriter();
      setupStatBars();
      setupKonami();
      setupDexModals();
      setupPokedexCursor();
      setupProjectScans();
      setupScrollProgress();
      setupReveal();
      setupNavAnchors();
      setupStarterSystem();
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
    setupStarterSystem();
  }
})();
