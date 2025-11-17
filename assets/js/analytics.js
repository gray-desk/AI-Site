(function () {
  'use strict';

  var GA_ID = 'G-SPZSXWE8Q1';
  if (!GA_ID || window.__AIINFOBLOG_GA_INITIALIZED__) {
    return;
  }
  window.__AIINFOBLOG_GA_INITIALIZED__ = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  var gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(gaScript);

  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
})();
