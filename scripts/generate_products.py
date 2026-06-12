import csv, re, json, os

# Rutas relativas a la raiz del repositorio
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'data', 'shopify_productos_savia_de_alma.csv')

# Collection mapping from Type -> display + slug
COLLECTIONS = {
    'Champu': ('Champus Solidos', 'champus'),
    'Jabones': ('Jabones Artesanales', 'jabones'),
    'Desodorantes': ('Desodorantes Solidos', 'desodorantes'),
    'Limpiadores Faciales': ('Limpiadores Faciales', 'faciales'),
    'Afeitado': ('Afeitado', 'afeitado'),
    'Depilacion': ('Depilacion', 'depilacion'),
    'Acondicionadores': ('Acondicionadores', 'acondicionadores'),
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
}

best_handles = {
    'champu-cafeina-canela','jabon-rosa-mosqueta','desodorante-algodon',
    'limpiador-facial-aloe-pepino','espuma-afeitar-avellana','champu-barba-carbon'
}

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
        tags = [t.strip() for t in row['Tags'].split(',')]
        short, feats = parse_body(row['Body (HTML)'])
        exclusive = any('exclusivo web' in t.lower() for t in tags) or 'exclusivo web' in row['Body (HTML)'].lower()
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
            'exclusiveWeb': exclusive,
            'bestSeller': handle in best_handles,
        })

# Order collections as in the prompt
coll_order = ['champus','jabones','desodorantes','faciales','afeitado','depilacion','acondicionadores']
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
with open(os.path.join(ROOT,'assets','js','products.js'),'w',encoding='utf-8') as f:
    f.write(js)

print('Productos:', len(products))
print('Exclusivos web:', sum(1 for p in products if p['exclusiveWeb']), [p['handle'] for p in products if p['exclusiveWeb']])
print('Best sellers:', sum(1 for p in products if p['bestSeller']))
for c in collections:
    print(' -', c['name'], c['count'], 'EXCLUSIVO WEB' if c['exclusiveWeb'] else '')
