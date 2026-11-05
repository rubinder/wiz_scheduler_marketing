import generated from "./generated/es";
import chrome from "./chrome/es";
import type { Copy } from "./en";

const es: Copy = {
  ...generated,
  ...chrome,
  notFound: {
    title: "Página no encontrada",
    desc: "Ese enlace no lleva a ninguna parte. La página de inicio sí.",
    home: "Volver al inicio",
  },
  legal: {
    englishOnly: "Este documento se publica en inglés. El texto en inglés es la versión vinculante.",
    backHome: "Volver al inicio",
  },
  nyc: {
    metaTitle: "Software de horarios para la ley Fair Workweek de NYC",
    metaDesc:
      "Programa turnos de comida rápida y comercio en Nueva York respetando los 14 días de aviso, las 11 horas entre turnos y las primas por cambios. Incluye un verificador gratuito.",
    eyebrow: "Nueva York",
    title: "Horarios Fair Workweek,",
    titleAccent: "sin multas",
    intro:
      "La ley Fair Workweek de la Ciudad de Nueva York fija reglas para cómo los empleadores de comida rápida y comercio programan a su personal. WizScheduler aplica la regla de descanso mientras construye el horario y señala el resto.",
    reviewedOn: "Resumen legal revisado el",
    source: "Fuente: Departamento de Protección al Consumidor y al Trabajador de NYC (DCWP)",
    sourceUrl: "https://www.nyc.gov/site/dca/workers/workersrights/fastfood-retail-workers.page",
    coveredEyebrow: "01 — A quién aplica",
    coveredTitle: "Dos industrias, dos conjuntos de reglas",
    fastFoodTitle: "Comida rápida",
    fastFoodDesc:
      "Establecimientos que sirven comida o bebida para consumo inmediato, toman pedidos en mostrador y forman parte de una cadena de 30 o más establecimientos a nivel nacional. Los franquiciados cuentan.",
    retailTitle: "Comercio minorista",
    retailDesc: "Negocios minoristas con 20 o más empleados en establecimientos de la Ciudad de Nueva York.",
    rulesEyebrow: "02 — Las reglas",
    fastFoodRulesTitle: "Comida rápida",
    fastFoodRules: [
      { title: "14 días de aviso", desc: "Los horarios escritos deben entregarse 14 días antes del primer turno." },
      {
        title: "11 horas entre turnos",
        desc: "Un turno de cierre seguido de uno de apertura con menos de 11 horas entre ambos es un «clopening». Requiere el consentimiento escrito del trabajador y una prima de $100 cada vez.",
      },
      {
        title: "Primas por cambios",
        desc: "Los cambios con menos de 14 días de aviso cuestan de $10 a $75 por cambio, según lo tarde que se hagan y si se pierden horas.",
      },
      { title: "Ofrecer horas primero al personal actual", desc: "Los turnos abiertos van a los empleados existentes antes que a nuevas contrataciones." },
    ],
    retailRulesTitle: "Comercio minorista",
    retailRules: [
      { title: "72 horas de aviso", desc: "Los horarios deben entregarse 72 horas antes del primer turno." },
      { title: "Sin turnos de guardia", desc: "No se puede programar a los empleados en modalidad de guardia («on call»)." },
      {
        title: "Sin cambios de última hora",
        desc: "No se pueden cancelar ni añadir turnos con menos de 72 horas de aviso salvo que el empleado acepte.",
      },
    ],
    premiumsEyebrow: "03 — Primas por cambios",
    premiumsTitle: "Lo que cuesta un cambio tardío en comida rápida",
    premiumsNotice: "Aviso dado",
    premiumsAdded: "Horas añadidas o movidas",
    premiumsReduced: "Horas reducidas",
    premiums: [
      { notice: "Menos de 14 días, al menos 7", added: "$10", reduced: "$20" },
      { notice: "Menos de 7 días, al menos 24 horas", added: "$15", reduced: "$45" },
      { notice: "Menos de 24 horas", added: "$15", reduced: "$75" },
    ],
    finesTitle: "Multas",
    finesDesc:
      "$500 por infracción y por trabajador la primera vez, hasta $750 por una segunda en dos años y hasta $1,000 después, además de las primas y daños debidos al trabajador.",
    productEyebrow: "04 — Qué hace WizScheduler",
    productTitle: "Lo que se aplica hoy y lo que viene",
    productRows: [
      {
        title: "11 horas entre turnos",
        status: "enforced",
        desc: "Fija un descanso mínimo de 11 horas en una ubicación y cada horario generado, algorítmico o con AI, lo respeta entre ubicaciones. Se permiten turnos partidos el mismo día.",
      },
      {
        title: "Disponibilidad, roles y límites de horas",
        status: "enforced",
        desc: "Los horarios solo usan las horas que el personal indicó, en los roles que tiene, bajo límites semanales y diarios.",
      },
      {
        title: "Seguimiento del aviso de 14 días",
        status: "roadmap",
        desc: "Aún no está construido. El verificador gratuito señala hoy los turnos dentro del plazo de aviso; el seguimiento dentro de la app está planificado.",
      },
      {
        title: "Señalización de primas por cambios",
        status: "roadmap",
        desc: "Aún no está construido. Las ediciones a un horario publicado no se costean automáticamente.",
      },
    ],
    enforced: "Se aplica",
    roadmap: "En desarrollo",
    ctaEyebrow: "05 — Empezar",
    ctaTitle: "Verifica un horario que ya tienes",
    ctaDesc: "Sube el horario de la semana pasada y ve cada clopening y cada turno con poco aviso en segundos. Sin cuenta.",
    ctaChecker: "Abrir el verificador gratis",
    ctaSignup: "Regístrate gratis",
  },
  compare: {
    eyebrow: "Comparar con {competitor}",
    checkedOn: "Datos del competidor verificados el",
    ctaSignup: "Regístrate gratis",
    ctaHome: "Volver al inicio",
    faqTitle: "Preguntas frecuentes",
    howToTurnOn:
      "Activa las solicitudes de preferencias en la Configuración de la empresa y tus empleados podrán enviarte sus preferencias para que las apruebes.",
    related: "Más comparaciones",
    pages: {
      "/compare/7shifts": "Wiz Scheduler frente a 7shifts",
      "/compare/7shifts-alternatives": "Alternativas a 7shifts y sus precios comparados",
      "/compare/deputy": "Wiz Scheduler frente a Deputy",
      "/compare/deputy-alternatives": "Alternativas a Deputy y sus precios comparados",
      "/compare/homebase": "Wiz Scheduler frente a Homebase",
      "/compare/when-i-work": "Wiz Scheduler frente a When I Work",
    },
    pricingCaption: "Precios de lista mensuales",
    pricingSources: "Fuentes",
    pricingHeadings: { plan: "Plan", size: "Tamaño del equipo", price: "Precio", autoScheduling: "Programación automática" },
    free: "Gratis",
    perLocation: "{price} por ubicación al mes",
    allLocations: "{price} al mes para todas las ubicaciones",
    perUser: "{price} por usuario al mes",
    userSize: "Por usuario; mínimo de {minimum} al mes con facturación mensual",
    noLimit: "Sin límite de equipo publicado",
    wizProSize: "Ubicaciones ilimitadas; 500 empleados incluidos y luego {extra} al mes por cada 500 adicionales",
  },
  checker: {
    metaTitle: "Verificador gratuito de horarios Fair Workweek NYC",
    metaDesc:
      "Sube un horario de turnos y encuentra cada clopening y cada turno con poco aviso según la ley Fair Workweek de NYC. Gratis, sin cuenta, sin almacenar nada.",
    eyebrow: "Herramienta gratuita",
    title: "Revisa un horario en busca de",
    titleAccent: "clopenings",
    intro:
      "Sube un CSV o una hoja de cálculo, o pega filas de una. Buscamos menos de 11 horas entre turnos y, si nos dices cuándo se publicó el horario, turnos dentro del plazo de aviso de 14 días.",
    comingSoonTitle: "Casi listo",
    comingSoonDesc: "El verificador abre en breve. Regístrate gratis y genera ya un horario conforme en la app.",
    upload: "Elegir archivo",
    uploadHint: "CSV o XLSX con columnas de empleado, inicio y fin.",
    pasteLabel: "O pega filas desde una hoja de cálculo",
    pastePlaceholder: "Empleado\tInicio\tFin\nA.B.\t2026-10-05 16:00\t2026-10-06 00:00",
    sample: "Descargar un archivo de ejemplo",
    mappingTitle: "Confirma las columnas",
    colEmployee: "Empleado",
    colStart: "Inicio del turno",
    colEnd: "Fin del turno",
    colUnset: "— elegir —",
    publishedLabel: "Horario publicado el (opcional)",
    publishedHint: "Activa la verificación del aviso de 14 días.",
    timezoneLabel: "Zona horaria",
    check: "Verificar horario",
    privacy:
      "Las filas se envían a la API de WizScheduler para evaluarlas y no se almacenan. Puedes reemplazar los nombres por iniciales antes.",
    errNoRows: "No se encontraron turnos. El archivo necesita una fila de encabezado y al menos un turno.",
    errMapping: "Elige una columna para empleado, inicio y fin.",
    errParse: "No se pudo leer ese archivo. Expórtalo como CSV o XLSX e inténtalo de nuevo.",
    errTooMany: "Son más de {max} turnos. Divide el archivo y verifica cada parte.",
    errBusy: "El verificador está ocupado. Inténtalo en un minuto.",
    errUnavailable: "No se pudo verificar ahora. Inténtalo más tarde.",
    checking: "Verificando…",
    skippedRows: "{n} filas omitidas: falta empleado, inicio o fin.",
    resultsTitle: "Resultados",
    totalEmployees: "empleados revisados",
    totalClopenings: "clopenings",
    totalShortNotice: "turnos con poco aviso",
    noFindings: "No se encontraron clopenings ni turnos con poco aviso.",
    clopening: "Clopening",
    shortNotice: "Poco aviso",
    restHours: "horas de descanso",
    noticeDays: "días de aviso",
    fixTitle: "Corrige este horario automáticamente",
    fixDesc: "WizScheduler construye horarios que respetan la regla de 11 horas desde el inicio.",
    fixCta: "Regístrate gratis",
  },
  calculator: {
    title: "¿Cuánto costaría para tu equipo?",
    locations: "Ubicaciones",
    employeesPerLocation: "Empleados por ubicación",
    plan: "Plan",
    perMonth: "al mes",
    doesNotFit: "No se ajusta a tu equipo",
    contactSales: "Contactar a ventas",
    autoSchedulingHeader: "Programación automática",
    autoYes: "Sí",
    autoBeta: "Beta",
    autoNo: "No",
    highlightedLabel: "La más barata con programación automática",
    footnote:
      "Precios de lista con facturación mensual, en dólares estadounidenses. No incluyen impuestos, complementos ni descuentos anuales. Precios verificados el {date}; los proveedores los cambian, así que confírmalos en sus páginas de precios.",
    sevenShiftsBeta: "El programador automático de 7shifts está en beta y se está habilitando en cuentas seleccionadas.",
  },
  alternatives: {
    eyebrow: "Alternativas",
    heroHeadline: "El horario en el que tu equipo tuvo voz.",
    heroQualifier:
      "Los gerentes pueden ingresar las preferencias de todos. Los empleados pueden enviar las suyas cuando se activan las solicitudes de preferencias en la Configuración de la empresa.",
    checkedOn: "Precios y funciones verificados el {date}. Las fuentes están debajo de cada herramienta.",
    tableEyebrow: "Comparación directa",
    tableTitle: "Comparación de funciones",
    tableHeadings: {
      tool: "Herramienta",
      autoScheduling: "Programación automática",
      preferences: "Preferencias de los empleados",
      fairWorkweek: "Fair Workweek de Nueva York",
      pricing: "Precios",
    },
    exampleEyebrow: "Ejemplo práctico",
    exampleTitle: "{locations} ubicaciones, {employees} empleados por ubicación",
    exampleNote:
      "Precios de lista mensuales, verificados el {date}, para {locations} ubicaciones con {employees} empleados por ubicación, sin impuestos, complementos ni descuentos anuales. Aparecen todos los planes, cada uno con el tamaño de equipo para el que es. Los que no le sirven a este equipo están marcados, con lo que costarían a este tamaño cuando tiene sentido; el destacado es el plan más barato de cada herramienta que le sirve y tiene programación automática.",
    exampleSevenShifts:
      "7shifts fija el plan según los empleados por ubicación. Con {employees} empleados por ubicación, cada ubicación entra en Essentials o Premium (hasta {essentialsMaxEmployees} empleados cada una), no en Pro (de {proMinEmployees} a {proMaxEmployees}).",
    exampleDeputy:
      "Deputy cobra por usuario; aquí contamos un usuario por empleado: {users} usuarios. Los planes mensuales tienen un mínimo de {deputyMinimum} al mes, y Lite no tiene programación automática.",
    exampleWiz: "Wiz Scheduler Pro es un solo precio base para todas las ubicaciones. La generación con AI se paga con créditos prepagados si la usas.",
    exampleHeadings: { plan: "Plan", price: "Al mes", how: "Cómo se calcula", autoScheduling: "Programación automática" },
    perLocation: "{count} ubicaciones × {price}",
    perUser: "{count} empleados × {price}",
    flat: "Un solo precio para todas las ubicaciones",
    breakdownEyebrow: "En detalle",
    breakdownTitle: "Herramienta por herramienta",
    strengths: "Puntos fuertes",
    limitations: "Limitaciones",
    sources: "Fuentes",
    differencesEyebrow: "Por qué Wiz Scheduler",
    differencesTitle: "Qué cambia",
    differences: [
      {
        title: "Tu equipo tiene voz",
        body: "Los gerentes pueden registrar los días preferidos de cada empleado, sus horas preferidas, su límite de horas semanales, un tope semanal de turnos en una franja horaria y con quién trabaja bien o de quién conviene separarlo. Activa las solicitudes de preferencias en la Configuración de la empresa y tus empleados podrán enviarte sus preferencias para que las apruebes. El generador arma la semana a partir de ellas: una preferencia firme deja a la persona fuera de un turno, y una más flexible la vuelve una opción menos probable.",
      },
      {
        title: "Así corriges menos",
        body: "Como las preferencias ya están en el borrador, hay menos que reacomodar después de generarlo. Cuando no se puede cumplir una preferencia, ese turno queda marcado, así que ves cada concesión. Un turno que nadie puede tomar sin romper una regla firme queda abierto en lugar de forzarse. Igual revisas la semana, pero partes de lo que tu equipo pidió.",
      },
      {
        title: "Un solo precio para todas las ubicaciones",
        body: "Pro cuesta {wizPro} al mes para todas tus ubicaciones, con 500 empleados, 50 puestos de gerente y 25 generaciones de horario incluidos, y pequeños cargos por uso por encima de eso. 7shifts cobra por ubicación y Deputy por usuario. La generación con AI es opcional y se paga con créditos prepagados.",
      },
      {
        title: "Descanso entre turnos, y hasta dónde llegamos",
        body: "Fija un descanso mínimo, por ejemplo de 11 horas, en una ubicación y ningún horario generado lo romperá. La regla está desactivada hasta que la configuras, y es todo nuestro soporte de Fair Workweek: no hacemos seguimiento del aviso anticipado ni del pago de primas. Si necesitas eso, 7shifts y Deputy hacen más aquí.",
      },
      {
        title: "Trae a tu equipo",
        body: "El plan de pago importa ubicaciones, roles, empleados y disponibilidad desde 7shifts o Deputy con un token de API de tu cuenta allí. Las preferencias y las relaciones entre compañeros no se importan, así que las agregas en Wiz Scheduler.",
      },
      {
        title: "Los nombres quedan privados",
        body: "Los nombres de los empleados se reemplazan por sustitutos antes de enviar cualquier dato al modelo de AI.",
      },
    ],
    faqTitle: "Preguntas frecuentes",
    ctaTitle: "Pruébalo con tu propio equipo",
    ctaBody:
      "El plan gratuito cubre {wizFreeLocations} ubicaciones y {wizFreeEmployees} empleados, con un horario por ubicación al mes. La generación con AI está en Pro y se paga con créditos prepagados.",
    ctaSignup: "Empieza gratis",
    checkerLink: "Prueba el verificador de horarios gratis",
    "7shifts": {
      title: "Alternativas a 7shifts y precios de 7shifts comparados | Wiz Scheduler",
      metaDescription:
        "Los precios de 7shifts junto a Deputy, Homebase, When I Work y Wiz Scheduler: todos los planes que le sirven a tu equipo, cómo programa cada herramienta, si usa las preferencias de los empleados y el soporte de Fair Workweek de Nueva York.",
      heading: "Alternativas a 7shifts",
      intro:
        "7shifts cobra cada ubicación según sus empleados, y su programador automático, en beta para cuentas seleccionadas, arma el borrador a partir del historial de ventas y horarios. Si estás evaluando alternativas, así se comparan cinco herramientas en precio, programación automática, preferencias de los empleados y Fair Workweek de Nueva York, con precios tomados del sitio de cada proveedor.",
      compareLink: "Wiz Scheduler vs 7shifts",
      faq: [
        {
          q: "¿Cuánto cuesta 7shifts?",
          a: "7shifts cobra por ubicación al mes, y el plan depende de los empleados por ubicación. Comp es gratis para una ubicación con hasta {compMaxEmployees} empleados. Con 1 a {essentialsMaxEmployees} empleados por ubicación, Essentials cuesta {essentials} y Premium {premium}. Con {proMinEmployees} o más, Pro cuesta {pro} (hasta {proMaxEmployees} empleados) y Premium {premiumLarge}. La facturación anual tiene un 10% de descuento. Son precios de lista de la página de precios de 7shifts.",
        },
        {
          q: "¿Qué plan de 7shifts sirve para {employees} empleados por ubicación?",
          a: "Essentials ({essentials} por ubicación al mes) o Premium ({premium}), porque ambos cubren hasta {essentialsMaxEmployees} empleados por ubicación. Con {locations} ubicaciones así, el total es de {sevenShiftsExampleTotal} al mes en {sevenShiftsExamplePlan}.",
        },
        {
          q: "¿7shifts programa los horarios automáticamente?",
          a: "Su programador automático está en beta y se está habilitando en cuentas seleccionadas. Arma el borrador a partir de al menos seis semanas de historial de ventas y horarios, y revisa la disponibilidad. Su documentación no menciona preferencias de turnos ni de compañeros.",
        },
        {
          q: "¿Los empleados pueden dar sus propias preferencias en Wiz Scheduler?",
          a: "Sí. Los gerentes pueden ingresar las preferencias de todos. Los empleados pueden enviar las suyas cuando se activan las solicitudes de preferencias en la Configuración de la empresa, y un gerente aprueba cada solicitud. Las solicitudes de preferencias vienen desactivadas.",
        },
        {
          q: "¿Wiz Scheduler sirve para Fair Workweek de Nueva York?",
          a: "Solo para la regla de descanso. Wiz Scheduler aplica un descanso mínimo entre turnos, fijado por ubicación y desactivado hasta que lo configuras. No hace seguimiento del aviso anticipado ni del pago de primas. 7shifts señala turnos de cierre y apertura seguidos, cambios dentro de 14 días y pago de primas en sus planes de pago, y Deputy tiene el soporte más completo de las herramientas comparadas aquí.",
        },
        {
          q: "¿Puedo traer mis datos desde 7shifts?",
          a: "En el plan de pago, Wiz Scheduler importa empresas, ubicaciones, departamentos, roles, empleados y sus asignaciones desde 7shifts con un token de API de tu cuenta de 7shifts. Una importación aparte trae la disponibilidad semanal, la no disponibilidad y los días libres aprobados. Las preferencias y las relaciones entre compañeros no se importan.",
        },
      ],
    },
    deputy: {
      title: "Alternativas a Deputy y precios de Deputy comparados | Wiz Scheduler",
      metaDescription:
        "Los precios de Deputy junto a 7shifts, Homebase, When I Work y Wiz Scheduler: todos los planes que le sirven a tu equipo, cómo programa cada herramienta, si usa las preferencias de los empleados y el soporte de Fair Workweek de Nueva York.",
      heading: "Alternativas a Deputy",
      intro:
        "Deputy cobra por usuario, y su programación automática, en Core y Pro, asigna los turnos por costo, por igualdad de horas o aprendiendo de tus horarios anteriores. Además, tiene el soporte de Fair Workweek de Nueva York más completo de estas herramientas. Si estás evaluando alternativas, así se comparan cinco herramientas en precio, programación automática, preferencias de los empleados y Fair Workweek de Nueva York, con precios tomados del sitio de cada proveedor.",
      compareLink: "Wiz Scheduler frente a Deputy",
      faq: [
        {
          q: "¿Cuánto cuesta Deputy?",
          a: "Deputy cobra por usuario al mes. Con facturación mensual, Lite cuesta {deputyLite}, Core {deputyCore} y Pro {deputyPro} por usuario. Con facturación anual, cuestan {deputyLiteAnnual}, {deputyCoreAnnual} y {deputyProAnnual}. Los planes mensuales tienen un mínimo de {deputyMinimum} al mes, y no hay plan gratuito. Son precios de lista de la propia página de precios de Deputy.",
        },
        {
          q: "¿Cuánto costaría Deputy para {locations} ubicaciones con {employees} empleados cada una?",
          a: "Deputy cuenta usuarios, así que ese equipo son {users} usuarios, si contamos un usuario por empleado: {deputyLiteTotal} al mes en Lite, que no tiene programación automática, {deputyExampleTotal} en {deputyExamplePlan}, el plan más barato con programación automática, y {deputyProTotal} en Pro, con facturación mensual. Wiz Scheduler Pro cuesta {wizPro} al mes para todas las ubicaciones.",
        },
        {
          q: "¿Deputy programa los horarios automáticamente?",
          a: "Sí, en Core y Pro; Lite no tiene programación automática. Asigna los turnos por costo, por igualdad de horas o aprendiendo de tus horarios anteriores. Su documentación no menciona preferencias de turnos ni de compañeros.",
        },
        {
          q: "¿Los empleados pueden dar sus propias preferencias en Wiz Scheduler?",
          a: "Sí. Los gerentes pueden ingresar las preferencias de todos. Los empleados pueden enviar las suyas cuando se activan las solicitudes de preferencias en la Configuración de la empresa, y un gerente aprueba cada solicitud. Las solicitudes de preferencias vienen desactivadas.",
        },
        {
          q: "¿Deputy es mejor para Fair Workweek de Nueva York?",
          a: "Sí. Deputy tiene el soporte de Fair Workweek de Nueva York más completo de las herramientas comparadas aquí, con consentimiento para los cambios, pago de primas, avisos con antelación y descansos. Su propia documentación indica que las reglas de comida rápida de Nueva York se aplican a cadenas con 30 o más ubicaciones en todo el país, y las de comercio minorista a empleadores con 20 o más empleados. Wiz Scheduler solo aplica un descanso mínimo entre turnos, fijado por ubicación y desactivado hasta que lo configuras.",
        },
        {
          q: "¿Puedo traer mis datos desde Deputy?",
          a: "En el plan de pago, Wiz Scheduler importa desde Deputy ubicaciones, roles y empleados con su correo, con un token de API de tu cuenta de Deputy, y la no disponibilidad de Deputy llega como horarios en que el empleado no puede trabajar. Cada empleado recibe todos los roles de su ubicación con nivel de habilidad 1, así que ajusta las habilidades después de importar. Una importación aparte trae la disponibilidad. Las preferencias y las relaciones entre compañeros no se importan.",
        },
      ],
    },
  },
};

export default es;
