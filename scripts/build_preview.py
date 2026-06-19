"""Genera versiones autocontenidas (un solo archivo) de la landing y la tienda
en preview/, con CSS, JS y datos embebidos. Utiles para compartir o abrir sin
servidor. Ejecutar: python3 scripts/build_preview.py"""
import re, os, base64
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def read(p): return open(os.path.join(ROOT,p),encoding='utf-8').read()

def inline_images(js):
    """Convierte las rutas de imagen (SVG/foto) en data URIs para que el
    archivo unico funcione sin la carpeta assets/img al lado."""
    mime={'svg':'image/svg+xml','jpg':'image/jpeg','jpeg':'image/jpeg',
          'png':'image/png','webp':'image/webp'}
    def repl(m):
        rel=m.group(0)
        path=os.path.join(ROOT,'docs',rel)
        if not os.path.exists(path):
            return rel
        ext=rel.rsplit('.',1)[1].lower()
        b64=base64.b64encode(open(path,'rb').read()).decode()
        return 'data:%s;base64,%s'%(mime.get(ext,'application/octet-stream'),b64)
    return re.sub(r'assets/img/(?:products/)?[A-Za-z0-9\-_]+\.(?:svg|jpe?g|png|webp)', repl, js)

css=read('docs/assets/css/styles.css')
js='\n'.join(read(f) for f in ['docs/assets/js/products.js','docs/assets/js/reviews.js','docs/assets/js/config.js','docs/assets/js/cart.js','docs/assets/js/app.js','docs/assets/js/motion-enhance.js','docs/assets/js/accesibilidad.js'])
js=inline_images(js)

def build(src_html, out_name, link_map):
    h=read(src_html)
    # remove external css link, inject inline style
    h=re.sub(r'<link rel="stylesheet" href="assets/css/styles.css">',
             '<style>\n'+css+'\n</style>', h)
    # remove the three script tags, inject inline bundle before </body>
    h=re.sub(r'\s*<script src="assets/js/products\.js"></script>\s*'
             r'<script src="assets/js/reviews\.js"></script>\s*'
             r'<script src="assets/js/config\.js"></script>\s*'
             r'<script src="assets/js/cart\.js"></script>\s*'
             r'<script src="assets/js/app\.js"></script>\s*'
             r'<script src="assets/js/motion-enhance\.js"></script>\s*'
             r'<script src="assets/js/accesibilidad\.js"></script>',
             '\n<script>\n'+js+'\n</script>', h)
    # inline images referenced directly in the HTML (e.g. logos)
    h=inline_images(h)
    # rewrite internal links to the self-contained filenames
    for a,b in link_map.items():
        h=h.replace('href="%s"'%a,'href="%s"'%b)
    open(os.path.join(ROOT,'preview',out_name),'w',encoding='utf-8').write(h)
    print('built preview/'+out_name, len(h),'bytes')

lm={'tienda.html':'savia-tienda.html','index.html':'savia-landing.html'}
build('docs/index.html','savia-landing.html',lm)
build('docs/tienda.html','savia-tienda.html',lm)
