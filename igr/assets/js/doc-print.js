/* ===========================================================================
   IGR — Plantilla imprimible de presupuestos y facturas
   Genera el documento en #printArea y lanza la impresion del navegador
   (desde ahi se guarda como PDF con "Destino: Guardar como PDF").
   =========================================================================== */
window.IGRDoc = (function () {
  "use strict";
  var DB = window.IGRDB;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function bloqueEmpresa(e) {
    return [
      "<b>" + esc(e.nombre) + "</b>",
      "NIF: " + esc(e.cif),
      esc(e.direccion),
      esc([e.cp, e.ciudad].filter(Boolean).join(" ")) + (e.provincia ? " (" + esc(e.provincia) + ")" : ""),
      esc(e.telefono) + (e.email ? " · " + esc(e.email) : "")
    ].filter(Boolean).join("<br>");
  }

  function bloqueCliente(c) {
    if (!c) return "<i>Sin cliente asignado</i>";
    return [
      "<b>" + esc(c.nombre) + "</b>",
      c.nif ? "NIF/CIF: " + esc(c.nif) : "",
      esc(c.direccion),
      esc([c.cp, c.ciudad].filter(Boolean).join(" ")) + (c.provincia ? " (" + esc(c.provincia) + ")" : ""),
      [c.telefono, c.email].filter(Boolean).map(esc).join(" · ")
    ].filter(Boolean).join("<br>");
  }

  function filas(doc) {
    return (doc.lineas || []).filter(function (l) { return l.concepto || DB.num(l.precio); })
      .map(function (l) {
        var base = DB.round2(DB.num(l.cantidad) * DB.num(l.precio) * (1 - DB.num(l.dto) / 100));
        return "<tr>" +
          "<td>" + esc(l.concepto) + (l.detalle ? '<span class="det">' + esc(l.detalle) + "</span>" : "") + "</td>" +
          '<td class="num">' + DB.dec(l.cantidad) + " " + esc(l.unidad || "") + "</td>" +
          '<td class="num">' + DB.money(l.precio) + "</td>" +
          '<td class="num">' + (DB.num(l.dto) ? DB.dec(l.dto) + " %" : "—") + "</td>" +
          '<td class="num">' + (doc.isp ? "ISP" : DB.dec(l.iva) + " %") + "</td>" +
          '<td class="num">' + DB.money(base) + "</td>" +
        "</tr>";
      }).join("");
  }

  function avisosLegales(doc, t) {
    var e = DB.load().empresa, out = [];
    if (doc.isp) {
      out.push("<b>Inversion del sujeto pasivo.</b> Operacion no sujeta a repercusion de IVA conforme " +
               "al articulo 84.Uno.2º.f) de la Ley 37/1992: el destinatario es el sujeto pasivo del impuesto.");
    } else if (t.ivas.some(function (g) { return g.pct === 10; })) {
      out.push("<b>IVA reducido del 10 %.</b> Se aplica el tipo reducido por tratarse de obras de renovacion " +
               "o reparacion en vivienda de uso particular con mas de dos anos de antiguedad, en las que el " +
               "coste de los materiales aportados no supera el 40 % de la base imponible (art. 91.Uno.2.10º " +
               "de la Ley 37/1992). El cliente declara que se cumplen estos requisitos.");
    }
    if (DB.num(doc.irpf)) {
      out.push("<b>Retencion de IRPF del " + DB.dec(doc.irpf) + " %</b> practicada por el destinatario.");
    }
    if (doc.tipo === "factura") {
      out.push("<b>Vencimiento:</b> " + DB.fecha(doc.vencimiento) + " · <b>Forma de pago:</b> " +
               esc(doc.formaPago || "Transferencia") + (e.iban ? " · <b>IBAN:</b> " + esc(e.iban) : ""));
      var cob = DB.cobrado(doc);
      if (cob > 0) {
        out.push("<b>Cobros registrados:</b> " + DB.money(cob) + " · <b>Pendiente:</b> " + DB.money(DB.pendiente(doc)));
      }
    } else {
      out.push("<b>Validez de la oferta:</b> hasta el " + DB.fecha(doc.validez) +
               ". Los precios pueden variar si cambian las mediciones o las calidades acordadas.");
    }
    if (doc.condiciones) out.push(esc(doc.condiciones));
    if (doc.notas) out.push("<b>Notas:</b> " + esc(doc.notas));
    return out.map(function (x) { return "<p>" + x + "</p>"; }).join("");
  }

  function html(doc) {
    var e = DB.load().empresa;
    var c = doc.clienteId ? DB.buscar("clientes", doc.clienteId) : null;
    var obra = doc.obraId ? DB.buscar("obras", doc.obraId) : null;
    var t = DB.totales(doc);
    var esFactura = doc.tipo === "factura";

    var totFilas = "";
    totFilas += '<div class="row"><span>Base imponible</span><b>' + DB.money(t.base) + "</b></div>";
    t.ivas.forEach(function (g) {
      if (doc.isp) return;
      totFilas += '<div class="row"><span>IVA ' + DB.dec(g.pct) + " % s/ " + DB.money(g.base) +
                  "</span><b>" + DB.money(g.cuota) + "</b></div>";
    });
    if (doc.isp) totFilas += '<div class="row"><span>IVA</span><b>Inversion del sujeto pasivo</b></div>';
    if (t.irpf) totFilas += '<div class="row"><span>Retencion IRPF ' + DB.dec(doc.irpf) + " %</span><b>−" + DB.money(t.irpf) + "</b></div>";
    totFilas += '<div class="row row--big"><span>Total</span><span>' + DB.money(t.total) + "</span></div>";

    return '<div class="doc">' +
      '<div class="doc__head">' +
        '<div class="doc__logo"><span class="mk">IGR</span><span>' +
          "<b>" + esc(e.nombre) + "</b>" +
          "<span>NIF " + esc(e.cif) + " · " + esc(e.telefono) + " · " + esc(e.web || e.email) + "</span>" +
        "</span></div>" +
        '<div class="doc__meta">' +
          '<div class="n">' + (esFactura ? "Factura" : "Presupuesto") + "</div>" +
          "<div><b>" + esc(doc.numero || "(sin numerar)") + "</b></div>" +
          "<div>Fecha: " + DB.fecha(doc.fecha) + "</div>" +
          (esFactura ? "<div>Vencimiento: " + DB.fecha(doc.vencimiento) + "</div>"
                     : "<div>Valido hasta: " + DB.fecha(doc.validez) + "</div>") +
        "</div>" +
      "</div>" +

      '<div class="doc__parts">' +
        "<div><h4>Emisor</h4><p>" + bloqueEmpresa(e) + "</p></div>" +
        "<div><h4>" + (esFactura ? "Cliente" : "Destinatario") + "</h4><p>" + bloqueCliente(c) + "</p></div>" +
      "</div>" +
      (obra ? '<p style="font-size:.84rem;margin:-.4rem 0 1rem"><b>Obra:</b> ' + esc(obra.nombre) +
              (obra.direccion ? " — " + esc(obra.direccion) : "") + "</p>" : "") +

      "<table><thead><tr>" +
        "<th>Concepto</th><th class=\"num\">Cantidad</th><th class=\"num\">Precio</th>" +
        "<th class=\"num\">Dto.</th><th class=\"num\">IVA</th><th class=\"num\">Importe</th>" +
      "</tr></thead><tbody>" + filas(doc) + "</tbody></table>" +

      '<div class="doc__tot">' + totFilas + "</div>" +
      '<div class="doc__legal">' + avisosLegales(doc, t) + "</div>" +
      (esFactura ? "" :
        '<div class="doc__firma"><div>Por la empresa</div><div>Conforme el cliente (fecha y firma)</div></div>') +
    "</div>";
  }

  function imprimir(doc) {
    var area = document.getElementById("printArea");
    area.innerHTML = html(doc);
    document.title = (doc.tipo === "factura" ? "Factura " : "Presupuesto ") + (doc.numero || "");
    window.print();
  }

  return { html: html, imprimir: imprimir, esc: esc };
})();
