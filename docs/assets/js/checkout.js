/* ===========================================================================
   SAVIA DE ALMA — Finalizar compra (Stripe) con derivación a Amazon
   ---------------------------------------------------------------------------
   Flujo:
     1. Carrito vacío            -> no hace nada.
     2. Modo vacaciones          -> manda a la tienda de Amazon.
     3. Sin checkoutEndpoint     -> manda a Amazon (modo escaparate).
     4. Normal (endpoint puesto) -> pide a la función de Stripe una sesión de
        pago segura y redirige al checkout de Stripe.
   La promo (por cada 3, 1 gratis) y el envío los RECALCULA el servidor a partir
   de los precios reales: el navegador nunca decide cuánto se cobra.
   =========================================================================== */

function _amazonURL() {
  return (window.SAVIA_DATA && window.SAVIA_DATA.amazonStore) || 'https://www.amazon.es';
}
function _checkoutEndpoint() {
  return (window.SAVIA_CONFIG && (window.SAVIA_CONFIG.checkoutEndpoint || '').trim()) || '';
}

function _toast(msg) {
  if (typeof mostrarAvisoFlotante === 'function') mostrarAvisoFlotante(msg);
}

function _irAAmazon(msg) {
  if (msg) _toast(msg);
  // Pequeña pausa para que se vea el aviso antes de abrir Amazon.
  setTimeout(() => window.open(_amazonURL(), '_blank', 'noopener'), msg ? 600 : 0);
}

async function finalizarCompra() {
  // Carrito vacío: nada que cobrar.
  if (!window.Carrito || Carrito.totalUnidades() === 0) {
    _toast('Tu carrito está vacío.');
    return;
  }

  // Modo vacaciones: toda compra va a Amazon.
  if (typeof enVacaciones === 'function' && enVacaciones()) {
    _irAAmazon('🌴 Estamos de vacaciones · te llevamos a Amazon para completar la compra');
    return;
  }

  const endpoint = _checkoutEndpoint();

  // Sin pasarela configurada: modo escaparate -> Amazon.
  if (!endpoint) {
    _irAAmazon('Te llevamos a nuestra tienda de Amazon para completar la compra');
    return;
  }

  // Estado "cargando" en el botón.
  const btn = document.getElementById('btn-finalizar');
  const textoOriginal = btn ? btn.textContent : '';
  if (btn) { btn.textContent = 'Conectando con el pago seguro…'; btn.style.pointerEvents = 'none'; btn.style.opacity = '.7'; }

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: Carrito.items,                 // { handle: cantidad }
        cp: (typeof window.savia_getCP === 'function' ? window.savia_getCP() : ''),
        codigo: (Carrito.codigo && Carrito.codigo.code) || '',  // código de descuento aplicado
        returnUrl: window.location.origin + window.location.pathname,
      }),
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    if (!data || !data.url) throw new Error('Respuesta sin URL de pago');

    // Vamos al checkout seguro de Stripe.
    window.location.href = data.url;
  } catch (err) {
    console.error('[SAVIA] Error al iniciar el pago:', err);
    if (btn) { btn.textContent = textoOriginal; btn.style.pointerEvents = ''; btn.style.opacity = ''; }
    // Si el pago falla, no dejamos al cliente colgado: lo derivamos a Amazon.
    _irAAmazon('No hemos podido abrir el pago. Te llevamos a Amazon para completar la compra');
  }
}

window.finalizarCompra = finalizarCompra;
