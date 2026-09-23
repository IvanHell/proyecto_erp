/* ================= CONSTANTES ================= */
const ECT_MAP = {
    "ECT-26": "SENCILLO",
    "ECT-32": "SENCILLO",
    "ECT-42": "DOBLE",
    "ECT-80": "TRIPLE"
};
const PIN_EDIT = "1234";

/* ================= DATOS ================= */
const DB = {
    cotizaciones: [
        {
            folio: "FOL-0001", cli: "MOTUS", pro: "048a-24",
            desc: "T1XX AR — múltiples kits",
            grupos: [
                {
                    code: "T1XX AR 1600061XB",
                    componentes: [
                        { desc: "HSC Box", lar: 60.5, anc: 37, alt: 40, uni: "cm", ect: "ECT-32", cor: "SENCILLO", pre: 0.98 },
                        { desc: "15 Cell Partition", lar: 60, anc: 36.5, alt: 39, uni: "cm", ect: "ECT-32", cor: "SENCILLO", pre: 0.75 }
                    ],
                    subtotal: 1.73
                },
                {
                    code: "COMMON 1502086XA",
                    componentes: [
                        { desc: "Common Cover", lar: 124.5, anc: 117, alt: 10, uni: "cm", ect: "ECT-32", cor: "SENCILLO", pre: 1.45 }
                    ],
                    subtotal: 1.45
                }
            ]
        }
    ],
    // Especificaciones ahora con estructura de grupos
    especificaciones: [
        {
            folio: "FOL-0001",
            grupos: [
                {
                    proyecto: "CRV FR/AR",
                    fichas: [
                        { nInterno: "3763224", cliente: "Motus León", nExterno: "1500820X",
                          nombre: "CAJA CON FONDO", largo: 60.5, ancho: 38, alto: 72,
                          ect: "ECT-32", corrugado: "SENCILLO", medida: "1.84",
                          codigo: "ESP-LMT-224", direccion: "https://drive.google.com/open?id=1wE3e8jh1q-33mAeX0j26_sr5gcPY9Zg1" },
                        { nInterno: "3763225", cliente: "Motus León", nExterno: "1500820X",
                          nombre: "REJILLA", largo: 59.5, ancho: 37, alto: 71.2,
                          ect: "ECT-32", corrugado: "SENCILLO", medida: "0.86",
                          codigo: "ESP-LMT-225", direccion: "https://drive.google.com/file/d/1kUBooXBNHb05ZfrgY5X2pWux5xaFMTHb/view",
                          partes: [
                            { sufijo: "A", cantidad: 2 },
                            { sufijo: "B", cantidad: 4 }
                          ]
                        }
                    ]
                }
            ]
        }
    ],
    laminas: [
        { nombre: "LAMINA 120x140", largo: 120, ancho: 140, m2: 1.68, usosEn: ["3763221", "150-019"] }
    ]
};

/* ================= ESTADO ================= */
let tab = "cot";
let espEditIndex = -1;
let cotEditIndex = -1;

/* ================= UTILIDADES ================= */
function nextFolio() { return "FOL-" + String(DB.cotizaciones.length + 1).padStart(4, "0"); }

function fillFolios(selectEl, selected) {
    if (!selectEl) return;
    selectEl.innerHTML = `<option value="">— Seleccionar folio —</option>` +
        DB.cotizaciones.map(c =>
            `<option value="${c.folio}">${c.folio} — ${c.desc || c.pro} (${c.cli})</option>`
        ).join("");
    if (selected) selectEl.value = selected;
}

function bindEctAuto(ect, cor) {
    if (!ect || !cor) return;
    ect.addEventListener("change", () => { cor.value = ECT_MAP[ect.value] || ""; });
}

/* ================= RENDER ================= */
function render() {
    const panel = document.getElementById("panel");
    if (tab === "cot") renderCot(panel);
    if (tab === "esp") renderEsp(panel);
    if (tab === "pp")  renderAlmacen(panel, "PP");
    if (tab === "pt")  renderAlmacen(panel, "PT");
    if (tab === "mp")  renderMP(panel);
}

/* ================= COTIZACIONES ================= */
function renderCot(panel) {
    panel.innerHTML = `
        <div class="toolbar">
            <div><b>Cotizaciones</b> <span class="muted">(${DB.cotizaciones.length})</span></div>
            <button class="btn" onclick="openNewCot()">+ Nueva Cotización</button>
        </div>
        ${DB.cotizaciones.map((c, i) => {
            const totalComponentes = c.grupos.reduce((s, g) => s + g.componentes.length, 0);
            const kits = c.grupos.filter(g => g.componentes.length >= 2).length;
            const inds = c.grupos.filter(g => g.componentes.length === 1).length;
            return `
            <div class="card">
                <div class="head-row">
                    <h2><span class="pill warn">${c.folio}</span> ${c.cli} — ${c.pro}</h2>
                    <button class="btn edit small" onclick="openEditCot(${i})">✎ Editar</button>
                </div>
                <div class="muted">${c.desc}</div>
                <div class="muted">${c.grupos.length} grupo(s) · ${kits} kit(s) · ${inds} individual(es) · ${totalComponentes} componente(s)</div>
                ${c.grupos.map(g => {
                    const tipo = g.componentes.length >= 2 ? "kit" : "individual";
                    return `
                    <div class="grupo-vista ${tipo === 'kit' ? 'es-kit' : ''}">
                        <div class="grupo-vista-head">
                            <span class="tipo-badge ${tipo}">${tipo === 'kit' ? '🧩 KIT' : '📄 INDIVIDUAL'}</span>
                            <span class="code">${g.code}</span>
                        </div>
                        <div class="tablewrap">
                            <table>
                                <thead><tr>
                                    <th>#</th><th>Descripción</th><th>Largo</th><th>Ancho</th><th>Alto</th>
                                    <th>Unid</th><th>ECT</th><th>Corrugado</th><th>P.U.</th>
                                </tr></thead>
                                <tbody>
                                    ${g.componentes.map((comp, ci) => `
                                        <tr>
                                            <td>${ci + 1}</td>
                                            <td class="left">${comp.desc}</td>
                                            <td>${comp.lar}</td><td>${comp.anc}</td><td>${comp.alt}</td>
                                            <td>${comp.uni}</td><td>${comp.ect}</td><td>${comp.cor}</td>
                                            <td>$${comp.pre}</td>
                                        </tr>`).join("")}
                                </tbody>
                            </table>
                        </div>
                        ${g.subtotal ? `<div class="subtotal-row">Subtotal: $${g.subtotal}</div>` : ""}
                    </div>`;
                }).join("")}
            </div>`;
        }).join("")}
    `;
}

/* ================= ESPECIFICACIONES ================= */
function renderEsp(panel) {
    panel.innerHTML = `
        <div class="toolbar">
            <div><b>Especificaciones</b> <span class="muted">(${DB.especificaciones.length})</span></div>
            <button class="btn" onclick="openNewEsp()">+ Nueva Especificación</button>
        </div>
        ${DB.especificaciones.length === 0 ? '<div class="empty">Sin especificaciones</div>' :
            DB.especificaciones.map((e, i) => renderEspCard(e, i)).join("")}
    `;
}

function renderEspCard(e, i) {
    const totalFichas = e.grupos.reduce((s, g) => s + g.fichas.length, 0);
    const kits = e.grupos.filter(g => g.fichas.length >= 2).length;
    const inds = e.grupos.filter(g => g.fichas.length === 1).length;

    return `<div class="card">
        <div class="head-row">
            <h2><span class="pill warn">${e.folio}</span> Especificación</h2>
            <button class="btn edit small" onclick="openPin(${i})">✎ Editar</button>
        </div>
        <div class="muted">${e.grupos.length} grupo(s) · ${kits} kit(s) · ${inds} individual(es) · ${totalFichas} ficha(s)</div>
        ${e.grupos.map(g => {
            const tipo = g.fichas.length >= 2 ? "kit" : "individual";
            return `
            <div class="grupo-esp-vista ${tipo === 'kit' ? 'es-kit' : ''}">
                <div class="grupo-vista-head">
                    <span class="tipo-badge ${tipo}">${tipo === 'kit' ? '🧩 KIT' : '📄 INDIVIDUAL'}</span>
                    <span class="code">Proyecto: ${g.proyecto || "—"}</span>
                </div>
                <div class="tablewrap">
                    <table>
                        <thead><tr>
                            <th>#</th><th>N_Interno</th><th>N_Externo</th><th>Nombre</th>
                            <th>Medidas</th><th>ECT</th><th>Corr</th><th>Medida</th><th>Código</th><th>URL</th>
                        </tr></thead>
                        <tbody>
                            ${g.fichas.map((f, fi) => `
                                <tr>
                                    <td>${fi + 1}</td>
                                    <td>${f.nInterno}</td>
                                    <td>${f.nExterno}</td>
                                    <td class="left">${f.nombre}${f.partes ? ' <span class="pill bad" style="font-size:9px">⚙ ' + f.partes.map(p => p.cantidad + p.sufijo).join('+') + '</span>' : ''}</td>
                                    <td>${f.largo}×${f.ancho}×${f.alto}</td>
                                    <td>${f.ect}</td>
                                    <td>${f.corrugado}</td>
                                    <td>${f.medida} m²</td>
                                    <td>${f.codigo}</td>
                                    <td>${f.direccion ? `<a href="${f.direccion}" target="_blank" class="pill good">Ver</a>` : '—'}</td>
                                </tr>
                                ${f.partes ? `
                                    <tr><td colspan="10" style="background:#fff1f2;border-color:#fecaca">
                                        <b style="font-size:11px;color:#9f1239">Partes de ${f.nombre}:</b>
                                        ${f.partes.map(p => `${p.sufijo} × ${p.cantidad} → <b>${f.nExterno}-${p.sufijo}</b>`).join(' + ')}
                                    </td></tr>
                                ` : ''}
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>`;
        }).join("")}
    </div>`;
}

function renderAlmacen(panel, cod) {
    // Aplanamos todas las fichas de especificación para filtrar por almacén
    const todasFichas = [];
    DB.especificaciones.forEach(e => {
        e.grupos.forEach(g => {
            g.fichas.forEach(f => {
                todasFichas.push({ ...f, folio: e.folio, proyecto: g.proyecto, tipoGrupo: g.fichas.length >= 2 ? "kit" : "individual" });
            });
        });
    });

    const items = todasFichas.filter(f => {
        if (cod === "PP") return f.partes && f.partes.length > 0;
        if (cod === "PT") return (f.tipoGrupo === "kit") || (f.nombre || "").toUpperCase().includes("CAJA");
        return false;
    });

    panel.innerHTML = `
        <div class="toolbar"><div><b>Almacén ${cod}</b> <span class="muted">(informativo)</span></div></div>
        ${items.length === 0 ? '<div class="empty">Sin elementos</div>' :
            items.map(f => `<div class="card">
                <h2><span class="pill ${cod === "PT" ? "good" : "warn"}">${cod}</span> <span class="pill warn">${f.folio}</span>
                    ${f.nInterno} — ${f.nombre}</h2>
                <div class="muted">Proyecto: ${f.proyecto}</div>
            </div>`).join("")}
    `;
}

function renderMP(panel) {
    panel.innerHTML = `
        <div class="toolbar"><div><b>MP — Láminas</b> <span class="muted">(informativo)</span></div></div>
        ${DB.laminas.map(l => `<div class="card">
            <h2><span class="pill good">MP</span> ${l.nombre}</h2>
            <div class="muted">Medidas: ${l.largo}×${l.ancho} cm · m²: ${l.m2}</div>
            <div class="muted">Rinde en: ${l.usosEn.join(", ")}</div>
        </div>`).join("")}
    `;
}

/* ================= TABS ================= */
document.querySelectorAll(".tab-btn").forEach(b => {
    b.onclick = () => {
        document.querySelectorAll(".tab-btn").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        tab = b.dataset.tab;
        render();
    };
});

/* ================= MODALES ================= */
function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }
function verEspecificacion(url) { if (url) window.open(url, "_blank"); }

/* ================= PIN ================= */
function openPin(index) {
    espEditIndex = index;
    document.getElementById("pin_input").value = "";
    document.getElementById("pin_error").style.display = "none";
    openModal("modalPin");
    setTimeout(() => document.getElementById("pin_input").focus(), 100);
}
function checkPin() {
    if (document.getElementById("pin_input").value === PIN_EDIT) {
        closeModal("modalPin");
        openEditEsp(espEditIndex);
    } else {
        document.getElementById("pin_error").style.display = "block";
    }
}

/* ================================================================
   COTIZACIÓN
   ================================================================ */
function openNewCot() {
    cotEditIndex = -1;
    document.getElementById("cot_title").textContent = "Nueva Cotización";
    const f = nextFolio();
    document.getElementById("c_folio").value = f;
    document.getElementById("c_folio_valor").textContent = f;
    ["c_cli", "c_pro", "c_desc"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("cot_items_container").innerHTML = "";
    addGrupoCot();
    updateItemsCount("cot");
    openModal("modalCot");
}

function openEditCot(i) {
    cotEditIndex = i;
    const c = DB.cotizaciones[i];
    document.getElementById("cot_title").textContent = "Editar Cotización";
    document.getElementById("c_folio").value = c.folio;
    document.getElementById("c_folio_valor").textContent = c.folio;
    c_cli.value = c.cli; c_pro.value = c.pro; c_desc.value = c.desc;
    const cont = document.getElementById("cot_items_container");
    cont.innerHTML = "";
    c.grupos.forEach(g => addGrupoCot(g));
    updateItemsCount("cot");
    openModal("modalCot");
}

function addGrupoCot(data) {
    const cont = document.getElementById("cot_items_container");
    const div = document.createElement("div");
    div.className = "grupo-cot";
    div.innerHTML = `
        <div class="grupo-head">
            <span class="num">${cont.children.length + 1}</span>
            <span class="tipo-badge individual" data-rol="badge">📄 INDIVIDUAL</span>
            <div class="grupo-actions">
                <button class="btn secondary small" onclick="addComponenteGrupo(this)">+ Componente</button>
                <button class="btn danger small" onclick="this.closest('.grupo-cot').remove(); updateItemsCount('cot');">🗑 Eliminar</button>
            </div>
        </div>
        <div class="grupo-code-input">
            <label>Código / Proyecto:</label>
            <input class="grupo-code" value="${data?.code || ''}" placeholder="Ej. T1XX AR 1600061XB" oninput="actualizarGrupoCot(this)">
        </div>
        <div class="tablewrap" style="max-height:none;overflow:visible;border:none;">
            <table class="componentes-table">
                <thead><tr>
                    <th class="col-chica">#</th>
                    <th>Descripción</th>
                    <th class="col-med">Largo</th>
                    <th class="col-med">Ancho</th>
                    <th class="col-med">Alto</th>
                    <th class="col-chica">Unid.</th>
                    <th class="col-med">ECT</th>
                    <th class="col-med">Corrugado</th>
                    <th class="col-precio">P.U.</th>
                    <th class="col-chica"></th>
                </tr></thead>
                <tbody class="componentes-body"></tbody>
            </table>
        </div>
        <div class="grupo-subtotal">
            <label>Subtotal opcional:</label>
            <input class="grupo-subtotal-input" type="number" step="0.01" value="${data?.subtotal || ''}" placeholder="$">
            <span class="auto-total">Suma: $<span class="suma-auto">0.00</span></span>
        </div>
    `;
    cont.appendChild(div);
    const componentes = data?.componentes || [{}];
    componentes.forEach(comp => addComponenteGrupo(div.querySelector('.grupo-head button'), comp));
    actualizarGrupoCot(div);
    updateItemsCount("cot");
}

function addComponenteGrupo(btn, data) {
    const grupo = btn.closest('.grupo-cot');
    const tbody = grupo.querySelector('.componentes-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="col-chica">${tbody.children.length + 1}</td>
        <td><input class="comp-desc" list="nombre-options" value="${data?.desc || ''}" placeholder="HSC Box"></td>
        <td class="col-med"><input class="comp-lar" type="number" step="0.1" value="${data?.lar || ''}"></td>
        <td class="col-med"><input class="comp-anc" type="number" step="0.1" value="${data?.anc || ''}"></td>
        <td class="col-med"><input class="comp-alt" type="number" step="0.1" value="${data?.alt || ''}"></td>
        <td class="col-chica"><select class="comp-uni">
            <option ${data?.uni === "cm" || !data?.uni ? "selected" : ""}>cm</option>
            <option ${data?.uni === "mm" ? "selected" : ""}>mm</option>
            <option ${data?.uni === "in" ? "selected" : ""}>in</option>
        </select></td>
        <td class="col-med"><select class="comp-ect">
            <option value="">—</option>
            <option value="ECT-26" ${data?.ect === "ECT-26" ? "selected" : ""}>ECT-26</option>
            <option value="ECT-32" ${data?.ect === "ECT-32" ? "selected" : ""}>ECT-32</option>
            <option value="ECT-42" ${data?.ect === "ECT-42" ? "selected" : ""}>ECT-42</option>
            <option value="ECT-80" ${data?.ect === "ECT-80" ? "selected" : ""}>ECT-80</option>
        </select></td>
        <td class="col-med"><input class="comp-cor" readonly value="${data?.cor || ''}"></td>
        <td class="col-precio"><input class="comp-pre" type="number" step="0.01" value="${data?.pre || ''}"></td>
        <td class="col-chica"><button class="btn danger small" style="padding:3px 6px" onclick="this.closest('tr').remove(); actualizarGrupoCot(this)">×</button></td>
    `;
    tbody.appendChild(tr);
    const ectSel = tr.querySelector('.comp-ect');
    const corInp = tr.querySelector('.comp-cor');
    ectSel.addEventListener('change', () => { corInp.value = ECT_MAP[ectSel.value] || ''; actualizarGrupoCot(ectSel); });
    tr.querySelector('.comp-pre').addEventListener('input', () => actualizarGrupoCot(tr));
}

function actualizarGrupoCot(el) {
    const grupo = el.closest ? el.closest('.grupo-cot') : el;
    if (!grupo) return;
    const nComp = grupo.querySelectorAll('.componentes-body tr').length;
    const badge = grupo.querySelector('[data-rol="badge"]');
    if (nComp >= 2) {
        badge.textContent = '🧩 KIT';
        badge.className = 'tipo-badge kit';
        grupo.classList.add('es-kit');
        grupo.classList.remove('es-individual');
    } else {
        badge.textContent = '📄 INDIVIDUAL';
        badge.className = 'tipo-badge individual';
        grupo.classList.add('es-individual');
        grupo.classList.remove('es-kit');
    }
    const suma = [...grupo.querySelectorAll('.comp-pre')].map(i => Number(i.value) || 0).reduce((a, b) => a + b, 0);
    grupo.querySelector('.suma-auto').textContent = suma.toFixed(2);
    grupo.querySelectorAll('.componentes-body tr').forEach((tr, i) => {
        tr.querySelector('.col-chica').textContent = i + 1;
    });
}

function saveCot() {
    const grupos = [...document.querySelectorAll("#cot_items_container .grupo-cot")].map(g => {
        const componentes = [...g.querySelectorAll('.componentes-body tr')].map(tr => ({
            desc: tr.querySelector('.comp-desc').value,
            lar: +tr.querySelector('.comp-lar').value,
            anc: +tr.querySelector('.comp-anc').value,
            alt: +tr.querySelector('.comp-alt').value,
            uni: tr.querySelector('.comp-uni').value,
            ect: tr.querySelector('.comp-ect').value,
            cor: tr.querySelector('.comp-cor').value,
            pre: +tr.querySelector('.comp-pre').value
        })).filter(c => c.desc);
        const subtotalManual = +g.querySelector('.grupo-subtotal-input').value || 0;
        const sumaAuto = componentes.reduce((s, c) => s + (c.pre || 0), 0);
        return {
            code: g.querySelector('.grupo-code').value,
            componentes,
            subtotal: subtotalManual || (sumaAuto > 0 ? +sumaAuto.toFixed(2) : 0)
        };
    }).filter(g => g.componentes.length > 0);

    const c = { folio: document.getElementById("c_folio").value, cli: c_cli.value, pro: c_pro.value, desc: c_desc.value, grupos };
    if (!c.cli || !c.pro) { alert("Cliente y Número de Cotización son obligatorios"); return; }
    if (c.grupos.length === 0) { alert("Agrega al menos 1 grupo"); return; }

    if (cotEditIndex >= 0) DB.cotizaciones[cotEditIndex] = c;
    else DB.cotizaciones.push(c);
    closeModal("modalCot");
    render();
}

/* ================================================================
   ESPECIFICACIÓN
   ================================================================ */
function openNewEsp() {
    espEditIndex = -1;
    document.getElementById("esp_title").textContent = "Nueva Especificación";
    document.getElementById("esp_items_container").innerHTML = "";
    addGrupoEsp();
    updateItemsCount("esp");
    openModal("modalEsp");
}

function openEditEsp(i) {
    espEditIndex = i;
    const e = DB.especificaciones[i];
    document.getElementById("esp_title").textContent = "Editar Especificación — " + e.folio;
    const cont = document.getElementById("esp_items_container");
    cont.innerHTML = "";
    e.grupos.forEach(g => addGrupoEsp(g, e.folio));
    updateItemsCount("esp");
    openModal("modalEsp");
}

function addGrupoEsp(data, folioHeredado) {
    const cont = document.getElementById("esp_items_container");
    const div = document.createElement("div");
    div.className = "grupo-esp";

    div.innerHTML = `
        <div class="grupo-head">
            <span class="num">${cont.children.length + 1}</span>
            <span class="tipo-badge individual" data-rol="badge">📄 INDIVIDUAL</span>
            <div class="grupo-actions">
                <button class="btn secondary small" onclick="addFichaEsp(this)">+ Ficha</button>
                <button class="btn danger small" onclick="this.closest('.grupo-esp').remove(); updateItemsCount('esp');">🗑 Eliminar grupo</button>
            </div>
        </div>
        <div class="grupo-headers">
            <label>Folio heredado
                <select class="grupo-folio" onchange="actualizarGrupoEsp(this)"></select>
            </label>
            <label>Proyecto
                <input class="grupo-proyecto" value="${data?.proyecto || ''}" placeholder="Ej. CRV FR/AR" oninput="actualizarGrupoEsp(this)">
            </label>
        </div>
        <div class="tablewrap" style="max-height:none;overflow:visible;border:none;">
            <table class="fichas-table">
                <thead><tr>
                    <th class="col-num">#</th>
                    <th class="col-chica">N_Interno</th>
                    <th class="col-chica">N_Externo</th>
                    <th>Nombre</th>
                    <th class="col-med">Largo</th>
                    <th class="col-med">Ancho</th>
                    <th class="col-med">Alto</th>
                    <th class="col-ect">ECT</th>
                    <th class="col-cor">Corrugado</th>
                    <th class="col-medida">Medida m²</th>
                    <th class="col-cod">Código</th>
                    <th class="col-url">Dirección (URL)</th>
                    <th class="col-acciones">Acciones</th>
                </tr></thead>
                <tbody class="fichas-body"></tbody>
            </table>
        </div>
    `;
    cont.appendChild(div);

    // Llenar select de folios
    const folioSel = div.querySelector('.grupo-folio');
    fillFolios(folioSel, folioHeredado || data?.folio);

    // Agregar fichas
    const fichas = data?.fichas || [{}];
    fichas.forEach(f => addFichaEsp(div.querySelector('.grupo-head button'), f));

    actualizarGrupoEsp(div);
    updateItemsCount("esp");
}

function addFichaEsp(btn, data) {
    const grupo = btn.closest('.grupo-esp');
    const tbody = grupo.querySelector('.fichas-body');
    const tr = document.createElement('tr');
    tr.className = 'ficha-tr';
    tr.innerHTML = `
        <td class="col-num">${tbody.children.length + 1}</td>
        <td class="col-chica"><input class="f-ni" value="${data?.nInterno || ''}"></td>
        <td class="col-chica"><input class="f-ne" value="${data?.nExterno || ''}"></td>
        <td><input class="f-nom" list="nombre-options" value="${data?.nombre || ''}" placeholder="CAJA / REJILLA…"></td>
        <td class="col-med"><input class="f-lar" type="number" step="0.1" value="${data?.largo || ''}"></td>
        <td class="col-med"><input class="f-anc" type="number" step="0.1" value="${data?.ancho || ''}"></td>
        <td class="col-med"><input class="f-alt" type="number" step="0.1" value="${data?.alto || ''}"></td>
        <td class="col-ect"><select class="f-ect">
            <option value="">—</option>
            <option value="ECT-26" ${data?.ect === "ECT-26" ? "selected" : ""}>ECT-26</option>
            <option value="ECT-32" ${data?.ect === "ECT-32" ? "selected" : ""}>ECT-32</option>
            <option value="ECT-42" ${data?.ect === "ECT-42" ? "selected" : ""}>ECT-42</option>
            <option value="ECT-80" ${data?.ect === "ECT-80" ? "selected" : ""}>ECT-80</option>
        </select></td>
        <td class="col-cor"><input class="f-cor" readonly value="${data?.corrugado || ''}"></td>
        <td class="col-medida"><input class="f-med" value="${data?.medida || ''}" placeholder="1.84"></td>
        <td class="col-cod"><input class="f-cod" value="${data?.codigo || ''}"></td>
        <td class="col-url"><input class="f-dir" value="${data?.direccion || ''}" placeholder="https://..."></td>
        <td class="col-acciones">
            <button class="btn secondary small" style="padding:3px 6px" onclick="togglePartes(this)" title="Partes A/B/C">⚙</button>
            <button class="btn danger small" style="padding:3px 6px" onclick="eliminarFichaEsp(this)">×</button>
        </td>
    `;
    tbody.appendChild(tr);

    // Auto ECT → Corrugado
    const ectSel = tr.querySelector('.f-ect');
    const corInp = tr.querySelector('.f-cor');
    ectSel.addEventListener('change', () => { corInp.value = ECT_MAP[ectSel.value] || ''; actualizarGrupoEsp(ectSel); });

    // Auto N_Interno → también hereda N_Externo para el grupo
    const niInput = tr.querySelector('.f-ni');
    niInput.addEventListener('input', () => actualizarGrupoEsp(niInput));

    // Si tiene partes guardadas, desplegar
    if (data?.partes && data.partes.length) {
        setTimeout(() => {
            togglePartes(tr.querySelector('button[title="Partes A/B/C"]'));
            data.partes.forEach(p => addParteEsp(tr.querySelector('.btn-add-parte'), p.sufijo, p.cantidad));
        }, 0);
    }
}

function togglePartes(btn) {
    const tr = btn.closest('tr');
    let next = tr.nextElementSibling;

    // Si ya está abierto, lo cierra
    if (next && next.classList.contains('partes-row')) {
        next.remove();
        btn.style.background = '#fff';
        return;
    }

    // Crear fila de partes
    const ficha = tr;
    const nExterno = ficha.querySelector('.f-ne').value || 'N';
    const trPartes = document.createElement('tr');
    trPartes.className = 'partes-row';
    trPartes.innerHTML = `
        <td colspan="13" style="padding:0;border:none">
            <div class="partes-wrap">
                <div class="partes-titulo">⚙ Partes de la rejilla (sufijos con N_Externo: ${nExterno})</div>
                <table>
                    <thead><tr>
                        <th style="width:60px">Parte</th>
                        <th style="width:80px">Cantidad</th>
                        <th>Sufijo generado</th>
                        <th style="width:40px"></th>
                    </tr></thead>
                    <tbody class="partes-body"></tbody>
                </table>
                <button class="btn-mini btn-add-parte" style="margin-top:6px" onclick="addParteEsp(this)">+ Agregar parte</button>
            </div>
        </td>
    `;
    ficha.parentNode.insertBefore(trPartes, ficha.nextSibling);
    btn.style.background = '#fee2e2';

    // Autoactualizar sufijos cuando cambia N_Externo
    const neInput = ficha.querySelector('.f-ne');
    const upd = () => actualizarSufijosPartes(trPartes, neInput.value);
    neInput.addEventListener('input', upd);
    upd();
}

function addParteEsp(btn, sufijo, cantidad) {
    const wrap = btn.closest('.partes-wrap');
    const tbody = wrap.querySelector('.partes-body');
    const idx = tbody.children.length;
    const sufijos = ["A", "B", "C", "D", "E"];
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input class="p-suf" value="${sufijo || sufijos[idx] || 'X'}"></td>
        <td><input class="p-can" type="number" value="${cantidad || 1}"></td>
        <td><input class="p-full" readonly></td>
        <td><button class="btn-mini" onclick="this.closest('tr').remove()">×</button></td>
    `;
    tbody.appendChild(tr);
    const fichaTr = wrap.closest('tr').previousElementSibling;
    const neInput = fichaTr.querySelector('.f-ne');
    const upd = () => actualizarSufijosPartes(wrap.closest('tr'), neInput.value);
    tr.querySelector('.p-suf').addEventListener('input', upd);
    neInput.addEventListener('input', upd);
    upd();
}

function actualizarSufijosPartes(trPartes, prefijo) {
    const pref = prefijo || 'N';
    trPartes.querySelectorAll('.partes-body tr').forEach(tr => {
        const suf = tr.querySelector('.p-suf').value;
        tr.querySelector('.p-full').value = pref + '-' + suf;
    });
}

function eliminarFichaEsp(btn) {
    const tr = btn.closest('tr');
    const next = tr.nextElementSibling;
    if (next && next.classList.contains('partes-row')) next.remove();
    tr.remove();
    // Renumerar
    const tbody = btn.closest('tbody');
    tbody.querySelectorAll('.ficha-tr').forEach((r, i) => {
        r.querySelector('.col-num').textContent = i + 1;
    });
    actualizarGrupoEsp(btn);
}

function actualizarGrupoEsp(el) {
    const grupo = el.closest ? el.closest('.grupo-esp') : el;
    if (!grupo) return;
    const nFichas = grupo.querySelectorAll('.fichas-body tr.ficha-tr').length;
    const badge = grupo.querySelector('[data-rol="badge"]');
    if (nFichas >= 2) {
        badge.textContent = '🧩 KIT';
        badge.className = 'tipo-badge kit';
        grupo.classList.add('es-kit');
        grupo.classList.remove('es-individual');
    } else {
        badge.textContent = '📄 INDIVIDUAL';
        badge.className = 'tipo-badge individual';
        grupo.classList.add('es-individual');
        grupo.classList.remove('es-kit');
    }
    // Renumerar
    grupo.querySelectorAll('.fichas-body tr.ficha-tr').forEach((r, i) => {
        r.querySelector('.col-num').textContent = i + 1;
    });
}

function updateItemsCount(prefix) {
    const contId = prefix === "cot" ? "cot_items_container" : "esp_items_container";
    const countId = prefix === "cot" ? "cot_items_count" : "esp_items_count";
    const n = document.querySelectorAll(`#${contId} .grupo-${prefix === "cot" ? "cot" : "esp"}`).length;
    const c = document.getElementById(countId);
    if (c) c.textContent = `(${n})`;
}

function saveEsp() {
    const grupos = [...document.querySelectorAll("#esp_items_container .grupo-esp")].map(g => {
        const folio = g.querySelector('.grupo-folio').value;
        const proyecto = g.querySelector('.grupo-proyecto').value;

        const fichas = [...g.querySelectorAll('.fichas-body tr.ficha-tr')].map(tr => {
            const f = {
                nInterno: tr.querySelector('.f-ni').value,
                cliente: "",
                nExterno: tr.querySelector('.f-ne').value,
                nombre: tr.querySelector('.f-nom').value,
                largo: +tr.querySelector('.f-lar').value,
                ancho: +tr.querySelector('.f-anc').value,
                alto: +tr.querySelector('.f-alt').value,
                ect: tr.querySelector('.f-ect').value,
                corrugado: tr.querySelector('.f-cor').value,
                medida: tr.querySelector('.f-med').value,
                codigo: tr.querySelector('.f-cod').value,
                direccion: tr.querySelector('.f-dir').value
            };
            // Partes (si existen)
            const next = tr.nextElementSibling;
            if (next && next.classList.contains('partes-row')) {
                const partes = [...next.querySelectorAll('.partes-body tr')].map(p => ({
                    sufijo: p.querySelector('.p-suf').value,
                    cantidad: +p.querySelector('.p-can').value
                })).filter(p => p.sufijo);
                if (partes.length) f.partes = partes;
            }
            return f;
        }).filter(f => f.nInterno || f.nombre);

        return { folio, proyecto, fichas };
    }).filter(g => g.fichas.length > 0);

    // Validaciones
    if (grupos.length === 0) { alert("Agrega al menos 1 grupo con 1 ficha"); return; }
    for (const g of grupos) {
        if (!g.folio) { alert("Cada grupo debe tener folio heredado"); return; }
        if (!g.proyecto) { alert("Cada grupo debe tener proyecto"); return; }
    }

    const e = {
        folio: grupos[0].folio,  // folio principal (todos comparten uno)
        grupos
    };

    if (espEditIndex >= 0) DB.especificaciones[espEditIndex] = e;
    else DB.especificaciones.push(e);
    closeModal("modalEsp");
    render();
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    const pin = document.getElementById("pin_input");
    if (pin) pin.addEventListener("keydown", ev => { if (ev.key === "Enter") checkPin(); });
    render();
});

if (document.readyState !== "loading") {
    const pin = document.getElementById("pin_input");
    if (pin) pin.addEventListener("keydown", ev => { if (ev.key === "Enter") checkPin(); });
    render();
}

/* ================= CIERRE UNIVERSAL DE MODALES ================= */

// Cerrar al hacer clic en el fondo oscuro
document.querySelectorAll('.modal-bg').forEach(bg => {
    bg.addEventListener('click', (ev) => {
        // Solo si el clic fue directamente en el fondo, no en el modal
        if (ev.target === bg) {
            bg.classList.remove('open');
        }
    });
});

// Cerrar con tecla ESC
document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
        document.querySelectorAll('.modal-bg.open').forEach(bg => {
            bg.classList.remove('open');
        });
    }
});


/* ================= GLOBAL ================= */
window.openNewCot = openNewCot;
window.openEditCot = openEditCot;
window.addGrupoCot = addGrupoCot;
window.addComponenteGrupo = addComponenteGrupo;
window.actualizarGrupoCot = actualizarGrupoCot;
window.updateItemsCount = updateItemsCount;
window.saveCot = saveCot;

window.openNewEsp = openNewEsp;
window.openEditEsp = openEditEsp;
window.addGrupoEsp = addGrupoEsp;
window.addFichaEsp = addFichaEsp;
window.togglePartes = togglePartes;
window.addParteEsp = addParteEsp;
window.eliminarFichaEsp = eliminarFichaEsp;
window.actualizarGrupoEsp = actualizarGrupoEsp;
window.saveEsp = saveEsp;

window.openModal = openModal;
window.closeModal = closeModal;
window.openPin = openPin;
window.checkPin = checkPin;