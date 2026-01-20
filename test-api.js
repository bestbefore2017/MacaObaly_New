// Test script to check Storyblok data structure

const storyblokApi = {
  get: async (path, params = {}) => {
    const url = new URL(`https://api.storyblok.com/v1/${path}`);
    url.searchParams.append('token', 'VdLWwVoZVAbmH4X3E93rhwtt');
    
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

async function testApi() {
  console.log('=== Testing Storyblok API Structure ===\n');
  
  // Get all subcategories
  const subData = await storyblokApi.get('cdn/stories', {
    version: 'draft',
    starts_with: 'subcategories/',
    per_page: 100
  });
  
  console.log('Subcategories found:', subData.stories.length);
  if (subData.stories.length > 0) {
    console.log('\nFirst subcategory:');
    console.log(JSON.stringify(subData.stories[0], null, 2));
  }
  
  // Get all products
  const prodData = await storyblokApi.get('cdn/stories', {
    version: 'draft',
    starts_with: 'products/',
    per_page: 100
  });
  
  console.log('\n\nProducts found:', prodData.stories.length);
  if (prodData.stories.length > 0) {
    console.log('\nFirst product:');
    console.log(JSON.stringify(prodData.stories[0], null, 2));
  }
  
  // Get categories
  const catData = await storyblokApi.get('cdn/stories', {
    version: 'draft',
    starts_with: 'categories/',
    per_page: 100
  });
  
  console.log('\n\nCategories found:', catData.stories.length);
  if (catData.stories.length > 0) {
    console.log('\nFirst category:');
    console.log(JSON.stringify(catData.stories[0], null, 2));
  }
}

testApi().catch(console.error);
