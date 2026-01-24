#!/usr/bin/env node
/**
 * Import data from Storyblok CDN into Strapi (categories + products)
 *
 * Requires .env with:
 * - STORYBLOK_TOKEN
 * - STRAPI_URL (e.g. https://your-strapi.onrender.com)
 * - STRAPI_TOKEN (Strapi API Token with write access)
 */

const axios = require('axios');
const qs = require('querystring');
require('dotenv').config();

const SB_TOKEN = process.env.STORYBLOK_TOKEN;
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!SB_TOKEN) {
  console.error('Missing STORYBLOK_TOKEN in .env');
  process.exit(1);
}
if (!STRAPI_URL || !STRAPI_TOKEN) {
  console.error('Missing STRAPI_URL or STRAPI_TOKEN in .env');
  console.error('Add STRAPI_URL=https://<your-cloud-strapi-url> and STRAPI_TOKEN=<api-token>');
  process.exit(1);
}

const sb = axios.create({
  baseURL: 'https://api.storyblok.com/v1',
  timeout: 20000
});

const strapi = axios.create({
  baseURL: STRAPI_URL,
  headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
  timeout: 20000
});

function normalizeRichText(rt) {
  try {
    if (!rt) return '';
    if (typeof rt === 'string') return rt;
    if (Array.isArray(rt?.content)) {
      return rt.content
        .map(block => {
          if (block.type === 'paragraph' && Array.isArray(block.content)) {
            return block.content.map(inline => inline.text || '').join('');
          }
          if (block.type === 'heading' && Array.isArray(block.content)) {
            return block.content.map(inline => inline.text || '').join('');
          }
          return '';
        })
        .join('\n');
    }
    return String(rt);
  } catch (_) {
    return '';
  }
}

function slugFromFullSlug(full) {
  if (!full) return '';
  const parts = String(full).split('/').filter(Boolean);
  return parts[parts.length - 1] || full;
}

async function fetchStories(prefix) {
  const params = {
    token: SB_TOKEN,
    version: 'draft',
    starts_with: prefix,
    per_page: 100
  };
  const url = `/cdn/stories?${qs.stringify(params)}`;
  const { data } = await sb.get(url);
  return data.stories || [];
}

async function ensureCollectionExists(kind) {
  // Assumes Strapi has content-types: categories, products
  // If not, this script will fail with 404. Create them first in Strapi Admin.
  const url = `${STRAPI_URL}/api/${kind}`;
  try {
    await strapi.get(url);
    return true;
  } catch (e) {
    console.error(`Strapi collection '${kind}' not reachable. Create it in Strapi first.`);
    throw e;
  }
}

async function importCategories(sbCategories) {
  console.log(`\nImporting ${sbCategories.length} categories...`);
  const uuidToStrapiId = new Map();
  const slugToStrapiId = new Map();

  for (const cat of sbCategories) {
    const name = cat.content?.category_name || cat.name || slugFromFullSlug(cat.full_slug);
    const slug = cat.slug || slugFromFullSlug(cat.full_slug);
    const description = normalizeRichText(cat.content?.description);
    const imageUrl = cat.content?.icon?.filename || null;

    try {
      const { data } = await strapi.post('/api/categories', {
        data: { name, slug, description, image_url: imageUrl }
      });
      const id = data?.data?.id;
      if (id) {
        uuidToStrapiId.set(cat.uuid, id);
        slugToStrapiId.set(slug, id);
        console.log(`  ✓ Category '${name}' → id ${id}`);
      } else {
        console.warn(`  ! Category '${name}' created but no id returned`);
      }
    } catch (e) {
      const status = e.response?.status;
      const errData = e.response?.data;
      console.error(`  × Failed category '${name}' (${status}):`, errData || e.message);
    }
  }

  return { uuidToStrapiId, slugToStrapiId };
}

async function importProducts(sbProducts, catMap) {
  console.log(`\nImporting ${sbProducts.length} products...`);
  let ok = 0;
  let fail = 0;

  for (const p of sbProducts) {
    const name = p.content?.product_name || p.name || slugFromFullSlug(p.full_slug);
    const slug = p.slug || slugFromFullSlug(p.full_slug);
    const description = normalizeRichText(p.content?.description);
    const price = Number(p.content?.price) || null;
    const imageUrl = p.content?.image?.filename || p.content?.thumbnail?.filename || null;

    // Map first category UUID to Strapi id
    let categoryId = null;
    const catRef = p.content?.category;
    if (Array.isArray(catRef) && catRef.length > 0) {
      const uuid = catRef[0];
      categoryId = catMap.uuidToStrapiId.get(uuid) || null;
    }

    const payload = {
      data: {
        name,
        slug,
        description,
        price,
        image_url: imageUrl,
        category: categoryId,
        publishedAt: new Date().toISOString() // publish immediately
      }
    };

    try {
      const { data } = await strapi.post('/api/products', payload);
      const id = data?.data?.id;
      ok++;
      console.log(`  ✓ Product '${name}' → id ${id}`);
    } catch (e) {
      fail++;
      const status = e.response?.status;
      const errData = e.response?.data;
      console.error(`  × Failed product '${name}' (${status}):`, errData || e.message);
    }
  }

  console.log(`\nProducts imported: ${ok} ok, ${fail} failed`);
}

async function main() {
  console.log('Starting Storyblok → Strapi import...');
  await ensureCollectionExists('categories');
  await ensureCollectionExists('products');

  const sbCategories = await fetchStories('categories/');
  const categoryMaps = await importCategories(sbCategories);

  const sbProducts = await fetchStories('products/');
  await importProducts(sbProducts, categoryMaps);

  console.log('\nImport finished.');
}

main().catch((e) => {
  console.error('Fatal import error:', e.message);
  process.exit(1);
});
