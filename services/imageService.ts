const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';
const GOOGLE_API_URL = 'https://www.googleapis.com/customsearch/v1';

// Cache for images to prevent redundant network requests
const imageCache: Record<string, string> = {};

export async function fetchImage(query: string): Promise<string> {
  // Check cache first
  if (imageCache[query]) {
    return imageCache[query];
  }

  let imageUrl: string | null = null;

  // 1. Try Google Custom Search (if keys are configured)
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_CX) {
      imageUrl = await fetchGoogleImage(query);
  }

  // 2. Fallback to Wikipedia if Google failed or keys missing
  if (!imageUrl) {
      imageUrl = await fetchWikiImage(query);
  }

  if (imageUrl) {
      imageCache[query] = imageUrl;
      return imageUrl;
  }

  return getFallbackImage(query);
}

async function fetchGoogleImage(query: string): Promise<string | null> {
    try {
        const params = new URLSearchParams({
            key: process.env.GOOGLE_SEARCH_API_KEY || '',
            cx: process.env.GOOGLE_CX || '',
            q: query,
            searchType: 'image',
            num: '1',
            imgSize: 'large', // Prefer high res
            safe: 'active'
        });

        const res = await fetch(`${GOOGLE_API_URL}?${params.toString()}`);
        const data = await res.json();

        if (data.items && data.items.length > 0) {
            return data.items[0].link;
        }
    } catch (error) {
        console.warn(`Google Image Search failed for ${query}:`, error);
    }
    return null;
}

async function fetchWikiImage(query: string): Promise<string | null> {
  try {
    // 1. Search for the page
    const searchParams = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: query,
      format: 'json',
      origin: '*',
      srlimit: '1'
    });

    const searchRes = await fetch(`${WIKI_API_URL}?${searchParams.toString()}`);
    const searchData = await searchRes.json();

    if (!searchData.query?.search?.length) {
      return null;
    }

    const title = searchData.query.search[0].title;

    // 2. Get the image for the page
    const imageParams = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'pageimages',
      format: 'json',
      pithumbsize: '1000', // High res thumbnail
      origin: '*'
    });

    const imageRes = await fetch(`${WIKI_API_URL}?${imageParams.toString()}`);
    const imageData = await imageRes.json();

    const pages = imageData.query?.pages;
    if (!pages) return null;

    const pageId = Object.keys(pages)[0];
    const imageUrl = pages[pageId]?.thumbnail?.source;

    return imageUrl || null;

  } catch (error) {
    console.warn(`Wiki Image Search failed for ${query}:`, error);
    return null;
  }
}

function getFallbackImage(query: string): string {
  return `https://placehold.co/600x400/1e293b/cbd5e1?text=${encodeURIComponent(query)}`;
}
