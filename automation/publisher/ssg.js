/**
 * @fileoverview Static Site Generation (SSG) Helper
 * Handles the injection of common components (Header, Footer) into HTML files during the build process.
 */

const path = require('path');

/**
 * Generates the Header HTML with correct paths and active states.
 * @param {string} basePath - Relative path to the root (e.g., "./" or "../")
 * @param {string} currentPath - Current page path for active state determination
 * @returns {string} HTML string for the header
 */
const getHeaderHTML = (basePath, currentPath) => {
    const isHome = currentPath === 'index.html' || currentPath === '';
    const isAbout = currentPath === 'about.html';

    const homeLink = basePath === '../' ? '../index.html' : 'index.html';
    const aboutLink = basePath === '../' ? '../about.html' : 'about.html';
    const logoPath = basePath + 'assets/img/logo.svg';

    return `
  <header class="site-header">
    <div class="inner">
      <a class="brand" href="${homeLink}">
        <img src="${logoPath}" alt="AI情報ブログ ロゴ" class="logo">
        <span>AI情報ブログ</span>
      </a>
      <button class="menu-toggle" type="button" aria-label="メニューを開く" aria-expanded="false">
        <div class="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      <nav aria-label="メインナビゲーション">
        <a href="${homeLink}"${isHome ? ' aria-current="page"' : ''}>ホーム</a>
        <a href="${aboutLink}"${isAbout ? ' aria-current="page"' : ''}>このサイトについて</a>
      </nav>
    </div>
    <div class="menu-overlay"></div>
  </header>`;
};

/**
 * Generates the Footer HTML.
 * @param {string} basePath - Relative path to the root
 * @returns {string} HTML string for the footer
 */
const getFooterHTML = (basePath) => {
    const currentYear = new Date().getFullYear();
    const homeLink = basePath === '../' ? '../index.html' : 'index.html';
    const aboutLink = basePath === '../' ? '../about.html' : 'about.html';
    const privacyLink = basePath === '../' ? '../privacy-policy.html' : 'privacy-policy.html';
    const contactLink = basePath === '../' ? '../contact.html' : 'contact.html';

    return `
  <footer class="site-footer">
    <div class="inner">
      <div class="footer-content">
        <div class="footer-logo">
          <span>AI情報ブログ</span>
        </div>
        <nav class="footer-nav" aria-label="フッターナビゲーション">
          <a href="${homeLink}">ホーム</a>
          <a href="${aboutLink}">このサイトについて</a>
          <a href="${privacyLink}">プライバシーポリシー</a>
          <a href="${contactLink}">お問い合わせ</a>
        </nav>
      </div>
      <small class="copyright">&copy; ${currentYear} AI情報ブログ</small>
    </div>
  </footer>`;
};

/**
 * Injects Header and Footer into the provided HTML content.
 * @param {string} htmlContent - The original HTML content
 * @param {string} relativeFilePath - Path of the file relative to the project root (e.g., "index.html", "posts/abc.html")
 * @returns {string} The HTML content with injected components
 */
const injectCommonComponents = (htmlContent, relativeFilePath) => {
    // Determine base path based on file depth
    // If file is in root (e.g. "index.html"), depth is 0 -> "./"
    // If file is in posts/ (e.g. "posts/abc.html"), depth is 1 -> "../"
    const depth = relativeFilePath.split('/').length - 1;
    const basePath = depth > 0 ? '../'.repeat(depth) : './';

    // Normalize current path for comparison
    const currentPath = path.basename(relativeFilePath);

    const headerHTML = getHeaderHTML(basePath, currentPath);
    const footerHTML = getFooterHTML(basePath);

    // Remove existing header/footer if any (to avoid duplication on re-runs)
    let newHtml = htmlContent
        .replace(/<header class="site-header">[\s\S]*?<\/header>/, '')
        .replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, '');

    // Inject Header after <body>
    // We look for <body> tag. If it has attributes, we handle that.
    if (newHtml.includes('<body')) {
        newHtml = newHtml.replace(/(<body[^>]*>)/i, `$1\n${headerHTML}`);
    } else {
        // Fallback if no body tag found (unlikely for valid HTML)
        newHtml = headerHTML + newHtml;
    }

    // Inject Footer before </body>
    // We look for components.js script tag to insert before it, or just before </body>
    // Ideally, footer should be at the end of main content or just before scripts.
    // Let's put it before the script tags at the end of body, or just before </body>.
    if (newHtml.includes('</body>')) {
        newHtml = newHtml.replace('</body>', `${footerHTML}\n</body>`);
    } else {
        newHtml = newHtml + footerHTML;
    }

    return newHtml;
};

module.exports = {
    injectCommonComponents
};
