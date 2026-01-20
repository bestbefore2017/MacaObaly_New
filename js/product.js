import { initTheme, initScrollAnimation } from './shared.js';
import { getProduct, getAllProducts, richtextToHtml } from './storyblok.js';

// ========== EMAIL INQUIRY HANDLER ==========
function handleInquiry() {
  const productName = document.getElementById('product-name').textContent;
  const email = 'macamilan@email.cz';
  const subject = `Dotaz na produkt: ${productName}`;
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

// ========== LOAD PRODUCT PAGE ==========
async function loadProductPage() {
  const params = new URLSearchParams(window.location.search);
  const productSlug = params.get('slug');

  if (!productSlug) {
    console.error('No product slug provided');
    return;
  }

  // Load product
  const product = await getProduct(productSlug);
  if (product) {
    document.getElementById('product-name').textContent = product.name || 'Produkt';
    
    // Handle richtext description
    const description = product.description;
    if (typeof description === 'object') {
      document.getElementById('product-description').innerHTML = richtextToHtml(description);
    } else {
      document.getElementById('product-description').innerHTML = description || 'Bez popisu';
    }

    if (product.image && product.image.filename) {
      document.getElementById('product-image').src = product.image.filename;
    }

    // Get category for back link
    if (product.subcategory) {
      const subcatRef = Array.isArray(product.subcategory) ? product.subcategory[0] : product.subcategory;
      if (subcatRef && subcatRef.slug) {
        const parts = subcatRef.slug.split('/');
        const categorySlug = parts[1] || parts[0];
        document.getElementById('back-to-category').href = `category.html?slug=${categorySlug}`;
        document.getElementById('nav-back').href = `category.html?slug=${categorySlug}`;
      }
    }
  }

  // Load similar products (by subcategory)
  const allProducts = await getAllProducts();
  const similarProducts = allProducts.filter(p => {
    if (p.slug === productSlug) return false;
    if (!product || !product.subcategory) return false;

    const productSubcat = Array.isArray(product.subcategory) ? product.subcategory[0] : product.subcategory;
    const pSubcat = Array.isArray(p.content.subcategory) ? p.content.subcategory[0] : p.content.subcategory;

    return productSubcat && pSubcat && productSubcat.slug === pSubcat.slug;
  }).slice(0, 6);

  const similarGrid = document.getElementById('similar-products');
  if (similarProducts.length > 0) {
    similarGrid.innerHTML = similarProducts.map(product => {
      const image = product.content.image && product.content.image.filename
        ? product.content.image.filename
        : 'images/product_placeholder.png';
      const prodName = product.content.name || 'Produkt';
      
      // Handle richtext description
      let prodDesc = '';
      if (product.content.description) {
        if (typeof product.content.description === 'object') {
          prodDesc = richtextToHtml(product.content.description).substring(0, 50) + '...';
        } else {
          prodDesc = product.content.description.substring(0, 50) + '...';
        }
      }

      return `
        <a href="product.html?slug=${product.slug}" class="product-item">
          <img src="${image}" alt="${prodName}">
          <h3>${prodName}</h3>
          <p>${prodDesc}</p>
        </a>
      `;
    }).join('');
  } else {
    similarGrid.innerHTML = '<p>Žádné podobné produkty nenalezeny</p>';
  }
}

// ========== INITIALIZE ON PAGE LOAD ==========
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollAnimation();
  loadProductPage();
  
  // Make handleInquiry available globally for onclick handler
  window.handleInquiry = handleInquiry;
});
