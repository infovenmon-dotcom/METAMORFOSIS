/* ===========================================================================
   CONSTRUCCIONES Y REFORMAS IGR — Ajustes de la web
   Edita SOLO este archivo para cambiar telefonos, correo, zona y textos.
   El panel (/panel.html) guarda sus propios datos fiscales en Ajustes.
   =========================================================================== */
window.IGR_CONFIG = {

  /* --- Identidad --------------------------------------------------------- */
  empresa: "Construcciones y Reformas IGR",
  claim: "Reformas integrales llave en mano",
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
