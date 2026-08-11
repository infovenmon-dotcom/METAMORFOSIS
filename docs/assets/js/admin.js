/* ===========================================================================
   SAVIA DE ALMA — Panel de control (admin.html)
   Lee/escribe la config (precio, oferta, stock, agotado, vacaciones) en el
   Cloudflare Worker. La contraseña solo vive en memoria de esta página.
   =========================================================================== */

const PRODUCTOS = (window.SAVIA_DATA && window.SAVIA_DATA.products) || [];
let ENDPOINT = ((window.SAVIA_CONFIG && window.SAVIA_CONFIG.checkoutEndpoint) || '').trim();
let PASS = '';

function _base() { return ENDPOINT.replace(/\/+$/, ''); }
function eur(n) { return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function _msg(el, txt, cls) { el.textContent = txt; el.className = 'msg ' + (cls || ''); el.classList.remove('oculto'); }

document.addEventListener('DOMContentLoaded', () => {
  const ep = document.getElementById('endpoint');
  if (ep && ENDPOINT) ep.value = ENDPOINT;
  document.getElementById('pass').addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });
});

async function entrar() {
  const lm = document.getElementById('login-msg');
  ENDPOINT = (document.getElementById('endpoint').value || '').trim();
  PASS = document.getElementById('pass').value || '';
  if (!ENDPOINT) { _msg(lm, 'Falta la dirección del servidor (Worker).', 'err'); return; }
  if (!PASS) { _msg(lm, 'Escribe la contraseña.', 'err'); return; }
  lm.classList.add('oculto');
  // Validar la contraseña ANTES de abrir el panel.
  try {
    const chk = await fetch(_base() + '/admin/check', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + PASS },
    });
    if (chk.status === 401) { _msg(lm, 'Contraseña incorrecta.', 'err'); return; }
    if (!chk.ok) { _msg(lm, 'No se pudo conectar con el servidor. Revisa la dirección.', 'err'); return; }
  } catch (e) {
    _msg(lm, 'No se pudo conectar con el servidor. Revisa la dirección.', 'err'); return;
  }
  await cargar(true);
}

/* Cambiar entre pestañas */
function mostrarTab(t) {
  ['prod', 'envios', 'cuentas', 'beneficio', 'facturas'].forEach(x => {
    document.getElementById('tab-' + x).classList.toggle('oculto', x !== t);
    document.getElementById('tb-' + x).classList.toggle('activo', x === t);
  });
  if (t === 'envios' && !ENVIOS.length) cargarEnvios();
}

/* ---------- Facturas ---------- */
const EMPRESA = {
  nombre: 'VENMON NATURALMENTE SL',
  marca: 'Savia de Alma',
  cif: 'B19399609',
  dir: 'Calle Gabriel Celaya 15 posterior, 28320 Pinto (Madrid)',
  email: 'info@saviadealma.com',
  web: 'saviadealma.com',
};
let FACTURAS = [];

function rangoMesF() {
  const n = new Date();
  document.getElementById('fa-desde').value = _isoFecha(new Date(n.getFullYear(), n.getMonth(), 1));
  document.getElementById('fa-hasta').value = _isoFecha(new Date(n.getFullYear(), n.getMonth() + 1, 0));
  cargarFacturas();
}

async function cargarFacturas() {
  const msg = document.getElementById('fa-msg');
  const desde = document.getElementById('fa-desde').value;
  const hasta = document.getElementById('fa-hasta').value;
  if (!desde || !hasta) { _msg(msg, 'Elige las dos fechas.', 'err'); return; }
  _msg(msg, 'Buscando…', '');
  try {
    const r = await fetch(_base() + '/admin/facturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ desde, hasta }),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    FACTURAS = d.facturas || [];
    const T = document.getElementById('fa-tabla');
    if (!FACTURAS.length) { T.innerHTML = '<p class="nota">No hay facturas en ese periodo. (Se generan con cada pedido pagado, a partir de ahora.)</p>'; _msg(msg, '', ''); return; }
    T.innerHTML = `<table>
      <thead><tr><th>Nº factura</th><th>Fecha</th><th>Cliente</th><th>Total</th><th></th></tr></thead>
      <tbody>${FACTURAS.map(f => `<tr>
        <td>${f.num}</td><td>${f.fechaIso}</td><td>${(f.cliente && f.cliente.nombre) || '—'}</td>
        <td class="num">${_fmtEur(f.totalConIva)}</td>
        <td><button class="btn btn-secundario btn-sm" onclick="verFactura('${f.num}')">Ver / Imprimir</button></td>
      </tr>`).join('')}</tbody></table>`;
    _msg(msg, '', '');
  } catch (e) {
    _msg(msg, 'No se pudieron cargar: ' + e.message, 'err');
  }
}

function verFactura(num) {
  const f = FACTURAS.find(x => x.num === num);
  if (!f) return;
  const cli = f.cliente || {};
  const lineasHtml = (f.lineas || []).map(l => `<tr>
    <td>${l.desc}</td><td style="text-align:center">${l.cant}</td><td style="text-align:right">${_fmtEur(l.importe)}</td>
  </tr>`).join('');
  const dirCli = (cli.direccion || '').replace(/\n/g, '<br>');
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${f.num}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#222;max-width:760px;margin:24px auto;padding:0 18px;font-size:14px}
      .cab{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1D6B50;padding-bottom:14px}
      .cab img{height:64px}
      .emp{font-size:12px;line-height:1.5;text-align:right}
      h1{color:#1D6B50;font-size:22px;margin:18px 0 2px}
      .meta{color:#555;margin-bottom:18px}
      .bloques{display:flex;justify-content:space-between;gap:20px;margin:18px 0}
      .bloque{font-size:13px;line-height:1.5}
      .bloque h3{font-size:12px;text-transform:uppercase;color:#1D6B50;margin:0 0 4px}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{padding:8px;border-bottom:1px solid #eee}
      th{background:#f3f8f5;text-align:left;font-size:12px;text-transform:uppercase}
      .tot{margin-top:14px;margin-left:auto;width:280px}
      .tot tr td{border:none;padding:4px 8px}
      .tot .grand{font-weight:bold;font-size:16px;border-top:2px solid #1D6B50}
      .pie{margin-top:26px;font-size:11px;color:#888;text-align:center}
      @media print{ .noprint{display:none} body{margin:0} }
    </style></head><body>
    <div class="noprint" style="text-align:right;margin-bottom:10px">
      <button onclick="window.print()" style="padding:8px 16px;background:#1D6B50;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">🖨️ Imprimir / Guardar PDF</button>
    </div>
    <div class="cab">
      <div><img src="https://${EMPRESA.web}/assets/img/logo-negro.png" alt="${EMPRESA.marca}"><div style="font-size:13px;color:#1D6B50;font-weight:700;margin-top:2px">${EMPRESA.marca}</div></div>
      <div class="emp"><strong>${EMPRESA.nombre}</strong><br>CIF: ${EMPRESA.cif}<br>${EMPRESA.dir}<br>${EMPRESA.email}</div>
    </div>
    <h1>Factura</h1>
    <div class="meta">Nº <strong>${f.num}</strong> · Fecha: ${f.fechaIso}</div>
    <div class="bloques">
      <div class="bloque"><h3>Cliente</h3>${cli.nombre || '—'}<br>${dirCli || ''}${cli.email ? '<br>' + cli.email : ''}</div>
    </div>
    <table>
      <thead><tr><th>Concepto</th><th style="text-align:center">Cant.</th><th style="text-align:right">Importe (IVA inc.)</th></tr></thead>
      <tbody>${lineasHtml}${f.envio ? `<tr><td>Gastos de envío</td><td style="text-align:center">1</td><td style="text-align:right">${_fmtEur(f.envio)}</td></tr>` : ''}</tbody>
    </table>
    <table class="tot">
      <tr><td>Base imponible</td><td style="text-align:right">${_fmtEur(f.base)}</td></tr>
      <tr><td>IVA (21%)</td><td style="text-align:right">${_fmtEur(f.iva)}</td></tr>
      <tr class="grand"><td>TOTAL</td><td style="text-align:right">${_fmtEur(f.totalConIva)}</td></tr>
    </table>
    <p class="pie">${EMPRESA.marca} · ${EMPRESA.nombre} · ${EMPRESA.web} · Factura simplificada.</p>
    </body></html>`;
  const w = window.open('', '_blank');
  if (!w) { alert('Permite las ventanas emergentes para ver la factura.'); return; }
  w.document.open(); w.document.write(html); w.document.close();
}

/* ---------- Beneficio ---------- */
function rangoMesB() {
  const n = new Date();
  document.getElementById('b-desde').value = _isoFecha(new Date(n.getFullYear(), n.getMonth(), 1));
  document.getElementById('b-hasta').value = _isoFecha(new Date(n.getFullYear(), n.getMonth() + 1, 0));
  calcularBeneficio();
}

async function calcularBeneficio() {
  const msg = document.getElementById('b-msg');
  const desde = document.getElementById('b-desde').value;
  const hasta = document.getElementById('b-hasta').value;
  if (!desde || !hasta) { _msg(msg, 'Elige las dos fechas.', 'err'); return; }
  const ivaSoportado = parseFloat(document.getElementById('b-ivasop').value) || 0;
  _msg(msg, 'Calculando…', '');
  try {
    const r = await fetch(_base() + '/admin/beneficio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ desde, hasta, ivaSoportado }),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    pintarBeneficio(d);
    _msg(msg, '', '');
  } catch (e) {
    _msg(msg, 'No se pudo calcular: ' + e.message, 'err');
  }
}

function pintarBeneficio(d) {
  const margenColor = (d.margen || 0) >= 0 ? 'var(--verde-oscuro)' : '#C0392B';
  document.getElementById('b-resumen').innerHTML = `<div class="fila-top" style="gap:24px;align-items:flex-start">
    <div><div class="nota">Ventas (sin IVA)</div><strong style="font-size:1.15rem">${_fmtEur(d.base || 0)}</strong></div>
    <div><div class="nota">Coste de lo vendido</div><strong style="font-size:1.15rem">${_fmtEur(d.cogs || 0)}</strong></div>
    <div><div class="nota">Comisiones Stripe</div><strong style="font-size:1.15rem">${_fmtEur(d.comisiones || 0)}</strong></div>
    <div><div class="nota">MARGEN / BENEFICIO</div><strong style="font-size:1.3rem;color:${margenColor}">${_fmtEur(d.margen || 0)}</strong></div>
  </div>
  <div class="fila-top" style="gap:24px;margin-top:14px;align-items:flex-start">
    <div><div class="nota">IVA repercutido (ventas)</div><strong>${_fmtEur(d.ivaRepercutido || 0)}</strong></div>
    <div><div class="nota">IVA soportado (compras)</div><strong>${_fmtEur(d.ivaSoportado || 0)}</strong></div>
    <div><div class="nota">IVA a ingresar ≈</div><strong style="color:var(--verde-oscuro)">${_fmtEur(d.ivaIngresar || 0)}</strong></div>
  </div>`;
  const pp = d.porProducto || [];
  const T = document.getElementById('b-tabla');
  if (!pp.length) {
    T.innerHTML = '<p class="nota" style="margin-top:14px">Sin pedidos registrados en ese periodo. (Solo cuentan los pedidos hechos a partir de ahora.)</p>';
    return;
  }
  T.innerHTML = `<table style="margin-top:16px">
    <thead><tr><th>Producto</th><th>Uds. vendidas</th><th>Coste/ud.</th><th>Coste total</th></tr></thead>
    <tbody>${pp.map(x => `<tr>
      <td>${x.titulo || x.handle}</td><td class="num">${x.unidades}</td>
      <td class="num">${_fmtEur(x.costeUnit)}</td><td class="num">${_fmtEur(x.costeTotal)}</td>
    </tr>`).join('')}</tbody></table>`;
}

/* Carga la config actual del servidor y pinta la tabla. */
async function cargar(esLogin) {
  const lm = document.getElementById('login-msg');
  let cfg = {};
  try {
    const r = await fetch(_base() + '/config', { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    cfg = await r.json();
  } catch (e) {
    if (esLogin) { _msg(lm, 'No se pudo conectar con el servidor. Revisa la dirección.', 'err'); return; }
    _msg(document.getElementById('msg'), 'No se pudo cargar la config: ' + e.message, 'err');
    return;
  }
  document.getElementById('login').classList.add('oculto');
  document.getElementById('panel').classList.remove('oculto');
  pintar(cfg);
  rellenarSelectCompra();
}

/* Rellena el desplegable de "Registrar compra" con los productos. */
function rellenarSelectCompra() {
  const sel = document.getElementById('compra-prod');
  if (!sel || sel.options.length) return;
  sel.innerHTML = PRODUCTOS.map(p => `<option value="${p.handle}">${p.title}</option>`).join('');
}

/* Registra una compra: coste/ud = importe/cantidad, actualiza Coste y Stock. */
function registrarCompra() {
  const msg = document.getElementById('compra-msg');
  const h = document.getElementById('compra-prod').value;
  const cant = parseInt(document.getElementById('compra-cant').value, 10);
  const importe = parseFloat(document.getElementById('compra-importe').value);
  if (!h) { _msg(msg, 'Elige un producto.', 'err'); return; }
  if (!(cant > 0)) { _msg(msg, 'Cantidad no válida.', 'err'); return; }
  if (!(importe >= 0)) { _msg(msg, 'Importe no válido.', 'err'); return; }
  const costeCompra = importe / cant;

  const tr = document.querySelector(`#filas tr[data-handle="${h}"]`);
  if (!tr) { _msg(msg, 'Producto no encontrado en la tabla.', 'err'); return; }
  const costeEl = tr.querySelector('.f-coste');
  const stockEl = tr.querySelector('.f-stock');

  // Coste: media ponderada con el stock actual, o reemplazo directo.
  let nuevoCoste = costeCompra;
  const media = document.getElementById('compra-media').checked;
  const stockPrev = stockEl.value !== '' ? Number(stockEl.value) : null;
  const costePrev = costeEl.value !== '' ? Number(costeEl.value) : null;
  if (media && stockPrev !== null && stockPrev > 0 && costePrev !== null) {
    nuevoCoste = (stockPrev * costePrev + cant * costeCompra) / (stockPrev + cant);
  }
  costeEl.value = Math.round(nuevoCoste * 10000) / 10000;

  // Stock: sumar la cantidad recibida.
  if (document.getElementById('compra-stock').checked) {
    const base = stockEl.value !== '' && stockPrev !== null ? stockPrev : 0;
    stockEl.value = base + cant;
  }

  // Persistir (reutiliza el guardado de config) y avisar.
  _msg(msg, 'Guardando compra…', '');
  guardar().then(() => {
    _msg(msg, `✓ Compra registrada · coste/ud. ${_fmtEur(costeCompra)}${document.getElementById('compra-stock').checked ? ' · stock actualizado' : ''}`, 'ok');
    document.getElementById('compra-cant').value = '';
    document.getElementById('compra-importe').value = '';
  });
}

function pintar(cfg) {
  document.getElementById('vacaciones').checked = !!cfg.modoVacaciones;
  const precios = cfg.precios || {};
  const ofertas = cfg.ofertas || {};
  const stock = cfg.stock || {};
  const costes = cfg.costes || {};
  const agotados = cfg.agotados || [];

  const tbody = document.getElementById('filas');
  tbody.innerHTML = PRODUCTOS.map(p => {
    const precio = Object.prototype.hasOwnProperty.call(precios, p.handle) ? precios[p.handle] : p.price;
    const antes = Object.prototype.hasOwnProperty.call(ofertas, p.handle) ? ofertas[p.handle] : '';
    const stk = Object.prototype.hasOwnProperty.call(stock, p.handle) ? stock[p.handle] : '';
    const coste = Object.prototype.hasOwnProperty.call(costes, p.handle) ? costes[p.handle] : '';
    const ago = agotados.indexOf(p.handle) !== -1;
    return `<tr data-handle="${p.handle}" data-nombre="${(p.title || '').toLowerCase()}" data-collection="${p.collection || ''}">
      <td><div class="prod-nombre">${p.title}</div><div class="prod-handle">${p.handle}${p.exclusiveWeb ? ' · exclusivo web' : ''}</div></td>
      <td class="num"><input type="number" step="0.01" min="0" class="f-precio" value="${precio}" data-base="${p.price}"></td>
      <td class="num"><input type="number" step="0.01" min="0" class="f-antes" value="${antes}" placeholder="—"></td>
      <td class="num"><input type="number" step="0.01" min="0" class="f-coste" value="${coste}" placeholder="—"></td>
      <td class="num"><input type="number" step="1" min="0" class="f-stock" value="${stk}" placeholder="∞"></td>
      <td><input type="checkbox" class="f-agotado" ${ago ? 'checked' : ''}></td>
    </tr>`;
  }).join('');
  poblarCategorias();
  filtrar();
  _msg(document.getElementById('msg'), '', '');
}

function filtrar() {
  const q = (document.getElementById('buscador').value || '').toLowerCase().trim();
  const catEl = document.getElementById('cat-filtro');
  const cat = catEl ? catEl.value : '';
  document.querySelectorAll('#filas tr').forEach(tr => {
    const okTexto = !q || tr.dataset.nombre.indexOf(q) !== -1;
    const okCat = !cat || tr.dataset.collection === cat;
    tr.classList.toggle('oculto', !(okTexto && okCat));
  });
}

/* Rellena el desplegable de categorías con las colecciones que tienen producto. */
function poblarCategorias() {
  const sel = document.getElementById('cat-filtro');
  if (!sel) return;
  const vistas = new Map();
  PRODUCTOS.forEach(p => {
    if (p.collection && !vistas.has(p.collection)) vistas.set(p.collection, p.collectionName || p.collection);
  });
  sel.innerHTML = '<option value="">Todas las categorías</option>' +
    [...vistas.entries()].map(([c, n]) => `<option value="${c}">${n}</option>`).join('');
}

/* Reúne los valores de la tabla y los guarda en el servidor. */
async function guardar() {
  const msg = document.getElementById('msg');
  const cfg = { modoVacaciones: document.getElementById('vacaciones').checked, agotados: [], stock: {}, precios: {}, ofertas: {}, costes: {} };

  document.querySelectorAll('#filas tr').forEach(tr => {
    const h = tr.dataset.handle;
    const precioEl = tr.querySelector('.f-precio');
    const antesEl = tr.querySelector('.f-antes');
    const costeEl = tr.querySelector('.f-coste');
    const stockEl = tr.querySelector('.f-stock');
    const agoEl = tr.querySelector('.f-agotado');

    const base = Number(precioEl.dataset.base);
    const precio = parseFloat(precioEl.value);
    if (isFinite(precio) && precio >= 0 && Math.abs(precio - base) > 0.0001) cfg.precios[h] = precio;

    const antes = parseFloat(antesEl.value);
    if (isFinite(antes) && antes > 0) cfg.ofertas[h] = antes;

    const coste = parseFloat(costeEl.value);
    if (isFinite(coste) && coste >= 0 && costeEl.value !== '') cfg.costes[h] = coste;

    if (stockEl.value !== '' && isFinite(Number(stockEl.value))) cfg.stock[h] = Math.max(0, Math.floor(Number(stockEl.value)));

    if (agoEl.checked) cfg.agotados.push(h);
  });

  _msg(msg, 'Guardando…', '');
  try {
    const r = await fetch(_base() + '/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify(cfg),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (data && data.config) pintar(data.config);
    _msg(msg, '✓ Cambios guardados. La web se actualiza en unos segundos.', 'ok');
  } catch (e) {
    _msg(msg, 'No se pudo guardar: ' + e.message, 'err');
  }
}

/* ---------- Centro de cuentas ---------- */
let MOVIMIENTOS = [];
function _fmtEur(n) { return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
function _isoFecha(d) { return d.toISOString().slice(0, 10); }

function rangoMes() {
  const n = new Date();
  document.getElementById('c-desde').value = _isoFecha(new Date(n.getFullYear(), n.getMonth(), 1));
  document.getElementById('c-hasta').value = _isoFecha(new Date(n.getFullYear(), n.getMonth() + 1, 0));
  calcularCuentas();
}
function rangoTrim() {
  const n = new Date();
  const q = Math.floor(n.getMonth() / 3);
  document.getElementById('c-desde').value = _isoFecha(new Date(n.getFullYear(), q * 3, 1));
  document.getElementById('c-hasta').value = _isoFecha(new Date(n.getFullYear(), q * 3 + 3, 0));
  calcularCuentas();
}

async function calcularCuentas() {
  const msg = document.getElementById('c-msg');
  const desde = document.getElementById('c-desde').value;
  const hasta = document.getElementById('c-hasta').value;
  if (!desde || !hasta) { _msg(msg, 'Elige las dos fechas.', 'err'); return; }
  _msg(msg, 'Calculando…', '');
  try {
    const r = await fetch(_base() + '/admin/cuentas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ desde, hasta }),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    MOVIMIENTOS = d.movimientos || [];
    pintarCuentas(d.resumen || {}, MOVIMIENTOS);
    _msg(msg, '', '');
  } catch (e) {
    _msg(msg, 'No se pudo calcular: ' + e.message, 'err');
  }
}

function pintarCuentas(res, movs) {
  const R = document.getElementById('c-resumen');
  R.innerHTML = `<div class="fila-top" style="gap:24px;align-items:flex-start">
    <div><div class="nota">Pedidos</div><strong style="font-size:1.15rem">${res.pedidos || 0}</strong></div>
    <div><div class="nota">Ventas (IVA incl.)</div><strong style="font-size:1.15rem">${_fmtEur(res.ventasBrutas || 0)}</strong></div>
    <div><div class="nota">Base imponible</div><strong style="font-size:1.15rem">${_fmtEur(res.base || 0)}</strong></div>
    <div><div class="nota">IVA (21%)</div><strong style="font-size:1.15rem">${_fmtEur(res.iva || 0)}</strong></div>
    <div><div class="nota">Comisiones Stripe</div><strong style="font-size:1.15rem">${_fmtEur(res.comisiones || 0)}</strong></div>
    <div><div class="nota">Neto recibido</div><strong style="font-size:1.15rem;color:var(--verde-oscuro)">${_fmtEur(res.neto || 0)}</strong></div>
  </div>`;
  const T = document.getElementById('c-tabla');
  if (!movs.length) {
    T.innerHTML = '<p class="nota" style="margin-top:14px">Sin movimientos en ese periodo.</p>';
    document.getElementById('c-export').classList.add('oculto');
    return;
  }
  T.innerHTML = `<table style="margin-top:16px">
    <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Bruto</th><th>Comisión</th><th>Neto</th></tr></thead>
    <tbody>${movs.map(m => `<tr>
      <td>${m.fecha}</td><td>${m.tipo}</td><td>${m.descripcion || ''}</td>
      <td class="num">${_fmtEur(m.bruto)}</td><td class="num">${_fmtEur(m.comision)}</td><td class="num">${_fmtEur(m.neto)}</td>
    </tr>`).join('')}</tbody></table>`;
  document.getElementById('c-export').classList.remove('oculto');
}

function exportarCSV() {
  if (!MOVIMIENTOS.length) return;
  const cab = ['Fecha', 'Tipo', 'Descripcion', 'Bruto', 'Comision', 'Neto'];
  const rows = MOVIMIENTOS.map(m => [
    m.fecha, m.tipo, '"' + String(m.descripcion || '').replace(/"/g, '""') + '"',
    Number(m.bruto).toFixed(2), Number(m.comision).toFixed(2), Number(m.neto).toFixed(2),
  ].join(';'));
  const csv = [cab.join(';'), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cuentas-saviadealma.csv';
  a.click();
}

window.entrar = entrar;
window.cargar = cargar;
window.guardar = guardar;
window.filtrar = filtrar;
window.calcularCuentas = calcularCuentas;
window.rangoMes = rangoMes;
window.rangoTrim = rangoTrim;
window.exportarCSV = exportarCSV;
window.mostrarTab = mostrarTab;
window.calcularBeneficio = calcularBeneficio;
window.rangoMesB = rangoMesB;
window.registrarCompra = registrarCompra;
window.cargarFacturas = cargarFacturas;
window.rangoMesF = rangoMesF;
window.verFactura = verFactura;

/* ---------- Envíos (CTT) ---------- */
let ENVIOS = [];
let CTT_OK = false;

function _fechaCorta(ts) {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
function _dirTexto(e) {
  return [e.line1, e.line2, [e.cp, e.ciudad].filter(Boolean).join(' '), e.provincia]
    .filter(Boolean).join(', ');
}
function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

async function cargarEnvios() {
  const msg = document.getElementById('env-msg');
  const soloPendientes = document.getElementById('env-pend').checked;
  _msg(msg, 'Cargando…', '');
  try {
    const r = await fetch(_base() + '/admin/envios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ soloPendientes }),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    ENVIOS = d.pedidos || [];
    CTT_OK = !!d.ctt;
    pintarEnvios();
    _msg(msg, ENVIOS.length ? ENVIOS.length + ' pedido(s)' : '', 'ok');
  } catch (e) {
    _msg(msg, 'No se pudieron cargar: ' + e.message, 'err');
  }
}

function pintarEnvios() {
  const T = document.getElementById('env-tabla');
  if (!ENVIOS.length) {
    T.innerHTML = '<p class="nota">No hay pedidos ' + (document.getElementById('env-pend').checked ? 'pendientes' : '') + '. (Aparecerán aquí en cuanto entre una venta pagada.)</p>';
    return;
  }
  T.innerHTML = ENVIOS.map((p, i) => {
    const e = p.envio || {};
    const prods = (p.lineas || []).map(l => l.cantidad + '× ' + _esc(l.titulo)).join('<br>');
    const dir = _esc(_dirTexto(e));
    const tel = _esc(e.telefono || '');
    const badge = p.enviado
      ? '<span class="pill" style="background:#e6f4ea;color:#1D6B50">✔ Enviado</span>'
      : '<span class="pill">Pendiente</span>';
    return `<div class="admin-caja" style="margin-bottom:12px">
      <div class="fila-top" style="justify-content:space-between">
        <div><strong>${_esc(e.nombre || '—')}</strong> · ${_fechaCorta(p.fecha)} ${badge}</div>
        <div class="nota">${p.total != null ? _fmtEur(p.total) : ''}</div>
      </div>
      <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:6px;font-size:.86rem">
        <div style="min-width:240px">
          <div>${dir || '—'}</div>
          <div>${tel ? '📞 ' + tel : '<span class="nota">sin teléfono</span>'}</div>
          <div class="nota">${_esc(e.email || '')}</div>
        </div>
        <div style="min-width:160px">${prods}</div>
      </div>
      <div class="fila-top" style="margin-top:10px">
        ${CTT_OK ? `<button class="btn btn-primario btn-sm" onclick="crearEtiquetaCTT(${i})">🏷️ Crear etiqueta CTT</button>` : ''}
        <button class="btn btn-secundario btn-sm" onclick="copiarEnvio(${i})">📋 Copiar datos</button>
        <input type="text" id="trk-${i}" placeholder="Nº seguimiento CTT" value="${_esc(p.tracking || '')}" style="max-width:200px">
        <label style="font-size:.8rem"><input type="checkbox" id="avi-${i}" checked> Avisar al cliente</label>
        <button class="btn btn-secundario btn-sm" onclick="guardarTracking(${i})">${p.enviado ? 'Actualizar' : 'Marcar enviado'}</button>
        <span class="msg" id="env-r-${i}"></span>
      </div>
    </div>`;
  }).join('');
}

function copiarEnvio(i) {
  const p = ENVIOS[i]; if (!p) return;
  const e = p.envio || {};
  const txt = [
    'Nombre: ' + (e.nombre || ''),
    'Dirección: ' + (e.line1 || '') + (e.line2 ? ', ' + e.line2 : ''),
    'CP: ' + (e.cp || ''),
    'Población: ' + (e.ciudad || ''),
    'Provincia: ' + (e.provincia || ''),
    'País: ' + (e.pais || 'ES'),
    'Teléfono: ' + (e.telefono || ''),
    'Email: ' + (e.email || ''),
    'Bultos: 1',
    'Contenido: ' + (p.lineas || []).map(l => l.cantidad + 'x ' + l.titulo).join(', '),
  ].join('\n');
  const done = () => _msg(document.getElementById('env-r-' + i), '¡Copiado!', 'ok');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
  else { const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove(); done(); }
}

async function guardarTracking(i) {
  const p = ENVIOS[i]; if (!p) return;
  const r = document.getElementById('env-r-' + i);
  const tracking = (document.getElementById('trk-' + i).value || '').trim();
  const avisar = document.getElementById('avi-' + i).checked;
  _msg(r, 'Guardando…', '');
  try {
    const resp = await fetch(_base() + '/admin/envio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ clave: p.clave, tracking, avisar }),
    });
    if (resp.status === 401) { _msg(r, 'Contraseña incorrecta.', 'err'); return; }
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const d = await resp.json();
    p.tracking = tracking; p.enviado = true;
    _msg(r, d.avisado ? '✔ Enviado y cliente avisado' : '✔ Marcado como enviado', 'ok');
    if (document.getElementById('env-pend').checked) setTimeout(cargarEnvios, 900);
  } catch (e) {
    _msg(r, 'Error: ' + e.message, 'err');
  }
}

function exportarEnviosCSV() {
  if (!ENVIOS.length) { _msg(document.getElementById('env-msg'), 'Carga los pedidos primero.', 'err'); return; }
  const cab = ['Nombre', 'Direccion', 'CP', 'Poblacion', 'Provincia', 'Pais', 'Telefono', 'Email', 'Bultos', 'Peso_kg', 'Referencia', 'Contenido'];
  const filas = ENVIOS.map(p => {
    const e = p.envio || {};
    const ref = (p.id || '').slice(-10);
    const cont = (p.lineas || []).map(l => l.cantidad + 'x ' + l.titulo).join(' | ');
    return [e.nombre, (e.line1 || '') + (e.line2 ? ' ' + e.line2 : ''), e.cp, e.ciudad, e.provincia, e.pais || 'ES', e.telefono, e.email, 1, 0.5, ref, cont]
      .map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(';');
  });
  const csv = '﻿' + cab.join(';') + '\n' + filas.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'envios-ctt-' + _isoFecha(new Date()) + '.csv';
  a.click();
}

/* Crea el envío en CTT (etiqueta térmica + tracking) con la API. */
async function crearEtiquetaCTT(i) {
  const p = ENVIOS[i]; if (!p) return;
  const r = document.getElementById('env-r-' + i);
  const avisar = document.getElementById('avi-' + i).checked;
  _msg(r, 'Creando envío en CTT…', '');
  try {
    const resp = await fetch(_base() + '/admin/envio/etiqueta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ clave: p.clave, avisar }),
    });
    const d = await resp.json().catch(() => ({}));
    if (resp.status === 401) { _msg(r, 'Contraseña incorrecta.', 'err'); return; }
    if (!resp.ok) { _msg(r, 'CTT: ' + (d.detalle || d.error || ('HTTP ' + resp.status)), 'err'); return; }
    p.tracking = d.tracking || ''; p.enviado = true;
    const trk = document.getElementById('trk-' + i); if (trk) trk.value = p.tracking;
    // Abrir la etiqueta PDF para imprimir en la térmica.
    if (d.pdfBase64) abrirPdfBase64(d.pdfBase64, 'etiqueta-' + p.tracking + '.pdf');
    else if (d.thermal && d.thermal.length) descargarTexto(d.thermal.join('\n'), 'etiqueta-' + p.tracking + '.zpl');
    _msg(r, '✔ Envío ' + p.tracking + (d.avisado ? ' · cliente avisado' : ''), 'ok');
  } catch (e) {
    _msg(r, 'Error: ' + e.message, 'err');
  }
}

function abrirPdfBase64(b64, nombre) {
  try {
    const bin = atob(b64); const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) { const a = document.createElement('a'); a.href = url; a.download = nombre || 'etiqueta.pdf'; a.click(); }
  } catch (e) { /* nada */ }
}
function descargarTexto(txt, nombre) {
  const blob = new Blob([txt], { type: 'text/plain' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; a.click();
}

async function probarEmail() {
  const msg = document.getElementById('env-msg');
  _msg(msg, 'Enviando email de prueba…', '');
  try {
    const r = await fetch(_base() + '/admin/test-email', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + PASS },
    });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    const prov = d.proveedor ? d.proveedor.toUpperCase() : '';
    let cta = '';
    if (d.cuenta && d.cuenta.email) cta = ' · Cuenta: ' + d.cuenta.email;
    else if (d.cuenta && d.cuenta.dominios) cta = ' · Dominios: ' + (d.cuenta.dominios.join(', ') || 'ninguno verificado');
    if (d.ok) { _msg(msg, '✔ ' + prov + ' aceptó el email → ' + d.to + ' (revisa spam)' + cta, 'ok'); }
    else { _msg(msg, '✖ ' + (prov || 'Email') + ' ' + (d.status || '') + ': ' + (d.respuesta || d.motivo || d.error || 'error') + cta, 'err'); }
    console.log('Test email:', d);
  } catch (e) {
    _msg(msg, 'Error: ' + e.message, 'err');
  }
}

window.probarEmail = probarEmail;
window.cargarEnvios = cargarEnvios;
window.copiarEnvio = copiarEnvio;
window.guardarTracking = guardarTracking;
window.exportarEnviosCSV = exportarEnviosCSV;
window.crearEtiquetaCTT = crearEtiquetaCTT;
