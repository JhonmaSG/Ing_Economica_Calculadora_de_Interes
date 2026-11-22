/* Punto de entrada de la página principal.
   Los cálculos viven en módulos independientes dentro de js/. */
document.addEventListener('DOMContentLoaded', function () {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
      throwOnError: false
    });
  }

  document.querySelectorAll('.clickable-card[data-href]').forEach(function (card) {
    var goToModule = function () {
      window.location.href = card.dataset.href;
    };
    card.addEventListener('click', goToModule);
    card.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        goToModule();
      }
    });
  });
});
