import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getRoomStatus, buildBookings } from "@/lib/engine";
import sectionsData from "@/data/sections.json";
import roomsData from "@/data/rooms.json";
import { Section, Room } from "@/lib/schemas";

export async function GET() {
  try {
    const claimKeys = await redis.keys("claim:*");
    const claims: Record<string, any> = {};

    for (const key of claimKeys) {
      const data = await redis.get(key);
      if (data) {
        const roomId = key.replace("claim:", "");
        claims[roomId] = typeof data === "string" ? JSON.parse(data) : data;
      }
    }

    return NextResponse.json({ success: true, claims });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, squadSize = 2, nickname = "Squad" } = body;

    if (!roomId) {
      return NextResponse.json({ error: "roomId is required" }, { status: 400 });
    }

    const now = new Date();
    const bookings = buildBookings(sectionsData as unknown as Section[]);
    const status = getRoomStatus(roomId, now, {
      bookings,
      rooms: roomsData as unknown as Room[],
    });

    // Verify room is FREE and has at least 10 minutes left
    if (status.status !== "FREE") {
      return NextResponse.json(
        { error: `Room ${roomId} is ${status.status}, cannot be claimed.` },
        { status: 400 }
      );
    }

    const freeMinutes = status.freeMinutes || 0;
    if (freeMinutes < 10) {
      return NextResponse.json(
        { error: "Cannot claim a room with less than 10 minutes remaining." },
        { status: 400 }
      );
    }

    // TTL equal to remaining free time (capped at 4 hours)
    const ttlSeconds = Math.min(freeMinutes * 60, 4 * 3600);
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();

    const claimData = {
      roomId,
      squadSize: Number(squadSize) || 2,
      nickname: String(nickname || "Squad"),
      claimedAt: now.toISOString(),
      expiresAt,
      ttlSeconds,
    };

    await redis.set(`claim:${roomId}`, JSON.stringify(claimData), { ex: ttlSeconds });

    return NextResponse.json({ success: true, claim: claimData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ error: "roomId is required" }, { status: 400 });
    }

    await redis.del(`claim:${roomId}`);
    return NextResponse.json({ success: true, released: roomId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
