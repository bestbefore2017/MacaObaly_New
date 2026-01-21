import { initTheme, initScrollAnimation } from './shared.js';
import { getProduct, getAllProducts, richtextToHtml } from './storyblok.js';

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

    if (product.image) {
      let imageUrl = product.image;
      if (typeof product.image === 'object' && product.image.filename) {
        imageUrl = product.image.filename;
      }
      document.getElementById('product-image').src = imageUrl;
    }
  }

  // Load all products for navigation
  const allProducts = await getAllProducts();
  const currentIndex = allProducts.findIndex(p => p.slug === productSlug);
  
  // Set back link to homepage products section
  document.getElementById('back-to-category').href = 'index.html#produkty';
  document.getElementById('nav-back').href = 'index.html#produkty';
  
  // Setup previous product link
  const prevBtn = document.querySelector('.prev-product');
  if (currentIndex > 0) {
    prevBtn.href = `product.html?slug=${allProducts[currentIndex - 1].slug}`;
  } else {
    prevBtn.style.opacity = '0.5';
    prevBtn.style.pointerEvents = 'none';
  }
  
  // Setup next product link
  const nextBtn = document.querySelector('.next-product');
  if (currentIndex < allProducts.length - 1) {
    nextBtn.href = `product.html?slug=${allProducts[currentIndex + 1].slug}`;
  } else {
    nextBtn.style.opacity = '0.5';
    nextBtn.style.pointerEvents = 'none';
  }

  // Load similar products (by subcategory)
  const similarProducts = allProducts.filter(p => {
    if (p.slug === productSlug) return false;
    if (!product || !product.subcategory) return false;

    const productSubcat = Array.isArray(product.subcategory) ? product.subcategory[0] : product.subcategory;
    const pSubcat = Array.isArray(p.content.subcategory) ? p.content.subcategory[0] : p.content.subcategory;

    return productSubcat && pSubcat && productSubcat.uuid === pSubcat.uuid;
  }).slice(0, 6);

  const similarGrid = document.getElementById('similar-products');
  if (similarProducts.length > 0) {
    similarGrid.innerHTML = similarProducts.map(product => {
      let image = 'images/product_placeholder.png';
      if (product.content.image) {
        if (typeof product.content.image === 'string') {
          image = product.content.image;
        } else if (product.content.image.filename) {
          image = product.content.image.filename;
        }
      }
      const prodName = product.content.name || 'Produkt';
      
      // Handle richtext description
      let prodDesc = '';
      if (product.content.description) {
        const fullDesc = typeof product.content.description === 'object' ?
          richtextToHtml(product.content.description) :
          product.content.description;
        prodDesc = fullDesc.length > 50 ? fullDesc.substring(0, 50) + '...' : fullDesc;
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
  
});
