/**
 * @fileoverview AI情報ブログ メインスクリプト (トップページ用)
 * サイト全体の共通機能と、記事一覧ページのインタラクティブなUIを制御します。
 */

// --- 共通UI機能 ---

/**
 * スクロール時にヘッダーのスタイルを変更します。
 */
const initHeaderScroll = () => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  // 重複登録防止
  if (window.headerScrollHandler) {
    window.removeEventListener('scroll', window.headerScrollHandler);
  }

  const scrollThreshold = 50;
  window.headerScrollHandler = () => {
    if (window.pageYOffset > scrollThreshold) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', window.headerScrollHandler, { passive: true });
};


/**
 * ページ内アンカーリンクのスムーズスクロール
 */
const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    // 重複登録防止（簡易的）
    if (anchor.dataset.smoothScrollInit) return;
    anchor.dataset.smoothScrollInit = 'true';

    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      try {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      } catch (error) {
        console.warn(`Smooth scroll target not found or invalid: ${href}`);
      }
    });
  });
};


/**
 * スクロールアニメーション (IntersectionObserver)
 */
const initScrollAnimations = () => {
  if (!('IntersectionObserver' in window)) return;

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll, .post-card, .workflow-card, .source-card, .info-panel, .hero-panel').forEach(el => {
    observer.observe(el);
  });
};


// --- 記事一覧ページの機能 ---

/**
 * 記事一覧の初期化
 */
const initPostList = () => {
  const listContainer = document.getElementById('post-list');
  if (!listContainer) return;

  // 既に初期化済みならスキップ
  if (listContainer.dataset.postListInit) return;
  listContainer.dataset.postListInit = 'true';

  const elements = {
    list: listContainer,
    errorLabel: document.getElementById('post-error'),
    tagSearchPanel: document.getElementById('tag-search-panel'),
    tagSearchInput: document.getElementById('tag-search-input'),
    tagSearchClear: document.getElementById('tag-search-clear'),
    selectedTagWrapper: document.getElementById('tag-search-selected'),
    selectedTagLabel: document.getElementById('tag-search-selected-label'),
    selectedTagClear: document.getElementById('tag-search-selected-clear'),
    tagSuggestions: document.getElementById('tag-search-suggestions'),
    filterStatus: document.getElementById('tag-filter-status'),
    tagSearchToggle: document.getElementById('tag-search-toggle'),
  };

  // 要素が足りない場合は中断（検索パネルがないページなど）
  if (!elements.tagSearchInput) return;

  const state = {
    allPosts: [],
    filteredPosts: [],
    allTags: [],
    searchQuery: '',
    selectedTag: null,
    isLoading: true,
  };

  const normalize = (value) => String(value ?? '').normalize('NFKC').trim().toLowerCase();

  const buildTagIndex = (posts) => {
    const tagMap = new Map();
    posts.forEach(post => {
      (post.tags || []).forEach(tag => {
        const tagObj = toTagObject(tag);
        if (!tagMap.has(tagObj.slug)) {
          tagMap.set(tagObj.slug, { ...tagObj, count: 0 });
        }
        tagMap.get(tagObj.slug).count++;
      });
    });
    return Array.from(tagMap.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ja'));
  };

  const filterPostsByTag = (slug) => {
    if (!slug) return [...state.allPosts];
    return state.allPosts.filter(post =>
      (post.tags || []).some(tag => toTagObject(tag).slug === slug)
    );
  };

  const createPostCardHTML = (post, index) => {
    const defaultImg = 'assets/img/article-templates/new_default.svg';
    const imageSrc = post.image?.src || defaultImg;
    const imageAlt = post.image?.alt || post.title;
    const tagsHTML = (post.tags || []).map(tag => {
      const tagObj = toTagObject(tag);
      return `<li class="tag" data-tag-slug="${tagObj.slug}" style="cursor: pointer;">${tagObj.label}</li>`;
    }).join('');

    return `
      <li class="post-card animate-on-scroll" style="animation-delay: ${index * 0.05}s;">
        <a href="${post.url}" class="post-card-link" aria-label="${post.title}">
          <figure class="post-card-cover">
            <img src="${imageSrc}" alt="${imageAlt}" loading="lazy" decoding="async" width="640" height="360">
          </figure>
          <div class="post-card-body">
            <div class="post-meta">${formatDate(post.date)}</div>
            <h3>${post.title}</h3>
            <p class="post-summary">${post.summary ?? ''}</p>
            ${tagsHTML ? `<ul class="tag-list">${tagsHTML}</ul>` : ''}
          </div>
        </a>
      </li>
    `;
  };

  const renderPosts = (posts) => {
    if (posts.length > 0) {
      elements.list.innerHTML = posts.map(createPostCardHTML).join('');
    } else {
      elements.list.innerHTML = `<li class="no-results">該当する記事が見つかりませんでした。</li>`;
    }
    // アニメーション再適用
    initScrollAnimations();
  };

  const renderTagSuggestions = () => {
    const query = normalize(state.searchQuery);
    const suggestions = query
      ? state.allTags.filter(tag => normalize(tag.label).includes(query) || normalize(tag.slug).includes(query))
      : state.allTags;

    if (suggestions.length > 0) {
      elements.tagSuggestions.innerHTML = suggestions.slice(0, 18).map(tag => {
        const isActive = state.selectedTag?.slug === tag.slug;
        return `
          <button type="button" class="tag-search-chip${isActive ? ' active' : ''}" data-tag-slug="${tag.slug}">
            <span>${tag.label}</span>
            <span class="tag-count">${tag.count}件</span>
          </button>
        `;
      }).join('');
    } else {
      elements.tagSuggestions.innerHTML = `<p class="tag-search-empty">該当するタグが見つかりません。</p>`;
    }
  };

  const updateUI = () => {
    renderPosts(state.filteredPosts);
    renderTagSuggestions();

    if (state.selectedTag) {
      elements.selectedTagWrapper.hidden = false;
      elements.selectedTagLabel.textContent = `${state.selectedTag.label} (${state.filteredPosts.length}件)`;
    } else {
      elements.selectedTagWrapper.hidden = true;
    }

    if (state.selectedTag) {
      elements.filterStatus.textContent = `タグ「${state.selectedTag.label}」でフィルタ中 (${state.filteredPosts.length}件)`;
    } else {
      elements.filterStatus.textContent = `全${state.allPosts.length}件の記事を表示中`;
    }

    elements.tagSearchClear.disabled = !state.searchQuery;
  };

  const applyTagFilter = (tag) => {
    state.selectedTag = tag;
    state.filteredPosts = filterPostsByTag(tag?.slug);

    const url = new URL(window.location);
    if (tag) {
      url.searchParams.set('tag', tag.slug);
    } else {
      url.searchParams.delete('tag');
    }
    window.history.pushState({}, '', url);

    updateUI();
  };

  // イベントリスナー
  elements.tagSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderTagSuggestions();
    elements.tagSearchClear.disabled = !state.searchQuery;
  });

  elements.tagSearchClear.addEventListener('click', () => {
    state.searchQuery = '';
    elements.tagSearchInput.value = '';
    elements.tagSearchInput.focus();
    renderTagSuggestions();
    elements.tagSearchClear.disabled = true;
  });

  elements.selectedTagClear.addEventListener('click', () => applyTagFilter(null));

  elements.tagSuggestions.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-tag-slug]');
    if (!button) return;
    const slug = button.dataset.tagSlug;
    const tag = state.allTags.find(t => t.slug === slug);
    if (tag) {
      applyTagFilter(state.selectedTag?.slug === slug ? null : tag);
    }
  });

  elements.list.addEventListener('click', (e) => {
    const tagEl = e.target.closest('.tag[data-tag-slug]');
    if (!tagEl) return;
    e.preventDefault();
    e.stopPropagation();
    const slug = tagEl.dataset.tagSlug;
    const tag = state.allTags.find(t => t.slug === slug);
    if (tag) {
      applyTagFilter(tag);
      elements.tagSearchPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  elements.tagSearchToggle.addEventListener('click', () => {
    const isExpanded = elements.tagSearchToggle.getAttribute('aria-expanded') === 'true';
    elements.tagSearchToggle.setAttribute('aria-expanded', !isExpanded);
    elements.tagSearchPanel.dataset.mobileOpen = String(!isExpanded);
  });

  // 初期化
  elements.list.innerHTML = Array(6).fill('<li class="post-card skeleton"><div class="skeleton-media"></div><div class="post-card-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></li>').join('');

  fetch('data/posts.json', { cache: 'no-cache' })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(posts => {
      state.allPosts = posts.sort(comparePosts);
      state.allTags = buildTagIndex(state.allPosts);
      state.isLoading = false;
      elements.tagSearchInput.disabled = false;

      const initialTagSlug = new URLSearchParams(window.location.search).get('tag');
      const initialTag = initialTagSlug ? state.allTags.find(t => t.slug === initialTagSlug) : null;

      applyTagFilter(initialTag);
    })
    .catch(error => {
      console.error('記事一覧の読み込みに失敗しました', error);
      elements.list.innerHTML = '';
      elements.errorLabel.textContent = '記事一覧の読み込みに失敗しました。';
      state.isLoading = false;
      updateUI();
    });

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('ja-JP') : '';
  const comparePosts = (a, b) => new Date(b.date) - new Date(a.date);
  const toTagObject = (tag) => (typeof tag === 'object' ? tag : { slug: normalize(tag), label: tag });
};


/**
 * 全体の初期化
 */
window.initMain = () => {
  initHeaderScroll();
  initSmoothScroll();
  initScrollAnimations();
  initPostList();
};

// 初回読み込み
document.addEventListener('DOMContentLoaded', () => {
  window.initMain();
});