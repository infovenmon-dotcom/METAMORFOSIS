/* ===========================================================================
   IGR — Panel de gestion: presupuestos, facturas, clientes, obras y gastos
   Vanilla JS, sin dependencias. Router por hash (#/vista).
   =========================================================================== */
(function () {
  "use strict";
  var DB = window.IGRDB, Doc = window.IGRDoc;
  var esc = Doc.esc;

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var view = $("#view"), titulo = $("#viewTitle"), sub = $("#viewSub"), acciones = $("#viewActions");

  var UNIDADES = ["ud", "m²", "ml", "m³", "h", "kg", "partida", "jornada"];
  var IVAS = [21, 10, 4, 0];
  var CATEGORIAS = ["Material", "Subcontrata", "Maquinaria", "Personal", "Vehiculos y combustible",
                    "Seguros", "Licencias y tasas", "Herramienta", "Gestoria", "Otros"];
  var MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  /* ======================================================================
     Utilidades de interfaz
     ====================================================================== */
  var toastT;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove("is-on"); }, 2600);
  }

  function modal(titulo, cuerpo, botones) {
    var m = $("#modal");
    $("#modalTitle").textContent = titulo;
    $("#modalBody").innerHTML = cuerpo;
    var foot = $("#modalFoot");
    foot.innerHTML = "";
    (botones || []).forEach(function (b) {
      var el = document.createElement("button");
      el.className = "btn " + (b.clase || "btn--ghost");
      el.textContent = b.texto;
      el.addEventListener("click", function () { if (b.accion) b.accion(); });
      foot.appendChild(el);
    });
    m.classList.add("is-open");
    var primero = $("#modalBody input, #modalBody select, #modalBody textarea");
    if (primero) setTimeout(function () { primero.focus(); }, 40);
    return m;
  }
  function cerrarModal() { $("#modal").classList.remove("is-open"); }

  function confirmar(texto, alConfirmar, textoBoton) {
    modal("Confirmar", "<p>" + texto + "</p>", [
      { texto: "Cancelar", accion: cerrarModal },
      { texto: textoBoton || "Si, continuar", clase: "btn--danger", accion: function () { cerrarModal(); alConfirmar(); } }
    ]);
  }

  function opciones(lista, valor, vacio) {
    var out = vacio ? '<option value="">' + vacio + "</option>" : "";
    lista.forEach(function (o) {
      var v = typeof o === "object" ? o.v : o;
      var t = typeof o === "object" ? o.t : o;
      out += '<option value="' + esc(v) + '"' + (String(v) === String(valor) ? " selected" : "") + ">" + esc(t) + "</option>";
    });
    return out;
  }

  function tag(estado) { return '<span class="tag tag--' + esc(estado) + '">' + esc(estado) + "</span>"; }

  function nombreCliente(id) {
    var c = id ? DB.buscar("clientes", id) : null;
    return c ? c.nombre : "—";
  }
  function nombreObra(id) {
    var o = id ? DB.buscar("obras", id) : null;
    return o ? o.nombre : "—";
  }
  function listaClientes() {
    return DB.coleccion("clientes").slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre); })
      .map(function (c) { return { v: c.id, t: c.nombre }; });
  }
  function listaObras() {
    return DB.coleccion("obras").map(function (o) { return { v: o.id, t: o.nombre }; });
  }
  function anios() {
    var set = {};
    set[new Date().getFullYear()] = true;
    ["facturas", "presupuestos", "gastos"].forEach(function (k) {
      DB.coleccion(k).forEach(function (x) { if (x.fecha) set[String(x.fecha).slice(0, 4)] = true; });
    });
    return Object.keys(set).sort().reverse();
  }

  function vacioMsg(titulo, texto, boton) {
    return '<div class="empty"><b>' + esc(titulo) + "</b><p>" + esc(texto) + "</p>" + (boton || "") + "</div>";
  }

  /* ======================================================================
     Vista: resumen
     ====================================================================== */
  function vistaResumen() {
    titulo.textContent = "Resumen";
    var y = new Date().getFullYear();
    var r = DB.resumen(y);
    sub.textContent = "Ejercicio " + y + " · datos guardados en este navegador";
    acciones.innerHTML =
      '<a class="btn" href="#/presupuesto/nuevo">+ Presupuesto</a>' +
      '<a class="btn btn--dark" href="#/factura/nuevo">+ Factura</a>';

    var meses = DB.porMes(y);
    var max = Math.max.apply(null, meses.concat([1]));
    var ALTO_MAX = 128;
    var chart = meses.map(function (v, i) {
      var h = v ? Math.max(4, Math.round(v / max * ALTO_MAX)) : 2;
      return '<div class="b" title="' + MESES[i] + ": " + DB.money(v) + '">' +
             "<b>" + (v ? Math.round(v / 1000) + "k" : "") + "</b>" +
             '<div class="cbar" style="height:' + h + 'px"></div><span>' + MESES[i] + "</span></div>";
    }).join("");

    var facturas = DB.coleccion("facturas").slice().sort(function (a, b) { return (b.fecha || "").localeCompare(a.fecha || ""); });
    var pendientes = facturas.filter(function (f) {
      var e = DB.estadoFactura(f);
      return e === "emitida" || e === "parcial" || e === "vencida";
    }).slice(0, 6);

    var presPend = DB.coleccion("presupuestos").filter(function (p) {
      return p.estado === "borrador" || p.estado === "enviado";
    }).slice(0, 6);

    var obrasCurso = DB.coleccion("obras").filter(function (o) { return o.estado === "en curso"; });

    view.innerHTML =
      '<div class="grid g4">' +
        kpi("Facturado " + y, DB.money(r.facturado), "Base imponible, sin IVA") +
        kpi("Pendiente de cobro", DB.money(r.pendiente), r.vencido ? "Vencido: " + DB.money(r.vencido) : "Al dia", r.vencido ? "kpi--bad" : "") +
        kpi("Gastos " + y, DB.money(r.gastos), "IVA soportado: " + DB.money(r.ivaSoportado)) +
        kpi("Resultado", DB.money(r.resultado), "Facturado − gastos", r.resultado >= 0 ? "kpi--ok" : "kpi--bad") +
      "</div>" +

      '<div class="grid g2">' +
        '<div class="card"><h2>Facturacion mes a mes</h2><div class="chart">' + chart + "</div></div>" +
        '<div class="card"><h2>Presupuestos</h2>' +
          '<div class="grid g3" style="gap:.6rem">' +
            kpi("Emitidos", r.presupuestos, "En " + y) +
            kpi("Aceptados", r.aceptados, DB.money(r.importeAceptado), "kpi--ok") +
            kpi("Tasa de exito", r.tasaExito + " %", "Aceptados / emitidos") +
          "</div>" +
          '<h3 style="margin:1.1rem 0 .5rem">Esperando respuesta</h3>' +
          (presPend.length ? tablaMini(presPend.map(function (p) {
            return ['<a class="link" href="#/presupuesto/' + p.id + '">' + esc(p.numero || "borrador") + "</a>",
                    esc(nombreCliente(p.clienteId)), DB.money(DB.totales(p).total), tag(p.estado)];
          })) : '<p class="empty" style="padding:1rem">No hay presupuestos pendientes.</p>') +
        "</div>" +
      "</div>" +

      '<div class="grid g2">' +
        '<div class="card"><h2>Cobros pendientes</h2>' +
          (pendientes.length ? tablaMini(pendientes.map(function (f) {
            var e = DB.estadoFactura(f);
            return ['<a class="link" href="#/factura/' + f.id + '">' + esc(f.numero || "borrador") + "</a>",
                    esc(nombreCliente(f.clienteId)),
                    "vence " + DB.fecha(f.vencimiento),
                    DB.money(DB.pendiente(f)), tag(e)];
          })) : '<p class="empty" style="padding:1rem">Todo cobrado. Bien.</p>') +
        "</div>" +
        '<div class="card"><h2>Obras en curso</h2>' +
          (obrasCurso.length ? tablaMini(obrasCurso.map(function (o) {
            var b = DB.obraBalance(o.id);
            return ['<a class="link" href="#/obras">' + esc(o.nombre) + "</a>",
                    esc(nombreCliente(o.clienteId)),
                    "margen " + DB.money(b.margen) + " (" + b.pct + " %)"];
          })) : '<p class="empty" style="padding:1rem">No hay obras marcadas como en curso.</p>') +
        "</div>" +
      "</div>";
  }

  function kpi(t, v, d, clase) {
    return '<div class="kpi ' + (clase || "") + '"><div class="kpi__t">' + esc(t) + "</div>" +
           '<div class="kpi__v">' + v + '</div><div class="kpi__d">' + esc(d || "") + "</div></div>";
  }
  function tablaMini(filas) {
    return '<div class="tablewrap"><table class="t"><tbody>' + filas.map(function (f) {
      return "<tr>" + f.map(function (c, i) {
        return '<td' + (i > 1 ? ' class="num"' : "") + ">" + c + "</td>";
      }).join("") + "</tr>";
    }).join("") + "</tbody></table></div>";
  }

  /* ======================================================================
     Vista: listado de documentos (presupuestos / facturas)
     ====================================================================== */
  var filtros = { q: "", estado: "", anio: "" };

  function vistaDocs(tipo) {
    var esFactura = tipo === "factura";
    var col = esFactura ? "facturas" : "presupuestos";
    titulo.textContent = esFactura ? "Facturas" : "Presupuestos";
    acciones.innerHTML = '<a class="btn" href="#/' + tipo + '/nuevo">' + (esFactura ? "+ Nueva factura" : "+ Nuevo presupuesto") + "</a>" +
      '<button class="btn btn--ghost" id="expCsv">Exportar CSV</button>';

    var estados = esFactura
      ? ["borrador", "emitida", "parcial", "cobrada", "vencida", "anulada"]
      : ["borrador", "enviado", "aceptado", "rechazado"];

    view.innerHTML =
      '<div class="card card--pad0">' +
        '<div class="toolbar" style="padding:1rem 1rem 0">' +
          '<input class="search" id="fq" type="search" placeholder="Buscar por numero, cliente o concepto" value="' + esc(filtros.q) + '">' +
          '<select id="fEstado">' + opciones(estados, filtros.estado, "Todos los estados") + "</select>" +
          '<select id="fAnio">' + opciones(anios(), filtros.anio, "Todos los anos") + "</select>" +
        "</div>" +
        '<div id="lista"></div>' +
      "</div>";

    function pintar() {
      var docs = DB.coleccion(col).slice().sort(function (a, b) {
        return (b.fecha || "").localeCompare(a.fecha || "") || (b.numero || "").localeCompare(a.numero || "");
      });
      var q = filtros.q.toLowerCase();
      docs = docs.filter(function (d) {
        var estado = esFactura ? DB.estadoFactura(d) : d.estado;
        if (filtros.estado && estado !== filtros.estado) return false;
        if (filtros.anio && String(d.fecha).slice(0, 4) !== filtros.anio) return false;
        if (!q) return true;
        var txt = [d.numero, nombreCliente(d.clienteId), nombreObra(d.obraId),
                   (d.lineas || []).map(function (l) { return l.concepto; }).join(" ")].join(" ").toLowerCase();
        return txt.indexOf(q) > -1;
      });

      var total = docs.reduce(function (a, d) { return a + DB.totales(d).total; }, 0);
      sub.textContent = docs.length + " documento(s) · " + DB.money(total) + " en total";

      if (!docs.length) {
        $("#lista").innerHTML = vacioMsg("Nada por aqui",
          "No hay documentos con esos filtros.",
          '<a class="btn" href="#/' + tipo + '/nuevo">Crear el primero</a>');
        return;
      }

      $("#lista").innerHTML = '<div class="tablewrap"><table class="t"><thead><tr>' +
        "<th>Numero</th><th>Fecha</th><th>Cliente</th><th>Obra</th>" +
        '<th class="num">Base</th><th class="num">Total</th>' +
        (esFactura ? '<th class="num">Pendiente</th>' : "") +
        "<th>Estado</th><th></th></tr></thead><tbody>" +
        docs.map(function (d) {
          var t = DB.totales(d);
          var estado = esFactura ? DB.estadoFactura(d) : d.estado;
          return "<tr>" +
            '<td><a class="link" href="#/' + tipo + "/" + d.id + '">' + esc(d.numero || "(borrador)") + "</a></td>" +
            "<td>" + DB.fecha(d.fecha) + "</td>" +
            "<td>" + esc(nombreCliente(d.clienteId)) + "</td>" +
            "<td>" + esc(nombreObra(d.obraId)) + "</td>" +
            '<td class="num">' + DB.money(t.base) + "</td>" +
            '<td class="num"><b>' + DB.money(t.total) + "</b></td>" +
            (esFactura ? '<td class="num">' + (DB.pendiente(d) > 0.009 ? DB.money(DB.pendiente(d)) : "—") + "</td>" : "") +
            "<td>" + tag(estado) + "</td>" +
            '<td class="acts">' +
              '<button class="btn btn--ghost btn--sm" data-print="' + d.id + '">PDF</button> ' +
              '<button class="btn btn--ghost btn--sm" data-dup="' + d.id + '">Duplicar</button>' +
            "</td></tr>";
        }).join("") + "</tbody></table></div>";

      $$("[data-print]", view).forEach(function (b) {
        b.addEventListener("click", function () { Doc.imprimir(DB.buscar(col, b.dataset.print)); });
      });
      $$("[data-dup]", view).forEach(function (b) {
        b.addEventListener("click", function () {
          var o = JSON.parse(JSON.stringify(DB.buscar(col, b.dataset.dup)));
          o.id = ""; o.numero = ""; o.estado = "borrador"; o.fecha = DB.hoy(); o.pagos = [];
          if (esFactura) o.vencimiento = DB.sumaDias(DB.hoy(), DB.num(DB.load().empresa.diasVencimiento));
          else o.validez = DB.sumaDias(DB.hoy(), DB.num(DB.load().empresa.validezPresupuesto));
          var nuevo = DB.guardar(col, o);
          toast("Documento duplicado como borrador");
          location.hash = "#/" + tipo + "/" + nuevo.id;
        });
      });
    }

    $("#fq").addEventListener("input", function (e) { filtros.q = e.target.value; pintar(); });
    $("#fEstado").addEventListener("change", function (e) { filtros.estado = e.target.value; pintar(); });
    $("#fAnio").addEventListener("change", function (e) { filtros.anio = e.target.value; pintar(); });
    $("#expCsv").addEventListener("click", function () { exportarDocsCsv(col); });
    pintar();
  }

  function exportarDocsCsv(col) {
    var esFactura = col === "facturas";
    var filas = [["Numero", "Fecha", esFactura ? "Vencimiento" : "Valido hasta", "Cliente", "NIF", "Obra",
                  "Base", "IVA", "IRPF", "Total", esFactura ? "Cobrado" : "", esFactura ? "Pendiente" : "", "Estado"]];
    DB.coleccion(col).forEach(function (d) {
      var t = DB.totales(d);
      var c = d.clienteId ? DB.buscar("clientes", d.clienteId) : null;
      filas.push([d.numero, d.fecha, esFactura ? d.vencimiento : d.validez,
        c ? c.nombre : "", c ? c.nif : "", nombreObra(d.obraId),
        DB.dec(t.base), DB.dec(t.ivaTotal), DB.dec(t.irpf), DB.dec(t.total),
        esFactura ? DB.dec(DB.cobrado(d)) : "", esFactura ? DB.dec(DB.pendiente(d)) : "",
        esFactura ? DB.estadoFactura(d) : d.estado]);
    });
    DB.descargar(col + "-" + DB.hoy() + ".csv", DB.csv(filas), "text/csv");
    toast("CSV descargado");
  }

  /* ======================================================================
     Vista: editor de documento
     ====================================================================== */
  var borrador = null;

  function vistaEditor(tipo, id) {
    var esFactura = tipo === "factura";
    var col = esFactura ? "facturas" : "presupuestos";

    if (id === "nuevo") borrador = DB.nuevoDocumento(tipo);
    else {
      var enc = DB.buscar(col, id);
      if (!enc) { toast("Documento no encontrado"); location.hash = "#/" + col; return; }
      borrador = JSON.parse(JSON.stringify(enc));
    }
    if (!borrador.lineas || !borrador.lineas.length) borrador.lineas = [DB.lineaVacia()];

    titulo.textContent = (esFactura ? "Factura " : "Presupuesto ") + (borrador.numero || "nuevo");
    sub.textContent = borrador.id ? "Guardado el " + DB.fecha((borrador.modificado || "").slice(0, 10)) : "Sin guardar todavia";

    acciones.innerHTML =
      '<button class="btn btn--ghost btn--sm" id="btnPrint">Imprimir / PDF</button>' +
      (esFactura
        ? '<button class="btn btn--ghost btn--sm" id="btnCobro">Registrar cobro</button>' +
          '<button class="btn btn--dark btn--sm" id="btnEmitir">Emitir factura</button>'
        : '<button class="btn btn--ghost btn--sm" id="btnAceptar">Marcar aceptado</button>' +
          '<button class="btn btn--dark btn--sm" id="btnAFactura">Convertir en factura</button>') +
      '<button class="btn btn--sm" id="btnGuardar">Guardar</button>';

    var e = DB.load().empresa;
    view.innerHTML =
      '<div class="doc-edit">' +
        "<div>" +
          '<div class="card" style="margin-bottom:1rem">' +
            '<div class="formgrid">' +
              '<div class="field c2"><label for="dCliente">Cliente</label>' +
                '<select id="dCliente">' + opciones(listaClientes(), borrador.clienteId, "— Sin asignar —") + "</select>" +
                '<span class="hint"><a href="#/clientes">Gestionar clientes</a></span></div>' +
              '<div class="field c2"><label for="dObra">Obra</label>' +
                '<select id="dObra">' + opciones(listaObras(), borrador.obraId, "— Sin obra —") + "</select></div>" +
              '<div class="field"><label for="dFecha">Fecha</label><input id="dFecha" type="date" value="' + esc(borrador.fecha) + '"></div>' +
              (esFactura
                ? '<div class="field"><label for="dVenc">Vencimiento</label><input id="dVenc" type="date" value="' + esc(borrador.vencimiento || "") + '"></div>' +
                  '<div class="field"><label for="dPago">Forma de pago</label>' +
                    '<select id="dPago">' + opciones(["Transferencia", "Efectivo", "Tarjeta", "Domiciliacion", "Financiacion"], borrador.formaPago) + "</select></div>"
                : '<div class="field"><label for="dValidez">Valido hasta</label><input id="dValidez" type="date" value="' + esc(borrador.validez || "") + '"></div>' +
                  '<div class="field"><label for="dEstado">Estado</label>' +
                    '<select id="dEstado">' + opciones(["borrador", "enviado", "aceptado", "rechazado"], borrador.estado) + "</select></div>") +
              '<div class="field"><label for="dIrpf">Retencion IRPF (%)</label><input id="dIrpf" class="num" type="number" step="0.01" min="0" max="50" value="' + DB.num(borrador.irpf) + '"></div>' +
              '<div class="field c4"><label class="check"><input type="checkbox" id="dIsp"' + (borrador.isp ? " checked" : "") + '> Inversion del sujeto pasivo (art. 84.Uno.2º f LIVA)</label>' +
                '<span class="hint">Marca esta casilla cuando el cliente es empresa o promotor y la obra es una ejecucion de obra inmobiliaria: la factura sale sin IVA repercutido.</span></div>' +
            "</div>" +
          "</div>" +

          '<div class="card card--pad0">' +
            '<div style="padding:1rem 1rem .4rem;display:flex;gap:.6rem;flex-wrap:wrap;align-items:center">' +
              "<h2 style=\"margin:0;margin-right:auto\">Partidas</h2>" +
              '<select id="dTarifa" style="font:inherit;padding:.45rem .6rem;border:1px solid var(--line);border-radius:10px">' +
                opciones(DB.coleccion("tarifas").map(function (t) { return { v: t.id, t: t.concepto }; }), "", "Anadir desde tarifas...") +
              "</select>" +
              '<button class="btn btn--ghost btn--sm" id="dAddLinea">+ Linea</button>' +
            "</div>" +
            '<div class="tablewrap" style="padding:0 1rem 1rem"><table class="lines"><thead><tr>' +
              "<th style=\"width:38%\">Concepto</th><th>Ud.</th><th>Cant.</th><th>Precio</th><th>Dto %</th><th>IVA</th>" +
              "<th class=\"num\" style=\"text-align:right\">Importe</th><th></th>" +
            "</tr></thead><tbody id=\"dLineas\"></tbody></table></div>" +
          "</div>" +

          '<div class="card" style="margin-top:1rem">' +
            '<div class="formgrid">' +
              '<div class="field c4"><label for="dCond">Condiciones que salen en el documento</label>' +
                '<textarea id="dCond" rows="3">' + esc(borrador.condiciones || (esFactura ? e.pieFactura : e.condiciones)) + "</textarea></div>" +
              '<div class="field c4"><label for="dNotas">Notas internas / observaciones</label>' +
                '<textarea id="dNotas" rows="2">' + esc(borrador.notas || "") + "</textarea></div>" +
            "</div>" +
          "</div>" +
        "</div>" +

        '<div><div class="totales" id="dTot"></div>' +
          (esFactura ? '<div class="card" style="margin-top:1rem" id="dPagos"></div>' : "") +
        "</div>" +
      "</div>";

    pintarLineas();
    pintarTotales();
    if (esFactura) pintarPagos();

    /* --- Enlaces de los campos de cabecera --- */
    function bind(sel, campo, transformar) {
      var el = $(sel);
      if (!el) return;
      el.addEventListener(el.type === "checkbox" ? "change" : "input", function () {
        borrador[campo] = el.type === "checkbox" ? el.checked : (transformar ? transformar(el.value) : el.value);
        pintarTotales();
      });
    }
    bind("#dCliente", "clienteId"); bind("#dObra", "obraId"); bind("#dFecha", "fecha");
    bind("#dVenc", "vencimiento"); bind("#dValidez", "validez"); bind("#dPago", "formaPago");
    bind("#dEstado", "estado"); bind("#dIrpf", "irpf", DB.num); bind("#dIsp", "isp");
    bind("#dCond", "condiciones"); bind("#dNotas", "notas");

    $("#dAddLinea").addEventListener("click", function () {
      borrador.lineas.push(DB.lineaVacia());
      pintarLineas(); pintarTotales();
    });
    $("#dTarifa").addEventListener("change", function (ev) {
      var t = DB.buscar("tarifas", ev.target.value);
      if (!t) return;
      borrador.lineas.push({ concepto: t.concepto, detalle: "", unidad: t.unidad, cantidad: 1,
                             precio: t.precio, dto: 0, iva: t.iva });
      ev.target.value = "";
      pintarLineas(); pintarTotales();
    });

    $("#btnGuardar").addEventListener("click", function () { guardarDoc(col, tipo); });
    $("#btnPrint").addEventListener("click", function () {
      guardarDoc(col, tipo, true);
      Doc.imprimir(borrador);
    });

    if (esFactura) {
      $("#btnEmitir").addEventListener("click", function () { emitirFactura(col, tipo); });
      $("#btnCobro").addEventListener("click", registrarCobro);
    } else {
      $("#btnAceptar").addEventListener("click", function () {
        borrador.estado = "aceptado";
        if (!borrador.numero) borrador.numero = DB.siguienteNumero("presupuesto", new Date().getFullYear(), true);
        guardarDoc(col, tipo);
        vistaEditor(tipo, borrador.id);
      });
      $("#btnAFactura").addEventListener("click", function () {
        guardarDoc(col, tipo, true);
        var f = DB.presupuestoAFactura(borrador);
        var nueva = DB.guardar("facturas", f);
        toast("Factura creada en borrador desde el presupuesto");
        location.hash = "#/factura/" + nueva.id;
      });
    }

    /* --- Lineas --- */
    function pintarLineas() {
      var tb = $("#dLineas");
      tb.innerHTML = borrador.lineas.map(function (l, i) {
        var base = DB.round2(DB.num(l.cantidad) * DB.num(l.precio) * (1 - DB.num(l.dto) / 100));
        return "<tr>" +
          '<td><input data-i="' + i + '" data-k="concepto" value="' + esc(l.concepto || "") + '" placeholder="Concepto de la partida">' +
            '<div class="detalle"><input data-i="' + i + '" data-k="detalle" value="' + esc(l.detalle || "") + '" placeholder="Detalle (opcional)"></div></td>' +
          '<td style="width:88px"><select data-i="' + i + '" data-k="unidad">' + opciones(UNIDADES, l.unidad) + "</select></td>" +
          '<td style="width:86px"><input class="num" data-i="' + i + '" data-k="cantidad" type="number" step="0.01" value="' + DB.num(l.cantidad) + '"></td>' +
          '<td style="width:104px"><input class="num" data-i="' + i + '" data-k="precio" type="number" step="0.01" value="' + DB.num(l.precio) + '"></td>' +
          '<td style="width:74px"><input class="num" data-i="' + i + '" data-k="dto" type="number" step="0.5" value="' + DB.num(l.dto) + '"></td>' +
          '<td style="width:78px"><select data-i="' + i + '" data-k="iva">' + opciones(IVAS.map(function (v) { return { v: v, t: v + " %" }; }), l.iva) + "</select></td>" +
          '<td class="imp">' + DB.money(base) + "</td>" +
          '<td style="width:34px"><button class="del" data-del="' + i + '" title="Eliminar linea">×</button></td>' +
        "</tr>";
      }).join("");

      $$("#dLineas [data-k]").forEach(function (input) {
        input.addEventListener("input", function () {
          var i = +input.dataset.i, k = input.dataset.k;
          borrador.lineas[i][k] = (k === "concepto" || k === "detalle" || k === "unidad") ? input.value : DB.num(input.value);
          var fila = input.closest("tr");
          var l = borrador.lineas[i];
          fila.querySelector(".imp").textContent = DB.money(DB.num(l.cantidad) * DB.num(l.precio) * (1 - DB.num(l.dto) / 100));
          pintarTotales();
        });
        if (input.tagName === "SELECT") {
          input.addEventListener("change", function () { pintarTotales(); });
        }
      });
      $$("#dLineas [data-del]").forEach(function (b) {
        b.addEventListener("click", function () {
          borrador.lineas.splice(+b.dataset.del, 1);
          if (!borrador.lineas.length) borrador.lineas.push(DB.lineaVacia());
          pintarLineas(); pintarTotales();
        });
      });
    }

    /* --- Totales --- */
    function pintarTotales() {
      var t = DB.totales(borrador);
      var html = '<div class="row"><span>Base imponible</span><b>' + DB.money(t.base) + "</b></div>";
      if (borrador.isp) {
        html += '<div class="row"><span>IVA</span><b>Inversion sujeto pasivo</b></div>';
      } else {
        t.ivas.forEach(function (g) {
          html += '<div class="row"><span>IVA ' + DB.dec(g.pct) + " % s/ " + DB.money(g.base) + "</span><b>" + DB.money(g.cuota) + "</b></div>";
        });
      }
      if (t.irpf) html += '<div class="row"><span>Retencion IRPF ' + DB.dec(borrador.irpf) + " %</span><b>−" + DB.money(t.irpf) + "</b></div>";
      html += '<div class="row row--big"><span>Total</span><span>' + DB.money(t.total) + "</span></div>";
      if (esFactura) {
        var cob = DB.cobrado(borrador);
        html += '<div class="row muted"><span>Cobrado</span><b>' + DB.money(cob) + "</b></div>" +
                '<div class="row muted"><span>Pendiente</span><b>' + DB.money(t.total - cob) + "</b></div>" +
                '<div class="row muted"><span>Estado</span><b>' + DB.estadoFactura(borrador) + "</b></div>";
      }
      html += '<p class="muted" style="margin:.8rem 0 0">Los importes se redondean a dos decimales por linea, ' +
              "igual que en la factura impresa.</p>";
      $("#dTot").innerHTML = html;
    }

    /* --- Cobros --- */
    function pintarPagos() {
      var pagos = borrador.pagos || [];
      $("#dPagos").innerHTML = "<h2>Cobros</h2>" +
        (pagos.length
          ? '<div class="tablewrap"><table class="t"><tbody>' + pagos.map(function (p, i) {
              return "<tr><td>" + DB.fecha(p.fecha) + "</td><td>" + esc(p.medio || "") + "</td>" +
                     '<td class="num">' + DB.money(p.importe) + "</td>" +
                     '<td class="acts"><button class="del" data-pago="' + i + '">×</button></td></tr>';
            }).join("") + "</tbody></table></div>"
          : '<p style="color:var(--muted);font-size:.88rem">Sin cobros registrados.</p>') +
        '<button class="btn btn--ghost btn--sm" id="addPago" style="margin-top:.7rem">+ Anadir cobro</button>';

      $("#addPago").addEventListener("click", registrarCobro);
      $$("#dPagos [data-pago]").forEach(function (b) {
        b.addEventListener("click", function () {
          borrador.pagos.splice(+b.dataset.pago, 1);
          pintarPagos(); pintarTotales();
        });
      });
    }

    function registrarCobro() {
      var pend = DB.round2(DB.totales(borrador).total - DB.cobrado(borrador));
      modal("Registrar cobro",
        '<div class="formgrid">' +
          '<div class="field c2"><label for="pFecha">Fecha</label><input id="pFecha" type="date" value="' + DB.hoy() + '"></div>' +
          '<div class="field c2"><label for="pImp">Importe</label><input id="pImp" type="number" step="0.01" value="' + (pend > 0 ? pend : 0) + '"></div>' +
          '<div class="field c4"><label for="pMedio">Medio</label><select id="pMedio">' +
            opciones(["Transferencia", "Efectivo", "Tarjeta", "Domiciliacion", "Pagare"], "Transferencia") + "</select></div>" +
        "</div>",
        [{ texto: "Cancelar", accion: cerrarModal },
         { texto: "Guardar cobro", clase: "btn", accion: function () {
            borrador.pagos = borrador.pagos || [];
            borrador.pagos.push({ fecha: $("#pFecha").value, importe: DB.num($("#pImp").value), medio: $("#pMedio").value });
            if (borrador.estado === "borrador") borrador.estado = "emitida";
            cerrarModal(); pintarPagos(); pintarTotales();
            guardarDoc(col, tipo, true);
            toast("Cobro registrado");
         } }]);
    }

    function emitirFactura(col, tipo) {
      if (!borrador.clienteId) { toast("Asigna un cliente antes de emitir la factura"); return; }
      if (borrador.numero) { toast("Esta factura ya tiene numero: " + borrador.numero); return; }
      var y = parseInt(String(borrador.fecha).slice(0, 4), 10) || new Date().getFullYear();
      var propuesto = DB.siguienteNumero("factura", y, false);
      confirmar("Se emitira con el numero <b>" + propuesto + "</b> y la numeracion quedara consumida. " +
                "Una factura emitida no deberia modificarse: si hay un error, se corrige con una rectificativa.",
        function () {
          borrador.numero = DB.siguienteNumero("factura", y, true);
          borrador.estado = "emitida";
          guardarDoc(col, tipo, true);
          toast("Factura " + borrador.numero + " emitida");
          vistaEditor(tipo, borrador.id);
        }, "Emitir factura");
    }
  }

  function guardarDoc(col, tipo, silencioso) {
    if (!borrador.numero && borrador.estado !== "borrador" && tipo === "presupuesto") {
      borrador.numero = DB.siguienteNumero("presupuesto", new Date().getFullYear(), true);
    }
    var guardado = DB.guardar(col, borrador);
    borrador.id = guardado.id;
    if (!silencioso) toast("Guardado");
    if (location.hash.indexOf("nuevo") > -1) {
      history.replaceState(null, "", "#/" + tipo + "/" + guardado.id);
    }
    actualizarContadores();
  }

  /* ======================================================================
     Vista: clientes
     ====================================================================== */
  function vistaClientes() {
    titulo.textContent = "Clientes";
    acciones.innerHTML = '<button class="btn" id="nuevoCli">+ Nuevo cliente</button>';
    var cs = DB.coleccion("clientes").slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
    sub.textContent = cs.length + " cliente(s) en la agenda";

    view.innerHTML = '<div class="card card--pad0">' +
      (cs.length ? '<div class="tablewrap"><table class="t"><thead><tr>' +
        "<th>Cliente</th><th>NIF/CIF</th><th>Contacto</th><th>Poblacion</th>" +
        '<th class="num">Facturado</th><th class="num">Pendiente</th><th></th></tr></thead><tbody>' +
        cs.map(function (c) {
          var fs = DB.coleccion("facturas").filter(function (f) {
            return f.clienteId === c.id && f.estado !== "borrador" && f.estado !== "anulada";
          });
          var fact = fs.reduce(function (a, f) { return a + DB.totales(f).base; }, 0);
          var pend = fs.reduce(function (a, f) { return a + Math.max(0, DB.pendiente(f)); }, 0);
          return "<tr>" +
            "<td><b>" + esc(c.nombre) + "</b>" + (c.notas ? '<br><span style="color:var(--muted);font-size:.82rem">' + esc(c.notas) + "</span>" : "") + "</td>" +
            "<td>" + esc(c.nif || "—") + "</td>" +
            "<td>" + esc([c.telefono, c.email].filter(Boolean).join("<br>") || "—") + "</td>" +
            "<td>" + esc([c.cp, c.ciudad].filter(Boolean).join(" ") || "—") + "</td>" +
            '<td class="num">' + DB.money(fact) + "</td>" +
            '<td class="num">' + (pend > 0.009 ? DB.money(pend) : "—") + "</td>" +
            '<td class="acts">' +
              '<button class="btn btn--ghost btn--sm" data-edit="' + c.id + '">Editar</button> ' +
              '<button class="btn btn--ghost btn--sm" data-del="' + c.id + '">Borrar</button>' +
            "</td></tr>";
        }).join("") + "</tbody></table></div>"
        : vacioMsg("Sin clientes", "Anade el primero para poder emitir presupuestos y facturas.",
                   '<button class="btn" id="vacioCli">+ Nuevo cliente</button>')) +
      "</div>";

    var abrir = function (c) { formCliente(c); };
    if ($("#nuevoCli")) $("#nuevoCli").addEventListener("click", function () { abrir(null); });
    if ($("#vacioCli")) $("#vacioCli").addEventListener("click", function () { abrir(null); });
    $$("[data-edit]", view).forEach(function (b) {
      b.addEventListener("click", function () { abrir(DB.buscar("clientes", b.dataset.edit)); });
    });
    $$("[data-del]", view).forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.dataset.del;
        var usado = DB.coleccion("facturas").concat(DB.coleccion("presupuestos"))
          .some(function (d) { return d.clienteId === id; });
        if (usado) { toast("No se puede borrar: tiene documentos asociados"); return; }
        confirmar("Se borrara el cliente de la agenda. Esta accion no se puede deshacer.", function () {
          DB.borrar("clientes", id); vistaClientes(); toast("Cliente borrado");
        });
      });
    });
  }

  function formCliente(c) {
    c = c || {};
    modal(c.id ? "Editar cliente" : "Nuevo cliente",
      '<div class="formgrid">' +
        '<div class="field c3"><label for="cNombre">Nombre o razon social *</label><input id="cNombre" value="' + esc(c.nombre || "") + '"></div>' +
        '<div class="field"><label for="cNif">NIF / CIF</label><input id="cNif" value="' + esc(c.nif || "") + '"></div>' +
        '<div class="field c4"><label for="cDir">Direccion</label><input id="cDir" value="' + esc(c.direccion || "") + '"></div>' +
        '<div class="field"><label for="cCp">C.P.</label><input id="cCp" value="' + esc(c.cp || "") + '"></div>' +
        '<div class="field"><label for="cCiudad">Poblacion</label><input id="cCiudad" value="' + esc(c.ciudad || "") + '"></div>' +
        '<div class="field c2"><label for="cProv">Provincia</label><input id="cProv" value="' + esc(c.provincia || "") + '"></div>' +
        '<div class="field c2"><label for="cTel">Telefono</label><input id="cTel" value="' + esc(c.telefono || "") + '"></div>' +
        '<div class="field c2"><label for="cEmail">Email</label><input id="cEmail" type="email" value="' + esc(c.email || "") + '"></div>' +
        '<div class="field c4"><label for="cNotas">Notas</label><input id="cNotas" value="' + esc(c.notas || "") + '"></div>' +
      "</div>",
      [{ texto: "Cancelar", accion: cerrarModal },
       { texto: "Guardar", clase: "btn", accion: function () {
          var nombre = $("#cNombre").value.trim();
          if (!nombre) { toast("El nombre es obligatorio"); return; }
          DB.guardar("clientes", Object.assign({}, c, {
            nombre: nombre, nif: $("#cNif").value.trim(), direccion: $("#cDir").value.trim(),
            cp: $("#cCp").value.trim(), ciudad: $("#cCiudad").value.trim(), provincia: $("#cProv").value.trim(),
            telefono: $("#cTel").value.trim(), email: $("#cEmail").value.trim(), notas: $("#cNotas").value.trim()
          }));
          cerrarModal(); vistaClientes(); actualizarContadores(); toast("Cliente guardado");
       } }]);
  }

  /* ======================================================================
     Vista: obras
     ====================================================================== */
  function vistaObras() {
    titulo.textContent = "Obras";
    acciones.innerHTML = '<button class="btn" id="nuevaObra">+ Nueva obra</button>';
    var os = DB.coleccion("obras");
    sub.textContent = os.length + " obra(s) · margen = facturado − gastos imputados";

    view.innerHTML = '<div class="card card--pad0">' +
      (os.length ? '<div class="tablewrap"><table class="t"><thead><tr>' +
        "<th>Obra</th><th>Cliente</th><th>Fechas</th><th>Estado</th>" +
        '<th class="num">Facturado</th><th class="num">Gastos</th><th class="num">Margen</th><th></th>' +
        "</tr></thead><tbody>" +
        os.map(function (o) {
          var b = DB.obraBalance(o.id);
          var estadoTag = o.estado === "en curso" ? "curso" : (o.estado === "entregada" ? "entregada" : "borrador");
          return "<tr>" +
            "<td><b>" + esc(o.nombre) + "</b>" + (o.direccion ? '<br><span style="color:var(--muted);font-size:.82rem">' + esc(o.direccion) + "</span>" : "") + "</td>" +
            "<td>" + esc(nombreCliente(o.clienteId)) + "</td>" +
            "<td>" + DB.fecha(o.inicio) + " → " + DB.fecha(o.fin) + "</td>" +
            '<td><span class="tag tag--' + estadoTag + '">' + esc(o.estado || "prevista") + "</span></td>" +
            '<td class="num">' + DB.money(b.ingresos) + "</td>" +
            '<td class="num">' + DB.money(b.gastos) + "</td>" +
            '<td class="num"><b style="color:' + (b.margen >= 0 ? "var(--ok)" : "var(--bad)") + '">' +
              DB.money(b.margen) + " (" + b.pct + " %)</b></td>" +
            '<td class="acts"><button class="btn btn--ghost btn--sm" data-edit="' + o.id + '">Editar</button> ' +
              '<button class="btn btn--ghost btn--sm" data-del="' + o.id + '">Borrar</button></td>' +
          "</tr>";
        }).join("") + "</tbody></table></div>"
        : vacioMsg("Sin obras", "Crea una obra para agrupar presupuesto, facturas y gastos y ver su margen real.",
                   '<button class="btn" id="vacioObra">+ Nueva obra</button>')) +
      "</div>";

    if ($("#nuevaObra")) $("#nuevaObra").addEventListener("click", function () { formObra(null); });
    if ($("#vacioObra")) $("#vacioObra").addEventListener("click", function () { formObra(null); });
    $$("[data-edit]", view).forEach(function (b) {
      b.addEventListener("click", function () { formObra(DB.buscar("obras", b.dataset.edit)); });
    });
    $$("[data-del]", view).forEach(function (b) {
      b.addEventListener("click", function () {
        confirmar("Se borrara la obra. Los documentos y gastos asociados quedaran sin obra.", function () {
          DB.borrar("obras", b.dataset.del); vistaObras(); toast("Obra borrada");
        });
      });
    });
  }

  function formObra(o) {
    o = o || {};
    modal(o.id ? "Editar obra" : "Nueva obra",
      '<div class="formgrid">' +
        '<div class="field c2"><label for="oNombre">Nombre de la obra *</label><input id="oNombre" value="' + esc(o.nombre || "") + '"></div>' +
        '<div class="field c2"><label for="oCliente">Cliente</label><select id="oCliente">' + opciones(listaClientes(), o.clienteId, "— Sin asignar —") + "</select></div>" +
        '<div class="field c4"><label for="oDir">Direccion de la obra</label><input id="oDir" value="' + esc(o.direccion || "") + '"></div>' +
        '<div class="field c2"><label for="oIni">Inicio</label><input id="oIni" type="date" value="' + esc(o.inicio || "") + '"></div>' +
        '<div class="field c2"><label for="oFin">Fin previsto</label><input id="oFin" type="date" value="' + esc(o.fin || "") + '"></div>' +
        '<div class="field c2"><label for="oEstado">Estado</label><select id="oEstado">' +
          opciones(["prevista", "en curso", "entregada", "parada"], o.estado || "prevista") + "</select></div>" +
        '<div class="field c4"><label for="oNotas">Notas</label><input id="oNotas" value="' + esc(o.notas || "") + '"></div>' +
      "</div>",
      [{ texto: "Cancelar", accion: cerrarModal },
       { texto: "Guardar", clase: "btn", accion: function () {
          var nombre = $("#oNombre").value.trim();
          if (!nombre) { toast("Pon un nombre a la obra"); return; }
          DB.guardar("obras", Object.assign({}, o, {
            nombre: nombre, clienteId: $("#oCliente").value, direccion: $("#oDir").value.trim(),
            inicio: $("#oIni").value, fin: $("#oFin").value, estado: $("#oEstado").value,
            notas: $("#oNotas").value.trim()
          }));
          cerrarModal(); vistaObras(); actualizarContadores(); toast("Obra guardada");
       } }]);
  }

  /* ======================================================================
     Vista: gastos
     ====================================================================== */
  var filtroGasto = { anio: "", obra: "", cat: "" };

  function vistaGastos() {
    titulo.textContent = "Gastos";
    acciones.innerHTML = '<button class="btn" id="nuevoGasto">+ Nuevo gasto</button>' +
      '<button class="btn btn--ghost" id="expGastos">Exportar CSV</button>';

    view.innerHTML = '<div class="card card--pad0">' +
      '<div class="toolbar" style="padding:1rem 1rem 0">' +
        '<select id="gAnio">' + opciones(anios(), filtroGasto.anio, "Todos los anos") + "</select>" +
        '<select id="gCat">' + opciones(CATEGORIAS, filtroGasto.cat, "Todas las categorias") + "</select>" +
        '<select id="gObra">' + opciones(listaObras(), filtroGasto.obra, "Todas las obras") + "</select>" +
      "</div><div id=\"listaG\"></div></div>";

    function pintar() {
      var gs = DB.coleccion("gastos").slice().sort(function (a, b) { return (b.fecha || "").localeCompare(a.fecha || ""); })
        .filter(function (g) {
          if (filtroGasto.anio && String(g.fecha).slice(0, 4) !== filtroGasto.anio) return false;
          if (filtroGasto.cat && g.categoria !== filtroGasto.cat) return false;
          if (filtroGasto.obra && g.obraId !== filtroGasto.obra) return false;
          return true;
        });
      var base = gs.reduce(function (a, g) { return a + DB.num(g.base); }, 0);
      var iva = gs.reduce(function (a, g) { return a + DB.num(g.base) * DB.num(g.ivaPct) / 100; }, 0);
      sub.textContent = gs.length + " gasto(s) · base " + DB.money(base) + " · IVA soportado " + DB.money(iva);

      $("#listaG").innerHTML = gs.length
        ? '<div class="tablewrap"><table class="t"><thead><tr>' +
          "<th>Fecha</th><th>Proveedor</th><th>Categoria</th><th>Obra</th>" +
          '<th class="num">Base</th><th class="num">IVA</th><th class="num">Total</th><th></th>' +
          "</tr></thead><tbody>" + gs.map(function (g) {
            var cuota = DB.round2(DB.num(g.base) * DB.num(g.ivaPct) / 100);
            return "<tr>" +
              "<td>" + DB.fecha(g.fecha) + "</td>" +
              "<td><b>" + esc(g.proveedor || "—") + "</b>" + (g.notas ? '<br><span style="color:var(--muted);font-size:.82rem">' + esc(g.notas) + "</span>" : "") + "</td>" +
              "<td>" + esc(g.categoria || "—") + "</td>" +
              "<td>" + esc(nombreObra(g.obraId)) + "</td>" +
              '<td class="num">' + DB.money(g.base) + "</td>" +
              '<td class="num">' + DB.money(cuota) + " <span style=\"color:var(--muted)\">(" + DB.dec(g.ivaPct) + " %)</span></td>" +
              '<td class="num"><b>' + DB.money(DB.num(g.base) + cuota) + "</b></td>" +
              '<td class="acts"><button class="btn btn--ghost btn--sm" data-edit="' + g.id + '">Editar</button> ' +
                '<button class="btn btn--ghost btn--sm" data-del="' + g.id + '">Borrar</button></td>' +
            "</tr>";
          }).join("") + "</tbody></table></div>"
        : vacioMsg("Sin gastos", "Anota material, subcontratas y suministros para conocer el margen real de cada obra.",
                   '<button class="btn" id="vacioGasto">+ Nuevo gasto</button>');

      if ($("#vacioGasto")) $("#vacioGasto").addEventListener("click", function () { formGasto(null, pintar); });
      $$("[data-edit]", view).forEach(function (b) {
        b.addEventListener("click", function () { formGasto(DB.buscar("gastos", b.dataset.edit), pintar); });
      });
      $$("[data-del]", view).forEach(function (b) {
        b.addEventListener("click", function () {
          confirmar("Se borrara el gasto.", function () { DB.borrar("gastos", b.dataset.del); pintar(); actualizarContadores(); toast("Gasto borrado"); });
        });
      });
    }

    $("#gAnio").addEventListener("change", function (e) { filtroGasto.anio = e.target.value; pintar(); });
    $("#gCat").addEventListener("change", function (e) { filtroGasto.cat = e.target.value; pintar(); });
    $("#gObra").addEventListener("change", function (e) { filtroGasto.obra = e.target.value; pintar(); });
    $("#nuevoGasto").addEventListener("click", function () { formGasto(null, pintar); });
    $("#expGastos").addEventListener("click", function () {
      var filas = [["Fecha", "Proveedor", "NIF", "Categoria", "Obra", "Base", "IVA %", "Cuota IVA", "Total", "Notas"]];
      DB.coleccion("gastos").forEach(function (g) {
        var cuota = DB.round2(DB.num(g.base) * DB.num(g.ivaPct) / 100);
        filas.push([g.fecha, g.proveedor, g.nif, g.categoria, nombreObra(g.obraId),
                    DB.dec(g.base), DB.dec(g.ivaPct), DB.dec(cuota), DB.dec(DB.num(g.base) + cuota), g.notas]);
      });
      DB.descargar("gastos-" + DB.hoy() + ".csv", DB.csv(filas), "text/csv");
      toast("CSV descargado");
    });
    pintar();
  }

  function formGasto(g, despues) {
    g = g || {};
    modal(g.id ? "Editar gasto" : "Nuevo gasto",
      '<div class="formgrid">' +
        '<div class="field c2"><label for="gFecha">Fecha</label><input id="gFecha" type="date" value="' + esc(g.fecha || DB.hoy()) + '"></div>' +
        '<div class="field c2"><label for="gProv">Proveedor *</label><input id="gProv" value="' + esc(g.proveedor || "") + '"></div>' +
        '<div class="field c2"><label for="gNif">NIF del proveedor</label><input id="gNif" value="' + esc(g.nif || "") + '"></div>' +
        '<div class="field c2"><label for="gCategoria">Categoria</label><select id="gCategoria">' + opciones(CATEGORIAS, g.categoria || "Material") + "</select></div>" +
        '<div class="field c2"><label for="gObraSel">Obra</label><select id="gObraSel">' + opciones(listaObras(), g.obraId, "— Gasto general —") + "</select></div>" +
        '<div class="field"><label for="gBase">Base (€)</label><input id="gBase" type="number" step="0.01" value="' + DB.num(g.base) + '"></div>' +
        '<div class="field"><label for="gIva">IVA %</label><select id="gIva">' + opciones(IVAS.map(function (v) { return { v: v, t: v + " %" }; }), g.ivaPct == null ? 21 : g.ivaPct) + "</select></div>" +
        '<div class="field c4"><label for="gNotas">Notas</label><input id="gNotas" value="' + esc(g.notas || "") + '"></div>' +
        '<div class="field c4"><label class="check"><input type="checkbox" id="gPagado"' + (g.pagado !== false ? " checked" : "") + "> Pagado</label></div>" +
      "</div>",
      [{ texto: "Cancelar", accion: cerrarModal },
       { texto: "Guardar", clase: "btn", accion: function () {
          var prov = $("#gProv").value.trim();
          if (!prov) { toast("Indica el proveedor"); return; }
          DB.guardar("gastos", Object.assign({}, g, {
            fecha: $("#gFecha").value, proveedor: prov, nif: $("#gNif").value.trim(),
            categoria: $("#gCategoria").value, obraId: $("#gObraSel").value,
            base: DB.num($("#gBase").value), ivaPct: DB.num($("#gIva").value),
            notas: $("#gNotas").value.trim(), pagado: $("#gPagado").checked
          }));
          cerrarModal(); actualizarContadores(); toast("Gasto guardado");
          if (despues) despues();
       } }]);
  }

  /* ======================================================================
     Vista: informes e IVA
     ====================================================================== */
  var anioInforme = String(new Date().getFullYear());

  function vistaInformes() {
    titulo.textContent = "Informes e IVA";
    acciones.innerHTML = '<select id="iAnio" style="font:inherit;padding:.45rem .7rem;border:1px solid var(--line);border-radius:10px">' +
      opciones(anios(), anioInforme) + "</select>";

    function pintar() {
      var r = DB.resumen(anioInforme);
      var tri = DB.trimestres(anioInforme);
      sub.textContent = "Ejercicio " + anioInforme + " · cifras a partir de facturas emitidas y gastos registrados";

      /* Ranking de clientes por facturacion */
      var porCliente = {};
      DB.facturasEmitidas(anioInforme).forEach(function (f) {
        var k = f.clienteId || "sin";
        porCliente[k] = DB.round2((porCliente[k] || 0) + DB.totales(f).base);
      });
      var ranking = Object.keys(porCliente).map(function (k) { return { id: k, v: porCliente[k] }; })
        .sort(function (a, b) { return b.v - a.v; }).slice(0, 8);

      view.innerHTML =
        '<div class="grid g4">' +
          kpi("Facturado", DB.money(r.facturado), "Base imponible") +
          kpi("IVA repercutido", DB.money(r.ivaRepercutido), "Cobrado a clientes") +
          kpi("IVA soportado", DB.money(r.ivaSoportado), "Pagado a proveedores") +
          kpi("IVA a ingresar", DB.money(r.ivaRepercutido - r.ivaSoportado), "Repercutido − soportado",
              (r.ivaRepercutido - r.ivaSoportado) >= 0 ? "kpi--warn" : "kpi--ok") +
        "</div>" +

        '<div class="card"><h2>Resumen por trimestres (ayuda para el modelo 303)</h2>' +
          '<div class="tablewrap"><table class="t"><thead><tr><th>Trimestre</th>' +
          '<th class="num">Base repercutida</th><th class="num">IVA repercutido</th>' +
          '<th class="num">Base soportada</th><th class="num">IVA soportado</th>' +
          '<th class="num">Resultado</th></tr></thead><tbody>' +
          tri.map(function (t) {
            return "<tr><td><b>" + t.t + "T</b></td>" +
              '<td class="num">' + DB.money(t.baseRep) + "</td>" +
              '<td class="num">' + DB.money(t.ivaRep) + "</td>" +
              '<td class="num">' + DB.money(t.baseSop) + "</td>" +
              '<td class="num">' + DB.money(t.ivaSop) + "</td>" +
              '<td class="num"><b>' + DB.money(t.resultado) + "</b></td></tr>";
          }).join("") + "</tbody></table></div>" +
          '<p class="note" style="margin-top:.9rem">Estas cifras son una ayuda de gestion, no una declaracion. ' +
          "Revisalas con tu asesoria antes de presentar cualquier modelo.</p></div>" +

        '<div class="grid g2">' +
          '<div class="card"><h2>Clientes que mas facturan</h2>' +
            (ranking.length ? '<div class="tablewrap"><table class="t"><tbody>' + ranking.map(function (x) {
              var pct = r.facturado ? Math.round(x.v / r.facturado * 100) : 0;
              return "<tr><td>" + esc(x.id === "sin" ? "Sin cliente" : nombreCliente(x.id)) + "</td>" +
                     '<td class="num">' + DB.money(x.v) + "</td>" +
                     '<td class="num" style="color:var(--muted)">' + pct + " %</td></tr>";
            }).join("") + "</tbody></table></div>" : '<p class="empty">Sin datos todavia.</p>') +
          "</div>" +
          '<div class="card"><h2>Copias de seguridad</h2>' +
            '<p style="color:var(--muted);font-size:.9rem">Los datos viven en este navegador. Descarga una copia ' +
            "cada semana y guardala fuera del equipo (correo, disco o nube).</p>" +
            '<div class="actions" style="margin-top:.8rem">' +
              '<button class="btn" id="bkExport">Descargar copia (JSON)</button>' +
              '<button class="btn btn--ghost" id="bkImport">Restaurar copia</button>' +
              '<button class="btn btn--ghost" id="bkFacturas">CSV de facturas</button>' +
              '<button class="btn btn--ghost" id="bkGastos">CSV de gastos</button>' +
            "</div>" +
            '<input type="file" id="bkFile" accept="application/json" class="hidden">' +
          "</div>" +
        "</div>";

      $("#bkExport").addEventListener("click", function () {
        DB.descargar("igr-copia-" + DB.hoy() + ".json", DB.exportar(), "application/json");
        toast("Copia descargada");
      });
      $("#bkImport").addEventListener("click", function () { $("#bkFile").click(); });
      $("#bkFile").addEventListener("change", function (ev) {
        var file = ev.target.files[0];
        if (!file) return;
        var lector = new FileReader();
        lector.onload = function () {
          modal("Restaurar copia",
            "<p>Que quieres hacer con <b>" + esc(file.name) + "</b>?</p>" +
            "<p style=\"color:var(--muted);font-size:.88rem\"><b>Reemplazar</b> borra lo que hay ahora. " +
            "<b>Fusionar</b> anade solo los registros que no existan.</p>",
            [{ texto: "Cancelar", accion: cerrarModal },
             { texto: "Fusionar", accion: function () { restaurar(lector.result, "fusionar"); } },
             { texto: "Reemplazar", clase: "btn--danger", accion: function () { restaurar(lector.result, "reemplazar"); } }]);
        };
        lector.readAsText(file);
        ev.target.value = "";
      });
      $("#bkFacturas").addEventListener("click", function () { exportarDocsCsv("facturas"); });
      $("#bkGastos").addEventListener("click", function () {
        var filas = [["Fecha", "Proveedor", "Categoria", "Obra", "Base", "IVA %", "Total"]];
        DB.coleccion("gastos").forEach(function (g) {
          var cuota = DB.round2(DB.num(g.base) * DB.num(g.ivaPct) / 100);
          filas.push([g.fecha, g.proveedor, g.categoria, nombreObra(g.obraId), DB.dec(g.base), DB.dec(g.ivaPct), DB.dec(DB.num(g.base) + cuota)]);
        });
        DB.descargar("gastos-" + DB.hoy() + ".csv", DB.csv(filas), "text/csv");
        toast("CSV descargado");
      });
    }

    $("#iAnio").addEventListener("change", function (e) { anioInforme = e.target.value; pintar(); });
    pintar();
  }

  function restaurar(texto, modo) {
    try {
      DB.importar(texto, modo);
      cerrarModal();
      toast("Copia restaurada");
      actualizarContadores();
      router();
    } catch (e) {
      cerrarModal();
      toast("No se pudo leer el archivo: " + e.message);
    }
  }

  /* ======================================================================
     Vista: tarifas
     ====================================================================== */
  function vistaTarifas() {
    titulo.textContent = "Tarifas";
    sub.textContent = "Precios habituales para montar presupuestos en dos clics";
    acciones.innerHTML = '<button class="btn" id="nuevaTarifa">+ Nueva partida</button>';

    var ts = DB.coleccion("tarifas");
    view.innerHTML = '<div class="card card--pad0">' +
      '<div class="tablewrap"><table class="t"><thead><tr>' +
      "<th>Concepto</th><th>Unidad</th><th class=\"num\">Precio</th><th class=\"num\">IVA</th><th></th>" +
      "</tr></thead><tbody>" + ts.map(function (t, i) {
        return "<tr>" +
          '<td><input data-i="' + i + '" data-k="concepto" value="' + esc(t.concepto) + '" style="width:100%;border:1px solid transparent;background:transparent;font:inherit;padding:.3rem"></td>' +
          '<td><select data-i="' + i + '" data-k="unidad" style="font:inherit;border:1px solid var(--line);border-radius:8px;padding:.25rem">' + opciones(UNIDADES, t.unidad) + "</select></td>" +
          '<td class="num"><input data-i="' + i + '" data-k="precio" type="number" step="0.01" value="' + DB.num(t.precio) + '" style="width:96px;text-align:right;font:inherit;border:1px solid var(--line);border-radius:8px;padding:.25rem"></td>' +
          '<td class="num"><select data-i="' + i + '" data-k="iva" style="font:inherit;border:1px solid var(--line);border-radius:8px;padding:.25rem">' + opciones(IVAS.map(function (v) { return { v: v, t: v + " %" }; }), t.iva) + "</select></td>" +
          '<td class="acts"><button class="btn btn--ghost btn--sm" data-del="' + t.id + '">Borrar</button></td>' +
        "</tr>";
      }).join("") + "</tbody></table></div></div>";

    $$("#view [data-k]").forEach(function (input) {
      var ev = input.tagName === "SELECT" ? "change" : "input";
      input.addEventListener(ev, function () {
        var t = DB.coleccion("tarifas")[+input.dataset.i];
        t[input.dataset.k] = (input.dataset.k === "concepto" || input.dataset.k === "unidad") ? input.value : DB.num(input.value);
        DB.save();
      });
    });
    $$("#view [data-del]").forEach(function (b) {
      b.addEventListener("click", function () { DB.borrar("tarifas", b.dataset.del); vistaTarifas(); });
    });
    $("#nuevaTarifa").addEventListener("click", function () {
      DB.guardar("tarifas", { concepto: "Nueva partida", unidad: "ud", precio: 0, iva: DB.load().empresa.ivaDefecto });
      vistaTarifas();
    });
  }

  /* ======================================================================
     Vista: ajustes
     ====================================================================== */
  function vistaAjustes() {
    titulo.textContent = "Ajustes";
    sub.textContent = "Datos que salen en presupuestos y facturas";
    acciones.innerHTML = '<button class="btn" id="guardarAjustes">Guardar ajustes</button>';
    var e = DB.load().empresa;
    var num = DB.load().numeracion;

    view.innerHTML =
      '<div class="card"><h2>Datos de la empresa</h2><div class="formgrid">' +
        campo("aNombre", "Nombre o razon social", e.nombre, "c2") +
        campo("aCif", "NIF / CIF", e.cif, "c2") +
        campo("aDir", "Direccion", e.direccion, "c2") +
        campo("aCp", "C.P.", e.cp) + campo("aCiudad", "Poblacion", e.ciudad) +
        campo("aProv", "Provincia", e.provincia, "c2") +
        campo("aTel", "Telefono", e.telefono) + campo("aEmail", "Email", e.email) +
        campo("aWeb", "Web", e.web, "c2") +
        campo("aIban", "IBAN para cobros", e.iban, "c2") +
      "</div></div>" +

      '<div class="card"><h2>Impuestos y plazos</h2><div class="formgrid">' +
        '<div class="field"><label for="aIva">IVA por defecto</label><select id="aIva">' +
          opciones(IVAS.map(function (v) { return { v: v, t: v + " %" }; }), e.ivaDefecto) + "</select>" +
          '<span class="hint">21 % general · 10 % reformas de vivienda que cumplen los requisitos</span></div>' +
        campo("aIrpf", "Retencion IRPF por defecto (%)", e.irpfDefecto, "", "number") +
        campo("aVenc", "Dias hasta el vencimiento", e.diasVencimiento, "", "number") +
        campo("aValidez", "Validez del presupuesto (dias)", e.validezPresupuesto, "", "number") +
        campo("aSerieF", "Serie de facturas", e.serieFactura) +
        campo("aSerieP", "Serie de presupuestos", e.seriePresupuesto) +
        '<div class="field c2"><label>Numeracion consumida</label>' +
          '<span class="hint">' + (Object.keys(num).length
            ? Object.keys(num).map(function (k) { return k + ": " + num[k]; }).join(" · ")
            : "Todavia no se ha emitido ningun documento") + "</span></div>" +
        '<div class="field c4"><label for="aCond">Condiciones por defecto del presupuesto</label>' +
          '<textarea id="aCond" rows="3">' + esc(e.condiciones || "") + "</textarea></div>" +
        '<div class="field c4"><label for="aPie">Pie por defecto de la factura</label>' +
          '<textarea id="aPie" rows="2">' + esc(e.pieFactura || "") + "</textarea></div>" +
      "</div></div>" +

      '<div class="card"><h2>Acceso y datos</h2>' +
        '<div class="formgrid">' +
          '<div class="field c2"><label for="aPin">Clave del panel</label>' +
            '<input id="aPin" type="text" value="' + esc(e.pin || "") + '" placeholder="Vacio = sin clave">' +
            '<span class="hint">Proteccion basica de este equipo: evita que alguien abra el panel por descuido, ' +
            "pero no cifra los datos. No la reutilices de otra cuenta.</span></div>" +
          '<div class="field c2"><label>Donde estan los datos</label>' +
            '<span class="hint">En el almacenamiento local de este navegador. Si borras los datos de navegacion ' +
            "o cambias de equipo, se pierden: descarga copias desde Informes.</span></div>" +
        "</div>" +
        '<div class="actions" style="margin-top:1rem">' +
          '<button class="btn btn--ghost" id="ajDemo">Cargar datos de ejemplo</button>' +
          '<button class="btn btn--danger" id="ajReset">Borrar todos los datos</button>' +
        "</div>" +
      "</div>";

    $("#guardarAjustes").addEventListener("click", function () {
      var st = DB.load();
      st.empresa = Object.assign(st.empresa, {
        nombre: $("#aNombre").value.trim(), cif: $("#aCif").value.trim(), direccion: $("#aDir").value.trim(),
        cp: $("#aCp").value.trim(), ciudad: $("#aCiudad").value.trim(), provincia: $("#aProv").value.trim(),
        telefono: $("#aTel").value.trim(), email: $("#aEmail").value.trim(), web: $("#aWeb").value.trim(),
        iban: $("#aIban").value.trim(),
        ivaDefecto: DB.num($("#aIva").value), irpfDefecto: DB.num($("#aIrpf").value),
        diasVencimiento: DB.num($("#aVenc").value), validezPresupuesto: DB.num($("#aValidez").value),
        serieFactura: $("#aSerieF").value.trim() || "F", seriePresupuesto: $("#aSerieP").value.trim() || "P",
        condiciones: $("#aCond").value, pieFactura: $("#aPie").value, pin: $("#aPin").value.trim()
      });
      DB.save();
      toast("Ajustes guardados");
    });

    $("#ajDemo").addEventListener("click", function () {
      confirmar("Se anadiran clientes, obras, un presupuesto, una factura y gastos de ejemplo para probar el panel.",
        function () { DB.demo(); actualizarContadores(); toast("Datos de ejemplo cargados"); location.hash = "#/resumen"; },
        "Cargar ejemplo");
    });
    $("#ajReset").addEventListener("click", function () {
      confirmar("Se borraran <b>todos</b> los clientes, presupuestos, facturas, obras y gastos de este navegador. " +
                "Descarga antes una copia desde Informes si quieres conservarlos.",
        function () { DB.reset(); actualizarContadores(); toast("Datos borrados"); location.hash = "#/resumen"; router(); },
        "Borrar todo");
    });
  }

  function campo(id, label, valor, clase, tipo) {
    return '<div class="field ' + (clase || "") + '"><label for="' + id + '">' + esc(label) + "</label>" +
           '<input id="' + id + '" type="' + (tipo || "text") + '" value="' + esc(valor == null ? "" : valor) + '"></div>';
  }

  /* ======================================================================
     Router y arranque
     ====================================================================== */
  function actualizarContadores() {
    $$("[data-count]").forEach(function (el) {
      el.textContent = DB.coleccion(el.dataset.count).length;
    });
  }

  function router() {
    var h = (location.hash || "#/resumen").replace(/^#\//, "");
    var partes = h.split("/");
    var v = partes[0] || "resumen";
    cerrarModal();
    $("#app").classList.remove("is-open");
    window.scrollTo(0, 0);
    sub.textContent = "";

    $$("#menu .item").forEach(function (a) {
      var activo = a.dataset.v === v ||
        (v === "presupuesto" && a.dataset.v === "presupuestos") ||
        (v === "factura" && a.dataset.v === "facturas");
      a.classList.toggle("is-active", activo);
    });

    if (v === "resumen") return vistaResumen();
    if (v === "presupuestos") return vistaDocs("presupuesto");
    if (v === "facturas") return vistaDocs("factura");
    if (v === "presupuesto") return vistaEditor("presupuesto", partes[1] || "nuevo");
    if (v === "factura") return vistaEditor("factura", partes[1] || "nuevo");
    if (v === "clientes") return vistaClientes();
    if (v === "obras") return vistaObras();
    if (v === "gastos") return vistaGastos();
    if (v === "informes") return vistaInformes();
    if (v === "tarifas") return vistaTarifas();
    if (v === "ajustes") return vistaAjustes();
    location.hash = "#/resumen";
  }

  function arrancar() {
    $("#gate").classList.add("hidden");
    $("#app").classList.remove("hidden");
    actualizarContadores();
    router();
  }

  document.addEventListener("DOMContentLoaded", function () {
    DB.load();
    var pin = DB.load().empresa.pin;

    if (pin && sessionStorage.getItem("igr.acceso") !== "ok") {
      $("#gate").classList.remove("hidden");
      $("#gateForm").addEventListener("submit", function (e) {
        e.preventDefault();
        if ($("#gatePin").value === pin) {
          sessionStorage.setItem("igr.acceso", "ok");
          arrancar();
        } else {
          $("#gateErr").classList.remove("hidden");
          $("#gatePin").value = "";
          $("#gatePin").focus();
        }
      });
    } else {
      arrancar();
    }

    window.addEventListener("hashchange", router);
    $("#burger").addEventListener("click", function () { $("#app").classList.toggle("is-open"); });
    $$("#modal [data-close]").forEach(function (el) { el.addEventListener("click", cerrarModal); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarModal(); });

    /* Aviso de copia de seguridad una vez al dia */
    var ultima = localStorage.getItem("igr.aviso.copia");
    if (ultima !== DB.hoy() && DB.coleccion("facturas").length) {
      localStorage.setItem("igr.aviso.copia", DB.hoy());
      setTimeout(function () { toast("Recuerda descargar la copia de seguridad desde Informes"); }, 2000);
    }
  });
})();
