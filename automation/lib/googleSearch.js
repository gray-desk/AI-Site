const DEFAULT_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';

const extractItems = (payload, limit = 3) => {
  if (!payload?.items) return [];
  return payload.items.slice(0, limit).map((item) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    displayLink: item.displayLink,
  }));
};

const searchTopArticles = async ({ apiKey, cx, query, num = 3 }) => {
  if (!apiKey || !cx || !query) {
    return { items: [], fromCache: false };
  }

  const url = new URL(DEFAULT_ENDPOINT);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', cx);
  url.searchParams.set('q', query);
  url.searchParams.set('num', String(Math.min(num, 10)));
  url.searchParams.set('lr', 'lang_ja');

  const response = await fetch(url.toString());
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Search API error: ${response.status} ${text}`);
  }

  const json = await response.json();
  return {
    items: extractItems(json, num),
    fromCache: false,
  };
};

module.exports = {
  searchTopArticles,
};
