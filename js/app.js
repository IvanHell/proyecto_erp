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
                    code: "T1XX AR 1600062XB",
                    componentes: [
                        { desc: "HSC Box", lar: 60.5, anc: 37, alt: 41, uni: "cm", ect: "ECT-32", cor: "SENCILLO", pre: 1.05 },
                        { desc: "15 Cell Partition", lar: 60, anc: 36.5, alt: 40, uni: "cm", ect: "ECT-32", cor: "SENCILLO", pre: 0.75 }
                    ],
                    subtotal: 1.80
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
    especificaciones: [
        { folio: "FOL-0001", tipo: "individual", nInterno: "3763221", cliente: "MOTUS",
          nExterno: "1500913M", nombre: "CAJA CON FONDO", proyecto: "T1XX AR 1600061XB",
          largo: 60, ancho: 38, alto: 24, ect: "ECT-32", corrugado: "SENCILLO",
          medida: "1", codigo: "ESP-LMT-221", direccion: "https://example.com/planos/ESP-LMT-221.pdf" }
    ],
    laminas: [
        { nombre: "LAMINA 120x140", largo: 120, ancho: 140, m2: 1.68, usosEn: ["3763221", "150-019"] }
    ]
};

/* ================= ESTADO ================= */
let tab = "cot";
let espTipoActual = null;
let espEditIndex = -1;
let cotEditIndex = -1;
let principalEsRejilla = false;

/* ================= UTILIDADES ================= */
function nextFolio() { return "FOL-" + String(DB.cotizaciones.length + 1).padStart(4, "0"); }
function vinculadasPorFolio(folio) { return DB.cotizaciones.filter(c => c.folio === folio); }
function ultimas5() { return [...DB.cotizaciones].slice(-5).reverse(); }

function fillFolios(selected) {
    const sel = document.getElementById("e_folio");
    if (!sel) return;
    sel.innerHTML = `<option value="">— Seleccionar folio —</option>` +
        ultimas5().map(c =>
            `<option value="${c.folio}">${c.folio} — ${c.desc} (${c.cli})</option>`
        ).join("");
    if (selected) sel.value = selected;
}

function bindEctAuto(ect, cor) {
    if (!ect || !cor) return;
    ect.addEventListener("change", () => { cor.value = ECT_MAP[ect.value] || ""; });
}

/* Determina tipo de un grupo (1 componente = Individual, 2+ = Kit) */
function tipoGrupo(grupo) {
    return grupo.componentes.length >= 2 ? "kit" : "individual";
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

function renderCot(panel) {
    panel.innerHTML = `
        <div class="toolbar">
            <div><b>Cotizaciones</b> <span class="muted">(${DB.cotizaciones.length})</span></div>
            <button class="btn" onclick="openNewCot()">+ Nueva Cotización</button>
        </div>
        ${DB.cotizaciones.map((c, i) => {
            const totalGrupos = c.grupos.length;
            const totalComponentes = c.grupos.reduce((s, g) => s + g.componentes.length, 0);
            const kits = c.grupos.filter(g => g.componentes.length >= 2).length;
            const individuales = c.grupos.filter(g => g.componentes.length === 1).length;
            return `
            <div class="card">
                <div class="head-row">
                    <h2><span class="pill warn">${c.folio}</span> ${c.cli} — ${c.pro}</h2>
                    <button class="btn edit small" onclick="openEditCot(${i})">✎ Editar</button>
                </div>
                <div class="muted">${c.desc}</div>
                <div class="muted">${totalGrupos} grupo(s) · ${kits} kit(s) · ${individuales} individual(es) · ${totalComponentes} componente(s)</div>

                ${c.grupos.map((g, gi) => {
                    const tipo = tipoGrupo(g);
                    return `
                    <div class="grupo-vista ${tipo === 'kit' ? 'es-kit' : ''}">
                        <div class="grupo-vista-head">
                            <span class="tipo-badge ${tipo}">${tipo === 'kit' ? '🧩 KIT' : '📄 INDIVIDUAL'}</span>
                            <span class="code">${g.code}</span>
                        </div>
                        <div class="tablewrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th><th>Descripción</th>
                                        <th>Largo</th><th>Ancho</th><th>Alto</th><th>Unidad</th>
                                        <th>ECT</th><th>Corrugado</th><th>P.U.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${g.componentes.map((comp, ci) => `
                                        <tr>
                                            <td>${ci + 1}</td>
                                            <td class="left">${comp.desc}</td>
                                            <td>${comp.lar}</td>
                                            <td>${comp.anc}</td>
                                            <td>${comp.alt}</td>
                                            <td>${comp.uni}</td>
                                            <td>${comp.ect}</td>
                                            <td>${comp.cor}</td>
                                            <td>$${comp.pre}</td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        </div>
                        ${g.subtotal ? `<div class="subtotal-row">Subtotal del grupo: $${g.subtotal}</div>` : ""}
                    </div>
                    `;
                }).join("")}
            </div>`;
        }).join("")}
    `;
}

function renderEsp(panel) {
    panel.innerHTML = `
        <div class="toolbar">
            <div><b>Especificaciones</b> <span class="muted">(${DB.especificaciones.length})</span></div>
            <button class="btn" onclick="openModal('modalEspTipo')">+ Nueva Especificación</button>
        </div>
        ${DB.especificaciones.length === 0 ? '<div class="empty">Sin especificaciones</div>' :
            DB.especificaciones.map((e, i) => renderEspCard(e, i)).join("")}
    `;
}

function renderEspCard(e, i) {
    const tipoTag = e.tipo === "kit" ? "warn" : e.tipo === "rejilla" ? "bad" : "good";
    const tagTipo = `<span class="pill ${tipoTag}">${e.tipo.toUpperCase()}</span>`;
    let extra = "";

    if (e.tipo === "rejilla" && e.partes) {
        extra = `
            <div class="desglose">
                <b>Desglose (X + Y = 1):</b><br>
                ${e.partes.map(p => `${p.sufijo} × ${p.cantidad} → <b>${e.nExterno}-${p.sufijo}</b>`).join(" &nbsp;+&nbsp; ")}
                = 1 número de parte <b>${e.nInterno}</b>
            </div>`;
    }

    if (e.tipo === "kit") {
        const hijas = e.hijas || [];
        const esRej = e.nombre === "REJILLA" || (e.partes && e.partes.length > 0);
        extra = `
            <div class="desglose">
                <b>Ficha principal:</b>
                <span class="badge-tipo ${esRej ? "rejilla" : "caja"}">${esRej ? "REJILLA" : "CAJA"}</span>
                ${e.nInterno} · ${e.nombre} · ${e.largo}×${e.ancho}×${e.alto}
                ${esRej && e.partes ?
                    `<div style="margin-top:6px">${e.partes.map(p =>
                        `${p.sufijo}×${p.cantidad} → <b>${e.nExterno}-${p.sufijo}</b>`).join(" + ")}</div>` : ""}
            </div>
            <div class="desglose">
                <b>Fichas hijas (${hijas.length}):</b>
                <table>
                    <tr><th>Tipo</th><th>N_Interno</th><th>Nombre</th><th>Dimensiones</th></tr>
                    ${hijas.map(h => `<tr>
                        <td><span class="badge-tipo ${h.esRejilla ? "rejilla" : "caja"}">
                            ${h.esRejilla ? "REJILLA" : "CAJA"}</span></td>
                        <td>${h.nInterno}</td><td>${h.nombre}</td>
                        <td>${h.largo}×${h.ancho}×${h.alto}</td>
                    </tr>`).join("")}
                </table>
            </div>`;
    }

    const vincs = vinculadasPorFolio(e.folio);
    const vincHtml = vincs.length ? `
        <div class="muted" style="margin-top:6px">
            🔗 Folio vinculado: ${vincs.map(v => `<span class="pill good">${v.folio} · ${v.pro}</span>`).join(" ")}
        </div>` : `<div class="muted" style="margin-top:6px">🔗 Folio sin cotización asociada</div>`;

    const urlBtn = e.direccion
        ? `<button class="btn ghost small" onclick="verEspecificacion('${e.direccion}')">👁 Ver especificación</button>`
        : `<button class="btn secondary small" disabled>Sin URL</button>`;

    return `<div class="card">
        <div class="head-row">
            <h2>${tagTipo} <span class="pill warn">${e.folio || "—"}</span> ${e.nInterno} — ${e.nombre}</h2>
            <div class="toolbar">
                ${urlBtn}
                <button class="btn edit small" onclick="openPin(${i})">✎ Editar</button>
            </div>
        </div>
        <div class="muted">Cliente: ${e.cliente} · N_Externo: ${e.nExterno} · Proyecto: ${e.proyecto}</div>
        <div class="muted">Dimensiones: ${e.largo}×${e.ancho}×${e.alto} · ${e.ect} (${e.corrugado})
            · Medida ${e.medida} · Código ${e.codigo}</div>
        ${vincHtml}
        ${extra}
    </div>`;
}

function renderAlmacen(panel, cod) {
    const items = DB.especificaciones.filter(e => {
        if (cod === "PP") return e.tipo === "rejilla";
        if (cod === "PT") return e.tipo === "kit" || (e.tipo === "individual" && e.nombre.includes("CAJA"));
        return false;
    });
    panel.innerHTML = `
        <div class="toolbar"><div><b>Almacén ${cod}</b> <span class="muted">(informativo)</span></div></div>
        ${items.length === 0 ? '<div class="empty">Sin elementos</div>' :
            items.map(e => `<div class="card">
                <h2><span class="pill ${cod === "PT" ? "good" : "warn"}">${cod}</span> <span class="pill warn">${e.folio || "—"}</span>
                    ${e.nInterno} — ${e.nombre}</h2>
                <div class="muted">${e.proyecto}</div>
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

/* ================= COTIZACIÓN — GRUPOS ================= */
function openNewCot() {
    cotEditIndex = -1;
    document.getElementById("cot_title").textContent = "Nueva Cotización";
    const f = nextFolio();
    document.getElementById("c_folio").value = f;
    document.getElementById("c_folio_valor").textContent = f;
    ["c_cli", "c_pro", "c_desc"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("cot_items_container").innerHTML = "";
    addGrupoCot();
    updateItemsCount();
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
    updateItemsCount();
    openModal("modalCot");
}

function addGrupoCot(data) {
    const cont = document.getElementById("cot_items_container");
    const div = document.createElement("div");
    div.className = "grupo-cot";
    const idx = cont.children.length;

    div.innerHTML = `
        <div class="grupo-head">
            <span class="num">${idx + 1}</span>
            <span class="tipo-badge individual" data-rol="badge">📄 INDIVIDUAL</span>
            <div class="grupo-actions">
                <button class="btn secondary small" onclick="addComponenteGrupo(this)">+ Componente</button>
                <button class="btn danger small" onclick="this.closest('.grupo-cot').remove(); updateItemsCount();">🗑 Eliminar</button>
            </div>
        </div>
        <div class="grupo-code-input">
            <label>Código / Proyecto:</label>
            <input class="grupo-code" value="${data?.code || ''}" placeholder="Ej. T1XX AR 1600061XB" oninput="actualizarGrupo(this)">
        </div>
        <div class="tablewrap" style="max-height:none;overflow:visible;border:none;">
            <table class="componentes-table">
                <thead>
                    <tr>
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
                    </tr>
                </thead>
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

    // Agregar componentes
    const componentes = data?.componentes || [{}];
    componentes.forEach(comp => addComponenteGrupo(div.querySelector('.grupo-head button'), comp));

    actualizarGrupo(div);
    updateItemsCount();
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
        <td class="col-chica">
            <select class="comp-uni">
                <option ${data?.uni === "cm" || !data?.uni ? "selected" : ""}>cm</option>
                <option ${data?.uni === "mm" ? "selected" : ""}>mm</option>
                <option ${data?.uni === "in" ? "selected" : ""}>in</option>
            </select>
        </td>
        <td class="col-med">
            <select class="comp-ect">
                <option value="">—</option>
                <option value="ECT-26" ${data?.ect === "ECT-26" ? "selected" : ""}>ECT-26</option>
                <option value="ECT-32" ${data?.ect === "ECT-32" ? "selected" : ""}>ECT-32</option>
                <option value="ECT-42" ${data?.ect === "ECT-42" ? "selected" : ""}>ECT-42</option>
                <option value="ECT-80" ${data?.ect === "ECT-80" ? "selected" : ""}>ECT-80</option>
            </select>
        </td>
        <td class="col-med"><input class="comp-cor" readonly value="${data?.cor || ''}"></td>
        <td class="col-precio"><input class="comp-pre" type="number" step="0.01" value="${data?.pre || ''}"></td>
        <td class="col-chica">
            <button class="btn danger small" style="padding:3px 6px" onclick="this.closest('tr').remove(); actualizarGrupo(this)">×</button>
        </td>
    `;
    tbody.appendChild(tr);

    // Auto ECT → Corrugado
    const ectSel = tr.querySelector('.comp-ect');
    const corInp = tr.querySelector('.comp-cor');
    ectSel.addEventListener('change', () => {
        corInp.value = ECT_MAP[ectSel.value] || '';
        actualizarGrupo(ectSel);
    });

    // Recalcular al cambiar precio
    tr.querySelector('.comp-pre').addEventListener('input', () => actualizarGrupo(tr));
}

function actualizarGrupo(el) {
    const grupo = el.closest ? el.closest('.grupo-cot') : el;
    if (!grupo) return;

    // Actualizar badge según cantidad de componentes
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

    // Actualizar suma automática
    const suma = [...grupo.querySelectorAll('.comp-pre')]
        .map(i => Number(i.value) || 0)
        .reduce((a, b) => a + b, 0);
    grupo.querySelector('.suma-auto').textContent = suma.toFixed(2);

    // Renumerar componentes
    grupo.querySelectorAll('.componentes-body tr').forEach((tr, i) => {
        tr.querySelector('.col-chica').textContent = i + 1;
    });
}

function updateItemsCount() {
    const n = document.querySelectorAll("#cot_items_container .grupo-cot").length;
    const c = document.getElementById("cot_items_count");
    if (c) c.textContent = `(${n})`;
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

    const c = {
        folio: document.getElementById("c_folio").value,
        cli: c_cli.value, pro: c_pro.value, desc: c_desc.value,
        grupos
    };
    if (!c.cli || !c.pro) { alert("Cliente y Número de Cotización son obligatorios"); return; }
    if (c.grupos.length === 0) { alert("Agrega al menos 1 grupo"); return; }

    if (cotEditIndex >= 0) DB.cotizaciones[cotEditIndex] = c;
    else DB.cotizaciones.push(c);
    closeModal("modalCot");
    render();
}

/* ================= ESPECIFICACIÓN ================= */
function openEspForm(tipo) {
    espTipoActual = tipo;
    espEditIndex = -1;
    principalEsRejilla = false;
    closeModal("modalEspTipo");

    document.getElementById("e_title").textContent =
        tipo === "individual" ? "Ficha Técnica — Individual"
        : tipo === "rejilla" ? "Ficha Técnica — Rejilla"
        : "Ficha Técnica — Kit";
    document.getElementById("e_sub").textContent =
        tipo === "kit"
            ? "Ficha principal (CAJA por defecto) + fichas hijas (mínimo 1 hija)"
            : "Completa los datos estándar";

    ["e_ni", "e_cli", "e_ne", "e_nom", "e_pro", "e_lar", "e_anc", "e_alt",
     "e_ect", "e_cor", "e_med", "e_cod", "e_dir"].forEach(id => document.getElementById(id).value = "");
    fillFolios();

    configurarFichaPrincipal(tipo);

    document.getElementById("partes_container").innerHTML = "";
    if (tipo === "rejilla") {
        addParte(); addParte();
        document.getElementById("prefijo_rejilla").textContent = "—";
    }

    document.getElementById("hijas_container").innerHTML = "";
    document.getElementById("sec_kit").style.display = tipo === "kit" ? "block" : "none";
    if (tipo === "kit") addHija();

    openModal("modalEsp");
}

function configurarFichaPrincipal(tipo) {
    const bloque = document.getElementById("ficha_principal_block");
    const acciones = document.getElementById("fp_acciones_kit");
    const titulo = document.getElementById("fp_titulo");

    if (tipo === "kit") {
        bloque.classList.add("kit-especial");
        bloque.classList.remove("rejilla-mode");
        acciones.style.display = "inline";
        titulo.textContent = "Ficha principal del Kit";
        document.getElementById("fp_badge").textContent = "CAJA";
        document.getElementById("fp_badge").className = "badge-tipo caja";
        document.getElementById("e_nom").value = "CAJA";
        document.getElementById("sec_rejilla").style.display = "none";
    } else if (tipo === "rejilla") {
        bloque.classList.remove("kit-especial", "rejilla-mode");
        acciones.style.display = "none";
        titulo.textContent = "Ficha de la Rejilla";
        document.getElementById("sec_rejilla").style.display = "block";
    } else {
        bloque.classList.remove("kit-especial", "rejilla-mode");
        acciones.style.display = "none";
        titulo.textContent = "Ficha principal";
        document.getElementById("sec_rejilla").style.display = "none";
    }
}

function convertirPrincipalRejilla() {
    principalEsRejilla = true;
    document.getElementById("fp_badge").textContent = "REJILLA";
    document.getElementById("fp_badge").className = "badge-tipo rejilla";
    document.getElementById("e_nom").value = "REJILLA";
    document.getElementById("ficha_principal_block").classList.add("rejilla-mode");
    const sec = document.getElementById("sec_rejilla");
    sec.style.display = "block";
    if (document.getElementById("partes_container").children.length === 0) {
        addParte(); addParte();
    }
}

function addParte(sufijo, cantidad) {
    const cont = document.getElementById("partes_container");
    const idx = cont.children.length;
    const sufijos = ["A", "B", "C", "D"];
    const div = document.createElement("div");
    div.className = "parte-row";
    div.innerHTML = `
        <label class="muted">Parte<input class="p_suf" value="${sufijo || sufijos[idx] || "X"}"></label>
        <label class="muted">Cantidad<input class="p_can" type="number" value="${cantidad || 1}"></label>
        <label class="muted">Sufijo<input class="p_full" readonly></label>
        <button class="btn danger small" style="height:34px;padding:0 10px" onclick="this.parentElement.remove()">×</button>
    `;
    cont.appendChild(div);
    const upd = () => {
        const pref = document.getElementById("e_ne").value || "N";
        div.querySelector(".p_full").value = pref + "-" + div.querySelector(".p_suf").value;
        const pr = document.getElementById("prefijo_rejilla");
        if (pr) pr.textContent = pref;
    };
    document.getElementById("e_ne").addEventListener("input", upd);
    div.querySelector(".p_suf").addEventListener("input", upd);
    upd();
}

function addHija(h) {
    const cont = document.getElementById("hijas_container");
    const div = document.createElement("div");
    div.className = "ficha-hija" + (h?.esRejilla ? " es-rejilla" : "");
    div.innerHTML = `
        <div class="ficha-head" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
            <h4 style="margin:0;font-size:13px;">
                Ficha hija ${cont.children.length + 1}
                <span class="badge-tipo ${h?.esRejilla ? "rejilla" : "caja"}">
                    ${h?.esRejilla ? "REJILLA" : "CAJA"}
                </span>
            </h4>
            <div class="toolbar">
                <button class="btn secondary small" onclick="convertirHijaRejilla(this)">🔄 Convertir en Rejilla</button>
                <button class="btn danger small" onclick="this.closest('.ficha-hija').remove()">Eliminar</button>
            </div>
        </div>
        <div class="grid">
            <label>N_Interno<input class="h_ni" value="${h?.nInterno || ""}"></label>
            <label>N_Externo<input class="h_ne" value="${h?.nExterno || ""}"></label>
            <label>Nombre<input class="h_nom" list="nombre-options" value="${h?.nombre || "CAJA"}"></label>
            <label>Largo<input class="h_lar" type="number" step="0.1" value="${h?.largo || ""}"></label>
            <label>Ancho<input class="h_anc" type="number" step="0.1" value="${h?.ancho || ""}"></label>
            <label>Alto<input class="h_alt" type="number" step="0.1" value="${h?.alto || ""}"></label>
            <label>ECT
                <select class="h_ect">
                    <option value="">—</option>
                    <option value="ECT-26" ${h?.ect === "ECT-26" ? "selected" : ""}>ECT-26</option>
                    <option value="ECT-32" ${h?.ect === "ECT-32" ? "selected" : ""}>ECT-32</option>
                    <option value="ECT-42" ${h?.ect === "ECT-42" ? "selected" : ""}>ECT-42</option>
                    <option value="ECT-80" ${h?.ect === "ECT-80" ? "selected" : ""}>ECT-80</option>
                </select>
            </label>
            <label>Corrugado (auto)<input class="h_cor" readonly value="${h?.corrugado || ""}"></label>
            <label>Medida (m²)<input class="h_med" value="${h?.medida || ""}"></label>
            <label>Código<input class="h_cod" value="${h?.codigo || ""}"></label>
            <label>Dirección (URL)<input class="h_dir" value="${h?.direccion || ""}"></label>
        </div>
        <div class="h_partes_wrap" style="display:${h?.esRejilla ? "block" : "none"};margin-top:10px">
            <div class="sub" style="font-weight:600;color:#9f1239">Partes de la Rejilla</div>
            <div class="h_partes_container"></div>
            <button class="btn secondary small" style="margin-top:6px" onclick="addParteHija(this)">+ Agregar parte</button>
        </div>
    `;
    cont.appendChild(div);

    const ect = div.querySelector(".h_ect");
    const cor = div.querySelector(".h_cor");
    ect.addEventListener("change", () => { cor.value = ECT_MAP[ect.value] || ""; });

    if (h?.esRejilla && h.partes) {
        const pc = div.querySelector(".h_partes_container");
        pc.innerHTML = "";
        h.partes.forEach(p => addParteHija(null, p.sufijo, p.cantidad));
    }
}

function convertirHijaRejilla(btn) {
    const ficha = btn.closest(".ficha-hija");
    ficha.classList.add("es-rejilla");
    const badge = ficha.querySelector(".badge-tipo");
    badge.textContent = "REJILLA";
    badge.className = "badge-tipo rejilla";
    ficha.querySelector(".h_nom").value = "REJILLA";
    const wrap = ficha.querySelector(".h_partes_wrap");
    wrap.style.display = "block";
    const cont = ficha.querySelector(".h_partes_container");
    if (cont.children.length === 0) {
        addParteHija(btn); addParteHija(btn);
    }
}

function addParteHija(btn, sufijo, cantidad) {
    const ficha = btn ? btn.closest(".ficha-hija") : document.querySelector(".ficha-hija:last-child");
    if (!ficha) return;
    const cont = ficha.querySelector(".h_partes_container");
    const idx = cont.children.length;
    const sufijos = ["A", "B", "C", "D"];
    const div = document.createElement("div");
    div.className = "parte-row";
    div.innerHTML = `
        <label class="muted">Parte<input class="hp_suf" value="${sufijo || sufijos[idx] || "X"}"></label>
        <label class="muted">Cantidad<input class="hp_can" type="number" value="${cantidad || 1}"></label>
        <label class="muted">Sufijo<input class="hp_full" readonly></label>
        <button class="btn danger small" style="height:34px;padding:0 10px" onclick="this.parentElement.remove()">×</button>
    `;
    cont.appendChild(div);
    const neInput = ficha.querySelector(".h_ne");
    const upd = () => {
        const pref = neInput.value || "N";
        div.querySelector(".hp_full").value = pref + "-" + div.querySelector(".hp_suf").value;
    };
    neInput.addEventListener("input", upd);
    div.querySelector(".hp_suf").addEventListener("input", upd);
    upd();
}

function openEditEsp(i) {
    const e = DB.especificaciones[i];
    espTipoActual = e.tipo;
    espEditIndex = i;

    document.getElementById("e_title").textContent = "Editar Especificación — " + e.tipo;
    document.getElementById("e_sub").textContent =
        e.tipo === "kit" ? "Ficha principal + fichas hijas" : "Modifica los datos";

    fillFolios(e.folio);
    e_ni.value = e.nInterno; e_cli.value = e.cliente; e_ne.value = e.nExterno;
    e_nom.value = e.nombre; e_pro.value = e.proyecto;
    e_lar.value = e.largo; e_anc.value = e.ancho; e_alt.value = e.alto;
    e_ect.value = e.ect; e_cor.value = e.corrugado;
    e_med.value = e.medida; e_cod.value = e.codigo; e_dir.value = e.direccion;

    const bloque = document.getElementById("ficha_principal_block");
    const acciones = document.getElementById("fp_acciones_kit");
    document.getElementById("partes_container").innerHTML = "";
    document.getElementById("hijas_container").innerHTML = "";

    if (e.tipo === "kit") {
        bloque.classList.add("kit-especial");
        acciones.style.display = "inline";
        document.getElementById("fp_titulo").textContent = "Ficha principal del Kit";
        principalEsRejilla = (e.nombre === "REJILLA" || (e.partes && e.partes.length > 0));
        document.getElementById("fp_badge").textContent = principalEsRejilla ? "REJILLA" : "CAJA";
        document.getElementById("fp_badge").className = "badge-tipo " + (principalEsRejilla ? "rejilla" : "caja");

        if (principalEsRejilla) {
            document.getElementById("ficha_principal_block").classList.add("rejilla-mode");
            document.getElementById("sec_rejilla").style.display = "block";
            (e.partes || []).forEach(p => addParte(p.sufijo, p.cantidad));
        } else {
            document.getElementById("ficha_principal_block").classList.remove("rejilla-mode");
            document.getElementById("sec_rejilla").style.display = "none";
        }

        document.getElementById("sec_kit").style.display = "block";
        (e.hijas || []).forEach(h => addHija(h));

    } else if (e.tipo === "rejilla") {
        bloque.classList.remove("kit-especial", "rejilla-mode");
        acciones.style.display = "none";
        document.getElementById("fp_titulo").textContent = "Ficha de la Rejilla";
        document.getElementById("sec_rejilla").style.display = "block";
        document.getElementById("sec_kit").style.display = "none";
        (e.partes || []).forEach(p => addParte(p.sufijo, p.cantidad));

    } else {
        bloque.classList.remove("kit-especial", "rejilla-mode");
        acciones.style.display = "none";
        document.getElementById("fp_titulo").textContent = "Ficha principal";
        document.getElementById("sec_rejilla").style.display = "none";
        document.getElementById("sec_kit").style.display = "none";
    }

    openModal("modalEsp");
}

function saveEsp() {
    const e = {
        folio: e_folio.value,
        tipo: espTipoActual,
        nInterno: e_ni.value, cliente: e_cli.value, nExterno: e_ne.value,
        nombre: e_nom.value, proyecto: e_pro.value,
        largo: +e_lar.value, ancho: +e_anc.value, alto: +e_alt.value,
        ect: e_ect.value, corrugado: e_cor.value,
        medida: e_med.value, codigo: e_cod.value, direccion: e_dir.value
    };
    if (!e.folio) { alert("Selecciona un folio heredado"); return; }
    if (!e.nInterno || !e.nombre) { alert("N_Interno y Nombre son obligatorios"); return; }

    if (espTipoActual === "rejilla") {
        e.partes = [...document.querySelectorAll("#partes_container .parte-row")].map(r => ({
            sufijo: r.querySelector(".p_suf").value,
            cantidad: +r.querySelector(".p_can").value
        })).filter(p => p.sufijo);
        if (e.partes.length < 2) { alert("Rejilla requiere al menos 2 partes"); return; }
    }

    if (espTipoActual === "kit") {
        if (principalEsRejilla) {
            e.partes = [...document.querySelectorAll("#partes_container .parte-row")].map(r => ({
                sufijo: r.querySelector(".p_suf").value,
                cantidad: +r.querySelector(".p_can").value
            })).filter(p => p.sufijo);
        }
        e.hijas = [...document.querySelectorAll("#hijas_container .ficha-hija")].map(f => {
            const esRej = f.classList.contains("es-rejilla");
            const h = {
                esRejilla: esRej,
                nInterno: f.querySelector(".h_ni").value,
                nExterno: f.querySelector(".h_ne").value,
                nombre: f.querySelector(".h_nom").value,
                largo: +f.querySelector(".h_lar").value,
                ancho: +f.querySelector(".h_anc").value,
                alto: +f.querySelector(".h_alt").value,
                ect: f.querySelector(".h_ect").value,
                corrugado: f.querySelector(".h_cor").value,
                medida: f.querySelector(".h_med").value,
                codigo: f.querySelector(".h_cod").value,
                direccion: f.querySelector(".h_dir").value
            };
            if (esRej) {
                h.partes = [...f.querySelectorAll(".h_partes_container .parte-row")].map(r => ({
                    sufijo: r.querySelector(".hp_suf").value,
                    cantidad: +r.querySelector(".hp_can").value
                })).filter(p => p.sufijo);
            }
            return h;
        });
        // VALIDACIÓN NUEVA: Kit debe tener ≥ 1 ficha hija (total 2+ elementos)
        if (e.hijas.length < 1) {
            alert("Un Kit debe tener mínimo 2 elementos (la ficha principal + al menos 1 ficha hija).");
            return;
        }
    }

    if (espEditIndex >= 0) DB.especificaciones[espEditIndex] = e;
    else DB.especificaciones.push(e);

    closeModal("modalEsp");
    render();
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    bindEctAuto(document.getElementById("e_ect"), document.getElementById("e_cor"));
    const pin = document.getElementById("pin_input");
    if (pin) pin.addEventListener("keydown", ev => { if (ev.key === "Enter") checkPin(); });
    render();
});

// Fallback por si el DOM ya cargó
if (document.readyState !== "loading") {
    bindEctAuto(document.getElementById("e_ect"), document.getElementById("e_cor"));
    const pin = document.getElementById("pin_input");
    if (pin) pin.addEventListener("keydown", ev => { if (ev.key === "Enter") checkPin(); });
    render();
}

/* ================= GLOBAL ================= */
window.openNewCot = openNewCot;
window.openEditCot = openEditCot;
window.addGrupoCot = addGrupoCot;
window.addComponenteGrupo = addComponenteGrupo;
window.actualizarGrupo = actualizarGrupo;
window.updateItemsCount = updateItemsCount;
window.saveCot = saveCot;

window.openEspForm = openEspForm;
window.openEditEsp = openEditEsp;
window.convertirPrincipalRejilla = convertirPrincipalRejilla;
window.addParte = addParte;
window.addHija = addHija;
window.convertirHijaRejilla = convertirHijaRejilla;
window.addParteHija = addParteHija;
window.saveEsp = saveEsp;

window.openModal = openModal;
window.closeModal = closeModal;
window.verEspecificacion = verEspecificacion;
window.openPin = openPin;
window.checkPin = checkPin;