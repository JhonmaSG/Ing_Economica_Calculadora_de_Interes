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
    var i = pct(iPct), total = 0, details = [], totalTerms = [], flows = [];
    for (var x = 0; x < rows.length; x++) {
      var amount = Number(rows[x].querySelector('.monto').value), period = Number(rows[x].querySelector('.per').value), type = rows[x].querySelector('.tipo').value;
      if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(period) || period < 0) return fail('Completa correctamente el flujo ' + (x + 1) + '.', 'result-ev');
      var sign = type === 'Ingreso' ? 1 : -1, exponent = focal - period, factor = Math.pow(1 + i, exponent), present = sign * amount * factor; total += present;
      totalTerms.push((present >= 0 ? '+ ' : '− ') + '$' + fmt(Math.abs(present)));
      flows.push({ amount: amount, period: period, type: type });
      details.push('<strong>Flujo ' + (x + 1) + ':</strong> ' + (sign > 0 ? '+' : '−') + '$' + fmt(amount) + ' · (1 + ' + fmt(i, 6) + ')<sup>' + exponent + '</sup> = <strong>' + (present < 0 ? '−' : '') + '$' + fmt(Math.abs(present)) + '</strong>');
    }
    details.push('<strong>Operación final:</strong> ' + totalTerms.join(' ') + ' = $' + fmt(total));
    details.push('<strong>Valor neto en f = ' + focal + ':</strong> $' + fmt(total));
    ok('Valor neto en la fecha focal = <strong>$' + fmt(total) + '</strong>', 'result-ev');
    details.unshift('<strong>Ecuación de valor en f = ' + focal + ':</strong>');
    steps(details.join('<hr class="my-2">'), 'steps-ev');
    renderFlowDiagram(focal, flows);
  }
  function renderFlowDiagram(focal, flows) {
    var box = document.getElementById('flow-diagram');
    if (!box) return;
    var width = 900, height = 400, left = 55, right = 45, axisY = 170;
    var maxPeriod = Math.max(1, focal);
    flows.forEach(function (flow) { maxPeriod = Math.max(maxPeriod, flow.period); });
    var usable = width - left - right, scale = usable / maxPeriod;
    var tickStep = Math.max(1, Math.ceil(maxPeriod / 18));
    var svg = '<svg class="flow-svg" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Diagrama de flujo económico">';
    svg += '<defs><marker id="arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#62a87c"/></marker><marker id="arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#c94c58"/></marker><marker id="arrow-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#5e239d"/></marker></defs>';
    svg += '<text x="20" y="28" class="flow-title">Diagrama de flujo</text>';
    svg += '<line x1="' + left + '" y1="' + axisY + '" x2="' + (width - right) + '" y2="' + axisY + '" class="flow-axis" marker-end="url(#arrow-purple)"/>';
    for (var tick = 0; tick <= maxPeriod; tick += tickStep) {
      var tx = left + tick * scale;
      svg += '<line x1="' + tx + '" y1="' + (axisY - 9) + '" x2="' + tx + '" y2="' + (axisY + 9) + '" class="flow-tick"/><text x="' + tx + '" y="' + (axisY + 30) + '" text-anchor="middle" class="flow-period">' + tick + '</text>';
    }
    if (maxPeriod % tickStep !== 0) {
      var endX = left + maxPeriod * scale;
      svg += '<line x1="' + endX + '" y1="' + (axisY - 9) + '" x2="' + endX + '" y2="' + (axisY + 9) + '" class="flow-tick"/><text x="' + endX + '" y="' + (axisY + 30) + '" text-anchor="middle" class="flow-period">' + maxPeriod + '</text>';
    }
    var focalX = left + focal * scale;
    svg += '<line x1="' + focalX + '" y1="45" x2="' + focalX + '" y2="' + (axisY + 5) + '" class="flow-focal" marker-end="url(#arrow-purple)"/><rect x="' + Math.max(8, focalX - 58) + '" y="35" width="116" height="34" rx="8" class="flow-focal-box"/><text x="' + focalX + '" y="50" text-anchor="middle" class="flow-focal-text">Fecha focal</text><text x="' + focalX + '" y="63" text-anchor="middle" class="flow-focal-text">f = ' + focal + '</text>';
    flows.forEach(function (flow, index) {
      var x = left + flow.period * scale, incoming = flow.type === 'Ingreso', colorClass = incoming ? 'flow-income' : 'flow-debt';
      var offset = (index % 3) * 14, startY = incoming ? axisY - 12 : axisY + 12, endY = incoming ? 82 - offset : 258 + offset;
      svg += '<line x1="' + x + '" y1="' + startY + '" x2="' + x + '" y2="' + endY + '" class="' + colorClass + '" marker-end="url(#' + (incoming ? 'arrow-green' : 'arrow-red') + ')"/>';
      var labelY = incoming ? endY - 10 : endY + 18;
      svg += '<text x="' + x + '" y="' + labelY + '" text-anchor="middle" class="flow-amount ' + colorClass + '-text">$' + fmt(flow.amount) + '</text><text x="' + x + '" y="' + (labelY + (incoming ? 16 : 16)) + '" text-anchor="middle" class="flow-kind ' + colorClass + '-text">(' + (incoming ? 'Ingreso' : 'Pago/Deuda') + ')</text>';
    });
    svg += '<text x="' + (width - right - 5) + '" y="' + (axisY - 12) + '" text-anchor="end" class="flow-period-label">Período</text></svg>';
    box.innerHTML = svg;
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('.btn-remove').addEventListener('click', function (e) { remove(e.target.closest('.flow-row')); });
    bindSimple('add-flow', addFlow); bindSimple('calc-ev', calculate);
    bindSimple('reset-ev', function () { document.getElementById('iev').value = ''; document.getElementById('focal').value = 0; document.getElementById('flows').innerHTML = ''; addFlow(); document.getElementById('result-ev').innerHTML = ''; document.getElementById('flow-diagram').innerHTML = ''; hideSteps('steps-ev'); });
  });
})();
