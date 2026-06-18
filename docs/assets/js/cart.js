/* ===========================================================================
   SAVIA DE ALMA — Carrito + promociones
   Reglas (espejo de la configuracion de Shopify):
     - POR CADA 3 PRODUCTOS, 1 GRATIS: el de menor precio de cada grupo de 3.
       Escalable: 3 art. = 1 gratis, 6 = 2 gratis, 9 = 3 gratis...
     - Envio GRATIS desde 45 EUR (Espana Peninsula, base 4,95 EUR).
     - Los precios YA incluyen IVA 21% (no se anaden impuestos).
   =========================================================================== */

const ENVIO_GRATIS_DESDE = 45;
const ENVIO_PENINSULA = 4.95;
const GRUPO_GRATIS = 4; // 3+1: por cada 3 comprados, el 4o (mas barato) es gratis
const STORAGE_KEY = 'savia_carrito';

const Carrito = {
  items: {}, // handle -> qty

  cargar() {
    try { this.items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { this.items = {}; }
  },
  guardar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
  },
  producto(handle) {
    return window.SAVIA_DATA.products.find(p => p.handle === handle);
  },
  añadir(handle, n = 1) {
    this.items[handle] = (this.items[handle] || 0) + n;
    if (this.items[handle] <= 0) delete this.items[handle];
    this.guardar();
    this.render();
  },
  fijar(handle, n) {
    if (n <= 0) delete this.items[handle];
    else this.items[handle] = n;
    this.guardar();
    this.render();
  },
  quitar(handle) {
    delete this.items[handle];
    this.guardar();
    this.render();
  },
  totalUnidades() {
    return Object.values(this.items).reduce((a, b) => a + b, 0);
  },

  /* Calcula subtotal, unidades gratis (1 por cada 3) y totales. */
  calcular() {
    // Lista plana de precios, una entrada por unidad.
    const precios = [];
    const lineas = [];
    for (const [handle, qty] of Object.entries(this.items)) {
      const p = this.producto(handle);
      if (!p) continue;
      lineas.push({ p, qty });
      for (let i = 0; i < qty; i++) precios.push(p.price);
    }
    const unidades = precios.length;
    const subtotal = precios.reduce((a, b) => a + b, 0);

    // Por cada 3 productos, 1 gratis (el mas barato del grupo).
    const gratisCount = Math.floor(unidades / GRUPO_GRATIS);
    const ordenados = [...precios].sort((a, b) => a - b);
    let ahorroPromo = 0;
    for (let i = 0; i < gratisCount; i++) ahorroPromo += ordenados[i];

    // Marca que unidades son el regalo: las mas baratas del pedido.
    const unidadesOrden = [];
    for (const { p, qty } of lineas) for (let i = 0; i < qty; i++) unidadesOrden.push(p.handle);
    unidadesOrden.sort((a, b) => this.producto(a).price - this.producto(b).price);
    const freeByHandle = {};
    for (let i = 0; i < gratisCount; i++) {
      const h = unidadesOrden[i];
      freeByHandle[h] = (freeByHandle[h] || 0) + 1;
    }

    const subtotalConPromo = subtotal - ahorroPromo;

    let envio = 0;
    let envioGratis = false;
    if (unidades === 0) {
      envio = 0;
    } else if (subtotalConPromo >= ENVIO_GRATIS_DESDE) {
      envio = 0;
      envioGratis = true;
    } else {
      envio = ENVIO_PENINSULA;
    }

    const total = subtotalConPromo + envio;
    const faltaParaEnvio = Math.max(0, ENVIO_GRATIS_DESDE - subtotalConPromo);
    const faltaParaProximoGratis = unidades === 0 ? GRUPO_GRATIS : (GRUPO_GRATIS - (unidades % GRUPO_GRATIS)) % GRUPO_GRATIS;
    // progreso dentro del grupo de 3 en curso (0..3) para la barra/cuenta atras
    const progresoGrupo = faltaParaProximoGratis === 0 ? GRUPO_GRATIS : GRUPO_GRATIS - faltaParaProximoGratis;

    return {
      lineas, unidades, subtotal, gratisCount, ahorroPromo, freeByHandle,
      subtotalConPromo, envio, envioGratis, total,
      faltaParaEnvio, faltaParaProximoGratis, progresoGrupo, grupoGratis: GRUPO_GRATIS,
    };
  },

  render() {
    const c = this.calcular();
    // Contador en el header
    document.querySelectorAll('[data-carrito-contador]').forEach(el => {
      el.textContent = c.unidades;
      el.classList.toggle('oculto', c.unidades === 0);
    });
    // Avisos tipo Temu al cruzar un umbral (solo tras una interaccion, no al cargar)
    if (this._prev) {
      if (c.gratisCount > this._prev.gratisCount) {
        mostrarAvisoFlotante('🎁 ¡Tienes 1 producto de REGALO! (por cada 3, el de menor valor gratis)');
        abrirCarrito();
      }
      if (c.envioGratis && !this._prev.envioGratis) {
        mostrarAvisoFlotante('🚚 ¡Acabas de conseguir el ENVÍO GRATIS!');
      }
    }
    this._prev = { gratisCount: c.gratisCount, envioGratis: c.envioGratis };
    actualizarBarraPromo(c);
    if (typeof renderPanelCarrito === 'function') renderPanelCarrito(c);
  },
};

/* Barra de estado de promociones en la propia pagina de compra (mientras
   navegas), con el progreso hacia el regalo (1 por cada 3) y al envio gratis. */
function actualizarBarraPromo(c) {
  const bar = document.getElementById('barra-promo');
  if (!bar) return;
  if (c.unidades === 0) { bar.classList.add('oculto'); bar.innerHTML = ''; return; }
  bar.classList.remove('oculto');
  const falta = c.faltaParaProximoGratis;
  const regalo = falta === 0
    ? `🎁 ¡Llevas <strong>${c.gratisCount} de regalo</strong>!`
    : (falta === 1
        ? `🎁 <strong>1 producto más</strong> y el 3º es de regalo`
        : `🎁 Añade <strong>${falta}</strong> y llévate 1 de regalo`);
  const envio = c.envioGratis
    ? `🚚 <strong>¡Envío GRATIS!</strong>`
    : `🚚 Te faltan <strong>${eur(c.faltaParaEnvio)}</strong> para el envío gratis`;
  bar.innerHTML = `<span>${regalo}</span><span class="barra-promo-sep">·</span><span>${envio}</span>`;
}

/* Aviso flotante (toast) estilo Temu: salta cuando se desbloquea algo. */
function mostrarAvisoFlotante(msg) {
  let cont = document.getElementById('avisos-flotantes');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'avisos-flotantes';
    document.body.appendChild(cont);
  }
  const t = document.createElement('div');
  t.className = 'toast-promo';
  t.innerHTML = msg;
  cont.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function eur(n) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

/* ---------- Panel lateral del carrito ---------- */
function renderPanelCarrito(c) {
  const cont = document.getElementById('carrito-items');
  const resumen = document.getElementById('carrito-resumen');
  if (!cont || !resumen) return;

  if (c.unidades === 0) {
    cont.innerHTML = '<div class="carrito-vacio">Tu carrito esta vacio.<br>Descubre nuestra cosmetica solida natural.</div>';
    resumen.innerHTML = '';
    return;
  }

  cont.innerHTML = c.lineas.map(({ p, qty }) => `
    <div class="linea-item">
      <div class="mini-img"><img src="${p.image}" alt="${p.title}"></div>
      <div>
        <div class="titulo">${p.title}</div>
        ${c.freeByHandle && c.freeByHandle[p.handle] ? `<div class="gratis">🎁 ${c.freeByHandle[p.handle]} de regalo (−${eur(c.freeByHandle[p.handle] * p.price)})</div>` : ''}
        <div class="card-precio" style="font-size:.9rem;margin:2px 0 0">${eur(p.price)}</div>
        <div class="cantidad">
          <button aria-label="Quitar uno" onclick="Carrito.añadir('${p.handle}', -1)">−</button>
          <span>${qty}</span>
          <button aria-label="Anadir uno" onclick="Carrito.añadir('${p.handle}', 1)">+</button>
          <button class="quitar" onclick="Carrito.quitar('${p.handle}')">eliminar</button>
        </div>
      </div>
      <div></div>
    </div>
  `).join('');

  // --- Incentivo "producto gratis" con cuenta atras y barra de progreso ---
  const falta = c.faltaParaProximoGratis;
  const pgRegalo = Math.round((c.progresoGrupo / c.grupoGratis) * 100);
  let regalo;
  if (falta === 0) {
    regalo = `<div class="aviso-regalo conseguido">🎉 ¡Llevas <strong>${c.gratisCount} producto${c.gratisCount > 1 ? 's' : ''} de regalo</strong>! Añade <strong>${c.grupoGratis}</strong> más y consigue otro.
      <div class="barra-regalo"><span style="width:100%"></span></div></div>`;
  } else if (falta === 1) {
    regalo = `<div class="aviso-regalo cerca">🎁 ¡Solo <strong>1 producto más</strong> y tienes <strong>1 de regalo</strong>!
      <div class="barra-regalo"><span style="width:${pgRegalo}%"></span></div></div>`;
  } else {
    regalo = `<div class="aviso-regalo">🎁 Añade <strong>${falta} productos</strong> y consigue <strong>1 de regalo</strong> (por cada 3, 1 gratis).
      <div class="barra-regalo"><span style="width:${pgRegalo}%"></span></div></div>`;
  }

  const pct = Math.min(100, (c.subtotalConPromo / ENVIO_GRATIS_DESDE) * 100);
  let envioAviso;
  if (c.envioGratis) {
    envioAviso = '<div class="aviso-regalo conseguido">🚚 ¡Tienes <strong>ENVÍO GRATIS</strong>!</div>';
  } else {
    envioAviso = `<div class="aviso-envio">🚚 Te faltan <strong>${eur(c.faltaParaEnvio)}</strong> para el <strong>envío gratis</strong>.</div>`;
  }

  resumen.innerHTML = `
    ${regalo}
    ${envioAviso}
    <div class="aviso-bienvenida">🎁 ¿Tu primer pedido? Te regalamos <strong>jabonera de bambú + esponja exfoliante</strong>.</div>
    <div class="barra-envio"><span style="width:${pct}%"></span></div>
    <div class="fila-resumen"><span>Subtotal (${c.unidades} art.)</span><span>${eur(c.subtotal)}</span></div>
    ${c.ahorroPromo > 0 ? `<div class="fila-resumen"><span class="ahorro">Regalo · ${c.gratisCount} gratis</span><span class="ahorro">−${eur(c.ahorroPromo)}</span></div>` : ''}
    <div class="fila-resumen"><span>Envío</span><span>${c.envioGratis ? 'GRATIS' : eur(c.envio)}</span></div>
    <div class="fila-resumen total"><span>Total</span><span>${eur(c.total)}</span></div>
    <p style="font-size:.72rem;color:var(--texto-suave);text-align:center;margin:8px 0 12px">Por cada 3 productos, 1 de regalo (el de menor valor) · Precios con IVA (21%) · Envío peninsular ${eur(ENVIO_PENINSULA)}.</p>
    <a class="btn btn-primario btn-bloque" href="#" onclick="alert('En la tienda Shopify real este boton abre el checkout. La promo (por cada 3 productos, 1 gratis) y el envio gratis se aplican automaticamente.');return false;">Finalizar compra</a>
    <button class="btn btn-secundario btn-bloque" style="margin-top:8px" onclick="cerrarCarrito()">← Seguir comprando</button>
  `;
}

/* ---------- Apertura / cierre ---------- */
function abrirCarrito() {
  document.getElementById('panel-carrito')?.classList.add('abierto');
  document.getElementById('overlay')?.classList.add('abierto');
}
function cerrarCarrito() {
  document.getElementById('panel-carrito')?.classList.remove('abierto');
  document.getElementById('overlay')?.classList.remove('abierto');
}

Carrito.cargar();
document.addEventListener('DOMContentLoaded', () => Carrito.render());
