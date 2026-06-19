# Cobrar con Stripe en la web (con derivación a Amazon)

Tu web es **estática** (GitHub Pages), así que no puede cobrar ella sola: la
**clave secreta de Stripe nunca puede ir en el navegador**. Por eso el pago lo
crea una **mini-función en la nube** (un *Cloudflare Worker*, gratis). Solo se
configura una vez.

## Cómo funciona (resumen)

```
Cliente pulsa "Finalizar compra"
        │
        ├─ Modo vacaciones activado .......... → Amazon
        ├─ Sin pasarela configurada .......... → Amazon (modo escaparate)
        └─ Normal ............................ → Stripe Checkout (pago seguro)
```

- La promo **"por cada 3, 1 gratis"** y el **envío** (gratis desde 45 €) los
  **recalcula el servidor** con los precios reales: el cliente no puede tocar el importe.
- El **stock** y el **modo vacaciones** se gestionan en `docs/assets/js/config.js`.

---

## Paso 1 — Despliega la función de pago (una vez)

Necesitas una cuenta gratuita en [Cloudflare](https://dash.cloudflare.com/sign-up)
y [Node.js](https://nodejs.org) instalado.

```bash
cd stripe
npx wrangler login        # abre el navegador y autoriza
```

Edita `stripe/wrangler.toml` y pon tus valores reales:

- `PRODUCTS_URL` → la URL pública de tu `products.js`.
  Ejemplo: `https://infovenmon-dotcom.github.io/metamorfosis/assets/js/products.js`
- `ALLOWED_ORIGIN` → el dominio de tu web.
  Ejemplo: `https://infovenmon-dotcom.github.io`

Guarda tu **clave secreta de Stripe** (NO va en ningún archivo):

```bash
npx wrangler secret put STRIPE_SECRET_KEY
# pega tu sk_test_... (pruebas) o sk_live_... (real) cuando lo pida
```

Despliega:

```bash
npx wrangler deploy
```

Al final te dará una URL tipo:

```
https://savia-pago.TU-USUARIO.workers.dev
```

## Paso 2 — Conecta la web con la función

Abre `docs/assets/js/config.js` y pega esa URL:

```js
checkoutEndpoint: "https://savia-pago.TU-USUARIO.workers.dev",
```

Publica los cambios (commit + push). ¡Listo! "Finalizar compra" ya cobra con Stripe.

> Mientras `checkoutEndpoint` esté vacío (`""`), la web funciona en **modo
> escaparate**: el botón lleva a Amazon. Útil para publicar ya y activar el
> cobro cuando quieras.

---

## Gestión diaria (sin tocar código complicado)

> **Recomendado:** monta el **panel de control** (`PANEL_SETUP.md`) y gestiona
> precios, ofertas, stock y vacaciones desde `/admin.html`, con cambios al
> instante y stock que baja solo con cada venta. La opción de editar
> `config.js` que sigue es la alternativa manual si no usas el panel.

Todo en `docs/assets/js/config.js`:

### Modo vacaciones
```js
modoVacaciones: true,   // toda la web deriva a Amazon
```

### Stock por referencia
```js
stock: {
  "jabon-azufre": 0,    // 0 = agotado -> ese producto va a Amazon
  "champu-cacao": 5,    // disponible
},
```
Una referencia a 0 muestra "Agotado" y su botón pasa a "Comprar en Amazon".
Lo que no aparezca aquí se considera disponible.

### Lista rápida de agotados (alternativa al stock numérico)
```js
agotados: ["jabon-azufre", "champu-cacao"],
```

Tras editar: commit + push y la web se actualiza.

---

## Pruebas antes de cobrar de verdad

1. Usa tu clave **de test** (`sk_test_...`) en el Worker.
2. Pon el `checkoutEndpoint` y haz una compra de prueba.
3. Tarjeta de prueba de Stripe: `4242 4242 4242 4242`, fecha futura, CVC cualquiera.
4. Cuando todo funcione, cambia el secreto a `sk_live_...`:
   `npx wrangler secret put STRIPE_SECRET_KEY` (pega la clave real) y `npx wrangler deploy`.

---

## ¿Y los pedidos / envíos?

Stripe te cobra y te avisa de cada pago (panel de Stripe + email). El envío lo
preparas y mandas tú (por eso en vacaciones derivas a Amazon, que lo hace por ti).
La dirección de envío la recoge Stripe en el checkout (configurado para España).

## Notas

- Otros hosts: el mismo `worker.js` se adapta fácil a Vercel/Netlify Functions
  si prefieres. Pídelo y te lo dejo montado para ese proveedor.
- Comisión Stripe (orientativa, tarjeta europea): ~1,5% + 0,25 € por venta, sin
  cuota mensual.
