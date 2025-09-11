/* Initialize Mermaid for MkDocs Material (handles SPA nav) */
(function () {
  function init() {
    if (!window.mermaid) return;
    window.mermaid.initialize({ startOnLoad: false });
    if (window.document$ && typeof window.document$.subscribe === 'function') {
      window.document$.subscribe(function () {
        try {
          window.mermaid.run({ nodes: document.querySelectorAll('.mermaid') });
        } catch (e) {
          console.error('Mermaid render failed', e);
        }
      });
    } else {
      // Fallback for non-SPA or older Material
      try {
        window.mermaid.run({ nodes: document.querySelectorAll('.mermaid') });
      } catch (e) {
        console.error('Mermaid render failed', e);
      }
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
