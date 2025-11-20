/**
 * @fileoverview ページ遷移とスムーズスクロールの制御 (Barba.js + Lenis)
 * - Barba.jsによるSPA風のページ遷移
 * - Lenisによる慣性スクロール
 * - ページ遷移後のスクリプト再初期化 (Prism.js, Main.js, Article.js, etc.)
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Lenis (Smooth Scroll) Initialization ---
    const initLenis = () => {
        if (!window.Lenis) return;

        const lenis = new window.Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        // Barba.jsと連携するためにグローバルに公開（必要であれば）
        window.lenis = lenis;
    };

    initLenis();


    // --- 2. Barba.js Initialization ---
    if (!window.barba) {
        console.warn('Barba.js not loaded.');
        return;
    }

    const barba = window.barba;

    barba.init({
        debug: true, // 開発中はtrue
        transitions: [
            {
                name: 'fade',
                leave(data) {
                    return gsap.to(data.current.container, {
                        opacity: 0,
                        duration: 0.5
                    });
                },
                enter(data) {
                    return gsap.from(data.next.container, {
                        opacity: 0,
                        duration: 0.5
                    });
                }
            },
            // 簡易的なフェード遷移（GSAPなしの場合）
            {
                name: 'default-transition',
                leave({ current }) {
                    return new Promise((resolve) => {
                        current.container.style.transition = 'opacity 0.3s ease';
                        current.container.style.opacity = 0;
                        setTimeout(resolve, 300);
                    });
                },
                enter({ next }) {
                    next.container.style.opacity = 0;
                    next.container.style.transition = 'opacity 0.3s ease';
                    return new Promise((resolve) => {
                        // リフローを強制してtransitionを適用
                        next.container.offsetHeight;
                        next.container.style.opacity = 1;
                        setTimeout(resolve, 300);
                    });
                }
            }
        ],
        views: [
            {
                namespace: 'home',
                beforeEnter() {
                    // ホーム固有の処理があれば
                },
                afterEnter() {
                    // ホーム固有の初期化
                    if (window.initSearch) window.initSearch();
                }
            },
            {
                namespace: 'article',
                afterEnter() {
                    // 記事ページ固有の初期化
                    if (window.initArticlePage) window.initArticlePage();
                    // Prism.jsのハイライト適用
                    if (window.Prism) window.Prism.highlightAll();
                },
                beforeLeave() {
                    // 記事ページを離れる際のクリーンアップ
                    if (window.articlePageCleanup) {
                        window.articlePageCleanup();
                        window.articlePageCleanup = null;
                    }
                }
            }
        ]
    });

    // --- 3. Global Hooks (全ページ共通の再初期化) ---
    barba.hooks.after((data) => {
        // スクロール位置をトップに戻す (Lenisを使っている場合はLenisで戻す)
        if (window.lenis) {
            window.lenis.scrollTo(0, { immediate: true });
        } else {
            window.scrollTo(0, 0);
        }

        // Google Analytics (gtag) のページビュー送信
        if (typeof gtag === 'function') {
            gtag('config', 'UA-XXXXXXXXX-X', { // 実際のIDに置き換えるか、既存のタグから取得
                'page_path': window.location.pathname
            });
        }

        // 共通スクリプトの再初期化
        // components.js (ヘッダー/フッター) は静的なので再実行不要かもしれないが、
        // アクティブリンクの更新などが必要ならここで処理する。

        // main.jsの共通機能（スクロールヘッダーなど）を再適用
        if (window.initMain) window.initMain();
    });

});
