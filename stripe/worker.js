/* ===========================================================================
   SAVIA DE ALMA — Worker de pago + panel de control (Cloudflare Worker)
   ---------------------------------------------------------------------------
   Un solo Worker con varias rutas:

     POST /            (o /checkout)  -> crea la sesión de Stripe Checkout.
     GET  /config                     -> devuelve la config en vivo (precios,
                                         stock, ofertas, vacaciones) que lee la
                                         web. Público.
     POST /admin/config               -> guarda la config (panel /admin.html).
                                         Protegido con contraseña (ADMIN_PASSWORD).
     POST /webhook                    -> webhook de Stripe; al completarse un
                                         pago, BAJA EL STOCK automáticamente.

   La config se guarda en Cloudflare KV (binding SAVIA_KV) en la clave "config":
     { modoVacaciones, agotados[], stock{}, precios{}, ofertas{} }
   Si no hay KV configurado, todo funciona con valores por defecto (la web usa
   entonces su config.js estática).

   Variables / secretos (Cloudflare -> Settings -> Variables and Secrets):
     STRIPE_SECRET_KEY     (secreto) -> sk_live_... o sk_test_...
     ADMIN_PASSWORD        (secreto) -> contraseña del panel /admin
     STRIPE_WEBHOOK_SECRET (secreto) -> whsec_... (para el webhook de stock)
     PRODUCTS_URL          (texto)   -> URL pública de products.js
     ALLOWED_ORIGIN        (texto)   -> origen de tu web para CORS (o "*")

   Reglas (espejo de cart.js):
     - Por cada 4 unidades, la más barata es gratis (3+1).
     - Envío gratis desde 45 €; si no, 4,95 € (Península).
     - Precios YA con IVA (21%).
   =========================================================================== */

const ENVIO_GRATIS_DESDE = 45;
const ENVIO_PENINSULA = 4.95;
const GRUPO_GRATIS = 4; // por cada 3 comprados, el 4º (más barato) gratis

const CONFIG_DEFAULT = {
  modoVacaciones: false,
  agotados: [],
  stock: {},
  precios: {},
  ofertas: {},
};

let _cacheProductos = null;
let _cacheTs = 0;

/* ---------- Catálogo (precios base + títulos desde products.js) ---------- */
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

/* ---------- Config en KV ---------- */
async function getConfig(env) {
  if (!env.SAVIA_KV) return { ...CONFIG_DEFAULT };
  const raw = await env.SAVIA_KV.get('config');
  if (!raw) return { ...CONFIG_DEFAULT };
  try { return { ...CONFIG_DEFAULT, ...JSON.parse(raw) }; }
  catch { return { ...CONFIG_DEFAULT }; }
}
async function putConfig(env, cfg) {
  if (!env.SAVIA_KV) throw new Error('KV no configurado (binding SAVIA_KV)');
  await env.SAVIA_KV.put('config', JSON.stringify(cfg));
}

/* Precio efectivo de una unidad: override en config.precios si existe. */
function precioEfectivo(handle, productos, cfg) {
  const o = cfg.precios || {};
  if (Object.prototype.hasOwnProperty.call(o, handle)) {
    const v = Number(o[handle]);
    if (isFinite(v) && v >= 0) return v;
  }
  return productos[handle].price;
}

/* ¿Está agotado/no disponible para la venta directa? (espejo de app.js) */
function noVendible(handle, cfg) {
  if (cfg.modoVacaciones) return true;
  if ((cfg.agotados || []).indexOf(handle) !== -1) return true;
  const s = cfg.stock || {};
  if (Object.prototype.hasOwnProperty.call(s, handle)) {
    const n = Number(s[handle]);
    if (!(n > 0)) return true;
  }
  return false;
}

/* Recalcula importes y devuelve unidades a cobrar por handle (ya con promo). */
function calcular(items, productos, cfg) {
  const precios = [];        // un precio por unidad
  const unidadesOrden = [];  // un handle por unidad
  for (const [handle, qty] of Object.entries(items)) {
    const p = productos[handle];
    const n = Math.max(0, parseInt(qty, 10) || 0);
    if (!p || n === 0) continue;
    const precio = precioEfectivo(handle, productos, cfg);
    for (let i = 0; i < n; i++) { precios.push(precio); unidadesOrden.push(handle); }
  }
  const unidades = precios.length;

  // Unidades gratis = las más baratas del pedido (1 por cada 4).
  const gratisCount = Math.floor(unidades / GRUPO_GRATIS);
  unidadesOrden.sort((a, b) => precioEfectivo(a, productos, cfg) - precioEfectivo(b, productos, cfg));
  const freeByHandle = {};
  for (let i = 0; i < gratisCount; i++) {
    const h = unidadesOrden[i];
    freeByHandle[h] = (freeByHandle[h] || 0) + 1;
  }
  const ordenados = [...precios].sort((a, b) => a - b);
  let ahorroPromo = 0;
  for (let i = 0; i < gratisCount; i++) ahorroPromo += ordenados[i];

  const subtotal = precios.reduce((a, b) => a + b, 0);
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

/* ---------- CORS ---------- */
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
function jsonResp(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

/* Comparación de contraseñas en tiempo aproximadamente constante. */
function igualSeguro(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/* ---------- Saneado de la config que llega del panel ---------- */
function numNoNeg(v) { const n = Number(v); return (isFinite(n) && n >= 0) ? n : null; }
function sanearConfig(entrada, handlesValidos) {
  const out = { ...CONFIG_DEFAULT, agotados: [], stock: {}, precios: {}, ofertas: {} };
  out.modoVacaciones = !!entrada.modoVacaciones;
  const valido = (h) => !handlesValidos || handlesValidos.has(h);

  if (Array.isArray(entrada.agotados)) {
    for (const h of entrada.agotados) if (typeof h === 'string' && valido(h)) out.agotados.push(h);
  }
  for (const obj of ['stock', 'precios', 'ofertas']) {
    const src = entrada[obj] || {};
    if (src && typeof src === 'object') {
      for (const [h, v] of Object.entries(src)) {
        if (!valido(h)) continue;
        const n = numNoNeg(v);
        if (n === null) continue;
        out[obj][h] = (obj === 'stock') ? Math.floor(n) : n;
      }
    }
  }
  return out;
}

/* ---------- Verificación de firma del webhook de Stripe ---------- */
async function webhookValido(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false;
  const partes = Object.fromEntries(sigHeader.split(',').map(kv => kv.split('=')));
  const t = partes.t, v1 = partes.v1;
  if (!t || !v1) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const firma = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${rawBody}`));
  const hex = [...new Uint8Array(firma)].map(b => b.toString(16).padStart(2, '0')).join('');
  return igualSeguro(hex, v1);
}

/* ---------- Stripe Checkout ---------- */
async function crearCheckout(request, env, cors) {
  const body = await request.json();
  const items = body.items || {};
  const returnUrl = body.returnUrl || env.ALLOWED_ORIGIN || '*';

  const cfg = await getConfig(env);

  // Seguridad de stock: si estamos de vacaciones, no se cobra aquí.
  if (cfg.modoVacaciones) {
    return jsonResp({ error: 'modo_vacaciones' }, 409, cors);
  }
  // Filtra del carrito lo que no sea vendible (agotado/sin stock).
  const itemsVendibles = {};
  for (const [h, q] of Object.entries(items)) {
    if (!noVendible(h, cfg)) itemsVendibles[h] = q;
  }

  const productos = await cargarProductos(env.PRODUCTS_URL);
  const { cobradas, envio, unidades } = calcular(itemsVendibles, productos, cfg);

  if (unidades === 0 || Object.keys(cobradas).length === 0) {
    return jsonResp({ error: 'Carrito vacío' }, 400, cors);
  }

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
    const precio = precioEfectivo(handle, productos, cfg);
    form.append(`line_items[${i}][quantity]`, String(qty));
    form.append(`line_items[${i}][price_data][currency]`, 'eur');
    form.append(`line_items[${i}][price_data][unit_amount]`, String(Math.round(precio * 100)));
    form.append(`line_items[${i}][price_data][product_data][name]`, p.title);
    i++;
  }

  form.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
  form.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(Math.round(envio * 100)));
  form.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'eur');
  form.append('shipping_options[0][shipping_rate_data][display_name]', envio === 0 ? 'Envío GRATIS' : 'Envío Península');

  // Guardamos las UNIDADES FÍSICAS del pedido (incluidos los regalos) para
  // poder bajar el stock en el webhook.
  const fisicas = {};
  for (const [h, q] of Object.entries(itemsVendibles)) {
    const n = Math.max(0, parseInt(q, 10) || 0);
    if (n > 0 && productos[h]) fisicas[h] = n;
  }
  const cartMeta = JSON.stringify(fisicas);
  if (cartMeta.length <= 480) form.append('metadata[cart]', cartMeta);

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
    return jsonResp({ error: 'Stripe', detalle: session.error?.message }, 502, cors);
  }
  return jsonResp({ url: session.url }, 200, cors);
}

/* ---------- Webhook: baja el stock al completarse el pago ---------- */
async function manejarWebhook(request, env) {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');
  const ok = await webhookValido(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return new Response('Firma inválida', { status: 400 });

  let evento;
  try { evento = JSON.parse(rawBody); } catch { return new Response('JSON inválido', { status: 400 }); }

  if (evento.type === 'checkout.session.completed') {
    const sesion = evento.data?.object || {};
    if (sesion.payment_status === 'paid' && sesion.metadata && sesion.metadata.cart) {
      let cart = {};
      try { cart = JSON.parse(sesion.metadata.cart); } catch { cart = {}; }
      const cfg = await getConfig(env);
      const stock = cfg.stock || {};
      let cambiado = false;
      for (const [h, q] of Object.entries(cart)) {
        // Solo bajamos el stock de referencias que SÍ se controlan por número.
        if (Object.prototype.hasOwnProperty.call(stock, h)) {
          const restante = Math.max(0, Math.floor(Number(stock[h]) || 0) - (parseInt(q, 10) || 0));
          stock[h] = restante;
          cambiado = true;
        }
      }
      if (cambiado) { cfg.stock = stock; await putConfig(env, cfg); }
    }
  }
  return new Response('ok', { status: 200 });
}

/* ---------- Guardar config desde el panel ---------- */
async function guardarConfig(request, env, cors) {
  const auth = request.headers.get('authorization') || '';
  const pass = auth.replace(/^Bearer\s+/i, '');
  if (!env.ADMIN_PASSWORD || !igualSeguro(pass, env.ADMIN_PASSWORD)) {
    return jsonResp({ error: 'no_autorizado' }, 401, cors);
  }
  let entrada;
  try { entrada = await request.json(); } catch { return jsonResp({ error: 'JSON inválido' }, 400, cors); }

  let handlesValidos = null;
  try {
    const productos = await cargarProductos(env.PRODUCTS_URL);
    handlesValidos = new Set(Object.keys(productos));
  } catch { /* si no se puede cargar el catálogo, no filtramos por handle */ }

  const limpio = sanearConfig(entrada, handlesValidos);
  await putConfig(env, limpio);
  return jsonResp({ ok: true, config: limpio }, 200, cors);
}

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || '*';
    const cors = corsHeaders(allowed);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      // Config en vivo para la web (público, solo lectura).
      if (path === '/config' && request.method === 'GET') {
        const cfg = await getConfig(env);
        return jsonResp(cfg, 200, cors);
      }
      // Guardar config desde el panel /admin.
      if (path === '/admin/config' && request.method === 'POST') {
        return await guardarConfig(request, env, cors);
      }
      // Webhook de Stripe (baja el stock). Sin CORS (lo llama Stripe).
      if (path === '/webhook' && request.method === 'POST') {
        return await manejarWebhook(request, env);
      }
      // Pago: raíz o /checkout.
      if ((path === '/' || path === '/checkout') && request.method === 'POST') {
        return await crearCheckout(request, env, cors);
      }
      return new Response('Método o ruta no permitidos', { status: 405, headers: cors });
    } catch (err) {
      console.error(err);
      return jsonResp({ error: String(err) }, 500, cors);
    }
  },
};
