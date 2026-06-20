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

/* Cambiar entre pestañas Productos / Cuentas */
function mostrarTab(t) {
  document.getElementById('tab-prod').classList.toggle('oculto', t !== 'prod');
  document.getElementById('tab-cuentas').classList.toggle('oculto', t !== 'cuentas');
  document.getElementById('tb-prod').classList.toggle('activo', t === 'prod');
  document.getElementById('tb-cuentas').classList.toggle('activo', t === 'cuentas');
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
}

function pintar(cfg) {
  document.getElementById('vacaciones').checked = !!cfg.modoVacaciones;
  const precios = cfg.precios || {};
  const ofertas = cfg.ofertas || {};
  const stock = cfg.stock || {};
  const agotados = cfg.agotados || [];

  const tbody = document.getElementById('filas');
  tbody.innerHTML = PRODUCTOS.map(p => {
    const precio = Object.prototype.hasOwnProperty.call(precios, p.handle) ? precios[p.handle] : p.price;
    const antes = Object.prototype.hasOwnProperty.call(ofertas, p.handle) ? ofertas[p.handle] : '';
    const stk = Object.prototype.hasOwnProperty.call(stock, p.handle) ? stock[p.handle] : '';
    const ago = agotados.indexOf(p.handle) !== -1;
    return `<tr data-handle="${p.handle}" data-nombre="${(p.title || '').toLowerCase()}">
      <td><div class="prod-nombre">${p.title}</div><div class="prod-handle">${p.handle}${p.exclusiveWeb ? ' · exclusivo web' : ''}</div></td>
      <td class="num"><input type="number" step="0.01" min="0" class="f-precio" value="${precio}" data-base="${p.price}"></td>
      <td class="num"><input type="number" step="0.01" min="0" class="f-antes" value="${antes}" placeholder="—"></td>
      <td class="num"><input type="number" step="1" min="0" class="f-stock" value="${stk}" placeholder="∞"></td>
      <td><input type="checkbox" class="f-agotado" ${ago ? 'checked' : ''}></td>
    </tr>`;
  }).join('');
  _msg(document.getElementById('msg'), '', '');
}

function filtrar() {
  const q = (document.getElementById('buscador').value || '').toLowerCase().trim();
  document.querySelectorAll('#filas tr').forEach(tr => {
    tr.classList.toggle('oculto', q && tr.dataset.nombre.indexOf(q) === -1);
  });
}

/* Reúne los valores de la tabla y los guarda en el servidor. */
async function guardar() {
  const msg = document.getElementById('msg');
  const cfg = { modoVacaciones: document.getElementById('vacaciones').checked, agotados: [], stock: {}, precios: {}, ofertas: {} };

  document.querySelectorAll('#filas tr').forEach(tr => {
    const h = tr.dataset.handle;
    const precioEl = tr.querySelector('.f-precio');
    const antesEl = tr.querySelector('.f-antes');
    const stockEl = tr.querySelector('.f-stock');
    const agoEl = tr.querySelector('.f-agotado');

    const base = Number(precioEl.dataset.base);
    const precio = parseFloat(precioEl.value);
    if (isFinite(precio) && precio >= 0 && Math.abs(precio - base) > 0.0001) cfg.precios[h] = precio;

    const antes = parseFloat(antesEl.value);
    if (isFinite(antes) && antes > 0) cfg.ofertas[h] = antes;

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
