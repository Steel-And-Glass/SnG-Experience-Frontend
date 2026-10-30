import "server-only";
import { SchedulingError } from "./scheduling-policy";
export function schedulingResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
export function schedulingFailure(error: unknown) {
  return error instanceof SchedulingError ? schedulingResponse({ error: error.code }, error.status)
    : schedulingResponse({ error: "scheduling_unavailable" }, 503);
}
// TODO Phase 2: shared public endpoint rate limiting and trusted submission authorization.
