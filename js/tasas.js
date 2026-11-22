/* ============================================================
   js/tasas.js  —  Módulo 2: Conversor Integral de Tasas
   Depends on: core.js, Chart.js
   ============================================================ */

(function () {
  var chartTasas = null;

  function buildSigla(mod, mom, per) {
    var pLetter = {
      Semanal: 'S',
      Mensual: 'M',
      Bimestral: 'B',
      Trimestral: 'T',
      Cuatrimestral: 'C',
      Semestral: 'S',
      Anual: 'A',
    }[per] || 'P';

    var mLetter = mom === 'Anticipada' ? 'A' : 'V';

    if (mod === 'Nominal') {
      return 'NA' + pLetter + mLetter + ' (Nominal Anual ' + per + ' ' + mom + ')';
    }
    if (per === 'Anual') {
      return mom === 'Anticipada' ? 'EAA (Efectiva Anual Anticipada)' : 'EA (Efectiva Anual)';
    }
    return 'E' + pLetter + mLetter + ' (Efectiva ' + per + ' ' + mom + ')';
  }

  function renderChartTasas(valIn, eaVal, valOut, labelIn, labelOut) {
    var canvas = document.getElementById('chart-tasas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (chartTasas) {
      chartTasas.destroy();
      chartTasas = null;
    }

    chartTasas = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [labelIn, 'EA Pivote (Efectiva Anual)', labelOut],
        datasets: [{
          label: 'Tasa (%)',
          data: [valIn, eaVal, valOut],
          backgroundColor: [
            'rgba(26,58,92,0.85)',
            'rgba(245,158,11,0.85)',
            'rgba(13,148,136,0.85)',
          ],
          borderColor: ['#1a3a5c', '#f59e0b', '#0d9488'],
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (c) {
                return ' ' + fmt(c.parsed.y, 4) + '%';
              }
            }
          }
        },
        scales: {
          y: {
            title: { display: true, text: 'Tasa (%)' },
            ticks: {
              callback: function (v) { return v + '%'; }
            }
          }
        }
      }
    });

    var box = document.getElementById('chart-tasas-box');
    if (box) box.style.display = '';
  }

  /* ── Conversión Integral ─────────────────────────────────── */
  bindSimple('calc-tasas-integral', function () {
    var ph = document.getElementById('steps-tasas-placeholder');
    if (ph) ph.style.display = 'none';

    var tasaPct = readNumber('tasa-valor', 'Valor de la tasa de origen', {
      min: 0,
      max: LIMITS.ratePctMax,
      resultId: 'result-tasas'
    });
    if (tasaPct === null) return;

    var modIn = document.getElementById('tasa-modalidad').value; // Nominal | Efectiva
    var momIn = document.getElementById('tasa-momento').value;   // Vencida | Anticipada
    var perIn = document.getElementById('tasa-periodo').value;   // Mensual, etc.
    var m1 = m(perIn);

    var modOut = document.getElementById('dest-modalidad').value; // Nominal | Efectiva
    var momOut = document.getElementById('dest-momento').value;   // Vencida | Anticipada
    var perOut = document.getElementById('dest-periodo').value;   // Mensual, etc.
    var m2 = m(perOut);

    var siglaIn = buildSigla(modIn, momIn, perIn);
    var siglaOut = buildSigla(modOut, momOut, perOut);

    var stepsArr = [];
    var currentDec = pct(tasaPct);

    stepsArr.push(
      '<div class="mb-2"><span class="badge bg-primary me-2">Entrada</span>' +
      '<strong>' + fmt(tasaPct, 4) + '% ' + siglaIn + '</strong>' +
      ' (m₁ = ' + m1 + ' capitalizaciones/año)</div>'
    );

    // ── Paso 1: Obtener periódica vencida origen (i_v1)
    var i_v1 = 0;
    if (modIn === 'Nominal') {
      var i_per_raw = currentDec / m1;
      stepsArr.push(
        '<strong>Paso 1: Obtener la tasa periódica de origen</strong><br>' +
        'Al ser tasa Nominal, se divide entre su frecuencia $m_1 = ' + m1 + '$:<br>' +
        '$$i_{\\text{per}} = \\frac{j}{m_1} = \\frac{' + fmt(tasaPct, 4) + '\\%}{' + m1 + '} = ' + fmt(i_per_raw * 100, 4) + '\\% \\text{ ' + perIn + ' ' + momIn + '}$$'
      );
      if (momIn === 'Anticipada') {
        if (i_per_raw >= 1) {
          return fail('La tasa periódica anticipada (' + fmt(i_per_raw * 100, 2) + '%) debe ser menor al 100%.', 'result-tasas');
        }
        i_v1 = i_per_raw / (1 - i_per_raw);
        stepsArr.push(
          '<strong>Paso 2: Convertir de periódica anticipada a periódica vencida</strong><br>' +
          'Fórmula: $i_v = \\frac{i_a}{1 - i_a}$<br>' +
          '$$i_{v1} = \\frac{' + fmt(i_per_raw, 6) + '}{1 - ' + fmt(i_per_raw, 6) + '} = ' + fmt(i_v1 * 100, 4) + '\\% \\text{ Efectiva ' + perIn + ' Vencida}$$'
        );
      } else {
        i_v1 = i_per_raw;
      }
    } else {
      // Es Efectiva
      if (momIn === 'Anticipada') {
        if (currentDec >= 1) {
          return fail('La tasa anticipada debe ser menor al 100%.', 'result-tasas');
        }
        i_v1 = currentDec / (1 - currentDec);
        stepsArr.push(
          '<strong>Paso 1: Convertir de efectiva anticipada a efectiva vencida</strong><br>' +
          'Fórmula: $i_v = \\frac{i_a}{1 - i_a}$<br>' +
          '$$i_{v1} = \\frac{' + fmt(currentDec, 6) + '}{1 - ' + fmt(currentDec, 6) + '} = ' + fmt(i_v1 * 100, 4) + '\\% \\text{ Efectiva ' + perIn + ' Vencida}$$'
        );
      } else {
        i_v1 = currentDec;
        stepsArr.push(
          '<strong>Paso 1: Identificación</strong><br>' +
          'La tasa ingresada ya es Efectiva ' + perIn + ' Vencida: $$i_{v1} = ' + fmt(i_v1 * 100, 4) + '\\%$$'
        );
      }
    }

    // ── Paso 2/3: Tasa Pivote (Efectiva Anual EA)
    var ea = Math.pow(1 + i_v1, m1) - 1;
    if (!Number.isFinite(ea)) return fail('Resultado fuera de rango al calcular EA.', 'result-tasas');

    stepsArr.push(
      '<strong>Paso ' + (stepsArr.length) + ': Calcular la Efectiva Anual (EA Pivote)</strong><br>' +
      'Fórmula: $EA = (1 + i_{v1})^{m_1} - 1$<br>' +
      '$$EA = (1 + ' + fmt(i_v1, 6) + ')^{' + m1 + '} - 1 = ' + fmt(ea * 100, 4) + '\\%$$' +
      '<div class="alert alert-warning py-1 px-2 d-inline-block mt-1 mb-0 small"><strong>EA Pivote:</strong> ' + fmt(ea * 100, 4) + '%</div>'
    );

    // ── Paso 3/4: De EA a periódica vencida destino (i_v2)
    var i_v2 = Math.pow(1 + ea, 1 / m2) - 1;
    if (!Number.isFinite(i_v2)) return fail('Error al calcular la periódica destino.', 'result-tasas');

    stepsArr.push(
      '<strong>Paso ' + (stepsArr.length) + ': De EA a Efectiva ' + perOut + ' Vencida</strong><br>' +
      'Frecuencia destino $m_2 = ' + m2 + '$ (' + perOut + ')<br>' +
      'Fórmula: $i_{v2} = (1 + EA)^{1/m_2} - 1$<br>' +
      '$$i_{v2} = (1 + ' + fmt(ea, 6) + ')^{1/' + m2 + '} - 1 = ' + fmt(i_v2 * 100, 4) + '\\%$$'
    );

    // ── Paso 4/5: Aplicar modalidad y momento destino
    var finalRate = 0;
    if (momOut === 'Anticipada') {
      var i_a2 = i_v2 / (1 + i_v2);
      stepsArr.push(
        '<strong>Paso ' + (stepsArr.length) + ': Convertir a Anticipada</strong><br>' +
        'Fórmula: $i_a = \\frac{i_v}{1 + i_v}$<br>' +
        '$$i_{a2} = \\frac{' + fmt(i_v2, 6) + '}{1 + ' + fmt(i_v2, 6) + '} = ' + fmt(i_a2 * 100, 4) + '\\% \\text{ Efectiva ' + perOut + ' Anticipada}$$'
      );
      if (modOut === 'Nominal') {
        finalRate = i_a2 * m2;
        stepsArr.push(
          '<strong>Paso ' + (stepsArr.length) + ': Expresar en Tasa Nominal</strong><br>' +
          'Fórmula: $j = i_{a2} \\cdot m_2$<br>' +
          '$$j = ' + fmt(i_a2 * 100, 6) + '\\% \\times ' + m2 + ' = ' + fmt(finalRate * 100, 4) + '\\%$$'
        );
      } else {
        finalRate = i_a2;
      }
    } else {
      // Vencida
      if (modOut === 'Nominal') {
        finalRate = i_v2 * m2;
        stepsArr.push(
          '<strong>Paso ' + (stepsArr.length) + ': Expresar en Tasa Nominal</strong><br>' +
          'Fórmula: $j = i_{v2} \\cdot m_2$<br>' +
          '$$j = ' + fmt(i_v2 * 100, 6) + '\\% \\times ' + m2 + ' = ' + fmt(finalRate * 100, 4) + '\\%$$'
        );
      } else {
        finalRate = i_v2;
      }
    }

    var finalPct = finalRate * 100;
    var finalMsg = '<strong>' + fmt(finalPct, 4) + '%</strong> ' + siglaOut;
    ok(finalMsg, 'result-tasas');

    steps(
      '<div class="steps-flow">' +
      stepsArr.join('<hr class="my-2" style="opacity:.15">') +
      '<div class="mt-3 p-3 rounded text-white" style="background:#0d9488">' +
      '<strong>Resultado Final:</strong><br><span class="fs-5">' + fmt(finalPct, 4) + '% ' + siglaOut + '</span>' +
      '</div></div>',
      'steps-tasas'
    );

    renderChartTasas(
      tasaPct,
      ea * 100,
      finalPct,
      'Origen: ' + fmt(tasaPct, 2) + '%',
      'Destino: ' + fmt(finalPct, 2) + '%'
    );
  });

  /* ── Botón Limpiar ────────────────────────────────────────── */
  bindSimple('reset-tasas', function () {
    var inEl = document.getElementById('tasa-valor');
    if (inEl) inEl.value = '';

    document.getElementById('tasa-modalidad').value = 'Efectiva';
    document.getElementById('tasa-momento').value = 'Vencida';
    document.getElementById('tasa-periodo').value = 'Anual';

    document.getElementById('dest-modalidad').value = 'Efectiva';
    document.getElementById('dest-momento').value = 'Vencida';
    document.getElementById('dest-periodo').value = 'Mensual';

    var res = document.getElementById('result-tasas');
    if (res) { res.textContent = ''; res.className = ''; }
    hideSteps('steps-tasas');

    var ph = document.getElementById('steps-tasas-placeholder');
    if (ph) ph.style.display = '';

    if (chartTasas) {
      chartTasas.destroy();
      chartTasas = null;
    }
    var cBox = document.getElementById('chart-tasas-box');
    if (cBox) cBox.style.display = 'none';
  });
})();
