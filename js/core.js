/* ============================================================
   js/core.js  —  Calculadora de Intereses shared utilities
   Must be loaded FIRST on every page (no ES modules).
   ============================================================ */

const LIMITS = {
  moneyMax: 1e12,
  periodMax: 100000,
  ratePctMax: 1000,
  flowMaxRows: 100,
};

/* ── Formatting ─────────────────────────────────────────────── */

/**
 * Format a number with thousand separators and fixed decimals.
 * @param {number} n
 * @param {number} decimals
 * @returns {string}
 */
function fmt(n, decimals = 2) {
  if (!Number.isFinite(n)) return String(n);
  return n.toLocaleString("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ── DOM helpers ────────────────────────────────────────────── */

function txt(id, t) {
  const el = document.getElementById(id);
  if (el) el.textContent = t;
}

function ok(message, resultId) {
  const id = resultId || "result";
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = "<strong>Resultado:</strong> " + message;
    el.className = "success";
  }
}

function fail(message, resultId) {
  const id = resultId || "result";
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = "<strong>Error:</strong> " + message;
    el.className = "error";
  }
  return null;
}

function renderMath(target) {
  if (typeof renderMathInElement === "function") {
    renderMathInElement(target || document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });
  }
}

/**
 * Set innerHTML of #steps (or a custom id) and show it.
 * @param {string} html
 * @param {string} [stepsId='steps']
 */
function steps(html, stepsId) {
  const id = stepsId || "steps";
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = html;
  el.classList.add("show");
  renderMath(el);
}

function hideSteps(stepsId) {
  const id = stepsId || "steps";
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = "";
    el.classList.remove("show");
  }
}

/* ── Validation helpers ─────────────────────────────────────── */

function isFiniteNumber(n) {
  return Number.isFinite(n);
}

function readRaw(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function readNumber(id, label, opts) {
  const options = opts || {};
  const required = options.required !== false;
  const min = options.min !== undefined ? options.min : -Infinity;
  const max = options.max !== undefined ? options.max : Infinity;
  const integer = options.integer || false;
  const resultId = options.resultId;

  const raw = readRaw(id);

  if (!raw) {
    if (!required) return null;
    return fail(label + " es obligatorio.", resultId);
  }

  const n = Number(raw);
  if (!isFiniteNumber(n))
    return fail(label + " no es un número válido.", resultId);
  if (integer && !Number.isInteger(n))
    return fail(label + " debe ser un entero.", resultId);
  if (n < min)
    return fail(label + " debe ser mayor o igual a " + min + ".", resultId);
  if (n > max)
    return fail(label + " supera el máximo permitido (" + max + ").", resultId);
  return n;
}

function safePow(a, b, context, resultId) {
  const val = Math.pow(a, b);
  if (!isFiniteNumber(val))
    return fail("Operación fuera de rango (" + context + ").", resultId);
  return val;
}

/* ── Period mapping ─────────────────────────────────────────── */

function m(periodo) {
  return (
    {
      Diaria: 360,
      Semanal: 52,
      Quincenal: 24,
      Mensual: 12,
      Bimestral: 6,
      Trimestral: 4,
      Cuatrimestral: 3,
      Semestral: 2,
      Anual: 1,
    }[periodo] || 12
  );
}

function pct(x) {
  return x / 100;
}

/* ── Event binding ──────────────────────────────────────────── */

function bindSimple(id, fn) {
  const b = document.getElementById(id);
  if (!b) return;
  b.addEventListener("click", fn);
}

/* ── Input guards ───────────────────────────────────────────── */

function applyInputGuards() {
  document.querySelectorAll('input[type="number"]').forEach(function (el) {
    if (!el.hasAttribute("step")) el.setAttribute("step", "any");
    el.addEventListener("input", function () {
      const val = el.value;
      if (val.length > 24) el.value = val.slice(0, 24);
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  applyInputGuards();
  renderMath(document.body);
});
