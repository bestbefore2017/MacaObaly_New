import { initTheme, initScrollAnimation } from './shared.js';
import { getCategory, getAllSubcategories, getAllProducts, richtextToHtml } from './storyblok.js';

// ========== STATE ==========
let allCategoryProducts = [];
let allSubcategories = [];
let currentPage = 1;
const PRODUCTS_PER_PAGE = 9;
let selectedSubcategory = null; // null = all

// ========== LOAD CATEGORY PAGE ==========
async function loadCategoryPage() {
  const params = new URLSearchParams(window.location.search);
  const categorySlug = params.get('slug');

  console.log('Loading category with slug:', categorySlug);

  if (!categorySlug) {
    console.error('No category slug provided');
    return;
  }

  // Load category info
  const category = await getCategory(categorySlug);
  console.log('Category data:', category);

  if (category) {
    const catName = category.category_name || 'Kategorie';
    document.getElementById('category-name').textContent = catName;
    document.title = `${catName} - MácaObaly.cz`;

    // Handle description - could be richtext or string
    const description = category.description;
    if (typeof description === 'object') {
      document.getElementById('category-description').innerHTML = richtextToHtml(description);
    } else {
      document.getElementById('category-description').textContent = description || '';
    }
  }

  // Load all products
  const allProducts = await getAllProducts();
  console.log('All products loaded:', allProducts.length);

  // Load all subcategories
  allSubcategories = await getAllSubcategories();
  console.log('All subcategories:', allSubcategories);

  if (allProducts && allProducts.length > 0) {
    // Store all products
    allCategoryProducts = allProducts;
    console.log('Products for category:', allCategoryProducts.length);
  }

  // Render filter buttons if subcategories exist
  const subcategoriesFilter = document.getElementById('subcategories-filter');
  if (allSubcategories && allSubcategories.length > 0) {
    const filterHTML = `
      <button class="filter-btn active" data-subcat="all">
        <i class="fas fa-list"></i>
        Všechny produkty
      </button>
      ${allSubcategories.map(sub => {
        const icon = sub.content.icon && sub.content.icon.filename 
          ? `<img src="${sub.content.icon.filename}" alt="${sub.content.subcategory_name}" class="filter-icon">`
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
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSubcategory = btn.dataset.subcat === 'all' ? null : btn.dataset.subcat;
        currentPage = 1;
        renderProductsPage();
      });
    });

    // Show filter section
    const filterSection = document.querySelector('.subcategories-filter-section');
    if (filterSection) {
      filterSection.style.display = 'block';
    }
  } else {
    // Hide filter section if no subcategories
    const filterSection = document.querySelector('.subcategories-filter-section');
    if (filterSection) {
      filterSection.style.display = 'none';
    }
  }

  // Render first page
  renderProductsPage();
}

// ========== RENDER PRODUCTS WITH PAGINATION ==========
function renderProductsPage() {
  // Filter by selected subcategory if any
  let productsToDisplay = allCategoryProducts;
  
  if (selectedSubcategory) {
    productsToDisplay = allCategoryProducts.filter(product => {
      const subcatRef = product.content.subcategory;
      if (!subcatRef) return false;
      
      // subcatRef could be array or single object
      const refs = Array.isArray(subcatRef) ? subcatRef : [subcatRef];
      
      // Check if any ref matches selected subcategory
      return refs.some(ref => {
        if (!ref) return false;
        // ref.slug should be like "subcategories/na-zavarovali"
        return ref.slug === selectedSubcategory || ref.slug === `subcategories/${selectedSubcategory}`;
      });
    });
  }

  const totalPages = Math.ceil(productsToDisplay.length / PRODUCTS_PER_PAGE);
  const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIdx = startIdx + PRODUCTS_PER_PAGE;
  const pageProducts = productsToDisplay.slice(startIdx, endIdx);

  // Render products grid
  const productsGrid = document.getElementById('products-grid');
  if (pageProducts.length > 0) {
    productsGrid.innerHTML = pageProducts.map(product => {
      const image = product.content.image && product.content.image.filename
        ? product.content.image.filename
        : 'images/product_placeholder.png';
      const prodName = product.content.name || 'Produkt';
      const prodDesc = product.content.description ?
        (typeof product.content.description === 'object' ?
          richtextToHtml(product.content.description).substring(0, 100) :
          product.content.description.substring(0, 100)) + '...'
        : 'Bez popisu';

      return `
        <a href="product.html?slug=${product.slug}" class="product-item">
          <img src="${image}" alt="${prodName}">
          <h3>${prodName}</h3>
          <p>${prodDesc}</p>
        </a>
      `;
    }).join('');
  } else {
    productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Žádné produkty nenalezeny</p>';
  }

  // Render pagination
  renderPagination(totalPages);
}

// ========== RENDER PAGINATION ==========
function renderPagination(totalPages) {
  const paginationContainer = document.getElementById('pagination');
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
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
  initTheme();
  initScrollAnimation();
  loadCategoryPage();
});
