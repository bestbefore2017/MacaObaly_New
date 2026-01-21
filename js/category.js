import { initTheme, initScrollAnimation } from './shared.js';
import { getCategory, getAllSubcategories, getAllProducts, richtextToHtml } from './storyblok.js';

// Helper to fetch categories
async function getCategories() {
  try {
    const url = new URL('https://api.storyblok.com/v1/cdn/stories');
    url.searchParams.append('token', 'VdLWwVoZVAbmH4X3E93rhwtt');
    url.searchParams.append('version', 'draft');
    url.searchParams.append('starts_with', 'categories/');
    url.searchParams.append('per_page', '100');
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.stories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

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

  console.log('Loading category with slug:', categorySlug);

  if (!categorySlug) {
    console.error('No category slug provided');
    return;
  }

  // Load category info
  const category = await getCategory(categorySlug);
  currentCategory = category; // Store in STATE
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
  console.log('All subcategories:', allSubcategories.length);
  
  // Get all categories to map UUIDs to slugs
  const allCategories = await getCategories();
  console.log('All categories loaded:', allCategories.length);
  
  // Find the UUID of the current category
  let currentCategoryUuid = null;
  allCategories.forEach(cat => {
    if (cat.slug === categorySlug || cat.full_slug === `categories/${categorySlug}`) {
      currentCategoryUuid = cat.uuid;
      console.log(`Found category UUID: ${currentCategoryUuid} for slug: ${categorySlug}`);
    }
  });
  
  if (allProducts && allProducts.length > 0 && currentCategoryUuid) {
    // Filter products by category UUID
    allCategoryProducts = allProducts.filter(product => {
      const productCategoryUuid = product.content.category;
      return productCategoryUuid === currentCategoryUuid;
    });
    
    console.log('Products for category "' + categorySlug + '":', allCategoryProducts.length);
    
    // Filter subcategories - show only those that are actually used by products in this category
    // Build a set of subcategory UUIDs used by products
    const usedSubcategoryUuids = new Set();
    allCategoryProducts.forEach(product => {
      const subcatUuid = product.content.subcategory;
      if (subcatUuid) {
        usedSubcategoryUuids.add(subcatUuid);
      }
    });
    
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
        e.preventDefault();
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
    console.log('Filtering by subcategory slug:', selectedSubcategory);
    
    // Find the UUID of the selected subcategory
    const selectedSubcat = allSubcategories.find(sub => sub.slug === selectedSubcategory);
    const selectedSubcatUuid = selectedSubcat?.uuid;
    
    console.log('Selected subcat UUID:', selectedSubcatUuid);
    
    productsToDisplay = allCategoryProducts.filter(product => {
      const productSubcategoryUuid = product.content.subcategory;
      
      if (!productSubcategoryUuid) {
        console.log(`Product ${product.slug}: no subcategory UUID`);
        return false;
      }
      
      const matches = productSubcategoryUuid === selectedSubcatUuid;
      
      if (matches) {
        console.log(`Product ${product.slug} matches subcategory ${selectedSubcategory}`);
      }
      
      return matches;
    });
    
    console.log('Filtered products:', productsToDisplay.length);
  }

  const totalPages = Math.ceil(productsToDisplay.length / PRODUCTS_PER_PAGE);
  const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIdx = startIdx + PRODUCTS_PER_PAGE;
  const pageProducts = productsToDisplay.slice(startIdx, endIdx);

  // Render products grid
  const productsGrid = document.getElementById('products-grid');
  if (pageProducts.length > 0) {
    productsGrid.innerHTML = pageProducts.map(product => {
      // Handle both string URLs and image objects from Storyblok
      let image = 'images/product_placeholder.png';
      if (product.content.image) {
        if (typeof product.content.image === 'string') {
          image = product.content.image;
        } else if (product.content.image.filename) {
          image = product.content.image.filename;
        }
      }
      const prodName = product.content.name || 'Produkt';
      let prodDesc = 'Bez popisu';
      if (product.content.description) {
        const fullDesc = typeof product.content.description === 'object' ?
          richtextToHtml(product.content.description) :
          product.content.description;
        prodDesc = fullDesc.length > 100 ? fullDesc.substring(0, 100) + '...' : fullDesc;
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
  initTheme();
  initScrollAnimation();
  loadCategoryPage();
});
