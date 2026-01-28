/**
 * Directus API Client
 * 
 * Konfigurace:
 * - DIRECTUS_URL = detekuje se z process.env nebo window.env nebo defaultně Railway URL
 * - DIRECTUS_TOKEN = veřejný token pro čtení (musí být nastaven v Directusu)
 */

// ============================================================================
// KONFIGURACE
// ============================================================================

// Zkus detekovat URL a token
const DIRECTUS_URL = 
  window.DIRECTUS_URL || 
  (typeof process !== 'undefined' && process.env?.DIRECTUS_URL) || 
  'https://macaobaly-production.up.railway.app';

const DIRECTUS_TOKEN = 
  window.DIRECTUS_TOKEN || 
  (typeof process !== 'undefined' && process.env?.DIRECTUS_TOKEN) || 
  'NaKLANmmL8_XHg0qtT0G5SNClSsPRUwD';

// ============================================================================
// HELPER - Buildování URL s query parametry
// ============================================================================

function buildUrl(endpoint, params = {}) {
  const url = new URL(`${DIRECTUS_URL}${endpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
}

// ============================================================================
// HELPER - Fetch s error handling
// ============================================================================

async function fetchDirectus(endpoint, params = {}) {
  const url = buildUrl(endpoint, params);
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Přidej token pokud existuje
  if (DIRECTUS_TOKEN) {
    headers['Authorization'] = `Bearer ${DIRECTUS_TOKEN}`;
  }
  
  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Directus: Chyba autentifikace - zkontroluj DIRECTUS_TOKEN');
      }
      throw new Error(`Directus API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Directus API Error (${endpoint}):`, error);
    throw error;
  }
}

// ============================================================================
// API FUNKCE
// ============================================================================

/**
 * Načti všechny kategorie
 */
export async function getCategories() {
  try {
    const data = await fetchDirectus('/api/items/categories', {
      limit: 100,
      fields: 'id,name,slug,description,image'
    });
    
    console.log('✅ Kategorie načteny z Directusu:', data.data.length);
    return data.data || [];
  } catch (error) {
    console.error('Chyba při načítání kategorií:', error);
    return [];
  }
}

/**
 * Načti všechny produkty s referencí na kategorii
 */
export async function getProducts() {
  try {
    const data = await fetchDirectus('/api/items/products', {
      limit: 1000,
      fields: 'id,name,slug,description,price,image,category.id,category.name,category.slug'
    });
    
    console.log('✅ Produkty načteny z Directusu:', data.data.length);
    return data.data || [];
  } catch (error) {
    console.error('Chyba při načítání produktů:', error);
    return [];
  }
}

/**
 * Načti produkty pro konkrétní kategorii
 * @param {number|string} categoryId - ID kategorie
 */
export async function getProductsByCategory(categoryId) {
  try {
    const data = await fetchDirectus('/api/items/products', {
      filter: JSON.stringify({ category: { id: { _eq: categoryId } } }),
      limit: 1000,
      fields: 'id,name,slug,description,price,image,category'
    });
    
    console.log(`✅ Produkty pro kategorii ${categoryId} načteny:`, data.data.length);
    return data.data || [];
  } catch (error) {
    console.error('Chyba při načítání produktů kategorie:', error);
    return [];
  }
}

/**
 * Načti domovskou stránku (pokud existuje collection "home")
 */
export async function getHomePage() {
  try {
    // Zkus načíst z collection "home" (pokud existuje)
    const data = await fetchDirectus('/api/items/home/1', {
      fields: '*'
    });
    
    console.log('✅ Home data načteny z Directusu');
    return data.data || null;
  } catch (error) {
    // Home collection může neexistovat, vrát null
    console.warn('Home collection nenalezena, používám defaults');
    return null;
  }
}

/**
 * Načti obrázek z Directusu
 * @param {string} imageId - UUID obrázku z Directusu
 * @returns {string} URL obrázku
 */
export function getImageUrl(imageId) {
  if (!imageId) return null;
  return `${DIRECTUS_URL}/assets/${imageId}`;
}

/**
 * Getter pro debug - vrátí aktuální konfiguraci
 */
export function getConfig() {
  return {
    url: DIRECTUS_URL,
    hasToken: !!DIRECTUS_TOKEN,
    tokenPreview: DIRECTUS_TOKEN ? DIRECTUS_TOKEN.substring(0, 20) + '...' : 'NO TOKEN'
  };
}

// ============================================================================
// EXPORT PRO KOMPATIBILITU SE STARÝM KÓDEM
// ============================================================================

export const directusApi = {
  get: fetchDirectus,
  getImageUrl,
  getConfig
};
