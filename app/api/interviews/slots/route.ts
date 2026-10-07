import { NextResponse } from "next/server";
import { slotAvailability } from "@/lib/interview-bookings";
import { bookableDateKeys } from "@/lib/interviews";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? "";
  const dates = bookableDateKeys();

  if (!dates.includes(date)) {
    return NextResponse.json({ error: "Choose a date within the next two weeks." }, { status: 400 });
  }

  return NextResponse.json({ date, slots: await slotAvailability(date) });
}
