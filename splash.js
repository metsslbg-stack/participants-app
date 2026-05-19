// ── Splash Screen ─────────────────────────────────────────────────
(function () {
  // Hide page content immediately via inline style on html element
  if (!sessionStorage.getItem('metss_splash_shown')) {
    document.documentElement.style.visibility = 'hidden';
  }

  function showSplash() {
    if (sessionStorage.getItem('metss_splash_shown')) {
      // Already shown — just reveal the page
      document.documentElement.style.visibility = '';
      return;
    }
    sessionStorage.setItem('metss_splash_shown', '1');

    // Reveal page behind splash
    document.documentElement.style.visibility = '';

    const overlay = document.createElement('div');
    overlay.id = 'metss-splash';
    overlay.innerHTML =
      '<div class="splash-inner">' +
        '<img src="metss-logo.png" alt="METSS LBG" class="splash-logo" />' +
        '<p class="splash-tagline">Creating Sustainable Wealth One Person at a Time</p>' +
      '</div>';
    document.body.appendChild(overlay);

    requestAnimationFrame(function () {
      overlay.classList.add('splash-visible');
      setTimeout(function () {
        overlay.classList.add('splash-out');
        overlay.addEventListener('transitionend', function () {
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
