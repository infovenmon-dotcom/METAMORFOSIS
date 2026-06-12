/* ===========================================================================
   SAVIA DE ALMA — Renderizado de catalogo (tienda + landing)
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

  const desc = compacta ? '' : `<p class="card-desc">${p.short}</p>`;

  return `
    <article class="card" data-handle="${p.handle}" data-collection="${p.collection}">
      <div class="card-img">${etiqueta}<span>${p.emoji}</span></div>
      <div class="card-cuerpo">
        <h3>${p.title}</h3>
        ${desc}
        <div class="card-precio">${eur(p.price)} <small>IVA incl.</small></div>
        <div class="card-acciones">
          <button class="btn btn-primario btn-sm btn-bloque" onclick="Carrito.añadir('${p.handle}'); abrirCarrito();">Anadir al carrito</button>
          ${amazon}
        </div>
      </div>
    </article>`;
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

document.addEventListener('DOMContentLoaded', () => {
  renderTienda();
  renderLandingBestSellers();
  renderLandingCategorias();
});
