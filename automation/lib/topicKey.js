const slugify = require('./slugify');
const { TOPIC_KEY_EXTRACTION } = require('../config/models');
const PROMPTS = require('../config/prompts');
const { callOpenAI, extractContent } = require('./openai');

const safeJsonParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    const match = value.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerError) {
        return null;
      }
    }
    return null;
  }
};

const sanitizeText = (value) => {
  if (value === null || value === undefined) return '';
  return value.toString().trim();
};

const normalizeTopicPayload = (payload, fallbackTitle) => {
  const product = sanitizeText(payload?.product || payload?.product_name);
  const feature = sanitizeText(payload?.feature || payload?.capability);
  const category = sanitizeText(payload?.category);
  const confidence = Number.isFinite(Number(payload?.confidence))
    ? Number(payload.confidence)
    : null;
  const reasoning = sanitizeText(payload?.reasoning);

  const fallbackBase = [product, feature].filter(Boolean).join('-') || sanitizeText(payload?.topic_key);
  const slugSource = sanitizeText(payload?.topic_key || fallbackBase);
  const topicKey = slugify(slugSource || fallbackTitle, 'ai-topic');

  return {
    topicKey,
    rawTopicKey: slugSource || fallbackBase || fallbackTitle,
    product: product || null,
    feature: feature || null,
    category: category || null,
    confidence,
    reasoning: reasoning || null,
  };
};

const deriveTopicKey = async (apiKey, video = {}, source = {}) => {
  if (!video?.title) {
    throw new Error('動画タイトルが未指定のためtopic_keyを生成できません');
  }

  const messages = [
    {
      role: 'system',
      content: PROMPTS.TOPIC_KEY_EXTRACTION.system,
    },
    {
      role: 'user',
      content: PROMPTS.TOPIC_KEY_EXTRACTION.user({
        title: video.title,
        description: video.description || '',
        channelName: source?.name || video.channelTitle || '',
        channelFocus: source?.focus || [],
        publishedAt: video.publishedAt || '',
      }),
    },
  ];

  const completion = await callOpenAI({
    apiKey,
    messages,
    model: TOPIC_KEY_EXTRACTION.model,
    temperature: TOPIC_KEY_EXTRACTION.temperature,
    maxTokens: TOPIC_KEY_EXTRACTION.max_tokens,
    responseFormat: TOPIC_KEY_EXTRACTION.response_format,
  });

  const content = extractContent(completion);
  const parsed = safeJsonParse(content);
  if (!parsed) {
    throw new Error('topic_keyレスポンスの解析に失敗しました');
  }

  const normalized = normalizeTopicPayload(parsed, video.title);
  return {
    topicKey: normalized.topicKey,
    raw: normalized.rawTopicKey,
    product: normalized.product,
    feature: normalized.feature,
    category: normalized.category,
    confidence: normalized.confidence,
    reasoning: normalized.reasoning,
    method: 'openai',
    payload: parsed,
  };
};

module.exports = {
  deriveTopicKey,
};
