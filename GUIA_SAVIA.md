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

Tiene 4 pestañas:

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
| `SAVIA_KV` | Binding | Base de datos (en la pestaña **Bindings/Encuadernaciones**) |

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

## 10. Envíos

- **Transportista:** CTT Express.
- **Tarifa al cliente:** Península **3,50 €** (GRATIS desde 45 €) · Baleares **6,00 €**.
- La web pide el **código postal** en el carrito y calcula la zona (07xxx = Baleares). Canarias/Ceuta/Melilla (35/38/51/52) quedan bloqueadas.
- **Promo:** por cada 3 productos, el 4.º (de menor valor) gratis. Válida solo en la web.
- **Operativa:** preparas el pedido, generas la etiqueta en el panel de CTT (pegando la dirección que ves en Stripe) y CTT lo recoge. Empaqueta **pequeño y ajustado** (te facturan por peso volumétrico si la caja es grande: `Largo×Ancho×Alto/6000`).
- Los precios/tarifas se editan en `docs/assets/js/cart.js` y `stripe/worker.js` (constantes `ENVIO_PENINSULA`, `ENVIO_BALEARES`, `ENVIO_GRATIS_DESDE`).

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
- 🏷️ **Etiquetas de envío automáticas:** integrar la **API de CTT** en el Worker para generar etiqueta + tracking con cada pedido.
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
