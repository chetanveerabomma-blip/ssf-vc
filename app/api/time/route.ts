import { NextResponse } from "next/server";
import { formatInTimeZone } from "date-fns-tz";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const now = new Date();
  const timeZone = "Asia/Kolkata";

  const iso = now.toISOString();
  const epochMs = now.getTime();
  const istDate = formatInTimeZone(now, timeZone, "yyyy-MM-dd");
  const istTime = formatInTimeZone(now, timeZone, "HH:mm:ss");
  const istTimeShort = formatInTimeZone(now, timeZone, "HH:mm");

  return NextResponse.json(
    {
      now: iso,
      epochMs,
      istDate,
      istTime,
      istTimeShort,
      timeZone,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
