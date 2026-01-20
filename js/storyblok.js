// Initialize Storyblok API directly
const storyblokApi = {
  get: async (path, params = {}) => {
    const url = new URL(`https://api.storyblok.com/v1/${path}`);
    url.searchParams.append('token', 'VdLWwVoZVAbmH4X3E93rhwtt');
    
    // Add query parameters
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    }
    
    try {
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Storyblok API Error:', error);
      throw error;
    }
  }
};

// Helper function to convert richtext to HTML
function richtextToHtml(content) {
  if (!content) return '';
  if (typeof content === 'string') return content;
  
  // If it's already an object, check if it has content property
  if (typeof content === 'object') {
    if (content.content && Array.isArray(content.content)) {
      return extractTextFromRichtext(content.content);
    }
    // If it's just a string representation, return it
    return String(content);
  }
  
  return '';
}

function extractTextFromRichtext(content) {
  if (!Array.isArray(content)) return '';
  
  return content.map(block => {
    if (!block) return '';
    
    if (block.type === 'paragraph' && block.content) {
      return '<p>' + block.content.map(inline => {
        if (!inline) return '';
        if (inline.type === 'text') return inline.text || '';
        if (inline.type === 'hardBreak') return '<br>';
        return '';
      }).join('') + '</p>';
    }
    if (block.type === 'heading' && block.content) {
      const level = block.attrs?.level || 2;
      const text = block.content.map(inline => inline.text || '').join('');
      return `<h${level}>${text}</h${level}>`;
    }
    if (block.type === 'bullet_list' && block.content) {
      return '<ul>' + block.content.map(li => {
        if (li.content) {
          const text = li.content.map(p => {
            if (p.content) return p.content.map(inline => inline.text || '').join('');
            return '';
          }).join('');
          return `<li>${text}</li>`;
        }
        return '';
      }).join('') + '</ul>';
    }
    return '';
  }).join('');
}

// FETCH HOMEPAGE
export async function getHomePage() {
  try {
    const data = await storyblokApi.get('cdn/stories/home', {
      version: 'draft'
    });
    return data.story.content;
  } catch (error) {
    console.error('Error fetching homepage:', error);
    return null;
  }
}

export { richtextToHtml, extractTextFromRichtext };

// FETCH ALL CATEGORIES
export async function getCategories() {
  try {
    const data = await storyblokApi.get('cdn/stories', {
      version: 'draft',
      starts_with: 'categories/',
      per_page: 100
    });
    
    // The API already filters by "starts_with", so we just return all
    // Main categories are returned directly (plechovky, sklenice, vicka)
    // Subcategories would be (categories/vicka/to82, etc.)
    const mainCategories = data.stories.filter(story => {
      // Only return if it's a main category (no additional path segments)
      return !story.parent_id || story.parent_id === 0;
    });
    
    console.log('Filtered main categories:', mainCategories.map(c => ({ slug: c.slug, name: c.content.category_name })));
    return mainCategories.length > 0 ? mainCategories : data.stories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// FETCH SUBCATEGORIES BY CATEGORY
export async function getSubcategoriesByCategory(categorySlug) {
  try {
    const data = await storyblokApi.get('cdn/stories', {
      version: 'draft',
      starts_with: `categories/${categorySlug}/`,
      per_page: 100
    });
    return data.stories;
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return [];
  }
}

// FETCH PRODUCTS BY SUBCATEGORY
export async function getProductsBySubcategory(subcategorySlug) {
  try {
    const data = await storyblokApi.get('cdn/stories', {
      version: 'draft',
      starts_with: 'products/',
      per_page: 100
    });
    // Filter products by subcategory relationship
    return data.stories.filter(story => {
      const subcatRef = story.content.subcategory;
      if (subcatRef && Array.isArray(subcatRef)) {
        return subcatRef.some(ref => ref.uuid || ref.id);
      }
      return false;
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// FETCH ALL PRODUCTS
export async function getAllProducts() {
  try {
    const data = await storyblokApi.get('cdn/stories', {
      version: 'draft',
      starts_with: 'products/',
      per_page: 100
    });
    return data.stories;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// FETCH SINGLE PRODUCT
export async function getProduct(productSlug) {
  try {
    const data = await storyblokApi.get(`cdn/stories/products/${productSlug}`, {
      version: 'draft'
    });
    return data.story.content;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// FETCH SINGLE CATEGORY
export async function getCategory(categorySlug) {
  try {
    const data = await storyblokApi.get(`cdn/stories/categories/${categorySlug}`, {
      version: 'draft'
    });
    return data.story.content;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

// FETCH SINGLE SUBCATEGORY
export async function getSubcategory(categorySlug, subcategorySlug) {
  try {
    const data = await storyblokApi.get(`cdn/stories/categories/${categorySlug}/${subcategorySlug}`, {
      version: 'draft'
    });
    return data.story.content;
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    return null;
  }
}

export { storyblokApi };