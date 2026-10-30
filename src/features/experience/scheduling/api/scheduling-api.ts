import type { AvailabilityInput, AvailabilityResult, BookingInput, BookingResult } from "../types/contracts";
export class SchedulingApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
async function read<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw new SchedulingApiError(response.status, typeof body?.error === "string" ? body.error : "unknown");
  return body as T;
}
export async function getSchedulingAvailability(input: AvailabilityInput, signal?: AbortSignal) {
  return read<AvailabilityResult>(await fetch(`/api/scheduling/availability?${new URLSearchParams({ ...input })}`,
    { signal, cache: "no-store" }));
}
export async function createSchedulingBooking(input: BookingInput) {
  return read<BookingResult>(await fetch("/api/scheduling/bookings", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  }));
}
