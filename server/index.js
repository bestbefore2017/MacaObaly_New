require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');

// Import local database
const { initializeDatabase, categories, products } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic config
const SESSION_SECRET = process.env.SESSION_SECRET || 'change_me_secret';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // optional, if hash not provided

// Initialize database
initializeDatabase();

// Middlewares
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(session({
  name: 'maca_admin_sess',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 1000 * 60 * 60 * 8 // 8 hours
  }
}));

// If serving frontend elsewhere, enable CORS for that origin
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
}

// Serve static site (project root)
app.use(express.static(path.join(__dirname, '..')));

// Helper: ensure logged in
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Helper: resolve password check
async function checkPassword(input) {
  if (ADMIN_PASSWORD_HASH) {
    return await bcrypt.compare(input, ADMIN_PASSWORD_HASH);
  }
  if (ADMIN_PASSWORD) {
    return input === ADMIN_PASSWORD;
  }
  // No password configured → deny
  return false;
}

// Auth routes
app.post('/api/login', async (req, res) => {
  try {
    const { password } = req.body;
    console.log('Login attempt received. Cookie header:', req.headers.cookie || '<none>');
    if (!password) return res.status(400).json({ error: 'Password required' });

    const ok = await checkPassword(password);
    console.log('Password check result:', ok);
    if (!ok) return res.status(401).json({ error: 'Invalid password' });

    req.session.authenticated = true;
    console.log('Session before save:', req.session);
    // Explicitly save session before responding
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Login failed' });
      }
      console.log('Session saved successfully, ID:', req.sessionID);
      return res.json({ authenticated: true });
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('maca_admin_sess');
    res.json({ ok: true });
  });
});

app.get('/api/session', (req, res) => {
  console.log('Session check - ID:', req.sessionID, 'Auth:', req.session?.authenticated, 'Cookie header:', req.headers.cookie || '<none>', 'Session:', req.session);
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

// ========== LOCAL DATABASE API ==========

// CATEGORIES

// Get all categories
app.get('/api/categories', requireAuth, (req, res) => {
  try {
    const data = categories.getAll();
    res.json({ categories: data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single category
app.get('/api/categories/:id', requireAuth, (req, res) => {
  try {
    const data = categories.getById(parseInt(req.params.id));
    if (!data) return res.status(404).json({ error: 'Category not found' });
    res.json({ category: data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create category
app.post('/api/categories', requireAuth, (req, res) => {
  try {
    const { name, description, image_url, slug } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const data = categories.create({ name, description, image_url, slug });
    res.json({ category: data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create category', details: e.message });
  }
});

// Update category
app.put('/api/categories/:id', requireAuth, (req, res) => {
  try {
    const data = categories.update(parseInt(req.params.id), req.body);
    if (!data) return res.status(404).json({ error: 'Category not found' });
    res.json({ category: data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update category', details: e.message });
  }
});

// Delete category
app.delete('/api/categories/:id', requireAuth, (req, res) => {
  try {
    categories.delete(parseInt(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// PRODUCTS

// Get all products (with optional filters)
app.get('/api/products', (req, res) => {
  try {
    const filters = {};
    if (req.query.published !== undefined) filters.published = req.query.published === 'true';
    if (req.query.category_id) filters.category_id = parseInt(req.query.category_id);
    if (req.query.search) filters.search = req.query.search;
    
    const data = products.getAll(filters);
    res.json({ products: data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
app.get('/api/products/:id', (req, res) => {
  try {
    const data = products.getById(parseInt(req.params.id));
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get product by slug
app.get('/api/products-by-slug/:slug', (req, res) => {
  try {
    const data = products.getBySlug(req.params.slug);
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (admin only)
app.post('/api/products', requireAuth, (req, res) => {
  try {
    const { name, description, price, image_url, category_id, slug, published } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const data = products.create({ name, description, price, image_url, category_id, slug, published });
    res.json({ product: data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create product', details: e.message });
  }
});

// Update product (admin only)
app.put('/api/products/:id', requireAuth, (req, res) => {
  try {
    const data = products.update(parseInt(req.params.id), req.body);
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update product', details: e.message });
  }
});

// Delete product (admin only)
app.delete('/api/products/:id', requireAuth, (req, res) => {
  try {
    products.delete(parseInt(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Publish product (admin only)
app.post('/api/products/:id/publish', requireAuth, (req, res) => {
  try {
    const data = products.publish(parseInt(req.params.id));
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to publish product' });
  }
});

// Unpublish product (admin only)
app.post('/api/products/:id/unpublish', requireAuth, (req, res) => {
  try {
    const data = products.unpublish(parseInt(req.params.id));
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to unpublish product' });
  }
});

// Asset upload (local)
const upload = multer({ dest: path.join(__dirname, 'uploads') });
app.post('/api/assets', requireAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // For now, just return the file path
    res.json({ 
      asset: { 
        filename: `/server/uploads/${req.file.filename}`,
        name: req.file.originalname
      } 
    });
  } catch (e) {
    res.status(500).json({ error: 'Upload failed', details: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
