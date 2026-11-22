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
    explanation.unshift('<strong>Fórmula base:</strong> ' + (target === 'vp' ? '$$VP=A\\frac{1-(1+i)^{-n}}{i}$$' : '$$VF=A\\frac{(1+i)^n-1}{i}$$'));
    explanation.push('<strong>Datos:</strong> A = $' + fmt(A) + ', i = ' + fmt(i * 100, 5) + '%, n = ' + n + '.');
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
