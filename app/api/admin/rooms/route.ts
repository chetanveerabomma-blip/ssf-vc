import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { RoomSchema } from "@/lib/schemas";

function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  return token === "authorized";
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updatedRoom = await req.json();
    const validated = RoomSchema.parse(updatedRoom);

    const roomsFilePath = path.join(process.cwd(), "data", "rooms.json");
    const rawData = fs.readFileSync(roomsFilePath, "utf8");
    const rooms = JSON.parse(rawData);

    const index = rooms.findIndex((r: any) => r.id === validated.id);
    if (index !== -1) {
      rooms[index] = { ...rooms[index], ...validated };
    } else {
      rooms.push(validated);
    }

    fs.writeFileSync(roomsFilePath, JSON.stringify(rooms, null, 2), "utf8");
    return NextResponse.json({ success: true, room: validated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
