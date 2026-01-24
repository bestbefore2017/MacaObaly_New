import { LocalCmsAPI, requireAuth, getAuth, clearAuth } from './admin.js';

// Require authentication
if (!requireAuth()) {
  throw new Error('Not authenticated');
}

const api = new LocalCmsAPI();
let allProducts = [];
let allCategories = [];
let editingProductId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const auth = getAuth();
  document.getElementById('user-info').textContent = `Přihlášen`;
  
  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    if (confirm('Opravdu se chcete odhlásit?')) {
      clearAuth();
      window.location.href = 'index.html';
    }
  });

  // Load data
  loadProducts();
  loadCategories();

  // Add product button
  document.getElementById('add-product-btn').addEventListener('click', () => {
    openProductModal();
  });

  // Save product button
  document.getElementById('save-product-btn').addEventListener('click', saveProduct);

  // Search
  document.getElementById('search-products').addEventListener('input', (e) => {
    filterProducts(e.target.value);
  });

  // Auto-generate slug from name
  document.getElementById('product-name').addEventListener('input', (e) => {
    const slug = generateSlug(e.target.value);
    document.getElementById('product-slug').value = slug;
  });
});

// Load products
async function loadProducts() {
  try {
    allProducts = await api.getProducts();
    renderProducts(allProducts);
  } catch (error) {
    console.error('Failed to load products:', error);
    document.getElementById('products-list').innerHTML = `
      <tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--danger);">
        Nepodařilo se načíst produkty. Zkontrolujte připojení.
      </td></tr>
    `;
  }
}

// Load categories
async function loadCategories() {
  try {
    allCategories = await api.getCategories();
    
    const categorySelect = document.getElementById('product-category');
    categorySelect.innerHTML = '<option value="">Vyberte kategorii</option>' + 
      allCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

// Render products
function renderProducts(products) {
  const tbody = document.getElementById('products-list');
  
  if (products.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="6" style="text-align: center; padding: 40px;">
        Žádné produkty. Přidejte první produkt.
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(product => {
    const image = product.image_url || '';
    const price = product.price || '-';
    const categoryName = getCategoryName(product.category_id);
    const status = product.published ? 'published' : 'draft';
    
    return `
      <tr>
        <td>
          ${image ? `<img src="${image}" class="product-thumb" alt="">` : '<div class="product-thumb" style="background: var(--bg-tertiary);"></div>'}
        </td>
        <td><strong>${product.name}</strong></td>
        <td>${categoryName}</td>
        <td>${price}</td>
        <td>
          <span class="status-badge status-${status}">
            ${status === 'published' ? 'Publikováno' : 'Koncept'}
          </span>
        </td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-edit" onclick="editProduct(${product.id})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-delete" onclick="deleteProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Get category name by ID
function getCategoryName(categoryId) {
  if (!categoryId) return '-';
  const category = allCategories.find(c => c.id === categoryId);
  return category ? category.name : '-';
}

// Filter products
function filterProducts(query) {
  const filtered = allProducts.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
  );
  renderProducts(filtered);
}

// Generate slug
function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Open product modal
function openProductModal(product = null) {
  editingProductId = product ? product.id : null;
  
  document.getElementById('modal-title').textContent = product ? 'Upravit produkt' : 'Přidat produkt';
  document.getElementById('product-id').value = product ? product.id : '';
  document.getElementById('product-name').value = product ? product.name : '';
  document.getElementById('product-slug').value = product ? product.slug : '';
  document.getElementById('product-category').value = product && product.category_id ? product.category_id : '';
  document.getElementById('product-price').value = product && product.price ? product.price : '';
  document.getElementById('product-description').value = product && product.description ? product.description : '';
  document.getElementById('product-image').value = product && product.image_url ? product.image_url : '';
  
  document.getElementById('product-modal').classList.add('active');
}

// Close product modal
function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
  editingProductId = null;
}

// Save product
async function saveProduct() {
  const name = document.getElementById('product-name').value.trim();
  const slug = document.getElementById('product-slug').value.trim();
  const categoryId = document.getElementById('product-category').value;
  const price = document.getElementById('product-price').value.trim();
  const description = document.getElementById('product-description').value.trim();
  const imageUrl = document.getElementById('product-image').value.trim();

  if (!name) {
    alert('Vyplňte název produktu');
    return;
  }

  const productData = {
    name: name,
    slug: slug || generateSlug(name),
    category_id: categoryId ? parseInt(categoryId) : null,
    price: price ? parseFloat(price) : null,
    description: description,
    image_url: imageUrl || null
  };

  try {
    const saveBtn = document.getElementById('save-product-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ukládání...';

    if (editingProductId) {
      // Update existing
      await api.updateProduct(editingProductId, productData);
    } else {
      // Create new
      await api.createProduct(productData);
    }

    closeProductModal();
    await loadProducts();
    
    alert('Produkt byl úspěšně uložen');
  } catch (error) {
    console.error('Failed to save product:', error);
    alert('Chyba při ukládání produktu. Zkuste to znovu.');
  } finally {
    const saveBtn = document.getElementById('save-product-btn');
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Uložit produkt';
  }
}

// Edit product
window.editProduct = async function(productId) {
  try {
    const product = await api.getProduct(productId);
    openProductModal(product);
  } catch (error) {
    console.error('Failed to load product:', error);
    alert('Nepodařilo se načíst produkt');
  }
};

// Delete product
window.deleteProduct = async function(productId, productName) {
  if (!confirm(`Opravdu chcete smazat produkt "${productName}"?`)) {
    return;
  }

  try {
    await api.deleteProduct(productId);
    await loadProducts();
    alert('Produkt byl smazán');
  } catch (error) {
    console.error('Failed to delete product:', error);
    alert('Chyba při mazání produktu');
  }
};

// Export for global access
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
