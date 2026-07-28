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
     - Envío: Península 3,95 € (gratis desde 45 €) o Baleares 6 € (lo elige el cliente).
     - Precios YA con IVA (21%).
   =========================================================================== */

const ENVIO_GRATIS_DESDE = 45;
const ENVIO_PENINSULA = 3.95;
const ENVIO_BALEARES = 6;
const GRUPO_GRATIS = 4; // por cada 3 comprados, el 4º (más barato) gratis

const CONFIG_DEFAULT = {
  modoVacaciones: false,
  agotados: [],
  stock: {},
  precios: {},
  ofertas: {},
  costes: {},
};

let _cacheProductos = null;
let _cacheTs = 0;

/* Zona de envío a partir del código postal español.
   '07' = Baleares; 35/38 (Canarias), 51 (Ceuta), 52 (Melilla) = no se envía. */
function zonaPorCP(cp) {
  cp = String(cp || '').trim();
  if (!/^\d{5}$/.test(cp)) return null;
  const p = cp.slice(0, 2);
  if (p === '07') return 'baleares';
  if (p === '35' || p === '38' || p === '51' || p === '52') return 'no';
  return 'peninsula';
}

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

/* Recalcula importes y devuelve unidades a cobrar por handle (ya con promo).
   `zona` ('peninsula' | 'baleares') determina el gasto de envío. */
function calcular(items, productos, cfg, zona) {
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
  let envio;
  if (unidades === 0) envio = 0;
  else if (zona === 'baleares') envio = ENVIO_BALEARES;
  else envio = subtotalConPromo >= ENVIO_GRATIS_DESDE ? 0 : ENVIO_PENINSULA;

  // Unidades realmente cobradas por handle (cantidad - regalos).
  const cobradas = {};
  for (const [handle, qty] of Object.entries(items)) {
    const n = Math.max(0, parseInt(qty, 10) || 0);
    if (n === 0 || !productos[handle]) continue;
    const cobra = n - (freeByHandle[handle] || 0);
    if (cobra > 0) cobradas[handle] = cobra;
  }
  return { cobradas, freeByHandle, envio, unidades };
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
  const out = { ...CONFIG_DEFAULT, agotados: [], stock: {}, precios: {}, ofertas: {}, costes: {} };
  out.modoVacaciones = !!entrada.modoVacaciones;
  const valido = (h) => !handlesValidos || handlesValidos.has(h);

  if (Array.isArray(entrada.agotados)) {
    for (const h of entrada.agotados) if (typeof h === 'string' && valido(h)) out.agotados.push(h);
  }
  for (const obj of ['stock', 'precios', 'ofertas', 'costes']) {
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

  // Zona de envío según el código postal que el cliente puso en el carrito.
  const zona = zonaPorCP(body.cp);
  if (zona === 'no') return jsonResp({ error: 'zona_no_disponible' }, 409, cors);
  const zonaEnvio = zona === 'baleares' ? 'baleares' : 'peninsula';

  const productos = await cargarProductos(env.PRODUCTS_URL);
  const { cobradas, freeByHandle, envio, unidades } = calcular(itemsVendibles, productos, cfg, zonaEnvio);

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
  // Líneas que SÍ se cobran.
  for (const [handle, qty] of Object.entries(cobradas)) {
    const p = productos[handle];
    const precio = precioEfectivo(handle, productos, cfg);
    form.append(`line_items[${i}][quantity]`, String(qty));
    form.append(`line_items[${i}][price_data][currency]`, 'eur');
    form.append(`line_items[${i}][price_data][unit_amount]`, String(Math.round(precio * 100)));
    form.append(`line_items[${i}][price_data][product_data][name]`, p.title);
    i++;
  }
  // Líneas de REGALO (por cada 3, 1 gratis): se muestran a 0,00 € para que el
  // cliente vea lo que se lleva de regalo. No suman al importe.
  for (const [handle, qty] of Object.entries(freeByHandle || {})) {
    if (!qty || !productos[handle]) continue;
    form.append(`line_items[${i}][quantity]`, String(qty));
    form.append(`line_items[${i}][price_data][currency]`, 'eur');
    form.append(`line_items[${i}][price_data][unit_amount]`, '0');
    form.append(`line_items[${i}][price_data][product_data][name]`, '🎁 Regalo (gratis): ' + productos[handle].title);
    i++;
  }

  // Una sola tarifa, ya calculada según la zona del código postal.
  const nombreEnvio = zonaEnvio === 'baleares'
    ? 'Envío Baleares'
    : (envio === 0 ? 'Envío GRATIS (Península)' : 'Envío Península');
  form.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
  form.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(Math.round(envio * 100)));
  form.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'eur');
  form.append('shipping_options[0][shipping_rate_data][display_name]', nombreEnvio);

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

/* ---------- Email de aviso de pedido (Brevo) ----------
   Si están configuradas EMAIL_API_KEY y ORDER_EMAIL_TO, envía un correo con el
   cliente, la dirección de envío y los productos. Si no, no hace nada. */
/* Devuelve la sesión de Stripe con las líneas de producto expandidas. */
async function getSesionCompleta(sesion, env) {
  try {
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sesion.id}?expand[]=line_items`, {
      headers: { 'Authorization': 'Bearer ' + env.STRIPE_SECRET_KEY },
    });
    if (r.ok) return await r.json();
  } catch { /* usamos lo que haya */ }
  return sesion;
}

/* ---------- Email de aviso de pedido (Brevo) ----------
   Recibe la sesión YA expandida (con line_items). */
async function enviarEmailPedido(full, env) {
  if (!env.EMAIL_API_KEY || !env.ORDER_EMAIL_TO) return;

  const cd = full.customer_details || {};
  const ship = full.shipping_details || (full.collected_information && full.collected_information.shipping_details) || {};
  const a = ship.address || cd.address || {};
  const dir = [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(' '), a.state, a.country]
    .filter(Boolean).join('<br>');
  const total = (full.amount_total != null) ? (full.amount_total / 100).toFixed(2) + ' €' : '—';
  const envioCent = (full.shipping_cost && full.shipping_cost.amount_total != null) ? full.shipping_cost.amount_total : null;
  const envio = (envioCent == null) ? null : (envioCent === 0 ? 'GRATIS' : (envioCent / 100).toFixed(2) + ' €');
  const lineas = (full.line_items && full.line_items.data) ? full.line_items.data : [];
  const itemsHtml = lineas.length
    ? '<ul>' + lineas.map(li => `<li>${li.quantity} × ${li.description} — ${(li.amount_total / 100).toFixed(2)} €</li>`).join('') + '</ul>'
    : '<p>(ver el detalle en el panel de Stripe)</p>';
  const nombreEnvio = ship.name || cd.name || '';

  const html =
    `<h2>🛒 Nuevo pedido en Savia de Alma</h2>` +
    `<p><strong>Cliente:</strong> ${cd.name || ''} &lt;${cd.email || '—'}&gt;</p>` +
    `<h3>Dirección de envío</h3>` +
    `<p>${nombreEnvio ? nombreEnvio + '<br>' : ''}${dir || '—'}</p>` +
    `<h3>Productos</h3>${itemsHtml}` +
    (envio ? `<p>Envío: ${envio}</p>` : '') +
    `<p><strong>Total cobrado: ${total}</strong></p>` +
    `<hr><p style="color:#888;font-size:12px">Pedido ${full.id}</p>`;

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.EMAIL_API_KEY, 'Content-Type': 'application/json', 'accept': 'application/json' },
    body: JSON.stringify({
      sender: { email: env.ORDER_EMAIL_FROM || env.ORDER_EMAIL_TO, name: 'Tienda Savia de Alma' },
      to: [{ email: env.ORDER_EMAIL_TO }],
      replyTo: cd.email ? { email: cd.email } : undefined,
      subject: `Nuevo pedido — ${total}`,
      htmlContent: html,
    }),
  });
}

/* ---------- Genera y guarda una factura numerada del pedido ----------
   Numeración anual FAC-AAAA-NNNN (contador en KV). Guarda el registro en
   'factura:<ts>:<num>' para listarlo y verlo desde el panel. */
async function generarFactura(full, env) {
  if (!env.SAVIA_KV) return;
  const ts = full.created || Math.floor(Date.now() / 1000);
  const fecha = new Date(ts * 1000);
  const year = fecha.getUTCFullYear();
  const ckey = 'factura:contador:' + year;
  const n = (parseInt(await env.SAVIA_KV.get(ckey) || '0', 10) || 0) + 1;
  await env.SAVIA_KV.put(ckey, String(n));
  const num = 'FAC-' + year + '-' + String(n).padStart(4, '0');

  const cd = full.customer_details || {};
  const ship = full.shipping_details || (full.collected_information && full.collected_information.shipping_details) || {};
  const a = ship.address || cd.address || {};
  const direccion = [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(' '), a.state, a.country]
    .filter(Boolean).join('\n');
  const lineas = ((full.line_items && full.line_items.data) ? full.line_items.data : []).map(li => ({
    desc: li.description || '', cant: li.quantity || 1, importe: (li.amount_total || 0) / 100,
  }));
  const envio = (full.shipping_cost && full.shipping_cost.amount_total != null) ? full.shipping_cost.amount_total / 100 : 0;
  const totalConIva = (full.amount_total || 0) / 100;
  const base = Math.round((totalConIva / 1.21) * 100) / 100;
  const iva = Math.round((totalConIva - base) * 100) / 100;

  const rec = {
    num, ts, fechaIso: fecha.toISOString().slice(0, 10),
    cliente: { nombre: cd.name || '', email: cd.email || '', direccion },
    lineas, envio, totalConIva, base, iva,
  };
  await env.SAVIA_KV.put('factura:' + ts + ':' + num, JSON.stringify(rec));
}

/* ---------- Webhook: baja el stock + avisa por email al completarse el pago ---------- */
async function manejarWebhook(request, env) {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');
  const ok = await webhookValido(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return new Response('Firma inválida', { status: 400 });

  let evento;
  try { evento = JSON.parse(rawBody); } catch { return new Response('JSON inválido', { status: 400 }); }

  if (evento.type === 'checkout.session.completed') {
    const sesion = evento.data?.object || {};
    if (sesion.payment_status === 'paid') {
      let cart = {};
      if (sesion.metadata && sesion.metadata.cart) {
        try { cart = JSON.parse(sesion.metadata.cart); } catch { cart = {}; }
      }
      // 1) Bajar el stock de las referencias controladas por número.
      if (Object.keys(cart).length) {
        const cfg = await getConfig(env);
        const stock = cfg.stock || {};
        let cambiado = false;
        for (const [h, q] of Object.entries(cart)) {
          if (Object.prototype.hasOwnProperty.call(stock, h)) {
            const restante = Math.max(0, Math.floor(Number(stock[h]) || 0) - (parseInt(q, 10) || 0));
            stock[h] = restante;
            cambiado = true;
          }
        }
        if (cambiado) { cfg.stock = stock; await putConfig(env, cfg); }
      }
      // 2) Registrar el pedido (productos + fecha) para el cálculo de beneficio.
      try {
        if (env.SAVIA_KV) {
          const fecha = sesion.created || Math.floor(Date.now() / 1000);
          const clave = 'pedido:' + fecha + ':' + (sesion.id || String(Math.random()).slice(2));
          await env.SAVIA_KV.put(clave, '1', { metadata: { fecha, items: cart } });
        }
      } catch (e) { console.error('registro pedido:', e); }
      // 3) Sesión completa (con líneas) para factura y email.
      const full = await getSesionCompleta(sesion, env);
      // 4) Generar y guardar la factura numerada.
      try { await generarFactura(full, env); } catch (e) { console.error('factura:', e); }
      // 5) Avisar por email del pedido (sin romper el webhook si fallara).
      try { await enviarEmailPedido(full, env); } catch (e) { console.error('email pedido:', e); }
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

/* Lee los movimientos de saldo de Stripe en un rango y agrega ventas, comisiones,
   IVA (21%) y neto. Devuelve { resumen, movimientos }. Lanza si Stripe falla. */
async function agregarStripe(env, desde, hasta) {
  const movs = [];
  let startingAfter = null, guard = 0;
  while (guard++ < 30) {
    const p = new URLSearchParams();
    p.append('limit', '100');
    p.append('created[gte]', String(desde));
    p.append('created[lte]', String(hasta));
    if (startingAfter) p.append('starting_after', startingAfter);
    const r = await fetch('https://api.stripe.com/v1/balance_transactions?' + p.toString(), {
      headers: { 'Authorization': 'Bearer ' + env.STRIPE_SECRET_KEY },
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || 'Stripe'); }
    const data = await r.json();
    for (const t of data.data) movs.push(t);
    if (!data.has_more || data.data.length === 0) break;
    startingAfter = data.data[data.data.length - 1].id;
  }

  let ventas = 0, comis = 0, neto = 0, reemb = 0, pedidos = 0;
  const filas = [];
  for (const t of movs) {
    if (t.type === 'charge' || t.type === 'payment') {
      ventas += t.amount; comis += t.fee; neto += t.net; pedidos++;
    } else if (t.type === 'refund' || t.type === 'payment_refund') {
      reemb += -t.amount; comis += t.fee; neto += t.net;
    } else {
      continue;
    }
    filas.push({
      fecha: new Date(t.created * 1000).toISOString().slice(0, 10),
      tipo: (t.type === 'refund' || t.type === 'payment_refund') ? 'reembolso' : 'venta',
      descripcion: t.description || '',
      bruto: t.amount / 100, comision: t.fee / 100, neto: t.net / 100,
    });
  }
  const ventasEur = ventas / 100;
  const base = Math.round((ventasEur / 1.21) * 100) / 100;
  const iva = Math.round((ventasEur - base) * 100) / 100;
  return {
    resumen: {
      pedidos,
      ventasBrutas: Math.round(ventasEur * 100) / 100,
      base, iva,
      comisiones: Math.round(comis) / 100,
      neto: Math.round(neto) / 100,
      reembolsos: Math.round(reemb) / 100,
    },
    movimientos: filas,
  };
}

function _authAdmin(request, env) {
  const auth = request.headers.get('authorization') || '';
  const pass = auth.replace(/^Bearer\s+/i, '');
  return !!env.ADMIN_PASSWORD && igualSeguro(pass, env.ADMIN_PASSWORD);
}
function _rango(body) {
  const desde = body.desde ? Math.floor(new Date(body.desde + 'T00:00:00Z').getTime() / 1000) : null;
  const hasta = body.hasta ? Math.floor(new Date(body.hasta + 'T23:59:59Z').getTime() / 1000) : null;
  return { desde, hasta };
}

/* ---------- Centro de cuentas: ventas/comisiones/IVA/neto ---------- */
async function manejarCuentas(request, env, cors) {
  if (!_authAdmin(request, env)) return jsonResp({ error: 'no_autorizado' }, 401, cors);
  let body = {}; try { body = await request.json(); } catch { /* */ }
  const { desde, hasta } = _rango(body);
  if (!desde || !hasta) return jsonResp({ error: 'Fechas no válidas' }, 400, cors);
  try {
    const out = await agregarStripe(env, desde, hasta);
    return jsonResp(out, 200, cors);
  } catch (e) {
    return jsonResp({ error: 'Stripe', detalle: String(e.message || e) }, 502, cors);
  }
}

/* ---------- Facturas: lista las facturas guardadas en un rango ---------- */
async function manejarFacturas(request, env, cors) {
  if (!_authAdmin(request, env)) return jsonResp({ error: 'no_autorizado' }, 401, cors);
  let body = {}; try { body = await request.json(); } catch { /* */ }
  const { desde, hasta } = _rango(body);
  if (!desde || !hasta) return jsonResp({ error: 'Fechas no válidas' }, 400, cors);
  const facturas = [];
  if (env.SAVIA_KV) {
    let cursor = null, guard = 0;
    do {
      const lst = await env.SAVIA_KV.list({ prefix: 'factura:', limit: 1000, cursor });
      for (const k of lst.keys) {
        if (k.name.indexOf('contador') !== -1) continue;
        const ts = Number(k.name.split(':')[1]) || 0;
        if (ts < desde || ts > hasta) continue;
        const v = await env.SAVIA_KV.get(k.name);
        if (v) { try { facturas.push(JSON.parse(v)); } catch { /* */ } }
      }
      cursor = lst.list_complete ? null : lst.cursor;
    } while (cursor && guard++ < 20);
  }
  facturas.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  return jsonResp({ facturas }, 200, cors);
}

/* ---------- Beneficio real: ventas (base) - coste de lo vendido - comisiones ---------- */
async function manejarBeneficio(request, env, cors) {
  if (!_authAdmin(request, env)) return jsonResp({ error: 'no_autorizado' }, 401, cors);
  let body = {}; try { body = await request.json(); } catch { /* */ }
  const { desde, hasta } = _rango(body);
  if (!desde || !hasta) return jsonResp({ error: 'Fechas no válidas' }, 400, cors);

  let stripe;
  try { stripe = await agregarStripe(env, desde, hasta); }
  catch (e) { return jsonResp({ error: 'Stripe', detalle: String(e.message || e) }, 502, cors); }

  // Unidades vendidas por producto (desde el registro de pedidos en KV).
  const unidades = {};
  if (env.SAVIA_KV) {
    let cursor = null, guard = 0;
    do {
      const lst = await env.SAVIA_KV.list({ prefix: 'pedido:', limit: 1000, cursor });
      for (const k of lst.keys) {
        const m = k.metadata || {};
        const f = Number(m.fecha) || Number(k.name.split(':')[1]) || 0;
        if (f < desde || f > hasta) continue;
        const items = m.items || {};
        for (const [h, q] of Object.entries(items)) unidades[h] = (unidades[h] || 0) + (parseInt(q, 10) || 0);
      }
      cursor = lst.list_complete ? null : lst.cursor;
    } while (cursor && guard++ < 20);
  }

  const cfg = await getConfig(env);
  const costes = cfg.costes || {};
  let productos = {};
  try { productos = await cargarProductos(env.PRODUCTS_URL); } catch { /* opcional, solo para títulos */ }

  let cogs = 0;
  const porProducto = [];
  for (const [h, u] of Object.entries(unidades)) {
    const c = Number(costes[h]) || 0;
    const total = Math.round(c * u * 100) / 100;
    cogs += total;
    porProducto.push({
      handle: h,
      titulo: (productos[h] && productos[h].title) || h,
      unidades: u, costeUnit: c, costeTotal: total,
    });
  }
  cogs = Math.round(cogs * 100) / 100;
  porProducto.sort((a, b) => b.costeTotal - a.costeTotal);

  const base = stripe.resumen.base;
  const comis = stripe.resumen.comisiones;
  const margen = Math.round((base - cogs - comis) * 100) / 100;
  const ivaSoportado = Number(body.ivaSoportado) || 0;
  const ivaIngresar = Math.round((stripe.resumen.iva - ivaSoportado) * 100) / 100;

  return jsonResp({
    pedidos: stripe.resumen.pedidos,
    ventasBrutas: stripe.resumen.ventasBrutas,
    base, comisiones: comis, cogs, margen,
    ivaRepercutido: stripe.resumen.iva, ivaSoportado, ivaIngresar,
    porProducto,
  }, 200, cors);
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
      if (path === '/admin/check' && request.method === 'POST') {
        const auth = request.headers.get('authorization') || '';
        const pass = auth.replace(/^Bearer\s+/i, '');
        if (!env.ADMIN_PASSWORD || !igualSeguro(pass, env.ADMIN_PASSWORD)) {
          return jsonResp({ error: 'no_autorizado' }, 401, cors);
        }
        return jsonResp({ ok: true }, 200, cors);
      }
      if (path === '/admin/cuentas' && request.method === 'POST') {
        return await manejarCuentas(request, env, cors);
      }
      if (path === '/admin/beneficio' && request.method === 'POST') {
        return await manejarBeneficio(request, env, cors);
      }
      if (path === '/admin/facturas' && request.method === 'POST') {
        return await manejarFacturas(request, env, cors);
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

/* deploy: 20260620T152910Z */
