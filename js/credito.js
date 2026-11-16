/* ============================================================
   js/credito.js  —  Módulo 4: Crédito y Proyección
   Depends on: core.js, Chart.js
   ============================================================ */

(function () {
  var chartAmort = null;

  /* ═══════════════════════════════════════════════════════════
     TAB 1 — AMORTIZACIÓN
  ═══════════════════════════════════════════════════════════ */
  bindSimple('calc-amort', function () {
    hideSteps('steps-amort');
    var VP = readNumber('cred', 'Monto del crédito', { min: 0, max: LIMITS.moneyMax, resultId: 'result-amort' });
    if (VP === null) return;
    var iPct = readNumber('iC', 'Tasa por período (%)', { min: 0.000001, max: LIMITS.ratePctMax, resultId: 'result-amort' });
    if (iPct === null) return;
    var n = readNumber('nC', 'Número de cuotas', { min: 1, max: LIMITS.periodMax, resultId: 'result-amort' });
    if (n === null) return;

    var sistemaEl = document.getElementById('sistema-amort');
    var sistema = sistemaEl ? sistemaEl.value : 'frances';
    var i = pct(iPct);

    var rows = [];
    var saldo = VP;

    if (sistema === 'alemán') {
      // Sistema Alemán — abono a capital constante
      var abonoK = VP / n;
      for (var t = 1; t <= n; t++) {
        var interes   = saldo * i;
        var cuota     = abonoK + interes;
        var saldoFin  = saldo - abonoK;
        rows.push({ per: t, si: saldo, int: interes, abono: abonoK, cuota: cuota, sf: saldoFin });
        saldo = saldoFin;
      }
      ok('Sistema Alemán — Abono capital: $' + fmt(abonoK) + ' por período', 'result-amort');
      steps(
        '<strong>Sistema Alemán (abono constante a capital)</strong><br>' +
        '$$\\text{Abono a capital} = \\frac{\\text{Crédito}}{n} = \\frac{' + fmt(VP) + '}{' + n + '} = ' + fmt(abonoK) + '$$' +
        'Cada período: $\\text{Interés} = \\text{Saldo} \\times i$; &nbsp; $\\text{Cuota} = \\text{Abono} + \\text{Interés}$<br>' +
        'El saldo decrece linealmente; las cuotas decrecen período a período.',
        'steps-amort'
      );
    } else {
      // Sistema Francés — cuota fija
      var den = 1 - safePow(1 + i, -n, 'amortización', 'result-amort');
      if (den === null || den === 0) return fail('División por cero en fórmula de cuota.', 'result-amort');
      var cuotaFija = (VP * i) / den;
      if (!isFiniteNumber(cuotaFija)) return fail('Resultado fuera de rango.', 'result-amort');

      for (var t2 = 1; t2 <= n; t2++) {
        var int2    = saldo * i;
        var abono2  = cuotaFija - int2;
        var sf2     = saldo - abono2;
        rows.push({ per: t2, si: saldo, int: int2, abono: abono2, cuota: cuotaFija, sf: sf2 });
        saldo = sf2;
      }
      ok('Sistema Francés — Cuota fija: $' + fmt(cuotaFija), 'result-amort');
      steps(
        '<strong>Sistema Francés (cuota fija)</strong><br>' +
        'Fórmula: $$A = \\frac{VP \\cdot i}{1 - (1+i)^{-n}}$$' +
        'Sustituyendo: $$A = \\frac{' + fmt(VP) + ' \\times ' + fmt(iPct/100,6) + '}{1 - (1+' + fmt(iPct/100,6) + ')^{-' + n + '}}$$' +
        'Factor denominador: ' + fmt(den,6) + '<br>' +
        '<strong>Cuota fija = $' + fmt(cuotaFija) + '</strong>',
        'steps-amort'
      );
    }

    // Build HTML table
    var html = '<div class="table-wrapper"><table class="table table-sm table-striped table-hover align-middle">' +
      '<thead><tr>' +
      '<th>Período</th><th>Saldo Inicial</th><th>Interés</th><th>Abono Capital</th><th>Cuota Total</th><th>Saldo Final</th>' +
      '</tr></thead><tbody>';

    rows.forEach(function(r) {
      html += '<tr>' +
        '<td class="text-center fw-bold">' + r.per + '</td>' +
        '<td>$' + fmt(r.si)    + '</td>' +
        '<td class="text-danger">$' + fmt(r.int)   + '</td>' +
        '<td class="text-success">$' + fmt(r.abono) + '</td>' +
        '<td class="fw-bold">$'      + fmt(r.cuota) + '</td>' +
        '<td>$' + fmt(r.sf < 0.005 ? 0 : r.sf) + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div>';

    var tableEl = document.getElementById('amort-table');
    if (tableEl) tableEl.innerHTML = html;

    // Stacked bar chart
    renderAmortChart(rows);
  });

  function renderAmortChart(rows) {
    var canvas = document.getElementById('chart-amort');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (chartAmort) { chartAmort.destroy(); chartAmort = null; }

    var maxBars = Math.min(rows.length, 60);
    var sample = rows.slice(0, maxBars);

    chartAmort = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sample.map(function(r) { return 'P' + r.per; }),
        datasets: [
          {
            label: 'Interés',
            data: sample.map(function(r) { return r.int; }),
            backgroundColor: 'rgba(220,38,38,.75)',
            borderRadius: 2,
          },
          {
            label: 'Abono Capital',
            data: sample.map(function(r) { return r.abono; }),
            backgroundColor: 'rgba(13,148,136,.75)',
            borderRadius: 2,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: { label: function(c) { return ' $' + fmt(c.parsed.y); } }
          }
        },
        scales: {
          x: { stacked: true, title: { display: true, text: 'Período' } },
          y: { stacked: true, title: { display: true, text: 'Valor ($)' }, ticks: { callback: function(v) { return '$' + fmt(v); } } }
        }
      }
    });
    document.getElementById('chart-amort-box').style.display = '';
  }

  /* ═══════════════════════════════════════════════════════════
     TAB 2 — CAPITALIZACIÓN
  ═══════════════════════════════════════════════════════════ */
  bindSimple('calc-cap', function () {
    hideSteps('steps-cap');
    var VF = readNumber('meta', 'Meta de capital (VF)', { min: 0, max: LIMITS.moneyMax, resultId: 'result-cap' });
    if (VF === null) return;
    var iPct = readNumber('iCap', 'Tasa por período (%)', { min: 0.000001, max: LIMITS.ratePctMax, resultId: 'result-cap' });
    if (iPct === null) return;
    var n = readNumber('nCap', 'Número de aportes (n)', { min: 1, max: LIMITS.periodMax, resultId: 'result-cap' });
    if (n === null) return;

    var i = pct(iPct);
    var growth = safePow(1 + i, n, 'capitalización', 'result-cap');
    if (growth === null) return;
    var den = growth - 1;
    if (den === 0) return fail('División por cero en fórmula de aporte.', 'result-cap');

    var aporte = (VF * i) / den;
    if (!isFiniteNumber(aporte)) return fail('Resultado fuera de rango.', 'result-cap');

    ok('Aporte por período: $' + fmt(aporte), 'result-cap');
    steps(
      '<strong>Fórmula:</strong> $$A = \\frac{VF \\cdot i}{(1+i)^n - 1}$$' +
      'Sustituyendo: $$A = \\frac{' + fmt(VF) + ' \\times ' + fmt(iPct/100,6) + '}{(1+' + fmt(iPct/100,6) + ')^{' + n + '} - 1}$$' +
      'Factor $(1+i)^n$: ' + fmt(growth, 6) + '<br>' +
      'Denominador: ' + fmt(den, 6) + '<br>' +
      '<strong>Aporte por período = $' + fmt(aporte) + '</strong>',
      'steps-cap'
    );
  });

  /* ═══════════════════════════════════════════════════════════
     TAB 3 — ECUACIÓN DE VALOR
  ═══════════════════════════════════════════════════════════ */
  bindSimple('add-flow', function () {
    var c = document.getElementById('flows');
    if (!c) return;
    if (c.querySelectorAll('.flow-row').length >= LIMITS.flowMaxRows) {
      fail('No puedes agregar más de ' + LIMITS.flowMaxRows + ' flujos.', 'result-ev');
      return;
    }

    var row = document.createElement('div');
    row.className = 'flow-row mb-2';
    row.innerHTML =
      '<input class="form-control monto" placeholder="Monto" type="number" min="0" max="1000000000000" step="any">' +
      '<input class="form-control per" placeholder="Período" type="number" min="0" max="100000" step="any">' +
      '<select class="form-select tipo" style="max-width:120px"><option value="Deuda">Deuda</option><option value="Pago">Pago</option></select>' +
      '<button class="btn btn-outline-danger btn-remove" type="button">✕</button>';
    row.querySelector('button').addEventListener('click', function () { row.remove(); });
    c.appendChild(row);
    applyInputGuards();
  });

  // Wire remove buttons on initial rows
  document.querySelectorAll('.flow-row .btn-remove').forEach(function(b) {
    b.addEventListener('click', function(e) { e.target.closest('.flow-row').remove(); });
  });

  bindSimple('calc-ev', function () {
    hideSteps('steps-ev');
    var iPct = readNumber('iev', 'Tasa por período (%)', { min: 0, max: LIMITS.ratePctMax, resultId: 'result-ev' });
    if (iPct === null) return;
    var f = readNumber('focal', 'Fecha focal (período)', { min: 0, max: LIMITS.periodMax, integer: false, resultId: 'result-ev' });
    if (f === null) return;

    var rowEls = [...document.querySelectorAll('.flow-row')];
    if (!rowEls.length) return fail('Debes agregar al menos un flujo.', 'result-ev');
    if (rowEls.length > LIMITS.flowMaxRows) return fail('Máximo ' + LIMITS.flowMaxRows + ' flujos.', 'result-ev');

    var i = pct(iPct);
    var suma = 0;
    var stepsRows = [];

    for (var idx = 0; idx < rowEls.length; idx++) {
      var row = rowEls[idx];
      var montoRaw = row.querySelector('.monto').value.trim();
      var perRaw   = row.querySelector('.per').value.trim();
      var tipo     = row.querySelector('.tipo').value;

      if (!montoRaw || !perRaw)
        return fail('Completa monto y período del flujo ' + (idx+1) + '.', 'result-ev');

      var monto = Number(montoRaw);
      var per   = Number(perRaw);

      if (!isFiniteNumber(monto) || !isFiniteNumber(per)) return fail('Flujo ' + (idx+1) + ' inválido.', 'result-ev');
      if (monto < 0)                 return fail('El monto del flujo ' + (idx+1) + ' no puede ser negativo.', 'result-ev');
      if (monto > LIMITS.moneyMax)   return fail('El monto del flujo ' + (idx+1) + ' supera el límite.', 'result-ev');
      if (per < 0 || per > LIMITS.periodMax) return fail('El período del flujo ' + (idx+1) + ' está fuera de rango.', 'result-ev');

      var fval = safePow(1 + i, f - per, 'flujo ' + (idx+1), 'result-ev');
      if (fval === null) return;
      var val = monto * fval;
      if (!isFiniteNumber(val)) return fail('Flujo ' + (idx+1) + ' produce valor fuera de rango.', 'result-ev');

      var sign = tipo === 'Deuda' ? 1 : -1;
      suma += sign * val;

      var badgeClass = tipo === 'Deuda' ? 'bg-danger' : 'bg-success';
      var signSymbol = sign > 0 ? '+ ' : '− ';
      var textClass = sign > 0 ? 'text-danger' : 'text-success';

      stepsRows.push(
        '<tr>' +
        '<td class="text-center fw-bold">' + (idx + 1) + '</td>' +
        '<td><span class="badge ' + badgeClass + '">' + tipo + '</span></td>' +
        '<td>$' + fmt(monto) + '</td>' +
        '<td class="text-center">P' + per + '</td>' +
        '<td>$(1 + ' + fmt(iPct/100, 4) + ')^{' + f + ' - ' + per + '} = ' + fmt(fval, 4) + '$</td>' +
        '<td class="fw-bold ' + textClass + '">' + signSymbol + '$' + fmt(Math.abs(val)) + '</td>' +
        '</tr>'
      );
    }

    if (!isFiniteNumber(suma)) return fail('Resultado fuera de rango.', 'result-ev');
    ok('Neto en fecha focal P' + f + ' = $' + fmt(suma), 'result-ev');

    var stepHtml =
      '<div class="mb-2"><strong>Fecha focal:</strong> Período P' + f + ' &nbsp;|&nbsp; <strong>Tasa:</strong> ' + fmt(iPct, 4) + '% por período</div>' +
      '<div class="table-responsive"><table class="table table-sm table-bordered table-hover align-middle">' +
      '<thead class="table-light"><tr>' +
      '<th class="text-center">#</th>' +
      '<th>Tipo</th>' +
      '<th>Monto original</th>' +
      '<th class="text-center">Período</th>' +
      '<th>Factor traslado $(1+i)^{f - \\text{per}}$</th>' +
      '<th>Valor en Fecha Focal (P' + f + ')</th>' +
      '</tr></thead>' +
      '<tbody>' + stepsRows.join('') + '</tbody>' +
      '</table></div>' +
      '<div class="alert ' + (suma >= 0 ? 'alert-danger' : 'alert-success') + ' py-2 px-3 mt-2 mb-0">' +
      '<strong>Saldo Neto en Fecha Focal (P' + f + '):</strong> ' +
      '<span class="fs-6 fw-bold">$' + fmt(suma) + '</span> ' +
      (suma >= 0 ? '(Deudas > Pagos: Saldo deudor a pagar)' : '(Pagos > Deudas: Saldo a favor)') +
      '</div>';

    steps(stepHtml, 'steps-ev');
  });

  /* ── Botones Limpiar ──────────────────────────────────────── */
  bindSimple('reset-amort', function () {
    ['cred', 'iC', 'nC'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    var res = document.getElementById('result-amort');
    if (res) { res.textContent = ''; res.className = ''; }
    hideSteps('steps-amort');
    var tbl = document.getElementById('amort-table');
    if (tbl) tbl.innerHTML = '';
    if (chartAmort) { chartAmort.destroy(); chartAmort = null; }
    var cBox = document.getElementById('chart-amort-box');
    if (cBox) cBox.style.display = 'none';
  });

  bindSimple('reset-cap', function () {
    ['meta', 'iCap', 'nCap'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    var res = document.getElementById('result-cap');
    if (res) { res.textContent = ''; res.className = ''; }
    hideSteps('steps-cap');
  });

  bindSimple('reset-ev', function () {
    ['iev', 'focal'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    var flowsContainer = document.getElementById('flows');
    if (flowsContainer) {
      flowsContainer.innerHTML =
        '<div class="flow-row mb-2">' +
        '<input class="form-control monto" placeholder="Monto" type="number" min="0" max="1000000000000" step="any">' +
        '<input class="form-control per" placeholder="Período" type="number" min="0" max="100000" step="any">' +
        '<select class="form-select tipo" style="max-width:120px">' +
        '<option value="Deuda">Deuda</option>' +
        '<option value="Pago">Pago</option>' +
        '</select>' +
        '<button class="btn btn-outline-danger btn-remove" type="button">✕</button>' +
        '</div>';
      flowsContainer.querySelector('.btn-remove').addEventListener('click', function (e) {
        e.target.closest('.flow-row').remove();
      });
      applyInputGuards();
    }
    var res = document.getElementById('result-ev');
    if (res) { res.textContent = ''; res.className = ''; }
    hideSteps('steps-ev');
  });
})();

