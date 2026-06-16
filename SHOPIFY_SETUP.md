# Configuracion Shopify — Savia de Alma

Guia paso a paso para dejar la tienda Shopify operativa con las promociones,
envios, colecciones y productos del proyecto. Los pasos del Admin no se pueden
automatizar desde este repositorio (requieren acceso a tu cuenta Shopify), asi
que se documentan aqui para replicarlos en **Shopify Admin**.

> **Importante:** los precios del CSV **ya incluyen el IVA (21%)**. No actives
> impuestos adicionales sobre el precio (ver paso 5).

---

## 1. Importar productos (CSV)

`Productos > Importar > Subir archivo`

- Archivo: [`data/shopify_productos_savia_de_alma.csv`](data/shopify_productos_savia_de_alma.csv)
- 34 productos, formato nativo de Shopify (Handle, Title, Body HTML, Vendor, Type, Tags, Variant Price, SKU…).
- Tras importar, revisa que todos queden con estado **Activo**.

Resumen del catalogo:

| Coleccion (Type)      | Productos | Exclusivo web |
|-----------------------|:---------:|:-------------:|
| Champus Solidos       | 10        | 1 (barba carbon) |
| Jabones Artesanales   | 13        | —             |
| Desodorantes Solidos  | 4         | —             |
| Limpiadores Faciales  | 2         | —             |
| Afeitado              | 1         | —             |
| Depilacion            | 2         | **Si**        |
| Acondicionadores      | 2         | **Si**        |

---

## 2. Crear colecciones

`Productos > Colecciones > Crear coleccion` (tipo **Automatica**, condicion
`Tipo de producto = …`):

1. **Champu** — 10 productos
2. **Jabones** — 13 productos
3. **Desodorantes** — 4 productos
4. **Limpiadores Faciales** — 2 productos
5. **Afeitado** — 1 producto
6. **Depilacion — EXCLUSIVO WEB** — 2 productos
7. **Acondicionadores — EXCLUSIVO WEB** — 2 productos

---

## 3. Descuento automatico 3+1 (promo permanente)

`Descuentos > Crear descuento > Compra X y llevate Y`

- **Nombre:** `COMPRA 3 Y LLEVA EL 4º GRATIS`
- **El cliente compra:** `3` articulos (cualquier producto)
- **El cliente obtiene:** `1` articulo gratis (100% de descuento)
- **Aplicar a:** el articulo de **menor precio**
- **Sin codigo** → **Descuento automatico**
- **Escalable:** 6+2, 9+3… (Shopify lo repite por cada multiplo si dejas la
  opcion "usos por pedido" sin limite).
- **Fecha de fin:** ninguna (permanente).

---

## 4. Envios

`Configuracion > Envios y entregas > Tarifas`

| Zona              | Tarifa standard | Gratis |
|-------------------|:---------------:|:------:|
| Espana Peninsula  | 2,95 €          | Pedidos **+45 €** |
| Baleares          | 4,95 €          | —      |
| Canarias          | 7,95 €          | —      |

Para el envio gratis: añade una tarifa **"Envio gratis"** con condicion
`Precio del pedido >= 45,00 €` en la zona Peninsula.

---

## 5. Impuestos (IVA ya incluido)

`Configuracion > Impuestos y aranceles`

- Marca **"Todos los precios incluyen impuestos"**.
- No añadas IVA sobre el precio mostrado: los 9,99 / 10,99 / 11,99 € ya lo incluyen.

---

## 6. Botones "Ver en Amazon" vs "Solo web"

- **Productos en Amazon** (todos menos los exclusivos): mostrar **"Añadir al
  carrito"** + **"Ver en Amazon"**.
- **Exclusivos web** (sin boton Amazon): `champu-barba-carbon`,
  `espuma-depilacion-uva`, `espuma-depilacion-aloe`, `acondicionador-coco`,
  `acondicionador-almendra`.
- Enlace de la tienda Amazon:
  <https://www.amazon.es/stores/SaviadeAlma/page/6AD3705D-E19B-4150-A0FB-7BB7F057E0DE>

> En un tema Shopify (Liquid) esto se resuelve con un metafield booleano
> `custom.exclusivo_web` por producto y un `{% if %}` en la plantilla
> `product.liquid`. La logica equivalente ya esta implementada en la landing de
> este repo (`docs/assets/js/app.js`, funcion `cardProducto`).

---

## 7. Identidad visual (tema)

`Tienda online > Temas > Personalizar`

| Uso              | Color      |
|------------------|------------|
| Verde oscuro     | `#1D6B50`  |
| Verde medio      | `#2D9E75`  |
| Verde claro      | `#D6F0E8`  |
| Dorado           | `#B8860B`  |
| Negro            | `#1A1A1A`  |
| Beige (fondo)    | `#F7F2EC`  |

- **Tipografias:** Playfair Display (titulos) + DM Sans (cuerpo).
- **Banner anuncio** (header): `COMPRA 3 Y EL 4º ES GRATIS · Envio gratis desde 45 €`,
  fondo negro `#1A1A1A`, texto blanco.

---

## 8. Landing page (link en bio)

La landing mobile-first descrita en el prompt esta construida en este repo
(`docs/index.html`). En Shopify puedes:

- Publicarla como **pagina** (`/landing` o `/tienda`) con una plantilla
  personalizada, **o**
- Desplegar este repo estatico (GitHub Pages / Netlify) y usar la URL como link
  en bio de Instagram y TikTok.

Ver [`README.md`](README.md) para el detalle del frontend.
