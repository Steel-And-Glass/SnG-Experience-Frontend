import "server-only";
import { MockCalendarProvider } from "./mock-calendar-provider";
import { SchedulingError } from "./scheduling-policy";
import type { CalendarProvider } from "./calendar-provider";
// Shared within one process only, including both Route Handlers in local dev.
const runtime = globalThis as typeof globalThis & { schedulingMock?: MockCalendarProvider };
export function getCalendarProvider(): CalendarProvider {
  if (process.env.NODE_ENV === "production" || (process.env.SCHEDULING_PROVIDER && process.env.SCHEDULING_PROVIDER !== "mock")) {
    throw new SchedulingError("scheduling_not_configured", 503);
  }
  return runtime.schedulingMock ??= new MockCalendarProvider();
}
