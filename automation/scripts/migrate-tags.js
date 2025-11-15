#!/usr/bin/env node
/**
 * 既存の data/posts.json の tags 配列を
 * data/tags.json で定義した統一フォーマットへ変換します。
 */

const path = require('path');
const { readJson, writeJson } = require('../lib/io');
const slugify = require('../lib/slugify');

const root = path.resolve(__dirname, '..', '..');
const postsPath = path.join(root, 'data', 'posts.json');
const tagsConfigPath = path.join(root, 'data', 'tags.json');

const normalizeToken = (value) => {
  if (value === null || value === undefined) return '';
  return value
    .toString()
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

const buildTagIndex = (config) => {
  const index = new Map();
  const register = (token, entry) => {
    if (!token || index.has(token)) return;
    index.set(token, entry);
  };

  config.forEach((entry) => {
    if (!entry?.slug) return;
    const normalized = {
      slug: entry.slug,
      label: entry.label || entry.slug,
      category: entry.category || 'その他',
      style: entry.style || null,
    };
    register(normalizeToken(entry.slug), normalized);
    register(normalizeToken(entry.label), normalized);
    if (Array.isArray(entry.aliases)) {
      entry.aliases.forEach((alias) => register(normalizeToken(alias), normalized));
    }
  });

  return index;
};

const mapTags = (tags, tagIndex) => {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const normalized = [];

  tags.forEach((tag, idx) => {
    const token = normalizeToken(tag);
    if (!token) return;
    const match = tagIndex.get(token);
    if (match) {
      if (seen.has(match.slug)) return;
      seen.add(match.slug);
      normalized.push({
        slug: match.slug,
        label: match.label,
        category: match.category,
        style: match.style,
      });
      return;
    }
    const fallbackBase = slugify(tag, 'tag');
    const fallbackSlug =
      seen.has(fallbackBase) || fallbackBase === 'tag'
        ? `${fallbackBase}-${idx + 1}`
        : fallbackBase;
    if (seen.has(fallbackSlug)) return;
    seen.add(fallbackSlug);
    const fallbackLabel = (tag ?? '').toString().trim() || `タグ${idx + 1}`;
    normalized.push({
      slug: fallbackSlug,
      label: fallbackLabel,
      category: 'その他',
      style: 'accent-neutral',
    });
  });

  return normalized;
};

const main = () => {
  const posts = readJson(postsPath, []);
  const tagConfig = readJson(tagsConfigPath, []);
  const tagIndex = buildTagIndex(Array.isArray(tagConfig) ? tagConfig : []);

  if (!Array.isArray(posts) || posts.length === 0) {
    console.log('[migrate-tags] data/posts.json に変換対象がありません。');
    return;
  }

  const migrated = posts.map((post) => ({
    ...post,
    tags: mapTags(post.tags, tagIndex),
  }));

  writeJson(postsPath, migrated);
  console.log(`[migrate-tags] ${migrated.length}件の投稿を変換しました。`);
};

main();
