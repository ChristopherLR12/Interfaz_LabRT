/* =========================================================
   Calculadora de Dosis Absorbida en Agua — TRS-398 (IAEA)
   Lógica de la aplicación (JavaScript vanilla, sin dependencias)
   ========================================================= */

/* ---------------------------------------------------------
   BD OFICIAL kQ,Q0 TRS-398 (CUADRO 14 - HACES DE FOTONES)
   --------------------------------------------------------- */
const TRS398_TPR_AXIS = [
  0.50, 0.53, 0.56, 0.59, 0.62, 0.65, 0.68, 0.70, 0.72, 0.74, 0.76, 0.78, 0.80, 0.82, 0.84
];

const TRS398_CHAMBERS = {
  "Capintec": {
    "PR-05P mini": [1.004, 1.003, 1.002, 1.001, 1.000, 0.998, 0.996, 0.994, 0.991, 0.987, 0.983, 0.975, 0.968, 0.960, 0.949],
    "PR-05 mini": [1.004, 1.003, 1.002, 1.001, 1.000, 0.998, 0.996, 0.994, 0.991, 0.987, 0.983, 0.975, 0.968, 0.960, 0.949],
    "PR-06C/G Farmer": [1.001, 1.001, 1.000, 0.998, 0.998, 0.995, 0.992, 0.990, 0.988, 0.984, 0.980, 0.972, 0.965, 0.956, 0.944]
  },
  "Exradin": {
    "A2 Spokas": [1.001, 1.001, 1.001, 1.000, 0.999, 0.997, 0.996, 0.994, 0.992, 0.989, 0.986, 0.979, 0.971, 0.962, 0.949],
    "T2 Spokas": [1.002, 1.001, 0.999, 0.996, 0.993, 0.988, 0.984, 0.980, 0.977, 0.973, 0.969, 0.962, 0.954, 0.946, 0.934],
    "A1 mini Shonka": [1.002, 1.002, 1.001, 1.000, 1.000, 0.998, 0.996, 0.994, 0.991, 0.986, 0.982, 0.974, 0.966, 0.957, 0.945],
    "T1 mini Shonka": [1.003, 1.001, 0.999, 0.996, 0.993, 0.988, 0.984, 0.980, 0.975, 0.970, 0.965, 0.957, 0.949, 0.942, 0.930],
    "A12 Farmer": [1.001, 1.001, 1.000, 1.000, 0.999, 0.997, 0.994, 0.992, 0.990, 0.986, 0.981, 0.974, 0.966, 0.957, 0.944]
  },
  "Far West Tech.": {
    "1C-18": [1.005, 1.003, 1.000, 0.997, 0.993, 0.988, 0.983, 0.979, 0.976, 0.971, 0.966, 0.959, 0.953, 0.945, 0.934]
  },
  "FZH": {
    "TK01": [1.002, 1.001, 1.000, 0.998, 0.996, 0.993, 0.990, 0.987, 0.984, 0.980, 0.975, 0.968, 0.960, 0.952, 0.939]
  },
  "Nuclear Assoc.": {
    "30-750": [1.001, 1.001, 1.000, 0.999, 0.998, 0.996, 0.994, 0.991, 0.988, 0.984, 0.979, 0.971, 0.963, 0.954, 0.941],
    "30-749 Farmer shortened": [1.001, 1.000, 1.000, 0.999, 0.998, 0.996, 0.994, 0.992, 0.989, 0.984, 0.980, 0.972, 0.964, 0.956, 0.942],
    "30-744 Farmer": [1.001, 1.000, 1.000, 0.999, 0.998, 0.996, 0.994, 0.992, 0.989, 0.984, 0.980, 0.972, 0.964, 0.956, 0.942],
    "30-716 Farmer": [1.001, 1.000, 1.000, 0.999, 0.998, 0.996, 0.994, 0.992, 0.989, 0.984, 0.980, 0.972, 0.964, 0.956, 0.942],
    "30-753": [1.001, 1.000, 1.000, 0.999, 0.998, 0.996, 0.994, 0.992, 0.989, 0.985, 0.980, 0.973, 0.965, 0.956, 0.943],
    "30-751": [1.002, 1.002, 1.000, 0.999, 0.997, 0.994, 0.991, 0.989, 0.985, 0.981, 0.977, 0.969, 0.961, 0.953, 0.940],
    "30-752 Farmer": [1.004, 1.003, 1.001, 1.000, 0.998, 0.996, 0.993, 0.991, 0.989, 0.985, 0.981, 0.974, 0.967, 0.959, 0.947]
  },
  "NE": {
    "2515": [1.001, 1.001, 1.000, 0.999, 0.997, 0.994, 0.991, 0.988, 0.984, 0.980, 0.975, 0.967, 0.959, 0.950, 0.937],
    "2515/3": [1.005, 1.004, 1.002, 1.000, 0.998, 0.995, 0.993, 0.991, 0.989, 0.986, 0.982, 0.975, 0.969, 0.961, 0.949],
    "2577": [1.005, 1.004, 1.002, 1.000, 0.998, 0.995, 0.993, 0.991, 0.989, 0.986, 0.982, 0.975, 0.969, 0.961, 0.949],
    "2505 Farmer": [1.001, 1.001, 1.000, 0.999, 0.997, 0.994, 0.991, 0.988, 0.984, 0.980, 0.975, 0.967, 0.959, 0.950, 0.937],
    "2505/A Farmer": [1.005, 1.003, 1.001, 0.997, 0.995, 0.990, 0.985, 0.982, 0.978, 0.974, 0.969, 0.962, 0.955, 0.947, 0.936],
    "2505/3, 3A Farmer": [1.005, 1.004, 1.002, 1.000, 0.998, 0.995, 0.993, 0.991, 0.989, 0.986, 0.982, 0.975, 0.969, 0.961, 0.949],
    "2505/3, 3B Farmer": [1.006, 1.004, 1.001, 0.999, 0.996, 0.991, 0.987, 0.984, 0.980, 0.976, 0.971, 0.964, 0.957, 0.950, 0.938],
    "2571 Farmer": [1.005, 1.004, 1.002, 1.000, 0.998, 0.995, 0.993, 0.991, 0.989, 0.986, 0.982, 0.975, 0.969, 0.961, 0.949],
    "2581 Farmer": [1.005, 1.003, 1.001, 0.998, 0.995, 0.991, 0.986, 0.983, 0.980, 0.975, 0.970, 0.963, 0.956, 0.949, 0.937],
    "2561/2611 Sec. Std": [1.006, 1.004, 1.001, 0.999, 0.998, 0.994, 0.992, 0.990, 0.988, 0.985, 0.982, 0.975, 0.969, 0.961, 0.949]
  },
  "PTW": {
    "23323 micro": [1.003, 1.003, 1.000, 0.999, 0.997, 0.993, 0.990, 0.987, 0.984, 0.980, 0.975, 0.967, 0.960, 0.953, 0.941],
    "23331 rigid": [1.004, 1.003, 1.000, 0.999, 0.997, 0.993, 0.990, 0.988, 0.985, 0.982, 0.978, 0.971, 0.964, 0.956, 0.945],
    "23332 rigid": [1.004, 1.003, 1.001, 0.999, 0.997, 0.994, 0.990, 0.988, 0.984, 0.980, 0.976, 0.968, 0.961, 0.954, 0.943],
    "23333": [1.004, 1.003, 1.001, 0.999, 0.997, 0.994, 0.990, 0.988, 0.985, 0.981, 0.976, 0.969, 0.963, 0.955, 0.943],
    "30001 / 30010 Farmer": [1.004, 1.003, 1.001, 0.999, 0.997, 0.994, 0.990, 0.988, 0.985, 0.981, 0.976, 0.969, 0.962, 0.955, 0.943],
    "30002 / 30011 Farmer": [1.006, 1.004, 1.001, 0.999, 0.997, 0.994, 0.992, 0.990, 0.987, 0.984, 0.980, 0.973, 0.967, 0.959, 0.948],
    "30004 / 30012 Farmer": [1.006, 1.005, 1.002, 1.000, 0.999, 0.996, 0.994, 0.992, 0.989, 0.986, 0.982, 0.976, 0.969, 0.962, 0.950],
    "30006 / 30013 Farmer": [1.002, 1.002, 1.000, 0.999, 0.997, 0.994, 0.990, 0.988, 0.984, 0.980, 0.975, 0.968, 0.960, 0.952, 0.940],
    "31002 flexible": [1.003, 1.002, 1.000, 0.999, 0.997, 0.994, 0.990, 0.988, 0.984, 0.980, 0.975, 0.968, 0.960, 0.952, 0.940],
    "31003 flexible": [1.003, 1.002, 1.000, 0.999, 0.997, 0.994, 0.990, 0.988, 0.984, 0.980, 0.975, 0.968, 0.960, 0.952, 0.940]
  },
  "SNC": {
    "100730 Farmer": [1.004, 1.003, 1.001, 0.999, 0.997, 0.993, 0.990, 0.988, 0.985, 0.981, 0.977, 0.970, 0.963, 0.956, 0.944],
    "100740 Farmer": [1.006, 1.005, 1.002, 1.000, 0.999, 0.996, 0.994, 0.992, 0.990, 0.987, 0.983, 0.977, 0.971, 0.963, 0.951]
  },
  "Victoreen": {
    "Radocon III 550": [1.005, 1.004, 1.001, 0.998, 0.996, 0.993, 0.989, 0.986, 0.983, 0.979, 0.975, 0.968, 0.961, 0.954, 0.943],
    "Radocon II 555": [1.005, 1.003, 1.000, 0.997, 0.995, 0.990, 0.986, 0.983, 0.979, 0.975, 0.970, 0.963, 0.956, 0.949, 0.938],
    "30-348": [1.004, 1.003, 1.000, 0.998, 0.996, 0.992, 0.989, 0.986, 0.982, 0.978, 0.973, 0.966, 0.959, 0.951, 0.940],
    "30-351": [1.004, 1.002, 1.000, 0.998, 0.996, 0.992, 0.989, 0.986, 0.983, 0.979, 0.974, 0.967, 0.960, 0.952, 0.941],
    "30-349": [1.003, 1.002, 1.000, 0.998, 0.996, 0.992, 0.989, 0.986, 0.983, 0.980, 0.976, 0.969, 0.962, 0.954, 0.942],
    "30-361": [1.004, 1.003, 1.000, 0.998, 0.996, 0.992, 0.989, 0.986, 0.983, 0.979, 0.974, 0.967, 0.960, 0.953, 0.942]
  },
  "Scanditronix-Wellhöfer": {
    "IC 05": [1.001, 1.000, 1.000, 0.999, 0.998, 0.996, 0.994, 0.992, 0.989, 0.984, 0.980, 0.972, 0.964, 0.956, 0.942],
    "IC 06": [1.001, 1.000, 1.000, 0.999, 0.998, 0.996, 0.994, 0.992, 0.989, 0.984, 0.980, 0.972, 0.964, 0.956, 0.942],
    "IC 10": [1.001, 1.000, 1.000, 0.999, 0.998, 0.996, 0.994, 0.992, 0.989, 0.984, 0.980, 0.972, 0.964, 0.956, 0.942],
    "IC 15": [1.001, 1.000, 1.000, 0.999, 0.998, 0.996, 0.994, 0.992, 0.989, 0.984, 0.980, 0.972, 0.964, 0.956, 0.942],
    "IC 25": [1.001, 1.000, 1.000, 0.999, 0.998, 0.996, 0.994, 0.992, 0.989, 0.984, 0.980, 0.972, 0.964, 0.956, 0.942],
    "IC 28 Farmer shortened": [1.001, 1.000, 1.000, 0.999, 0.998, 0.996, 0.994, 0.992, 0.989, 0.985, 0.980, 0.973, 0.965, 0.956, 0.943],
    "IC 69 Farmer": [1.002, 1.002, 1.000, 0.999, 0.997, 0.994, 0.991, 0.989, 0.985, 0.981, 0.977, 0.969, 0.961, 0.953, 0.940],
    "IC 70 Farmer": [1.004, 1.003, 1.001, 1.000, 0.998, 0.996, 0.993, 0.991, 0.988, 0.985, 0.981, 0.974, 0.967, 0.959, 0.946]
  }
};

/* ---------------------------------------------------------
   1. ESTADO GLOBAL
   --------------------------------------------------------- */
const state = {
  readings: [null, null],
  pddUserEdited: false
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

function temperatureToCelsius(value, unit) {
  if (!isValidNumber(value)) return NaN;
  return unit === "K" ? value - 273.2 : value;
}

function pressureToKPa(value, unit) {
  if (!isValidNumber(value)) return NaN;
  if (unit === "kPa") return value;
  if (unit === "hPa") return value / 10;
  if (unit === "mbar") return value / 10;
  return NaN;
}

/* ---------------------------------------------------------
   3. GESTIÓN DE CÁMARAS Y DROPDOWNS SINCRONIZADOS
   --------------------------------------------------------- */
function populateManufacturerDropdowns() {
  const selectC = document.getElementById("fabricante");
  const selectH = document.getElementById("kqFabricante");

  selectC.innerHTML = '<option value="">-- Seleccionar Fabricante --</option>';
  selectH.innerHTML = '<option value="">-- Seleccionar Fabricante --</option>';

  Object.keys(TRS398_CHAMBERS).forEach(mfg => {
    const optC = document.createElement("option");
    optC.value = mfg;
    optC.textContent = mfg;
    selectC.appendChild(optC);

    const optH = document.createElement("option");
    optH.value = mfg;
    optH.textContent = mfg;
    selectH.appendChild(optH);
  });
}

function populateModelDropdown(mfg, targetSelectId) {
  const select = document.getElementById(targetSelectId);
  select.innerHTML = '<option value="">-- Seleccionar Modelo --</option>';

  if (mfg && TRS398_CHAMBERS[mfg]) {
    Object.keys(TRS398_CHAMBERS[mfg]).forEach(model => {
      const opt = document.createElement("option");
      opt.value = model;
      opt.textContent = model;
      select.appendChild(opt);
    });
  }
}

function syncChamberSelection(source) {
  if (source === "sectionC") {
    const mfg = document.getElementById("fabricante").value;
    populateModelDropdown(mfg, "modeloCamara");
    document.getElementById("kqFabricante").value = mfg;
    populateModelDropdown(mfg, "kqModelo");
    document.getElementById("modeloCamara").value = "";
    document.getElementById("kqModelo").value = "";
  } else if (source === "sectionC_model") {
    const model = document.getElementById("modeloCamara").value;
    document.getElementById("kqModelo").value = model;
  } else if (source === "sectionH") {
    const mfg = document.getElementById("kqFabricante").value;
    populateModelDropdown(mfg, "kqModelo");
    document.getElementById("fabricante").value = mfg;
    populateModelDropdown(mfg, "modeloCamara");
    document.getElementById("kqModelo").value = "";
    document.getElementById("modeloCamara").value = "";
  } else if (source === "sectionH_model") {
    const model = document.getElementById("kqModelo").value;
    document.getElementById("modeloCamara").value = model;
  }
  updateKQFromTPR();
}

/* ---------------------------------------------------------
   4. GESTIÓN DE LECTURAS DE LA CÁMARA
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
  const sem = stdev / Math.sqrt(n);
  const uA = mean !== 0 ? (sem / Math.abs(mean)) * 100 : NaN;
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
   5. CÁLCULO DE kTP
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
   6. GESTIÓN DE FACTORES DE CORRECCIÓN
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
   7. INTERPOLACIÓN LINEAL kQ,Q0 TRS-398
   --------------------------------------------------------- */
function updateKQFromTPR() {
  const mode = document.querySelector('input[name="kqMode"]:checked').value;
  const detailBox = document.getElementById("interpDetail");
  const kqValueBox = document.getElementById("kqValue");

  if (mode === "manual") {
    const val = toNumber(document.getElementById("kqManualValor").value);
    kqValueBox.textContent = isValidNumber(val) ? fmt(val) : "—";
    return isValidNumber(val) ? val : NaN;
  }

  const mfg = document.getElementById("kqFabricante").value;
  const model = document.getElementById("kqModelo").value;
  const tpr = toNumber(document.getElementById("tpr2010").value);

  if (!mfg || !model || !TRS398_CHAMBERS[mfg] || !TRS398_CHAMBERS[mfg][model]) {
    detailBox.innerHTML = "<p>Seleccione un fabricante y un modelo de cámara válidos para realizar la interpolación automática.</p>";
    kqValueBox.textContent = "—";
    return NaN;
  }

  if (!isValidNumber(tpr)) {
    detailBox.innerHTML = `<p><b>Cámara seleccionada:</b> ${mfg} ${model}<br>Introduzca el TPR<sub>20,10</sub> en la sección G para calcular k<sub>Q,Q0</sub>.</p>`;
    kqValueBox.textContent = "—";
    return NaN;
  }

  const values = TRS398_CHAMBERS[mfg][model];
  const axis = TRS398_TPR_AXIS;
  const minTPR = axis[0];
  const maxTPR = axis[axis.length - 1];

  // Verificación estricta de rango (NO EXTRAPOLAR)
  if (tpr < minTPR || tpr > maxTPR) {
    detailBox.innerHTML = `<p style="color:var(--color-warning)"><b>⚠ ADVERTENCIA DE RANGO:</b> El TPR<sub>20,10</sub> = ${fmt(tpr,3)} está fuera del intervalo oficial del TRS-398 [${minTPR.toFixed(2)} , ${maxTPR.toFixed(2)}]. NO se realiza extrapolación. Utilice el modo manual si dispone de datos válidos.</p>`;
    kqValueBox.textContent = "—";
    return NaN;
  }

  // Coincidencia exacta
  const exactIndex = axis.findIndex(v => Math.abs(v - tpr) < 1e-6);
  if (exactIndex !== -1) {
    const kqExact = values[exactIndex];
    detailBox.innerHTML =
      `<b>Cámara:</b> ${mfg} ${model}<br>` +
      `TPR<sub>20,10</sub> = ${fmt(tpr,3)} coincide exactamente con un punto de la tabla TRS-398.<br>` +
      `<b>Punto utilizado:</b> TPR<sub>20,10</sub> = ${axis[exactIndex].toFixed(2)} → k<sub>Q,Q0</sub> = ${fmt(kqExact, 3)}<br>` +
      `<b>k<sub>Q,Q0</sub> = ${fmt(kqExact, 4)}</b>`;
    kqValueBox.textContent = fmt(kqExact, 4);
    return kqExact;
  }

  // Búsqueda de intervalo para interpolación lineal
  let i = 0;
  while (i < axis.length - 1 && axis[i + 1] < tpr) {
    i++;
  }

  const x1 = axis[i];
  const x2 = axis[i + 1];
  const y1 = values[i];
  const y2 = values[i + 1];

  const kqInterp = y1 + ((tpr - x1) / (x2 - x1)) * (y2 - y1);

  detailBox.innerHTML =
    `<b>Cámara:</b> ${mfg} ${model}<br>` +
    `<b>TPR<sub>20,10</sub> introducido:</b> ${fmt(tpr,3)}<br>` +
    `<b>Puntos de la tabla utilizados para la interpolación:</b><br>` +
    `• Punto 1 (inferior): TPR<sub>20,10</sub> = ${x1.toFixed(2)} &nbsp;→&nbsp; k<sub>Q,Q0</sub> = ${y1.toFixed(3)}<br>` +
    `• Punto 2 (superior): TPR<sub>20,10</sub> = ${x2.toFixed(2)} &nbsp;→&nbsp; k<sub>Q,Q0</sub> = ${y2.toFixed(3)}<br><br>` +
    `$$k_{Q,Q_0} = ${y1.toFixed(3)} + \\dfrac{(${fmt(tpr,3)} - ${x1.toFixed(2)})}{(${x2.toFixed(2)} - ${x1.toFixed(2)})}\\times (${y2.toFixed(3)} - ${y1.toFixed(3)}) = ${fmt(kqInterp, 4)}$$<br>` +
    `<b>k<sub>Q,Q0</sub> interpolado = ${fmt(kqInterp, 4)}</b>`;

  if (window.MathJax) {
    MathJax.typesetPromise && MathJax.typesetPromise([detailBox]);
  }

  kqValueBox.textContent = fmt(kqInterp, 4);
  return kqInterp;
}

/* ---------------------------------------------------------
   8. FUNCIÓN 1: COMPARACIÓN CON TPS
   --------------------------------------------------------- */
function updateTPSComparison(doseMedida) {
  const inputMedida = document.getElementById("dosisMedidaTPS");
  const inputTPS = document.getElementById("dosisTPS");
  const boxAbs = document.getElementById("diffAbsTPS");
  const boxPct = document.getElementById("diffPctTPS");

  if (isValidNumber(doseMedida)) {
    inputMedida.value = doseMedida.toFixed(5);
  }

  const dMed = toNumber(inputMedida.value);
  const dTPS = toNumber(inputTPS.value);

  if (!isValidNumber(dMed) || !isValidNumber(dTPS) || dTPS === 0) {
    boxAbs.textContent = "— Gy";
    boxAbs.className = "diff-value-zero";
    boxPct.textContent = "— %";
    boxPct.className = "diff-value-zero";
    return;
  }

  const diffAbs = dMed - dTPS;
  const diffPct = ((dMed - dTPS) / dTPS) * 100;

  const signAbs = diffAbs > 0 ? "+" : "";
  const signPct = diffPct > 0 ? "+" : "";

  boxAbs.textContent = `${signAbs}${diffAbs.toFixed(5)} Gy`;
  boxPct.textContent = `${signPct}${diffPct.toFixed(3)} %`;

  if (diffAbs > 1e-7) {
    boxAbs.className = "diff-value-pos";
    boxPct.className = "diff-value-pos";
  } else if (diffAbs < -1e-7) {
    boxAbs.className = "diff-value-neg";
    boxPct.className = "diff-value-neg";
  } else {
    boxAbs.className = "diff-value-zero";
    boxPct.className = "diff-value-zero";
  }
}

/* ---------------------------------------------------------
   9. FUNCIÓN 2: DOSIS MÁXIMA MEDIANTE PDD
   --------------------------------------------------------- */
function updatePDDMaxDose(doseMedidaAuto) {
  const inputMedida = document.getElementById("dosisMedidaPDD");
  const inputPDD = document.getElementById("pddInput");

  const rMedida = document.getElementById("r_dosisMedidaPDD");
  const rPDD = document.getElementById("r_pddInput");
  const rDmax = document.getElementById("r_dmaxCalculada");

  if (isValidNumber(doseMedidaAuto) && !state.pddUserEdited) {
    inputMedida.value = doseMedidaAuto.toFixed(5);
  }

  const dMed = toNumber(inputMedida.value);
  const pdd = toNumber(inputPDD.value);

  if (!isValidNumber(dMed) || !isValidNumber(pdd) || pdd <= 0) {
    rMedida.textContent = isValidNumber(dMed) ? `${fmt(dMed, 5)} Gy` : "— Gy";
    rPDD.textContent = isValidNumber(pdd) ? `${fmt(pdd, 2)} %` : "— %";
    rDmax.textContent = "— Gy";
    return;
  }

  const dMax = dMed / (pdd / 100);

  rMedida.textContent = `${fmt(dMed, 5)} Gy`;
  rPDD.textContent = `${fmt(pdd, 2)} %`;
  rDmax.textContent = `${fmt(dMax, 5)} Gy`;
}

/* ---------------------------------------------------------
   10. VALIDACIÓN DE DATOS
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
    if (!isValidNumber(kpol)) warnings.push("k_pol está activado pero faltan datos para calcularlo.");
    else if (kpol < 0.98 || kpol > 1.02) warnings.push("k_pol está fuera del rango típico (0.98–1.02).");
  }

  if (isFactorEnabled("usar_ks")) {
    const ks = calculateKs();
    if (!isValidNumber(ks)) warnings.push("k_s está activado pero faltan datos para calcularlo.");
    else if (ks < 1.0 || ks > 1.05) warnings.push("k_s está fuera del rango típico (1.00–1.05).");
  }

  if (isFactorEnabled("usar_kelec")) {
    const v = toNumber(document.getElementById("kelecValor").value);
    if (!isValidNumber(v)) warnings.push("k_elec está activado pero no se ha introducido su valor.");
  }

  if (isFactorEnabled("usar_kplastic")) {
    const v = toNumber(document.getElementById("kplasticValor").value);
    if (!isValidNumber(v)) warnings.push("k_plastic está activado pero no se ha introducido su valor.");
  }

  const kqMode = document.querySelector('input[name="kqMode"]:checked').value;
  if (kqMode === "auto") {
    const mfg = document.getElementById("kqFabricante").value;
    const model = document.getElementById("kqModelo").value;
    const tpr = toNumber(document.getElementById("tpr2010").value);
    if (!mfg || !model) warnings.push("Falta seleccionar el fabricante o modelo de la cámara en la sección de kQ,Q0.");
    if (!isValidNumber(tpr)) warnings.push("Falta introducir el TPR20,10 medido.");
    else if (tpr < 0.50 || tpr > 0.84) warnings.push(`El TPR20,10 (${fmt(tpr,3)}) está fuera del intervalo oficial TRS-398 (0.50 a 0.84). NO se realiza extrapolación.`);
  } else {
    const kqManual = toNumber(document.getElementById("kqManualValor").value);
    if (!isValidNumber(kqManual)) warnings.push("Falta introducir manualmente el valor de kQ,Q0.");
  }

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
   11. CÁLCULO PRINCIPAL DE LA DOSIS Y TRAZABILIDAD
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
    updateTPSComparison(NaN);
    updatePDDMaxDose(NaN);
    return;
  }

  const MQ = M * kTP * kpol * ks * kelec * kplastic;
  const dose = MQ * ndw * kQ;

  lastResult = {
    M, kTP, kpol, ks, kelec, kplastic, ndw, kQ, MQ, dose,
    tpr: toNumber(document.getElementById("tpr2010").value),
    n: stats.n, stdev: stats.stdev, uA: stats.uA
  };

  document.getElementById("doseResultValue").textContent = fmt(dose, 5) + " Gy";
  updateResultsGrid(lastResult);
  renderCalcTrace(lastResult);

  // Actualizar secciones TPS y PDD con el resultado calculado
  updateTPSComparison(dose);
  updatePDDMaxDose(dose);
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
  document.getElementById("r_kQ").textContent = isValidNumber(r.kQ) ? fmt(r.kQ, 4) : "—";
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
    `<b>8. Obtención de kQ,Q0:</b> TPR20,10 = ${isValidNumber(r.tpr) ? fmt(r.tpr,3) : "n/a"} → kQ,Q0 = ${fmt(r.kQ, 4)}.`,
    `<b>9. Aplicación de N_D,w:</b> N_D,w = ${isValidNumber(r.ndw) ? fmtSci(r.ndw) : "n/a"}.`,
    `<b>10. Resultado final:</b> Dw,Q = MQ × N_D,w × kQ,Q0 = ${isValidNumber(r.dose) ? fmt(r.dose, 5) + " Gy" : "no calculated"}.`
  ];
  document.getElementById("calcTrace").innerHTML = steps.map(s => `<li>${s}</li>`).join("");
}

/* ---------------------------------------------------------
   12. EXPORTACIÓN (CSV, TXT, IMPRESIÓN)
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
  lines.push("Energia nominal: " + document.getElementById("energiaNominal").value + " MV");
  lines.push("");
  lines.push("-- C. Datos de la camara --");
  lines.push("Fabricante: " + document.getElementById("fabricante").value);
  lines.push("Modelo: " + document.getElementById("modeloCamara").value);
  lines.push("Numero de serie: " + document.getElementById("numSerie").value);
  lines.push("N_D,w: " + document.getElementById("ndw").value + " " + document.getElementById("ndwUnidad").value);
  lines.push("");
  lines.push("-- D. Lecturas --");
  state.readings.forEach((v, i) => lines.push("M" + (i + 1) + " = " + (v === null ? "" : v)));
  lines.push("");
  if (lastResult) {
    lines.push("-- Resultados de Dosis --");
    lines.push("kTP = " + fmt(lastResult.kTP));
    lines.push("kpol = " + fmt(lastResult.kpol));
    lines.push("ks = " + fmt(lastResult.ks));
    lines.push("TPR20,10 = " + fmt(lastResult.tpr, 3));
    lines.push("kQ,Q0 = " + fmt(lastResult.kQ, 4));
    lines.push("MQ = " + fmt(lastResult.MQ));
    lines.push("DOSIS ABSORBIDA EN AGUA (Dw,Q) = " + fmt(lastResult.dose, 5) + " Gy");
    lines.push("");
    lines.push("-- Comparacion con TPS --");
    lines.push("Dosis TPS = " + document.getElementById("dosisTPS").value + " Gy");
    lines.push("Diferencia absoluta = " + document.getElementById("diffAbsTPS").textContent);
    lines.push("Diferencia porcentual = " + document.getElementById("diffPctTPS").textContent);
    lines.push("");
    lines.push("-- Dosis maxima mediante PDD --");
    lines.push("Dosis a profundidad de medida = " + document.getElementById("r_dosisMedidaPDD").textContent);
    lines.push("PDD = " + document.getElementById("r_pddInput").textContent);
    lines.push("Dosis maxima (Dmax) = " + document.getElementById("r_dmaxCalculada").textContent);
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
    const idx = l.indexOf(" = ");
    if (idx === -1) return '"' + l.replace(/"/g, '""') + '"';
    return '"' + l.slice(0, idx).replace(/"/g, '""') + '","' + l.slice(idx + 3).replace(/"/g, '""') + '"';
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
   13. AYUDAS CONTEXTUALES (TOOLTIPS)
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
  });
}

function positionTooltip(e, popup) {
  const x = Math.min(e.clientX + 14, window.innerWidth - 300);
  const y = Math.min(e.clientY + 14, window.innerHeight - 100);
  popup.style.left = x + "px";
  popup.style.top = y + "px";
}

/* ---------------------------------------------------------
   14. INICIALIZACIÓN
   --------------------------------------------------------- */
function limpiarFormulario() {
  document.querySelectorAll("input[type=text], input[type=number], input[type=date]").forEach(el => el.value = "");
  document.querySelectorAll("select").forEach(el => el.selectedIndex = 0);
  document.querySelectorAll('input[type=checkbox]').forEach(el => { el.checked = false; });
  document.querySelectorAll(".factor-card").forEach(c => c.classList.remove("enabled"));
  document.getElementById("tCal").value = "20";
  document.getElementById("pCal").value = "101.3";
  state.readings = [null, null];
  state.pddUserEdited = false;
  renderReadingsTable();
  updateReadingsStats();
  document.getElementById("doseResultValue").textContent = "— Gy";
  document.getElementById("calcTrace").innerHTML = '<li>Presione "CALCULAR DOSIS" para generar el detalle paso a paso.</li>';
  renderWarnings([]);
  ["ktpValue", "kpolValue", "ksValue", "kqValue"].forEach(id => document.getElementById(id).textContent = "—");
  updateResultsGrid({ M: NaN, kTP: NaN, kpol: NaN, ks: NaN, kelec: NaN, kplastic: NaN, ndw: NaN, tpr: NaN, kQ: NaN, MQ: NaN });
  updateTPSComparison(NaN);
  updatePDDMaxDose(NaN);
  lastResult = null;
}

function reiniciarAplicacion() {
  limpiarFormulario();
  document.querySelector('input[name="kqMode"][value="auto"]').checked = true;
  document.querySelector('input[name="ksMode"][value="manual"]').checked = true;
  document.querySelector('input[name="kpolMode"][value="calc"]').checked = true;
  document.getElementById("kpolCalcBlock").classList.remove("hidden-block");
  document.getElementById("kpolManualBlock").classList.add("hidden-block");
  document.getElementById("ksManualBlock").classList.remove("hidden-block");
  document.getElementById("ksDosVoltBlock").classList.add("hidden-block");
  document.getElementById("kqAutoBlock").classList.remove("hidden-block");
  document.getElementById("kqManualBlock").classList.add("hidden-block");
  document.getElementById("interpDetail").innerHTML = "<p>Seleccione un fabricante y modelo de cámara e introduzca el TPR<sub>20,10</sub> en la sección G para ver el detalle de la interpolación.</p>";
}

function initEventListeners() {
  document.getElementById("btnAddReading").addEventListener("click", addReading);

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
      document.getElementById("kqAutoBlock").classList.toggle("hidden-block", mode !== "auto");
      document.getElementById("kqManualBlock").classList.toggle("hidden-block", mode !== "manual");
      updateKQFromTPR();
    });
  });

  document.getElementById("fabricante").addEventListener("change", () => syncChamberSelection("sectionC"));
  document.getElementById("modeloCamara").addEventListener("change", () => syncChamberSelection("sectionC_model"));
  document.getElementById("kqFabricante").addEventListener("change", () => syncChamberSelection("sectionH"));
  document.getElementById("kqModelo").addEventListener("change", () => syncChamberSelection("sectionH_model"));

  document.getElementById("tpr2010").addEventListener("input", updateKQFromTPR);
  document.getElementById("kqManualValor").addEventListener("input", updateKQFromTPR);

  // Escuchadores para Comparación TPS y PDD
  document.getElementById("dosisTPS").addEventListener("input", () => updateTPSComparison());
  document.getElementById("dosisMedidaPDD").addEventListener("input", () => {
    state.pddUserEdited = true;
    updatePDDMaxDose();
  });
  document.getElementById("pddInput").addEventListener("input", () => updatePDDMaxDose());

  document.getElementById("btnCalcular").addEventListener("click", calcularDosis);
  document.getElementById("btnLimpiar").addEventListener("click", limpiarFormulario);
  document.getElementById("btnReiniciar").addEventListener("click", reiniciarAplicacion);
  document.getElementById("btnExportCSV").addEventListener("click", exportCSV);
  document.getElementById("btnExportTXT").addEventListener("click", exportTXT);
  document.getElementById("btnImprimir").addEventListener("click", () => window.print());
}

function init() {
  populateManufacturerDropdowns();
  renderReadingsTable();
  updateReadingsStats();
  initEventListeners();
  setupTooltips();
  calculateKTP();
}

document.addEventListener("DOMContentLoaded", init);