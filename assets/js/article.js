// ============================================
// 記事詳細ページ専用のUI制御
// ============================================

(function initArticlePage() {
  const root = document.body;
  if (!root || !root.classList.contains('article-page')) return;

  const currentUrl = window.location.href;
  const title = document.title.replace(/ \| AI情報ブログ$/, '') || 'AI情報ブログ';

  // === 共有リンク生成 ===
  const encode = (value) => encodeURIComponent(value);

  document.querySelectorAll('[data-share-target="x"]').forEach((link) => {
    const url = new URL('https://twitter.com/intent/tweet');
    url.searchParams.set('text', `${title} | AI情報ブログ`);
    url.searchParams.set('url', currentUrl);
    link.setAttribute('href', url.toString());
  });

  document.querySelectorAll('[data-share-target="linkedin"]').forEach((link) => {
    const href = `https://www.linkedin.com/sharing/share-offsite/?url=${encode(currentUrl)}`;
    link.setAttribute('href', href);
  });

  const copyButton = document.querySelector('[data-copy-link]');
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(currentUrl);
        const original = copyButton.textContent;
        copyButton.textContent = 'コピーしました';
        setTimeout(() => {
          copyButton.textContent = original;
        }, 2000);
      } catch (error) {
        console.error('リンクのコピーに失敗しました', error);
      }
    });
  }

  const nativeShare = document.querySelector('[data-share-target="native"]');
  if (nativeShare) {
    nativeShare.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({ title, url: currentUrl });
        } catch (error) {
          console.warn('共有がキャンセルされました', error);
        }
      } else if (copyButton) {
        copyButton.click();
      }
    });
  }

  // === 目次の自動生成 ===
  const tocList = document.querySelector('[data-toc-list]');
  const headings = document.querySelectorAll('.post-article h2, .post-article h3, .article-content h2, .article-content h3');

  if (tocList && headings.length > 0) {
    const slugify = (text) =>
      text
        .trim()
        .toLowerCase()
        .replace(/[\s・、。/]+/g, '-')
        .replace(/[^a-z0-9\-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    headings.forEach((heading, index) => {
      const text = heading.textContent || `section-${index + 1}`;
      const slug = heading.id || slugify(text) || `section-${index + 1}`;
      heading.id = slug;

      const item = document.createElement('li');
      item.dataset.sectionId = slug;
      if (heading.tagName === 'H3') {
        item.classList.add('is-depth');
      }

      const anchor = document.createElement('a');
      anchor.href = `#${slug}`;
      anchor.textContent = text.trim();
      item.appendChild(anchor);
      tocList.appendChild(item);
    });

    // スムーズスクロール
    tocList.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if (target) {
          const headerOffset = 100;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  } else if (tocList) {
    const item = document.createElement('li');
    item.textContent = '目次はありません';
    tocList.appendChild(item);
  }

  // === 読み進捗インジケーター ===
  function initReadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.innerHTML = '<div class="reading-progress-bar"></div>';
    document.body.prepend(progressBar);

    const bar = progressBar.querySelector('.reading-progress-bar');
    const articleContent = document.querySelector('.article-content, .post-article');

    if (!articleContent) return;

    function updateProgress() {
      const articleTop = articleContent.offsetTop;
      const articleHeight = articleContent.offsetHeight;
      const scrollPosition = window.pageYOffset;
      const windowHeight = window.innerHeight;

      const scrollStart = articleTop;
      const scrollEnd = articleTop + articleHeight - windowHeight;

      if (scrollPosition < scrollStart) {
        bar.style.width = '0%';
      } else if (scrollPosition > scrollEnd) {
        bar.style.width = '100%';
      } else {
        const progress = ((scrollPosition - scrollStart) / (scrollEnd - scrollStart)) * 100;
        bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      }
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
  }

  initReadingProgress();

  // === 目次のアクティブ状態管理 ===
  function initTocHighlight() {
    if (!tocList || headings.length === 0) return;

    const tocItems = Array.from(tocList.querySelectorAll('li[data-section-id]'));
    const sections = Array.from(headings);

    function updateActiveToc() {
      const scrollPosition = window.pageYOffset + 120; // ヘッダーオフセット

      let activeSection = null;
      sections.forEach(section => {
        if (section.offsetTop <= scrollPosition) {
          activeSection = section;
        }
      });

      tocItems.forEach(item => item.classList.remove('active'));

      if (activeSection) {
        const activeItem = tocItems.find(item => item.dataset.sectionId === activeSection.id);
        if (activeItem) {
          activeItem.classList.add('active');
        }
      }
    }

    window.addEventListener('scroll', updateActiveToc, { passive: true });
    updateActiveToc();
  }

  initTocHighlight();
})();
