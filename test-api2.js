const storyblokApi = {
  get: async (path, params = {}) => {
    const url = new URL(`https://api.storyblok.com/v1/${path}`);
    url.searchParams.append('token', 'VdLWwVoZVAbmH4X3E93rhwtt');
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
  }
};

(async () => {
  const data = await storyblokApi.get('cdn/stories', {
    version: 'draft',
    starts_with: 'products/',
    per_page: 100
  });
  
  console.log('Product category values:');
  data.stories.forEach(p => {
    console.log(`- ${p.slug}: category=${p.content.category}, subcategory=${p.content.subcategory}`);
  });
  
  // Get categories to map UUIDs
  const catData = await storyblokApi.get('cdn/stories', {
    version: 'draft',
    starts_with: 'categories/',
    per_page: 100
  });
  
  console.log('\n\nCategory UUID mapping:');
  catData.stories.forEach(c => {
    if (!c.parent_id || c.parent_id === 0) {
      console.log(`- ${c.slug}: uuid=${c.uuid}`);
    }
  });
})();
