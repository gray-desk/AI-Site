const decodeHtmlEntities = (value) => {
  if (!value) return '';
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '');
};

const extractText = (value) => decodeHtmlEntities(value).trim();

module.exports = {
  decodeHtmlEntities,
  extractText,
};
