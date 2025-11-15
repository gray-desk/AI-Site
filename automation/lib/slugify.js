const slugify = (value, fallback = 'ai-topic') => {
  if (!value) return fallback;
  const ascii = value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return ascii || fallback;
};

module.exports = slugify;
