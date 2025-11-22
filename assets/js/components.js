/**
 * @fileoverview 共通コンポーネント（ヘッダー・フッター）の制御スクリプト
 * SSGによってビルド時にHTMLに埋め込まれたヘッダー・フッターに対して、
 * ハンバーガーメニューなどのインタラクティブな機能を提供します。
 */

(function () {
  'use strict';

  /**
   * モバイル表示時のハンバーガーメニューの動作を初期化します。
   * メニューの開閉、キーボード操作（ESCキー）、オーバーレイクリックでのクローズなどを設定します。
   */
  function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-header nav');
    const menuOverlay = document.querySelector('.menu-overlay');
    const navLinks = document.querySelectorAll('.site-header nav a');

    if (!menuToggle || !nav || !menuOverlay) return;

    // メニューを開閉する関数
    function toggleMenu() {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      menuToggle.setAttribute('aria-label', isExpanded ? 'メニューを開く' : 'メニューを閉じる');

      // activeクラスを付け外しして表示を切り替える
      menuToggle.classList.toggle('active');
      nav.classList.toggle('active');
      menuOverlay.classList.toggle('active');

      // メニューが開いている間、背景のスクロールを禁止する
      document.body.style.overflow = !isExpanded ? 'hidden' : '';
    }

    // メニューを閉じる関数
    function closeMenu() {
      if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'メニューを開く');
      menuToggle.classList.remove('active');
      nav.classList.remove('active');
      menuOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    menuToggle.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', closeMenu);
    navLinks.forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('active')) {
        closeMenu();
      }
    });

    // ウィンドウリサイズ時にPC幅になったらメニューを自動で閉じる
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && nav.classList.contains('active')) {
        closeMenu();
      }
    });
  }

  // DOMの読み込み完了後にメニューを初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
  } else {
    initMobileMenu();
  }
})();