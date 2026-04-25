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

  /* ---------- Animate stat bars when in view ---------- */
  function setupStatBars() {
    var bars = document.querySelectorAll('.bar');
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
          // Tiny stagger for a satisfying cascade.
          var idx = Array.prototype.indexOf.call(b.parentElement.parentElement.children, b.parentElement);
          setTimeout(function () {
            b.style.setProperty('--fill', (b.dataset.fill || '0') + '%');
          }, idx * 120);
          obs.unobserve(b);
        }
      });
    }, { threshold: 0.4 });

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
          var jolt = document.querySelector('.sprite.jolteon img');
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

  /* ---------- Init ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupTypewriter();
      setupStatBars();
      setupKonami();
    });
  } else {
    setupTypewriter();
    setupStatBars();
    setupKonami();
  }
})();
