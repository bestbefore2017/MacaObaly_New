import { initTheme, initScrollAnimation } from './shared.js';
import { getCategories, getImageUrl } from './directus-api.js';

// Note: This file is imported from index.html as:
// <script type="module" src="js/homepage.js"></script>

// ========== LOAD HOMEPAGE CONTENT ==========
async function loadHomePage() {
  // Load default values (nejsou v Directusu - statické)
  document.getElementById('hero-title').textContent = 'Vítejte na MácaObaly.cz';
  document.getElementById('hero-description').textContent = 'Víčka, obaly a sklenice s jihočeskou tradicí';
  document.getElementById('products-section-title').textContent = 'Naše produkty';
  document.getElementById('about-title').textContent = 'O nás';
  document.getElementById('contact-title').textContent = 'Kontaktujte nás';
  
  document.getElementById('contact-phone-link').href = 'tel:+420720670226';
  document.getElementById('contact-phone-link').textContent = '+420720670226';
  
  document.getElementById('contact-email-link').href = 'mailto:macamilan@email.cz';
  document.getElementById('contact-email-link').textContent = 'macamilan@email.cz';
  
  document.getElementById('contact-address').innerHTML = 'Máca Obaly s.r.o.<br>Náměstí Komenského 72<br>Kunžak&nbsp;378 62';

  // Load categories from Directus
  const categories = await getCategories();
  console.log('✅ Kategorie z Directusu:', categories);
  const categoryGrid = document.getElementById('category-grid');

  if (categories && categories.length > 0) {
    categoryGrid.innerHTML = categories.map(cat => {
      const imageUrl = cat.image ? getImageUrl(cat.image) : 'images/thumbnail_default.png';
      return `
        <a href="category.html?slug=${cat.slug}" class="category-card">
          <img src="${imageUrl}" alt="${cat.name}" loading="lazy" decoding="async" sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 959px) 33vw, 33vw">
          <h3>${cat.name}</h3>
        </a>
      `;
    }).join('');
  } else {
    console.warn('❌ Žádné kategorie z Directusu');
  }
}

// ========== INITIALIZE ON PAGE LOAD ==========
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollAnimation(true); // true = isHomepage
  loadHomePage();
});
