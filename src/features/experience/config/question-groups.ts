import type { QuestionGroup } from "@/features/experience/types/question-group";

export const questionGroups: readonly QuestionGroup[] = [
  { id: "client-contact", sceneId: "exterior", order: 1, questionIds: ["asesor", "nombre", "wa"] },
  { id: "project-identity", sceneId: "exterior", order: 2, questionIds: ["proyecto", "parcelacion", "lote", "ciudad"] },
  { id: "project-timing", sceneId: "recibidor", order: 1, questionIds: ["tiempo", "ventana_ejecucion"] },
  { id: "project-type", sceneId: "recibidor", order: 2, questionIds: ["tipo", "tipo_otro"] },
  { id: "project-dimensions", sceneId: "recibidor", order: 3, questionIds: ["vanos_grandes", "area"] },
  { id: "acoustic-comfort", sceneId: "habitacion", order: 1, questionIds: ["acustico", "motivo_acustico"] },
  { id: "thermal-comfort", sceneId: "habitacion", order: 2, questionIds: ["termico", "motivo_termico"] },
  { id: "security", sceneId: "habitacion", order: 3, questionIds: ["seguridad", "motivo_seguridad"] },
  { id: "architectural-design", sceneId: "diseno", order: 1, questionIds: ["estetica", "motivo_estetica"] },
  { id: "finish-protection", sceneId: "diseno", order: 2, questionIds: ["preferencia_acabado", "uv"] },
  { id: "daily-use", sceneId: "diseno", order: 3, questionIds: ["funcionalidad", "motivo_funcionalidad"] },
  { id: "inhabitants", sceneId: "sala", order: 1, questionIds: ["habitantes"] },
  { id: "previous-experience", sceneId: "sala", order: 2, questionIds: ["problemas_prev"] },
  { id: "living-spaces", sceneId: "sala", order: 3, questionIds: ["zona_social", "momento_especial", "descanso_prioridades"] },
  { id: "decision-priorities", sceneId: "salida", order: 1, questionIds: ["criterio"] },
  { id: "decision-participants", sceneId: "salida", order: 2, questionIds: ["decisor", "acceso_decisor"] },
  { id: "next-experience", sceneId: "salida", order: 3, questionIds: ["sig_paso", "origen", "origen_otro"] },
  { id: "project-documents", sceneId: "salida", order: 4, questionIds: ["project_documents"] },
];
