/* ============================================================
   js/interes.js  —  Módulo 1: Interés Compuesto
   Depends on: core.js, Chart.js
   ============================================================ */

(function () {
  var chartInstance = null;

  function renderChart(periods, values) {
    var canvas = document.getElementById('chart-interes');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: periods,
        datasets: [{
          label: 'Capital acumulado',
          data: values,
          borderColor: '#0d9488',
          backgroundColor: 'rgba(13,148,136,.12)',
          borderWidth: 2.5,
          pointRadius: periods.length <= 30 ? 4 : 2,
          pointBackgroundColor: '#1a3a5c',
          fill: true,
          tension: 0.3,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: function(c) { return ' $' + fmt(c.parsed.y); }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: (document.getElementById('periodo')?.value || 'meses').replace(/^./, function (c) { return c.toUpperCase(); }) } },
          y: {
            title: { display: true, text: 'Valor ($)' },
            ticks: { callback: function(v) { return '$' + fmt(v); } }
          }
        }
      }
    });

    document.getElementById('chart-interes-box').style.display = '';
  }

  bindSimple('calc-interes', function () {
    hideSteps();
    var vpRaw = readRaw('vp');
    var vfRaw = readRaw('vf');
    var iRaw  = readRaw('i');
    var nRaw  = readRaw('n');
    var periodUnit = document.getElementById('periodo') ? document.getElementById('periodo').value : 'meses';
    var periodLabel = periodUnit === 'años' ? 'años' : 'meses';
    var filled = [vpRaw, vfRaw, iRaw, nRaw].filter(Boolean).length;

    if (filled !== 3)
      return fail('Debes llenar exactamente 3 campos y dejar 1 vacío.');

    var VP   = vpRaw ? readNumber('vp', 'Valor presente',      { min: 0, max: LIMITS.moneyMax }) : null;
    if (VP === null && vpRaw) return;
    var VF   = vfRaw ? readNumber('vf', 'Valor futuro',        { min: 0, max: LIMITS.moneyMax }) : null;
    if (VF === null && vfRaw) return;
    var iPct = iRaw  ? readNumber('i',  'Tasa por período (%)', { min: 0, max: LIMITS.ratePctMax }) : null;
    if (iPct === null && iRaw) return;
    var nVal = nRaw  ? readNumber('n',  'Número de períodos',   { min: 1, max: LIMITS.periodMax, integer: false }) : null;
    if (nVal === null && nRaw) return;

    var i = iPct !== null ? pct(iPct) : null;

    // ── Calcular VP ──────────────────────────────────────────
    if (!vpRaw) {
      var base = 1 + i;
      var p = safePow(base, nVal, 'VF/(1+i)^n'); if (p === null) return;
      var res = VF / p;
      if (!isFiniteNumber(res)) return fail('No se pudo calcular VP con esos datos.');

      ok('VP = $' + fmt(res));
      steps(
        '<strong>Fórmula:</strong> $$P = \\frac{F}{(1 + i)^n}$$' +
        'Sustituyendo: $$P = \\frac{' + fmt(VF) + '}{(1 + ' + fmt(iPct/100,6) + ')^{' + fmt(nVal,2) + '}}$$' +
        'Factor $(1+i)^n$: ' + fmt(p, 6) + '<br>' +
        '<strong>P (VP) = $' + fmt(res) + '</strong>'
      );

      // Chart: show growth from 0 to n
      var pts = [], vals = [];
      var step = Math.max(1, Math.round(nVal / 60));
      for (var t = 0; t <= nVal; t += step) {
        pts.push(t);
        vals.push(res * Math.pow(base, t));
      }
      if (pts[pts.length - 1] !== nVal) { pts.push(nVal); vals.push(VF); }
      renderChart(pts, vals);
      return;
    }

    // ── Calcular VF ──────────────────────────────────────────
    if (!vfRaw) {
      var base2 = 1 + i;
      var p2 = safePow(base2, nVal, 'VP*(1+i)^n'); if (p2 === null) return;
      var res2 = VP * p2;
      if (!isFiniteNumber(res2)) return fail('No se pudo calcular VF con esos datos.');

      ok('VF = $' + fmt(res2));
      steps(
        '<strong>Fórmula:</strong> $$F = P \\cdot (1 + i)^n$$' +
        'Sustituyendo: $$F = ' + fmt(VP) + ' \\cdot (1 + ' + fmt(iPct/100,6) + ')^{' + fmt(nVal,2) + '}$$' +
        'Factor $(1+i)^n$: ' + fmt(p2, 6) + '<br>' +
        '<strong>F (VF) = $' + fmt(res2) + '</strong>'
      );

      var pts2 = [], vals2 = [];
      var step2 = Math.max(1, Math.round(nVal / 60));
      for (var t2 = 0; t2 <= nVal; t2 += step2) {
        pts2.push(t2);
        vals2.push(VP * Math.pow(base2, t2));
      }
      if (pts2[pts2.length - 1] !== nVal) { pts2.push(nVal); vals2.push(res2); }
      renderChart(pts2, vals2);
      return;
    }

    // ── Calcular i ───────────────────────────────────────────
    if (!iRaw) {
      if (VP <= 0 || VF <= 0 || nVal <= 0)
        return fail('VP, VF y n deben ser mayores que 0 para hallar i.');
      var ratio = VF / VP;
      if (ratio <= 0) return fail('La razón VF/VP debe ser positiva.');
      var p3 = safePow(ratio, 1 / nVal, '(VF/VP)^(1/n)'); if (p3 === null) return;
      var res3 = p3 - 1;
      if (!isFiniteNumber(res3)) return fail('No se pudo calcular i con esos datos.');

      ok('i = ' + fmt(res3 * 100, 6) + '% por ' + periodLabel);
      steps(
        '<strong>Fórmula:</strong> $$i = \\left(\\frac{F}{P}\\right)^{1/n} - 1$$' +
        'Sustituyendo: $$i = \\left(\\frac{' + fmt(VF) + '}{' + fmt(VP) + '}\\right)^{1/' + fmt(nVal,2) + '} - 1$$' +
        'Razón $F/P$: ' + fmt(ratio, 6) + '<br>' +
        '<strong>i = ' + fmt(res3 * 100, 6) + '%</strong>'
      );

      var base3 = 1 + res3;
      var pts3 = [], vals3 = [];
      var step3 = Math.max(1, Math.round(nVal / 60));
      for (var t3 = 0; t3 <= nVal; t3 += step3) {
        pts3.push(t3);
        vals3.push(VP * Math.pow(base3, t3));
      }
      if (pts3[pts3.length - 1] !== nVal) { pts3.push(nVal); vals3.push(VF); }
      renderChart(pts3, vals3);
      return;
    }

    // ── Calcular n ───────────────────────────────────────────
    if (i <= 0) return fail('La tasa debe ser mayor que 0 para hallar n.');
    if (VP <= 0 || VF <= 0) return fail('VP y VF deben ser mayores que 0 para hallar n.');
    var num = Math.log(VF / VP);
    var den = Math.log(1 + i);
    if (!isFiniteNumber(num) || !isFiniteNumber(den) || den === 0)
      return fail('No se puede calcular n con esos datos.');
    var res4 = num / den;
    if (!isFiniteNumber(res4) || res4 < 0) return fail('Resultado inválido para n.');

    ok('n = ' + fmt(res4, 4) + ' ' + periodLabel);
    steps(
      '<strong>Fórmula:</strong> $$n = \\frac{\\ln(F/P)}{\\ln(1 + i)}$$' +
      'Sustituyendo: $$n = \\frac{\\ln(' + fmt(VF) + ' / ' + fmt(VP) + ')}{\\ln(1 + ' + fmt(iPct/100,6) + ')}$$' +
      '$\\ln(F/P) = ' + fmt(num, 6) + '$<br>' +
      '$\\ln(1+i) = ' + fmt(den, 6) + '$<br>' +
      '<strong>n = ' + fmt(res4, 4) + ' períodos</strong>'
    );

    var base4 = 1 + i;
    var nChart = Math.ceil(res4);
    var pts4 = [], vals4 = [];
    var step4 = Math.max(1, Math.round(nChart / 60));
    for (var t4 = 0; t4 <= nChart; t4 += step4) {
      pts4.push(t4);
      vals4.push(VP * Math.pow(base4, t4));
    }
    renderChart(pts4, vals4);
  });

  /* ── Botón Limpiar ────────────────────────────────────────── */
  bindSimple('reset-interes', function () {
    ['vp', 'vf', 'i', 'n'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    var periodSelect = document.getElementById('periodo');
    if (periodSelect) periodSelect.value = 'meses';
    var res = document.getElementById('result');
    if (res) {
      res.textContent = '';
      res.className = '';
    }
    hideSteps();
    var ph = document.getElementById('steps-placeholder');
    if (ph) ph.style.display = '';
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    var cBox = document.getElementById('chart-interes-box');
    if (cBox) cBox.style.display = 'none';
  });
})();

