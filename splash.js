// ── Splash Screen ─────────────────────────────────────────────────
(function () {
  function reveal() {
    var s = document.getElementById('splash-hide');
    if (s) s.remove();
  }

  function showSplash() {
    if (sessionStorage.getItem('metss_splash_shown')) {
      reveal();
      return;
    }
    sessionStorage.setItem('metss_splash_shown', '1');

    var overlay = document.createElement('div');
    overlay.id = 'metss-splash';
    overlay.className = 'splash-visible';
    overlay.innerHTML =
      '<div class="splash-inner">' +
        '<img src="metss-logo.png" alt="METSS LBG" class="splash-logo" />' +
        '<p class="splash-tagline">Creating Sustainable Wealth One Person at a Time</p>' +
      '</div>';

    // Overlay added FIRST — page still hidden
    document.body.appendChild(overlay);

    // THEN reveal — splash is already covering the page
    reveal();

    setTimeout(function () {
      overlay.classList.add('splash-out');
      overlay.addEventListener('transitionend', function () {
        overlay.remove();
      }, { once: true });
    }, 2200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showSplash);
  } else {
    showSplash();
  }
})();
