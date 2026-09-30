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
    especificaciones: [
        {
            folio: "FOL-0001",
            grupos: [
                {
                    proyecto: "CRV FR/AR",
                    cliente: "Motus León",
                    fichas: [
                        { nInterno: "3763224", cliente: "Motus León", nExterno: "1500820X",
                          nombre: "CAJA CON FONDO", largo: 60.5, ancho: 38, alto: 72,
                          ect: "ECT-32", corrugado: "SENCILLO", medida: "1.84",
                          codigo: "ESP-LMT-224", direccion: "" },
                        { nInterno: "3763225", cliente: "Motus León", nExterno: "1500820X",
                          nombre: "REJILLA", largo: 59.5, ancho: 37, alto: 71.2,
                          ect: "ECT-32", corrugado: "SENCILLO", medida: "0.86",
                          codigo: "ESP-LMT-225", direccion: "",
                          partes: [{ sufijo: "A", cantidad: 2 }, { sufijo: "B", cantidad: 4 }] }
                    ]
                }
            ]
        }
    ],
    pos: [
        { id: "po-1", cliente: "Motus León", numero: "PO-2026-001", fecha: "2026-02-20",
          nInterno: "3763224", cantidad: 100 },
        { id: "po-2", cliente: "Motus León", numero: "PO-2026-002", fecha: "2026-02-22",
          nInterno: "3763225", cantidad: 250 }
    ],
    requerimientos: [
        {
            folio: "REQ-0001",
            cliente: "Motus León",
            fecha: "2026-02-26",
            po: "PO-2026-001",
            cs: "Angela Mendoza",
            atencion: "Angela Mendoza",
            lineas: [
                { nInterno: "3763224", descripcion: "CAJA CON FONDO", cantidad: 30,
                  po: "PO-2026-001", tipoDoc: "remision" }
            ],
            footer: {
                cumplimiento: "",
                horarioVentana: "",
                contacto: "",
                firmaEmb: "",
                firmaPT: "",
                horarioEntrega: ""
            }
        }
    ],
    laminas: [
        { nombre: "LAMINA 120x140", largo: 120, ancho: 140, m2: 1.68, usosEn: ["3763221", "150-019"] }
    ]
};

/* ================= ESTADO ================= */
let tab = "cot";
let subReq = "req-lista";
let espEditIndex = -1;
let cotEditIndex = -1;
let reqEditIndex = -1;

/* ================= UTILIDADES ================= */

function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function numval(id) {
    const el = document.getElementById(id);
    return el ? (Number(el.value) || 0) : 0;
}

function nextFolio() { return "FOL-" + String(DB.cotizaciones.length + 1).padStart(4, "0"); }
function nextReqFolio() { return "REQ-" + String(DB.requerimientos.length + 1).padStart(4, "0"); }

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

/* ====== Aplanar fichas de especificación para consultas ====== */
function todasLasFichas() {
    const fichas = [];
    DB.especificaciones.forEach(e => {
        (e.grupos || []).forEach(g => {
            (g.fichas || []).forEach(f => {
                fichas.push({
                    ...f,
                    folio: e.folio,
                    proyecto: g.proyecto,
                    clienteGrupo: g.cliente
                });
            });
        });
    });
    return fichas;
}

/* Clientes únicos (desde especificaciones) */
function clientesUnicos() {
    const set = new Set();
    todasLasFichas().forEach(f => {
        const c = (f.cliente || f.clienteGrupo || "").trim();
        if (c) set.add(c);
    });
    return [...set].sort();
}

/* N_Partes de un cliente */
function nPartesDeCliente(cliente) {
    if (!cliente) return [];
    return todasLasFichas().filter(f =>
        (f.cliente || f.clienteGrupo || "").toLowerCase().trim() === cliente.toLowerCase().trim()
    );
}

/* P.O.s de un cliente */
function posDeCliente(cliente) {
    if (!cliente) return DB.pos;
    return DB.pos.filter(p => p.cliente.toLowerCase().trim() === cliente.toLowerCase().trim());
}

/* Saldo de una P.O. (cantidad pedida - suma en requerimientos) */
function saldoPO(poId) {
    const po = DB.pos.find(p => p.id === poId);
    if (!po) return 0;
    const usado = DB.requerimientos.reduce((s, r) =>
        s + (r.lineas || []).filter(l => l.poId === poId).reduce((a, l) => a + (l.cantidad || 0), 0), 0
    );
    return po.cantidad - usado;
}

/* Busca la P.O. por número (fallback cuando no se guarda poId) */
function poPorNumero(numero, cliente) {
    return DB.pos.find(p =>
        p.numero.toLowerCase().trim() === (numero || "").toLowerCase().trim() &&
        (p.cliente || "").toLowerCase().trim() === (cliente || "").toLowerCase().trim()
    );
}

/* ================= RENDER ================= */
function render() {
    const panel = document.getElementById("panel");
    if (tab === "cot") renderCot(panel);
    if (tab === "esp") renderEsp(panel);
    if (tab === "req") renderReq(panel);
    if (tab === "pp")  renderAlmacen(panel, "PP");
    if (tab === "pt")  renderAlmacen(panel, "PT");
    if (tab === "mp")  renderMP(panel);
    refrescarDatalistClientes();
}

function refrescarDatalistClientes() {
    const dl = document.getElementById("clientes-options");
    if (!dl) return;
    dl.innerHTML = clientesUnicos().map(c => `<option value="${c}">`).join("");
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
                    <span class="code">${g.cliente || "—"} · Proyecto: ${g.proyecto || "—"}</span>
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

/* ================= REQUERIMIENTOS ================= */
function renderReq(panel) {
    panel.innerHTML = `
        <div class="subtabs">
            <button class="subtab-btn ${subReq === 'req-lista' ? 'active' : ''}" onclick="setSubReq('req-lista')">📨 Requerimientos</button>
            <button class="subtab-btn ${subReq === 'po-lista' ? 'active' : ''}" onclick="setSubReq('po-lista')">📦 Catálogo de P.O.</button>
        </div>
        <div class="subpanel ${subReq === 'req-lista' ? 'active' : ''}" id="req-lista"></div>
        <div class="subpanel ${subReq === 'po-lista' ? 'active' : ''}" id="po-lista"></div>
    `;
    renderReqLista();
    renderPOLista();
}

function setSubReq(id) {
    subReq = id;
    render();
}

function renderReqLista() {
    const cont = document.getElementById("req-lista");
    if (!cont) return;
    cont.innerHTML = `
        <div class="toolbar">
            <div><b>Requerimientos</b> <span class="muted">(${DB.requerimientos.length})</span></div>
            <button class="btn" onclick="openNewReq()">+ Nuevo Requerimiento</button>
        </div>
        ${DB.requerimientos.length === 0 ? '<div class="empty">Sin requerimientos capturados</div>' :
            DB.requerimientos.map((r, i) => renderReqCard(r, i)).join("")}
    `;
}

function renderReqCard(r, i) {
    const totalPzas = (r.lineas || []).reduce((s, l) => s + (l.cantidad || 0), 0);
    return `<div class="req-vista">
        <div class="req-vista-head">
            <h3><span class="pill warn">${r.folio}</span> ${r.cliente || "—"}</h3>
            <button class="btn edit small" onclick="openEditReq(${i})">✎ Editar</button>
        </div>
        <div class="meta">
            Fecha: <b>${r.fecha || "—"}</b> ·
            N° P.O.: <b>${r.po || "—"}</b> ·
            CS: <b>${r.cs || "—"}</b> ·
            ${(r.lineas || []).length} línea(s) · ${totalPzas} pza(s)
        </div>
        <div class="tablewrap">
            <table>
                <thead><tr>
                    <th>#</th><th>N_Parte</th><th>Descripción</th><th>Cantidad</th>
                    <th>P.O.</th><th>Saldo P.O.</th><th>Documento</th>
                </tr></thead>
                <tbody>
                    ${(r.lineas || []).map((l, li) => {
                        const saldo = l.poId ? saldoPO(l.poId) : "—";
                        const chipClass = typeof saldo === "number" ? (saldo === 0 ? "cero" : saldo < 50 ? "bajo" : "ok") : "";
                        return `<tr>
                            <td>${li + 1}</td>
                            <td>${l.nInterno || "—"}</td>
                            <td class="left">${l.descripcion || "—"}</td>
                            <td>${l.cantidad || 0}</td>
                            <td>${l.po || "—"}</td>
                            <td>${typeof saldo === "number" ? `<span class="saldo-chip ${chipClass}">${saldo}</span>` : "—"}</td>
                            <td>${l.tipoDoc === "factura" ? "📄 Factura" : l.tipoDoc === "remision" ? "📋 Remisión" : "—"}</td>
                        </tr>`;
                    }).join("")}
                </tbody>
            </table>
        </div>
        ${r.footer && (r.footer.cumplimiento || r.footer.contacto) ? `
            <div class="meta" style="margin-top:8px">
                ${r.footer.cumplimiento ? `Cumplimiento: <b>${r.footer.cumplimiento}%</b>` : ""}
                ${r.footer.contacto ? ` · Contacto: <b>${r.footer.contacto}</b>` : ""}
            </div>
        ` : ""}
    </div>`;
}

function renderPOLista() {
    const cont = document.getElementById("po-lista");
    if (!cont) return;
    cont.innerHTML = `
        <div class="toolbar">
            <div><b>Catálogo de P.O.</b> <span class="muted">(${DB.pos.length})</span></div>
            <button class="btn" onclick="openNewPO()">+ Nueva P.O.</button>
        </div>
        ${DB.pos.length === 0 ? '<div class="empty">Sin P.O. capturadas</div>' : `
            <div class="card">
                <div class="tablewrap">
                    <table>
                        <thead><tr>
                            <th>Cliente</th><th>N° P.O.</th><th>Fecha</th>
                            <th>N_Parte</th><th>Descripción</th>
                            <th>Pedido</th><th>Usado</th><th>Saldo</th>
                        </tr></thead>
                        <tbody>
                            ${DB.pos.map(po => {
                                const usado = DB.requerimientos.reduce((s, r) =>
                                    s + (r.lineas || []).filter(l => l.poId === po.id).reduce((a, l) => a + (l.cantidad || 0), 0), 0
                                );
                                const saldo = po.cantidad - usado;
                                const chipClass = saldo === 0 ? "cero" : saldo < 50 ? "bajo" : "ok";
                                const ficha = todasLasFichas().find(f => f.nInterno === po.nInterno);
                                const desc = ficha ? ficha.nombre : "—";
                                return `<tr>
                                    <td class="left">${po.cliente}</td>
                                    <td>${po.numero}</td>
                                    <td>${po.fecha}</td>
                                    <td>${po.nInterno}</td>
                                    <td class="left">${desc}</td>
                                    <td>${po.cantidad}</td>
                                    <td>${usado}</td>
                                    <td><span class="saldo-chip ${chipClass}">${saldo}</span></td>
                                </tr>`;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `}
    `;
}

/* ================= ALMACENES ================= */
function renderAlmacen(panel, cod) {
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

/* Cierre universal */
document.querySelectorAll('.modal-bg').forEach(bg => {
    bg.addEventListener('click', ev => { if (ev.target === bg) bg.classList.remove('open'); });
});
document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') document.querySelectorAll('.modal-bg.open').forEach(bg => bg.classList.remove('open'));
});

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
        badge.textContent = '🧩 KIT'; badge.className = 'tipo-badge kit';
        grupo.classList.add('es-kit'); grupo.classList.remove('es-individual');
    } else {
        badge.textContent = '📄 INDIVIDUAL'; badge.className = 'tipo-badge individual';
        grupo.classList.add('es-individual'); grupo.classList.remove('es-kit');
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
                <select class="grupo-folio" onchange="onFolioChangeEsp(this)"></select>
            </label>
            <label>Cliente
                <input class="grupo-cliente" value="${data?.cliente || ''}" placeholder="Ej. Motus León" oninput="actualizarGrupoEsp(this)">
            </label>
            <label>Proyecto
                <input class="grupo-proyecto" value="${data?.proyecto || ''}" placeholder="Ej. CRV FR/AR" oninput="actualizarGrupoEsp(this)">
            </label>
        </div>
        <div class="tablewrap">
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
    const folioSel = div.querySelector('.grupo-folio');
    fillFolios(folioSel, folioHeredado || data?.folio);
    const fichas = data?.fichas || [{}];
    fichas.forEach(f => addFichaEsp(div.querySelector('.grupo-head button'), f));
    actualizarGrupoEsp(div);
    updateItemsCount("esp");
}

function onFolioChangeEsp(selectEl) {
    const grupo = selectEl.closest('.grupo-esp');
    const folioSeleccionado = selectEl.value;
    if (!folioSeleccionado) { actualizarGrupoEsp(selectEl); return; }
    const cot = DB.cotizaciones.find(c => c.folio === folioSeleccionado);
    if (!cot) { actualizarGrupoEsp(selectEl); return; }
    const clienteInput = grupo.querySelector('.grupo-cliente');
    const proyectoInput = grupo.querySelector('.grupo-proyecto');
    if (!clienteInput.value.trim()) clienteInput.value = cot.cli || '';
    if (!proyectoInput.value.trim()) proyectoInput.value = cot.pro || '';
    actualizarGrupoEsp(selectEl);
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
    const ectSel = tr.querySelector('.f-ect');
    const corInp = tr.querySelector('.f-cor');
    ectSel.addEventListener('change', () => { corInp.value = ECT_MAP[ectSel.value] || ''; actualizarGrupoEsp(ectSel); });
    tr.querySelector('.f-ni').addEventListener('input', () => actualizarGrupoEsp(tr));
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
    if (next && next.classList.contains('partes-row')) {
        next.remove();
        btn.style.background = '#fff';
        return;
    }
    const nExterno = tr.querySelector('.f-ne').value || 'N';
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
    tr.parentNode.insertBefore(trPartes, tr.nextSibling);
    btn.style.background = '#fee2e2';
    const neInput = tr.querySelector('.f-ne');
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
        tr.querySelector('.p-full').value = pref + '-' + tr.querySelector('.p-suf').value;
    });
}

function eliminarFichaEsp(btn) {
    const tr = btn.closest('tr');
    const next = tr.nextElementSibling;
    if (next && next.classList.contains('partes-row')) next.remove();
    tr.remove();
    const tbody = btn.closest('tbody');
    tbody.querySelectorAll('.ficha-tr').forEach((r, i) => { r.querySelector('.col-num').textContent = i + 1; });
    actualizarGrupoEsp(btn);
}

function actualizarGrupoEsp(el) {
    const grupo = el.closest ? el.closest('.grupo-esp') : el;
    if (!grupo) return;
    const nFichas = grupo.querySelectorAll('.fichas-body tr.ficha-tr').length;
    const badge = grupo.querySelector('[data-rol="badge"]');
    if (nFichas >= 2) {
        badge.textContent = '🧩 KIT'; badge.className = 'tipo-badge kit';
        grupo.classList.add('es-kit'); grupo.classList.remove('es-individual');
    } else {
        badge.textContent = '📄 INDIVIDUAL'; badge.className = 'tipo-badge individual';
        grupo.classList.add('es-individual'); grupo.classList.remove('es-kit');
    }
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
        const cliente = g.querySelector('.grupo-cliente').value;
        const proyecto = g.querySelector('.grupo-proyecto').value;
        const fichas = [...g.querySelectorAll('.fichas-body tr.ficha-tr')].map(tr => {
            const f = {
                nInterno: tr.querySelector('.f-ni').value,
                cliente: cliente,
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
        return { folio, cliente, proyecto, fichas };
    }).filter(g => g.fichas.length > 0);

    if (grupos.length === 0) { alert("Agrega al menos 1 grupo con 1 ficha"); return; }
    for (const g of grupos) {
        if (!g.folio) { alert("Cada grupo debe tener folio heredado"); return; }
        if (!g.cliente) { alert("Cada grupo debe tener cliente"); return; }
        if (!g.proyecto) { alert("Cada grupo debe tener proyecto"); return; }
    }

    const e = { folio: grupos[0].folio, grupos };
    if (espEditIndex >= 0) DB.especificaciones[espEditIndex] = e;
    else DB.especificaciones.push(e);
    closeModal("modalEsp");
    render();
}

/* ================================================================
   REQUERIMIENTOS
   ================================================================ */
function openNewReq() {
    reqEditIndex = -1;
    document.getElementById("req_title").textContent = "Nuevo Requerimiento";
    const f = nextReqFolio();
    document.getElementById("r_folio").value = f;
    document.getElementById("r_folio_valor").textContent = f;
    ["r_cli","r_fecha","r_po","r_cs","r_atn","r_cumplimiento","r_horario_ventana","r_contacto","r_firma_emb","r_firma_pt","r_horario_entrega"]
        .forEach(id => document.getElementById(id).value = "");
    document.getElementById("r_fecha").value = new Date().toISOString().slice(0,10);
    document.getElementById("req_items_container").innerHTML = "";
    addLineaReq();
    updateReqCount();
    openModal("modalReq");
}

function openEditReq(i) {
    reqEditIndex = i;
    const r = DB.requerimientos[i];
    document.getElementById("req_title").textContent = "Editar Requerimiento — " + r.folio;
    document.getElementById("r_folio").value = r.folio;
    document.getElementById("r_folio_valor").textContent = r.folio;
    r_cli.value = r.cliente || "";
    r_fecha.value = r.fecha || "";
    r_po.value = r.po || "";
    r_cs.value = r.cs || "";
    r_atn.value = r.atencion || "";
    const f = r.footer || {};
    r_cumplimiento.value = f.cumplimiento || "";
    r_horario_ventana.value = f.horarioVentana || "";
    r_contacto.value = f.contacto || "";
    r_firma_emb.value = f.firmaEmb || "";
    r_firma_pt.value = f.firmaPT || "";
    r_horario_entrega.value = f.horarioEntrega || "";
    const cont = document.getElementById("req_items_container");
    cont.innerHTML = "";
    (r.lineas || []).forEach(l => addLineaReq(l));
    updateReqCount();
    openModal("modalReq");
}

function onClienteReqChange() {
    // Refrescar datalist de N_Parte por cliente en cada línea (si es necesario)
    document.querySelectorAll('#req_items_container .linea-req').forEach(l => {
        const sel = l.querySelector('.l-np');
        if (sel) actualizarSelectNP(sel, val("r_cli"));
    });
}

function actualizarSelectNP(select, cliente) {
    const partes = nPartesDeCliente(cliente);
    const actual = select.value;
    select.innerHTML = `<option value="">— Seleccionar N_Parte —</option>` +
        partes.map(f =>
            `<option value="${f.nInterno}">${f.nInterno} — ${f.nombre}</option>`
        ).join("");
    if (actual) select.value = actual;
}

function addLineaReq(data) {
    const cont = document.getElementById("req_items_container");
    const div = document.createElement("div");
    div.className = "linea-req";
    div.innerHTML = `
        <div class="linea-head">
            <span class="num">${cont.children.length + 1}</span>
            <div class="linea-actions">
                <button class="btn danger small" onclick="this.closest('.linea-req').remove(); updateReqCount();">🗑 Eliminar</button>
            </div>
        </div>
        <div class="linea-grid">
            <label>N_Parte
                <select class="l-np" onchange="onNPChangeReq(this)"></select>
            </label>
            <label>Cantidad
                <input class="l-cant" type="number" min="0" value="${data?.cantidad || ''}">
            </label>
            <label>P.O. del cliente
                <select class="l-po" onchange="onPOChangeReq(this)"></select>
            </label>
            <label>Saldo P.O.
                <input class="l-saldo" readonly value="">
            </label>
            <label>Descripción
                <input class="l-desc" value="${data?.descripcion || ''}" placeholder="Autocompleta">
            </label>
        </div>
        <div class="fact-rem">
            <span class="muted" style="margin-right:6px">Documento:</span>
            <label><input type="radio" name="tipodoc-${cont.children.length}" value="factura" ${data?.tipoDoc === 'factura' ? 'checked' : ''}> 📄 Factura</label>
            <label><input type="radio" name="tipodoc-${cont.children.length}" value="remision" ${data?.tipoDoc === 'remision' ? 'checked' : ''}> 📋 Remisión</label>
        </div>
    `;
    cont.appendChild(div);
    // Inicializar selects
    const selNP = div.querySelector('.l-np');
    actualizarSelectNP(selNP, val("r_cli"));
    if (data?.nInterno) selNP.value = data.nInterno;
    const selPO = div.querySelector('.l-po');
    actualizarSelectPO(selPO, val("r_cli"), data?.poId);
    updateReqCount();
}

function actualizarSelectPO(select, cliente, poId) {
    const pos = posDeCliente(cliente);
    select.innerHTML = `<option value="">— Seleccionar P.O. —</option>` +
        pos.map(p =>
            `<option value="${p.id}" data-numero="${p.numero}" data-np="${p.nInterno}">${p.numero} (${p.nInterno})</option>`
        ).join("");
    if (poId) select.value = poId;
}

function onNPChangeReq(sel) {
    const linea = sel.closest('.linea-req');
    const ficha = todasLasFichas().find(f => f.nInterno === sel.value);
    if (ficha) {
        linea.querySelector('.l-desc').value = ficha.nombre || '';
        // Filtrar P.O.s que coincidan con el N_Parte
        const selPO = linea.querySelector('.l-po');
        const cliente = val("r_cli");
        const pos = posDeCliente(cliente).filter(p => !p.nInterno || p.nInterno === ficha.nInterno);
        selPO.innerHTML = `<option value="">— Seleccionar P.O. —</option>` +
            pos.map(p => `<option value="${p.id}" data-numero="${p.numero}">${p.numero} (${p.nInterno})</option>`).join("");
        actualizarSaldoLinea(linea);
    }
}

function onPOChangeReq(sel) {
    const linea = sel.closest('.linea-req');
    actualizarSaldoLinea(linea);
}

function actualizarSaldoLinea(linea) {
    const selPO = linea.querySelector('.l-po');
    const saldoInput = linea.querySelector('.l-saldo');
    const poId = selPO.value;
    if (!poId) { saldoInput.value = ''; return; }
    const saldo = saldoPO(poId);
    saldoInput.value = saldo;
}

function updateReqCount() {
    const n = document.querySelectorAll('#req_items_container .linea-req').length;
    const c = document.getElementById("req_items_count");
    if (c) c.textContent = `(${n})`;
}

function saveReq() {
    const lineas = [...document.querySelectorAll('#req_items_container .linea-req')].map(l => {
        const selPO = l.querySelector('.l-po');
        const optPO = selPO.options[selPO.selectedIndex];
        const radio = l.querySelector('input[type="radio"]:checked');
        return {
            nInterno: l.querySelector('.l-np').value,
            descripcion: l.querySelector('.l-desc').value,
            cantidad: +l.querySelector('.l-cant').value || 0,
            poId: selPO.value,
            po: optPO && optPO.value ? optPO.dataset.numero : "",
            tipoDoc: radio ? radio.value : ""
        };
    }).filter(l => l.nInterno || l.cantidad);

    const r = {
        folio: document.getElementById("r_folio").value,
        cliente: val("r_cli"),
        fecha: val("r_fecha"),
        po: val("r_po"),
        cs: val("r_cs"),
        atencion: val("r_atn"),
        lineas,
        footer: {
            cumplimiento: val("r_cumplimiento"),
            horarioVentana: val("r_horario_ventana"),
            contacto: val("r_contacto"),
            firmaEmb: val("r_firma_emb"),
            firmaPT: val("r_firma_pt"),
            horarioEntrega: val("r_horario_entrega")
        }
    };

    if (!r.cliente) { alert("Cliente es obligatorio"); return; }
    if (r.lineas.length === 0) { alert("Agrega al menos 1 línea"); return; }

    if (reqEditIndex >= 0) DB.requerimientos[reqEditIndex] = r;
    else DB.requerimientos.push(r);
    closeModal("modalReq");
    render();
}

/* ================================================================
   P.O. (CATÁLOGO)
   ================================================================ */
function openNewPO() {
    document.getElementById("po_title").textContent = "Nueva P.O.";
    document.getElementById("po_cli").value = "";
    document.getElementById("po_num").value = "";
    document.getElementById("po_fecha").value = new Date().toISOString().slice(0,10);
    document.getElementById("po_cant").value = "";
    document.getElementById("po_np").innerHTML = '<option value="">— Seleccionar cliente primero —</option>';
    openModal("modalPO");
}

function onClientePOChange() {
    const cliente = val("po_cli");
    const sel = document.getElementById("po_np");
    const partes = nPartesDeCliente(cliente);
    sel.innerHTML = `<option value="">— Seleccionar N_Parte —</option>` +
        partes.map(f => `<option value="${f.nInterno}">${f.nInterno} — ${f.nombre}</option>`).join("");
}

function savePO() {
    const po = {
        id: "po-" + Date.now(),
        cliente: val("po_cli"),
        numero: val("po_num"),
        fecha: val("po_fecha"),
        nInterno: val("po_np"),
        cantidad: +val("po_cant") || 0
    };
    if (!po.cliente || !po.numero || !po.cantidad) {
        alert("Cliente, N° P.O. y Cantidad son obligatorios"); return;
    }
    DB.pos.push(po);
    closeModal("modalPO");
    render();
    subReq = "po-lista";
    setSubReq("po-lista");
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
window.onFolioChangeEsp = onFolioChangeEsp;
window.addFichaEsp = addFichaEsp;
window.togglePartes = togglePartes;
window.addParteEsp = addParteEsp;
window.eliminarFichaEsp = eliminarFichaEsp;
window.actualizarGrupoEsp = actualizarGrupoEsp;
window.saveEsp = saveEsp;

window.openNewReq = openNewReq;
window.openEditReq = openEditReq;
window.onClienteReqChange = onClienteReqChange;
window.addLineaReq = addLineaReq;
window.onNPChangeReq = onNPChangeReq;
window.onPOChangeReq = onPOChangeReq;
window.saveReq = saveReq;
window.setSubReq = setSubReq;

window.openNewPO = openNewPO;
window.onClientePOChange = onClientePOChange;
window.savePO = savePO;

window.openModal = openModal;
window.closeModal = closeModal;
window.openPin = openPin;
window.checkPin = checkPin;
window.verEspecificacion = verEspecificacion;