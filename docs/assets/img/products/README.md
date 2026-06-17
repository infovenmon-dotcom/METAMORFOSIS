# Imagenes de producto

Aqui vive una imagen por producto. Por ahora son **ilustraciones SVG de marca**
generadas automaticamente (forma segun la categoria + color segun el aroma +
nombre del producto). Sirven como imagen real hasta que subas fotos propias.

## Como poner fotos reales

1. Prepara una foto **cuadrada** (p. ej. 1000 x 1000 px) por producto.
2. Nombrala **exactamente igual que el `handle` del producto** y guardala en
   esta carpeta. Formatos admitidos: `.jpg`, `.jpeg`, `.png`, `.webp`.
   - Ejemplo: la foto del *Jabon de Karite* (handle `jabon-karite`) seria
     `jabon-karite.jpg`.
3. Vuelve a generar los datos para que el sitio use la foto en lugar del SVG:

   ```bash
   python3 scripts/generate_products.py
   python3 scripts/build_preview.py   # opcional: regenera las previews
   ```

   El generador usa automaticamente la foto si existe; si no, deja la
   ilustracion SVG.
4. Haz commit y push. GitHub Pages republica solo.

> Tambien puedes enviarme las fotos y las coloco y regenero por ti.

## Handles de los productos

Los nombres de archivo (sin extension) deben coincidir con estos handles:

- Champus: `champu-cafeina-canela`, `champu-indigo-lavanda`, `champu-cacao`,
  `champu-betaina-sal`, `champu-te-matcha`, `champu-cebolla-arcilla`,
  `champu-avena-almendra`, `champu-romero-quina`, `champu-cade-enebro`,
  `champu-barba-carbon`
- Jabones: `jabon-cbd`, `jabon-naranja-canela`, `jabon-borraja`, `jabon-karite`,
  `jabon-arbol-te`, `jabon-rosa-mosqueta`, `jabon-argan`, `jabon-monoi`,
  `jabon-pepita-uva`, `jabon-carbon-activo`, `jabon-azufre`, `jabon-lavanda`,
  `jabon-aguacate`
- Desodorantes: `desodorante-te-verde`, `desodorante-pomelo`,
  `desodorante-algodon`, `desodorante-madera`
- Acondicionadores: `acondicionador-coco`, `acondicionador-almendra`
- Faciales: `limpiador-facial-rosa-mosqueta`, `limpiador-facial-aloe-pepino`
- Afeitado: `espuma-afeitar-avellana`
- Depilacion: `espuma-depilacion-uva`, `espuma-depilacion-aloe`
