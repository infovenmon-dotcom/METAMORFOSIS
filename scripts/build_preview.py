"""Genera versiones autocontenidas (un solo archivo) de la landing y la tienda
en preview/, con CSS, JS y datos embebidos. Utiles para compartir o abrir sin
servidor. Ejecutar: python3 scripts/build_preview.py"""
import re, os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def read(p): return open(os.path.join(ROOT,p),encoding='utf-8').read()

css=read('docs/assets/css/styles.css')
js='\n'.join(read(f) for f in ['docs/assets/js/products.js','docs/assets/js/cart.js','docs/assets/js/app.js'])

def build(src_html, out_name, link_map):
    h=read(src_html)
    # remove external css link, inject inline style
    h=re.sub(r'<link rel="stylesheet" href="assets/css/styles.css">',
             '<style>\n'+css+'\n</style>', h)
    # remove the three script tags, inject inline bundle before </body>
    h=re.sub(r'\s*<script src="assets/js/products\.js"></script>\s*'
             r'<script src="assets/js/cart\.js"></script>\s*'
             r'<script src="assets/js/app\.js"></script>',
             '\n<script>\n'+js+'\n</script>', h)
    # rewrite internal links to the self-contained filenames
    for a,b in link_map.items():
        h=h.replace('href="%s"'%a,'href="%s"'%b)
    open(os.path.join(ROOT,'preview',out_name),'w',encoding='utf-8').write(h)
    print('built preview/'+out_name, len(h),'bytes')

lm={'tienda.html':'savia-tienda.html','index.html':'savia-landing.html'}
build('docs/index.html','savia-landing.html',lm)
build('docs/tienda.html','savia-tienda.html',lm)
