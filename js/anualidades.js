/* ============================================================
   js/anualidades.js  —  Módulo 3: Anualidades
   Depends on: core.js, Chart.js
   ============================================================ */

(function () {
  var charts = {};

  /* ── Bar chart: payment timeline ────────────────────────── */
  function renderTimeline(canvasId, boxId, n, A, label, kOffset) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (charts[canvasId]) {
      charts[canvasId].destroy();
      charts[canvasId] = null;
    }

    var k = kOffset || 0;
    var totalPeriods = Math.min(n + k, 60);
    var labels = [];
    var data = [];

    for (var t = 1; t <= totalPeriods; t++) {
      labels.push('P' + t);
      if (t <= k) {
        data.push(0); // período de gracia
      } else {
        data.push(A);
      }
    }

    charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: label || 'Cuota por período',
          data: data,
          backgroundColor: 'rgba(13,148,136,.75)',
          borderColor: '#0d9488',
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: function (c) {
                return ' $' + fmt(c.parsed.y);
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Período' } },
          y: {
            title: { display: true, text: 'Cuota ($)' },
            ticks: { callback: function (v) { return '$' + fmt(v); } }
          }
        }
      }
    });

    var box = document.getElementById(boxId);
    if (box) box.style.display = '';
  }

  /* ── Core annuity calculation ───────────────────────────── */
  function calcAnualidad(opts) {
    var sfx        = opts.suffix; // 'v', 'a', 'd', 'p'
    var anticipada = Boolean(opts.anticipada);
    var diferida   = Boolean(opts.diferida);
    var perpetua   = Boolean(opts.perpetua);

    var resId   = 'result-' + sfx;
    var stpId   = 'steps-' + sfx;
    var chartId = 'chart-' + sfx;
    var boxId   = 'chart-box-' + sfx;

    var A = readNumber('A-' + sfx, 'Cuota / pago (A)', { min: 0, max: LIMITS.moneyMax, resultId: resId });
    if (A === null) return;
    var iPct = readNumber('iA-' + sfx, 'Tasa por período (%)', { min: 0.000001, max: LIMITS.ratePctMax, resultId: resId });
    if (iPct === null) return;
    var i = pct(iPct);

    // Perpetuidad
    if (perpetua) {
      var vp0 = A / i;
      if (!isFiniteNumber(vp0)) return fail('Resultado fuera de rango.', resId);
      ok('VP = $' + fmt(vp0), resId);
      steps(
        '<strong>Fórmula:</strong> $$VP = \\frac{A}{i}$$' +
        'Sustituyendo: $$VP = \\frac{' + fmt(A) + '}{' + fmt(iPct / 100, 6) + '}$$' +
        '<strong>VP = $' + fmt(vp0) + '</strong>',
        stpId
      );
      return;
    }

    var n = readNumber('nA-' + sfx, 'Número de períodos (n)', { min: 1, max: LIMITS.periodMax, resultId: resId });
    if (n === null) return;

    var factor = safePow(1 + i, -n, 'anualidad');
    if (factor === null) return;

    var vp = A * ((1 - factor) / i);
    var stepsBase, label;
    var kGrace = 0;

    if (anticipada) {
      vp *= (1 + i);
      stepsBase =
        '<strong>Fórmula:</strong> $$VP = A \\cdot \\left[\\frac{1 - (1+i)^{-n}}{i}\\right] \\cdot (1+i)$$' +
        'Valores: $A = ' + fmt(A) + '$, $i = ' + fmt(iPct, 4) + '\\%$, $n = ' + n + '$<br>' +
        'Factor anualidad vencida: ' + fmt((1 - factor) / i, 6) + '<br>' +
        'Factor anticipada $(1+i)$: ' + fmt(1 + i, 6) + '<br>' +
        '<strong>VP = $' + fmt(vp) + '</strong>';
      label = 'Cuota anticipada';
    } else if (diferida) {
      var k = readNumber('kA-' + sfx, 'Períodos de gracia (k)', { min: 0, max: LIMITS.periodMax, resultId: resId });
      if (k === null) return;
      kGrace = k;
      var def = safePow(1 + i, k, 'diferimiento');
      if (def === null || def === 0) return fail('No se pudo aplicar el diferimiento.', resId);
      vp /= def;
      stepsBase =
        '<strong>Fórmula:</strong> $$VP = \\frac{A \\cdot \\left[\\frac{1 - (1+i)^{-n}}{i}\\right]}{(1+i)^k}$$' +
        'Valores: $A = ' + fmt(A) + '$, $i = ' + fmt(iPct, 4) + '\\%$, $n = ' + n + '$, $k = ' + k + '$<br>' +
        'Valor en período diferido: $' + fmt(A * ((1 - factor) / i)) + '<br>' +
        'Factor diferimiento $(1+i)^k$: ' + fmt(def, 6) + '<br>' +
        '<strong>VP = $' + fmt(vp) + '</strong>';
      label = 'Cuota diferida (inicia en P' + (k + 1) + ')';
    } else {
      stepsBase =
        '<strong>Fórmula:</strong> $$VP = A \\cdot \\left[\\frac{1 - (1+i)^{-n}}{i}\\right]$$' +
        'Valores: $A = ' + fmt(A) + '$, $i = ' + fmt(iPct, 4) + '\\%$, $n = ' + n + '$<br>' +
        'Factor anualidad: ' + fmt((1 - factor) / i, 6) + '<br>' +
        '<strong>VP = $' + fmt(vp) + '</strong>';
      label = 'Cuota vencida';
    }

    if (!isFiniteNumber(vp)) return fail('Resultado fuera de rango.', resId);
    ok('VP = $' + fmt(vp), resId);
    steps(stepsBase, stpId);
    renderTimeline(chartId, boxId, n, A, label, kGrace);
  }

  /* ── Bind buttons ───────────────────────────────────────── */
  bindSimple('calc-av', function () { calcAnualidad({ suffix: 'v', anticipada: false, diferida: false, perpetua: false }); });
  bindSimple('calc-aa', function () { calcAnualidad({ suffix: 'a', anticipada: true,  diferida: false, perpetua: false }); });
  bindSimple('calc-ad', function () { calcAnualidad({ suffix: 'd', anticipada: false, diferida: true,  perpetua: false }); });
  bindSimple('calc-ap', function () { calcAnualidad({ suffix: 'p', perpetua: true }); });

  /* ── Reset handlers ─────────────────────────────────────── */
  function resetTab(sfx, inputs) {
    inputs.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    var res = document.getElementById('result-' + sfx);
    if (res) { res.textContent = ''; res.className = ''; }
    hideSteps('steps-' + sfx);
    var chartId = 'chart-' + sfx;
    if (charts[chartId]) {
      charts[chartId].destroy();
      charts[chartId] = null;
    }
    var box = document.getElementById('chart-box-' + sfx);
    if (box) box.style.display = 'none';
  }

  bindSimple('reset-av', function () { resetTab('v', ['A-v', 'iA-v', 'nA-v']); });
  bindSimple('reset-aa', function () { resetTab('a', ['A-a', 'iA-a', 'nA-a']); });
  bindSimple('reset-ad', function () { resetTab('d', ['A-d', 'iA-d', 'nA-d', 'kA-d']); });
  bindSimple('reset-ap', function () { resetTab('p', ['A-p', 'iA-p']); });
})();

