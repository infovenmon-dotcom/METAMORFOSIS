/* ===========================================================================
   SAVIA DE ALMA — Carrito + promociones
   Reglas (espejo de la configuracion de Shopify):
     - 3+1 GRATIS: por cada 4 articulos, el de menor precio es gratis.
       Escalable: 8 art. = 2 gratis, 12 = 3 gratis...
     - Envio GRATIS desde 45 EUR (Espana Peninsula, base 2,95 EUR).
     - Los precios YA incluyen IVA 21% (no se anaden impuestos).
   =========================================================================== */

const ENVIO_GRATIS_DESDE = 45;
const ENVIO_PENINSULA = 2.95;
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

  /* Calcula subtotal, unidades gratis (3+1) y totales. */
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

    // 3+1: nº de articulos gratis = floor(unidades / 4); gratis = los mas baratos.
    const gratisCount = Math.floor(unidades / 4);
    const ordenados = [...precios].sort((a, b) => a - b);
    let ahorroPromo = 0;
    for (let i = 0; i < gratisCount; i++) ahorroPromo += ordenados[i];

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
    const faltaParaProximoGratis = unidades === 0 ? 4 : (4 - (unidades % 4)) % 4;

    return {
      lineas, unidades, subtotal, gratisCount, ahorroPromo,
      subtotalConPromo, envio, envioGratis, total,
      faltaParaEnvio, faltaParaProximoGratis,
    };
  },

  render() {
    const c = this.calcular();
    // Contador en el header
    document.querySelectorAll('[data-carrito-contador]').forEach(el => {
      el.textContent = c.unidades;
      el.classList.toggle('oculto', c.unidades === 0);
    });
    if (typeof renderPanelCarrito === 'function') renderPanelCarrito(c);
  },
};

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
      <div class="mini-img">${p.emoji}</div>
      <div>
        <div class="titulo">${p.title}</div>
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

  let avisos = '';
  if (c.faltaParaProximoGratis > 0) {
    avisos += `<div class="aviso-promo">Anade <strong>${c.faltaParaProximoGratis}</strong> producto(s) mas y el siguiente sera <strong>GRATIS</strong> (promo 3+1).</div>`;
  } else {
    avisos += `<div class="aviso-promo">¡Genial! Llevas <strong>${c.gratisCount}</strong> producto(s) GRATIS con la promo 3+1.</div>`;
  }

  const pct = Math.min(100, (c.subtotalConPromo / ENVIO_GRATIS_DESDE) * 100);
  let envioAviso;
  if (c.envioGratis) {
    envioAviso = '<div class="aviso-promo">🎉 ¡Tienes <strong>ENVIO GRATIS</strong>!</div>';
  } else {
    envioAviso = `<div class="aviso-promo">Te faltan <strong>${eur(c.faltaParaEnvio)}</strong> para el envio gratis.</div>`;
  }

  resumen.innerHTML = `
    ${avisos}
    ${envioAviso}
    <div class="barra-envio"><span style="width:${pct}%"></span></div>
    <div class="fila-resumen"><span>Subtotal (${c.unidades} art.)</span><span>${eur(c.subtotal)}</span></div>
    ${c.ahorroPromo > 0 ? `<div class="fila-resumen"><span class="ahorro">Promo 3+1 (−${c.gratisCount} gratis)</span><span class="ahorro">−${eur(c.ahorroPromo)}</span></div>` : ''}
    <div class="fila-resumen"><span>Envio</span><span>${c.envioGratis ? 'GRATIS' : eur(c.envio)}</span></div>
    <div class="fila-resumen total"><span>Total</span><span>${eur(c.total)}</span></div>
    <p style="font-size:.72rem;color:var(--texto-suave);text-align:center;margin:8px 0 12px">Precios con IVA (21%) incluido.</p>
    <a class="btn btn-primario btn-bloque" href="#" onclick="alert('En la tienda Shopify real este boton abre el checkout. La promo 3+1 y el envio gratis se aplican automaticamente.');return false;">Finalizar compra</a>
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
