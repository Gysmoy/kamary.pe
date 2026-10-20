// Datos generales del sitio público (fuente: reporte kamaryfarma.com, 2026-10-19).
// Solo datos confirmados en el sitio; no hay RUC, razón social formal ni horarios publicados.
export default {
  name: 'Farmacia Kamary Perú',
  tagline: 'Productos farmacéuticos y cosméticos, de primera calidad.',
  logo: '/web/brand/logo.png',
  logoWhite: '/web/brand/logo-white.png',
  favicon: '/web/brand/favicon.png',

  address: {
    line: 'Yen Escobedo Garro 830',
    city: 'Lima 15021, Perú',
    mapsUrl: 'https://maps.app.goo.gl/9t8Cy8eCutAzSLV9A',
  },

  phones: {
    central: '01 3079982',
    ventas: '932 831 242',
    corporativas: '996 001 876',
    magistrales: '968 762 510',
  },

  whatsapp: {
    number: '51924172789',
    display: '924 172 789',
    message: 'Hola Kamary Perú, requiero más información.',
  },

  emails: {
    ventas: 'ventas@kamaryfarma.com',
    corporativas: 'jose.carrillo@kamaryfarma.com',
    magistrales: 'ventasmagistrales@kamaryfarma.com',
  },

  socials: [
    { name: 'Facebook', url: 'https://www.facebook.com/Kamaryperu', icon: 'Facebook' },
    { name: 'Instagram', url: 'https://www.instagram.com/kamaryperu/', icon: 'Instagram' },
  ],

  // Certificaciones mencionadas en el sitio (sin RUC).
  certifications: ['DIGEMID', 'BPA', 'BPDyT'],
  certificates: [
    { title: 'Certificado de Distribución y Transporte', image: '/web/certificates/Certificado-Distribucion.png' },
    { title: 'Certificado de Almacenamiento', image: '/web/certificates/Certificado-Almacenamiento.png' },
  ],

  // Logos de clientes/socios mostrados como "Proveedor homologado" y "Marcas líderes".
  partnersImage: '/web/partners/Nuestros-Socios.jpg',
  partners: [
    { name: 'ACP', image: '/web/partners/ACP.jpg' },
    { name: 'Aptus', image: '/web/partners/Aptus.jpg' },
    { name: 'Concentrix', image: '/web/partners/Concentrix.jpg' },
    { name: 'Consorcio Minero', image: '/web/partners/Consorcio-Minero.jpg' },
    { name: 'Decameron', image: '/web/partners/Decameron.jpg' },
    { name: 'Pharmaris', image: '/web/partners/Pharmaris.jpg' },
    { name: 'Real Plaza', image: '/web/partners/Real-Plaza.jpg' },
  ],
  homologationDisclaimer:
    'Los procesos de homologación corresponden a evaluaciones internas de cada empresa y no constituyen certificaciones regulatorias ni avales de autoridad sanitaria.',

  // Menú principal (las rutas no llevan slash final).
  nav: [
    { label: 'Inicio', href: '/' },
    {
      label: 'Tienda',
      href: '/tienda',
      children: [
        { label: 'Antioxidantes', href: '/categoria-producto/antioxidantes' },
        { label: 'Colágenos', href: '/categoria-producto/colagenos' },
        { label: 'Metabólicos', href: '/categoria-producto/metabolicos' },
        { label: 'Energía e Hidratación', href: '/categoria-producto/energia-e-hidratacion' },
        { label: 'Salud masculina', href: '/categoria-producto/salud-masculina' },
        { label: 'Sistema nervioso', href: '/categoria-producto/sistema-nervioso' },
        { label: 'Línea Tópica y Deportiva', href: '/categoria-producto/linea-topica-y-deportiva' },
      ],
    },
    { label: 'Preparados Magistrales', href: '/preparados-magistrales' },
    { label: 'Ventas Corporativas', href: '/ventas-corporativas' },
    { label: 'Operador logístico', href: '/operador-logistico' },
    { label: 'Nosotros', href: '/nosotros' },
    { label: 'Contacto', href: '/contacto' },
  ],

  footer: {
    description: 'Productos farmacéuticos y cosméticos, de primera calidad.',
    columns: [
      {
        title: 'Nuestra Empresa',
        links: [
          { label: 'Nosotros', href: '/nosotros' },
          { label: 'Contacto', href: '/contacto' },
          { label: 'Políticas de Privacidad', href: '/politicas-de-privacidad' },
        ],
      },
      {
        title: 'Enlaces de Interés',
        links: [
          { label: 'Tienda', href: '/tienda' },
          { label: 'Preparados Magistrales', href: '/preparados-magistrales' },
          { label: 'Ventas Corporativas', href: '/ventas-corporativas' },
          { label: 'Operador logístico', href: '/operador-logistico' },
        ],
      },
    ],
    complaintsLink: { label: 'Libro de Reclamaciones', href: '/libro-de-reclamaciones' },
    copyright: '© 2026 Farmacia Kamary Perú. Todos los derechos reservados.',
    credits: 'Desarrollado por Digital Studio',
    creditsUrl: 'https://www.digitalstudio.pe/',
  },
};
