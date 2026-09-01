/* ===========================================================================
   IGR — Capa de datos del panel (sin dependencias)
   Guarda todo en el almacenamiento local del navegador y expone helpers de
   calculo (bases, IVA por tipo, retencion IRPF, cobros) y de numeracion.
   =========================================================================== */
window.IGRDB = (function () {
  "use strict";

  var KEY = "igr.db.v1";

  /* --- Utilidades -------------------------------------------------------- */
  function uid(p) {
    var r = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
    return (p || "id") + "_" + r;
  }
  function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }
  function num(n) { var v = parseFloat(String(n == null ? "" : n).replace(",", ".")); return isNaN(v) ? 0 : v; }

  var fmtEur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, useGrouping: "always" });
  var fmtNum = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });
  function money(n) { return fmtEur.format(round2(num(n))); }
  function dec(n) { return fmtNum.format(round2(num(n))); }

  function hoy() { return new Date().toISOString().slice(0, 10); }
  function fecha(iso) {
    if (!iso) return "—";
    var p = String(iso).slice(0, 10).split("-");
    return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : iso;
  }
  function sumaDias(iso, dias) {
    var d = new Date((iso || hoy()) + "T12:00:00");
    d.setDate(d.getDate() + (dias || 0));
    return d.toISOString().slice(0, 10);
  }
  function trimestre(iso) { return Math.floor((parseInt(String(iso).slice(5, 7), 10) - 1) / 3) + 1; }

  /* --- Estado inicial ---------------------------------------------------- */
  function empresaPorDefecto() {
    return {
      nombre: "Construcciones y Reformas IGR, S.L.",
      cif: "B00000000",
      direccion: "Calle de la Obra, 1",
      cp: "28000", ciudad: "Madrid", provincia: "Madrid",
      telefono: "600 000 000",
      email: "info@reformasigr.es",
      web: "www.reformasigr.es",
      iban: "ES00 0000 0000 0000 0000 0000",
      ivaDefecto: 21,
      irpfDefecto: 0,
      diasVencimiento: 30,
      validezPresupuesto: 30,
      serieFactura: "F",
      seriePresupuesto: "P",
      condiciones: "Forma de pago: 30 % a la firma, resto por certificaciones de obra ejecutada. " +
                   "El ultimo 10 % se abona en la entrega, tras el repaso final.",
      pieFactura: "Garantia de 3 anos sobre la ejecucion. Materiales y aparatos, segun garantia del fabricante.",
      pin: ""
    };
  }

  function vacio() {
    return {
      v: 1,
      empresa: empresaPorDefecto(),
      numeracion: {},          /* { "F-2026": 7, "P-2026": 12 } */
      clientes: [],
      obras: [],
      presupuestos: [],
      facturas: [],
      gastos: [],
      tarifas: [
        { id: uid("t"), concepto: "Demolicion y retirada de escombros", unidad: "m²", precio: 28, iva: 21 },
        { id: uid("t"), concepto: "Alicatado de pared (material aparte)", unidad: "m²", precio: 32, iva: 21 },
        { id: uid("t"), concepto: "Solado de suelo porcelanico", unidad: "m²", precio: 34, iva: 21 },
        { id: uid("t"), concepto: "Tabiqueria de pladur con aislamiento", unidad: "m²", precio: 46, iva: 21 },
        { id: uid("t"), concepto: "Instalacion electrica por punto de luz", unidad: "ud", precio: 58, iva: 21 },
        { id: uid("t"), concepto: "Renovacion de fontaneria de bano", unidad: "ud", precio: 890, iva: 21 },
        { id: uid("t"), concepto: "Pintura plastica lisa (2 manos)", unidad: "m²", precio: 9.5, iva: 21 },
        { id: uid("t"), concepto: "Mano de obra oficial 1ª", unidad: "h", precio: 32, iva: 21 }
      ]
    };
  }

  /* --- Persistencia ------------------------------------------------------ */
  var state = null;
  var oyentes = [];

  function load() {
    if (state) return state;
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : vacio();
    } catch (e) {
      console.warn("No se pudo leer el almacen local, se empieza vacio:", e);
      state = vacio();
    }
    /* Rellena campos nuevos si los datos vienen de una version anterior */
    var base = vacio();
    Object.keys(base).forEach(function (k) { if (state[k] == null) state[k] = base[k]; });
    Object.keys(base.empresa).forEach(function (k) {
      if (state.empresa[k] == null) state.empresa[k] = base.empresa[k];
    });
    return state;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      alert("No se han podido guardar los cambios (almacenamiento lleno o bloqueado).\n" +
            "Descarga una copia de seguridad desde Ajustes antes de cerrar.");
      console.error(e);
      return false;
    }
    oyentes.forEach(function (f) { try { f(state); } catch (err) { console.error(err); } });
    return true;
  }

  function onChange(f) { oyentes.push(f); }

  /* --- CRUD generico ----------------------------------------------------- */
  function coleccion(nombre) { return load()[nombre]; }
  function buscar(nombre, id) {
    var c = coleccion(nombre) || [];
    for (var i = 0; i < c.length; i++) if (c[i].id === id) return c[i];
    return null;
  }
  function guardar(nombre, obj) {
    var c = coleccion(nombre);
    if (!obj.id) { obj.id = uid(nombre.slice(0, 3)); obj.creado = new Date().toISOString(); c.push(obj); }
    else {
      var i = c.findIndex(function (x) { return x.id === obj.id; });
      if (i >= 0) c[i] = obj; else c.push(obj);
    }
    obj.modificado = new Date().toISOString();
    save();
    return obj;
  }
  function borrar(nombre, id) {
    var c = coleccion(nombre);
    var i = c.findIndex(function (x) { return x.id === id; });
    if (i >= 0) { c.splice(i, 1); save(); return true; }
    return false;
  }

  /* --- Numeracion de documentos ------------------------------------------ */
  function siguienteNumero(tipo, anio, consumir) {
    var st = load();
    var serie = tipo === "factura" ? (st.empresa.serieFactura || "F") : (st.empresa.seriePresupuesto || "P");
    var y = anio || new Date().getFullYear();
    var clave = serie + "-" + y;
    var actual = st.numeracion[clave] || 0;
    var n = actual + 1;
    if (consumir) { st.numeracion[clave] = n; save(); }
    return serie + y + "-" + String(n).padStart(4, "0");
  }

  /* --- Documentos (presupuesto / factura) -------------------------------- */
  function lineaVacia(empresa) {
    return { concepto: "", detalle: "", unidad: "ud", cantidad: 1, precio: 0, dto: 0,
             iva: (empresa || load().empresa).ivaDefecto };
  }

  function nuevoDocumento(tipo) {
    var e = load().empresa;
    var doc = {
      id: "", numero: "", tipo: tipo, clienteId: "", obraId: "",
      fecha: hoy(), estado: "borrador", lineas: [lineaVacia(e)],
      irpf: num(e.irpfDefecto), isp: false, notas: "",
      condiciones: tipo === "presupuesto" ? e.condiciones : e.pieFactura
    };
    if (tipo === "presupuesto") doc.validez = sumaDias(hoy(), num(e.validezPresupuesto) || 30);
    else { doc.vencimiento = sumaDias(hoy(), num(e.diasVencimiento) || 30); doc.pagos = []; doc.formaPago = "Transferencia"; }
    return doc;
  }

  /** Calcula bases, IVA agrupado por tipo, retencion y total. */
  function totales(doc) {
    var lineas = (doc.lineas || []).map(function (l) {
      var bruto = num(l.cantidad) * num(l.precio);
      var base = round2(bruto * (1 - num(l.dto) / 100));
      return { base: base, iva: num(l.iva) };
    });
    var base = round2(lineas.reduce(function (a, l) { return a + l.base; }, 0));
    var grupos = {};
    lineas.forEach(function (l) {
      var k = doc.isp ? 0 : l.iva;
      grupos[k] = round2((grupos[k] || 0) + l.base);
    });
    var ivas = Object.keys(grupos).map(function (k) {
      return { pct: num(k), base: grupos[k], cuota: round2(grupos[k] * num(k) / 100) };
    }).sort(function (a, b) { return a.pct - b.pct; });
    var ivaTotal = round2(ivas.reduce(function (a, g) { return a + g.cuota; }, 0));
    var irpf = round2(base * num(doc.irpf) / 100);
    return { base: base, ivas: ivas, ivaTotal: ivaTotal, irpf: irpf, total: round2(base + ivaTotal - irpf) };
  }

  function cobrado(f) {
    return round2((f.pagos || []).reduce(function (a, p) { return a + num(p.importe); }, 0));
  }
  function pendiente(f) { return round2(totales(f).total - cobrado(f)); }

  /** Estado real de una factura teniendo en cuenta cobros y vencimiento. */
  function estadoFactura(f) {
    if (f.estado === "borrador") return "borrador";
    if (f.estado === "anulada") return "anulada";
    var p = pendiente(f);
    if (p <= 0.009) return "cobrada";
    if (f.vencimiento && f.vencimiento < hoy()) return "vencida";
    if (cobrado(f) > 0) return "parcial";
    return "emitida";
  }

  /** Convierte un presupuesto aceptado en factura (aun sin emitir). */
  function presupuestoAFactura(p) {
    var f = nuevoDocumento("factura");
    f.clienteId = p.clienteId;
    f.obraId = p.obraId;
    f.presupuestoId = p.id;
    f.lineas = JSON.parse(JSON.stringify(p.lineas || []));
    f.irpf = p.irpf;
    f.isp = p.isp;
    f.notas = p.notas;
    return f;
  }

  /* --- Consultas para los informes --------------------------------------- */
  function facturasEmitidas(anio) {
    return coleccion("facturas").filter(function (f) {
      return f.estado !== "borrador" && f.estado !== "anulada" &&
             (!anio || String(f.fecha).slice(0, 4) === String(anio));
    });
  }

  function resumen(anio) {
    var y = String(anio || new Date().getFullYear());
    var fs = facturasEmitidas(y);
    var facturado = 0, ivaRep = 0, cobradoTot = 0, pendienteTot = 0, vencidoTot = 0;
    fs.forEach(function (f) {
      var t = totales(f);
      facturado += t.base;
      ivaRep += t.ivaTotal;
      cobradoTot += cobrado(f);
      var p = pendiente(f);
      if (p > 0.009) { pendienteTot += p; if (estadoFactura(f) === "vencida") vencidoTot += p; }
    });
    var gastos = coleccion("gastos").filter(function (g) { return String(g.fecha).slice(0, 4) === y; });
    var gastoBase = 0, ivaSop = 0;
    gastos.forEach(function (g) { gastoBase += num(g.base); ivaSop += num(g.base) * num(g.ivaPct) / 100; });
    var pres = coleccion("presupuestos").filter(function (p) { return String(p.fecha).slice(0, 4) === y; });
    var aceptados = pres.filter(function (p) { return p.estado === "aceptado"; });
    return {
      anio: y,
      facturado: round2(facturado),
      ivaRepercutido: round2(ivaRep),
      cobrado: round2(cobradoTot),
      pendiente: round2(pendienteTot),
      vencido: round2(vencidoTot),
      gastos: round2(gastoBase),
      ivaSoportado: round2(ivaSop),
      resultado: round2(facturado - gastoBase),
      presupuestos: pres.length,
      aceptados: aceptados.length,
      importeAceptado: round2(aceptados.reduce(function (a, p) { return a + totales(p).base; }, 0)),
      tasaExito: pres.length ? Math.round(aceptados.length / pres.length * 100) : 0
    };
  }

  /** Base e IVA por trimestre (ayuda para el modelo 303). */
  function trimestres(anio) {
    var y = String(anio || new Date().getFullYear());
    var out = [1, 2, 3, 4].map(function (t) {
      return { t: t, baseRep: 0, ivaRep: 0, baseSop: 0, ivaSop: 0, resultado: 0 };
    });
    facturasEmitidas(y).forEach(function (f) {
      var t = totales(f), i = trimestre(f.fecha) - 1;
      out[i].baseRep = round2(out[i].baseRep + t.base);
      out[i].ivaRep = round2(out[i].ivaRep + t.ivaTotal);
    });
    coleccion("gastos").forEach(function (g) {
      if (String(g.fecha).slice(0, 4) !== y) return;
      var i = trimestre(g.fecha) - 1;
      out[i].baseSop = round2(out[i].baseSop + num(g.base));
      out[i].ivaSop = round2(out[i].ivaSop + num(g.base) * num(g.ivaPct) / 100);
    });
    out.forEach(function (r) { r.resultado = round2(r.ivaRep - r.ivaSop); });
    return out;
  }

  /** Facturacion mes a mes del ano (para el grafico del resumen). */
  function porMes(anio) {
    var y = String(anio || new Date().getFullYear());
    var meses = [0,0,0,0,0,0,0,0,0,0,0,0];
    facturasEmitidas(y).forEach(function (f) {
      var m = parseInt(String(f.fecha).slice(5, 7), 10) - 1;
      if (m >= 0 && m < 12) meses[m] = round2(meses[m] + totales(f).base);
    });
    return meses;
  }

  /** Rentabilidad de una obra: facturado, gastos imputados y margen. */
  function obraBalance(obraId) {
    var ing = 0, gas = 0;
    coleccion("facturas").forEach(function (f) {
      if (f.obraId === obraId && f.estado !== "borrador" && f.estado !== "anulada") ing += totales(f).base;
    });
    coleccion("gastos").forEach(function (g) { if (g.obraId === obraId) gas += num(g.base); });
    var margen = round2(ing - gas);
    return { ingresos: round2(ing), gastos: round2(gas), margen: margen, pct: ing ? Math.round(margen / ing * 100) : 0 };
  }

  /* --- Copias de seguridad e intercambio --------------------------------- */
  function exportar() { return JSON.stringify(load(), null, 2); }

  function importar(texto, modo) {
    var data = JSON.parse(texto);
    if (!data || typeof data !== "object" || !data.empresa) throw new Error("El archivo no es una copia de IGR.");
    if (modo === "fusionar") {
      ["clientes", "obras", "presupuestos", "facturas", "gastos", "tarifas"].forEach(function (k) {
        var actuales = load()[k], ids = {};
        actuales.forEach(function (x) { ids[x.id] = true; });
        (data[k] || []).forEach(function (x) { if (!ids[x.id]) actuales.push(x); });
      });
    } else {
      state = data;
    }
    save();
    return true;
  }

  function csv(filas) {
    return filas.map(function (f) {
      return f.map(function (c) {
        var s = c == null ? "" : String(c);
        return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(";");
    }).join("\r\n");
  }

  function descargar(nombre, contenido, tipo) {
    var blob = new Blob(["﻿" + contenido], { type: (tipo || "text/plain") + ";charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  /* --- Datos de ejemplo (para probar el panel) --------------------------- */
  function demo() {
    var c1 = guardar("clientes", { nombre: "Marta Serrano Ruiz", nif: "50123456X", direccion: "C/ Sagunto 14, 3ºB",
      cp: "28010", ciudad: "Madrid", provincia: "Madrid", telefono: "611 223 344", email: "marta@example.com", notas: "Piso en Chamberi" });
    var c2 = guardar("clientes", { nombre: "Clinica Dental Nunez, S.L.", nif: "B87654321", direccion: "Av. Reyes 8",
      cp: "28901", ciudad: "Getafe", provincia: "Madrid", telefono: "916 000 111", email: "admin@clinicanunez.es", notas: "Obra nocturna" });

    var o1 = guardar("obras", { nombre: "Reforma integral Chamberi", clienteId: c1.id, direccion: "C/ Sagunto 14, 3ºB, Madrid",
      inicio: sumaDias(hoy(), -70), fin: sumaDias(hoy(), -7), estado: "entregada", notas: "92 m², 9 semanas" });
    guardar("obras", { nombre: "Adecuacion clinica Getafe", clienteId: c2.id, direccion: "Av. Reyes 8, Getafe",
      inicio: sumaDias(hoy(), -20), fin: sumaDias(hoy(), 25), estado: "en curso", notas: "140 m², por fases" });

    var p = nuevoDocumento("presupuesto");
    p.clienteId = c1.id; p.obraId = o1.id; p.estado = "aceptado";
    p.fecha = sumaDias(hoy(), -80); p.validez = sumaDias(hoy(), -50);
    p.lineas = [
      { concepto: "Demolicion y retirada de escombros", detalle: "Incluye contenedor y gestion de residuos", unidad: "m²", cantidad: 92, precio: 28, dto: 0, iva: 10 },
      { concepto: "Instalacion electrica completa", detalle: "Cuadro nuevo, 46 puntos y boletin", unidad: "ud", cantidad: 1, precio: 4200, dto: 0, iva: 10 },
      { concepto: "Fontaneria y saneamiento", detalle: "Bano principal, aseo y cocina", unidad: "ud", cantidad: 1, precio: 3600, dto: 0, iva: 10 },
      { concepto: "Solado porcelanico", detalle: "Formato 60x120 rectificado", unidad: "m²", cantidad: 88, precio: 34, dto: 5, iva: 10 },
      { concepto: "Pintura plastica lisa", detalle: "Dos manos, blanco roto", unidad: "m²", cantidad: 260, precio: 9.5, dto: 0, iva: 10 }
    ];
    p.numero = siguienteNumero("presupuesto", new Date().getFullYear(), true);
    guardar("presupuestos", p);

    var f = presupuestoAFactura(p);
    f.numero = siguienteNumero("factura", new Date().getFullYear(), true);
    f.estado = "emitida";
    f.fecha = sumaDias(hoy(), -30);
    f.vencimiento = sumaDias(hoy(), -5);
    f.pagos = [{ fecha: sumaDias(hoy(), -28), importe: 5000, medio: "Transferencia" }];
    guardar("facturas", f);

    guardar("gastos", { fecha: sumaDias(hoy(), -60), proveedor: "Almacenes Ruiz", nif: "B12345678",
      categoria: "Material", obraId: o1.id, base: 4820, ivaPct: 21, notas: "Porcelanico y adhesivos", pagado: true });
    guardar("gastos", { fecha: sumaDias(hoy(), -25), proveedor: "Alquiler de maquinaria SL", nif: "B99887766",
      categoria: "Maquinaria", obraId: "", base: 640, ivaPct: 21, notas: "Martillo y andamio", pagado: true });
    guardar("gastos", { fecha: sumaDias(hoy(), -12), proveedor: "Mutua laboral", nif: "G11223344",
      categoria: "Seguros", obraId: "", base: 310, ivaPct: 0, notas: "Seguro RC trimestral", pagado: true });
    return load();
  }

  function reset() { state = vacio(); save(); }

  return {
    load: load, save: save, onChange: onChange, state: function () { return load(); },
    coleccion: coleccion, buscar: buscar, guardar: guardar, borrar: borrar,
    nuevoDocumento: nuevoDocumento, lineaVacia: lineaVacia, totales: totales,
    cobrado: cobrado, pendiente: pendiente, estadoFactura: estadoFactura,
    presupuestoAFactura: presupuestoAFactura, siguienteNumero: siguienteNumero,
    resumen: resumen, trimestres: trimestres, porMes: porMes, obraBalance: obraBalance,
    facturasEmitidas: facturasEmitidas,
    uid: uid, num: num, round2: round2, money: money, dec: dec,
    hoy: hoy, fecha: fecha, sumaDias: sumaDias, trimestre: trimestre,
    exportar: exportar, importar: importar, csv: csv, descargar: descargar,
    demo: demo, reset: reset
  };
})();
