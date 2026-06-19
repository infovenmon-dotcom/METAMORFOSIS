/* ===========================================================================
   SAVIA DE ALMA — Función de pago Stripe (Cloudflare Worker)
   ---------------------------------------------------------------------------
   Crea una sesión de Stripe Checkout de forma SEGURA. El navegador solo envía
   qué productos y cuántos; aquí se buscan los precios REALES (desde products.js
   de la web) y se recalcula la promo "por cada 3, 1 gratis" + el envío. Así el
   cliente nunca puede manipular el importe.

   Variables de entorno (Settings -> Variables and Secrets en Cloudflare):
     STRIPE_SECRET_KEY  (secreto)  -> sk_live_... o sk_test_...
     PRODUCTS_URL       (texto)    -> URL pública de products.js
                                      ej: https://TU-USUARIO.github.io/REPO/assets/js/products.js
     ALLOWED_ORIGIN     (texto)    -> origen de tu web para CORS
                                      ej: https://TU-USUARIO.github.io   (o "*" en pruebas)

   Reglas (espejo de cart.js):
     - Por cada 4 unidades, la más barata es gratis (3+1).
     - Envío gratis desde 45 €; si no, 4,95 € (Península).
     - Precios YA con IVA (21%).
   =========================================================================== */

const ENVIO_GRATIS_DESDE = 45;
const ENVIO_PENINSULA = 4.95;
const GRUPO_GRATIS = 4; // por cada 3 comprados, el 4º (más barato) gratis

let _cacheProductos = null;
let _cacheTs = 0;

async function cargarProductos(url) {
  const ahora = Date.now();
  if (_cacheProductos && (ahora - _cacheTs) < 5 * 60 * 1000) return _cacheProductos; // cache 5 min
  const resp = await fetch(url, { cf: { cacheTtl: 300 } });
  if (!resp.ok) throw new Error('No se pudo leer products.js: HTTP ' + resp.status);
  const txt = await resp.text();
  const json = txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1);
  const data = JSON.parse(json);
  const map = {};
  for (const p of data.products) map[p.handle] = { price: p.price, title: p.title };
  _cacheProductos = map;
  _cacheTs = ahora;
  return map;
}

/* Recalcula importes y devuelve unidades a cobrar por handle (ya con promo). */
function calcular(items, productos) {
  const precios = [];        // un precio por unidad
  const unidadesOrden = [];  // un handle por unidad
  for (const [handle, qty] of Object.entries(items)) {
    const p = productos[handle];
    const n = Math.max(0, parseInt(qty, 10) || 0);
    if (!p || n === 0) continue;
    for (let i = 0; i < n; i++) { precios.push(p.price); unidadesOrden.push(handle); }
  }
  const unidades = precios.length;
  const subtotal = precios.reduce((a, b) => a + b, 0);

  // Unidades gratis = las más baratas del pedido (1 por cada 4).
  const gratisCount = Math.floor(unidades / GRUPO_GRATIS);
  unidadesOrden.sort((a, b) => productos[a].price - productos[b].price);
  const freeByHandle = {};
  for (let i = 0; i < gratisCount; i++) {
    const h = unidadesOrden[i];
    freeByHandle[h] = (freeByHandle[h] || 0) + 1;
  }
  const ordenados = [...precios].sort((a, b) => a - b);
  let ahorroPromo = 0;
  for (let i = 0; i < gratisCount; i++) ahorroPromo += ordenados[i];

  const subtotalConPromo = subtotal - ahorroPromo;
  const envio = unidades === 0 ? 0 : (subtotalConPromo >= ENVIO_GRATIS_DESDE ? 0 : ENVIO_PENINSULA);

  // Unidades realmente cobradas por handle (cantidad - regalos).
  const cobradas = {};
  for (const [handle, qty] of Object.entries(items)) {
    const n = Math.max(0, parseInt(qty, 10) || 0);
    if (n === 0 || !productos[handle]) continue;
    const cobra = n - (freeByHandle[handle] || 0);
    if (cobra > 0) cobradas[handle] = cobra;
  }
  return { cobradas, envio, unidades };
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || '*';
    const cors = corsHeaders(allowed);

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') {
      return new Response('Método no permitido', { status: 405, headers: cors });
    }

    try {
      const body = await request.json();
      const items = body.items || {};
      const returnUrl = body.returnUrl || allowed;

      const productos = await cargarProductos(env.PRODUCTS_URL);
      const { cobradas, envio, unidades } = calcular(items, productos);

      if (unidades === 0 || Object.keys(cobradas).length === 0) {
        return new Response(JSON.stringify({ error: 'Carrito vacío' }), {
          status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      // --- Construir la sesión de Stripe (form-urlencoded) ---
      const form = new URLSearchParams();
      form.append('mode', 'payment');
      form.append('success_url', returnUrl + '?pago=ok');
      form.append('cancel_url', returnUrl + '?pago=cancelado');
      form.append('locale', 'es');
      form.append('billing_address_collection', 'auto');
      form.append('shipping_address_collection[allowed_countries][0]', 'ES');

      let i = 0;
      for (const [handle, qty] of Object.entries(cobradas)) {
        const p = productos[handle];
        form.append(`line_items[${i}][quantity]`, String(qty));
        form.append(`line_items[${i}][price_data][currency]`, 'eur');
        form.append(`line_items[${i}][price_data][unit_amount]`, String(Math.round(p.price * 100)));
        form.append(`line_items[${i}][price_data][product_data][name]`, p.title);
        i++;
      }

      // Envío como opción de envío de Stripe (0 € = GRATIS).
      form.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
      form.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(Math.round(envio * 100)));
      form.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'eur');
      form.append('shipping_options[0][shipping_rate_data][display_name]', envio === 0 ? 'Envío GRATIS' : 'Envío Península');

      const stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + env.STRIPE_SECRET_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });

      const session = await stripeResp.json();
      if (!stripeResp.ok) {
        console.error('Stripe error:', session);
        return new Response(JSON.stringify({ error: 'Stripe', detalle: session.error?.message }), {
          status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  },
};
