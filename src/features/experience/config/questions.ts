import type { Question, QuestionOption } from "@/features/experience/types/question";

// Fuente: https://diagnostico-sng.netlify.app/ y script.js, consultados el 2026-09-28.
// Los values conservan data-v; las escalas conservan números. El asesor usa
// nombre, valor confirmado en el payload original (no el índice de la tarjeta).
const options = (entries: readonly (readonly [string, string, string?])[]): QuestionOption[] =>
  entries.map(([value, label, description]) => ({ value, label, description }));
const scale = { type: "scale", min: 1, max: 5, minLabel: "Poco importante", maxLabel: "Fundamental", required: true } as const;

export const questions: readonly Question[] = [
  {
    id: "project_documents", sceneId: "salida", order: 6, type: "textarea", required: false,
    text: "Cuéntanos qué necesita tu proyecto",
    description: "Comparte los detalles de tu proyecto y adjunta tus planos o documentos para que podamos orientarte.",
    placeholder: "Describe los espacios, las necesidades y cualquier detalle que quieras compartir con SNG.",
  },
  {
    id: "asesor", sceneId: "exterior", order: 1, type: "single-choice", required: true,
    text: "¿Quién es tu asesor en Steel and Glass?",
    description: "Selecciona la persona que te compartió este diagnóstico. Tus resultados llegarán directamente a ella.",
    options: options([
      ["Andrés Candela", "Andrés Candela", "Ejecutivo Comercial"],
      ["Valeria Álvarez", "Valeria Álvarez", "Ejecutivo Comercial"],
      ["Alejandra Del Río", "Alejandra Del Río", "Ejecutivo Comercial"],
      ["Julián Sierra", "Julián Sierra", "Ejecutivo Comercial"],
      ["Paula Chica", "Paula Chica", "Ejecutivo Comercial"],
      ["No sé / contacto directo", "No sé / contacto directo", "Equipo SNG"],
    ]),
  },
  { id: "nombre", sceneId: "exterior", order: 2, type: "text", required: true, text: "Tu nombre completo", placeholder: "Ej. Alejandra Martínez" },
  { id: "wa", sceneId: "exterior", order: 3, type: "tel", required: true, text: "Tu WhatsApp", placeholder: "Ej. 300 123 4567", description: "Te enviaremos un resumen de tu perfil de confort." },
  { id: "proyecto", sceneId: "exterior", order: 4, type: "text", required: true, text: "Nombre o descripción del proyecto", placeholder: "Ej. Casa Campestre La Palma / Apto Torre Nórdica" },
  { id: "parcelacion", sceneId: "exterior", order: 5, type: "text", required: false, text: "Parcelación / conjunto (si aplica)", placeholder: "Ej. Parcelación El Refugio" },
  { id: "lote", sceneId: "exterior", order: 6, type: "text", required: false, text: "Lote o apartamento (si aplica)", placeholder: "Ej. Lote 14 / Apto 502" },
  { id: "ciudad", sceneId: "exterior", order: 7, type: "text", required: true, text: "Municipio / ciudad", placeholder: "Ej. Bucaramanga" },
  {
    id: "tiempo", sceneId: "recibidor", order: 1, type: "single-choice", required: true,
    text: "¿En cuánto tiempo esperas tomar la decisión sobre la ventanería?",
    options: options([["30d", "En los próximos 30 días"], ["1-3m", "Entre 1 y 3 meses"], ["3-6m", "Entre 3 y 6 meses"], ["6-12m", "Entre 6 y 12 meses"], ["12m+", "Más de 12 meses"], ["nd", "Aún no lo tengo definido"]]),
  },
  {
    id: "ventana_ejecucion", sceneId: "recibidor", order: 2, type: "single-choice", required: true,
    text: "¿Para cuándo estimas que necesitarás tener instalada la ventanería?",
    description: "El desarrollo de cada proyecto SNG requiere planificación anticipada de ingeniería, materiales y capacidad de producción. Conocer este momento nos permite orientarte mejor sobre los tiempos necesarios.",
    options: options([["lt2m", "Menos de 2 meses"], ["2-4m", "2–4 meses"], ["4-6m", "4–6 meses"], ["6-9m", "6–9 meses"], ["9-12m", "9–12 meses"], ["gt12m", "Más de 12 meses"], ["nd", "Aún no está definido"]]),
  },
  {
    id: "tipo", sceneId: "recibidor", order: 3, type: "single-choice", required: true,
    text: "¿Qué tipo de proyecto estás desarrollando?",
    options: options([["apto", "Apartamento"], ["edificio", "Edificio / propiedad horizontal"], ["casa", "Casa en unidad residencial o parcelación"], ["hospedaje", "Hospedaje / renta corta"], ["comercial", "Comercial, institucional o corporativo"], ["otro", "Otro"]]),
  },
  {
    id: "tipo_otro", sceneId: "recibidor", order: 3.1, type: "text", required: false,
    // La fuente solo presenta placeholder; se reutiliza como etiqueta accesible.
    text: "Descríbelo brevemente", placeholder: "Descríbelo brevemente",
    condition: { questionId: "tipo", operator: "equals", value: "otro" },
    clearWhenHidden: true,
  },
  {
    id: "vanos_grandes", sceneId: "recibidor", order: 4, type: "single-choice", required: true,
    text: "¿Tu proyecto tiene vanos de más de 3 metros de altura?",
    description: "Los vanos de gran formato requieren soluciones con mayor rigidez estructural y tienen un impacto visual muy diferente según la solución elegida.",
    options: options([["si", "Sí"], ["no", "No"], ["ns", "No estoy seguro"]]),
  },
  {
    id: "area", sceneId: "recibidor", order: 5, type: "single-choice", required: true,
    text: "Área construida aproximada del proyecto",
    options: options([["lt100", "Menos de 100 m²"], ["100-300", "100 – 300 m²"], ["300-500", "300 – 500 m²"], ["gt500", "Más de 500 m²"], ["nc", "No la conozco"]]),
  },
  { ...scale, id: "acustico", sceneId: "habitacion", order: 1, text: "Silencio y confort acústico" },
  {
    id: "motivo_acustico", sceneId: "habitacion", order: 2, type: "multi-choice", required: true,
    text: "¿Qué tipo de ruido te gustaría sentir menos dentro del proyecto?",
    condition: { questionId: "acustico", operator: "at-least", value: 4 }, clearWhenHidden: true,
    options: options([["vecinos", "Vecinos y actividad cercana — música, reuniones, voces."], ["entorno", "Ruido del entorno — tráfico, lluvia, equipos o movimiento exterior."], ["interiores", "Ruido entre espacios interiores — sonidos entre habitaciones o zonas."]]),
  },
  { ...scale, id: "termico", sceneId: "habitacion", order: 3, text: "Confort térmico" },
  {
    id: "motivo_termico", sceneId: "habitacion", order: 4, type: "multi-choice", required: true,
    text: "¿Qué quisieras mejorar en la sensación térmica de tus espacios?",
    condition: { questionId: "termico", operator: "at-least", value: 4 }, clearWhenHidden: true,
    options: options([["calidos", "Sentirlos más cálidos — evitar sensación de frío."], ["frescos", "Evitar exceso de calor — mantener los espacios más frescos."], ["estable", "Sentir una temperatura más estable — menos cambios o corrientes."]]),
  },
  { ...scale, id: "seguridad", sceneId: "habitacion", order: 5, text: "Seguridad" },
  {
    id: "motivo_seguridad", sceneId: "habitacion", order: 6, type: "multi-choice", required: true,
    text: "Cuando piensas en seguridad, ¿qué te daría mayor tranquilidad?",
    condition: { questionId: "seguridad", operator: "at-least", value: 4 }, clearWhenHidden: true,
    options: options([["sola", "Sentir la vivienda protegida cuando queda sola."], ["accesos", "Mayor control en puertas, accesos y grandes aperturas."], ["habitantes", "Mayor tranquilidad para quienes habitan la casa — niños, adultos mayores o mascotas."]]),
  },
  { ...scale, id: "estetica", sceneId: "diseno", order: 1, text: "Estética y diseño" },
  {
    id: "motivo_estetica", sceneId: "diseno", order: 2, type: "single-choice", required: true,
    text: "¿Qué papel quieres que tenga la ventanería dentro de la arquitectura?",
    condition: { questionId: "estetica", operator: "at-least", value: 4 }, clearWhenHidden: true,
    options: options([["desaparece", "Que casi desaparezca — paisaje, luz y transparencia como protagonistas."], ["integrada", "Que se integre discretamente — acompañar la arquitectura sin competir con ella."], ["protagonismo", "Que tenga protagonismo — formas, acabados o elementos especiales como parte de la identidad."]]),
  },
  {
    id: "preferencia_acabado", sceneId: "diseno", order: 3, type: "single-choice", required: true,
    text: "¿Tienes alguna preferencia definida para el acabado de los perfiles?",
    options: options([["negro", "Negro"], ["blanco_gris", "Blanco / gris / metálico"], ["madera_esp", "Madera o acabado especial"], ["con_sng", "Prefiero definirlo con SNG"]]),
  },
  { ...scale, id: "funcionalidad", sceneId: "diseno", order: 4, text: "Facilidad y experiencia de uso" },
  {
    id: "motivo_funcionalidad", sceneId: "diseno", order: 5, type: "multi-choice", required: true,
    text: "¿Qué debería sentirse especialmente fácil en el uso diario?",
    condition: { questionId: "funcionalidad", operator: "at-least", value: 4 }, clearWhenHidden: true,
    options: options([["abrir", "Abrir y cerrar con comodidad — especialmente grandes aperturas."], ["ventilar", "Conectar y ventilar fácilmente — terrazas, jardines y renovación de aire."], ["mantener", "Mantener la ventanería con facilidad — limpieza y mantenimiento cotidiano."]]),
  },
  {
    id: "uv", sceneId: "diseno", order: 6, type: "single-choice", required: true,
    text: "¿Es importante para ti contar con protección UV?",
    description: "Protege materiales, tapicería y bienestar de quienes habitan el espacio.",
    options: options([["si", "Sí, es importante"], ["no", "No es prioridad"], ["ns", "No estoy seguro"]]),
  },
  {
    id: "habitantes", sceneId: "sala", order: 1, type: "multi-choice", required: true,
    text: "¿Quiénes utilizarán habitualmente estos espacios?", description: "Selecciona todas las que apliquen.",
    options: [...options([["ninos", "Niños"], ["adultos_may", "Adultos mayores"], ["movilidad", "Personas con movilidad reducida o discapacidad"], ["mascotas", "Mascotas"], ["huespedes", "Huéspedes frecuentes"], ["servicio", "Personal de servicio"]]), { value: "ninguno", label: "Ninguna condición particular", exclusive: true }],
  },
  {
    id: "problemas_prev", sceneId: "sala", order: 2, type: "textarea", required: false,
    text: "Pensando en espacios o ventanas que hayas vivido anteriormente…",
    description: "¿Hay algo que no quisieras volver a vivir o algo que sí quisieras conservar en este proyecto? (opcional)",
    placeholder: "Ruido, frío o calor, filtraciones, dificultad para abrir, mantenimiento, sensación de inseguridad… o una experiencia de luz, silencio o apertura que sí quisieras repetir.",
  },
  {
    id: "zona_social", sceneId: "sala", order: 3, type: "single-choice", required: true,
    text: "Cuando la zona social se relaciona con el exterior, ¿cómo te gustaría vivirla?",
    options: options([["muy_abierta", "Muy abierta", "Integrar interior y exterior siempre que sea posible."], ["equilibrada", "Equilibrada", "Gran apertura cuando quiera utilizarla y confort/protección al cerrarla."], ["visual", "Más visual", "Priorizar paisaje y luz, aunque la apertura no sea protagonista."], ["nd", "Aún no está definido / No aplica en este proyecto"]]),
  },
  {
    id: "momento_especial", sceneId: "sala", order: 4, type: "textarea", required: false,
    text: "¿Hay algún espacio, vista o elemento del proyecto que sea especialmente importante para ti? (opcional)",
    description: "Puede ser la zona social, la suite, un cine, una terraza, una vista especial, un patio, el acceso o algún elemento particular de la arquitectura. Cuéntanos también qué quisieras sentir, conservar o lograr especialmente allí.",
    placeholder: "Ej. La terraza es el lugar donde queremos pasar la mayor parte del día. / El cine debe aislarse del resto de la vivienda.",
  },
  {
    id: "descanso_prioridades", sceneId: "sala", order: 5, type: "multi-choice", required: true,
    text: "En tus espacios de descanso, ¿qué debería sentirse especialmente cuidado?", description: "Selecciona todas las que apliquen.",
    options: [...options([["silencio", "Silencio y tranquilidad"], ["temperatura", "Temperatura y confort"], ["privacidad", "Privacidad y sensación de refugio"]]), { value: "nd", label: "No aplica en este proyecto", exclusive: true }],
  },
  {
    id: "criterio", sceneId: "salida", order: 1, type: "multi-choice", required: true, maxSelections: 2,
    text: "Al momento de elegir la solución, ¿qué será más importante para ti?", description: "Selecciona máximo dos opciones.",
    options: options([["precio", "Inversión / precio"], ["calidad", "Calidad y durabilidad"], ["confort", "Confort y desempeño"], ["seguridad", "Seguridad"], ["disenio", "Diseño y acabados"], ["respaldo", "Respaldo y acompañamiento"]]),
  },
  {
    id: "decisor", sceneId: "salida", order: 2, type: "multi-choice", required: false,
    text: "¿Quién participará en la decisión final?",
    options: options([["propietario", "Propietario"], ["arquitecto", "Arquitecto / diseñador"], ["constructor", "Constructor"], ["conjunta", "Decisión conjunta"], ["otra", "Otra persona"]]),
  },
  {
    id: "acceso_decisor", sceneId: "salida", order: 3, type: "single-choice", required: true,
    text: "¿Podremos reunirnos con quien toma la decisión final?",
    description: "Para recomendarte correctamente una solución, es importante conocer las necesidades de quienes participan en la decisión.",
    options: options([["si", "Sí"], ["no", "No"], ["ns", "Aún no lo sé"]]),
  },
  {
    id: "sig_paso", sceneId: "salida", order: 4, type: "single-choice", required: true,
    text: "¿Cómo puedes vivir la Experiencia SNG?",
    options: options([["centro_exp", "Visitar el Centro de Experiencia SNG", "Quiero conocer, experimentar y comparar personalmente las soluciones."], ["reunion_virt", "Estoy fuera de la ciudad o del país y prefiero una reunión virtual atendida desde el Centro de Experiencia SNG", "Nuestro equipo me mostrará las soluciones en vivo durante la reunión."], ["no_dispuesto", "Por ahora no estoy dispuesto a realizar ninguna de estas opciones"]]),
  },
  {
    id: "origen", sceneId: "salida", order: 5, type: "single-choice", required: true,
    text: "¿Cómo llegaste a SNG?",
    options: options([["referido", "Referido"], ["visita_obra", "Visita de nuestro equipo en obra"], ["contacto_asesor", "Contacto / llamada de un asesor"], ["redes", "Redes sociales"], ["arquitecto", "Arquitecto / diseñador"], ["cliente_ant", "Ya he trabajado con SNG"], ["otro", "Otro"]]),
  },
  {
    id: "origen_otro", sceneId: "salida", order: 5.1, type: "text", required: false,
    text: "¿De dónde?", placeholder: "¿De dónde?",
    condition: { questionId: "origen", operator: "equals", value: "otro" },
    clearWhenHidden: true,
  },
];
