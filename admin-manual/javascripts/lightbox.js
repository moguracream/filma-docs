// Lightweight image lightbox for MkDocs Material
// - Adds click-to-zoom overlay to images in markdown content
// - No changes to markdown needed
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'filma-lightbox-overlay';

    const img = document.createElement('img');
    img.className = 'filma-lightbox-image';
    img.alt = '';
    overlay.appendChild(img);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'filma-lightbox-close';
    closeBtn.setAttribute('aria-label', '閉じる');
    closeBtn.innerHTML = '&times;';
    overlay.appendChild(closeBtn);

    function close() {
      overlay.classList.remove('open');
      document.documentElement.classList.remove('filma-lightbox-lock');
      // Delay source cleanup to allow transition
      setTimeout(() => {
        img.removeAttribute('src');
      }, 150);
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target === closeBtn) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    return { overlay, img, open(src) {
      img.setAttribute('src', src);
      document.body.appendChild(overlay);
      // Force reflow for transition
      void overlay.offsetWidth; // eslint-disable-line no-unused-expressions
      overlay.classList.add('open');
      document.documentElement.classList.add('filma-lightbox-lock');
    } };
  }

  ready(function () {
    // Support Material theme instant navigation: rebind on content load
    const bind = () => {
      const article = document.querySelector('main .md-content');
      if (!article) return;

      const { overlay, img, open } = createOverlay();

      // Delegate clicks on images
      article.addEventListener('click', function (e) {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.tagName.toLowerCase() !== 'img') return;

        // Ignore images that are already links to external pages
        const parentLink = target.closest('a');
        if (parentLink && parentLink.getAttribute('href') && !parentLink.getAttribute('href').startsWith('#')) {
          // If the link points to an image file, open lightbox instead of navigating
          const href = parentLink.getAttribute('href');
          if (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(href || '')) {
            e.preventDefault();
            open(href);
          }
          return; // else let normal navigation happen
        }

        e.preventDefault();
        open(target.getAttribute('src'));
      }, true);

      // Ensure overlay is in DOM once
      if (!document.querySelector('.filma-lightbox-overlay')) {
        document.body.appendChild(overlay);
      }
    };

    bind();

    // Re-bind after Material instant navigation
    document.addEventListener('DOMContentLoaded', bind);
    document.addEventListener('readystatechange', function () {
      if (document.readyState === 'complete') bind();
    });
    // Material emits a custom event on navigation end
    document.addEventListener('md-content-rendered', bind);
  });
})();

