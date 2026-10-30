import "server-only";
import { ADVISOR_CODES } from "../../features/experience/submission/advisor-codes";
import { addDays, bogotaDate, schedulingPolicy } from "../../features/experience/scheduling/config/scheduling";
import type { AvailabilityInput, BookingInput } from "../../features/experience/scheduling/types/contracts";
export { schedulingPolicy };
export class SchedulingError extends Error {
  constructor(public code: string, public status: number) { super(code); }
}
function invalid(): never { throw new SchedulingError("invalid_request", 400); }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function common(value: Record<string, unknown>) {
  if (value.mode !== "IN_PERSON" && value.mode !== "VIRTUAL") invalid();
  if (typeof value.advisorCode !== "string" || !Object.values(ADVISOR_CODES).some(code => code === value.advisorCode)) invalid();
}
function dateOnly(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
export function validateAvailability(input: unknown, now: Date): AvailabilityInput {
  const value = record(input); common(value);
  if (!dateOnly(value.from) || !dateOnly(value.to)) invalid();
  const from = value.from as string, to = value.to as string;
  const today = bogotaDate(now);
  if (from > to || from < today || to > addDays(today, schedulingPolicy.maximumBookingDays)
    || (Date.parse(to) - Date.parse(from)) / 86400000 > schedulingPolicy.maximumBookingDays) invalid();
  return { mode: value.mode, advisorCode: value.advisorCode, from, to } as AvailabilityInput;
}
export function validateBooking(input: unknown, now: Date): BookingInput {
  const value = record(input); common(value);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (typeof value.submissionId !== "string" || !uuid.test(value.submissionId)
    || typeof value.bookingRequestId !== "string" || !uuid.test(value.bookingRequestId)
    || typeof value.startsAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:00:00-05:00$/.test(value.startsAt)) invalid();
  const startsAt = value.startsAt as string;
  const date = startsAt.slice(0, 10);
  validateAvailability({ ...value, from: date, to: date }, now);
  const instant = Date.parse(startsAt), hour = Number(startsAt.slice(11, 13));
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (!Number.isFinite(instant) || instant < now.getTime() + schedulingPolicy.minimumNoticeHours * 3600000
    || !schedulingPolicy.workingDays.some(day => day === weekday)
    || hour < schedulingPolicy.startHour || hour >= schedulingPolicy.endHour) invalid();
  return { submissionId: value.submissionId, bookingRequestId: value.bookingRequestId,
    mode: value.mode, advisorCode: value.advisorCode, startsAt } as BookingInput;
}
