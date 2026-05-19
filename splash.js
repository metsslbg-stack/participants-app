// ── Splash Screen ─────────────────────────────────────────────────
// The <style id="splash-hide"> in HTML keeps page invisible until we're ready
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

    reveal();

    var overlay = document.createElement('div');
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
