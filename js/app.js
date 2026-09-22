/* ================= CONSTANTES ================= */
const ECT_MAP = { "ECT-32": "SENCILLO", "ECT-42": "DOBLE", "ECT-80": "TRIPLE" };
const PIN_EDIT = "1234";

/* ================= DATOS ================= */
const DB = {
    cotizaciones: [
        {
            folio: "FOL-0001", cli: "MOTUS", pro: "COT-2024-001",
            desc: "Caja + Rejilla HONDA",
            items: [
                { tipo: "individual", desc: "Caja corrugada", lar: 60, anc: 38, alt: 24, uni: "cm",
                  ect: "ECT-32", cor: "SENCILLO", pre: 12.50, ne: "1500913M" },
                { tipo: "kit", desc: "Kit HONDA CRV", lar: 60, anc: 38, alt: 24, uni: "cm",
                  ect: "ECT-42", cor: "DOBLE", pre: 25.00, ne: "KIT-HONDA" }
            ]
        },
        {
            folio: "FOL-0002", cli: "DAIMAY", pro: "COT-2024-002",
            desc: "Rejilla semi pedal",
            items: [
                { tipo: "individual", desc: "Rejilla semi pedal", lar: 77.5, anc: 38, alt: 24, uni: "cm",
                  ect: "ECT-42", cor: "DOBLE", pre: 8.75, ne: "PKG0173" }
            ]
        }
    ],
    especificaciones: [
        { folio: "FOL-0001", tipo: "individual", nInterno: "3763221", cliente: "MOTUS",
          nExterno: "1500913M", nombre: "CAJA CON FONDO", proyecto: "PROYECTO LIBRE 1",
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
    sel.innerHTML = `<option value="">— Seleccionar folio —</option>` +
        ultimas5().map(c =>
            `<option value="${c.folio}">${c.folio} — ${c.desc} (${c.cli})</option>`
        ).join("");
    if (selected) sel.value = selected;
}

function bindEctAuto(ect, cor) {
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

function renderCot(panel) {
    panel.innerHTML = `
        <div class="toolbar">
            <div><b>Cotizaciones</b> <span class="muted">(${DB.cotizaciones.length})</span></div>
            <button class="btn" onclick="openNewCot()">+ Nueva Cotización</button>
        </div>
        ${DB.cotizaciones.map((c, i) => `
            <div class="card">
                <h3><span class="tag folio">${c.folio}</span> ${c.cli} — ${c.pro}</h3>
                <div class="muted">${c.desc}</div>
                <div class="muted">${c.items.length} ítem(s) en este folio</div>
                <table>
                    <tr><th>#</th><th>Tipo</th><th>Descripción</th><th>Dimensiones</th><th>ECT</th><th>Precio</th></tr>
                    ${c.items.map((it, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td><span class="tag ${it.tipo === 'kit' ? 'kit' : 'individual'}">${it.tipo.toUpperCase()}</span></td>
                            <td>${it.desc}</td>
                            <td>${it.lar}×${it.anc}×${it.alt} ${it.uni}</td>
                            <td>${it.ect} (${it.cor})</td>
                            <td>$${it.pre}</td>
                        </tr>`).join("")}
                </table>
                <div class="card-actions">
                    <button class="btn edit" onclick="openEditCot(${i})">✎ Editar</button>
                </div>
            </div>`).join("")}
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
    const tagTipo = `<span class="tag ${e.tipo}">${e.tipo.toUpperCase()}</span>`;
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
            🔗 Folio vinculado: ${vincs.map(v => `<span class="tag vinculo">${v.folio} · ${v.pro}</span>`).join(" ")}
        </div>` : `<div class="muted" style="margin-top:6px">🔗 Folio sin cotización asociada</div>`;

    const urlBtn = e.direccion
        ? `<button class="btn ver" onclick="verEspecificacion('${e.direccion}')">👁 Ver especificación</button>`
        : `<button class="btn sec" disabled>Sin URL</button>`;

    return `<div class="card">
        <h3>${tagTipo} <span class="tag folio">${e.folio || "—"}</span> ${e.nInterno} — ${e.nombre}</h3>
        <div class="muted">Cliente: ${e.cliente} · N_Externo: ${e.nExterno} · Proyecto: ${e.proyecto}</div>
        <div class="muted">Dimensiones: ${e.largo}×${e.ancho}×${e.alto} · ${e.ect} (${e.corrugado})
            · Medida ${e.medida} · Código ${e.codigo}</div>
        ${vincHtml}
        ${extra}
        <div class="card-actions">
            ${urlBtn}
            <button class="btn edit" onclick="openPin(${i})">✎ Editar</button>
        </div>
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
                <h3><span class="tag ${cod}">${cod}</span> <span class="tag folio">${e.folio || "—"}</span>
                    ${e.nInterno} — ${e.nombre}</h3>
                <div class="muted">${e.proyecto}</div>
            </div>`).join("")}
    `;
}

function renderMP(panel) {
    panel.innerHTML = `
        <div class="toolbar"><div><b>MP — Láminas</b> <span class="muted">(informativo)</span></div></div>
        ${DB.laminas.map(l => `<div class="card">
            <h3><span class="tag MP">MP</span> ${l.nombre}</h3>
            <div class="muted">Medidas: ${l.largo}×${l.ancho} cm · m²: ${l.m2}</div>
            <div class="muted">Rinde en: ${l.usosEn.join(", ")}</div>
        </div>`).join("")}
    `;
}

/* ================= TABS ================= */
document.querySelectorAll(".tabs button").forEach(b => {
    b.onclick = () => {
        document.querySelectorAll(".tabs button").forEach(x => x.classList.remove("active"));
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

/* ================= COTIZACIÓN MULTI-ÍTEM ================= */
function openNewCot() {
    cotEditIndex = -1;
    document.getElementById("cot_title").textContent = "Nueva Cotización";
    const f = nextFolio();
    document.getElementById("c_folio").value = f;
    document.getElementById("c_folio_valor").textContent = f;
    ["c_cli", "c_pro", "c_desc"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("cot_items_container").innerHTML = "";
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
    c.items.forEach(it => addItemCot(it.tipo, it));
    updateItemsCount();
    openModal("modalCot");
}

function addItemCot(tipo, data) {
    const cont = document.getElementById("cot_items_container");
    const div = document.createElement("div");
    div.className = "item-cot " + (tipo === "kit" ? "kit-item" : "indiv-item");
    div.dataset.tipo = tipo;
    div.innerHTML = `
        <h4>
            <span class="num">${cont.children.length + 1}</span>
            <span class="tipo ${tipo === 'kit' ? 'kit' : 'indiv'}">${tipo.toUpperCase()}</span>
            <button class="btn sec sm" onclick="this.closest('.item-cot').remove(); updateItemsCount();">✕ Eliminar</button>
        </h4>
        <div class="grid">
            <label>Descripción<input class="it_desc" value="${data?.desc || ""}"></label>
            <label>Largo<input class="it_lar" type="number" step="0.1" value="${data?.lar || ""}"></label>
            <label>Ancho<input class="it_anc" type="number" step="0.1" value="${data?.anc || ""}"></label>
            <label>Alto<input class="it_alt" type="number" step="0.1" value="${data?.alt || ""}"></label>
            <label>Unidad
                <select class="it_uni">
                    <option ${data?.uni === "cm" ? "selected" : ""}>cm</option>
                    <option ${data?.uni === "mm" ? "selected" : ""}>mm</option>
                    <option ${data?.uni === "in" ? "selected" : ""}>in</option>
                </select>
            </label>
            <label>ECT
                <select class="it_ect">
                    <option value="">—</option>
                    <option value="ECT-32" ${data?.ect === "ECT-32" ? "selected" : ""}>ECT-32</option>
                    <option value="ECT-42" ${data?.ect === "ECT-42" ? "selected" : ""}>ECT-42</option>
                    <option value="ECT-80" ${data?.ect === "ECT-80" ? "selected" : ""}>ECT-80</option>
                </select>
            </label>
            <label>Corrugado (auto)<input class="it_cor" readonly value="${data?.cor || ""}"></label>
            <label>Precio por unidad<input class="it_pre" type="number" step="0.01" value="${data?.pre || ""}"></label>
            <label>N_Externo<input class="it_ne" value="${data?.ne || ""}"></label>
        </div>
    `;
    cont.appendChild(div);

    const ect = div.querySelector(".it_ect");
    const cor = div.querySelector(".it_cor");
    ect.addEventListener("change", () => { cor.value = ECT_MAP[ect.value] || ""; });

    updateItemsCount();
}

function updateItemsCount() {
    const n = document.querySelectorAll("#cot_items_container .item-cot").length;
    const c = document.getElementById("cot_items_count");
    if (c) c.textContent = `(${n})`;
}

function saveCot() {
    const items = [...document.querySelectorAll("#cot_items_container .item-cot")].map(d => ({
        tipo: d.dataset.tipo,
        desc: d.querySelector(".it_desc").value,
        lar: +d.querySelector(".it_lar").value,
        anc: +d.querySelector(".it_anc").value,
        alt: +d.querySelector(".it_alt").value,
        uni: d.querySelector(".it_uni").value,
        ect: d.querySelector(".it_ect").value,
        cor: d.querySelector(".it_cor").value,
        pre: +d.querySelector(".it_pre").value,
        ne: d.querySelector(".it_ne").value
    }));

    const c = {
        folio: document.getElementById("c_folio").value,
        cli: c_cli.value, pro: c_pro.value, desc: c_desc.value,
        items
    };
    if (!c.cli || !c.pro) { alert("Cliente y Proyecto(=Código) son obligatorios"); return; }
    if (c.items.length === 0) { alert("Agrega al menos 1 ítem a la cotización"); return; }

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
            ? "Ficha principal (CAJA por defecto) + fichas hijas"
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
        <button class="btn sec" style="height:34px" onclick="this.parentElement.remove()">×</button>
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
        <h4>
            Ficha hija ${cont.children.length + 1}
            <span>
                <span class="badge-tipo ${h?.esRejilla ? "rejilla" : "caja"}">
                    ${h?.esRejilla ? "REJILLA" : "CAJA"}
                </span>
                <button class="btn rejilla" style="padding:4px 10px;font-size:11px"
                        onclick="convertirHijaRejilla(this)">
                    🔄 Convertir en Rejilla
                </button>
            </span>
        </h4>
        <div class="grid">
            <label>N_Interno<input class="h_ni" value="${h?.nInterno || ""}"></label>
            <label>N_Externo<input class="h_ne" value="${h?.nExterno || ""}"></label>
            <label>Nombre<input class="h_nom" value="${h?.nombre || "CAJA"}"></label>
            <label>Largo<input class="h_lar" type="number" step="0.1" value="${h?.largo || ""}"></label>
            <label>Ancho<input class="h_anc" type="number" step="0.1" value="${h?.ancho || ""}"></label>
            <label>Alto<input class="h_alt" type="number" step="0.1" value="${h?.alto || ""}"></label>
            <label>ECT
                <select class="h_ect">
                    <option value="">—</option>
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
            <button class="btn sec" style="margin-top:6px" onclick="addParteHija(this)">+ Agregar parte</button>
        </div>
        <button class="btn sec" style="margin-top:8px" onclick="this.parentElement.remove()">Eliminar ficha</button>
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
        <button class="btn sec" style="height:34px" onclick="this.parentElement.remove()">×</button>
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
        if (e.hijas.length === 0) { alert("Kit requiere al menos 1 ficha hija"); return; }
    }

    if (espEditIndex >= 0) DB.especificaciones[espEditIndex] = e;
    else DB.especificaciones.push(e);

    closeModal("modalEsp");
    render();
}

/* ================= INIT ================= */
bindEctAuto(document.getElementById("e_ect"), document.getElementById("e_cor"));
document.getElementById("pin_input").addEventListener("keydown", ev => {
    if (ev.key === "Enter") checkPin();
});
render();