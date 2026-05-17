// ── METSS LBG Splash Screen ──────────────────────────────────────────
// Inject a blocking <style> immediately to hide page content until splash is ready.
(function () {
  // Inject hide-body style as early as possible
  const blockStyle = document.createElement('style');
  blockStyle.id = 'splash-block';
  blockStyle.textContent = 'body > *:not(#metss-splash) { visibility: hidden !important; }';
  document.head.appendChild(blockStyle);

  if (sessionStorage.getItem('metss_splash_shown')) {
    // Already shown — remove block immediately and exit
    blockStyle.remove();
    return;
  }
  sessionStorage.setItem('metss_splash_shown', '1');

  const overlay = document.createElement('div');
  overlay.id = 'metss-splash';
  overlay.innerHTML = `
    <div class="splash-inner">
      <img src="metss-logo.png" alt="METSS LBG" class="splash-logo" />
      <p class="splash-tagline">Creating Sustainable Wealth One Person at a Time</p>
    </div>
  `;
  document.body.appendChild(overlay);

  // Reveal page content behind splash
  blockStyle.remove();

  requestAnimationFrame(() => {
    overlay.classList.add('splash-visible');
    setTimeout(() => {
      overlay.classList.add('splash-out');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    }, 2200);
  });
})();
