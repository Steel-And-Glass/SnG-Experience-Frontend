# Contrato público de Experience v1

Frontera de esta fase: `answers + File[] → buildExperienceSubmission → ExperienceSubmissionDraft`.
No hay envío, almacenamiento, autenticación ni conexión al Cotizador. El builder todavía no está conectado al botón/tarjeta final.

## Identidad y estructura

`PUBLIC_EXPERIENCE_SCHEMA_VERSION = "sng-public-experience-v1"` identifica este cuestionario público.
No es `sng-experience-v4-001`, que corresponde al segundo cuestionario interno del Cotizador.
`EXPERIENCE_SUBMISSION_SOURCE = "SNG_WEB"` es una fuente técnica, distinta de `answers.origen` (por ejemplo, `redes`).

Tipos exportados en `src/features/experience/submission/experience-submission.ts`:

```ts
interface ExperienceSubmissionFile {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}
interface ExperienceSubmission {
  submissionId: string;
  schemaVersion: "sng-public-experience-v1";
  source: "SNG_WEB";
  client: {
    fullName: string;
    whatsapp: string;
    advisorCode: string;
    advisorDisplayName: string;
  };
  project: {
    name: string;
    city: string;
    subdivision?: string;
    lotOrApartment?: string;
    notes?: string;
  };
  answers: Record<string, string | number | string[]>;
  files: ExperienceSubmissionFile[];
}
interface ExperienceSubmissionDraft {
  payload: ExperienceSubmission;
  files: readonly File[];
}
```

## Construcción y validación

```ts
import { createExperienceSubmissionId } from "../src/features/experience/submission/experience-submission";
import { buildExperienceSubmission } from "../src/features/experience/submission/build-experience-submission";

// Una vez por envío lógico, no durante cada render ni cada retry.
const submissionId = createExperienceSubmissionId();
const draft = buildExperienceSubmission({ submissionId, answers, files });
const json = JSON.stringify(draft.payload);
// draft.files conserva los File originales, separados del JSON. No se envía nada aquí.
```

El builder es puro: recibe `submissionId: string`, `answers: Answers` y `files: readonly File[]`; retorna `ExperienceSubmissionDraft`.
No genera IDs, no lee el contenido de archivos, no llama a red ni a almacenamiento y no modifica sus entradas.
Lanza `ExperienceSubmissionError`, con `field` y `message`, ante un ID vacío, respuestas visibles inválidas, campos de identidad ausentes, asesor desconocido o archivos inválidos.
No exige sintaxis UUID al ID recibido, pero el generador público utiliza `crypto.randomUUID()` y lanza un error si no está disponible en un contexto seguro. Nunca usa `Math.random()`.

El propietario del futuro flujo de envío debe conservar el mismo ID **y el mismo draft** durante reintentos del mismo envío lógico. Un envío nuevo obtiene otro ID. No regenerar el ID dentro de un retry; el backend deberá implementar la idempotencia.

## Client, project y answers

Son campos de conveniencia del contrato público, no entidades del backend:

| Respuesta | Campo |
| --- | --- |
| nombre | client.fullName |
| wa | client.whatsapp |
| asesor | client.advisorCode + client.advisorDisplayName |
| proyecto | project.name |
| ciudad | project.city |
| parcelacion | project.subdivision |
| lote | project.lotOrApartment |
| project_documents | project.notes |

Los textos de conveniencia se recortan en los extremos; los opcionales vacíos se omiten.
`answers` conserva los IDs y valores originales válidos (incluyendo espacios en textos no vacíos); no convierte escalas ni opciones a categorías del backend.
Se recorre únicamente `questions.ts`, reutilizando `isQuestionVisible` e `isAnswerValid`. Se excluyen IDs desconocidos, respuestas ocultas y opcionales vacías. Una respuesta visible inválida, incluso opcional si tiene contenido, impide construir el draft.
Los arrays se copian para que cambios posteriores en las respuestas no alteren el snapshot. `origen_otro` tiene `clearWhenHidden: true` y también se filtra en el builder.

## Advisor codes

| Value actual / advisorDisplayName | advisorCode |
| --- | --- |
| Andrés Candela | ANDRES_CANDELA |
| Valeria Álvarez | VALERIA_ALVAREZ |
| Alejandra Del Río | ALEJANDRA_DEL_RIO |
| Julián Sierra | JULIAN_SIERRA |
| Paula Chica | PAULA_CHICA |
| No sé / contacto directo | DIRECT_CONTACT |

Un asesor desconocido produce error: nunca se deriva un código del nombre automáticamente. Al añadir asesores hay que actualizar configuración y mapping explícito.

## File policy

Única fuente: `src/features/experience/submission/file-policy.ts`, utilizada por UI y builder.

- Máximo 5 archivos, 20 × 1024 × 1024 bytes por archivo y 100 × 1024 × 1024 bytes en total.
- Se rechazan archivos vacíos, extensiones no admitidas y tamaños inválidos. Las extensiones no distinguen mayúsculas.
- `accept`: `.pdf,.xlsx,.png,.jpg,.jpeg`.
- No se admiten DWG, DXF, IFC, RVT, DOC, DOCX, XLS ni ZIP.

| Extensión | contentType canónico |
| --- | --- |
| .pdf | application/pdf |
| .xlsx | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet |
| .png | image/png |
| .jpg / .jpeg | image/jpeg |

Se usa el MIME canónico según extensión, incluso cuando `File.type` viene vacío o es genérico. Esto es metadata declarada, **no una prueba del contenido**.
La validación frontend es UX; el backend será la autoridad final de seguridad y deberá validar contenido, tamaño y formato. No hay inspección binaria ni base64.
El payload contiene solo nombre, MIME y tamaño; no contiene `File`, `Blob`, `lastModified` ni GUID por archivo.
El array separado conserva los mismos objetos File y el mismo orden que la metadata. La integración decidirá su transporte.

## Ejemplo JSON completo (datos ficticios)

```json
{
  "submissionId": "11111111-1111-4111-8111-111111111111",
  "schemaVersion": "sng-public-experience-v1",
  "source": "SNG_WEB",
  "client": {
    "fullName": "Cliente Demo",
    "whatsapp": "3001234567",
    "advisorCode": "ANDRES_CANDELA",
    "advisorDisplayName": "Andrés Candela"
  },
  "project": {
    "name": "Casa Demo",
    "city": "Bucaramanga",
    "subdivision": "Parcelación Demo",
    "lotOrApartment": "Lote 12",
    "notes": "Proyecto residencial con ventanería de gran formato."
  },
  "answers": {
    "asesor": "Andrés Candela",
    "nombre": "Cliente Demo",
    "wa": "3001234567",
    "proyecto": "Casa Demo",
    "ciudad": "Bucaramanga",
    "parcelacion": "Parcelación Demo",
    "lote": "Lote 12",
    "project_documents": "Proyecto residencial con ventanería de gran formato.",
    "tiempo": "1-3m",
    "ventana_ejecucion": "4-6m",
    "tipo": "casa",
    "vanos_grandes": "si",
    "area": "100-300",
    "acustico": 5,
    "motivo_acustico": ["vecinos"],
    "termico": 4,
    "motivo_termico": ["frescos"],
    "seguridad": 5,
    "motivo_seguridad": ["accesos"],
    "estetica": 4,
    "motivo_estetica": "integrada",
    "preferencia_acabado": "negro",
    "funcionalidad": 3,
    "uv": "si",
    "habitantes": ["ninguno"],
    "zona_social": "equilibrada",
    "descanso_prioridades": ["silencio"],
    "criterio": ["calidad", "confort"],
    "acceso_decisor": "si",
    "sig_paso": "centro_exp",
    "origen": "redes"
  },
  "files": [
    {
      "fileName": "plano-arquitectonico.pdf",
      "contentType": "application/pdf",
      "sizeBytes": 1234567
    }
  ]
}
```

## Fuera del contrato de Experience

Ximena y la integración/backend decidirán el transporte y el mapping interno del Cotizador: Client.Id, Project.Id, PreQuote.Id, Requirement.Id, CommercialLine, storageKey, AI2, procesamiento, TechnicalProposal, autenticación backend y persistencia.
Experience no infiere líneas comerciales ni crea estas entidades. No implementa endpoints, uploads remotos, R2 privado ni SnGConsulter. El cuestionario interno V4 permanece separado.

## Verificación

El proyecto no tiene runner de tests configurado; no se instala uno en esta fase. El builder está desacoplado de React y del navegador (salvo el generador UUID separado), por lo que puede probarse con inputs y archivos simulados, sin red.
