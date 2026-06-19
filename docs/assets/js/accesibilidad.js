/* ===========================================================================
   SAVIA DE ALMA — Widget de accesibilidad (propio, sin dependencias)
   Botón flotante fijo + panel con ajustes. Recuerda la elección (localStorage).
   =========================================================================== */
(function () {
  var OPCIONES = [
    { key: 'fuente-grande',   ico: 'Tt', label: 'Texto más grande' },
    { key: 'interlineado',    ico: '↕',  label: 'Más interlineado' },
    { key: 'legible',         ico: 'Aa', label: 'Fuente legible' },
    { key: 'contraste',       ico: '◐',  label: 'Alto contraste' },
    { key: 'grises',          ico: '▦',  label: 'Escala de grises' },
    { key: 'enlaces',         ico: '🔗', label: 'Resaltar enlaces' },
    { key: 'sin-imagenes',    ico: '🖼', label: 'Ocultar imágenes' },
    { key: 'sin-animaciones', ico: '⏸',  label: 'Pausar animaciones' }
  ];
  var LS = 'savia_a11y';
  var root = document.documentElement;

  function leer() {
    try { return JSON.parse(localStorage.getItem(LS)) || []; } catch (e) { return []; }
  }
  function guardar(arr) {
    try { localStorage.setItem(LS, JSON.stringify(arr)); } catch (e) {}
  }
  function aplicar(key, on) {
    root.classList.toggle('a11y-' + key, on);
    if (key === 'sin-animaciones') {
      document.querySelectorAll('video').forEach(function (v) {
        try { on ? v.pause() : v.play(); } catch (e) {}
      });
    }
  }

  function init() {
    var activos = leer();
    activos.forEach(function (k) { aplicar(k, true); });

    // Botón flotante
    var btn = document.createElement('button');
    btn.className = 'a11y-btn';
    btn.setAttribute('aria-label', 'Opciones de accesibilidad');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm9 5.5c0 .6-.5 1-1.1.9l-4.9-.7v4l1.9 6.2c.2.6-.2 1.2-.8 1.3-.5.2-1.1-.1-1.3-.7L13 18h-2l-1.5 5.8c-.2.6-.8.9-1.3.7-.6-.1-1-.7-.8-1.3L9.3 17v-4l-4.9.7C3.5 9.8 3 9.4 3 8.8c0-.6.5-1 1.1-.9L9 8.6c1 .1 4 .1 5 0l4.9-.7c.6-.1 1.1.3 1.1.9Z"/></svg>';

    // Panel
    var panel = document.createElement('div');
    panel.className = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Ajustes de accesibilidad');
    panel.hidden = true;

    var html = '<div class="a11y-cab"><strong>♿ Accesibilidad</strong>'
      + '<button class="a11y-x" aria-label="Cerrar">×</button></div>'
      + '<div class="a11y-grid">';
    OPCIONES.forEach(function (o) {
      var on = activos.indexOf(o.key) !== -1;
      html += '<button class="a11y-opt' + (on ? ' activo' : '') + '" data-key="' + o.key + '" aria-pressed="' + on + '">'
        + '<span class="a11y-ico">' + o.ico + '</span>' + o.label + '</button>';
    });
    html += '</div><button class="a11y-reset">↺ Restablecer todo</button>';
    panel.innerHTML = html;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    function abrir(v) {
      panel.hidden = !v;
      btn.setAttribute('aria-expanded', v ? 'true' : 'false');
    }
    btn.addEventListener('click', function () { abrir(panel.hidden); });
    panel.querySelector('.a11y-x').addEventListener('click', function () { abrir(false); });

    panel.querySelectorAll('.a11y-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.dataset.key;
        var arr = leer();
        var on = arr.indexOf(key) === -1;
        if (on) arr.push(key); else arr = arr.filter(function (k) { return k !== key; });
        guardar(arr);
        aplicar(key, on);
        b.classList.toggle('activo', on);
        b.setAttribute('aria-pressed', on);
      });
    });

    panel.querySelector('.a11y-reset').addEventListener('click', function () {
      OPCIONES.forEach(function (o) { aplicar(o.key, false); });
      guardar([]);
      panel.querySelectorAll('.a11y-opt').forEach(function (b) {
        b.classList.remove('activo'); b.setAttribute('aria-pressed', 'false');
      });
    });

    // Cerrar al pulsar fuera o con Escape
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) abrir(false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') abrir(false); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
