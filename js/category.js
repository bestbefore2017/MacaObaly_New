import { initTheme, initScrollAnimation } from './shared.js';
import { getCategory, getSubcategoriesByCategory, getAllProducts, richtextToHtml } from './storyblok.js';

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

  // Load subcategories
  const subcategories = await getSubcategoriesByCategory(categorySlug);
  console.log('Subcategories:', subcategories);

  const subcategoriesGrid = document.getElementById('subcategories-grid');

  if (subcategories && subcategories.length > 0) {
    subcategoriesGrid.innerHTML = subcategories.map(sub => {
      const icon = sub.content.icon && sub.content.icon.filename
        ? `<img src="${sub.content.icon.filename}" alt="${sub.content.subcategory_name}">`
        : '<i class="fas fa-box"></i>';
      const subName = sub.content.subcategory_name || sub.name || sub.slug;
      const subDesc = sub.content.description || '';

      return `
        <div class="subcategory-card">
          ${icon}
          <h3>${subName}</h3>
          <p>${subDesc}</p>
        </div>
      `;
    }).join('');
  } else {
    subcategoriesGrid.innerHTML = '<p>Žádné podkategorie nenalezeny</p>';
  }

  // Load products for this category
  const allProducts = await getAllProducts();
  console.log('All products:', allProducts);

  const productsGrid = document.getElementById('products-grid');

  if (allProducts && allProducts.length > 0) {
    // Filter products that belong to ANY subcategory of this category
    const filteredProducts = allProducts.filter(product => {
      const subcatRef = product.content.subcategory;
      if (!subcatRef) return false;

      // subcatRef could be array or single object
      const refs = Array.isArray(subcatRef) ? subcatRef : [subcatRef];

      return refs.some(ref => {
        // Check if this product's subcategory belongs to current category
        if (!ref || !ref.slug) return false;
        const parts = ref.slug.split('/');
        return parts[1] === categorySlug; // parts[1] is the category slug
      });
    });

    console.log('Filtered products for category:', filteredProducts);

    if (filteredProducts.length > 0) {
      productsGrid.innerHTML = filteredProducts.map(product => {
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
      productsGrid.innerHTML = '<p>Žádné produkty nenalezeny</p>';
    }
  }
}

// ========== INITIALIZE ON PAGE LOAD ==========
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollAnimation();
  loadCategoryPage();
});
