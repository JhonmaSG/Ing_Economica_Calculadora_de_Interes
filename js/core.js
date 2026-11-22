/* Utilidades compartidas por los módulos de la calculadora. */
const LIMITS = { moneyMax: 1e12, periodMax: 100000, ratePctMax: 1000, flowMaxRows: 100 };
function fmt(n, decimals = 2) { return Number.isFinite(n) ? n.toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : String(n); }
function txt(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function ok(message, resultId = 'result') { const el = document.getElementById(resultId); if (el) { el.innerHTML = '<strong>Resultado:</strong> ' + message; el.className = 'success'; } }
function fail(message, resultId = 'result') { const el = document.getElementById(resultId); if (el) { el.innerHTML = '<strong>Error:</strong> ' + message; el.className = 'error'; } return null; }
function renderMath(target) { if (typeof renderMathInElement === 'function') renderMathInElement(target || document.body, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false }); }
function steps(html, stepsId = 'steps') { const el = document.getElementById(stepsId); if (el) { el.innerHTML = html; el.classList.add('show'); renderMath(el); } }
function hideSteps(stepsId = 'steps') { const el = document.getElementById(stepsId); if (el) { el.innerHTML = ''; el.classList.remove('show'); } }
function isFiniteNumber(n) { return Number.isFinite(n); }
function readRaw(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function readNumber(id, label, opts = {}) { const raw = readRaw(id), min = opts.min ?? -Infinity, max = opts.max ?? Infinity; if (!raw) return opts.required === false ? null : fail(label + ' es obligatorio.', opts.resultId); const n = Number(raw); if (!Number.isFinite(n)) return fail(label + ' no es un número válido.', opts.resultId); if (opts.integer && !Number.isInteger(n)) return fail(label + ' debe ser un entero.', opts.resultId); if (n < min) return fail(label + ' debe ser mayor o igual a ' + min + '.', opts.resultId); if (n > max) return fail(label + ' supera el máximo permitido (' + max + ').', opts.resultId); return n; }
function safePow(a, b, context, resultId) { const result = Math.pow(a, b); return Number.isFinite(result) ? result : fail('Operación fuera de rango (' + context + ').', resultId); }
function m(periodo) { return ({ Diaria: 360, Semanal: 52, Quincenal: 24, Mensual: 12, Bimestral: 6, Trimestral: 4, Cuatrimestral: 3, Semestral: 2, Anual: 1 }[periodo] || 12); }
function pct(x) { return x / 100; }
function bindSimple(id, fn) { const button = document.getElementById(id); if (button) button.addEventListener('click', fn); }
function applyInputGuards() { document.querySelectorAll('input[type="number"]').forEach(function (el) { if (!el.hasAttribute('step')) el.setAttribute('step', 'any'); el.addEventListener('input', function () { if (el.value.length > 24) el.value = el.value.slice(0, 24); }); }); }
document.addEventListener('DOMContentLoaded', function () { applyInputGuards(); renderMath(document.body); });
