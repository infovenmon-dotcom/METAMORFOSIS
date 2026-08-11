/* ===========================================================================
   SAVIA DE ALMA — Asistente IA (chat flotante)
   Habla con el endpoint /chat del Worker, que responde con Claude usando el
   catálogo real. Si no hay endpoint configurado, no se muestra.
   =========================================================================== */
(function () {
  const EP = ((window.SAVIA_CONFIG && window.SAVIA_CONFIG.checkoutEndpoint) || '').replace(/\/+$/, '');
  if (!EP) return;

  const historial = [];
  let cargando = false;
  const SUGERENCIAS = [
    '¿Cuál me recomiendas para piel seca?',
    '¿Tenéis algo para pieles sensibles?',
    'Recomiéndame un champú sólido',
  ];

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // --- Botón flotante ---
  const fab = document.createElement('button');
  fab.className = 'chat-fab';
  fab.setAttribute('aria-label', 'Abrir asistente');
  fab.innerHTML = '<span class="chat-fab-ico">💬</span>';

  // --- Panel ---
  const panel = document.createElement('div');
  panel.className = 'chat-panel oculto';
  panel.innerHTML =
    '<div class="chat-cab">' +
      '<div><strong>Asistente Savia</strong><br><span class="chat-sub">Te ayudo a elegir 🌿</span></div>' +
      '<button class="chat-cerrar" aria-label="Cerrar">×</button>' +
    '</div>' +
    '<div class="chat-cuerpo" id="chat-cuerpo"></div>' +
    '<div class="chat-sugerencias" id="chat-sugerencias"></div>' +
    '<form class="chat-pie" id="chat-form">' +
      '<input type="text" id="chat-input" placeholder="Escribe tu pregunta…" autocomplete="off" maxlength="500">' +
      '<button type="submit" aria-label="Enviar">➤</button>' +
    '</form>';

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    pintarSugerencias();
    burbuja('assistant', '¡Hola! 🌿 Soy el asistente de Savia de Alma. Cuéntame qué buscas o qué tipo de piel/cabello tienes y te recomiendo el producto ideal.');
  });

  const cuerpo = () => document.getElementById('chat-cuerpo');

  function burbuja(role, texto) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + (role === 'user' ? 'chat-user' : 'chat-bot');
    div.innerHTML = esc(texto).replace(/\n/g, '<br>');
    cuerpo().appendChild(div);
    cuerpo().scrollTop = cuerpo().scrollHeight;
    return div;
  }

  function pintarSugerencias() {
    const cont = document.getElementById('chat-sugerencias');
    if (!cont) return;
    cont.innerHTML = SUGERENCIAS.map(s => `<button class="chat-chip">${esc(s)}</button>`).join('');
    cont.querySelectorAll('.chat-chip').forEach(b => b.addEventListener('click', () => enviar(b.textContent)));
  }

  function abrir() {
    panel.classList.remove('oculto');
    fab.classList.add('abierto');
    setTimeout(() => { const i = document.getElementById('chat-input'); if (i) i.focus(); }, 100);
  }
  function cerrar() { panel.classList.add('oculto'); fab.classList.remove('abierto'); }

  async function enviar(texto) {
    texto = (texto || '').trim();
    if (!texto || cargando) return;
    const sug = document.getElementById('chat-sugerencias');
    if (sug) sug.innerHTML = '';
    document.getElementById('chat-input').value = '';
    burbuja('user', texto);
    historial.push({ role: 'user', content: texto });
    cargando = true;
    const pensando = burbuja('assistant', '…');
    pensando.classList.add('chat-pensando');
    try {
      const r = await fetch(EP + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historial }),
      });
      const d = await r.json().catch(() => ({}));
      pensando.remove();
      const reply = d.reply || 'Uy, no he podido responder. Escríbenos a info@saviadealma.com 🌿';
      burbuja('assistant', reply);
      historial.push({ role: 'assistant', content: reply });
    } catch (e) {
      pensando.remove();
      burbuja('assistant', 'Uy, ha habido un problema de conexión. Inténtalo de nuevo o escríbenos a info@saviadealma.com 🌿');
    } finally {
      cargando = false;
    }
  }

  fab.addEventListener('click', () => (panel.classList.contains('oculto') ? abrir() : cerrar()));
  panel.addEventListener('click', e => {
    if (e.target.classList.contains('chat-cerrar')) cerrar();
  });
  panel.addEventListener('submit', e => {
    if (e.target.id === 'chat-form') { e.preventDefault(); enviar(document.getElementById('chat-input').value); }
  });
})();
