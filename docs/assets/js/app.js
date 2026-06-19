/* ===========================================================================
   SAVIA DE ALMA — Renderizado de catalogo (tienda + landing) + ficha producto
   =========================================================================== */

const DATA = window.SAVIA_DATA;

/* Corrige ñ y tildes SOLO en texto visible de producto (los datos vienen en
   ASCII). No se aplica a handles, clases ni claves: únicamente a lo que se
   muestra. */
const _ACC = {
  espana:'españa',espanol:'español',espanola:'española',espanoles:'españoles',
  manana:'mañana',nino:'niño',ninos:'niños',nina:'niña',ninas:'niñas',
  pequeno:'pequeño',pequena:'pequeña',pequenos:'pequeños',pequenas:'pequeñas',
  diseno:'diseño',disenos:'diseños',bano:'baño',banos:'baños',ano:'año',anos:'años',
  compania:'compañía',senal:'señal',senales:'señales',tamano:'tamaño',otono:'otoño',
  montana:'montaña',anadir:'añadir',anade:'añade',acompana:'acompaña',
  cosmetica:'cosmética',cosmeticas:'cosméticas',cosmetico:'cosmético',cosmeticos:'cosméticos',
  solida:'sólida',solidas:'sólidas',solido:'sólido',solidos:'sólidos',
  champu:'champú',champus:'champús',jabon:'jabón',limon:'limón',algodon:'algodón',
  carbon:'carbón',karite:'karité',argan:'argán',cafeina:'cafeína',indigo:'índigo',
  betaina:'betaína',monoi:'monoï',bambu:'bambú',arbol:'árbol',arboles:'árboles',
  mas:'más',dia:'día',dias:'días',tambien:'también',ademas:'además',aqui:'aquí',asi:'así',
  segun:'según',facil:'fácil',rapido:'rápido',rapida:'rápida',ultimo:'último',ultima:'última',
  unico:'único',unica:'única',numero:'número',linea:'línea',formula:'fórmula',formulas:'fórmulas',
  ecologico:'ecológico',ecologica:'ecológica',ecologicos:'ecológicos',organico:'orgánico',
  organica:'orgánica',quimica:'química',quimico:'químico',quimicos:'químicos',
  toxico:'tóxico',toxicos:'tóxicos',energia:'energía',garantia:'garantía',minimo:'mínimo',
  maximo:'máximo',practico:'práctico',practica:'práctica',basico:'básico',aromatico:'aromático',
  alergenos:'alérgenos'
};
const _ACC_PAIRS = [];
function _cap(w){ return w.charAt(0).toUpperCase() + w.slice(1); }
Object.keys(_ACC).sort((a, b) => b.length - a.length).forEach(function (a) {
  var b = _ACC[a];
  _ACC_PAIRS.push([new RegExp('\\b' + a + '\\b', 'g'), b]);
  _ACC_PAIRS.push([new RegExp('\\b' + _cap(a) + '\\b', 'g'), _cap(b)]);
  _ACC_PAIRS.push([new RegExp('\\b' + a.toUpperCase() + '\\b', 'g'), b.toUpperCase()]);
});
function acc(s) {
  if (!s || typeof s !== 'string') return s;
  for (var i = 0; i < _ACC_PAIRS.length; i++) s = s.replace(_ACC_PAIRS[i][0], _ACC_PAIRS[i][1]);
  s = s.replace(/([A-Za-zÁÉÍÓÚáéíóúñ])cion\b/g, '$1ción').replace(/([A-Za-zÁÉÍÓÚáéíóúñ])CION\b/g, '$1CIÓN');
  s = s.replace(/([A-Za-zÁÉÍÓÚáéíóúñ])sion\b/g, '$1sión');
  s = s.replace(/Arbol de Te\b/g, 'Árbol de Té').replace(/\bde Te\b/g, 'de Té')
       .replace(/\bTe Verde\b/g, 'Té Verde').replace(/\bTe Matcha\b/g, 'Té Matcha');
  return s;
}

/* ---------- Disponibilidad / stock / modo vacaciones (config.js) ---------- */
function _cfg() { return window.SAVIA_CONFIG || {}; }
function enVacaciones() { return !!_cfg().modoVacaciones; }
function estaAgotado(p) {
  return enVacaciones() || (_cfg().agotados || []).indexOf(p.handle) !== -1;
}

/* Tarjeta de producto. Web-exclusivos => solo "Anadir al carrito".
   Resto (en Amazon) => "Anadir al carrito" + "Ver en Amazon". */
function cardProducto(p, { compacta = false } = {}) {
  const agotado = estaAgotado(p);
  const etiqueta = (agotado && !enVacaciones())
    ? '<span class="etiqueta agotado">Agotado</span>'
    : (p.exclusiveWeb
        ? '<span class="etiqueta dorada">Exclusivo web</span>'
        : (p.bestSeller ? '<span class="etiqueta">Más vendido</span>' : ''));

  const amazonVer = p.exclusiveWeb ? '' :
    `<a class="btn btn-amazon btn-sm btn-bloque" href="${DATA.amazonStore}" target="_blank" rel="noopener">Ver en Amazon</a>`;

  const desc = compacta ? '' : `<p class="card-desc">${acc(p.indicado || p.short)}</p>`;

  let acciones;
  if (agotado) {
    acciones = (p.exclusiveWeb
      ? `<button class="btn btn-secundario btn-sm btn-bloque" disabled>No disponible</button>`
      : `<a class="btn btn-amazon btn-sm btn-bloque" href="${DATA.amazonStore}" target="_blank" rel="noopener">Comprar en Amazon</a>`)
      + `<button class="btn btn-secundario btn-sm btn-bloque" onclick="abrirFicha('${p.handle}')">Ver detalles</button>`;
  } else {
    acciones = `<button class="btn btn-primario btn-sm btn-bloque" onclick="addToCart('${p.handle}')">Añadir al carrito</button>
          <button class="btn btn-secundario btn-sm btn-bloque" onclick="abrirFicha('${p.handle}')">Ver detalles</button>
          ${amazonVer}`;
  }

  return `
    <article class="card${agotado ? ' es-agotado' : ''}" data-handle="${p.handle}" data-collection="${p.collection}">
      <button class="card-img" onclick="abrirFicha('${p.handle}')" aria-label="Ver detalles de ${acc(p.title)}">
        ${etiqueta}
        <img src="${p.image}" alt="${acc(p.title)}" loading="lazy">
      </button>
      <div class="card-cuerpo">
        <h3>${acc(p.title)}</h3>
        ${desc}
        <div class="card-precio">${eur(p.price)} <small>IVA incl.</small></div>
        <div class="card-acciones">
          ${acciones}
        </div>
      </div>
    </article>`;
}

/* Anade al carrito SIN salir de la pagina (estilo comercial): avisa con un
   toast y deja seguir comprando. La cesta se abre con el boton del carrito. */
function addToCart(handle) {
  const _p = DATA.products.find(x => x.handle === handle);
  if (_p && estaAgotado(_p)) {
    if (typeof mostrarAvisoFlotante === 'function') mostrarAvisoFlotante('Producto no disponible · cómpralo en Amazon');
    return;
  }
  Carrito.añadir(handle, 1);
  if (typeof mostrarAvisoFlotante === 'function') {
    mostrarAvisoFlotante('🛒 Añadido a la cesta · sigue comprando');
  }
  // Pequeno latido en el contador del carrito como feedback visual.
  // Si Motion esta disponible, usa un muelle; si no, la animacion CSS.
  document.querySelectorAll('[data-carrito-contador]').forEach(c => {
    if (typeof window.__motionPop === 'function') {
      window.__motionPop(c);
    } else {
      c.classList.remove('pulso');
      void c.offsetWidth; // reinicia la animacion
      c.classList.add('pulso');
    }
  });
}

/* ---------- Sonido opcional del video del hero ----------
   El video arranca en mudo (obligatorio para autoplay). Este boton permite
   al usuario activar/silenciar el sonido tras su primer gesto. */
function toggleHeroSound() {
  const v = document.querySelector('.hero-video');
  const b = document.getElementById('hero-sound');
  if (!v) return;
  v.muted = !v.muted;
  if (!v.muted) {
    v.volume = 1;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
    if (b) { b.textContent = '🔊'; b.setAttribute('aria-label', 'Silenciar'); b.classList.add('activo'); }
  } else if (b) {
    b.textContent = '🔇';
    b.setAttribute('aria-label', 'Activar sonido');
    b.classList.remove('activo');
  }
}

/* ---------- Newsletter (sin backend: confirma y oculta el formulario) ----------
   Para activar el envio real, conecta el form a Mailchimp/Formspree. */
function suscribirNewsletter(e) {
  e.preventDefault();
  const f = e.target;
  const ok = document.getElementById('newsletter-ok');
  if (f) f.style.display = 'none';
  if (ok) ok.hidden = false;
  return false;
}

/* Formulario de contacto. Sin backend muestra confirmacion; para recibir los
   mensajes de verdad, conecta el form a Formspree/Brevo (action + method POST). */
function enviarContacto(e) {
  e.preventDefault();
  const f = e.target;
  const ok = document.getElementById('contacto-ok');
  if (f) f.style.display = 'none';
  if (ok) ok.hidden = false;
  return false;
}

/* ---------- Ficha de producto (modal con beneficios + modo de uso) ---------- */
function abrirFicha(handle) {
  const p = DATA.products.find(x => x.handle === handle);
  if (!p) return;
  const cont = document.getElementById('ficha-contenido');
  if (!cont) return;

  const etiqueta = p.exclusiveWeb
    ? '<span class="etiqueta dorada" style="position:static;display:inline-block">Exclusivo web</span>'
    : (p.bestSeller ? '<span class="etiqueta" style="position:static;display:inline-block">Más vendido</span>' : '');

  const amazon = p.exclusiveWeb ? '' :
    `<a class="btn btn-amazon btn-bloque" href="${DATA.amazonStore}" target="_blank" rel="noopener">Ver en Amazon</a>`;

  const features = (p.features || []).map(f => `<li>${acc(f)}</li>`).join('');

  // Galeria de imagenes (principal + miniaturas)
  const imgs = (p.images && p.images.length) ? p.images : [p.image];
  const thumbs = imgs.length > 1
    ? `<div class="ficha-thumbs">${imgs.map((src, i) =>
        `<button class="ficha-thumb${i === 0 ? ' activo' : ''}" onclick="selFichaImg(this,'${src}')" aria-label="Imagen ${i + 1}"><img src="${src}" alt="" loading="lazy"></button>`).join('')}</div>`
    : '';
  const galeria = `<div class="ficha-galeria">
      <div class="ficha-img"><img id="ficha-main-img" src="${imgs[0]}" alt="${p.title}"></div>
      ${thumbs}
    </div>`;

  // Bullets tipo Amazon (puntos clave)
  const bullets = (p.bullets || []).map(b => `<li>${acc(b)}</li>`).join('');
  const bulletsBlock = bullets
    ? `<ul class="ficha-bullets">${bullets}</ul>`
    : '';

  const s = p.specs || {};
  const specsRows = [
    s.peso ? `<div class="ficha-spec"><span>Formato</span><span>${acc(s.peso)}</span></div>` : '',
    s.natural ? `<div class="ficha-spec"><span>Naturalidad</span><span>${acc(s.natural)}</span></div>` : '',
    s.cpnp ? `<div class="ficha-spec"><span>Registro CPNP</span><span>${s.cpnp}</span></div>` : '',
    s.fabricacion ? `<div class="ficha-spec"><span>Fabricación</span><span>${acc(s.fabricacion)}</span></div>` : '',
  ].join('');
  const specsBlock = (specsRows || s.inci) ? `
      <div class="ficha-bloque">
        <h4>📋 Especificaciones</h4>
        ${specsRows}
        ${s.inci ? `<div class="ficha-inci"><strong>Ingredientes (INCI):</strong> ${s.inci}</div>` : ''}
        ${s.inci ? `<div class="ficha-transparencia">🌿 <strong>Transparencia total:</strong> declaramos el 100% de los ingredientes, incluidos los alérgenos del perfume aunque la ley no obligue a listarlos en concentraciones tan bajas. Nada que esconder.</div>` : ''}
      </div>` : '';

  // Reseñas del producto
  const reviews = (window.SAVIA_RESENAS && window.SAVIA_RESENAS[p.handle]) || [];
  const reviewsBlock = reviews.length ? `
      <div class="ficha-resenas">
        <h4>⭐ Opiniones de clientes</h4>
        ${reviews.map(rv => `<div class="fr-item">
          <div class="resena-estrellas">${'★'.repeat(rv.r || 5)}${'☆'.repeat(5 - (rv.r || 5))}</div>
          <p>"${acc(rv.t)}"</p>
          <cite>— ${acc(rv.n)}</cite>
        </div>`).join('')}
      </div>` : '';

  const _agotado = estaAgotado(p);
  const acciones = `
      <div class="ficha-acciones">
        ${_agotado
          ? (p.exclusiveWeb
              ? `<button class="btn btn-secundario btn-bloque" disabled>No disponible temporalmente</button>`
              : `<a class="btn btn-amazon btn-bloque" href="${DATA.amazonStore}" target="_blank" rel="noopener">Comprar en Amazon</a>`)
          : `<button class="btn btn-primario btn-bloque" onclick="addToCart('${p.handle}'); cerrarFicha();">Añadir al carrito</button>
        ${amazon}`}
      </div>`;

  cont.innerHTML = `
    ${galeria}
    <div class="ficha-info">
      <div class="ficha-cabecera">
        <span class="ficha-coleccion">${acc(p.collectionName)}</span>
        ${etiqueta}
      </div>
      <h2>${acc(p.title)}</h2>
      <div class="card-precio" style="font-size:1.4rem">${eur(p.price)} <small>IVA incl.</small></div>
      <p class="ficha-desc">${acc(p.descripcion || p.short)}</p>
      ${bulletsBlock}
      ${acciones}

      ${p.indicado ? `<div class="ficha-bloque"><h4>✨ Para qué es bueno</h4><p>${acc(p.indicado)}</p></div>` : ''}
      ${p.modoUso ? `<div class="ficha-bloque"><h4>💧 Modo de uso</h4><p>${acc(p.modoUso)}</p></div>` : ''}
      ${features ? `<div class="ficha-bloque"><h4>🌿 Características</h4><ul class="ficha-features">${features}</ul></div>` : ''}
      ${specsBlock}
      ${reviewsBlock}

      ${p.lema ? `<p class="ficha-lema">${acc(p.lema)}</p>` : ''}
    </div>`;

  document.getElementById('ficha-overlay')?.classList.add('abierto');
  document.getElementById('panel-ficha')?.classList.add('abierto');
  document.body.style.overflow = 'hidden';
}

/* Cambia la imagen principal de la ficha al pulsar una miniatura. */
function selFichaImg(btn, src) {
  const main = document.getElementById('ficha-main-img');
  if (main) main.src = src;
  const cont = btn.parentNode;
  cont.querySelectorAll('.ficha-thumb').forEach(t => t.classList.remove('activo'));
  btn.classList.add('activo');
}

function cerrarFicha() {
  document.getElementById('ficha-overlay')?.classList.remove('abierto');
  document.getElementById('panel-ficha')?.classList.remove('abierto');
  document.body.style.overflow = '';
}

/* ---------- Tienda completa ---------- */
function renderTienda() {
  const cont = document.getElementById('catalogo');
  if (!cont) return;

  cont.innerHTML = DATA.collections.map(col => {
    const items = DATA.products.filter(p => p.collection === col.slug);
    const badge = col.exclusiveWeb ? ' <span class="etiqueta dorada" style="position:static;display:inline-block;vertical-align:middle">Exclusivo web</span>' : '';
    return `
      <section class="seccion" id="col-${col.slug}">
        <div class="contenedor">
          <h2 class="seccion-titulo">${acc(col.name)}${badge}</h2>
          <p class="seccion-sub">${col.count} producto(s)</p>
          <div class="grid-productos">
            ${items.map(p => cardProducto(p)).join('')}
          </div>
        </div>
      </section>`;
  }).join('');

  // Chips de filtro
  const chips = document.getElementById('chips-categorias');
  if (chips) {
    chips.innerHTML =
      `<button class="chip activo" data-filtro="all">Todo</button>` +
      DATA.collections.map(c => `<button class="chip" data-filtro="${c.slug}">${acc(c.name)}</button>`).join('');
    chips.addEventListener('click', e => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      chips.querySelectorAll('.chip').forEach(c => c.classList.remove('activo'));
      btn.classList.add('activo');
      const f = btn.dataset.filtro;
      document.querySelectorAll('[id^="col-"]').forEach(sec => {
        sec.classList.toggle('oculto', f !== 'all' && sec.id !== 'col-' + f);
      });
    });
  }
}

/* ---------- Landing: 6 mas vendidos ---------- */
function renderLandingBestSellers() {
  const cont = document.getElementById('best-sellers');
  if (!cont) return;
  const best = DATA.products.filter(p => p.bestSeller);
  cont.innerHTML = best.map(p => cardProducto(p, { compacta: true })).join('');
}

/* ---------- Landing: botones de categoria ---------- */
function renderLandingCategorias() {
  const cont = document.getElementById('landing-categorias');
  if (!cont) return;
  cont.innerHTML = DATA.collections.map(c =>
    `<a class="cat-boton" href="tienda.html#col-${c.slug}">
       <span>${acc(c.name)}</span>
       <span class="flecha">${c.count} →</span>
     </a>`).join('');
}

/* ---------- Scroll-reveal: aparicion sutil al entrar en pantalla ----------
   Revela bloques de seccion y tarjetas con un leve desplazamiento (ease-out)
   y un pequeno escalonado. Respeta prefers-reduced-motion: si el usuario pide
   menos movimiento, no observamos nada y el contenido queda visible. */
function initReveal() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const selector = [
    '.landing-seccion', '.regalo-bienvenida', '.savia-final', '.cta-final',
    '.historia', '.seccion', '.card', '.beneficio',
    '.impacto', '.newsletter'
  ].join(',');

  const elementos = Array.from(document.querySelectorAll(selector))
    // Evita marcar como reveal un contenedor y, dentro, sus propias tarjetas
    // dos veces: las tarjetas se animan solas con su escalonado.
    .filter(el => !el.closest('.panel-ficha'));

  elementos.forEach(el => el.classList.add('reveal'));

  // Sin IntersectionObserver (navegador muy antiguo): mostrar todo.
  if (!('IntersectionObserver' in window)) {
    elementos.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const obs = new IntersectionObserver((entradas, observer) => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      const el = entrada.target;
      // Escalonado para grupos de tarjetas dentro de una misma rejilla
      const grid = el.closest('.grid-productos, .grid-beneficios');
      if (grid && (el.classList.contains('card') || el.classList.contains('beneficio'))) {
        const hermanos = Array.from(grid.children);
        const i = hermanos.indexOf(el);
        el.style.transitionDelay = Math.min(i, 6) * 70 + 'ms';
      }
      el.classList.add('is-visible');
      observer.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  elementos.forEach(el => obs.observe(el));

  // Se exponen para que la capa Motion (motion-enhance.js) pueda tomar el
  // relevo con animaciones de muelle si la libreria llega a cargar.
  window.__revealObserver = obs;
  window.__revealItems = elementos;
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarFicha(); });

/* Aviso de modo vacaciones (banda arriba del todo) */
function mostrarAvisoVacaciones() {
  if (!enVacaciones() || document.querySelector('.vacaciones-aviso')) return;
  const av = document.createElement('div');
  av.className = 'vacaciones-aviso';
  av.innerHTML = '🌴 Estamos de vacaciones. Mientras tanto, puedes comprar nuestros productos en '
    + `<a href="${DATA.amazonStore}" target="_blank" rel="noopener">nuestra tienda de Amazon</a>.`;
  document.body.insertBefore(av, document.body.firstChild);
}

document.addEventListener('DOMContentLoaded', () => {
  mostrarAvisoVacaciones();
  renderTienda();
  renderLandingBestSellers();
  renderLandingCategorias();
  initReveal();
});
