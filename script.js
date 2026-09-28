/* =========================================================
   Calculadora de Dosis Absorbida en Agua — TRS-398 (IAEA)
   Lógica de la aplicación (JavaScript vanilla, sin dependencias)
   =========================================================
   Estructura del archivo:
   1. Estado global
   2. Utilidades numéricas y de formato
   3. Gestión de lecturas de la cámara (tabla dinámica)
   4. Cálculo de kTP (temperatura y presión)
   5. Gestión de tarjetas de factores (kpol, ks, kelec, kplastic)
   6. Tabla editable e interpolación de kQ,Q0
   7. Validación de datos
   8. Cálculo principal de la dosis (MQ, Dw,Q) y trazabilidad
   9. Exportación (CSV, TXT, impresión)
   10. Ayudas contextuales (tooltips)
   11. Inicialización de eventos
   ========================================================= */

/* ---------------------------------------------------------
   1. ESTADO GLOBAL
   --------------------------------------------------------- */
const state = {
  readings: [null, null],      // lecturas individuales M_i
  kqTable: []                  // tabla editable { tpr, kq }
};

/* ---------------------------------------------------------
   2. UTILIDADES NUMÉRICAS Y DE FORMATO
   --------------------------------------------------------- */
function toNumber(value) {
  if (value === null || value === undefined || value === "") return NaN;
  const n = Number(value);
  return n;
}

function isValidNumber(n) {
  return typeof n === "number" && !isNaN(n) && isFinite(n);
}

function fmt(value, decimals = 5) {
  if (!isValidNumber(value)) return "—";
  return value.toFixed(decimals);
}

function fmtSci(value, decimals = 5) {
  if (!isValidNumber(value)) return "—";
  return value.toExponential(decimals);
}

/* Conversión de temperatura a Kelvin (offset absoluto, ya que kTP usa 273.2+T en °C) */
function temperatureToCelsius(value, unit) {
  if (!isValidNumber(value)) return NaN;
  return unit === "K" ? value - 273.2 : value;
}

/* Conversión de presión a kPa */
function pressureToKPa(value, unit) {
  if (!isValidNumber(value)) return NaN;
  if (unit === "kPa") return value;
  if (unit === "hPa") return value / 10;   // 1 hPa = 0.1 kPa
  if (unit === "mbar") return value / 10;  // 1 mbar = 0.1 kPa
  return NaN;
}

/* ---------------------------------------------------------
   3. GESTIÓN DE LECTURAS DE LA CÁMARA
   --------------------------------------------------------- */
function renderReadingsTable() {
  const body = document.getElementById("readingsTableBody");
  body.innerHTML = "";
  state.readings.forEach((val, idx) => {
    const tr = document.createElement("tr");

    const tdIdx = document.createElement("td");
    tdIdx.textContent = "M" + (idx + 1);
    tr.appendChild(tdIdx);

    const tdInput = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.className = "input-field";
    input.value = val === null ? "" : val;
    input.addEventListener("input", (e) => {
      const v = e.target.value === "" ? null : toNumber(e.target.value);
      state.readings[idx] = v;
      updateReadingsStats();
    });
    tdInput.appendChild(input);
    tr.appendChild(tdInput);

    const tdRemove = document.createElement("td");
    if (state.readings.length > 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-icon-remove";
      btn.textContent = "Eliminar";
      btn.addEventListener("click", () => {
        state.readings.splice(idx, 1);
        renderReadingsTable();
        updateReadingsStats();
      });
      tdRemove.appendChild(btn);
    }
    tr.appendChild(tdRemove);

    body.appendChild(tr);
  });
}

function addReading() {
  state.readings.push(null);
  renderReadingsTable();
  updateReadingsStats();
}

function getValidReadings() {
  return state.readings.filter(isValidNumber);
}

function calculateStats(values) {
  const n = values.length;
  if (n === 0) return { n: 0, mean: NaN, stdev: NaN, uA: NaN };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  if (n === 1) return { n, mean, stdev: NaN, uA: NaN };
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
  const stdev = Math.sqrt(variance);
  const sem = stdev / Math.sqrt(n); // error estándar de la media
  const uA = mean !== 0 ? (sem / Math.abs(mean)) * 100 : NaN; // incertidumbre tipo A relativa (%)
  return { n, mean, stdev, uA };
}

function updateReadingsStats() {
  const values = getValidReadings();
  const stats = calculateStats(values);
  document.getElementById("statN").textContent = stats.n || "—";
  document.getElementById("statMean").textContent = fmt(stats.mean);
  document.getElementById("statStdev").textContent = fmt(stats.stdev);
  document.getElementById("statUA").textContent = isValidNumber(stats.uA) ? stats.uA.toFixed(3) + " %" : "—";
  return stats;
}

/* ---------------------------------------------------------
   4. CÁLCULO DE kTP
   --------------------------------------------------------- */
function calculateKTP() {
  const T = temperatureToCelsius(toNumber(document.getElementById("tMed").value), document.getElementById("tMedUnidad").value);
  const T0 = temperatureToCelsius(toNumber(document.getElementById("tCal").value), document.getElementById("tCalUnidad").value);
  const P = pressureToKPa(toNumber(document.getElementById("pMed").value), document.getElementById("pMedUnidad").value);
  const P0 = pressureToKPa(toNumber(document.getElementById("pCal").value), document.getElementById("pCalUnidad").value);

  if (![T, T0, P, P0].every(isValidNumber) || P === 0) {
    document.getElementById("ktpValue").textContent = "—";
    return NaN;
  }
  const kTP = ((273.2 + T) / (273.2 + T0)) * (P0 / P);
  document.getElementById("ktpValue").textContent = fmt(kTP);
  return kTP;
}

/* ---------------------------------------------------------
   5. GESTIÓN DE FACTORES DE CORRECCIÓN (kpol, ks, kelec, kplastic)
   --------------------------------------------------------- */
function setupFactorToggle(checkboxId, cardSelector) {
  const checkbox = document.getElementById(checkboxId);
  const card = document.querySelector(cardSelector);
  checkbox.addEventListener("change", () => {
    card.classList.toggle("enabled", checkbox.checked);
    recomputeLiveFactors();
  });
}

function isFactorEnabled(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

/* k_pol = (|M+| + |M-|) / (2 * M_rutina)  — TRS-398 Ec. 2.13 — o valor introducido manualmente */
function calculateKpol() {
  const mode = document.querySelector('input[name="kpolMode"]:checked').value;
  if (mode === "manual") {
    const val = toNumber(document.getElementById("kpolManual").value);
    document.getElementById("kpolValue").textContent = isValidNumber(val) ? fmt(val) : "—";
    return val;
  }
  const mPos = toNumber(document.getElementById("mPos").value);
  const mNeg = toNumber(document.getElementById("mNeg").value);
  const mRutina = toNumber(document.getElementById("mRutina").value);
  if (!isValidNumber(mPos) || !isValidNumber(mNeg) || !isValidNumber(mRutina) || mRutina === 0) {
    document.getElementById("kpolValue").textContent = "—";
    return NaN;
  }
  const kpol = (Math.abs(mPos) + Math.abs(mNeg)) / (2 * mRutina);
  document.getElementById("kpolValue").textContent = fmt(kpol);
  return kpol;
}

/* k_s: manual, o por método de dos voltajes con polinomio editable (coeficientes NO se inventan, los introduce el usuario) */
function calculateKs() {
  const mode = document.querySelector('input[name="ksMode"]:checked').value;
  if (mode === "manual") {
    const val = toNumber(document.getElementById("ksManual").value);
    document.getElementById("ksValue").textContent = isValidNumber(val) ? fmt(val) : "—";
    return val;
  } else {
    const M1 = toNumber(document.getElementById("ksM1").value);
    const M2 = toNumber(document.getElementById("ksM2").value);
    const a0 = toNumber(document.getElementById("ksA0").value);
    const a1 = toNumber(document.getElementById("ksA1").value);
    const a2 = toNumber(document.getElementById("ksA2").value);
    if (![M1, M2, a0, a1, a2].every(isValidNumber) || M2 === 0) {
      document.getElementById("ksValue").textContent = "—";
      return NaN;
    }
    const ratio = M1 / M2;
    const ks = a0 + a1 * ratio + a2 * Math.pow(ratio, 2);
    document.getElementById("ksValue").textContent = fmt(ks);
    return ks;
  }
}

function recomputeLiveFactors() {
  calculateKTP();
  calculateKpol();
  calculateKs();
  updateKQFromTPR();
}

/* ---------------------------------------------------------
   6. TABLA EDITABLE E INTERPOLACIÓN DE kQ,Q0
   --------------------------------------------------------- */
function renderKQTable() {
  const body = document.getElementById("kqTableBody");
  body.innerHTML = "";
  state.kqTable.forEach((row, idx) => {
    const tr = document.createElement("tr");

    const tdTpr = document.createElement("td");
    const inputTpr = document.createElement("input");
    inputTpr.type = "number";
    inputTpr.step = "any";
    inputTpr.className = "input-field";
    inputTpr.value = row.tpr === null ? "" : row.tpr;
    inputTpr.addEventListener("input", (e) => {
      row.tpr = e.target.value === "" ? null : toNumber(e.target.value);
      updateKQFromTPR();
    });
    tdTpr.appendChild(inputTpr);
    tr.appendChild(tdTpr);

    const tdKq = document.createElement("td");
    const inputKq = document.createElement("input");
    inputKq.type = "number";
    inputKq.step = "any";
    inputKq.className = "input-field";
    inputKq.value = row.kq === null ? "" : row.kq;
    inputKq.addEventListener("input", (e) => {
      row.kq = e.target.value === "" ? null : toNumber(e.target.value);
      updateKQFromTPR();
    });
    tdKq.appendChild(inputKq);
    tr.appendChild(tdKq);

    const tdRemove = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-icon-remove";
    btn.textContent = "Eliminar";
    btn.addEventListener("click", () => {
      state.kqTable.splice(idx, 1);
      renderKQTable();
      updateKQFromTPR();
    });
    tdRemove.appendChild(btn);
    tr.appendChild(tdRemove);

    body.appendChild(tr);
  });
}

function addKQRow() {
  state.kqTable.push({ tpr: null, kq: null });
  renderKQTable();
}

/* Interpolación lineal de kQ,Q0 a partir de la tabla TPR20,10 -> kQ,Q0 */
function interpolateKQ(tpr, table) {
  const validRows = table
    .filter(r => isValidNumber(r.tpr) && isValidNumber(r.kq))
    .sort((a, b) => a.tpr - b.tpr);

  if (!isValidNumber(tpr) || validRows.length < 2) {
    return { ok: false, reason: "insufficient_data" };
  }

  // Coincidencia exacta
  const exact = validRows.find(r => r.tpr === tpr);
  if (exact) {
    return { ok: true, exact: true, kq: exact.kq, p1: exact, p2: exact };
  }

  if (tpr < validRows[0].tpr || tpr > validRows[validRows.length - 1].tpr) {
    return { ok: false, reason: "out_of_range", min: validRows[0].tpr, max: validRows[validRows.length - 1].tpr };
  }

  for (let i = 0; i < validRows.length - 1; i++) {
    const p1 = validRows[i];
    const p2 = validRows[i + 1];
    if (tpr >= p1.tpr && tpr <= p2.tpr) {
      const kq = p1.kq + ((tpr - p1.tpr) / (p2.tpr - p1.tpr)) * (p2.kq - p1.kq);
      return { ok: true, exact: false, kq, p1, p2 };
    }
  }
  return { ok: false, reason: "unexpected" };
}

function updateKQFromTPR() {
  const mode = document.querySelector('input[name="kqMode"]:checked').value;
  const detailBox = document.getElementById("interpDetail");
  const kqValueBox = document.getElementById("kqValue");

  if (mode === "manual") {
    const val = toNumber(document.getElementById("kqManualValor").value);
    kqValueBox.textContent = isValidNumber(val) ? fmt(val) : "—";
    return isValidNumber(val) ? val : NaN;
  }

  const tpr = toNumber(document.getElementById("tpr2010").value);
  const result = interpolateKQ(tpr, state.kqTable);

  if (!result.ok) {
    kqValueBox.textContent = "—";
    if (result.reason === "insufficient_data") {
      detailBox.innerHTML = "<p>Complete al menos dos puntos válidos de la tabla y el TPR<sub>20,10</sub> medido para calcular k<sub>Q,Q0</sub> por interpolación.</p>";
    } else if (result.reason === "out_of_range") {
      detailBox.innerHTML = `<p style="color:var(--color-warning)">El TPR<sub>20,10</sub> = ${fmt(tpr,3)} está fuera del intervalo de la tabla introducida [${fmt(result.min,3)} , ${fmt(result.max,3)}]. No se realizará extrapolación automática. Introduzca más puntos de la tabla TRS-398 o use el modo manual.</p>`;
    }
    return NaN;
  }

  if (result.exact) {
    detailBox.innerHTML = `<p>TPR<sub>20,10</sub> = ${fmt(tpr,3)} coincide exactamente con un punto de la tabla.<br><b>k<sub>Q,Q0</sub> = ${fmt(result.kq)}</b></p>`;
  } else {
    detailBox.innerHTML =
      `TPR<sub>20,10</sub> = ${fmt(tpr,3)}<br>` +
      `Punto inferior: TPR = ${fmt(result.p1.tpr,3)} &nbsp;→&nbsp; k<sub>Q,Q0</sub> = ${fmt(result.p1.kq)}<br>` +
      `Punto superior: TPR = ${fmt(result.p2.tpr,3)} &nbsp;→&nbsp; k<sub>Q,Q0</sub> = ${fmt(result.p2.kq)}<br><br>` +
      `k<sub>Q,Q0</sub> = ${fmt(result.p1.kq)} + (${fmt(tpr,3)} − ${fmt(result.p1.tpr,3)}) / (${fmt(result.p2.tpr,3)} − ${fmt(result.p1.tpr,3)}) × (${fmt(result.p2.kq)} − ${fmt(result.p1.kq)})<br>` +
      `<b>k<sub>Q,Q0</sub> = ${fmt(result.kq)}</b>`;
  }
  kqValueBox.textContent = fmt(result.kq);
  return result.kq;
}

/* ---------------------------------------------------------
   7. VALIDACIÓN DE DATOS
   --------------------------------------------------------- */
function validateAll() {
  const warnings = [];

  const validReadings = getValidReadings();
  if (validReadings.length === 0) warnings.push("No se ha introducido ninguna lectura de la cámara (M).");

  const T = document.getElementById("tMed").value;
  const P = document.getElementById("pMed").value;
  if (T === "") warnings.push("Falta introducir la temperatura medida.");
  if (P === "") warnings.push("Falta introducir la presión medida.");
  if (toNumber(P) <= 0 && P !== "") warnings.push("La presión medida debe ser un valor positivo.");

  const ndw = toNumber(document.getElementById("ndw").value);
  if (!isValidNumber(ndw) || ndw <= 0) warnings.push("Falta introducir un valor válido de N_D,w.");

  if (isFactorEnabled("usar_kpol")) {
    const kpol = calculateKpol();
    if (!isValidNumber(kpol)) warnings.push("k_pol está activado pero faltan datos para calcularlo (M+, M- o M rutina).");
    else if (kpol < 0.98 || kpol > 1.02) warnings.push("k_pol está fuera del rango típico (0.98–1.02). Verifique las lecturas de polaridad.");
  }

  if (isFactorEnabled("usar_ks")) {
    const ks = calculateKs();
    if (!isValidNumber(ks)) warnings.push("k_s está activado pero faltan datos para calcularlo.");
    else if (ks < 1.0 || ks > 1.05) warnings.push("k_s está fuera del rango típico (1.00–1.05). Verifique los datos de recombinación.");
  }

  if (isFactorEnabled("usar_kelec")) {
    const v = toNumber(document.getElementById("kelecValor").value);
    if (!isValidNumber(v)) warnings.push("k_elec está activado pero no se ha introducido su valor.");
  }

  if (isFactorEnabled("usar_kplastic")) {
    const v = toNumber(document.getElementById("kplasticValor").value);
    if (!isValidNumber(v)) warnings.push("k_plastic está activado pero no se ha introducido su valor.");
  }

  const tpr = toNumber(document.getElementById("tpr2010").value);
  const kqMode = document.querySelector('input[name="kqMode"]:checked').value;
  if (kqMode === "interp") {
    if (!isValidNumber(tpr)) warnings.push("Falta introducir el TPR20,10 medido.");
    const result = interpolateKQ(tpr, state.kqTable);
    if (!result.ok) {
      if (result.reason === "insufficient_data") warnings.push("La tabla de interpolación TPR20,10 → kQ,Q0 tiene menos de dos puntos válidos.");
      if (result.reason === "out_of_range") warnings.push(`El valor de TPR20,10 (${fmt(tpr,3)}) se encuentra fuera del intervalo de la tabla introducida. No se realizará extrapolación.`);
    }
  } else {
    const kqManual = toNumber(document.getElementById("kqManualValor").value);
    if (!isValidNumber(kqManual)) warnings.push("Falta introducir manualmente el valor de kQ,Q0.");
  }

  const tipoCamara = document.getElementById("tipoCamara").value;
  if (!tipoCamara) warnings.push("No se ha indicado el tipo de cámara (afecta la tabla de kQ,Q0 a utilizar: cilíndrica o plano-paralela).");

  return warnings;
}

function renderWarnings(warnings) {
  const box = document.getElementById("warningsBox");
  box.innerHTML = "";
  if (warnings.length === 0) {
    box.innerHTML = '<p class="no-warnings">Sin advertencias.</p>';
    return;
  }
  warnings.forEach(w => {
    const div = document.createElement("div");
    div.className = "warning-item";
    div.textContent = "⚠ " + w;
    box.appendChild(div);
  });
}

/* ---------------------------------------------------------
   8. CÁLCULO PRINCIPAL DE LA DOSIS Y TRAZABILIDAD
   --------------------------------------------------------- */
let lastResult = null;

function calcularDosis() {
  const warnings = validateAll();
  renderWarnings(warnings);

  const stats = updateReadingsStats();
  const M = stats.mean;

  const kTP = calculateKTP();
  const kpol = isFactorEnabled("usar_kpol") ? calculateKpol() : 1;
  const ks = isFactorEnabled("usar_ks") ? calculateKs() : 1;
  const kelec = isFactorEnabled("usar_kelec") ? toNumber(document.getElementById("kelecValor").value) : 1;
  const kplastic = isFactorEnabled("usar_kplastic") ? toNumber(document.getElementById("kplasticValor").value) : 1;

  const ndw = toNumber(document.getElementById("ndw").value);
  const kQ = updateKQFromTPR();

  const factorsForCheck = [
    { name: "M (promedio)", value: M },
    { name: "kTP", value: kTP },
    { name: "N_D,w", value: ndw },
    { name: "kQ,Q0", value: kQ }
  ];
  if (isFactorEnabled("usar_kpol")) factorsForCheck.push({ name: "kpol", value: kpol });
  if (isFactorEnabled("usar_ks")) factorsForCheck.push({ name: "ks", value: ks });
  if (isFactorEnabled("usar_kelec")) factorsForCheck.push({ name: "kelec", value: kelec });
  if (isFactorEnabled("usar_kplastic")) factorsForCheck.push({ name: "kplastic", value: kplastic });

  const missing = factorsForCheck.filter(f => !isValidNumber(f.value));
  if (missing.length > 0) {
    document.getElementById("doseResultValue").textContent = "— Gy";
    document.getElementById("calcTrace").innerHTML =
      "<li>No fue posible completar el cálculo. Faltan o son inválidos los siguientes valores: <b>" +
      missing.map(f => f.name).join(", ") + "</b>.</li>";
    updateResultsGrid({ M, kTP, kpol, ks, kelec, kplastic, ndw, kQ, MQ: NaN, dose: NaN });
    return;
  }

  const MQ = M * kTP * kpol * ks * kelec * kplastic;
  const dose = MQ * ndw * kQ;

  lastResult = { M, kTP, kpol, ks, kelec, kplastic, ndw, kQ, MQ, dose,
    tpr: toNumber(document.getElementById("tpr2010").value),
    n: stats.n, stdev: stats.stdev, uA: stats.uA };

  document.getElementById("doseResultValue").textContent = fmt(dose, 5) + " Gy";
  updateResultsGrid(lastResult);
  renderCalcTrace(lastResult);
}

function updateResultsGrid(r) {
  document.getElementById("r_M").textContent = fmt(r.M);
  document.getElementById("r_kTP").textContent = fmt(r.kTP);
  document.getElementById("r_kpol").textContent = fmt(r.kpol);
  document.getElementById("r_ks").textContent = fmt(r.ks);
  document.getElementById("r_kelec").textContent = fmt(r.kelec);
  document.getElementById("r_kplastic").textContent = fmt(r.kplastic);
  document.getElementById("r_MQ").textContent = fmt(r.MQ);
  document.getElementById("r_NDw").textContent = isValidNumber(r.ndw) ? fmtSci(r.ndw, 5) : "—";
  document.getElementById("r_tpr").textContent = isValidNumber(r.tpr) ? fmt(r.tpr, 3) : "—";
  document.getElementById("r_kQ").textContent = fmt(r.kQ);
}

function renderCalcTrace(r) {
  const steps = [
    `<b>1. Lectura inicial:</b> n = ${r.n} lecturas válidas, M̄ = ${fmt(r.M)} (s = ${fmt(r.stdev)}, incert. tipo A = ${isValidNumber(r.uA) ? r.uA.toFixed(3) + " %" : "n/a"}).`,
    `<b>2. Corrección de temperatura y presión:</b> kTP = ${fmt(r.kTP)}.`,
    `<b>3. Corrección por polaridad:</b> kpol = ${fmt(r.kpol)} ${isFactorEnabled("usar_kpol") ? "(aplicada)" : "(no aplicada, = 1)"}.`,
    `<b>4. Corrección por recombinación:</b> ks = ${fmt(r.ks)} ${isFactorEnabled("usar_ks") ? "(aplicada)" : "(no aplicada, = 1)"}.`,
    `<b>5. Corrección del electrómetro:</b> kelec = ${fmt(r.kelec)} ${isFactorEnabled("usar_kelec") ? "(aplicada)" : "(no aplicada, = 1)"}.`,
    `<b>6. Otras correcciones:</b> kplastic = ${fmt(r.kplastic)} ${isFactorEnabled("usar_kplastic") ? "(aplicada)" : "(no aplicada, = 1)"}.`,
    `<b>7. Lectura corregida:</b> MQ = M̄ × kTP × kpol × ks × kelec × kplastic = ${fmt(r.MQ)}.`,
    `<b>8. Obtención de kQ,Q0:</b> TPR20,10 = ${isValidNumber(r.tpr) ? fmt(r.tpr,3) : "n/a"} → kQ,Q0 = ${fmt(r.kQ)}.`,
    `<b>9. Aplicación de N_D,w:</b> N_D,w = ${isValidNumber(r.ndw) ? fmtSci(r.ndw) : "n/a"}.`,
    `<b>10. Resultado final:</b> Dw,Q = MQ × N_D,w × kQ,Q0 = ${isValidNumber(r.dose) ? fmt(r.dose, 5) + " Gy" : "no calculado"}.`
  ];
  document.getElementById("calcTrace").innerHTML = steps.map(s => `<li>${s}</li>`).join("");
}

/* ---------------------------------------------------------
   9. EXPORTACIÓN (CSV, TXT, IMPRESIÓN)
   --------------------------------------------------------- */
function buildReportLines() {
  const lines = [];
  lines.push("REPORTE DE DOSIMETRIA - TRS-398 (IAEA)");
  lines.push("Fecha de generacion: " + new Date().toLocaleString());
  lines.push("");
  lines.push("-- A. Informacion general --");
  lines.push("Operador: " + document.getElementById("operador").value);
  lines.push("Institucion: " + document.getElementById("institucion").value);
  lines.push("Fecha de medicion: " + document.getElementById("fechaMedicion").value);
  lines.push("Acelerador: " + document.getElementById("acelerador").value);
  lines.push("Tipo de haz: Fotones (acelerador lineal)");
  lines.push("Energia nominal: " + document.getElementById("energiaNominal").value + " MV");
  lines.push("");
  lines.push("-- C. Datos de la camara --");
  lines.push("Fabricante: " + document.getElementById("fabricante").value);
  lines.push("Modelo: " + document.getElementById("modeloCamara").value);
  lines.push("Numero de serie: " + document.getElementById("numSerie").value);
  lines.push("Tipo de camara: " + document.getElementById("tipoCamara").value);
  lines.push("Fecha de calibracion: " + document.getElementById("fechaCalibracion").value);
  lines.push("Laboratorio de calibracion: " + document.getElementById("labCalibracion").value);
  lines.push("N_D,w: " + document.getElementById("ndw").value + " " + document.getElementById("ndwUnidad").value);
  lines.push("");
  lines.push("-- D. Lecturas --");
  state.readings.forEach((v, i) => lines.push("M" + (i + 1) + " = " + (v === null ? "" : v)));
  lines.push("");
  if (lastResult) {
    lines.push("-- Factores de correccion y resultado --");
    lines.push("kTP = " + fmt(lastResult.kTP));
    lines.push("kpol = " + fmt(lastResult.kpol));
    lines.push("ks = " + fmt(lastResult.ks));
    lines.push("kelec = " + fmt(lastResult.kelec));
    lines.push("kplastic = " + fmt(lastResult.kplastic));
    lines.push("TPR20,10 = " + fmt(lastResult.tpr, 3));
    lines.push("kQ,Q0 = " + fmt(lastResult.kQ));
    lines.push("MQ = " + fmt(lastResult.MQ));
    lines.push("");
    lines.push("DOSIS ABSORBIDA EN AGUA: Dw,Q = " + fmt(lastResult.dose, 5) + " Gy");
  } else {
    lines.push("(El calculo aun no se ha ejecutado)");
  }
  return lines;
}

function exportTXT() {
  const content = buildReportLines().join("\n");
  downloadFile(content, "reporte_TRS398.txt", "text/plain");
}

function exportCSV() {
  const lines = buildReportLines();
  const csv = lines.map(l => {
    const idx = l.indexOf(": ");
    if (idx === -1) return '"' + l.replace(/"/g, '""') + '"';
    return '"' + l.slice(0, idx).replace(/"/g, '""') + '","' + l.slice(idx + 2).replace(/"/g, '""') + '"';
  }).join("\n");
  downloadFile(csv, "reporte_TRS398.csv", "text/csv");
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------
   10. AYUDAS CONTEXTUALES (TOOLTIPS)
   --------------------------------------------------------- */
function setupTooltips() {
  const popup = document.getElementById("tooltipPopup");
  document.querySelectorAll(".help-icon").forEach(icon => {
    icon.addEventListener("mouseenter", (e) => {
      popup.textContent = icon.getAttribute("data-tip");
      popup.style.display = "block";
      positionTooltip(e, popup);
    });
    icon.addEventListener("mousemove", (e) => positionTooltip(e, popup));
    icon.addEventListener("mouseleave", () => { popup.style.display = "none"; });
    icon.addEventListener("click", (e) => {
      e.preventDefault();
      popup.textContent = icon.getAttribute("data-tip");
      popup.style.display = popup.style.display === "block" ? "none" : "block";
      positionTooltip(e, popup);
    });
  });
}
function positionTooltip(e, popup) {
  const x = Math.min(e.clientX + 14, window.innerWidth - 300);
  const y = Math.min(e.clientY + 14, window.innerHeight - 100);
  popup.style.left = x + "px";
  popup.style.top = y + "px";
}

/* ---------------------------------------------------------
   11. INICIALIZACIÓN
   --------------------------------------------------------- */
function limpiarFormulario() {
  document.querySelectorAll("input[type=text], input[type=number], input[type=date]").forEach(el => el.value = "");
  document.querySelectorAll("select").forEach(el => el.selectedIndex = 0);
  document.querySelectorAll('input[type=checkbox]').forEach(el => { el.checked = false; });
  document.querySelectorAll(".factor-card").forEach(c => c.classList.remove("enabled"));
  document.getElementById("tCal").value = "20";
  document.getElementById("pCal").value = "101.3";
  state.readings = [null, null];
  renderReadingsTable();
  updateReadingsStats();
  document.getElementById("doseResultValue").textContent = "— Gy";
  document.getElementById("calcTrace").innerHTML = '<li>Presione "CALCULAR DOSIS" para generar el detalle paso a paso.</li>';
  renderWarnings([]);
  ["ktpValue", "kpolValue", "ksValue", "kqValue"].forEach(id => document.getElementById(id).textContent = "—");
  updateResultsGrid({ M: NaN, kTP: NaN, kpol: NaN, ks: NaN, kelec: NaN, kplastic: NaN, ndw: NaN, tpr: NaN, kQ: NaN, MQ: NaN });
  lastResult = null;
}

function reiniciarAplicacion() {
  limpiarFormulario();
  state.kqTable = [{ tpr: null, kq: null }, { tpr: null, kq: null }];
  renderKQTable();
  document.querySelector('input[name="kqMode"][value="interp"]').checked = true;
  document.querySelector('input[name="ksMode"][value="manual"]').checked = true;
  document.querySelector('input[name="kpolMode"][value="calc"]').checked = true;
  document.getElementById("kpolCalcBlock").classList.remove("hidden-block");
  document.getElementById("kpolManualBlock").classList.add("hidden-block");
  document.getElementById("ksManualBlock").classList.remove("hidden-block");
  document.getElementById("ksDosVoltBlock").classList.add("hidden-block");
  document.getElementById("kqInterpBlock").classList.remove("hidden-block");
  document.getElementById("kqManualBlock").classList.add("hidden-block");
  document.getElementById("interpDetail").innerHTML = "<p>Introduzca el TPR20,10 en la sección G y complete la tabla para ver el detalle de la interpolación.</p>";
}

function initEventListeners() {
  document.getElementById("btnAddReading").addEventListener("click", addReading);
  document.getElementById("btnAddKQRow").addEventListener("click", addKQRow);

  ["tMed", "tCal", "pMed", "pCal", "tMedUnidad", "tCalUnidad", "pMedUnidad", "pCalUnidad"]
    .forEach(id => document.getElementById(id).addEventListener("input", calculateKTP));
  ["tMedUnidad", "tCalUnidad", "pMedUnidad", "pCalUnidad"]
    .forEach(id => document.getElementById(id).addEventListener("change", calculateKTP));

  setupFactorToggle("usar_kpol", '[data-factor="kpol"]');
  setupFactorToggle("usar_ks", '[data-factor="ks"]');
  setupFactorToggle("usar_kelec", '[data-factor="kelec"]');
  setupFactorToggle("usar_kplastic", '[data-factor="kplastic"]');

  ["mPos", "mNeg", "mRutina", "kpolManual"].forEach(id => document.getElementById(id).addEventListener("input", calculateKpol));
  ["ksManual", "ksM1", "ksM2", "ksA0", "ksA1", "ksA2"].forEach(id => document.getElementById(id).addEventListener("input", calculateKs));

  document.querySelectorAll('input[name="kpolMode"]').forEach(radio => {
    radio.addEventListener("change", () => {
      const mode = document.querySelector('input[name="kpolMode"]:checked').value;
      document.getElementById("kpolCalcBlock").classList.toggle("hidden-block", mode !== "calc");
      document.getElementById("kpolManualBlock").classList.toggle("hidden-block", mode !== "manual");
      calculateKpol();
    });
  });

  document.querySelectorAll('input[name="ksMode"]').forEach(radio => {
    radio.addEventListener("change", () => {
      const mode = document.querySelector('input[name="ksMode"]:checked').value;
      document.getElementById("ksManualBlock").classList.toggle("hidden-block", mode !== "manual");
      document.getElementById("ksDosVoltBlock").classList.toggle("hidden-block", mode !== "dosvolt");
      calculateKs();
    });
  });

  document.querySelectorAll('input[name="kqMode"]').forEach(radio => {
    radio.addEventListener("change", () => {
      const mode = document.querySelector('input[name="kqMode"]:checked').value;
      document.getElementById("kqInterpBlock").classList.toggle("hidden-block", mode !== "interp");
      document.getElementById("kqManualBlock").classList.toggle("hidden-block", mode !== "manual");
      updateKQFromTPR();
    });
  });

  document.getElementById("tpr2010").addEventListener("input", updateKQFromTPR);
  document.getElementById("kqManualValor").addEventListener("input", updateKQFromTPR);

  document.getElementById("btnCalcular").addEventListener("click", calcularDosis);
  document.getElementById("btnLimpiar").addEventListener("click", limpiarFormulario);
  document.getElementById("btnReiniciar").addEventListener("click", reiniciarAplicacion);
  document.getElementById("btnExportCSV").addEventListener("click", exportCSV);
  document.getElementById("btnExportTXT").addEventListener("click", exportTXT);
  document.getElementById("btnImprimir").addEventListener("click", () => window.print());
}

function init() {
  renderReadingsTable();
  updateReadingsStats();
  state.kqTable = [{ tpr: null, kq: null }, { tpr: null, kq: null }];
  renderKQTable();
  initEventListeners();
  setupTooltips();
  calculateKTP();
}

document.addEventListener("DOMContentLoaded", init);
