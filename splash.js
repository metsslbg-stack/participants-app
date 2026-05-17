// ── METSS LBG Splash Screen ──────────────────────────────────────────
// Shows once per browser session. Requires metss-logo.png in repo root.
(function () {
  if (sessionStorage.getItem('metss_splash_shown')) return;
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

  requestAnimationFrame(() => {
    overlay.classList.add('splash-visible');
    setTimeout(() => {
      overlay.classList.add('splash-out');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    }, 2200);
  });
})();
