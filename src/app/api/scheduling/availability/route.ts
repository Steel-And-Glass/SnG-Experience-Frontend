import { getCalendarProvider } from "../../../../server/scheduling/provider";
import { getAvailability } from "../../../../server/scheduling/availability-service";
import { schedulingFailure, schedulingResponse } from "../../../../server/scheduling/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const input = Object.fromEntries(new URL(request.url).searchParams);
    return schedulingResponse(await getAvailability(input, getCalendarProvider(), new Date()));
  } catch (error) { return schedulingFailure(error); }
}
