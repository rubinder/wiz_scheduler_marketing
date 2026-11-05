---
title: "Precios de Deputy frente a {wizPro} al mes para todas las ubicaciones"
description: "Los precios de Deputy para cada plan, por usuario, junto a Wiz Scheduler: el horario en el que tu equipo tuvo voz, por {wizPro} al mes para todas las ubicaciones."
qualifier: "Los gerentes pueden ingresar las preferencias de todos. Los empleados pueden enviar las suyas cuando se activan las solicitudes de preferencias en la Configuración de la empresa."
competitor: "Deputy"
competitorUrl: "https://www.deputy.com/pricing"
checkedOn: "2026-11-04"
calculator: true
toolId: "deputy"
faq:
  - q: "¿Cuánto cuesta Deputy?"
    a: "Deputy cobra por usuario al mes. Con facturación mensual, Lite cuesta {deputyLite}, Core {deputyCore} y Pro {deputyPro} por usuario. Con facturación anual, cuestan {deputyLiteAnnual}, {deputyCoreAnnual} y {deputyProAnnual}. Los planes mensuales tienen un mínimo de {deputyMinimum} al mes, y no hay plan gratuito. La programación automática está en Core y Pro, no en Lite. Son precios de lista de la propia página de precios de Deputy."
  - q: "¿Cuánto costaría Deputy para mi equipo?"
    a: "Deputy cuenta usuarios, no ubicaciones. {locations} ubicaciones con {employees} empleados cada una son {users} usuarios, si contamos un usuario por empleado: {deputyLiteTotal} al mes en Lite, que no tiene programación automática, {deputyCoreTotal} en Core y {deputyProTotal} en Pro, con facturación mensual. Cada contratación suma. Wiz Scheduler Pro cuesta {wizPro} al mes para todas las ubicaciones, con 500 empleados incluidos."
  - q: "¿Cómo envían sus preferencias los empleados?"
    a: "Los gerentes pueden ingresar las preferencias de todos. Activa las solicitudes de preferencias en la Configuración de la empresa y tus empleados podrán enviarte sus preferencias para que las apruebes. Un gerente aprueba cada solicitud y decide cuánto pesa. Las solicitudes de preferencias vienen desactivadas."
  - q: "¿Deputy tiene en cuenta las preferencias de los empleados al programar automáticamente?"
    a: "La programación automática de Deputy, en Core y Pro, asigna los turnos por costo, por igualdad de horas o aprendiendo de tus horarios anteriores. Su documentación no menciona preferencias de turnos ni de compañeros. En Wiz Scheduler, los días preferidos, las horas preferidas, los límites de horas semanales y las relaciones entre compañeros entran al generador."
  - q: "¿Tendré que seguir corrigiendo el horario?"
    a: "A veces, sí. Wiz Scheduler reduce las correcciones; no las elimina. Las preferencias ya están en el borrador, cada turno que va contra una queda marcado, y un turno que nadie puede tomar sin romper una regla firme queda abierto en lugar de forzarse. Revisas la semana partiendo de lo que pidió tu equipo."
  - q: "¿Basta Wiz Scheduler para Fair Workweek de Nueva York?"
    a: "Solo para la regla de descanso. Wiz Scheduler aplica un descanso mínimo entre turnos, que se fija por ubicación y está desactivado hasta que lo configuras. No controla los avisos con antelación ni el pago de primas. Deputy tiene el soporte de Fair Workweek de Nueva York más completo de las herramientas que comparamos, y su propia documentación indica que las reglas de comida rápida de Nueva York se aplican a cadenas con 30 o más ubicaciones en todo el país. Si esas reglas te afectan, Deputy hace más en esto."
  - q: "¿Puedo traer mis datos desde Deputy?"
    a: "En el plan de pago, Wiz Scheduler importa desde Deputy ubicaciones, roles y empleados con su correo, con un token de API de tu cuenta de Deputy, y la no disponibilidad de Deputy llega como horarios en que el empleado no puede trabajar. Cada empleado recibe todos los roles de su ubicación con nivel de habilidad 1, así que ajusta las habilidades después de importar. Una importación aparte trae la disponibilidad. Las preferencias y las relaciones entre compañeros no se importan."
---

Deputy es una herramienta de horarios muy completa. Con ella, el gerente arma la semana, o en Core y Pro su programación automática asigna los turnos por costo, por igualdad de horas o aprendiendo de tus horarios anteriores, y el equipo trabaja con lo que sale. Wiz Scheduler funciona al revés: los días y horas preferidos de cada empleado, su límite de horas semanales y con quién trabaja bien o de quién conviene separarlo entran al generador, y la semana se construye a su alrededor.

## Cómo funcionan las preferencias

Los gerentes pueden fijar, para cada empleado:

- hasta tres días preferidos y franjas horarias preferidas
- un límite de horas a la semana
- un tope de turnos en una franja horaria, por ejemplo "como máximo dos turnos de noche a la semana"
- los horarios en que no puede trabajar
- compañeros con quienes trabajar, de quienes separarlo o con quienes nunca coincidir (personas que comparten ubicación)

Activa las solicitudes de preferencias en la Configuración de la empresa y tus empleados podrán enviarte sus preferencias para que las apruebes. Las solicitudes vienen desactivadas, y un gerente aprueba cada una y decide cuánto pesa:

- **Firme.** El empleado no se considera para un turno que la rompa. Si nadie más reúne los requisitos, el turno queda abierto en lugar de forzarse sobre alguien.
- **Flexible.** El empleado pasa a ser una opción menos probable. Si aun así recibe el turno, queda marcado con un asterisco, así que ves cada concesión.

La generación normal y la generación con AI funcionan igual. En cada generación, los roles, la disponibilidad, los límites de horas semanales, el descanso mínimo (una vez que lo configuras) y las parejas que nunca coinciden son reglas, no sugerencias.

Por eso hay menos que corregir. Las preferencias ya están en el borrador, y los puntos donde no se pudieron cumplir quedan marcados. Sigues revisando la semana, pero partes de lo que pidió tu equipo.

La programación automática de Deputy está en los planes Core y Pro. Asigna los turnos por costo, por igualdad de horas o aprendiendo de tus horarios anteriores. Su documentación no menciona preferencias de turnos ni de compañeros.

## Precios

Deputy cobra por usuario, así que el precio crece con cada contratación. Wiz Scheduler cobra un solo precio base por empresa, con todas las ubicaciones incluidas.

<div data-pricing-table></div>

Pongamos {locations} ubicaciones con {employees} empleados cada una. En Deputy son {users} usuarios, si contamos un usuario por empleado. Lite sale a {deputyLiteTotal} al mes, pero no tiene programación automática. Core, el plan más barato de Deputy con programación automática, cuesta {deputyCoreTotal} al mes, y Pro {deputyProTotal}. Con Wiz Scheduler Pro, el mismo equipo paga {wizPro} al mes, más los créditos de AI que decida comprar.

Esos son los precios mensuales de Deputy. Con facturación anual, Lite cuesta {deputyLiteAnnual}, Core {deputyCoreAnnual} y Pro {deputyProAnnual} por usuario al mes. Los planes mensuales tienen un mínimo de {deputyMinimum} al mes, y Deputy no tiene plan gratuito.

Wiz Scheduler Pro incluye 500 empleados, 50 puestos de gerente y 25 generaciones de horario, con pequeños cargos por uso por encima de eso. La generación con AI no está incluida; se paga con paquetes de créditos prepagados. El plan gratuito cubre {wizFreeLocations} ubicaciones y {wizFreeEmployees} empleados, con un horario por ubicación al mes y sin generación con AI. Wiz Scheduler no tiene descuento anual.

## Dónde Deputy es más fuerte

- **Fair Workweek de Nueva York.** Deputy tiene el soporte de Fair Workweek de Nueva York más completo de las herramientas que comparamos, con consentimiento para los cambios, pago de primas, avisos con antelación y descansos. Wiz Scheduler solo aplica el descanso entre turnos, una vez que lo configuras.
- **Asignación por costo o según tu historial.** Deputy puede asignar los turnos por costo, por igualdad de horas o aprendiendo de tus horarios anteriores. Wiz Scheduler no aprende de los horarios anteriores.
- **Un descuento anual.** Los planes anuales de Deputy cuestan menos por usuario. Wiz Scheduler no tiene descuento anual.

Si esas son las razones por las que usas Deputy, es muy posible que siga siendo la mejor opción para ti.

## Fair Workweek, con honestidad

El soporte de Fair Workweek de Wiz Scheduler es una sola regla: un descanso mínimo entre turnos. Fíjalo en una ubicación, por ejemplo 11 horas, y ningún horario generado lo romperá. Está desactivado hasta que lo configuras. Wiz Scheduler no controla los avisos con antelación, el pago de primas ni los cambios de horario.

Deputy tiene el soporte de Fair Workweek de Nueva York más completo de las herramientas que comparamos. Su propia documentación indica que las reglas de comida rápida de Nueva York se aplican a cadenas con 30 o más ubicaciones en todo el país, y las de comercio minorista a empleadores con 20 o más empleados. Si tu negocio está cubierto, Deputy hace más en esto que Wiz Scheduler, y 7shifts también. Consulta la [página de Fair Workweek de Nueva York](/es/nyc-fair-workweek-scheduling) para ver qué cubre Wiz Scheduler. El [verificador de horarios gratuito](/es/free-schedule-checker) busca descansos cortos y turnos dentro del plazo de aviso de 14 días en un horario que subes; es una herramienta aparte, no forma parte de la programación.

## Cambiar desde Deputy

El importador de Deputy está en el plan de pago. Se conecta con un token de API que copias de tu cuenta de Deputy y pegas en Wiz Scheduler.

1. Regístrate gratis y confirma tu correo.
2. Pasa al plan Pro.
3. Abre Importar, elige Deputy y pega tu token de API. Trae ubicaciones, roles y empleados con su correo. La no disponibilidad de Deputy llega como horarios en que el empleado no puede trabajar.
4. Revisa roles y habilidades. Cada empleado importado recibe todos los roles de su ubicación con nivel de habilidad 1, así que ajusta los roles y los niveles de habilidad de cada empleado antes de generar.
5. Haz la importación de disponibilidad aparte.
6. Agrega tú mismo las preferencias y las relaciones entre compañeros, o activa las solicitudes de preferencias en la Configuración de la empresa para que los empleados envíen las suyas. Las preferencias y las relaciones entre compañeros no se importan.
7. Genera tu primera semana.
