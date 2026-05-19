// ── Splash Screen — runs after DOM is ready ───────────────────────
(function () {
  if (sessionStorage.getItem('metss_splash_shown')) return;
  sessionStorage.setItem('metss_splash_shown', '1');

  function showSplash() {
    const overlay = document.createElement('div');
    overlay.id = 'metss-splash';
    overlay.innerHTML =
      '<div class="splash-inner">' +
        '<img src="metss-logo.png" alt="METSS LBG" class="splash-logo" />' +
        '<p class="splash-tagline">Creating Sustainable Wealth One Person at a Time</p>' +
      '</div>';
    document.body.appendChild(overlay);

    requestAnimationFrame(function() {
      overlay.classList.add('splash-visible');
      setTimeout(function() {
        overlay.classList.add('splash-out');
        overlay.addEventListener('transitionend', function() {
          overlay.remove();
        }, { once: true });
      }, 2200);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showSplash);
  } else {
    showSplash();
  }
})();
