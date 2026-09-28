import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { OverridesDataSchema } from "@/lib/schemas";

function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  return token === "authorized";
}

const overridesFilePath = path.join(process.cwd(), "data", "overrides.json");

export async function GET() {
  try {
    if (!fs.existsSync(overridesFilePath)) {
      return NextResponse.json({ dayOrders: [], cancellations: [], roomClosures: [] });
    }
    const raw = fs.readFileSync(overridesFilePath, "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = OverridesDataSchema.parse(body);

    fs.writeFileSync(overridesFilePath, JSON.stringify(validated, null, 2), "utf8");
    return NextResponse.json({ success: true, overrides: validated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Validation failed" }, { status: 400 });
  }
}
