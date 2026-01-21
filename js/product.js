import { initTheme, initScrollAnimation } from './shared.js';
import { getProduct, getAllProducts, richtextToHtml } from './storyblok.js';

// ========== LOAD PRODUCT PAGE ==========
async function loadProductPage() {
  const params = new URLSearchParams(window.location.search);
  const productSlug = params.get('slug');

  console.log('📦 Loading product with slug:', productSlug);

  if (!productSlug) {
    console.error('❌ No product slug provided');
    return;
  }

  // Load product
  const product = await getProduct(productSlug);
  console.log('✅ Product loaded:', product);
  
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

    // Get category for back link
    if (product.subcategory) {
      const subcatRef = Array.isArray(product.subcategory) ? product.subcategory[0] : product.subcategory;
      if (subcatRef && subcatRef.slug) {
        const parts = subcatRef.slug.split('/');
        const categorySlug = parts[1] || parts[0];
        console.log('📁 Setting back link to category:', categorySlug);
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
          <img src="${image}" alt="${prodName}" loading="lazy" decoding="async" sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 959px) 33vw, 33vw">
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
  console.log('📦 Product page loaded');
  initTheme();
  initScrollAnimation();
  loadProductPage().catch(error => {
    console.error('❌ Error loading product:', error);
  });
  initProductNavigation().catch(error => {
    console.error('❌ Error initializing product navigation:', error);
  });
});

// ========== PRODUCT NAVIGATION ==========
async function initProductNavigation() {
  const params = new URLSearchParams(window.location.search);
  const currentSlug = params.get('slug');
  
  if (!currentSlug) return;

  // Get all products to find current product index
  const allProducts = await getAllProducts();
  const currentIndex = allProducts.findIndex(p => p.slug === currentSlug);
  
  if (currentIndex === -1) return;

  const prevBtn = document.querySelector('.prev-product');
  const nextBtn = document.querySelector('.next-product');

  // Previous product
  if (currentIndex > 0) {
    const prevProduct = allProducts[currentIndex - 1];
    prevBtn.href = `product.html?slug=${prevProduct.slug}`;
    prevBtn.style.opacity = '1';
    prevBtn.style.pointerEvents = 'auto';
  } else {
    prevBtn.style.opacity = '0.3';
    prevBtn.style.pointerEvents = 'none';
  }

  // Next product
  if (currentIndex < allProducts.length - 1) {
    const nextProduct = allProducts[currentIndex + 1];
    nextBtn.href = `product.html?slug=${nextProduct.slug}`;
    nextBtn.style.opacity = '1';
    nextBtn.style.pointerEvents = 'auto';
  } else {
    nextBtn.style.opacity = '0.3';
    nextBtn.style.pointerEvents = 'none';
  }
}
