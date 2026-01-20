// ========== SHARED UI FUNCTIONS ==========

/**
 * Initialize theme toggle (dark/light mode)
 * Persists preference to localStorage
 */
export function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleMobile = document.getElementById('theme-toggle-mobile');
  const body = document.body;

  // Initialize theme from localStorage (default: light)
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark');
  } else {
    body.classList.remove('dark');
  }

  // Set initial icons based on current theme
  const initIsDark = body.classList.contains('dark');
  const initIcon = initIsDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  if (themeToggle) themeToggle.innerHTML = initIcon;
  if (themeToggleMobile) themeToggleMobile.innerHTML = initIcon;

  const toggleTheme = () => {
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');
    const icon = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    if (themeToggle) themeToggle.innerHTML = icon;
    if (themeToggleMobile) themeToggleMobile.innerHTML = icon;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if (themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);
}

/**
 * Initialize scroll animations
 * Homepage: parallax hero effect
 * Other pages: navigation opacity on scroll
 */
export function initScrollAnimation(isHomepage = false) {
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const navigation = document.querySelector('.navigation');

    if (isHomepage) {
      // Homepage: parallax hero image effect
      const heroImage = document.querySelector('.hero-image img');
      const heroBg = document.querySelector('.hero-bg');

      if (heroImage) {
        const xMove = scrolled * -0.1;
        const yMove = scrolled * 0.05;
        heroImage.style.transform = `translate(${xMove}px, ${yMove}px)`;
      }
      if (heroBg) {
        const bgXMove = scrolled * 0.05;
        const bgYMove = scrolled * -0.03;
        heroBg.style.transform = `translate(${bgXMove}px, ${bgYMove}px)`;
      }
    }

    // Navigation: fade on scroll (all pages)
    if (navigation) {
      navigation.classList.toggle('scrolled', scrolled > 0);
    }
  });
}
