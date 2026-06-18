/* ===========================================================================
   SAVIA DE ALMA — Renderizado de catalogo (tienda + landing) + ficha producto
   =========================================================================== */

const DATA = window.SAVIA_DATA;

/* Tarjeta de producto. Web-exclusivos => solo "Anadir al carrito".
   Resto (en Amazon) => "Anadir al carrito" + "Ver en Amazon". */
function cardProducto(p, { compacta = false } = {}) {
  const etiqueta = p.exclusiveWeb
    ? '<span class="etiqueta dorada">Exclusivo web</span>'
    : (p.bestSeller ? '<span class="etiqueta">Mas vendido</span>' : '');

  const amazon = p.exclusiveWeb ? '' :
    `<a class="btn btn-amazon btn-sm btn-bloque" href="${DATA.amazonStore}" target="_blank" rel="noopener">Ver en Amazon</a>`;

  const desc = compacta ? '' : `<p class="card-desc">${p.indicado || p.short}</p>`;

  return `
    <article class="card" data-handle="${p.handle}" data-collection="${p.collection}">
      <button class="card-img" onclick="abrirFicha('${p.handle}')" aria-label="Ver detalles de ${p.title}">
        ${etiqueta}
        <img src="${p.image}" alt="${p.title}" loading="lazy">
      </button>
      <div class="card-cuerpo">
        <h3>${p.title}</h3>
        ${desc}
        <div class="card-precio">${eur(p.price)} <small>IVA incl.</small></div>
        <div class="card-acciones">
          <button class="btn btn-primario btn-sm btn-bloque" onclick="addToCart('${p.handle}')">Anadir al carrito</button>
          <button class="btn btn-secundario btn-sm btn-bloque" onclick="abrirFicha('${p.handle}')">Ver detalles</button>
          ${amazon}
        </div>
      </div>
    </article>`;
}

/* Anade al carrito SIN salir de la pagina (estilo comercial): avisa con un
   toast y deja seguir comprando. La cesta se abre con el boton del carrito. */
function addToCart(handle) {
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

/* ---------- Ficha de producto (modal con beneficios + modo de uso) ---------- */
function abrirFicha(handle) {
  const p = DATA.products.find(x => x.handle === handle);
  if (!p) return;
  const cont = document.getElementById('ficha-contenido');
  if (!cont) return;

  const etiqueta = p.exclusiveWeb
    ? '<span class="etiqueta dorada" style="position:static;display:inline-block">Exclusivo web</span>'
    : (p.bestSeller ? '<span class="etiqueta" style="position:static;display:inline-block">Mas vendido</span>' : '');

  const amazon = p.exclusiveWeb ? '' :
    `<a class="btn btn-amazon btn-bloque" href="${DATA.amazonStore}" target="_blank" rel="noopener">Ver en Amazon</a>`;

  const features = (p.features || []).map(f => `<li>${f}</li>`).join('');

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
  const bullets = (p.bullets || []).map(b => `<li>${b}</li>`).join('');
  const bulletsBlock = bullets
    ? `<ul class="ficha-bullets">${bullets}</ul>`
    : '';

  const s = p.specs || {};
  const specsRows = [
    s.peso ? `<div class="ficha-spec"><span>Formato</span><span>${s.peso}</span></div>` : '',
    s.natural ? `<div class="ficha-spec"><span>Naturalidad</span><span>${s.natural}</span></div>` : '',
    s.cpnp ? `<div class="ficha-spec"><span>Registro CPNP</span><span>${s.cpnp}</span></div>` : '',
    s.fabricacion ? `<div class="ficha-spec"><span>Fabricacion</span><span>${s.fabricacion}</span></div>` : '',
  ].join('');
  const specsBlock = (specsRows || s.inci) ? `
      <div class="ficha-bloque">
        <h4>📋 Especificaciones</h4>
        ${specsRows}
        ${s.inci ? `<div class="ficha-inci"><strong>Ingredientes (INCI):</strong> ${s.inci}</div>` : ''}
        ${s.inci ? `<div class="ficha-transparencia">🌿 <strong>Transparencia total:</strong> declaramos el 100% de los ingredientes, incluidos los alergenos del perfume aunque la ley no obligue a listarlos en concentraciones tan bajas. Nada que esconder.</div>` : ''}
      </div>` : '';

  cont.innerHTML = `
    ${galeria}
    <div class="ficha-info">
      <div class="ficha-cabecera">
        <span class="ficha-coleccion">${p.collectionName}</span>
        ${etiqueta}
      </div>
      <h2>${p.title}</h2>
      <div class="card-precio" style="font-size:1.4rem">${eur(p.price)} <small>IVA incl.</small></div>
      <p class="ficha-desc">${p.descripcion || p.short}</p>
      ${bulletsBlock}

      ${p.indicado ? `<div class="ficha-bloque"><h4>✨ Para que es bueno</h4><p>${p.indicado}</p></div>` : ''}
      ${p.modoUso ? `<div class="ficha-bloque"><h4>💧 Modo de uso</h4><p>${p.modoUso}</p></div>` : ''}
      ${features ? `<div class="ficha-bloque"><h4>🌿 Caracteristicas</h4><ul class="ficha-features">${features}</ul></div>` : ''}
      ${specsBlock}

      <div class="ficha-acciones">
        <button class="btn btn-primario btn-bloque" onclick="addToCart('${p.handle}'); cerrarFicha();">Anadir al carrito</button>
        ${amazon}
      </div>
      ${p.lema ? `<p class="ficha-lema">${p.lema}</p>` : ''}
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
          <h2 class="seccion-titulo">${col.name}${badge}</h2>
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
      DATA.collections.map(c => `<button class="chip" data-filtro="${c.slug}">${c.name}</button>`).join('');
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
       <span>${c.name}</span>
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
    '.historia', '.seccion', '.card', '.beneficio'
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

document.addEventListener('DOMContentLoaded', () => {
  renderTienda();
  renderLandingBestSellers();
  renderLandingCategorias();
  initReveal();
});
