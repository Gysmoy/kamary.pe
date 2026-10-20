// Textos de cada página pública (fuente: reporte kamaryfarma.com, 2026-10-19).
// Se copian del sitio actual; solo se corrigen erratas obvias:
//   - "KAMARY KAMARY" -> "KAMARY FARMA" (Distribución y Transporte; probable error, revisar con el cliente).
//   - "El Gestor" -> "Kamary Perú" (Políticas de Privacidad; plantilla legal reutilizada).
// Los títulos de sección marcados como "UI" no vienen del sitio: son etiquetas propias.
export default {
  home: {
    hero: {
      title: 'Farmacia Kamary Perú',
      slides: [
        '/web/slider/Imag-home-4.webp',
        '/web/slider/Imag-Home-3.webp',
        '/web/slider/slider-Farmacia.webp',
      ],
      ctas: [
        { label: 'Ir a la tienda', href: '/tienda' },
        { label: 'Ir a preparado magistral', href: '/preparados-magistrales' },
      ],
    },
    serviceCards: [
      {
        title: 'Ventas Corporativas',
        text: '',
        cta: 'Más información',
        href: '/ventas-corporativas',
        image: '/web/services/Ventas-corporativas.webp',
      },
      {
        title: 'Operador logístico',
        text: '',
        cta: 'Más información',
        href: '/operador-logistico',
        image: '/web/services/Operador-logistico.webp',
      },
      {
        title: 'Nosotros',
        eyebrow: 'Especialistas en el Sector Farmacéutico',
        text: '',
        cta: 'Conoce más sobre nosotros',
        href: '/nosotros',
        image: '/web/services/Img-Nosotros-Kamary.webp',
      },
    ],
    about: {
      title: 'Especialistas en el Sector Farmacéutico',
      text: 'Somos Kamary Perú, empresa farmacéutica integral especializada en distribución y comercialización de productos farmacéuticos, dispositivos médicos y productos sanitarios. Integramos farmacia, preparados magistrales, ventas corporativas y logística de última milla en un solo proveedor confiable.',
      bullets: [
        'Cumplimiento de normativas sanitarias',
        'Procesos logísticos seguros y controlados',
        'Atención personalizada para cada sector',
      ],
      homologationLead: 'Somos proveedor homologado por:',
    },
    productsSection: { title: 'Tienda', cta: 'Ver más', href: '/tienda' },
    benefitsSection: { title: 'Productos por beneficio' },
    logisticsBlock: {
      title: 'Operador logístico',
      eyebrow: 'Salud en Movimiento',
      bullets: [
        'B2C: Entregas a domicilio, monitoreo en tiempo real.',
        'B2B: Abastecimiento programado, trazabilidad completa.',
        'Cadena de frío y cumplimiento normativo.',
      ],
      cta: 'Ver más',
      href: '/operador-logistico',
    },
    corporateBlock: { title: 'Ventas Corporativas', cta: 'Ver más', href: '/ventas-corporativas' },
    magistralBlock: {
      title: 'Preparados Magistrales a tu Medida',
      text: 'Elaboramos formulaciones personalizadas bajo estrictos estándares de calidad, con químicos farmacéuticos especializados e insumos certificados.',
      cta: 'Solicitar asesoría',
      href: '/preparados-magistrales',
    },
    why: {
      title: 'Elegir a nuestra marca, es una decisión inteligente por varias razones.',
      subtitle: 'Somos tu socio estratégico en el sector farmacéutico',
      items: [
        { title: 'Proveedor Integral', image: '/web/services/Icon-proveedor.webp' },
        { title: 'Servicio seguro y adaptable', image: '/web/services/Icon-servicio.webp' },
        { title: 'Experiencia cliente', image: '/web/services/Icon-experiencia.webp' },
      ],
    },
    partners: {
      title: 'Marcas líderes que confían en Kamary',
      text: 'Trabajamos con clientes que confían en la calidad de nuestros productos y en nuestro compromiso con el bienestar y la salud.',
    },
    homologationDisclaimer:
      'Los procesos de homologación corresponden a evaluaciones internas de cada empresa y no constituyen certificaciones regulatorias ni avales de autoridad sanitaria.',
  },

  shop: {
    title: 'Tienda',
    searchPlaceholder: 'Buscar',
  },

  cart: {
    title: 'Carrito',
    checkoutLabel: 'Finalizar pedido',
  },

  about: {
    title: 'Nosotros',
    values: ['Calidad garantizada', 'Abastecimiento rápido', 'Atención personalizada', 'Equipo profesional'],
    intro: {
      title: 'Especialistas en el Sector Farmacéutico',
      paragraphs: [
        'Somos Kamary Perú, una empresa farmacéutica integral con más de 11 años de experiencia dedicada a la distribución y comercialización de productos farmacéuticos, dispositivos médicos y productos sanitarios. Brindamos soluciones especializadas a personas, empresas y establecimientos del sector salud, integrando farmacia de preparados magistrales, ventas corporativas y servicios de operador logístico de última milla.',
        'Operamos bajo el cumplimiento normativo, respaldados por un equipo de profesionales altamente capacitados. Nuestro compromiso es ofrecer una atención cercana, eficiente y confiable, orientada a generar valor y contribuir activamente al bienestar y la continuidad operativa de nuestros clientes y aliados estratégicos.',
      ],
      homologationLead: 'Somos proveedor homologado por:',
      homologationDisclaimer:
        'Los procesos de homologación corresponden a evaluaciones internas de cada empresa y no constituyen certificaciones regulatorias ni avales de autoridad sanitaria.',
    },
    trust: {
      title: 'Construyendo Confianza en el Sector Farmacéutico',
      text: 'Ofrecemos productos de calidad y atención farmacéutica especializada, con una visión de crecimiento rentable y sostenible que fortalece nuestro servicio y posicionamiento en el sector.',
    },
    mission: {
      title: 'Misión',
      text: 'Brindar soluciones farmacéuticas seguras, oportunas y confiables mediante servicios de farmacia, preparados magistrales, ventas corporativas y logística de última milla, operando con estándares de calidad, trazabilidad y estricto cumplimiento normativo, con un equipo profesional comprometido con el bienestar y la satisfacción de nuestros clientes.',
    },
    vision: {
      title: 'Visión',
      text: 'Ser la empresa peruana referente en soluciones farmacéuticas integrales, reconocida por su excelencia operativa, cumplimiento normativo y capacidad de generar valor sostenible, consolidándonos como el aliado estratégico más confiable de nuestros clientes.',
    },
    valuesSection: {
      title: 'Principios que guían nuestro trabajo',
      lead: 'Somos una empresa que se rige por valores en todos los procesos que realiza la empresa:',
      items: [
        { title: 'Respeto', text: 'Escuchamos, entendemos y valoramos todas las opiniones.' },
        { title: 'Trabajo en equipo', text: 'Aporte de todos los que intervienen en la organización.' },
        { title: 'Enfoque al cliente', text: 'Comprendemos las necesidades de cada cliente y brindamos soluciones a medida.' },
        { title: 'Responsabilidad Social', text: 'Con nuestros colaboradores, el medio ambiente y nuestra comunidad.' },
      ],
    },
    advantages: {
      title: 'Ventajas competitivas',
      items: [
        { title: 'Personalización', text: 'Buscamos adaptar nuestros servicios a la medida de tus necesidades.' },
        { title: 'Eficiencia', text: 'Garantizamos un servicio eficiente a través de procesos orientados hacia la excelencia.' },
        {
          title: 'Integración completa de servicios farmacéuticos',
          text: 'Farmacia, preparados magistrales, venta corporativa y logística farmacéutica en un solo proveedor confiable.',
        },
      ],
    },
    partners: {
      title: 'Marcas líderes que confían en Kamary',
      text: 'Trabajamos con clientes que confían en la calidad de nuestros productos y en nuestro compromiso con el bienestar y la salud.',
    },
  },

  magistrales: {
    title: 'Preparados Magistrales de Recetas Médicas',
    eyebrow: 'Preparados Magistrales',
    intro:
      'En Farmacia Kamary Perú elaboramos preparados magistrales con los más altos estándares de calidad y precisión. Nuestro servicio garantiza soluciones terapéuticas adaptadas a necesidades específicas que no pueden ser cubiertas por productos comerciales.',
    paragraphs: [
      'Cada formulación es elaborada por químicos farmacéuticos especializados, utilizando insumos certificados y cumpliendo estrictamente con las normas vigentes.',
    ],
    image: '/web/services/Preparados-Magistrales.jpg',
    blocks: [
      {
        title: 'Químicos Farmacéuticos Especializados',
        text: 'Nuestro personal cuenta con una amplia experiencia en Formulación Magistral. Altamente cualificados y con tecnología innovadora, cumplimos con nuestro compromiso de eficacia, seguridad y calidad para todos nuestros pacientes.',
      },
      {
        title: 'Riguroso Control de Calidad',
        text: 'Todos nuestros preparados atraviesan un estricto control de calidad, desde la recepción de la receta hasta la entrega final. Utilizamos insumos certificados y equipos de precisión que garantizan un resultado óptimo y seguro.',
      },
      {
        title: 'Tecnología y Normativa Vigente',
        text: 'Contamos con un laboratorio que cumple con todos los requisitos establecidos por las normas vigentes para la correcta elaboración de fórmulas magistrales. Esto nos permite asegurar dosis exactas, especialmente para áreas como pediatría, dermatología y geriatría.',
      },
    ],
    form: {
      title: 'Envíenos su Receta',
      intro: 'Ofrecemos la más alta calidad en nuestros medicamentos.',
      note: 'IMPORTANTE: Especifique si es alérgico a alguna sustancia (indique cuál) o si sufre de algún problema de hipertensión o coronario (indique cuál).',
      fileLabel: 'Adjunta tu receta médica en PDF o imagen',
      privacyLabel: 'Declaro que he leído y acepto la política de privacidad de tu empresa.',
      formType: 'magistrales',
    },
    cta: {
      title: 'Ponte en contacto con nosotros hoy mismo',
      text: 'Da el primer paso hacia un tratamiento hecho a tu medida. Envíanos tu receta médica y nuestro equipo especializado desarrollará tu fórmula magistral con altos estándares de calidad y seguridad.',
    },
    channels: {
      title: 'Canales de Atención',
      phone: '968 762 510',
      email: 'ventasmagistrales@kamaryfarma.com',
    },
  },

  // Páginas de servicio. Claves = slug de la ruta.
  services: {
    'ventas-corporativas': {
      title: 'Venta Corporativa',
      eyebrow: 'Ventas corporativas',
      intro:
        'Nuestro servicio de ventas corporativas está diseñado para atender las necesidades de abastecimiento de clínicas, consultorios, empresas, instituciones y organizaciones de diversos sectores. Ofrecemos una gestión ágil, segura y eficiente que garantiza la disponibilidad continua de medicamentos, dispositivos médicos y productos sanitarios.',
      paragraphs: [
        'Nuestro objetivo es facilitar la operación de nuestros clientes, asegurando que cuenten con insumos de calidad y entregas confiables para garantizar la continuidad de sus servicios.',
      ],
      bulletsLead: 'En Kamary Perú somos un aliado estratégico para nuestros clientes corporativos, brindando:',
      bullets: [
        'Atención personalizada y asesoría profesional.',
        'Precios preferenciales y condiciones comerciales adaptadas a cada organización.',
        'Abastecimiento programado y entregas puntuales.',
      ],
      highlights: [],
      image: '/web/services/Ventas-corporativas.webp',
      contact: { phone: '996 001 876', email: 'jose.carrillo@kamaryfarma.com' },
      formType: 'corporativas',
    },
    'operador-logistico': {
      title: 'Gestiona tu logística fácil y sin esfuerzo',
      eyebrow: 'Operador logístico',
      slogan: 'Salud en Movimiento',
      intro:
        'En Kamary Perú ofrecemos un servicio de logística especializada en salud, orientado tanto a clientes finales (B2C) como a empresas, clínicas y organizaciones (B2B). Garantizamos entregas rápidas, seguras y con trazabilidad completa, cumpliendo rigurosamente con los estándares sanitarios y de cadena de frío cuando corresponde.',
      paragraphs: [
        'Operamos con procesos auditables, rutas optimizadas y un equipo capacitado para asegurar que cada envío llegue a tiempo y bajo las condiciones adecuadas.',
      ],
      bulletsLead: 'Nuestro Servicio logístico incluye:',
      bullets: [
        'B2C: entregas a domicilio de medicamentos, preparados magistrales y productos sanitarios con monitoreo y confirmación en tiempo real.',
        'B2B: abastecimiento programado, distribución de productos farmacéuticos y despachos corporativos con control documentado, eficiencia operativa y cumplimiento normativo.',
      ],
      highlights: [],
      image: '/web/services/Operador-logistico.webp',
      contact: { phone: '996 001 876', email: 'jose.carrillo@kamaryfarma.com' },
      formType: 'logistico',
    },
    'distribucion-y-transporte': {
      title: 'Distribución y Transporte de Medicamentos',
      eyebrow: 'Distribución y transporte',
      intro:
        'Droguería KAMARY FARMA brinda el servicio de Distribución y Transporte a sus clientes desde el 07 de agosto del 2020, para ello tenemos vehículos acondicionados que conservan la calidad y eficacia de los medicamentos y dispositivos que se distribuyen y transportan, nuestro personal está capacitado para el manejo de estos, asimismo hemos implementado todos los procesos establecidos por la DIGEMID. Contamos con certificado BPDyT y BPA.',
      paragraphs: [],
      bulletsLead: '',
      bullets: [],
      highlights: [],
      image: null,
      certificate: '/web/certificates/Certificado-Distribucion.png',
      contact: { phone: '01 3079982 / 932 831 242', email: 'ventas@kamaryfarma.com' },
      formType: 'distribucion',
    },
    'importacion-de-medicamentos': {
      title: 'Importación de Medicamentos',
      eyebrow: 'Importación',
      intro:
        'Droguería KAMARY MEDICAL brinda el servicio de importación de medicamentos, dispositivos médicos y productos sanitarios a empresas que no cuentan con droguería propia.',
      paragraphs: [
        'También, te ayudamos a realizar los trámites de desaduanaje del producto que se importe. Contamos con certificado BPDyT y BPA.',
      ],
      bulletsLead: '',
      bullets: [],
      highlights: [],
      image: null,
      contact: { phone: '01 3079982 / 932 831 242', email: 'ventas@kamaryfarma.com' },
      formType: 'importacion',
    },
    almacen: {
      title: 'Almacén de Medicamentos',
      eyebrow: 'Almacenamiento',
      intro:
        'Droguería KAMARY FARMA brinda el servicio de almacenamiento, para ello cuenta con tres almacenes, uno de temperatura controlada de 15°C a 25°C, otro de cadena de frío de 2°C a 8°C, y uno de medicamentos congelados de -15°C a -25°C, con sus respectivas áreas autorizadas por DIGEMID, y con Certificación en Buenas Prácticas de Almacenamiento.',
      paragraphs: [
        'Asimismo, nuestra amplia experiencia en la atención de diversas empresas del sector público y privado ha permitido ampliar los estándares de atención al usuario y venta de productos de excelente calidad. Contamos con certificado en BPA y BPDyT.',
      ],
      bulletsLead: '',
      bullets: [],
      highlights: [
        { label: 'Medicamentos congelados', range: '-15°C a -25°C' },
        { label: 'Cadena de frío', range: '2°C a 8°C' },
        { label: 'Temperatura controlada', range: '15°C a 25°C' },
      ],
      image: null,
      certificate: '/web/certificates/Certificado-Almacenamiento.png',
      contact: { phone: '01 3079982 / 932 831 242', email: 'ventas@kamaryfarma.com' },
      formType: 'almacen',
    },
    'asesoria-tecnica-y-comercial': {
      title: 'Asesoría Técnica y Comercial',
      eyebrow: 'Asesoría',
      intro: 'Asesoría Técnica y Comercial en KAMARY',
      paragraphs: ['Contamos con certificado BPDyT y BPA.'],
      bulletsLead: '',
      bullets: [
        'Obtener los registros o notificación sanitaria de medicamentos, cosméticos y dispositivos médicos, necesarios para la importación y comercialización.',
        'Autorización sanitaria de funcionamiento, certificación de BPA y BPDyT, u otros trámites que requieren realizar las boticas, droguerías y laboratorios.',
        'Subsanación de observaciones por las inspecciones inopinadas de DIGEMID o DIRIS.',
        'Levantamiento de cierre temporal, como consecuencia de las inspecciones inopinadas de DIGEMID o DIRIS.',
      ],
      highlights: [],
      image: null,
      contact: { phone: '01 3079982 / 932 831 242', email: 'ventas@kamaryfarma.com' },
      formType: 'asesoria',
    },
  },

  contact: {
    title: 'Contacto',
    intro: 'Encuentra la asesoría que necesitas. Estamos disponibles en redes sociales y en nuestra sede central.',
    location: {
      title: 'Ubicación',
      address: 'Yen Escobedo Garro 830, Lima 15021, Perú',
      mapsUrl: 'https://maps.app.goo.gl/9t8Cy8eCutAzSLV9A',
      image: '/web/services/Ubicacion-local.webp',
    },
    social: { title: 'Síguenos en' },
    form: {
      title: 'Escríbenos',
      fields: ['Nombre', 'Teléfono', 'Correo electrónico', 'Consultas o comentario'],
      privacyLabel: 'Declaro que he leído y acepto la política de privacidad de tu empresa.',
      formType: 'contacto',
    },
    jobs: {
      title: 'Trabaja con nosotros',
      fields: ['Nombre', 'Teléfono', 'Correo electrónico'],
      privacyLabel: 'Declaro que he leído y acepto la política de privacidad de tu empresa.',
      formType: 'trabaja',
    },
  },

  complaints: {
    title: 'Libro de Reclamaciones',
    legalNote:
      'Conforme a lo establecido en el Código de Protección y Defensa del Consumidor este establecimiento cuenta con un Libro de Reclamaciones a tu disposición. Solicítalo para registrar una queja o reclamo.',
    types: [
      { label: 'RECLAMO', text: 'Disconformidad relacionada a los productos o servicios.' },
      {
        label: 'QUEJA',
        text: 'Disconformidad no relacionada a los productos o servicios; o, malestar o descontento respecto a la atención al público.',
      },
    ],
    declaration:
      'Declaro ser el titular del contenido del presente formulario, manifestando bajo declaración jurada los hechos descritos en él.',
    attachmentNote: 'Subir archivo adicional. PDF o imagen, tamaño máximo 10 MB.',
    formType: 'complaints',
  },

  privacy: {
    title: 'Políticas de Privacidad',
    sections: [
      {
        paragraphs: [
          'Para Farmacia Kamary Perú es sumamente importante la seguridad de la privacidad de todo usuario, por ello se establece la presente política de protección de la información personal. Farmacia Kamary Perú aprecia la confianza de los visitantes del sitio web kamaryfarma.com en el tratamiento de su información personal, el cual será de manera cuidadosa y responsable; practicando los estándares más altos posibles de protección de datos y privacidad, en especial lo establecido por la Ley N.º 29733, Ley de protección de datos personales peruana.',
          'El usuario, al acceder a kamaryfarma.com, se considera que acepta las prácticas descritas en estas Políticas de Privacidad y Protección de Datos y da un consentimiento expreso para el tratamiento de los datos personales que por él sean facilitados o que se faciliten a través de su ingreso al sitio web o por cualquier medio. Asimismo, el usuario consiente expresamente que Farmacia Kamary Perú pueda ceder dichos datos personales aún a terceros, debiendo el usuario abandonar el sitio web de manera inmediata en caso contrario.',
          'Los datos personales que se recaben, formarán parte de una base de datos de Farmacia Kamary Perú, que permanecerá vigente durante aquel periodo que el Usuario considere necesario para cumplir la finalidad específica para la que los datos fueron recabados, una vez concluido este, sus datos se cancelarán y bloquearán, para su posterior supresión de conformidad con la Ley de Protección de Datos Personales, Ley N.º 29733 y su norma reglamentaria. Los datos personales con los que contará Farmacia Kamary Perú se administrarán y se tratarán para las siguientes finalidades que son estrictamente necesarias para la usabilidad de nuestro sitio web. Usted manifiesta aceptar y dar consentimiento libre, previo, expreso, inequívoco e informado para el tratamiento de sus datos personales a favor de Farmacia Kamary Perú para los siguientes fines:',
        ],
        bullets: [
          'Identificación de usuarios al momento de brindar información o contenidos;',
          'Fines estadísticos;',
          'Enviar boletines informativos;',
        ],
      },
      {
        paragraphs: [
          'El Usuario podrá revocar su consentimiento en cualquier momento enviándonos una notificación.',
          'Los usuarios y terceros garantizan y responden, en cualquier caso, por la veracidad, exactitud, vigencia, legalidad y autenticidad de todos los datos e información personal ingresada.',
        ],
      },
      {
        heading: 'Conservación de la información',
        paragraphs: [
          'El Usuario autoriza a Farmacia Kamary Perú a conservar sus datos una vez finalizada la relación contractual, para el cumplimiento de las obligaciones legales pertinentes, y para que pueda recibir información publicitaria y ofertas comerciales, en respeto a lo establecido en el Registro “Gracias… no insista” de INDECOPI.',
        ],
      },
      {
        heading: 'Comunicaciones vía correo electrónico',
        paragraphs: [
          'El usuario, al brindar su correo electrónico a Farmacia Kamary Perú, le autoriza a brindarle información sobre: actualizaciones, mejoras, ofertas, beneficios, promociones, entre otros.',
        ],
      },
      {
        heading: '¿Kamary Perú comparte la información que recibe?',
        paragraphs: [
          'Kamary Perú podrá compartir sus datos con terceros aliados, así como con empresas colaboradoras, así como compañías que pudieran adquirir publicidad. De igual modo, busca que dichos socios sigan prácticas similares a las mencionadas en el presente Políticas de Privacidad y Protección de Datos. Para el caso de uso comercial de la información obtenida de un usuario o un tercero, en mención enumerativa más no limitativa, esta solo será para el ofrecimiento de servicios, bienes, ofertas, promociones, sorteos, entre otros, que brinde Farmacia Kamary Perú.',
          'Farmacia Kamary Perú adoptará todas y cada una de las medidas de seguridad administrativas, físicas y técnicas que establezca la ley aplicable para salvaguardar su información personal, por lo que de igual manera y en caso de que un tercero necesite conocer de dicha información, Farmacia Kamary Perú obligará a dichos terceros a cumplir con el presente Aviso de Privacidad, así como a adoptar las medidas de seguridad administrativas, físicas y técnicas establecidas en la ley aplicable, a fin de proteger sus datos personales de cualquier daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no autorizado.',
        ],
      },
      {
        heading: '¿Quién está colectando la información del usuario, o tercero?',
        paragraphs: [
          'Banners de Publicidad que conectan a esta página web: Kamary Perú puede contratar a otras compañías para poner banners de publicidad en otros portales web, desempeñar rastreos y reportar actividades (Servidores de Publicidad de terceras personas). Los Servidores de Publicidad de terceras personas o empresas, están sujetos a sus propias políticas de privacidad. Si un USUARIO, o un tercero desean más información sobre sus políticas de privacidad, incluyendo información sobre cómo retirarse de sus métodos de rastreo, por favor ponerse en contacto directamente con Kamary Perú.',
          'Agente de Análisis de páginas web: Kamary Perú puede contratar empresas que brinden servicios en línea o fuera de ella, para que lo ayuden a manejar y optimizar sus procesos de mercadeo y negocio. Kamary Perú usa el servicio de compañías de mercadeo para ayudar a medir la efectividad de su publicidad y promoción y de cómo los visitantes y usuarios usan esta página Web. Para hacer esto, Kamary Perú utiliza etiquetas de acciones y cookies proporcionados por las compañías de mercadeo en el presente sitio web.',
        ],
      },
      {
        heading: '¿Qué tan segura está mi información?',
        paragraphs: [
          'Los usuarios pueden ayudarnos también tomando precauciones para proteger su información personal cuando está en Internet, como por ejemplo cambiando su clave secreta continuamente, usando una combinación de letras y números, y asegurando de que esté usando un navegador de web seguro. Es importante que proteja su computador contra accesos no autorizados. Asegúrese de desconectarse cuando termine de usar un computador ajeno. Farmacia Kamary Perú ha adoptado los niveles de seguridad de protección de los Datos Personales legalmente requeridos. No obstante, el Usuario debe ser consciente de que dichas medidas en Internet no son inexpugnables.',
        ],
      },
      {
        heading: 'Política anti-spam',
        paragraphs: [
          'El usuario puede configurar su navegador para que no acepte “cookies” a fin de prevenir asignaciones de los servidores de publicidad de un identificador único; sin embargo, puede experimentar dificultades usando ciertas características en esta página web si no acepta los cookies. Prohibición de recolección: Los usuarios y cualquier tercero está prohibido de realizar todo tipo de recolección de datos personales publicados en este sitio web de los usuarios registrados, ya sea por otros usuarios, usuarios registrados, proveedores y otros, sin la debida autorización del titular de los datos.',
        ],
      },
      {
        heading: '¿Cómo corregir o eliminar información proporcionada?',
        paragraphs: [
          'La información personal identificable que kamaryfarma.com colecta podrá ser actualizada por medios que se indiquen en el futuro. El usuario puede darse de baja o cancelar la suscripción de los boletines, correos electrónicos o publicidad.',
        ],
      },
      {
        heading: 'Recomendaciones para menores de edad',
        paragraphs: [
          'Todo usuario o tercero que sea menor de edad (menor de 18 años), debe evitar dar sus datos personales o de contacto (número telefónico fijo o móvil, dirección domiciliaria, cuentas de correos electrónicos o de usuario en alguna red social) a extraños, o que no conozca de manera fiable. kamaryfarma.com información personalmente identificable y quisiera que Farmacia Kamary Perú deje de recibir dicha información, o borre la información personal del niño del registro de datos, deberá contactarse con kamaryfarma.com',
        ],
      },
      {
        heading: 'Prohibición de contenidos',
        paragraphs: [
          'Los usuarios y terceros están prohibidos de mostrar información que vulnere o devele la intimidad o privacidad de otros usuarios, usuarios registrados y de terceros. La responsabilidad que se deriven de dichos actos será de manera exclusiva del emisor. De igual modo se rechaza toda forma de xenofobia, racismo o discriminación.',
        ],
      },
      {
        heading: 'Nuestro compromiso a nivel de compañía con su privacidad',
        paragraphs: [
          'Como se mencionó, Farmacia Kamary Perú toma muy en serio la privacidad de los usuarios. Farmacia Kamary Perú, para cerciorarse que la información personal esté segura, comunica y entrena a sus empleados en estas pautas y hace cumplir estrictamente los estándares de privacidad dentro de la compañía.',
        ],
      },
      {
        heading: 'Cambios en las políticas de privacidad',
        paragraphs: [
          'Farmacia Kamary Perú realiza cambios a cualquiera de los términos o condiciones de la presente Política de Privacidad y Protección de Datos, los cambios serán fijados en este documento de modo que todo usuario o tercero sepa siempre qué información se recopila de él, cómo puede ser que Farmacia Kamary Perú utilice esa información y a quién lo divulgará. Dentro del marco de respeto de las normas de protección de datos personales en el Perú, puede cambiar, modificar, agregar o quitar porciones de esta política en cualquier momento, y cualquier cambio llegará a ser eficaz, inmediatamente se haga a menos que Farmacia Kamary Perú lo diga de otra manera. El uso continuado de la página web luego de la publicación de los cambios se aceptará como confirmación de la aceptación de estos.',
        ],
      },
      {
        heading: 'Consultas sobre la privacidad',
        paragraphs: [
          'Si usted tiene dudas o preguntas sobre las políticas de privacidad o de procesos de datos de Kamary Perú, por favor utilizar la dirección de correo electrónico a: ventas@kamaryfarma.com para contactarlos.',
        ],
      },
    ],
  },

  notFound: {
    title: 'Página no encontrada',
    text: 'El enlace que has seguido puede estar roto, o la página puede haber sido retirada.',
    cta: 'Regrese a Inicio',
    href: '/',
  },
};
