/**
 * @fileoverview 記事コンテンツ取得サービス
 * Google検索で見つかった記事のURLからHTMLを取得し、本文テキストを抽出します。
 * また、抽出したテキストの品質をチェックし、低品質なコンテンツ（エラーページ、短い文章など）を除外します。
 */

const { RESEARCHER } = require('../../config/constants');
const { decodeHtmlEntities } = require('../../lib/text');

// 設定ファイルから定数をインポート
const {
  ARTICLE_FETCH_TIMEOUT_MS, // 記事取得のタイムアウト時間（ミリ秒）
  ARTICLE_TEXT_MAX_LENGTH,  // 抽出する本文の最大文字数
  USER_AGENT,               // HTTPリクエストのUser-Agentヘッダ
} = RESEARCHER;

const cheerio = require('cheerio');

/**
 * 指定されたURLから記事の本文テキストを非同期で取得します。
 * Cheerioを使用してHTMLをパースし、不要な要素を除去して本文を抽出します。
 * @param {string} url - 取得対象の記事URL
 * @returns {Promise<string>} 抽出・正規化された本文テキスト（最大`ARTICLE_TEXT_MAX_LENGTH`文字）。失敗した場合は空文字列を返します。
 */
const fetchArticleText = async (url) => {
  if (!url) return '';

  // AbortControllerを使ってタイムアウト処理を実装
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ARTICLE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // CheerioでHTMLをロード
    const $ = cheerio.load(html);

    // 不要な要素を削除
    $('script, style, noscript, svg, head, iframe, nav, footer, header, .ad, .ads, .advertisement').remove();

    // 本文と思われる要素からテキストを抽出
    // body全体のテキストを取得し、空白を正規化
    let text = $('body').text();

    // HTMLエンティティのデコードと空白の正規化
    text = decodeHtmlEntities(text).replace(/\s+/g, ' ').trim();

    return text.slice(0, ARTICLE_TEXT_MAX_LENGTH);
  } catch (error) {
    // タイムアウトやネットワークエラーなど
    console.warn(`[researcher] ${url} の本文取得に失敗しました: ${error.message}`);
    return '';
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * 抽出されたコンテンツの品質を簡易的にチェックします。
 * @param {string} text - チェック対象のテキスト
 * @returns {boolean} 品質が基準を満たしている場合はtrue、そうでない場合はfalse
 */
const isQualityContent = (text) => {
  // 1. 文字数チェック: 最低でも100文字以上あるか
  if (!text || text.length < 100) {
    return false;
  }

  // 2. 日本語の割合をチェック: 日本語（ひらがな、カタカナ、漢字）が30%未満の場合は、日本語の記事ではない可能性が高い
  const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g);
  const japaneseRatio = japaneseChars ? japaneseChars.length / text.length : 0;
  if (japaneseRatio < 0.3) {
    return false;
  }

  // 3. メタデータ的なキーワードが多く、本文が短い場合は除外
  // (例: 利用規約ページ、エラーページなど)
  const metaKeywords = ['Copyright', 'Press', 'Privacy Policy', 'Terms', 'NFL Sunday Ticket'];
  const hasMetaKeywords = metaKeywords.some((keyword) => text.includes(keyword));
  if (hasMetaKeywords && text.length < 500) {
    return false;
  }

  return true;
};

module.exports = {
  fetchArticleText,
  isQualityContent,
};