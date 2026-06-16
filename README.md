# 🌿 Savia de Alma — Tienda + Landing

Cosmetica solida natural, hecha a mano en Espana. Veganos, sin plastico, zero
waste. Este repositorio contiene el **frontend** del proyecto (landing page
mobile-first para link en bio + tienda completa) y la **documentacion de
configuracion de Shopify**.

## Que hay aqui

| Archivo | Descripcion |
|---------|-------------|
| `docs/index.html` | **Landing page** mobile-first (link en bio de Instagram/TikTok): hero, banner promo, 6 mas vendidos, beneficios, categorias y CTA final. |
| `docs/tienda.html` | **Tienda completa**: catalogo de 34 productos agrupados por coleccion, filtros y carrito. |
| `docs/assets/css/styles.css` | Sistema de diseno con la identidad visual de la marca. |
| `docs/assets/js/products.js` | Datos de producto **autogenerados desde el CSV** (no editar a mano). |
| `docs/assets/js/cart.js` | Carrito con la logica de promociones (3+1 y envio gratis). |
| `docs/assets/js/app.js` | Renderizado del catalogo y la landing. |
| `docs/.nojekyll` | Desactiva Jekyll en GitHub Pages (sirve los archivos tal cual). |
| `data/` | CSV de productos de origen + catalogo de marca (PDF). |
| `SHOPIFY_SETUP.md` | Guia paso a paso para configurar la tienda en Shopify Admin. |
| `scripts/generate_products.py` | Regenera `docs/assets/js/products.js` a partir del CSV. |

## Identidad visual

- Verde oscuro `#1D6B50` · Verde medio `#2D9E75` · Verde claro `#D6F0E8`
- Dorado `#B8860B` · Negro `#1A1A1A` · Beige `#F7F2EC`
- Tipografias: **Playfair Display** (titulos) + **DM Sans** (cuerpo)

## Promociones implementadas

- **3+1 GRATIS** (permanente): por cada 4 articulos, el de **menor precio** es
  gratis. Escalable: 8 → 2 gratis, 12 → 3 gratis. Descuento automatico en
  carrito.
- **Envio gratis desde 45 €** (Peninsula; tarifa base 2,95 €). Barra de progreso
  en el carrito.
- **Precios con IVA (21%) incluido** — no se añaden impuestos.
- **Exclusivos web** (sin boton Amazon): champu barba carbon, depilacion pepita
  de uva, depilacion aloe vera, acondicionador coco, acondicionador almendra.
  El resto muestra ademas **"Ver en Amazon"**.

## Probar en local

```bash
python3 -m http.server 8000 --directory docs
# Abrir http://localhost:8000/         (landing)
# Abrir http://localhost:8000/tienda.html  (tienda)
```

## Publicacion (GitHub Pages)

El sitio se sirve desde la carpeta `docs/` de la rama por defecto
(Settings -> Pages -> "Deploy from a branch" -> rama / carpeta `/docs`).
URL: <https://infovenmon-dotcom.github.io/METAMORFOSIS/>

## Regenerar los datos de producto

Si cambia el CSV (`data/shopify_productos_savia_de_alma.csv`):

```bash
python3 scripts/generate_products.py
```

## Configurar Shopify

Ver **[`SHOPIFY_SETUP.md`](SHOPIFY_SETUP.md)** para importar el CSV, crear las
colecciones, el descuento 3+1, los envios y el IVA.
