/* ===========================================================================
   CONSTRUCCIONES Y REFORMAS IGR — Ajustes de la web
   Edita SOLO este archivo para cambiar telefonos, correo, zona y textos.
   El panel (/panel.html) guarda sus propios datos fiscales en Ajustes.
   =========================================================================== */
window.IGR_CONFIG = {

  /* --- Identidad --------------------------------------------------------- */
  empresa: "Construcciones y Reformas IGR",
  claim: "Construimos calidad, renovamos confianza",
  ciudad: "Madrid",
  zona: "Madrid y alrededores (50 km)",

  /* --- Contacto ---------------------------------------------------------- */
  telefono: "600 000 000",          // se muestra tal cual
  telefonoTel: "+34600000000",      // formato para el enlace tel:
  whatsapp: "34600000000",          // sin + ni espacios (wa.me)
  email: "info@reformasigr.es",
  horario: "Lunes a viernes, 8:00 - 19:00 · Sabados con cita",

  /* --- Datos fiscales visibles en el aviso legal ------------------------- */
  razonSocial: "Construcciones y Reformas IGR, S.L.",
  cif: "B00000000",
  direccion: "Calle de la Obra, 1 - 28000 Madrid",

  /* --- Formulario de contacto -------------------------------------------
     Deja "" para que el formulario abra el correo del cliente (mailto).
     Si usas Formspree / Getform / Basin, pega aqui la URL del endpoint y el
     envio sera directo, sin abrir el gestor de correo.
     Ejemplo: "https://formspree.io/f/xxxxxxx"                              */
  formEndpoint: "",

  /* --- FICHA DE GOOGLE (Perfil de Empresa) -------------------------------
     Pega aqui lo que aparece en tu ficha. Lo que dejes vacio, la web lo OCULTA
     en vez de inventarselo (nada de valoraciones falsas).
       perfil      URL de la ficha (maps.app.goo.gl/... o g.page/...)
       resenas     URL directa a las opiniones ("Ver todas las resenas")
       rating      valoracion media tal cual, p. ej. "4,9"
       numResenas  numero de resenas, p. ej. "210"
       mapaEmbed   Google Maps -> Compartir -> Insertar un mapa -> copia SOLO
                   la direccion que va dentro de src="..."                    */
  google: {
    perfil: "",
    resenas: "",
    rating: "",
    numResenas: "",
    mapaEmbed: ""
  },

  /* --- Horario (sale en la web y en los datos para Google) ---------------
     dias/horas es lo que lee el visitante; ld/abre/cierra alimenta el marcado
     schema.org. Pon horas: "Cerrado" o "Con cita previa" cuando no haya
     horario fijo (esos dias no se envian a Google como horario de apertura). */
  horarios: [
    { dias: "Lunes a viernes", horas: "08:00 - 19:00", ld: ["Mo", "Tu", "We", "Th", "Fr"], abre: "08:00", cierra: "19:00" },
    { dias: "Sabado",          horas: "Con cita previa", ld: ["Sa"] },
    { dias: "Domingo",         horas: "Cerrado",         ld: ["Su"] }
  ],

  /* --- Opiniones que se muestran en la web -------------------------------
     Sustituye estas por resenas REALES de tu ficha de Google (copia el texto
     tal cual, el nombre como aparece publicado y el numero de estrellas).    */
  opiniones: [
    { estrellas: 5, texto: "Reforma integral de 95 m² en 10 semanas. Nos dieron parte cada viernes con fotos y cumplieron la fecha. El precio final fue exactamente el del presupuesto.", autor: "Marta y Luis", detalle: "Piso en Chamberi · Reforma integral" },
    { estrellas: 5, texto: "Cambiamos la banera por ducha y aprovechamos para el alicatado. Empezaron un lunes y el jueves de la semana siguiente estaba usable. Muy limpios.", autor: "Carmen R.", detalle: "Bano en Alcala de Henares" },
    { estrellas: 5, texto: "Adecuamos el local de la clinica trabajando de noche para no cerrar. Se encargaron de la licencia de actividad y de los certificados.", autor: "Dr. Nunez", detalle: "Local de 140 m² en Getafe" }
  ],

  /* --- Cifras de confianza (cambialas por las reales) -------------------- */
  cifras: [
    { valor: "18",   texto: "anos reformando casas" },
    { valor: "450+", texto: "obras entregadas" },
    { valor: "4,9",  texto: "valoracion media (Google)" },
    { valor: "3",    texto: "anos de garantia por escrito" }
  ],

  /* --- Precios orientativos de la calculadora (EUR por m2) ---------------
     Son rangos de referencia para dar una horquilla en la web. El presupuesto
     real siempre sale del panel, tras la visita.                            */
  precios: {
    integral:   { min: 480, max: 780, nombre: "Reforma integral de vivienda" },
    parcial:    { min: 280, max: 460, nombre: "Reforma parcial" },
    bano:       { min: 620, max: 980, nombre: "Bano completo" },
    cocina:     { min: 700, max: 1150, nombre: "Cocina completa" },
    fachada:    { min: 90,  max: 160, nombre: "Fachada / SATE" },
    local:      { min: 350, max: 620, nombre: "Local comercial" }
  },
  calidades: {
    esencial: { factor: 0.85, nombre: "Esencial" },
    estandar: { factor: 1.00, nombre: "Estandar" },
    premium:  { factor: 1.30, nombre: "Premium" }
  }
};
