/* ===========================================================================
   IGR — Comportamiento de la web publica
   Sin dependencias. Todo lo editable vive en config.js.
   =========================================================================== */
(function () {
  "use strict";
  var CFG = window.IGR_CONFIG || {};
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });

  /* --- 1. Datos de contacto en toda la pagina ---------------------------- */
  function waLink(texto) {
    var t = encodeURIComponent(texto || ("Hola, me gustaria pedir presupuesto para una reforma en " + (CFG.ciudad || "")));
    return "https://wa.me/" + (CFG.whatsapp || "") + "?text=" + t;
  }

  function pintarConfig() {
    $$("[data-igr]").forEach(function (el) {
      var v = CFG[el.getAttribute("data-igr")];
      if (v) el.textContent = v;
    });
    $$("[data-igr-href]").forEach(function (el) {
      var k = el.getAttribute("data-igr-href");
      if (k === "tel")      el.href = "tel:" + (CFG.telefonoTel || "");
      if (k === "mailto")   el.href = "mailto:" + (CFG.email || "");
      if (k === "whatsapp") { el.href = waLink(); el.target = "_blank"; }
    });
    var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
    document.title = document.title.replace("Construcciones y Reformas IGR", CFG.empresa || "Construcciones y Reformas IGR");
  }

  /* --- 1b. Ficha de Google: valoracion, opiniones, horario y mapa --------
     Todo sale de config.js. Lo que no este relleno, no se muestra: preferimos
     ocultar una valoracion a enseñar una inventada.                          */
  function estrellas(n) {
    n = Math.max(0, Math.min(5, Math.round(n || 5)));
    return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
  }

  function fichaGoogle() {
    var g = CFG.google || {};
    var tieneNota = g.rating && g.numResenas;
    var enlace = g.resenas || g.perfil || "";

    /* Valoracion en la barra superior */
    var badge = $("#googleBadge");
    if (badge && tieneNota) {
      badge.textContent = "★ " + g.rating + "/5 en Google · " + g.numResenas + " opiniones";
      if (enlace) { badge.href = enlace; badge.target = "_blank"; badge.rel = "noopener"; }
      badge.hidden = false;
    }

    /* Valoracion en la tarjeta del hero */
    var hero = $("#heroRating");
    if (hero && tieneNota) {
      hero.innerHTML =
        '<span class="stars" aria-label="' + g.rating + ' sobre 5">' + estrellas(parseFloat(String(g.rating).replace(",", "."))) + "</span>" +
        "<b>" + g.rating + " / 5</b>" +
        "<span>" + g.numResenas + " opiniones en Google</span>";
      hero.hidden = false;
    }

    /* Opiniones */
    var lista = $("#opiniones-lista");
    if (lista) {
      lista.innerHTML = (CFG.opiniones || []).map(function (o) {
        return '<blockquote class="quote reveal is-in">' +
          '<div class="stars" aria-label="' + (o.estrellas || 5) + ' de 5">' + estrellas(o.estrellas) + "</div>" +
          "<p>" + o.texto + "</p>" +
          "<footer><b>" + o.autor + "</b>" + (o.detalle || "") + "</footer></blockquote>";
      }).join("");
    }
    var cta = $("#opiniones-cta");
    if (cta && enlace) { $("#verResenas").href = enlace; cta.hidden = false; }

    /* Enlace a la ficha desde la zona de trabajo */
    var llegar = $("#comoLlegar");
    if (llegar && g.perfil) { llegar.href = g.perfil; llegar.hidden = false; }

    /* Horario detallado */
    var linea = $("#horarioLinea");
    if (linea && (CFG.horarios || []).length) {
      linea.innerHTML = CFG.horarios.map(function (h) {
        return h.dias + ": " + h.horas;
      }).join("<br>");
    }

    /* Mapa insertado */
    var sec = $("#mapa");
    if (sec && g.mapaEmbed) {
      $("#mapaFrame").src = g.mapaEmbed;
      sec.hidden = false;
    }
  }

  /* --- 2. Navegacion ----------------------------------------------------- */
  function nav() {
    var nav = $("#nav"), burger = $("#burger");
    if (burger) {
      burger.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", String(open));
        burger.setAttribute("aria-label", open ? "Cerrar menu" : "Abrir menu");
      });
      $$("#navLinks a").forEach(function (a) {
        a.addEventListener("click", function () { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); });
      });
    }
    var onScroll = function () { nav.classList.toggle("is-stuck", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* Enlace activo segun la seccion visible */
    var links = $$("#navLinks a[href^='#']");
    var mapa = {};
    links.forEach(function (a) { var s = $(a.getAttribute("href")); if (s) mapa[s.id] = a; });
    if ("IntersectionObserver" in window && links.length) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) {
          if (!mapa[e.target.id]) return;
          if (e.isIntersecting) {
            links.forEach(function (l) { l.removeAttribute("aria-current"); });
            mapa[e.target.id].setAttribute("aria-current", "true");
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      Object.keys(mapa).forEach(function (id) { io.observe(document.getElementById(id)); });
    }
  }

  /* --- 3. Aparicion al hacer scroll -------------------------------------- */
  function reveal() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (ents, obs) {
      ents.forEach(function (e, i) {
        if (!e.isIntersecting) return;
        setTimeout(function () { e.target.classList.add("is-in"); }, Math.min(i * 70, 280));
        obs.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* --- 4. Cifras con contador -------------------------------------------- */
  function stats() {
    var cont = $("#stats"); if (!cont) return;
    (CFG.cifras || []).forEach(function (c) {
      var d = document.createElement("div");
      d.className = "stat";
      d.innerHTML = '<div class="stat__n" data-to="' + c.valor + '">0</div><div class="stat__t">' + c.texto + "</div>";
      cont.appendChild(d);
    });
    var animar = function (el) {
      var raw = el.getAttribute("data-to");
      var num = parseFloat(raw.replace(",", ".").replace(/[^\d.]/g, ""));
      if (isNaN(num)) { el.textContent = raw; return; }
      var suf = raw.replace(/[\d.,]/g, "");
      var dec = raw.indexOf(",") > -1 ? 1 : 0;
      var t0 = null, dur = 1100;
      var paso = function (t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var v = num * (1 - Math.pow(1 - p, 3));
        el.textContent = v.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
        if (p < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    };
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      $$(".stat__n", cont).forEach(function (el) { el.textContent = el.getAttribute("data-to"); });
      return;
    }
    var io = new IntersectionObserver(function (ents, obs) {
      ents.forEach(function (e) { if (e.isIntersecting) { animar(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.4 });
    $$(".stat__n", cont).forEach(function (el) { io.observe(el); });
  }

  /* --- 5. Comparador antes / despues ------------------------------------- */
  function antesDespues() {
    var ba = $("#ba"); if (!ba) return;
    var handle = $(".ba__handle", ba);
    var set = function (pct) {
      pct = Math.max(0, Math.min(100, pct));
      ba.style.setProperty("--pos", pct + "%");
      handle.setAttribute("aria-valuenow", Math.round(pct));
    };
    var fromEvent = function (e) {
      var r = ba.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      set((x / r.width) * 100);
    };
    var arrastrando = false;
    var start = function (e) { arrastrando = true; fromEvent(e); };
    var move  = function (e) { if (arrastrando) { fromEvent(e); if (e.cancelable) e.preventDefault(); } };
    var end   = function () { arrastrando = false; };
    ba.addEventListener("pointerdown", start);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    ba.addEventListener("click", fromEvent);
    handle.addEventListener("keydown", function (e) {
      var cur = parseFloat(handle.getAttribute("aria-valuenow")) || 50;
      if (e.key === "ArrowLeft")  { set(cur - 4); e.preventDefault(); }
      if (e.key === "ArrowRight") { set(cur + 4); e.preventDefault(); }
      if (e.key === "Home")       { set(0);  e.preventDefault(); }
      if (e.key === "End")        { set(100); e.preventDefault(); }
    });
  }

  /* --- 6. Proyectos con filtro ------------------------------------------- */
  var PROYECTOS = [
    { t: "Piso de 92 m² en Chamberi",   cat: "integral", img: "assets/img/proyecto-integral.svg", meta: ["92 m²", "9 semanas", "68.400 €"], badge: "Integral" },
    { t: "Cocina abierta al salon",     cat: "cocina",   img: "assets/img/proyecto-cocina.svg",   meta: ["18 m²", "3 semanas", "14.200 €"], badge: "Cocina" },
    { t: "Bano con ducha de obra",      cat: "bano",     img: "assets/img/proyecto-bano.svg",     meta: ["6 m²", "10 dias", "7.900 €"],   badge: "Bano" },
    { t: "Clinica dental en Getafe",    cat: "local",    img: "assets/img/proyecto-local.svg",    meta: ["140 m²", "7 semanas", "96.000 €"], badge: "Local" },
    { t: "Fachada con SATE en Vallecas",cat: "fachada",  img: "assets/img/proyecto-fachada.svg",  meta: ["420 m²", "6 semanas", "48.300 €"], badge: "Fachada" },
    { t: "Salon con suelo de roble",    cat: "integral", img: "assets/img/proyecto-salon.svg",    meta: ["34 m²", "4 semanas", "19.700 €"], badge: "Parcial" }
  ];
  var CATS = [
    { k: "todos",    n: "Todos" },
    { k: "integral", n: "Reforma integral" },
    { k: "bano",     n: "Banos" },
    { k: "cocina",   n: "Cocinas" },
    { k: "fachada",  n: "Fachadas" },
    { k: "local",    n: "Locales" }
  ];

  function proyectos() {
    var cont = $("#works"), filtros = $("#filters");
    if (!cont || !filtros) return;

    CATS.forEach(function (c, i) {
      var b = document.createElement("button");
      b.className = "chip"; b.type = "button"; b.textContent = c.n;
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.addEventListener("click", function () {
        $$(".chip", filtros).forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        pintar(c.k);
      });
      filtros.appendChild(b);
    });

    function pintar(cat) {
      cont.innerHTML = "";
      PROYECTOS.filter(function (p) { return cat === "todos" || p.cat === cat; })
        .forEach(function (p) {
          var a = document.createElement("a");
          a.className = "work reveal is-in";
          a.href = "#contacto";
          a.innerHTML =
            '<img src="' + p.img + '" alt="' + p.t + '" loading="lazy">' +
            '<span class="work__badge">' + p.badge + "</span>" +
            '<div class="work__body"><h3>' + p.t + "</h3>" +
            '<div class="work__meta">' + p.meta.map(function (m) { return "<span>" + m + "</span>"; }).join("") + "</div></div>";
          cont.appendChild(a);
        });
      if (!cont.children.length) {
        cont.innerHTML = '<p class="lead">Pronto subiremos obras de esta categoria. Escribenos y te ensenamos fotos.</p>';
      }
    }
    pintar("todos");
  }

  /* --- 7. Calculadora de presupuesto orientativo ------------------------- */
  function calculadora() {
    var tipo = $("#cTipo"), m2 = $("#cM2"), cal = $("#cCalidad"),
        res = $("#cRes"), nota = $("#cNota"), wa = $("#cWa"), fTipo = $("#fTipo");
    if (!tipo || !cal) return;

    Object.keys(CFG.precios || {}).forEach(function (k) {
      var o = document.createElement("option"); o.value = k; o.textContent = CFG.precios[k].nombre; tipo.appendChild(o);
      if (fTipo) { var o2 = document.createElement("option"); o2.value = k; o2.textContent = CFG.precios[k].nombre; fTipo.appendChild(o2); }
    });
    if (fTipo) { var otro = document.createElement("option"); otro.value = "otro"; otro.textContent = "Otro / no lo tengo claro"; fTipo.appendChild(otro); }
    Object.keys(CFG.calidades || {}).forEach(function (k) {
      var o = document.createElement("option"); o.value = k; o.textContent = CFG.calidades[k].nombre;
      if (k === "estandar") o.selected = true;
      cal.appendChild(o);
    });

    function calcular() {
      var p = (CFG.precios || {})[tipo.value];
      var f = ((CFG.calidades || {})[cal.value] || { factor: 1 }).factor;
      var n = Math.max(1, Math.min(1000, parseFloat(m2.value) || 0));
      if (!p) return;
      var min = Math.round(p.min * f * n / 100) * 100;
      var max = Math.round(p.max * f * n / 100) * 100;
      res.textContent = eur.format(min) + " – " + eur.format(max);
      nota.textContent = p.nombre + " de " + n + " m², acabados " +
        ((CFG.calidades[cal.value] || {}).nombre || "").toLowerCase() +
        ". Estimacion orientativa sin IVA; no es un presupuesto vinculante.";
      if (wa) {
        wa.href = waLink("Hola, he usado la calculadora de la web: " + p.nombre + ", " + n +
          " m², acabados " + ((CFG.calidades[cal.value] || {}).nombre || "") +
          ". Me sale " + eur.format(min) + " – " + eur.format(max) + ". Podemos concretar?");
      }
    }
    [tipo, m2, cal].forEach(function (el) { el.addEventListener("input", calcular); el.addEventListener("change", calcular); });
    calcular();
  }

  /* --- 8. Formulario de contacto ----------------------------------------- */
  function formulario() {
    var form = $("#leadForm"), msg = $("#formMsg");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var datos = {
        nombre:   $("#fNombre").value.trim(),
        telefono: $("#fTel").value.trim(),
        email:    $("#fEmail").value.trim(),
        tipo:     $("#fTipo").value,
        zona:     $("#fZona").value.trim(),
        mensaje:  $("#fMsg").value.trim()
      };
      if (!datos.nombre || !datos.telefono || !$("#fRgpd").checked) {
        msg.dataset.state = "err";
        msg.textContent = "Necesitamos tu nombre, un telefono y que aceptes la politica de privacidad.";
        return;
      }
      var tel = datos.telefono.replace(/[^\d+]/g, "");
      if (tel.length < 9) {
        msg.dataset.state = "err";
        msg.textContent = "Revisa el telefono: parece incompleto.";
        return;
      }

      var cuerpo =
        "Nombre: " + datos.nombre + "\nTelefono: " + datos.telefono +
        "\nEmail: " + (datos.email || "-") + "\nTipo de reforma: " + datos.tipo +
        "\nZona: " + (datos.zona || "-") + "\n\n" + (datos.mensaje || "");

      if (CFG.formEndpoint) {
        msg.dataset.state = ""; msg.textContent = "Enviando...";
        fetch(CFG.formEndpoint, {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        }).then(function (r) {
          if (!r.ok) throw new Error("respuesta " + r.status);
          form.reset();
          msg.dataset.state = "ok";
          msg.textContent = "Recibido. Te llamamos hoy mismo si es dia laborable.";
        }).catch(function () {
          msg.dataset.state = "err";
          msg.innerHTML = 'No hemos podido enviarlo. Escribenos por <a href="' + waLink(cuerpo) + '" target="_blank" rel="noopener">WhatsApp</a> o llamanos.';
        });
      } else {
        window.location.href = "mailto:" + (CFG.email || "") +
          "?subject=" + encodeURIComponent("Presupuesto web - " + datos.nombre) +
          "&body=" + encodeURIComponent(cuerpo);
        msg.dataset.state = "ok";
        msg.textContent = "Hemos abierto tu correo con los datos. Si no se abre, escribenos por WhatsApp.";
      }
    });
  }

  /* --- 8b. Mini formulario del hero ("te llamamos") ---------------------- */
  function formularioRapido() {
    var form = $("#quickForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nombre = $("#qNombre").value.trim();
      var tel = $("#qTel").value.trim();
      if (!nombre || tel.replace(/[^\d+]/g, "").length < 9) {
        $("#qTel").focus();
        return;
      }
      var texto = "Hola, soy " + nombre + " (" + tel + "). Me gustaria que me llamarais para un presupuesto de reforma.";
      if (CFG.whatsapp) {
        window.open(waLink(texto), "_blank", "noopener");
      } else {
        window.location.href = "mailto:" + (CFG.email || "") +
          "?subject=" + encodeURIComponent("Quiero que me llameis - " + nombre) +
          "&body=" + encodeURIComponent(texto);
      }
      form.reset();
    });
  }

  /* --- 9. Datos estructurados (SEO local) -------------------------------- */
  function schema() {
    var ld = {
      "@context": "https://schema.org",
      "@type": "GeneralContractor",
      name: CFG.empresa,
      description: "Empresa de reformas integrales, banos, cocinas, fachadas y locales en " + (CFG.ciudad || ""),
      telephone: CFG.telefonoTel,
      email: CFG.email,
      address: { "@type": "PostalAddress", streetAddress: CFG.direccion, addressLocality: CFG.ciudad, addressCountry: "ES" },
      areaServed: CFG.zona,
      priceRange: "€€"
    };
    var g = CFG.google || {};
    if (g.perfil) ld.sameAs = [g.perfil];
    if (g.rating && g.numResenas) {
      ld.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: String(g.rating).replace(",", "."),
        reviewCount: String(g.numResenas).replace(/\D/g, "")
      };
    }
    var horas = (CFG.horarios || []).filter(function (h) { return h.abre && h.cierra; }).map(function (h) {
      return { "@type": "OpeningHoursSpecification", dayOfWeek: h.ld || [], opens: h.abre, closes: h.cierra };
    });
    if (horas.length) ld.openingHoursSpecification = horas;
    var faq = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: $$(".faq details").map(function (d) {
        return {
          "@type": "Question",
          name: $("summary", d).textContent.trim(),
          acceptedAnswer: { "@type": "Answer", text: ($("p", d) || {}).textContent || "" }
        };
      })
    };
    [ld, faq].forEach(function (obj) {
      var s = document.createElement("script");
      s.type = "application/ld+json";
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
    });
  }

  /* --- Arranque ---------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    pintarConfig(); fichaGoogle(); nav(); reveal(); stats(); antesDespues();
    proyectos(); calculadora(); formulario(); formularioRapido(); schema();
  });
})();
