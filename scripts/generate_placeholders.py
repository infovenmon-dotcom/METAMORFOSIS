# -*- coding: utf-8 -*-
"""Genera imagenes SVG de marca para cada producto en docs/assets/img/products/.

Son ilustraciones (no fotos): forma segun la categoria + color segun el aroma +
nombre del producto. Sirven como imagen real hasta que se suban fotos propias
(ver docs/assets/img/products/README.md). Ejecutar:

    python3 scripts/generate_placeholders.py
"""
import csv, os, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'data', 'shopify_productos_savia_de_alma.csv')
OUT = os.path.join(ROOT, 'docs', 'assets', 'img', 'products')

COLL = {
    'Champu': 'champus', 'Jabones': 'jabones', 'Desodorantes': 'desodorantes',
    'Limpiadores Faciales': 'faciales', 'Afeitado': 'afeitado',
    'Depilacion': 'depilacion', 'Acondicionadores': 'acondicionadores',
}

# Color (aroma/ingrediente) por palabra clave del handle.
TINTS = [
    (('cafeina','canela'), '#9c6b3f'),
    (('cacao',),           '#6f4a2f'),
    (('indigo','lavanda'), '#6b5b95'),
    (('matcha','te-verde','aloe','aguacate','arbol-te','cbd'), '#6fa86f'),
    (('cebolla','arcilla'),'#b1603f'),
    (('romero','quina'),   '#5f7d4f'),
    (('betaina','sal'),    '#4aa3a3'),
    (('avena','almendra'), '#c9a86a'),
    (('cade','enebro','madera'), '#7a6a4f'),
    (('barba','carbon'),   '#3a3a3a'),
    (('naranja','pomelo'), '#e08a3c'),
    (('borraja',),         '#5a7fb0'),
    (('rosa','mosqueta'),  '#c98fa3'),
    (('uva','pepita'),     '#7a4a78'),
    (('monoi',),           '#e0b85a'),
    (('argan',),           '#c2922e'),
    (('azufre',),          '#cdb53b'),
    (('algodon',),         '#9fb2c2'),
    (('coco',),            '#cdbb8e'),
    (('karite',),          '#caa46a'),
    (('avellana','afeitar'),'#b98a5e'),
]
BASE = {'champus':'#2D9E75','jabones':'#1D6B50','desodorantes':'#2D9E75',
        'faciales':'#2D9E75','afeitado':'#1D6B50','depilacion':'#2D9E75',
        'acondicionadores':'#1D6B50'}

ICON = {'champus':'\U0001FAE7','jabones':'\U0001F9FC','desodorantes':'\U0001F33F',
        'faciales':'✨','afeitado':'\U0001FA92','depilacion':'\U0001F33F',
        'acondicionadores':'\U0001F965'}


def tint(handle, coll):
    for keys, color in TINTS:
        if any(k in handle for k in keys):
            return color
    return BASE.get(coll, '#2D9E75')


def darken(hexc, f=0.78):
    h = hexc.lstrip('#')
    r, g, b = (int(h[i:i+2], 16) for i in (0, 2, 4))
    return '#%02x%02x%02x' % (int(r*f), int(g*f), int(b*f))


def shape(coll, color, dark):
    """Devuelve el SVG de la forma del producto centrada en 300,255."""
    if coll in ('champus', 'acondicionadores', 'depilacion', 'afeitado'):
        # pastilla redonda
        return (f'<ellipse cx="300" cy="262" rx="150" ry="40" fill="{dark}" opacity="0.18"/>'
                f'<circle cx="300" cy="250" r="120" fill="url(#g)"/>'
                f'<ellipse cx="262" cy="212" rx="42" ry="26" fill="#ffffff" opacity="0.18"/>')
    if coll == 'desodorantes':
        # stick / barra alta
        return (f'<rect x="232" y="300" width="136" height="26" rx="10" fill="{dark}" opacity="0.18"/>'
                f'<rect x="240" y="150" width="120" height="170" rx="22" fill="url(#g)"/>'
                f'<rect x="258" y="172" width="26" height="120" rx="13" fill="#ffffff" opacity="0.16"/>')
    if coll == 'faciales':
        return (f'<rect x="210" y="300" width="180" height="24" rx="10" fill="{dark}" opacity="0.18"/>'
                f'<rect x="206" y="150" width="188" height="170" rx="34" fill="url(#g)"/>'
                f'<ellipse cx="255" cy="195" rx="34" ry="20" fill="#ffffff" opacity="0.18"/>')
    # jabones: barra rectangular
    return (f'<rect x="170" y="318" width="260" height="26" rx="12" fill="{dark}" opacity="0.18"/>'
            f'<rect x="168" y="158" width="264" height="178" rx="30" fill="url(#g)"/>'
            f'<ellipse cx="232" cy="200" rx="44" ry="24" fill="#ffffff" opacity="0.18"/>')


def wrap(title, width=20):
    words, lines, cur = title.split(), [], ''
    for w in words:
        if len(cur) + len(w) + 1 <= width:
            cur = (cur + ' ' + w).strip()
        else:
            lines.append(cur); cur = w
    if cur:
        lines.append(cur)
    return lines[:3]


def build(handle, title, coll):
    color = tint(handle, coll)
    dark = darken(color)
    lines = wrap(title)
    y0 = 430 - (len(lines) - 1) * 16
    tspans = ''.join(
        f'<tspan x="300" dy="{0 if i == 0 else 30}">{html.escape(l)}</tspan>'
        for i, l in enumerate(lines))
    icon = ICON.get(coll, '\U0001F33F')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="{html.escape(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F7F2EC"/><stop offset="1" stop-color="#D6F0E8"/>
    </linearGradient>
    <radialGradient id="g" cx="0.4" cy="0.35" r="0.8">
      <stop offset="0" stop-color="{color}"/><stop offset="1" stop-color="{dark}"/>
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <text x="300" y="78" text-anchor="middle" font-family="Georgia, 'Playfair Display', serif" font-size="24" letter-spacing="2" fill="#1D6B50">SAVIA DE ALMA</text>
  <text x="300" y="118" text-anchor="middle" font-size="34">{icon}</text>
  {shape(coll, color, dark)}
  <text text-anchor="middle" font-family="Georgia, 'Playfair Display', serif" font-size="26" fill="#1A1A1A" y="{y0}">{tspans}</text>
  <text x="300" y="540" text-anchor="middle" font-family="'DM Sans', sans-serif" font-size="17" fill="#5a5a52">Cosmetica solida natural</text>
</svg>
'''


def main():
    os.makedirs(OUT, exist_ok=True)
    n = 0
    with open(SRC, encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            handle = (row.get('Handle') or '').strip()
            if not handle:
                continue
            coll = COLL.get(row['Type'].strip(), 'jabones')
            svg = build(handle, row['Title'].strip(), coll)
            with open(os.path.join(OUT, handle + '.svg'), 'w', encoding='utf-8') as out:
                out.write(svg)
            n += 1
    print('Imagenes SVG generadas:', n, '->', os.path.relpath(OUT, ROOT))


if __name__ == '__main__':
    main()
