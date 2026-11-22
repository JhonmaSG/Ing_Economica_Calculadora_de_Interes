/* Módulo 4: ecuación de valor para ingresos, pagos y deudas. */
(function () {
  function remove(row) { if (row && row.parentNode.children.length > 1) row.remove(); }
  function addFlow() {
    var row = document.createElement('div'); row.className = 'flow-row d-flex gap-2 mb-2';
    row.innerHTML = '<input class="form-control monto" type="number" min="0" step="any" placeholder="Monto"><input class="form-control per" type="number" min="0" step="any" placeholder="Período"><select class="form-select tipo"><option value="Ingreso">Ingreso</option><option value="Pago">Pago / deuda</option></select><button class="btn btn-outline-danger btn-remove" type="button">×</button>';
    row.querySelector('.btn-remove').addEventListener('click', function () { remove(row); }); document.getElementById('flows').appendChild(row); applyInputGuards();
  }
  function calculate() {
    var iPct = readNumber('iev', 'Tasa por período', { min: 0, max: LIMITS.ratePctMax, resultId: 'result-ev' }); if (iPct === null) return;
    var focal = readNumber('focal', 'Fecha focal', { min: 0, max: LIMITS.periodMax, resultId: 'result-ev' }); if (focal === null) return;
    var rows = Array.from(document.querySelectorAll('.flow-row')); if (!rows.length) return fail('Agrega al menos un flujo.', 'result-ev');
    var i = pct(iPct), total = 0, details = [], totalTerms = [];
    for (var x = 0; x < rows.length; x++) {
      var amount = Number(rows[x].querySelector('.monto').value), period = Number(rows[x].querySelector('.per').value), type = rows[x].querySelector('.tipo').value;
      if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(period) || period < 0) return fail('Completa correctamente el flujo ' + (x + 1) + '.', 'result-ev');
      var sign = type === 'Ingreso' ? 1 : -1, exponent = focal - period, factor = Math.pow(1 + i, exponent), present = sign * amount * factor; total += present;
      totalTerms.push((present >= 0 ? '+ ' : '− ') + '$' + fmt(Math.abs(present)));
      details.push('<strong>Flujo ' + (x + 1) + ':</strong> ' + (sign > 0 ? '+' : '−') + '$' + fmt(amount) + ' · (1 + ' + fmt(i, 6) + ')<sup>' + exponent + '</sup> = <strong>' + (present < 0 ? '−' : '') + '$' + fmt(Math.abs(present)) + '</strong>');
    }
    details.push('<strong>Operación final:</strong> ' + totalTerms.join(' ') + ' = $' + fmt(total));
    details.push('<strong>Valor neto en f = ' + focal + ':</strong> $' + fmt(total));
    ok('Valor neto en la fecha focal = <strong>$' + fmt(total) + '</strong>', 'result-ev');
    details.unshift('<strong>Ecuación de valor en f = ' + focal + ':</strong>');
    steps(details.join('<hr class="my-2">'), 'steps-ev');
  }
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('.btn-remove').addEventListener('click', function (e) { remove(e.target.closest('.flow-row')); });
    bindSimple('add-flow', addFlow); bindSimple('calc-ev', calculate);
    bindSimple('reset-ev', function () { document.getElementById('iev').value = ''; document.getElementById('focal').value = 0; document.getElementById('flows').innerHTML = ''; addFlow(); document.getElementById('result-ev').innerHTML = ''; hideSteps('steps-ev'); });
  });
})();
