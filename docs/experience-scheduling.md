# Experience scheduling — Fase 1

Selección de agenda ANTES del envío; creación de reserva solo DESPUÉS de un envío aceptado. No cambia el contrato de submission,
los documentos, la fotografía ni las seis escenas. No necesita Google ni un repo nuevo.

## Flujo actual y gate

Desde documentos, “Continuar al agendamiento” abre el calendario sin llamar al Cotizador.
Se mantiene la modalidad elegida en la pregunta existente:

- `centro_exp` → `IN_PERSON`.
- `reunion_virt` → `VIRTUAL`.
- `no_dispuesto` o desconocido → sin agenda; se conserva el envío directo.

En agenda se confirma/cambia la asesora o asesor usando el mapping existente. La selección
actualiza la respuesta `asesor`, por lo que `client.advisorCode` y `advisorDisplayName`
del payload siguen siendo coherentes, sin campos nuevos. DIRECT_CONTACT no representa una
persona agendable: se solicita seleccionar una. Cambiar asesor limpia fecha/hora y consulta
su disponibilidad. La selección queda en ExperienceFlow junto con answers, projectFiles e
ideaPhoto; volver al formulario no la borra. No existe persistencia tras refrescar la página.

“Confirmar proyecto y solicitar reunión” ejecuta dos operaciones en orden:

1. Construye/reutiliza el draft y envía el proyecto. `submitExperience` comprueba status
   `RECEIVED` e igualdad de `submissionId`.
2. Solo con ese ID aceptado llama POST bookings, donde el proveedor revalida el slot.

La respuesta actual no contiene un projectId ni un eventId real: se conserva submissionId.
El ID recibido se guarda también en un ref: los siguientes intentos devuelven ese ID sin
volver a llamar al Cotizador. Mientras está pendiente la confirmación no se desmonta la
agenda al pasar de PLANNING a SUCCESS. El selector de asesor queda bloqueado al preparar
el draft para evitar cambiar el destinatario de un envío incierto; se puede volver a editar
explícitamente antes de recibirlo. Tras RECEIVED no se permite editar/recrear ese proyecto.

Antes del envío, la acción secundaria es “Enviar proyecto y agendar más tarde”: registra
el proyecto y cierra solo si fue aceptado. Después de RECEIVED, “Agendar más tarde” muestra
el cierre normal sin otro envío ni cambio de sig_paso. Un error de proyecto conserva todos
los datos y no llama a bookings. Un error de agenda conserva el estado PROJECT RECEIVED.

Reintentos de red reutilizan draft/submissionId y bookingRequestId. Tras un resultado de
booking incierto se bloquea cambiar horario hasta reintentar la misma solicitud; un 409
limpia el slot y recarga disponibilidad. La idempotencia persistente del Cotizador debe
estar implementada por su backend; este repositorio solo puede reutilizar el ID estable.
La idempotencia del mock vale únicamente dentro de un proceso, nunca entre reinicios.

## Capas

- `features/experience/scheduling`: contratos públicos, política provisional compartida,
  mapping, cliente HTTP y calendario pequeño sin dependencia externa.
- `server/scheduling`: validación, servicios, `CalendarProvider`, mock y selección segura
  de proveedor. Los módulos llevan `server-only`.
- `app/api/scheduling`: Route Handlers públicos, errores estables, `Cache-Control: no-store`.

## Política PROVISIONAL

TODO: Replace with verified Steel & Glass scheduling policy.

Centralizada en `config/scheduling.ts`: America/Bogota, lunes a viernes, 09:00–17:00,
sesiones de 60 minutos, buffer 0, anticipación mínima 24 horas y horizonte de 30 días
calendario (hasta el día local hoy + 30, incluido). ISO de fecha `YYYY-MM-DD`; slots
con offset explícito `-05:00`. Cálculo de días en UTC y presentación en America/Bogota,
independientes de la zona del navegador/servidor. El offset fijo corresponde a Bogotá;
otra zona requerirá revisar el generador antes de cambiar la configuración.

## API

`GET /api/scheduling/availability?mode=IN_PERSON&advisorCode=DIRECT_CONTACT&from=2026-11-03&to=2026-11-09`

Respuesta: `{ timezone: "America/Bogota", mock: true, dates: [{ date, slots: [{ startsAt, endsAt }] }] }`.
Los días sin disponibilidad se incluyen con `slots: []`. Se validan fechas reales,
orden, ventana máxima, modalidad y código de asesor conocido. Un rango que incluya
hoy puede contener días sin slots por la anticipación mínima; nunca ofrece horarios pasados.

`POST /api/scheduling/bookings` con JSON:

```json
{
  "submissionId": "11111111-1111-4111-8111-111111111111",
  "bookingRequestId": "22222222-2222-4222-8222-222222222222",
  "mode": "IN_PERSON",
  "advisorCode": "DIRECT_CONTACT",
  "startsAt": "2026-11-03T10:00:00-05:00"
}
```

Valida UUIDs, asesor, modalidad, fecha/hora exactas, día laboral, ventana y notice.
El proveedor reconsulta disponibilidad antes de reservar y comprueba ocupación otra
vez tras el await, antes de escribir en memoria. Devuelve 201 con `bookingId`,
`status: CONFIRMED`, modalidad, inicio, fin, timezone, `meetingUrl: null`, `mock: true`.

Errores: 400 `invalid_request`, 409 `slot_unavailable` o `idempotency_conflict`,
503 `scheduling_not_configured` o `scheduling_unavailable`. No expone stacks.
TODO: rate limiting compartido para endpoints públicos en Fase 2.

**Límite de confianza:** el frontend garantiza que POST bookings ocurre después de RECEIVED; GET disponibilidad puede precederlo. El mock
solo valida la sintaxis del submissionId; no puede verificar su existencia o titularidad
en el Cotizador. Antes de habilitar un proveedor real se requiere verificación server-side
de un recibo/token confiable que vincule submission, asesor y modalidad. No se afirma que
un UUID válido por sí solo autorice una reserva. Los endpoints están bloqueados en producción.

## Mock, conflictos e idempotencia

`MockCalendarProvider` recibe un reloj explícito; no utiliza Math.random. Misma consulta,
mismo reloj y mismo estado producen idénticos slots. Fixtures: fines de semana y día 15
cerrados, 12:00 ocupado. `occupy(advisorCode, startsAt)` permite simular que otro proceso
toma un slot entre GET y POST. Ambas modalidades comparten el calendario del asesor.

El cliente mantiene un bookingRequestId en reintentos de la misma selección. El mock
reproduce el resultado ya guardado para el mismo ID e input; input distinto da 409.
La creación comprueba nuevamente ocupación de forma síncrona para evitar duplicados
concurrentes dentro del mismo proceso. Conflicto en UI limpia slot y recarga disponibilidad,
conservando fecha si aún tiene horarios. Error general conserva selección e ID.

Mock booking is development-only and not production persistence.

Estado compartido únicamente en memoria del proceso local: se pierde al reiniciar y
no se comparte entre instancias Vercel. Idempotencia duradera, autorización y exclusión
mutua distribuida quedan pendientes; no usar este mock para citas reales.

## Configuración y producción

`SCHEDULING_PROVIDER=mock` es server-side y opcional en desarrollo/test. Un valor
desconocido, incluido `google`, devuelve 503. Con `NODE_ENV=production` siempre devuelve
503, incluso si se configura mock explícitamente. `next build` funciona, pero `next start`
no confirma citas. Para probar la simulación usar `pnpm dev`.

La UI muestra aviso de reserva simulada y repite ese aviso en confirmación. No muestra
URL falsa, dirección inventada ni Google Meet. En producción permite cerrar normalmente
o “Agendar más tarde” sin perder la confirmación del proyecto.

## UI y accesibilidad

Selector de asesor, mes actual y siguiente dentro del horizonte, días deshabilitados según slots, selección
de fecha y hora, resumen de modalidad/fecha/hora, confirmación y cierre dedicado. Estados
LOADING/READY/EMPTY/ERROR y retry. Protección de doble click mediante ref y estado busy.
Botones reales, Tab/Enter/Espacio, focus visible, aria-pressed, alert/status y foco en el
título final. Selección marcada también con subrayado y peso. Grid de siete columnas
fluido: altura táctil mínima 44px; en 320px el ancho de día se reduce para evitar overflow.
Tablet/desktop conservan el ancho máximo del cierre existente. No modifica responsive de escenas.

## Validación

Sin framework nuevo. Runner Node existente:

`node --test --experimental-test-isolation=none tests/public-experience-submission.test.cjs tests/experience-scheduling.test.cjs`

Cubre mapping, acceso a agenda antes del envío, orden registro→booking y handlers reales, contratos, política, timezone,
slots ocupados, revalidación, concurrencia, idempotencia, HTTP 409/503, producción y
transporte cliente. UI interactiva pendiente de comprobación en navegador disponible.

## Fase 2 — pendiente, no implementada

- GoogleCalendarProvider real, OAuth y credenciales server-side: GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_CALENDAR_ID (ninguna NEXT_PUBLIC).
- freeBusy, events.insert y Google Meet.
- Mapping de emails de asesores; dirección real del Centro de Experiencia S&G.
- Horarios, buffers, capacidad y duración verificados por negocio.
- Recibo confiable del submission, autorización, persistencia, idempotencia duradera,
  concurrencia distribuida, rate limiting y política de reprogramación/cancelación.

No se instaló SDK de Google ni se modificó Cotizador_Backend, AI2 o SnGConsulter.

## Dependencias externas de la reorganización

La auditoría confirma que **no existen Google Calendar ni envío de correo funcionales**.
Solo el mock existente está disponible en desarrollo; producción conserva 503. No se
introducen éxitos simulados en producción. El flujo real completo requiere implementar
el proveedor y la autorización server-side indicada arriba, asociar de forma durable
submissionId/eventId y gestionar notificaciones independientemente del registro y del
evento. Un fallo de correo deberá reintentar únicamente la notificación, sin recrear el
proyecto ni el evento. No se inventó un estado “correo enviado” ni se añadieron endpoints
de notificación ficticios. Sin esas integraciones no se afirma que exista una cita real.
