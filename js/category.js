import { initTheme, initScrollAnimation } from './shared.js';
import { getCategories, getProducts, getProductsByCategory, getImageUrl } from './directus-api.js';

// ========== STATE ==========
let allCategoryProducts = [];
let allSubcategories = [];
let currentPage = 1;
const PRODUCTS_PER_PAGE = 9;
let selectedSubcategory = null; // null = all
let currentCategory = null; // Store current category data

// ========== LOAD CATEGORY PAGE ==========
async function loadCategoryPage() {
  const params = new URLSearchParams(window.location.search);
  const categorySlug = params.get('slug');

  console.log('📄 Category page loaded with slug:', categorySlug);

  if (categorySlug) {
    localStorage.setItem('lastCategory', categorySlug);
  }

  // Načti všechny kategorie a produkty z Directusu
  const allCategories = await getCategories();
  const allProducts = await getProducts();
  
  console.log('✅ Kategorie z Directusu:', allCategories.length);
  console.log('✅ Produkty z Directusu:', allProducts.length);

  if (!categorySlug) {
    if (allCategories.length > 0) {
      window.history.replaceState({}, '', `category.html?slug=${allCategories[0].slug}`);
      return loadCategoryPage();
    } else {
      document.getElementById('category-name').textContent = 'Kategorie nedostupná';
      return;
    }
  }

  // Najdi aktuální kategorii
  const category = allCategories.find(c => c.slug === categorySlug);
  currentCategory = category;
  
  if (category) {
    document.getElementById('category-name').textContent = category.name;
    document.title = `${category.name} - MácaObaly.cz`;
    document.getElementById('category-description').textContent = category.description || '';
  } else {
    console.warn(`Category "${categorySlug}" not found`);
    document.getElementById('category-name').textContent = 'Kategorie nenalezena';
  }

  // Filtruj produkty pro tuto kategorii
  if (category) {
    allCategoryProducts = allProducts.filter(p => p.category === category.id);
    console.log(`✅ ${allCategoryProducts.length} produktů v kategorii "${categorySlug}"`);
  }
  
    console.log('Used subcategory UUIDs:', Array.from(usedSubcategoryUuids));
    
    // Filter subcategories to show only those used by products
    allSubcategories = allSubcategories.filter(subcat => {
      const isUsed = usedSubcategoryUuids.has(subcat.uuid);
      if (isUsed) {
        console.log(`✓ Subcat "${subcat.content.subcategory_name}" (${subcat.slug}) is used by products in category "${categorySlug}"`);
      }
      return isUsed;
    });
    
    console.log('Filtered subcategories for category "' + categorySlug + '":', allSubcategories.length);
  } else if (allProducts && allProducts.length > 0) {
    console.log('Warning: currentCategoryUuid not found, showing all products');
    allCategoryProducts = allProducts;
  }

  // Render filter buttons if subcategories exist
  const subcategoriesFilter = document.getElementById('subcategories-filter');
  if (allSubcategories && allSubcategories.length > 0) {
    const filterHTML = `
      <button class="filter-btn active" data-subcat="all">
        <i class="fas fa-list"></i>
        Vše
      </button>
      ${allSubcategories.map(sub => {
        const icon = sub.content.icon && sub.content.icon.filename 
          ? `<img src="${sub.content.icon.filename}" alt="${sub.content.subcategory_name}" class="filter-icon" loading="lazy" decoding="async">`
          : '<i class="fas fa-box"></i>';
        const subName = sub.content.subcategory_name || sub.name || sub.slug;
        return `
          <button class="filter-btn" data-subcat="${sub.slug}" title="${subName}">
            ${icon}
            <span>${subName}</span>
          </button>
        `;
      }).join('')}
    `;
    subcategoriesFilter.innerHTML = filterHTML;

    // Add filter button listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSubcategory = btn.dataset.subcat === 'all' ? null : btn.dataset.subcat;
        currentPage = 1;
        renderProductsPage();
      });
    });

  // Render first page
  renderProductsPage();
}

// ========== RENDER PRODUCTS WITH PAGINATION ==========
function renderProductsPage() {
  const productsToDisplay = allCategoryProducts;
  const totalPages = Math.ceil(productsToDisplay.length / PRODUCTS_PER_PAGE);
  const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIdx = startIdx + PRODUCTS_PER_PAGE;
  const pageProducts = productsToDisplay.slice(startIdx, endIdx);

  // Render products grid
  const productsGrid = document.getElementById('products-grid');
  console.log(`🎬 Rendering ${pageProducts.length} produktů (Stránka ${currentPage}/${totalPages})`);
  
  if (pageProducts.length > 0) {
    productsGrid.innerHTML = pageProducts.map(product => {
      const imageUrl = product.image ? getImageUrl(product.image) : 'images/product_placeholder.png';
      const prodDesc = product.description ? 
        (product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description) 
        : 'Bez popisu';

      return `
        <a href="product.html?slug=${product.slug}" class="product-item">
          <img src="${imageUrl}" alt="${product.name}" loading="lazy" decoding="async" sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 959px) 33vw, 33vw">
          <h3>${product.name}</h3>
          <p>${prodDesc}</p>
        </a>
      `;
    }).join('');
  } else {
    productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Žádné produkty nenalezeny</p>';
  }

  // Render pagination only if more than 9 products
  renderPagination(totalPages);
}

// ========== RENDER PAGINATION ==========
function renderPagination(totalPages) {
  const paginationContainer = document.getElementById('pagination');
  const paginationSection = document.querySelector('.pagination-section');
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    if (paginationSection) {
      paginationSection.classList.remove('show');
    }
    return;
  }
  
  // Show section if pagination is needed
  if (paginationSection) {
    paginationSection.classList.add('show');
  }

  let paginationHTML = '';

  // Previous button
  if (currentPage > 1) {
    paginationHTML += `<a href="#" class="pagination-btn prev-page" data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></a>`;
  } else {
    paginationHTML += `<span class="pagination-btn disabled"><i class="fas fa-chevron-left"></i></span>`;
  }

  // Page numbers
  const maxPagesToShow = 3;
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, currentPage + 1);

  if (currentPage <= 2) {
    endPage = Math.min(totalPages, 3);
  }
  if (currentPage > totalPages - 2) {
    startPage = Math.max(1, totalPages - 2);
  }

  if (startPage > 1) {
    paginationHTML += `<a href="#" class="pagination-btn" data-page="1">1</a>`;
    if (startPage > 2) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      paginationHTML += `<span class="pagination-btn active">${i}</span>`;
    } else {
      paginationHTML += `<a href="#" class="pagination-btn" data-page="${i}">${i}</a>`;
    }
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
    paginationHTML += `<a href="#" class="pagination-btn" data-page="${totalPages}">${totalPages}</a>`;
  }

  // Next button
  if (currentPage < totalPages) {
    paginationHTML += `<a href="#" class="pagination-btn next-page" data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></a>`;
  } else {
    paginationHTML += `<span class="pagination-btn disabled"><i class="fas fa-chevron-right"></i></span>`;
  }

  paginationContainer.innerHTML = paginationHTML;

  // Add pagination listeners
  document.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = parseInt(btn.dataset.page);
      renderProductsPage();
      // Scroll to products grid
      document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ========== INITIALIZE ON PAGE LOAD ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 Category page loaded');
  initTheme();
  initScrollAnimation();
  loadCategoryPage().catch(error => {
    console.error('❌ Error loading category page:', error);
    document.getElementById('category-name').textContent = 'Chyba při načítání kategorie';
  });
});
