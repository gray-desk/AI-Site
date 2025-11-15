(function loadPosts() {
  const list = document.getElementById('post-list');
  const errorLabel = document.getElementById('post-error');

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const normalized = isoString.replaceAll('/', '-');
    const date = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(date.getTime())) return isoString;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  };

  const renderPosts = (posts) => {
    list.innerHTML = '';
    posts.forEach((post) => {
      const item = document.createElement('li');
      item.className = 'post-card';

      const tags = Array.isArray(post.tags) ? post.tags : [];
      const tagMarkup = tags.length
        ? `<ul class="tag-list">${tags.map((tag) => `<li class="tag">${tag}</li>`).join('')}</ul>`
        : '';

      item.innerHTML = `
        <div class="post-meta">${formatDate(post.date)}</div>
        <h3><a href="${post.url}">${post.title}</a></h3>
        <p class="post-summary">${post.summary ?? ''}</p>
        ${tagMarkup}
      `;

      list.appendChild(item);
    });
  };

  fetch('data/posts.json', { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((posts) => {
      const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
      renderPosts(sorted);
      errorLabel.textContent = '';
    })
    .catch((error) => {
      console.error('記事一覧の読み込みに失敗しました', error);
      errorLabel.textContent = '記事一覧の読み込みに失敗しました。時間をおいて再度お試しください。';
      list.innerHTML = '';
    });
})();

(function loadSources() {
  const list = document.getElementById('source-list');
  const counter = document.getElementById('source-count');
  const errorLabel = document.getElementById('source-error');
  if (!list || !counter) return;

  const renderSources = (sources) => {
    list.innerHTML = '';
    sources.forEach((source) => {
      const item = document.createElement('li');
      item.className = 'source-card';
      const focus = Array.isArray(source.focus) ? source.focus.join(', ') : '';
      item.innerHTML = `
        <p class="source-meta">${source.platform ?? 'YouTube'}</p>
        <h3>${source.name ?? 'No title'}</h3>
        <a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.url}</a>
        <p class="source-meta">${focus}</p>
      `;
      list.appendChild(item);
    });
  };

  fetch('data/sources.json', { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((sources) => {
      renderSources(sources);
      counter.textContent = sources.length;
      if (errorLabel) errorLabel.textContent = '';
    })
    .catch((error) => {
      console.error('監視対象の読み込みに失敗しました', error);
      if (errorLabel) {
        errorLabel.textContent = '監視対象リストの読み込みに失敗しました。';
      }
      list.innerHTML = '';
      counter.textContent = '0';
    });
})();
