/* Módulo unificado de anualidades: vencida, anticipada, diferida y general. */
(function () {
  var chart;
  function value(id) { return readNumber(id, id, { min: 0, resultId: 'result-anualidad' }); }
  function toggleGeneral() {
    var general = document.getElementById('tipoA').value === 'general';
    document.getElementById('generalFields').classList.toggle('d-none', !general);
    document.getElementById('iA').closest('.mb-3').classList.toggle('d-none', general);
  }
  function calculate() {
    hideSteps('steps-anualidad');
    var A = value('A'); if (A === null) return;
    var n = readNumber('nA', 'Número de pagos', { min: 1, max: LIMITS.periodMax, resultId: 'result-anualidad' }); if (n === null) return;
    var type = document.getElementById('tipoA').value;
    var target = document.getElementById('objetivoA').value;
    var i;
    var explanation = [];
    if (type === 'general') {
      var j = readNumber('jA', 'Tasa nominal anual', { min: 0, max: LIMITS.ratePctMax, resultId: 'result-anualidad' }); if (j === null) return;
      var cap = document.getElementById('capA').value, pay = document.getElementById('payA').value;
      var mc = m(cap), mp = m(pay), nominal = pct(j);
      var ea = Math.pow(1 + nominal / mc, mc) - 1;
      i = Math.pow(1 + ea, 1 / mp) - 1;
      explanation.push('<strong>1. Convertir la tasa al período de pago</strong><br>m<sub>c</sub> = ' + mc + ', m<sub>p</sub> = ' + mp + '<br>EA = (1 + j/m<sub>c</sub>)<sup>m<sub>c</sub></sup> - 1 = ' + fmt(ea * 100, 5) + '%<br>i<sub>pago</sub> = (1 + EA)<sup>1/m<sub>p</sub></sup> - 1 = <strong>' + fmt(i * 100, 5) + '%</strong>');
    } else {
      var iPct = readNumber('iA', 'Tasa por período', { min: 0.000001, max: LIMITS.ratePctMax, resultId: 'result-anualidad' }); if (iPct === null) return;
      i = pct(iPct);
    }
    var factor = target === 'vp' ? (1 - Math.pow(1 + i, -n)) / i : (Math.pow(1 + i, n) - 1) / i;
    var result = A * factor;
    if (type === 'anticipada') result *= (1 + i);
    if (type === 'diferida' && target === 'vp') {
      var k = readNumber('kA', 'Períodos de gracia', { min: 0, max: LIMITS.periodMax, resultId: 'result-anualidad' }); if (k === null) return;
      result /= Math.pow(1 + i, k);
      explanation.push('<strong>Diferimiento:</strong> VP = VP en inicio de pagos / (1+i)<sup>k</sup>, con k = ' + k + '.');
    }
    if (!Number.isFinite(result)) return fail('Resultado fuera de rango.', 'result-anualidad');
    var label = target.toUpperCase() + ' de anualidad ' + (type === 'vencida' ? 'vencida' : type);
    ok(label + ' = <strong>$' + fmt(result) + '</strong>', 'result-anualidad');
    var rateText = fmt(i * 100, 5) + '%';
    var rateDecimalText = fmt(i, 8);
    var factorFormula = target === 'vp'
      ? 'A\\left[\\frac{1-(1+i)^{-n}}{i}\\right]'
      : 'A\\left[\\frac{(1+i)^n-1}{i}\\right]';
    if (type === 'anticipada') factorFormula += '\\,(1+i)';
    if (type === 'diferida' && target === 'vp') factorFormula += '\\,/\\,(1+i)^k';
    var factorValue = fmt(factor, 8);
    var baseResult = A * factor;
    explanation.unshift('<strong>1. Fórmula aplicable:</strong> $$' + (target === 'vp' ? 'VP=' : 'VF=') + factorFormula + '$$');
    var substitution = target === 'vp'
      ? 'VP=' + fmt(A) + '\\left[\\frac{1-(1+' + rateDecimalText + ')^{' + (-n) + '}}{' + rateDecimalText + '}\\right]'
      : 'VF=' + fmt(A) + '\\left[\\frac{(1+' + rateDecimalText + ')^{' + n + '}-1}{' + rateDecimalText + '}\\right]';
    if (type === 'anticipada') substitution += '\\,(1+' + rateDecimalText + ')';
    if (type === 'diferida' && target === 'vp') substitution += '\\,/\\,(1+' + rateDecimalText + ')^{' + readRaw('kA') + '}';
    explanation.push('<strong>2. Sustitución:</strong> $$' + substitution + '$$');
    var factorExplanation = '<strong>3. Factor financiero:</strong> ' + (target === 'vp' ? 'P/A' : 'F/A') + ' = ' + factorValue;
    if (type === 'anticipada' || (type === 'diferida' && target === 'vp')) {
      factorExplanation += '<br>' + (target === 'vp' ? 'VP' : 'VF') + ' antes de ajustes = $' + fmt(baseResult);
    }
    explanation.push(factorExplanation);
    if (type === 'anticipada') {
      explanation.push('<strong>4. Ajuste por pago anticipado:</strong> se multiplica por (1+i) = ' + fmt(1 + i, 8) + '<br>Resultado intermedio = $' + fmt(baseResult * (1 + i)));
    }
    if (type === 'diferida' && target === 'vp') {
      var grace = readRaw('kA');
      explanation.push('<strong>5. Ajuste por diferimiento:</strong> se divide entre (1+i)<sup>k</sup>, con k = ' + grace + '<br>Resultado final = $' + fmt(result));
    }
    explanation.push('<strong>Datos de entrada:</strong> A = $' + fmt(A) + ', i = ' + rateText + ', n = ' + n + (type === 'diferida' ? ', k = ' + readRaw('kA') : '') + '.');
    explanation.push('<strong>Resultado:</strong> ' + target.toUpperCase() + ' = $' + fmt(result));
    steps(explanation.join('<hr class="my-2">'), 'steps-anualidad');
    draw(n, A, type);
  }
  function draw(n, A, type) {
    var canvas = document.getElementById('chart-anualidad'); if (!canvas || typeof Chart === 'undefined') return;
    if (chart) chart.destroy();
    var labels = [], data = []; for (var t = 1; t <= Math.min(n, 60); t++) { labels.push('P' + t); data.push(A); }
    chart = new Chart(canvas, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Pago ' + type, data: data, backgroundColor: '#0d9488' }] }, options: { responsive: true, plugins: { legend: { display: false } } } });
  }
  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('tipoA').addEventListener('change', toggleGeneral);
    bindSimple('calc-anualidad', calculate);
    bindSimple('reset-anualidad', function () { document.querySelectorAll('input').forEach(function (e) { if (e.id !== 'kA') e.value = ''; }); document.getElementById('kA').value = 0; document.getElementById('result-anualidad').innerHTML = ''; hideSteps('steps-anualidad'); if (chart) chart.destroy(); });
    toggleGeneral();
  });
})();
