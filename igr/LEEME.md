# Construcciones y Reformas IGR — web + panel de gestion

Proyecto autonomo dentro de este repositorio. Es HTML, CSS y JavaScript sin
compilar: se abre tal cual, sin `npm install` ni servidores.

```
igr/
├── index.html            Web publica (captacion de presupuestos)
├── panel.html            Panel de gestion interno (presupuestos y facturas)
├── aviso-legal.html · privacidad.html · cookies.html
├── robots.txt · sitemap.xml
└── assets/
    ├── css/site.css      Diseno de la web publica
    ├── css/panel.css     Diseno del panel
    ├── js/config.js      ← LO UNICO que hay que editar para personalizar la web
    ├── js/site.js        Comportamiento de la web (calculadora, antes/despues, formularios)
    ├── js/db.js          Datos y calculos del panel (bases, IVA, IRPF, cobros, informes)
    ├── js/doc-print.js   Plantilla imprimible de presupuestos y facturas
    ├── js/panel.js       Interfaz del panel
    └── img/              Imagenes provisionales (SVG) — sustituir por fotos reales
```

## Probar en local

```bash
python3 -m http.server 8000 --directory igr
# Web:   http://localhost:8000/
# Panel: http://localhost:8000/panel.html
```

En el panel, entra en **Ajustes → Cargar datos de ejemplo** para verlo con
clientes, obras, un presupuesto, una factura y gastos ya cargados.

---

## 1. La web publica

Estructura pensada segun lo que mejor funciona en el sector: foto a sangre con
titular y CTA encima, prueba social arriba del todo, servicios con precio de
partida, comparador **antes/despues**, proyectos filtrables, proceso en cuatro
pasos, calculadora orientativa, opiniones, FAQ y contacto. En movil hay una
barra fija con **Llamar · WhatsApp · Presupuesto**.

### Personalizar (5 minutos)

Todo lo editable esta en `assets/js/config.js`:

| Campo | Para que sirve |
|---|---|
| `empresa`, `claim`, `ciudad`, `zona` | Textos de marca y area de trabajo |
| `telefono`, `telefonoTel`, `whatsapp`, `email`, `horario` | Contacto (se aplican en toda la web) |
| `razonSocial`, `cif`, `direccion` | Datos que aparecen en el aviso legal |
| `formEndpoint` | Vacio = el formulario abre el correo del cliente. Con una URL de Formspree/Getform/Basin, el envio es directo |
| `cifras` | Los cuatro numeros de la franja de confianza |
| `precios`, `calidades` | Horquillas de la calculadora (€/m² y factor por acabado) |

### Logotipo y color de marca

La identidad sale del logotipo oficial (oro sobre negro, eslogan *"Construimos
calidad, renovamos confianza"*). En `assets/img/` estan las versiones ya
recortadas y con el fondo eliminado:

| Archivo | Donde se usa |
|---|---|
| `logo-igr.png` | Logotipo completo: pie de la web, pantalla de acceso al panel y membrete de presupuestos y facturas |
| `logo-marca.png` | Solo el emblema (casa + paleta): cabecera y menu del panel |
| `icono-32.png` · `icono-180.png` · `icono-512.png` | Favicon, icono de movil y PWA |
| `og.jpg` | Imagen al compartir en WhatsApp o redes |

Colores de marca en `assets/css/site.css` y `panel.css`: oro `#C8A24A`, oro claro
`#E8CE8C`, oro oscuro `#A5822F` y negro `#0E1116`. Si algun dia cambia el
logotipo, regenera los recortes desde el original y respeta esos tonos.

### Ficha de Google (Perfil de Empresa)

En `config.js`, el bloque `google` conecta la web con vuestra ficha:

```js
google: {
  perfil: "https://maps.app.goo.gl/...",   // enlace a la ficha
  resenas: "https://g.page/r/.../review",  // enlace directo a las opiniones
  rating: "4,9",                            // valoracion media
  numResenas: "210",                        // numero de resenas
  mapaEmbed: "https://www.google.com/maps/embed?pb=..."   // solo el src del iframe
}
```

Con esos datos aparecen: la valoracion en la barra superior y en la tarjeta del
hero, el boton "Ver todas las opiniones en Google", el enlace a la ficha, el
mapa y el marcado `aggregateRating` para los resultados de busqueda. **Lo que
dejes vacio se oculta**: la web nunca muestra una valoracion inventada.

El bloque `horarios` alimenta a la vez el texto de contacto y el
`openingHoursSpecification` de schema.org (los dias sin `abre`/`cierra`, como
"Con cita previa" o "Cerrado", se muestran pero no se envian como horario).

El bloque `opiniones` son los testimonios que se ven en la web. **Los tres que
vienen de serie son de ejemplo: sustituyelos por resenas reales de la ficha**
(texto tal cual, nombre como aparece publicado y estrellas).

### Fotos

Las imagenes de `assets/img/*.svg` son **provisionales** y llevan escrito
"sustituir por foto real". Reemplazalas por fotos propias (`.jpg`/`.webp`,
1600 px de ancho es suficiente) y actualiza el `src` en `index.html` y la lista
`PROYECTOS` de `assets/js/site.js`. Antes y despues deben estar tomados desde el
mismo punto: es lo que mas convierte.

Para regenerar los provisionales: `python3 scripts/igr_placeholders.py`.

### Publicar

- **Netlify / Vercel:** arrastra la carpeta `igr/` o conecta el repositorio
  indicando `igr` como directorio de publicacion.
- **GitHub Pages:** Pages solo sirve la raiz o `/docs` de una rama. En este
  repositorio `/docs` ya es la tienda Savia de Alma, asi que publica IGR en su
  propio repositorio (copia el contenido de `igr/` a la raiz) o usa un hosting
  propio.
- **Hosting clasico:** sube el contenido de `igr/` por FTP a `public_html`.

Antes de publicar, cambia el dominio en `sitemap.xml`, `robots.txt` y en la
etiqueta `<link rel="canonical">` de `index.html`.

---

## 2. El panel de gestion (`panel.html`)

Aplicacion privada para llevar el dia a dia: **presupuestos, facturas, clientes,
obras, gastos e informes de IVA**. No necesita servidor ni cuota mensual.

### Que hace

- **Resumen:** facturado del ano, pendiente de cobro (con lo vencido en rojo),
  gastos, resultado, grafico mes a mes, tasa de exito de presupuestos, cobros
  pendientes y obras en curso.
- **Presupuestos:** partidas con unidad, cantidad, precio, descuento e IVA por
  linea; validez; estados (borrador → enviado → aceptado/rechazado); duplicar;
  imprimir; **convertir en factura** con un clic.
- **Facturas:** numeracion automatica por serie y ano (`F2026-0001`), fecha de
  vencimiento, forma de pago, **cobros parciales**, estado calculado
  (emitida / parcial / cobrada / **vencida**), retencion de IRPF e **inversion
  del sujeto pasivo**.
- **Clientes:** ficha fiscal completa, con lo facturado y lo pendiente de cada
  uno. No deja borrar un cliente con documentos.
- **Obras:** agrupan presupuesto, facturas y gastos, y muestran el **margen real**
  (facturado − gastos imputados).
- **Gastos:** proveedor, categoria, obra, base e IVA soportado.
- **Informes:** IVA repercutido y soportado por trimestre (ayuda para el modelo
  303), ranking de clientes, exportacion a CSV y copia de seguridad.
- **Tarifas:** precios habituales para montar un presupuesto en dos clics.

### Imprimir y enviar en PDF

En cualquier documento, **Imprimir / PDF** abre el dialogo del navegador: elige
"Guardar como PDF". Sale con los datos fiscales de la empresa, el desglose por
tipos de IVA y las notas legales que correspondan (IVA reducido del 10 %,
inversion del sujeto pasivo, retencion, vencimiento e IBAN).

### Donde se guardan los datos

En el **almacenamiento local del navegador** de este equipo. Eso significa:

- No viajan a ningun servidor: nadie mas los ve.
- **Si borras los datos de navegacion, se pierden.** No se sincronizan entre
  ordenadores ni con el movil.
- Haz copia con **Informes → Descargar copia (JSON)** y guardala fuera del
  equipo. Para volver: **Restaurar copia** (reemplazar o fusionar).

La clave de **Ajustes → Clave del panel** evita que alguien lo abra por
descuido, pero **no cifra nada**: no es una contrasena de banco. Si necesitas
acceso multiusuario, cuentas separadas y auditoria, el paso siguiente seria
llevar los datos a un servidor (por ejemplo un Cloudflare Worker con KV, como el
que ya usa la otra web de este repositorio).

### Sobre el IVA

El panel ayuda, no asesora. Recuerda:

- **10 %** en obras de renovacion o reparacion de vivienda cuando el destinatario
  es particular, la vivienda tiene mas de dos anos y el material aportado no
  supera el **40 %** de la base imponible (art. 91.Uno.2.10º Ley 37/1992). Si se
  pasa del 40 %, la operacion entera va al 21 %.
- **21 %** en el resto (obra nueva, locales, alquiler turistico, obras
  contratadas por aseguradoras, electrodomesticos).
- **Inversion del sujeto pasivo** (art. 84.Uno.2º f) cuando el cliente es empresa
  o promotor en ejecuciones de obra inmobiliaria: la factura sale sin IVA.

Revisa siempre las cifras con tu asesoria antes de presentar un modelo.
