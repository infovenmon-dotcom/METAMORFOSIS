# 📗 Guía de Savia de Alma — Manual de la tienda

Manual completo de **Savia de Alma** (VENMON NATURALMENTE SL). Aquí está **todo lo que necesitas para gestionar la tienda** sin depender de nadie: panel, pagos, envíos, dominio, cuentas y cómo pasar a cobro real.

> **Datos de la empresa**
> - Razón social: **VENMON NATURALMENTE SL** · CIF **B19399609**
> - Marca: **Savia de Alma**
> - Domicilio: Calle Gabriel Celaya 15 posterior, 28320 Pinto (Madrid)
> - Email: **info@saviadealma.com**
> - Web: **https://saviadealma.com**

---

## 1. Enlaces rápidos

| Qué | Dónde |
|---|---|
| **Tienda (web)** | https://saviadealma.com |
| **Panel de control** | https://saviadealma.com/admin.html |
| **Servidor (Worker)** | https://savia-pago.info-venmon.workers.dev |
| **Repositorio (código)** | github.com/infovenmon-dotcom/metamorfosis |
| **Stripe** | dashboard.stripe.com (cuenta **SAVIA DE ALMA**) |
| **Cloudflare** | dash.cloudflare.com → Workers & Pages → `savia-pago` |
| **Brevo (emails)** | app.brevo.com |
| **Dominio** | IONOS (saviadealma.com) |

---

## 2. Cómo funciona (visión general)

```
Cliente → saviadealma.com (tienda) → "Finalizar compra"
                    │
                    ▼
        Worker de Cloudflare (savia-pago)
         ├─ crea el pago seguro en Stripe
         ├─ guarda la config (precios/stock/ofertas) en la base de datos KV
         └─ al pagar (webhook): baja stock + email de pedido + factura
```

- La **web es estática** (GitHub Pages) → rápida y barata.
- El **Worker de Cloudflare** hace lo "inteligente": pago con Stripe, panel, stock, cuentas y facturas.
- La **base de datos KV** (`SAVIA_KV`) guarda la configuración que editas en el panel.
- **Todo se despliega solo**: cada cambio en el código se publica automáticamente (ver §9).

---

## 3. El panel de control (uso diario)

Entra en **https://saviadealma.com/admin.html** → escribe la **contraseña** → **Entrar**.

Tiene 5 pestañas:

### 🧴 Productos
- **Registrar compra a proveedor** (arriba): elige producto + cantidad + importe → calcula el **coste/ud.**, actualiza la columna "Coste" y **suma el stock**. Marca "media ponderada" si compras a distinto precio.
- **Tabla de productos**, por columna:
  - **Precio (€):** el precio de venta actual.
  - **Antes (€):** para una **oferta** → pon el precio anterior (mayor que el actual). Sale tachado con el `-XX%`. Vacío = sin oferta.
  - **Coste (€):** lo que te cuesta el producto (interno, para el beneficio).
  - **Stock:** vacío = no se controla (∞); un número se descuenta con cada venta; al llegar a **0** ese producto se vende en **Amazon**.
  - **Agotado:** fuerza "Comprar en Amazon" sin tocar el stock.
- **🌴 Modo vacaciones:** toda la web deriva la compra a Amazon (los productos exclusivos web muestran "No disponible").
- **💾 Guardar cambios** para aplicar (sale al instante en la web).

### 📦 Envíos
Los pedidos pagados aparecen aquí listos para expedir (ver **sección 10**). Por cada pedido: **Copiar datos** / **CSV** para el portal de CTT, campo de **nº de seguimiento**, y **Marcar enviado** (avisa al cliente por email). Cuando estén las credenciales de la API, sale el botón **🏷️ Crear etiqueta CTT** que lo hace todo automático.

### 📊 Cuentas
Ventas, comisiones de Stripe, IVA y neto de un periodo. Elige fechas (o "Este mes") → **Calcular**. **Exporta a CSV** para tu gestor.

### 💰 Beneficio
Beneficio real = **ventas (sin IVA) − coste de lo vendido − comisiones de Stripe**. Pon el **IVA soportado** (el de tus compras del periodo) y calcula el **IVA a ingresar** (repercutido − soportado). Requiere haber puesto el **coste** de los productos (pestaña Productos).

### 🧾 Facturas
Cada pedido genera una **factura numerada** (FAC-AAAA-NNNN) con tus datos. Busca por fechas y pulsa **"Ver / Imprimir"** para imprimir o guardar en PDF.

> **Nota legal:** la factura es **simplificada (no certificada)**. Para facturación 100% conforme a Hacienda (Veri*Factu) usa una herramienta certificada (Quaderno/Holded) cuando la necesites.

---

## 4. Contraseña del panel

La contraseña es un **secreto** en Cloudflare: no se puede ver, solo cambiar.

**Para cambiarla / si la olvidas:**
1. Cloudflare → Workers & Pages → **savia-pago** → **Settings → Variables and Secrets**.
2. Edita **`ADMIN_PASSWORD`** → escribe una nueva → **Save**. Se aplica al instante (no hace falta desplegar).

> 📝 Guárdala en un gestor de contraseñas. El "Entrar" del panel avisa si es incorrecta.

---

## 5. Variables de Cloudflare (Worker `savia-pago`)

En **Settings → Variables and Secrets**. No borres ninguna.

| Nombre | Tipo | Para qué |
|---|---|---|
| `PRODUCTS_URL` | Texto | URL del catálogo: `https://saviadealma.com/assets/js/products.js` |
| `ALLOWED_ORIGIN` | Texto | Dominio de la web: `https://saviadealma.com` |
| `ORDER_EMAIL_TO` | Texto | A dónde llegan los pedidos: `info@saviadealma.com` |
| `ORDER_EMAIL_FROM` | Texto | Remitente del email: `info@saviadealma.com` |
| `STRIPE_SECRET_KEY` | **Secreto** | Clave de Stripe (`sk_test_…` pruebas / `sk_live_…` real) |
| `ADMIN_PASSWORD` | **Secreto** | Contraseña del panel |
| `STRIPE_WEBHOOK_SECRET` | **Secreto** | Firma del webhook (`whsec_…`) para bajar stock/factura |
| `EMAIL_API_KEY` | **Secreto** | Clave de Brevo (`xkeysib-…`) para los emails |
| `CTT_CLIENT_CENTER` | Texto | Código de centro de cliente CTT (10 dígitos) — lo da CTT |
| `CTT_CLIENT_ID` | **Secreto** | Usuario de la API de CTT — lo da CTT (integración) |
| `CTT_CLIENT_SECRET` | **Secreto** | Contraseña de la API de CTT — lo da CTT (integración) |
| `SAVIA_KV` | Binding | Base de datos (en la pestaña **Bindings/Encuadernaciones**) |

> El resto de variables de CTT (`CTT_BASE_URL`, `CTT_SERVICE_PENINSULA`, `CTT_SERVICE_BALEARES`, etiqueta, remitente…) ya vienen puestas en `wrangler.toml` y se despliegan solas. Para pasar la API de pruebas a real, cambia `CTT_BASE_URL` a `https://api.cttexpress.com`.

⚠️ Si algún día vuelves a añadir/editar secretos, recuerda que **editar un secreto se aplica solo** (sin desplegar).

---

## 6. Stripe: de pruebas a cobro real

Ahora mismo estás en **MODO PRUEBA** (clave `sk_test_`): puedes probar con la tarjeta `4242 4242 4242 4242` sin cobrar dinero real.

**Para cobrar de verdad (modo real):**
1. En Stripe (cuenta **SAVIA DE ALMA**) → completa **"Verificar tu empresa"** (datos fiscales de VENMON SL + cuenta bancaria de cobro).
2. Cambia el interruptor a **modo real** (desactiva "Modo de prueba").
3. Ve a **Desarrolladores → Claves de API** → copia la **clave secreta real** (`sk_live_…`).
4. En Cloudflare → `savia-pago` → **Variables and Secrets** → edita **`STRIPE_SECRET_KEY`** con la `sk_live_…` → Save.
5. **Rehaz el webhook en modo real:** Stripe (modo real) → Desarrolladores → Webhooks → añade el endpoint `https://savia-pago.info-venmon.workers.dev/webhook`, evento `checkout.session.completed` → copia el nuevo `whsec_…` → edita **`STRIPE_WEBHOOK_SECRET`** en Cloudflare.
6. Haz **una compra real de prueba** (con tu propia tarjeta, importe pequeño) para confirmar.

**Recibo al cliente (gratis):** Stripe → Configuración → Correos a clientes → activa "Recibos / Pagos correctos".

> Comisión orientativa Stripe: ~1,5% + 0,25 € por venta (tarjeta europea), sin cuota mensual. La **factura de Stripe está desactivada** (para no pagar su comisión de Invoicing); usamos nuestro generador de facturas.

---

## 7. Emails de pedido (Brevo)

- Cada pedido pagado envía un email a **info@saviadealma.com** con cliente, dirección y productos.
- Motor de envío: **Brevo** (remitente verificado `info@saviadealma.com`, clave en `EMAIL_API_KEY`).
- Plan gratuito de Brevo: 300 emails/día (de sobra para empezar).

---

## 8. Dominio y web (GitHub Pages + IONOS)

- La web se **aloja en GitHub Pages** (carpeta `docs/` del repositorio) y se sirve en **saviadealma.com** (dominio personalizado).
- **DNS en IONOS:** registros **A** del `@` a las IPs de GitHub (185.199.108–111.153), **AAAA** a las IPv6 de GitHub, y **CNAME `www`** → `infovenmon-dotcom.github.io`. Los registros de **correo (MX, SPF, DKIM de IONOS y Brevo) no se tocan**.
- El correo `info@saviadealma.com` está en **IONOS** (independiente de la web).
- Los otros dominios (`.com` ya en uso; `.online`, `.store`) puedes **redirigirlos** a `.com` desde IONOS.

---

## 9. Despliegue automático (no tienes que hacer nada)

- **Web (`docs/`):** GitHub publica los cambios automáticamente (1–2 min).
- **Worker (`stripe/`):** conectado a GitHub (**Workers Builds**) → cada cambio se despliega solo.
- Resultado: cuando se toca el código, **sale publicado sin pegar nada**. Si no ves un cambio, espera 1–2 min y recarga con **Ctrl+F5**.

---

## 10. Envíos (CTT Express)

- **Transportista:** CTT Express (contrato firmado el 10/08/2026).
- **Tarifa al cliente:** Península **3,95 €** (GRATIS desde 45 €) · Baleares **6,00 €**.
- La web pide el **código postal** en el carrito y calcula la zona (07xxx = Baleares). Canarias/Ceuta/Melilla (35/38/51/52) quedan bloqueadas.
- **Promo (4×3):** por cada **4 productos**, 1 gratis (el de menor valor). Válida solo en la web. Mecanismo en `GRUPO_GRATIS = 4` (regala 1 por cada 4 unidades: `Math.floor(unidades/4)`).
- Los precios/tarifas al cliente se editan en `docs/assets/js/cart.js` y `stripe/worker.js` (constantes `ENVIO_PENINSULA`, `ENVIO_BALEARES`, `ENVIO_GRATIS_DESDE`).

### Cómo expedir un pedido (pestaña 📦 Envíos del panel)

**Con la API de CTT configurada (automático):**
1. Panel → **Envíos** → pulsa **🏷️ Crear etiqueta CTT** en el pedido.
2. Se genera el envío, se abre la **etiqueta (PDF 10×15)** para imprimir en la **térmica**, se guarda el nº de seguimiento y **se avisa al cliente** por email con su enlace de rastreo.

**Sin API todavía (con el portal de CTT):**
1. Panel → **Envíos** → **Copiar datos** (o **CSV para CTT**) → crea la etiqueta en el portal de CTT e imprímela.
2. Pega el **nº de seguimiento** → **Marcar enviado** → el cliente recibe el email de rastreo.

### Empaquetado y peso volumétrico
Empaqueta **pequeño y ajustado**. CTT factura el mayor entre el peso real y el **volumétrico** = `Largo × Ancho × Alto (cm) ÷ 6000`. Con caja pequeña (hasta ~20×15×10 cm) pagas el **tramo mínimo de 1 kg** (~3,80 € + fuel; el IVA lo recuperas). Si la caja pasa de ~30×20×15 saltas a 2 kg.

### Servicios y códigos CTT
- **C24** = Península 24h · **C48** = Península 48h · **CBA48** = Baleares Economy · **CBA24** = Baleares Express.
- La tarifa lleva **IVA + suplemento de combustible (fuel)** aparte, ambos variables.

### 📇 Contactos CTT (referencia rápida)

| Para… | Contacto | Teléfono |
|---|---|---|
| Atención cliente (1er mes, PREMIUM) | sacpremium1@cttexpress.com | 916 698 489 |
| Atención cliente (desde 2º mes) | cca.z4@cttexpress.com | 916 748 112 |
| Recogidas (problemas de recogida) | incidenciasrecogidas@cttexpress.com | 918 309 796 |
| Canarias (adjuntar factura + nº envío) | saereos1@cttexpress.com | — |
| Internacional | internacional@cttexpress.com | — |
| Facturación (Yolanda) | yolanda.blas@cttexpress.com | 916 274 086 |
| Material, tarifas y contrato | Mónica (comercial) | — |
| API / integración | integracion@cttexpress.com (Juan) | — |

**⚠️ 3 reglas de oro:**
1. **Incidencias: 7 días máximo** desde que ocurren para reclamar.
2. **Si llega dañado:** fotos del **contenido dañado + etiqueta CTT + caja por dentro y por fuera**.
3. **Siempre** pon el **nº de envío en el asunto** de cualquier reclamación.

---

## 11. Páginas legales

Completas y enlazadas en el pie de la web:
`aviso-legal`, `condiciones-venta`, `privacidad` (con Stripe/Brevo/Cloudflare como encargados), `envios`, `devoluciones` (14 días + cancelación 2% + formulario de desistimiento), `accesibilidad`.

Si cambian datos de la empresa, están en esos `.html` dentro de `docs/`.

---

## 12. Configuración local de emergencia (`docs/assets/js/config.js`)

Si el Worker no respondiera, la web usa esta config local (precios base + lo que pongas aquí). **La fuente principal es el panel** (base de datos KV); este archivo es solo respaldo. Contiene `checkoutEndpoint` (URL del Worker), y ejemplos de `modoVacaciones`, `stock`, `precios`, `ofertas`.

---

## 13. Tareas futuras (opcionales)

- 🔑 **Pasar Stripe a modo real** (§6) cuando vayas a vender de verdad.
- 🏷️ **Encender la API de CTT:** la integración ya está hecha en el Worker; solo falta pegar `CTT_CLIENT_ID`, `CTT_CLIENT_SECRET` y `CTT_CLIENT_CENTER` (los da CTT), probar en `api-test` y luego cambiar `CTT_BASE_URL` a producción (§5 y §10).
- 🧾 **Facturación certificada** (Quaderno/Holded) para cumplir Veri*Factu cuando el volumen lo pida.
- 🌐 **Redirigir** `.online` y `.store` a `.com` (IONOS).
- 🎁 Añadir opción "comprar como regalo" (y su cláusula de devoluciones) si la quieres.

---

## 14. Problemas frecuentes

| Síntoma | Causa / solución |
|---|---|
| El panel dice "contraseña incorrecta" | Re-fija `ADMIN_PASSWORD` en Cloudflare (§4). |
| "Finalizar compra" va a Amazon | Falta `STRIPE_SECRET_KEY`, o modo vacaciones activo, o producto sin stock. |
| No sale un cambio en la web | Espera 1–2 min y **Ctrl+F5** (caché). |
| No llega el email de pedido | Revisa que el remitente esté verificado en Brevo y `EMAIL_API_KEY`/`ORDER_EMAIL_TO`. |
| El stock no baja | El webhook necesita `STRIPE_WEBHOOK_SECRET`; y solo baja productos con número de stock. |
| Error CORS / panel no carga | `ALLOWED_ORIGIN` debe ser `https://saviadealma.com`. |

---

*Guía de Savia de Alma · VENMON NATURALMENTE SL. Mantén este archivo actualizado si cambias precios, transportista o proveedores.*
