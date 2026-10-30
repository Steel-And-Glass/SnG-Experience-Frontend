import { getCalendarProvider } from "../../../../server/scheduling/provider";
import { createBooking } from "../../../../server/scheduling/booking-service";
import { schedulingFailure, schedulingResponse } from "../../../../server/scheduling/http";
export async function POST(request: Request) {
  try {
    const provider = getCalendarProvider();
    if (!request.headers.get("content-type")?.includes("application/json")) return schedulingResponse({ error: "invalid_request" }, 400);
    const body = await request.text();
    if (body.length > 4096) return schedulingResponse({ error: "invalid_request" }, 400);
    let input: unknown;
    try { input = JSON.parse(body); } catch { return schedulingResponse({ error: "invalid_request" }, 400); }
    return schedulingResponse(await createBooking(input, provider, new Date()), 201);
  } catch (error) { return schedulingFailure(error); }
}
