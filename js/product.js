import { initTheme, initScrollAnimation } from './shared.js';
import { getProducts, getImageUrl } from './directus-api.js';

// ========== LOAD PRODUCT PAGE ==========
async function loadProductPage() {
  const params = new URLSearchParams(window.location.search);
  const productSlug = params.get('slug');

  console.log('📦 Načítám produkt:', productSlug);

  if (!productSlug) {
    console.error('❌ Žádný slug produktu');
    return;
  }

  // Načti všechny produkty z Directusu
  const allProducts = await getProducts();
  const product = allProducts.find(p => p.slug === productSlug);
  
  console.log('✅ Produkt načten z Directusu:', product);
  
  if (product) {
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-description').innerHTML = product.description || 'Bez popisu';
    
    if (product.price) {
      document.getElementById('product-price').textContent = `${product.price} Kč`;
    }

    if (product.image) {
      document.getElementById('product-image').src = getImageUrl(product.image);
    }

    // Back link k kategorii
    let categorySlug = localStorage.getItem('lastCategory');
    console.log('💾 Poslední kategorie:', categorySlug);
    
    if (!categorySlug && product.category) {
      categorySlug = product.category.slug;
    }
    
    if (categorySlug) {
      document.getElementById('back-to-category').href = `category.html?slug=${categorySlug}`;
      document.getElementById('nav-back').href = `category.html?slug=${categorySlug}`;
    }
  }

  // Načti podobné produkty (ze stejné kategorie)
  if (product && product.category) {
    const allProducts = await getProducts();
    const similarProducts = allProducts.filter(p => 
      p.slug !== productSlug && 
      p.category === product.category
    ).slice(0, 6);

    const similarGrid = document.getElementById('similar-products');
    if (similarProducts.length > 0) {
      similarGrid.innerHTML = similarProducts.map(p => {
        const imageUrl = p.image ? getImageUrl(p.image) : 'images/product_placeholder.png';
        const prodDesc = p.description ? 
          (p.description.length > 50 ? p.description.substring(0, 50) + '...' : p.description) 
          : '';

        return `
          <a href="product.html?slug=${p.slug}" class="product-item">
            <img src="${imageUrl}" alt="${p.name}" loading="lazy" decoding="async" sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 959px) 33vw, 33vw">
            <h3>${p.name}</h3>
            <p>${prodDesc}</p>
          </a>
        `;
      }).join('');
    } else {
      similarGrid.innerHTML = '<p>Žádné podobné produkty nenalezeny</p>';
    }
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

  // Načti všechny produkty
  const allProducts = await getProducts();
  const currentIndex = allProducts.findIndex(p => p.slug === currentSlug);
  
  if (currentIndex === -1) return;

  const prevBtn = document.querySelector('.prev-product');
  const nextBtn = document.querySelector('.next-product');

  // Předchozí produkt
  if (currentIndex > 0) {
    const prevProduct = allProducts[currentIndex - 1];
    prevBtn.href = `product.html?slug=${prevProduct.slug}`;
    prevBtn.style.opacity = '1';
    prevBtn.style.pointerEvents = 'auto';
  } else {
    prevBtn.style.opacity = '0.3';
    prevBtn.style.pointerEvents = 'none';
  }

  // Další produkt
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
