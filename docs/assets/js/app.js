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
          <button class="btn btn-primario btn-sm btn-bloque" onclick="Carrito.añadir('${p.handle}'); abrirCarrito();">Anadir al carrito</button>
          <button class="btn btn-secundario btn-sm btn-bloque" onclick="abrirFicha('${p.handle}')">Ver detalles</button>
          ${amazon}
        </div>
      </div>
    </article>`;
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
      </div>` : '';

  cont.innerHTML = `
    <div class="ficha-img"><img src="${p.image}" alt="${p.title}"></div>
    <div class="ficha-info">
      <div class="ficha-cabecera">
        <span class="ficha-coleccion">${p.collectionName}</span>
        ${etiqueta}
      </div>
      <h2>${p.title}</h2>
      <div class="card-precio" style="font-size:1.4rem">${eur(p.price)} <small>IVA incl.</small></div>
      <p class="ficha-desc">${p.descripcion || p.short}</p>

      ${p.indicado ? `<div class="ficha-bloque"><h4>✨ Para que es bueno</h4><p>${p.indicado}</p></div>` : ''}
      ${p.modoUso ? `<div class="ficha-bloque"><h4>💧 Modo de uso</h4><p>${p.modoUso}</p></div>` : ''}
      ${features ? `<div class="ficha-bloque"><h4>🌿 Caracteristicas</h4><ul class="ficha-features">${features}</ul></div>` : ''}
      ${specsBlock}

      <div class="ficha-acciones">
        <button class="btn btn-primario btn-bloque" onclick="Carrito.añadir('${p.handle}'); cerrarFicha(); abrirCarrito();">Anadir al carrito</button>
        ${amazon}
      </div>
      ${p.lema ? `<p class="ficha-lema">${p.lema}</p>` : ''}
    </div>`;

  document.getElementById('ficha-overlay')?.classList.add('abierto');
  document.getElementById('panel-ficha')?.classList.add('abierto');
  document.body.style.overflow = 'hidden';
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

document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarFicha(); });

document.addEventListener('DOMContentLoaded', () => {
  renderTienda();
  renderLandingBestSellers();
  renderLandingCategorias();
});
