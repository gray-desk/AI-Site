#!/usr/bin/env node
/**
 * Generator
 * - Picks pending candidates from data/candidates.json
 * - Calls OpenAI to research SEO-oriented article outline
 * - Returns article HTML for publisher and records topic history for deduplication
 */

const path = require('path');
const { readJson, writeJson } = require('../lib/io');
const slugify = require('../lib/slugify');

const root = path.resolve(__dirname, '..', '..');
const candidatesPath = path.join(root, 'data', 'candidates.json');
const postsJsonPath = path.join(root, 'data', 'posts.json');
const topicHistoryPath = path.join(root, 'data', 'topic-history.json');

const API_URL = 'https://api.openai.com/v1/chat/completions';
const DEDUPE_WINDOW_DAYS = 5;

const createChannelUrl = (channelId) =>
  channelId ? `https://www.youtube.com/channel/${channelId}` : '';

const resolveSourceUrl = (source) => {
  if (!source) return '';
  return source.url || createChannelUrl(source.channelId);
};

const toHtmlParagraphs = (text) => {
  if (!text) return '';
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join('\n      ');
};

const formatDateParts = (value) => {
  if (!value) {
    const now = new Date();
    return {
      dotted: '',
      verbose: '',
      year: now.getFullYear(),
    };
  }
  const normalized = value.replace(/\//g, '-');
  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return {
      dotted: value,
      verbose: value,
      year: now.getFullYear(),
    };
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return {
    dotted: `${y}.${m}.${d}`,
    verbose: `${y}年${m}月${d}日`,
    year: y,
  };
};

const slugifyHeading = (heading, index = 0) => {
  const base = heading || `section-${index + 1}`;
  const slug = base
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s・、。/]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `section-${index + 1}`;
};

const compileArticleHtml = (article, meta, options = {}) => {
  const assetBase = typeof options.assetBase === 'string' ? options.assetBase : '../';
  const normalizedAssetBase = assetBase.endsWith('/') ? assetBase : `${assetBase}/`;
  const cssHref = `${normalizedAssetBase}assets/css/style.css`;
  const mainJsSrc = `${normalizedAssetBase}assets/js/main.js`;
  const articleJsSrc = `${normalizedAssetBase}assets/js/article.js`;
  const homeHref = `${normalizedAssetBase}index.html`;

  const sections = Array.isArray(article.sections) ? article.sections : [];
  const tags = Array.isArray(article.tags) ? article.tags : [];

  const dateParts = formatDateParts(meta.date);
  const heroButtonHref = meta.videoUrl || meta.sourceUrl || homeHref;
  const heroButtonLabel = meta.videoUrl ? '元動画を見る' : '記事一覧へ戻る';
  const heroButtonAttrs = /^https?:/i.test(heroButtonHref)
    ? ' target="_blank" rel="noopener noreferrer"'
    : '';

  const tagMarkup = tags.length
    ? `<ul class="article-tags">
          ${tags.map((tag) => `<li>${tag}</li>`).join('\n          ')}
        </ul>`
    : '';

  const renderSubSections = (subSections = [], parentIndex = 0) => {
    if (!Array.isArray(subSections) || subSections.length === 0) {
      return '';
    }
    return subSections
      .map((subSection, childIndex) => {
        const heading = subSection.heading || `ポイント${parentIndex + 1}-${childIndex + 1}`;
        const body = toHtmlParagraphs(subSection.body || subSection.content || '');
        if (!body) return '';
        return `
              <div class="article-subsection">
                <h3>${heading}</h3>
                ${body}
              </div>`;
      })
      .filter(Boolean)
      .join('\n');
  };

  const sectionMarkup = sections
    .map((section, index) => {
      const heading = section.heading ?? `セクション${index + 1}`;
      const slug = slugifyHeading(heading, index);
      const overview = toHtmlParagraphs(section.overview || section.body || '');
      const subSections = renderSubSections(section.subSections, index);
      return `
            <section class="article-section" id="${slug}">
              <h2>${heading}</h2>
              ${overview}
              ${subSections}
            </section>`;
    })
    .join('\n');

  const introMarkup = article.intro
    ? `
        <section class="article-intro-block">
${toHtmlParagraphs(article.intro)}
        </section>`
    : '';

  const conclusionMarkup = article.conclusion
    ? `
      <section class="article-conclusion inner">
        <h2>まとめ</h2>
${toHtmlParagraphs(article.conclusion)}
      </section>`
    : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title} | AI情報ブログ</title>
  <meta name="description" content="${article.summary ?? ''}">

  <!-- ファビコン -->
  <link rel="icon" type="image/svg+xml" href="${normalizedAssetBase}assets/img/logo.svg">
  <link rel="apple-touch-icon" href="${normalizedAssetBase}assets/img/logo.svg">

  <!-- Open Graph / SNS共有 -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${article.title} | AI情報ブログ">
  <meta property="og:description" content="${article.summary ?? ''}">
  <meta property="og:image" content="${normalizedAssetBase}assets/img/ogp-default.svg">
  <meta property="og:site_name" content="AI情報ブログ">
  <meta property="og:locale" content="ja_JP">
  <meta property="article:published_time" content="${dateParts.dotted}T00:00:00+09:00">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${article.title} | AI情報ブログ">
  <meta name="twitter:description" content="${article.summary ?? ''}">
  <meta name="twitter:image" content="${normalizedAssetBase}assets/img/ogp-default.svg">

  <link rel="stylesheet" href="${cssHref}">
</head>
<body class="article-page">
  <!-- ヘッダーはcomponents.jsで動的に挿入されます -->

  <main>
    <article class="article-detail">
      <section class="inner article-hero">
        <p class="article-eyebrow">Daily Briefing</p>
        <div class="article-hero-main">
          <div>
            <p class="post-meta">${dateParts.dotted}</p>
            <h1>${article.title}</h1>
            <p class="article-summary">${article.summary ?? ''}</p>
          </div>
          <div class="article-hero-cta">
            <a class="button button-primary" href="${heroButtonHref}"${heroButtonAttrs}>${heroButtonLabel}</a>
            <button class="button button-ghost" type="button" data-share-target="native">この記事を共有</button>
          </div>
        </div>

        <div class="article-meta-grid">
          <article class="meta-card">
            <p class="meta-label">公開日</p>
            <p class="meta-value">${dateParts.verbose || meta.date}</p>
          </article>
        </div>

        ${tagMarkup}

        <div class="article-share-links">
          <a class="share-link" href="#" data-share-target="x" aria-label="Xで共有">Xで共有</a>
          <a class="share-link" href="#" data-share-target="linkedin" aria-label="LinkedInで共有">LinkedIn</a>
          <button class="share-link copy-link" type="button" data-copy-link>リンクをコピー</button>
        </div>
      </section>

      <div class="inner article-grid">
        <div class="article-main-column">
          <article class="post-article article-content">
${introMarkup}
${sectionMarkup}
          </article>
        </div>

        <aside class="article-sidebar" aria-label="補足情報">
          <section class="article-card article-toc">
            <p class="article-card-label">目次</p>
            <ol class="toc-list" data-toc-list aria-live="polite"></ol>
          </section>
        </aside>
      </div>

      ${conclusionMarkup}
    </article>
  </main>

  <!-- フッターはcomponents.jsで動的に挿入されます -->

  <script src="${normalizedAssetBase}assets/js/components.js"></script>
  <script src="${mainJsSrc}" defer></script>
  <script src="${articleJsSrc}" defer></script>
</body>
</html>`;
};

const parseCompletionContent = (content) => {
  if (!content) {
    throw new Error('OpenAIレスポンスにcontentが含まれていません');
  }
  if (typeof content === 'string') {
    return JSON.parse(content);
  }
  if (Array.isArray(content)) {
    const merged = content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (typeof part?.text === 'string') return part.text;
        return '';
      })
      .join('')
      .trim();
    return JSON.parse(merged);
  }
  throw new Error('contentの形式を解析できませんでした');
};

const formatSearchSummaries = (summaries) => {
  if (!Array.isArray(summaries) || summaries.length === 0) {
    return '検索要約が取得できていません。YouTube動画の内容と一般的な知識を頼りに記事を構成してください。';
  }
  return summaries
    .map((item, index) => {
      const title = item.title || `Source ${index + 1}`;
      const url = item.url || 'URLなし';
      const summary = item.summary || item.snippet || '要約なし';
      const snippet = item.snippet ? `\nスニペット: ${item.snippet}` : '';
      return `### ソース${index + 1}\nタイトル: ${title}\nURL: ${url}\n要約: ${summary}${snippet}`;
    })
    .join('\n\n');
};

const requestArticleDraft = async (apiKey, candidate) => {
  const today = new Date().toISOString().split('T')[0];
  const focusText = (candidate.source.focus || []).join(' / ');
  const searchSummary = formatSearchSummaries(candidate.searchSummaries);
  const sourceUrl = resolveSourceUrl(candidate.source);
  const promptSourceUrl = sourceUrl || 'URL不明';
  const payload = {
    model: 'gpt-4o',
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are an SEO-focused AI editor. Always respond with valid JSON. Keep tone factual, include concrete insights, and avoid speculation.',
      },
      {
        role: 'user',
        content: `
You are given metadata from a YouTube video and 検索リサーチ要約. Generate a Japanese blog article draft in Japanese for AI情報ブログ.
Video Title: ${candidate.video.title}
Video URL: ${candidate.video.url}
Published At: ${candidate.video.publishedAt}
Channel: ${candidate.source.name} (${promptSourceUrl})
Channel Focus: ${focusText}
Video Description:
${candidate.video.description}

Research summaries from Google Search (top 3 articles):
${searchSummary}

Requirements:
- Return valid JSON with keys: title, summary, intro, sections, conclusion, tags.
- title: <= 60 Japanese characters, should be descriptive and SEO-friendly.
- summary: 1-2 sentences that highlight the main takeaway for previews.
- intro: 2-3 paragraphs referencing both the video context and research insights.
- sections: 3 to 4 entries. Each section must include "heading" (H2 title), "overview" (3-4 sentences), and "subSections" (array of 1-2 items with "heading" for H3 and "body" paragraphs tying back to research insights; each body 3 sentences以上).
- tags: 2-4 concise keywords relevant to the topic.
- conclusion: Summarize the guidance for readers and mention real-world implications.
- Ensure the combined length of intro + sections + conclusion is at least 1,500 Japanese characters while remaining concise and readable.
- Naturally weave important phrases and keywords from the research summaries and video description.
- Do NOT include explicit sections for 読了時間, 差別化ポイント, 参考文献, or 補足メモ.
- Treat ${today} as the publication date.

Output JSON example schema:
{
  "title": "...",
  "summary": "...",
  "intro": "...",
  "tags": ["..."],
  "sections": [
    {
      "heading": "...",
      "overview": "...",
      "subSections": [
        { "heading": "...", "body": "..." }
      ]
    }
  ],
  "conclusion": "..."
}
`,
      },
    ],
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const completion = await response.json();
  const content = completion?.choices?.[0]?.message?.content;
  return parseCompletionContent(content);
};

const isDuplicateTopic = (topicKey, posts, history) => {
  const now = Date.now();
  const windowMs = DEDUPE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const cutoff = now - windowMs;

  const inPosts = posts.some((post) => slugify(post.title) === topicKey);
  if (inPosts) return true;

  return history.some((entry) => {
    if (entry.topicKey !== topicKey) return false;
    const last = new Date(entry.lastPublishedAt || entry.firstSeen).getTime();
    return !Number.isNaN(last) && last >= cutoff;
  });
};

const updateTopicHistory = (history, topicKey, record) => {
  const filtered = history.filter((entry) => entry.topicKey !== topicKey);
  const now = new Date().toISOString();
  filtered.push({
    topicKey,
    firstSeen: record.firstSeen || now,
    lastPublishedAt: record.lastPublishedAt || now,
    sourceName: record.sourceName,
    videoTitle: record.videoTitle,
    draftUrl: record.draftUrl,
  });
  return filtered;
};

const runGenerator = async () => {
  console.log('[generator] ステージ開始: 候補の分析を実行します。');
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY が設定されていません。GitHub Secrets に登録してください。');
  }

  const candidates = readJson(candidatesPath, []);
  const posts = readJson(postsJsonPath, []);
  const topicHistory = readJson(topicHistoryPath, []);

  const candidate = candidates.find((item) => item.status === 'pending');
  if (!candidate) {
    console.log('[generator] pending状態の候補が存在しないため処理を終了します。');
    return {
      generated: false,
      reason: 'no-pending-candidates',
    };
  }

  console.log(
    `[generator] 対象候補: ${candidate.id} / ${candidate.source.name} / ${candidate.video?.title}`,
  );
  const sourceUrl = resolveSourceUrl(candidate.source);
  const topicKey = candidate.topicKey || slugify(candidate.video?.title);
  const duplicate = isDuplicateTopic(topicKey, posts, topicHistory);
  console.log(`[generator] 重複判定: ${duplicate ? '重複あり → スキップ' : '新規トピック'}`);

  if (duplicate) {
    const now = new Date().toISOString();
    const updatedCandidates = candidates.map((item) =>
      item.id === candidate.id
        ? {
            ...item,
            status: 'skipped',
            skipReason: 'duplicate-topic',
            updatedAt: now,
          }
        : item,
    );
    writeJson(candidatesPath, updatedCandidates);
    return {
      generated: false,
      reason: 'duplicate-topic',
      candidateId: candidate.id,
    };
  }

  const searchSummaries = Array.isArray(candidate.searchSummaries)
    ? candidate.searchSummaries
    : [];
  if (searchSummaries.length === 0) {
    console.log('[generator] collectorから検索要約が届いていないため、動画情報のみで下書きを生成します。');
  }

  const enrichedCandidate = {
    ...candidate,
    searchSummaries,
  };

  const article = await requestArticleDraft(apiKey, enrichedCandidate);
  console.log(`[generator] OpenAI応答を受信: "${article.title}"`);

  const today = new Date().toISOString().split('T')[0];
  const slugifiedTitle = slugify(article.title, topicKey || 'ai-topic');
  const slug = `${today}-${slugifiedTitle}`;
  const fileName = `${slug}.html`;
  const publishRelativePath = path.posix.join('posts', fileName);

  const meta = {
    date: today,
    sourceName: candidate.source.name,
    sourceUrl,
    videoUrl: candidate.video.url,
  };

  const publishHtml = compileArticleHtml(article, meta, { assetBase: '../' });

  const now = new Date().toISOString();

  const updatedCandidates = candidates.map((item) =>
    item.id === candidate.id
      ? {
          ...item,
          status: 'generated',
          generatedAt: now,
          updatedAt: now,
          topicKey,
          postDate: today,
          slug,
          outputFile: publishRelativePath,
        }
      : item,
  );
  writeJson(candidatesPath, updatedCandidates);

  const updatedHistory = updateTopicHistory(topicHistory, topicKey, {
    sourceName: candidate.source.name,
    videoTitle: candidate.video.title,
    draftUrl: publishRelativePath,
    lastPublishedAt: today,
  });
  writeJson(topicHistoryPath, updatedHistory);
  console.log('[generator] candidates と topic-history を更新しました。');

  const postEntry = {
    title: article.title,
    date: today,
    summary: article.summary ?? '',
    tags: Array.isArray(article.tags) ? article.tags : [],
    url: publishRelativePath,
    slug,
  };

  const articleData = {
    title: article.title,
    summary: article.summary ?? '',
    intro: article.intro ?? '',
    conclusion: article.conclusion ?? '',
    tags: Array.isArray(article.tags) ? article.tags : [],
    sections: Array.isArray(article.sections) ? article.sections : [],
    slug,
    date: today,
    htmlContent: publishHtml,
    relativePath: publishRelativePath,
    source: {
      name: candidate.source.name,
      url: sourceUrl,
    },
    video: {
      title: candidate.video.title,
      url: candidate.video.url,
    },
    searchSummaries,
  };

  console.log(
    `[generator] 記事データを返却: slug=${slug}, ファイル予定パス=${publishRelativePath}`,
  );

  return {
    generated: true,
    candidateId: candidate.id,
    postEntry,
    draftUrl: publishRelativePath,
    topicKey,
    article: articleData,
  };
};

if (require.main === module) {
  runGenerator()
    .then((result) => {
      console.log('Generator finished:', result);
    })
    .catch((error) => {
      console.error('Generator failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runGenerator,
};
