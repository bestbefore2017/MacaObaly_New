import { initTheme, initScrollAnimation } from './shared.js';
import { getHomePage, getCategories, richtextToHtml } from './storyblok.js';

// Note: This file is imported from index.html as:
// <script type="module" src="js/homepage.js"></script>

// ========== LOAD HOMEPAGE CONTENT ==========
async function loadHomePage() {
  const homeData = await getHomePage();
  if (homeData) {
    console.log('Home data loaded:', homeData);

    document.getElementById('hero-title').textContent = homeData.hero_title || 'Vítejte na MácaObaly.cz';

    // Hero description - handle both string and richtext
    const heroDesc = homeData.hero_description;
    if (typeof heroDesc === 'string') {
      document.getElementById('hero-description').textContent = heroDesc;
    } else if (typeof heroDesc === 'object') {
      document.getElementById('hero-description').textContent = richtextToHtml(heroDesc) || 'Víčka, obaly a sklenice s jihočeskou tradicí';
    } else {
      document.getElementById('hero-description').textContent = 'Víčka, obaly a sklenice s jihočeskou tradicí';
    }

    if (homeData.hero_image && homeData.hero_image.filename) {
      document.getElementById('hero-image').src = homeData.hero_image.filename;
    }

    document.getElementById('products-section-title').textContent = homeData.products_section_title || 'Naše produkty';

    // Handle richtext for products description
    const productsDesc = homeData.products_section_description;
    if (typeof productsDesc === 'object') {
      document.getElementById('products-section-description').innerHTML = richtextToHtml(productsDesc);
    } else {
      document.getElementById('products-section-description').textContent = productsDesc || '';
    }

    document.getElementById('about-title').textContent = homeData.about_title || 'O nás';

    // Handle richtext for about content
    const aboutContent = homeData.about_content;
    if (typeof aboutContent === 'object') {
      document.getElementById('about-content').innerHTML = richtextToHtml(aboutContent);
    } else {
      document.getElementById('about-content').innerHTML = aboutContent || '';
    }

    if (homeData.about_image && homeData.about_image.filename) {
      document.getElementById('about-image').src = homeData.about_image.filename;
    }

    document.getElementById('contact-title').textContent = homeData.contact_title || 'Kontaktujte nás';

    // Handle richtext for contact description
    const contactDesc = homeData.contact_description;
    if (typeof contactDesc === 'object') {
      document.getElementById('contact-description').innerHTML = richtextToHtml(contactDesc);
    } else {
      document.getElementById('contact-description').textContent = contactDesc || 'Máte otázky? Jsme zde pro vás. Kontaktujte nás telefonicky nebo e-mailem.';
    }

    const phone = homeData.contact_phone || '+420720670226';
    const email = homeData.contact_email || 'macamilan@email.cz';

    document.getElementById('contact-phone-link').href = `tel:${phone}`;
    document.getElementById('contact-phone-link').textContent = phone;

    document.getElementById('contact-email-link').href = `mailto:${email}`;
    document.getElementById('contact-email-link').textContent = email;

    // Handle richtext for contact address
    const contactAddr = homeData.contact_address;
    if (typeof contactAddr === 'object') {
      document.getElementById('contact-address').innerHTML = richtextToHtml(contactAddr);
    } else {
      document.getElementById('contact-address').innerHTML = contactAddr || 'Máca Obaly s.r.o.<br>Náměstí Komenského 72<br>Kunžak&nbsp;378 62';
    }
  }

  // Load categories
  const categories = await getCategories();
  console.log('Categories loaded:', categories);
  const categoryGrid = document.getElementById('category-grid');

  if (categories && categories.length > 0) {
    // Define the desired order
    const desiredOrder = ['vicka', 'sklenice', 'plechovky'];

    // Sort categories according to desired order
    const sortedCategories = categories.sort((a, b) => {
      const aIndex = desiredOrder.indexOf(a.slug);
      const bIndex = desiredOrder.indexOf(b.slug);
      return aIndex - bIndex;
    });

    categoryGrid.innerHTML = sortedCategories.map(cat => {
      const icon = cat.content.icon && cat.content.icon.filename
        ? cat.content.icon.filename
        : 'images/thumbnail_default.png';
      const catName = cat.content.category_name || cat.name || cat.slug;
      return `
        <a href="category.html?slug=${cat.slug}" class="category-card">
          <img src="${icon}" alt="${catName}" loading="lazy" decoding="async" sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 959px) 33vw, 33vw">
          <h3>${catName}</h3>
        </a>
      `;
    }).join('');
  } else {
    console.warn('No categories found');
  }
}

// ========== INITIALIZE ON PAGE LOAD ==========
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollAnimation(true); // true = isHomepage
  loadHomePage();
});
