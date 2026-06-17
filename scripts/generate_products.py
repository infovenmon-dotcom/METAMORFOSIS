import csv, re, json, os
from content import CONTENT
from specs import SPECS
from bullets import BULLETS

# Rutas relativas a la raiz del repositorio
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'data', 'shopify_productos_savia_de_alma.csv')

# Collection mapping from Type -> display + slug
COLLECTIONS = {
    'Champu': ('Champus Solidos', 'champus'),
    'Jabones': ('Jabones Artesanales', 'jabones'),
    'Desodorantes': ('Desodorantes Solidos', 'desodorantes'),
    'Limpiadores Faciales': ('Limpiadores Faciales', 'faciales'),
    'Afeitado': ('Afeitado y Barba', 'afeitado'),
    'Depilacion': ('Depilacion', 'depilacion'),
    'Acondicionadores': ('Acondicionadores', 'acondicionadores'),
    'Accesorios': ('Accesorios', 'accesorios'),
}

# Reubicacion de productos en otra coleccion (handle -> (nombre, slug))
COLLECTION_OVERRIDE = {
    'champu-barba-carbon': ('Afeitado y Barba', 'afeitado'),
}

AMAZON_STORE = 'https://www.amazon.es/stores/SaviadeAlma/page/6AD3705D-E19B-4150-A0FB-7BB7F057E0DE'

# Emoji per collection for visual cards (no real images available)
EMOJI = {
    'champus': '\U0001FAE7',      # bubbles
    'jabones': '\U0001F9FC',      # soap
    'desodorantes': '\U0001F33F',
    'faciales': '✨',
    'afeitado': '\U0001FA92',     # razor
    'depilacion': '\U0001F33F',
    'acondicionadores': '\U0001F965', # coconut
    'accesorios': '\U0001F9FA',   # basket
}

best_handles = {
    'champu-cafeina-canela','jabon-rosa-mosqueta','desodorante-algodon',
    'limpiador-facial-aloe-pepino','espuma-afeitar-avellana','champu-barba-carbon'
}

def find_images(handle):
    """Lista de imagenes del producto: principal ({handle}) + extras
    ({handle}-2, {handle}-3, ...). Si no hay foto real, usa la ilustracion SVG."""
    base = os.path.join(ROOT, 'docs', 'assets', 'img', 'products')
    def f(stem):
        for ext in ('jpg', 'jpeg', 'png', 'webp'):
            if os.path.exists(os.path.join(base, '%s.%s' % (stem, ext))):
                return 'assets/img/products/%s.%s' % (stem, ext)
        return None
    imgs = []
    main = f(handle)
    if main:
        imgs.append(main)
    n = 2
    while True:
        extra = f('%s-%d' % (handle, n))
        if not extra:
            break
        imgs.append(extra)
        n += 1
    if not imgs:
        imgs = ['assets/img/products/%s.svg' % handle]
    return imgs

def parse_body(html):
    # short description = first <p>...</p>
    m = re.search(r'<p>(.*?)</p>', html, re.S)
    short = re.sub('<.*?>', '', m.group(1)).strip() if m else ''
    feats = re.findall(r'<li>(.*?)</li>', html, re.S)
    feats = [re.sub('<.*?>', '', f).strip() for f in feats]
    return short, feats

products = []
with open(SRC, encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if not row.get('Handle'):
            continue
        handle = row['Handle'].strip()
        ptype = row['Type'].strip()
        coll_name, coll_slug = COLLECTIONS.get(ptype, (ptype, ptype.lower()))
        if handle in COLLECTION_OVERRIDE:
            coll_name, coll_slug = COLLECTION_OVERRIDE[handle]
        tags = [t.strip() for t in row['Tags'].split(',')]
        short, feats = parse_body(row['Body (HTML)'])
        exclusive = any('exclusivo web' in t.lower() for t in tags) or 'exclusivo web' in row['Body (HTML)'].lower()
        c = CONTENT.get(handle, {})
        # Galeria: foto principal + extras ({handle}-2, -3...). Si no hay, SVG.
        imgs = find_images(handle)
        img = imgs[0]
        products.append({
            'handle': handle,
            'title': row['Title'].strip(),
            'short': short,
            'features': feats,
            'tags': tags,
            'price': float(row['Variant Price']),
            'sku': row['Variant SKU'].strip(),
            'type': ptype,
            'collection': coll_slug,
            'collectionName': coll_name,
            'emoji': EMOJI.get(coll_slug, '\U0001F33F'),
            'image': img,
            'images': imgs,
            'bullets': BULLETS.get(handle, []),
            'exclusiveWeb': exclusive,
            'bestSeller': handle in best_handles,
            # Contenido enriquecido (beneficios + modo de uso)
            'descripcion': c.get('descripcion', short),
            'indicado': c.get('indicado', ''),
            'modoUso': c.get('modoUso', ''),
            'lema': c.get('lema', ''),
            # Especificaciones reales (INCI, CPNP, peso...) cuando existen
            'specs': SPECS.get(handle, {}),
        })

# --- Accesorios (exclusivos web, no estan en el CSV de Shopify) ---
EXTRA_PRODUCTS = [
    {
        'handle': 'jabonera-bambu', 'title': 'Jabonera de Bambú', 'price': 3.99,
        'short': 'Base de bambú natural que mantiene tu pastilla seca entre usos y la hace durar mucho más.',
        'features': ['Bambú 100% natural y sostenible', 'Drena el agua: tu pastilla dura más', 'Ligera y antideslizante', 'Para champús y jabones sólidos'],
        'bullets': [
            'BAMBÚ NATURAL Y SOSTENIBLE: material renovable, biodegradable y resistente.',
            'TU PASTILLA DURA MÁS: drena el agua y evita que se reblandezca entre usos.',
            'LIGERA Y BONITA: perfecta para casa o para llevar de viaje.',
            'COMPLEMENTO IDEAL: para tus champús y jabones sólidos Savia de Alma.',
        ],
    },
    {
        'handle': 'esponja-exfoliante', 'title': 'Esponja Exfoliante Natural', 'price': 2.99,
        'short': 'Esponja vegetal para exfoliar suavemente la piel y activar la circulación en la ducha.',
        'features': ['Fibra vegetal biodegradable', 'Exfoliación suave y natural', 'Activa la circulación', 'Ideal con tus jabones sólidos'],
        'bullets': [
            'EXFOLIACIÓN SUAVE: retira células muertas y deja la piel suave y luminosa.',
            '100% VEGETAL Y BIODEGRADABLE: sin plásticos, zero waste.',
            'ACTIVA LA CIRCULACIÓN: un masaje natural en cada ducha.',
            'MÁS ESPUMA: aprovecha al máximo tus jabones sólidos.',
        ],
    },
]
for ex in EXTRA_PRODUCTS:
    imgs = find_images(ex['handle'])
    products.append({
        'handle': ex['handle'], 'title': ex['title'], 'short': ex['short'],
        'features': ex['features'], 'tags': ['accesorio', 'exclusivo web'],
        'price': ex['price'], 'sku': '', 'type': 'Accesorios',
        'collection': 'accesorios', 'collectionName': 'Accesorios',
        'emoji': EMOJI['accesorios'], 'image': imgs[0], 'images': imgs,
        'bullets': ex['bullets'], 'exclusiveWeb': True, 'bestSeller': False,
        'descripcion': ex['short'], 'indicado': '', 'modoUso': '', 'lema': '',
        'specs': {},
    })

# Aviso si falta contenido para algun producto
faltan = [p['handle'] for p in products if p['handle'] not in CONTENT and p['type'] != 'Accesorios']
if faltan:
    print('AVISO: sin contenido enriquecido para:', faltan)

# Order collections as in the prompt
coll_order = ['champus','jabones','desodorantes','faciales','afeitado','depilacion','acondicionadores','accesorios']
collections = []
for slug in coll_order:
    items = [p for p in products if p['collection']==slug]
    if not items: continue
    name = items[0]['collectionName']
    exclusive = all(p['exclusiveWeb'] for p in items)
    collections.append({'slug':slug,'name':name,'count':len(items),'exclusiveWeb':exclusive})

out = {
    'amazonStore': AMAZON_STORE,
    'collections': collections,
    'products': products,
}

js = "// Auto-generado desde shopify_productos_savia_de_alma.csv - NO editar a mano.\n"
js += "window.SAVIA_DATA = " + json.dumps(out, ensure_ascii=False, indent=2) + ";\n"
with open(os.path.join(ROOT,'docs','assets','js','products.js'),'w',encoding='utf-8') as f:
    f.write(js)

print('Productos:', len(products))
print('Exclusivos web:', sum(1 for p in products if p['exclusiveWeb']), [p['handle'] for p in products if p['exclusiveWeb']])
print('Best sellers:', sum(1 for p in products if p['bestSeller']))
for c in collections:
    print(' -', c['name'], c['count'], 'EXCLUSIVO WEB' if c['exclusiveWeb'] else '')
