---
title: "Precios de 7shifts frente a una alternativa fija de {wizPro}"
description: "Los precios de 7shifts para cada plan y tamaño de equipo, junto a Wiz Scheduler: el horario en el que tu equipo tuvo voz, por {wizPro} al mes para todas las ubicaciones."
qualifier: "Los gerentes pueden ingresar las preferencias de todos. Los empleados pueden enviar las suyas cuando se activan las solicitudes de preferencias en la Configuración de la empresa."
competitor: "7shifts"
competitorUrl: "https://www.7shifts.com/pricing/"
checkedOn: "2026-11-04"
calculator: true
toolId: "7shifts"
faq:
  - q: "¿Cuánto cuesta 7shifts?"
    a: "7shifts cobra por ubicación al mes, y el plan depende de los empleados por ubicación. Comp es gratis para una ubicación con hasta {compMaxEmployees} empleados. Con 1 a {essentialsMaxEmployees} empleados por ubicación, Essentials cuesta {essentials} y Premium {premium}. Con {proMinEmployees} o más, Pro cuesta {pro} (hasta {proMaxEmployees} empleados) y Premium {premiumLarge}. La facturación anual tiene un 10% de descuento. Son precios de lista de la propia página de precios de 7shifts."
  - q: "¿Qué plan de 7shifts le corresponde a mi equipo?"
    a: "Depende de cuántos empleados tenga cada ubicación, no del total de la empresa. {locations} ubicaciones con {employees} empleados cada una caben en Essentials, {sevenShiftsExampleTotal} al mes en total, o en Premium. Esas mismas {locations} ubicaciones con {proMinEmployees} a {proMaxEmployees} empleados cada una estarían en Pro, por {sevenShiftsProTotal} al mes. Wiz Scheduler Pro cuesta {wizPro} al mes para todas las ubicaciones en ambos casos."
  - q: "¿Cómo envían sus preferencias los empleados?"
    a: "Los gerentes pueden ingresar las preferencias de todos. Activa las solicitudes de preferencias en la Configuración de la empresa y tus empleados podrán enviarte sus preferencias para que las apruebes. Un gerente aprueba cada solicitud y decide cuánto pesa. Las solicitudes de preferencias vienen desactivadas."
  - q: "¿Tendré que seguir corrigiendo el horario?"
    a: "A veces, sí. Wiz Scheduler reduce las correcciones; no las elimina. Las preferencias ya están en el borrador, cada turno que va contra una queda marcado, y un turno que nadie puede tomar sin romper una regla firme queda abierto en lugar de forzarse. Revisas la semana partiendo de lo que pidió tu equipo."
  - q: "¿Wiz Scheduler cuesta menos que 7shifts?"
    a: "Wiz Scheduler Pro cuesta {wizPro} al mes para todas tus ubicaciones, con 500 empleados incluidos y {wizExtra500} al mes por cada 500 adicionales. La generación con AI no está incluida: se paga con créditos prepagados si la usas. 7shifts cobra por ubicación, desde {essentials} por ubicación al mes en Essentials. Usa la calculadora de esta página para tu propio equipo."
  - q: "¿Basta Wiz Scheduler para Fair Workweek de Nueva York?"
    a: "Solo para la regla de descanso. Wiz Scheduler aplica un descanso mínimo entre turnos, que se fija por ubicación y está desactivado hasta que lo configuras. No controla los avisos con antelación ni el pago de primas. 7shifts avisa de clopenings, de cambios con menos de 14 días y de primas en sus planes de pago, y Deputy tiene el soporte más completo de las herramientas que comparamos."
  - q: "¿Puedo traer mis datos desde 7shifts?"
    a: "En el plan de pago, Wiz Scheduler importa desde 7shifts empresas, ubicaciones, departamentos, roles, empleados y sus asignaciones con un token de API de tu cuenta de 7shifts. Una importación aparte trae la disponibilidad semanal, la no disponibilidad y el tiempo libre aprobado. Las preferencias y las relaciones entre compañeros no se importan."
---

7shifts es una herramienta de horarios muy completa. Con ella, el gerente arma la semana, o su programador automático prepara un borrador a partir del historial de ventas y horarios, y el equipo trabaja con lo que sale. Wiz Scheduler parte de otro lugar: los días y horas preferidos de cada empleado, su límite de horas semanales y con quién trabaja bien o de quién conviene separarlo entran al generador, y la semana se construye a su alrededor.

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

El programador automático de 7shifts es una beta que se está habilitando para cuentas seleccionadas. Prepara el borrador a partir de al menos seis semanas de historial de ventas y horarios, y comprueba la disponibilidad. Su documentación no menciona preferencias de turnos ni de compañeros.

## Precios

7shifts cobra por ubicación, y el plan depende de cuántos empleados tenga cada ubicación. Wiz Scheduler cobra un solo precio base por empresa, con todas las ubicaciones incluidas.

<div data-pricing-table></div>

Pongamos {locations} ubicaciones con {employees} empleados cada una. Todas caben en 7shifts {sevenShiftsExamplePlan}, así que el total es {sevenShiftsExampleTotal} al mes. Si cada una de esas {locations} ubicaciones tuviera de {proMinEmployees} a {proMaxEmployees} empleados, estarían en 7shifts Pro, por {sevenShiftsProTotal} al mes. Con Wiz Scheduler Pro, los dos equipos pagan {wizPro} al mes, más los créditos de AI que decidan comprar.

Wiz Scheduler Pro incluye 500 empleados, 50 puestos de gerente y 25 generaciones de horario, con cargos medidos pequeños por encima de eso. La generación con AI no está incluida; se paga con paquetes de créditos prepagados. El plan gratuito cubre {wizFreeLocations} ubicaciones y {wizFreeEmployees} empleados, con un horario por ubicación al mes y sin generación con AI. 7shifts descuenta un 10% con facturación anual; Wiz Scheduler no tiene descuento anual.

## Dónde 7shifts es más fuerte

- **Alertas de Fair Workweek de Nueva York.** Los planes de pago de 7shifts avisan de clopenings, de cambios con menos de 14 días y de primas. Wiz Scheduler solo aplica el descanso entre turnos.
- **Nómina.** 7shifts vende un complemento de nómina. Wiz Scheduler no procesa nóminas ni reparte propinas.
- **Borradores a partir de las ventas.** El programador automático de 7shifts trabaja con tu historial de ventas y horarios. Wiz Scheduler no tiene integración con POS ni previsión de ventas.
- **Un plan gratuito para una ubicación pequeña.** 7shifts Comp es gratis para una ubicación con hasta {compMaxEmployees} empleados.

Si esas son las razones por las que usas 7shifts, es muy posible que siga siendo la mejor opción para ti.

## Fair Workweek, con honestidad

El soporte de Fair Workweek de Wiz Scheduler es una sola regla: un descanso mínimo entre turnos. Fíjalo en una ubicación, por ejemplo 11 horas, y ningún horario generado lo romperá. Está desactivado hasta que lo configuras. Wiz Scheduler no controla los avisos con antelación, el pago de primas ni los cambios de horario.

7shifts y Deputy hacen más en esto. 7shifts avisa de clopenings, de cambios con menos de 14 días y de primas en sus planes de pago, y Deputy tiene el soporte más completo de las herramientas que comparamos. Consulta la [página de Fair Workweek de Nueva York](/es/nyc-fair-workweek-scheduling) para ver qué cubre Wiz Scheduler. El [verificador de horarios gratuito](/es/free-schedule-checker) busca descansos cortos y turnos dentro del plazo de aviso de 14 días en un horario que subes; es una herramienta aparte, no forma parte de la programación.

## Cambiar desde 7shifts

El importador de 7shifts está en el plan de pago. Se conecta con un token de API que copias de tu cuenta de 7shifts y pegas en Wiz Scheduler.

1. Regístrate gratis y confirma tu correo.
2. Pasa al plan Pro.
3. Abre Importar, elige 7shifts y pega tu token de API. Trae empresas, ubicaciones, departamentos, roles, empleados y sus asignaciones.
4. Haz la importación de disponibilidad aparte para la disponibilidad semanal, la no disponibilidad y el tiempo libre aprobado.
5. Agrega tú mismo las preferencias y las relaciones entre compañeros, o activa las solicitudes de preferencias en la Configuración de la empresa para que los empleados envíen las suyas. Las preferencias y las relaciones entre compañeros no se importan.
6. Genera tu primera semana.
