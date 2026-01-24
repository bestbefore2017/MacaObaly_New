// ========== SECURITY & AUTH ==========

// All secrets are kept on the server. This client only talks
// to our backend at /api which holds the Storyblok token.

// Session helpers
async function fetchSession() {
  try {
    const res = await fetch('/api/session', { credentials: 'include' });
    if (!res.ok) return { authenticated: false };
    return await res.json();
  } catch (e) {
    return { authenticated: false };
  }
}

async function login(password) {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password })
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.authenticated;
  } catch (e) {
    return false;
  }
}

async function clearAuth() {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {
    // ignore
  }
}

// Kept for compatibility with existing pages
function getAuth() {
  return {};
}

// For subpages we let API 401 redirect to login. Return true for compatibility.
function requireAuth() {
  return true;
}

// ========== LOCAL CMS API ==========

class LocalCmsAPI {
  constructor() {
    this.baseUrl = '/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        credentials: 'include',
        ...options,
        headers
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Only force logout on auth session endpoints
          if (endpoint === 'session' || endpoint === 'login') {
            await clearAuth();
            window.location.href = 'index.html';
            throw new Error('Neplatné přihlašovací údaje');
          }
          // For content endpoints, surface error without logging out
          let errMsg = `API Unauthorized (${response.status})`;
          try {
            const err = await response.json();
            if (err?.error) errMsg = `${err.error}`;
          } catch (_) {}
          throw new Error(errMsg);
        }
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // CATEGORIES
  async getCategories() {
    const response = await this.request('categories');
    return response.categories || [];
  }

  async getCategory(id) {
    const response = await this.request(`categories/${id}`);
    return response.category;
  }

  async createCategory(data) {
    const response = await this.request('categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.category;
  }

  async updateCategory(id, data) {
    const response = await this.request(`categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.category;
  }

  async deleteCategory(id) {
    return await this.request(`categories/${id}`, {
      method: 'DELETE'
    });
  }

  // PRODUCTS
  async getProducts(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await this.request(`products?${queryString}`);
    return response.products || [];
  }

  async getProduct(id) {
    const response = await this.request(`products/${id}`);
    return response.product;
  }

  async createProduct(data) {
    const response = await this.request('products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.product;
  }

  async updateProduct(id, data) {
    const response = await this.request(`products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.product;
  }

  async deleteProduct(id) {
    return await this.request(`products/${id}`, {
      method: 'DELETE'
    });
  }

  async publishProduct(id) {
    const response = await this.request(`products/${id}/publish`, {
      method: 'POST'
    });
    return response.product;
  }

  async unpublishProduct(id) {
    const response = await this.request(`products/${id}/unpublish`, {
      method: 'POST'
    });
    return response.product;
  }

  // Upload asset
  async uploadAsset(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/assets`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');
    return await response.json();
  }
}

// ========== LOGIN HANDLER ==========

document.addEventListener('DOMContentLoaded', async () => {
  const currentPage = window.location.pathname.split('/').pop();
  
  // Login page logic
  if (currentPage === 'index.html' || currentPage === '' || currentPage === 'admin/') {
    const session = await fetchSession();
    if (session.authenticated) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      loadDashboard();
    } else {
      document.getElementById('login-screen').style.display = 'block';
      document.getElementById('dashboard').style.display = 'none';
    }

    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('admin-password').value;
        const errorDiv = document.getElementById('login-error');
        
        errorDiv.style.display = 'none';
        const ok = await login(password);
        if (ok) {
          window.location.reload();
        } else {
          errorDiv.textContent = 'Nesprávné heslo. Zkuste to znovu.';
          errorDiv.style.display = 'block';
        }
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (confirm('Opravdu se chcete odhlásit?')) {
          await clearAuth();
          window.location.reload();
        }
      });
    }
  } else {
    // Other pages - require auth
    // We rely on API 401 to redirect on failure in requests
  }
});

// ========== DASHBOARD STATS ==========

async function loadDashboard() {
  document.getElementById('user-info').textContent = `Přihlášen`;

  const api = new LocalCmsAPI();

  try {
    // Load all products and categories
    const allProducts = await api.getProducts();
    const allCategories = await api.getCategories();

    // Count by type
    const publishedProducts = allProducts.filter(p => p.published);
    const totalSubcategories = 0; // Not implemented yet

    document.getElementById('total-products').textContent = allProducts.length;
    document.getElementById('total-categories').textContent = allCategories.length;
    document.getElementById('total-subcategories').textContent = totalSubcategories;

    // Last update
    if (allProducts.length > 0) {
      const sorted = allProducts.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      const lastUpdate = new Date(sorted[0].updated_at);
      document.getElementById('last-update').textContent = lastUpdate.toLocaleDateString('cs-CZ');
    }

    // Recent activity
    const activityList = document.getElementById('activity-list');
    if (activityList) {
      const recent = allProducts
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 5);
      
      activityList.innerHTML = recent.map(product => `
        <div class="activity-item">
          <i class="fas fa-edit"></i>
          <span><strong>${product.name}</strong> byl upraven</span>
          <span class="activity-time">${new Date(product.updated_at).toLocaleString('cs-CZ')}</span>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
}

// Export for other pages
export { LocalCmsAPI, requireAuth, getAuth, clearAuth };
