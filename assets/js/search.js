/**
 * 記事検索機能 (Fuse.js)
 */

/**
 * 記事検索機能の初期化
 * Barba.jsなどのSPA遷移後にも呼び出せるようにグローバル関数として定義
 */
window.initSearch = async () => {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    // 検索バーが存在しないページでは何もしない
    if (!searchInput || !searchResults) return;

    // 既に初期化済み（イベントリスナー登録済み）の場合は重複を防ぐためにチェック
    // (簡易的な実装として、属性でマーキングする)
    if (searchInput.dataset.searchInitialized) return;
    searchInput.dataset.searchInitialized = 'true';

    let fuse;
    let posts = [];

    // 記事データの取得
    try {
        const response = await fetch('/data/posts.json');
        if (!response.ok) throw new Error('Failed to load posts');
        posts = await response.json();

        // Fuse.jsの初期化
        const options = {
            keys: ['title', 'summary', 'tags'],
            threshold: 0.4,
            distance: 100,
        };

        // Fuse.jsが読み込まれているか確認
        if (window.Fuse) {
            fuse = new window.Fuse(posts, options);
        } else {
            console.error('Fuse.js library not loaded');
            return;
        }

    } catch (error) {
        console.error('Error initializing search:', error);
        return;
    }

    // 検索実行
    const performSearch = (query) => {
        if (!query) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
        }

        const results = fuse.search(query);
        displayResults(results);
    };

    // 結果表示
    const displayResults = (results) => {
        searchResults.innerHTML = '';

        if (results.length === 0) {
            searchResults.style.display = 'none';
            return;
        }

        searchResults.style.display = 'block';
        const ul = document.createElement('ul');
        ul.className = 'search-results-list';

        results.slice(0, 5).forEach(({ item }) => {
            const li = document.createElement('li');
            li.className = 'search-result-item';

            const link = document.createElement('a');
            link.href = `/posts/${item.slug}.html`;
            link.className = 'search-result-link';

            const title = document.createElement('div');
            title.className = 'search-result-title';
            title.textContent = item.title;

            const date = document.createElement('div');
            date.className = 'search-result-date';
            date.textContent = item.date;

            link.appendChild(title);
            link.appendChild(date);
            li.appendChild(link);
            ul.appendChild(li);
        });

        searchResults.appendChild(ul);
    };

    // イベントリスナー
    searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });

    // クリックアウトで閉じる
    // Note: documentへのリスナーはページ遷移しても残る可能性があるため、
    // Barba.js利用時は注意が必要だが、ここでは簡易的に追加する。
    // 厳密にはクリーンアップが必要。
    const closeHandler = (e) => {
        if (searchInput && searchResults && !searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    };
    document.addEventListener('click', closeHandler);
};

// 初回読み込み時
document.addEventListener('DOMContentLoaded', () => {
    window.initSearch();
});
