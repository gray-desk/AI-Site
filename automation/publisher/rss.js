/**
 * @fileoverview RSS Feed Generator
 * Generates an RSS 2.0 feed from the posts data.
 */

const { SITE_CONFIG } = require('../config/constants');

/**
 * Escapes special characters for XML.
 * @param {string} unsafe 
 * @returns {string}
 */
const escapeXml = (unsafe) => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe).replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
};

/**
 * Generates RSS 2.0 XML string.
 * @param {Array<object>} posts - List of posts
 * @returns {string} XML string
 */
const generateRSS = (posts) => {
    const baseUrl = SITE_CONFIG.BASE_URL || 'https://example.com'; // Fallback if not set
    const buildDate = new Date().toUTCString();

    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>AI情報ブログ</title>
  <link>${baseUrl}</link>
  <description>AI・機械学習の最新情報を自動収集・分析。YouTubeチャンネルから注目トピックを抽出し、深掘りした記事を毎日2回自動更新。</description>
  <language>ja</language>
  <lastBuildDate>${buildDate}</lastBuildDate>
  <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
`;

    posts.forEach(post => {
        if (!post.url) return;

        const pubDate = post.publishedAt
            ? new Date(post.publishedAt).toUTCString()
            : new Date(post.date).toUTCString();

        const fullUrl = `${baseUrl}/${post.url}`;

        xml += `
  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${fullUrl}</link>
    <guid isPermaLink="true">${fullUrl}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapeXml(post.summary)}</description>
    ${(post.tags || []).map(tag => {
            const label = typeof tag === 'object' ? tag.label : tag;
            return `<category>${escapeXml(label)}</category>`;
        }).join('\n    ')}
  </item>`;
    });

    xml += `
</channel>
</rss>`;

    return xml;
};

module.exports = {
    generateRSS
};
