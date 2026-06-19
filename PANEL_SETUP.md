# Panel de control de la tienda (precio · oferta · stock · vacaciones)

El panel es una página privada (`/admin.html`) desde la que cambias **precios,
ofertas, stock y el modo vacaciones** sin tocar código. Los cambios salen en la
web **al instante** y, con el webhook activado, el **stock baja solo con cada
venta**.

Funciona sobre el mismo Cloudflare Worker que cobra con Stripe (`stripe/`). Los
datos se guardan en una pequeña base de datos de Cloudflare (**KV**, gratis para
este volumen).

> Si aún no has desplegado el Worker, haz primero el **Paso 1** de
> `STRIPE_SETUP.md`. Aquí solo se añade lo del panel.

---

## Paso 1 — Crea la base de datos (KV) una vez

Desde la carpeta `stripe/`:

```bash
npx wrangler kv namespace create SAVIA_KV
```

Te devolverá algo como:

```
[[kv_namespaces]]
binding = "SAVIA_KV"
id = "abcd1234..."
```

Copia ese **id** y pégalo en `stripe/wrangler.toml`, en la línea
`id = "PEGA_AQUI_EL_ID_DEL_KV"`.

## Paso 2 — Pon la contraseña del panel

```bash
npx wrangler secret put ADMIN_PASSWORD
# escribe la contraseña que quieras para entrar en /admin
```

## Paso 3 — Despliega

```bash
npx wrangler deploy
```

## Paso 4 — Entra en el panel

Abre en el navegador:

```
https://TU-WEB/admin.html
```

(p. ej. `https://infovenmon-dotcom.github.io/METAMORFOSIS/admin.html`)

- La **dirección del servidor** se rellena sola si `checkoutEndpoint` ya está
  puesto en `config.js`; si no, pégala a mano (la URL `...workers.dev`).
- Escribe la **contraseña** del Paso 2 y pulsa **Entrar**.

Ya puedes editar y pulsar **Guardar cambios**.

---

## Cómo se usa el panel

| Columna | Qué hace |
|---|---|
| **Precio** | El precio actual del producto. Cámbialo cuando quieras. |
| **Antes** | Precio anterior de una **oferta**: debe ser mayor que el actual. La web lo muestra tachado con la etiqueta `-XX%`. Déjalo vacío para quitar la oferta. |
| **Stock** | Vacío = no se controla (siempre disponible). Un número se va descontando con cada venta; al llegar a **0**, ese producto pasa a venderse en **Amazon**. |
| **Agotado** | Fuerza "Comprar en Amazon" sin tocar el número de stock. |
| **🌴 Modo vacaciones** | Toda la web deriva la compra a Amazon. Los productos **exclusivos web** (no están en Amazon) muestran "No disponible". |

---

## Paso 5 (recomendado) — Que el stock baje solo con cada venta

Esto conecta Stripe con el Worker para descontar stock automáticamente al
cobrar.

1. En el panel de **Stripe → Desarrolladores → Webhooks → Añadir endpoint**.
2. URL del endpoint:
   ```
   https://savia-pago.TU-USUARIO.workers.dev/webhook
   ```
3. Evento a escuchar: **`checkout.session.completed`**.
4. Stripe te dará un **secreto de firma** (`whsec_...`). Guárdalo en el Worker:
   ```bash
   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   # pega el whsec_...
   npx wrangler deploy
   ```

A partir de ahí: cada pago completado descuenta del stock las unidades vendidas
(solo de las referencias que tengas con número de stock en el panel). Cuando una
llega a 0, se vende sola en Amazon.

> El descuento de stock solo afecta a referencias que tengan un **número** de
> stock en el panel. Las que dejes con stock vacío (∞) no se tocan.

---

## Sin Worker / sin internet (plan B)

Si el Worker no responde, la web usa la config local de
`docs/assets/js/config.js` (precios base del catálogo y lo que tengas escrito
ahí). Nunca se queda en blanco. El panel es la fuente principal en cuanto está
desplegado.

## Seguridad

- La contraseña viaja por HTTPS y solo se compara en el servidor; no se guarda
  en la web ni en el código.
- `/admin.html` lleva `noindex` para que no aparezca en Google. No la enlaces
  públicamente.
- Cambia la contraseña cuando quieras con `npx wrangler secret put ADMIN_PASSWORD && npx wrangler deploy`.
