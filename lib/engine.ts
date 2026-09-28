import { PERIOD_GRIDS, RULES, getFloorFromRoomId } from "@/config/rules";
import { Room, RoomQuery, RoomStatus, Section } from "@/lib/schemas";
import {
  formatMinutesToTime,
  getDayOfWeekString,
  getMinutesSinceMidnight,
  isHoliday,
  isSemesterActive,
  formatIST,
} from "@/lib/time";
import roomsData from "@/data/rooms.json";
import sectionsData from "@/data/sections.json";
import aliasesData from "@/data/aliases.json";

export interface Booking {
  id: string;
  roomId: string;
  sectionId: string;
  sectionLabel: string;
  day: string;
  startMin: number;
  endMin: number;
  startPeriod: number;
  endPeriod: number;
  slot: string;
  subjectName?: string;
  kind: "THEORY" | "LAB" | "PROJECT" | "OTHER";
  verified?: boolean;
}

export interface BookingConflict {
  roomId: string;
  day: string;
  startMin: number;
  endMin: number;
  bookings: Booking[];
}

export interface RoomAvailabilityStatus {
  roomId: string;
  room: Room;
  status: RoomStatus;
  currentBooking?: Booking;
  conflictingBookings?: Booking[];
  freeUntil?: string; // HH:mm
  freeMinutes?: number;
  busyUntil?: string; // HH:mm
  nextBooking?: Booking;
  isLunchBreak?: boolean;
  isTeaBreak?: boolean;
}

export interface FreeWindow {
  startMin: number;
  endMin: number;
  startTime: string;
  endTime: string;
  minutes: number;
  crossesLunch?: boolean;
}

export interface RoomMatch {
  room: Room;
  window: FreeWindow;
  minutesAvailable: number;
  requestedMinutes: number;
  isFullMatch: boolean;
  matchScore: number;
  why: string;
  acUnverified?: boolean;
}

export interface FindRoomsResult {
  matches: RoomMatch[];
  partial: RoomMatch[];
  notes: string[];
  resolvedQuery: {
    startMin: number;
    endMin: number;
    date: string;
    day: string;
    durationMin: number;
  };
}

export interface ValidationReport {
  duplicateFiles: string[];
  conflicts: BookingConflict[];
  unmappedRooms: Room[];
  missingMetadata: {
    missingAcCount: number;
    missingCapacityCount: number;
    roomsWithMissingData: string[];
  };
  totalSections: number;
  enabledSections: number;
  totalRooms: number;
}

// Normalize room ID using alias table
export function normalizeRoomId(rawId: string): string {
  const trimmed = rawId.trim();
  const aliases = aliasesData as Record<string, string>;
  if (aliases[trimmed]) {
    return aliases[trimmed];
  }
  // Try cleaning hyphens/spaces
  const clean = trimmed.replace(/\s+/g, "-");
  if (aliases[clean]) {
    return aliases[clean];
  }
  return trimmed;
}

// Convert a period range to minutes based on section's period grid
export function periodToMinutes(
  periodGridKey: string,
  startPeriod: number,
  endPeriod: number
): { startMin: number; endMin: number } {
  const grid = PERIOD_GRIDS[periodGridKey] || PERIOD_GRIDS.Y2_4;
  const startEntry = grid.find((p) => p.period === startPeriod);
  const endEntry = grid.find((p) => p.period === endPeriod);

  const startMin = startEntry ? startEntry.startMin : 540;
  const endMin = endEntry ? endEntry.endMin : 1010;

  return { startMin, endMin };
}

// Expand section timetable into a flat list of normalized bookings
export function buildBookings(
  customSections?: Section[],
  options: { strictReservation?: boolean } = {}
): Booking[] {
  const sections: Section[] = (customSections || (sectionsData as unknown as Section[])).filter(
    (s) => s.enabled
  );
  const strict = options.strictReservation ?? RULES.strictReservation;
  const rawBookings: Booking[] = [];

  for (const sec of sections) {
    const periodGridKey = sec.periodGrid;

    for (const [dayKey, blocks] of Object.entries(sec.days)) {
      if (!blocks) continue;

      for (const block of blocks) {
        const { startMin, endMin } = periodToMinutes(
          periodGridKey,
          block.startPeriod,
          block.endPeriod
        );

        const slotInfo = sec.slots[block.slot];
        const subjectName = slotInfo ? slotInfo.name : block.slot;

        for (const rawRoom of block.rooms) {
          const roomId = normalizeRoomId(rawRoom);
          rawBookings.push({
            id: `${sec.id}-${dayKey}-${block.startPeriod}-${roomId}`,
            roomId,
            sectionId: sec.id,
            sectionLabel: sec.label,
            day: dayKey,
            startMin,
            endMin,
            startPeriod: block.startPeriod,
            endPeriod: block.endPeriod,
            slot: block.slot,
            subjectName,
            kind: (block.kind as any) || "THEORY",
            verified: block.verified,
          });
        }
      }

      // If strictReservation is active, reserve the home room for the entire half-day
      if (strict && sec.homeRoom) {
        const homeRoomId = normalizeRoomId(sec.homeRoom);
        if (sec.homeHalf === "FN" || sec.homeHalf === "FULL") {
          // Forenoon: P1 start to lunch end
          const fnStart = 540;
          const fnEnd = 800;
          rawBookings.push({
            id: `${sec.id}-${dayKey}-STRICT-FN-${homeRoomId}`,
            roomId: homeRoomId,
            sectionId: sec.id,
            sectionLabel: `${sec.label} (Strict FN Reservation)`,
            day: dayKey,
            startMin: fnStart,
            endMin: fnEnd,
            startPeriod: 1,
            endPeriod: 5,
            slot: "RESERVED",
            subjectName: "Strict Half-Day Reservation (FN)",
            kind: "THEORY",
          });
        }
        if (sec.homeHalf === "AN" || sec.homeHalf === "FULL") {
          // Afternoon: P6 start to P9 end
          const anStart = 800;
          const anEnd = 1010;
          rawBookings.push({
            id: `${sec.id}-${dayKey}-STRICT-AN-${homeRoomId}`,
            roomId: homeRoomId,
            sectionId: sec.label,
            sectionLabel: `${sec.label} (Strict AN Reservation)`,
            day: dayKey,
            startMin: anStart,
            endMin: anEnd,
            startPeriod: 6,
            endPeriod: 9,
            slot: "RESERVED",
            subjectName: "Strict Half-Day Reservation (AN)",
            kind: "THEORY",
          });
        }
      }
    }
  }

  // Merge adjacent blocks of the same class for the same section & room
  return mergeAdjacentBookings(rawBookings);
}

export function mergeAdjacentBookings(bookings: Booking[]): Booking[] {
  // Sort by roomId, day, sectionId, startMin
  const sorted = [...bookings].sort((a, b) => {
    if (a.roomId !== b.roomId) return a.roomId.localeCompare(b.roomId);
    if (a.day !== b.day) return a.day.localeCompare(b.day);
    if (a.sectionId !== b.sectionId) return a.sectionId.localeCompare(b.sectionId);
    return a.startMin - b.startMin;
  });

  const merged: Booking[] = [];
  for (const b of sorted) {
    if (merged.length === 0) {
      merged.push({ ...b });
      continue;
    }
    const last = merged[merged.length - 1];
    if (
      last.roomId === b.roomId &&
      last.day === b.day &&
      last.sectionId === b.sectionId &&
      last.slot === b.slot &&
      last.endMin === b.startMin
    ) {
      last.endMin = b.endMin;
      last.endPeriod = b.endPeriod;
    } else {
      merged.push({ ...b });
    }
  }
  return merged;
}

// Find all overlapping booking conflicts
export function detectConflicts(bookings: Booking[]): BookingConflict[] {
  const conflicts: BookingConflict[] = [];
  const byRoomAndDay: Record<string, Booking[]> = {};

  for (const b of bookings) {
    const key = `${b.roomId}_${b.day}`;
    if (!byRoomAndDay[key]) byRoomAndDay[key] = [];
    byRoomAndDay[key].push(b);
  }

  for (const [key, bList] of Object.entries(byRoomAndDay)) {
    for (let i = 0; i < bList.length; i++) {
      for (let j = i + 1; j < bList.length; j++) {
        const b1 = bList[i];
        const b2 = bList[j];
        // Must be different sections
        if (b1.sectionId === b2.sectionId) continue;
        // Check time overlap: max(start1, start2) < min(end1, end2)
        const overlapStart = Math.max(b1.startMin, b2.startMin);
        const overlapEnd = Math.min(b1.endMin, b2.endMin);
        if (overlapStart < overlapEnd) {
          conflicts.push({
            roomId: b1.roomId,
            day: b1.day,
            startMin: overlapStart,
            endMin: overlapEnd,
            bookings: [b1, b2],
          });
        }
      }
    }
  }

  return conflicts;
}

// Check room status at specific date and time
export function getRoomStatus(
  roomId: string,
  at: Date,
  options: {
    bookings?: Booking[];
    rooms?: Room[];
    strictReservation?: boolean;
  } = {}
): RoomAvailabilityStatus {
  const normalizedId = normalizeRoomId(roomId);
  const rooms: Room[] = options.rooms || (roomsData as unknown as Room[]);
  const room = rooms.find((r) => r.id === normalizedId) || {
    id: normalizedId,
    label: normalizedId,
    floor: getFloorFromRoomId(normalizedId),
    type: "CLASSROOM",
    ac: null,
    capacity: null,
  };

  const dateStr = formatIST(at, "yyyy-MM-dd");
  const dayStr = getDayOfWeekString(at);
  const currentMin = getMinutesSinceMidnight(at);

  // Check if weekend or holiday
  const holiday = isHoliday(dateStr);
  const isWeekend = dayStr === "SAT" || dayStr === "SUN";

  if (isWeekend || holiday) {
    return {
      roomId: normalizedId,
      room,
      status: "NO_CLASSES",
      freeUntil: formatMinutesToTime(RULES.campusHours.endMin),
      freeMinutes: Math.max(0, RULES.campusHours.endMin - currentMin),
    };
  }

  // Check campus operating hours
  if (currentMin < RULES.campusHours.startMin || currentMin >= RULES.campusHours.endMin) {
    return {
      roomId: normalizedId,
      room,
      status: "OCCUPIED",
      busyUntil: formatMinutesToTime(RULES.campusHours.startMin),
    };
  }

  const allBookings = options.bookings || buildBookings(undefined, options);
  const dayBookings = allBookings
    .filter((b) => b.roomId === normalizedId && b.day === dayStr)
    .sort((a, b) => a.startMin - b.startMin);

  // Check for active conflicts at currentMin
  const activeBookings = dayBookings.filter(
    (b) => currentMin >= b.startMin && currentMin < b.endMin
  );

  if (activeBookings.length > 1) {
    // Conflict!
    const latestEnd = Math.max(...activeBookings.map((b) => b.endMin));
    return {
      roomId: normalizedId,
      room,
      status: "DATA_CONFLICT",
      conflictingBookings: activeBookings,
      busyUntil: formatMinutesToTime(latestEnd),
    };
  }

  if (activeBookings.length === 1) {
    // Occupied
    const active = activeBookings[0];
    // Find consecutive occupied chain
    let busyEnd = active.endMin;
    let nextIdx = dayBookings.indexOf(active) + 1;
    while (nextIdx < dayBookings.length && dayBookings[nextIdx].startMin === busyEnd) {
      busyEnd = dayBookings[nextIdx].endMin;
      nextIdx++;
    }

    return {
      roomId: normalizedId,
      room,
      status: "OCCUPIED",
      currentBooking: active,
      busyUntil: formatMinutesToTime(busyEnd),
    };
  }

  // Currently Free! Find next booking
  const futureBookings = dayBookings.filter((b) => b.startMin > currentMin);
  const nextBooking = futureBookings[0];

  const nextBookingStart = nextBooking ? nextBooking.startMin : RULES.campusHours.endMin;
  const freeMinutes = nextBookingStart - currentMin;
  const freeUntil = formatMinutesToTime(nextBookingStart);

  // Check if it's lunch or tea break
  const isTea = (currentMin >= 640 && currentMin < 650) || (currentMin >= 900 && currentMin < 910);
  const isLunch = currentMin >= 750 && currentMin < 800;

  // FREE_SOON if occupied within 30 min
  const isFreeSoon = freeMinutes <= RULES.freeSoonThresholdMin;

  return {
    roomId: normalizedId,
    room,
    status: isFreeSoon ? "FREE_SOON" : "FREE",
    freeUntil,
    freeMinutes,
    nextBooking,
    isLunchBreak: isLunch,
    isTeaBreak: isTea,
  };
}

// Compute all free windows for a room on a given date
export function getFreeWindows(
  roomId: string,
  date: Date,
  options: { bookings?: Booking[] } = {}
): FreeWindow[] {
  const normalizedId = normalizeRoomId(roomId);
  const dateStr = formatIST(date, "yyyy-MM-dd");
  const dayStr = getDayOfWeekString(date);

  const isWeekend = dayStr === "SAT" || dayStr === "SUN";
  if (isWeekend || isHoliday(dateStr)) {
    return [
      {
        startMin: RULES.campusHours.startMin,
        endMin: RULES.campusHours.endMin,
        startTime: formatMinutesToTime(RULES.campusHours.startMin),
        endTime: formatMinutesToTime(RULES.campusHours.endMin),
        minutes: RULES.campusHours.endMin - RULES.campusHours.startMin,
        crossesLunch: true,
      },
    ];
  }

  const allBookings = options.bookings || buildBookings();
  const dayBookings = allBookings
    .filter((b) => b.roomId === normalizedId && b.day === dayStr)
    .sort((a, b) => a.startMin - b.startMin);

  // Merge overlapping or contiguous occupied blocks
  const occupiedSpans: { startMin: number; endMin: number }[] = [];
  for (const b of dayBookings) {
    if (occupiedSpans.length === 0) {
      occupiedSpans.push({ startMin: b.startMin, endMin: b.endMin });
    } else {
      const last = occupiedSpans[occupiedSpans.length - 1];
      if (b.startMin <= last.endMin) {
        last.endMin = Math.max(last.endMin, b.endMin);
      } else {
        occupiedSpans.push({ startMin: b.startMin, endMin: b.endMin });
      }
    }
  }

  // Complement of occupiedSpans between campus start (480) and campus close (1080)
  const freeWindows: FreeWindow[] = [];
  let pointer = RULES.campusHours.startMin;

  for (const span of occupiedSpans) {
    if (span.startMin > pointer) {
      const start = pointer;
      const end = span.startMin;
      freeWindows.push({
        startMin: start,
        endMin: end,
        startTime: formatMinutesToTime(start),
        endTime: formatMinutesToTime(end),
        minutes: end - start,
        crossesLunch: start < 800 && end > 750,
      });
    }
    pointer = Math.max(pointer, span.endMin);
  }

  if (pointer < RULES.campusHours.endMin) {
    freeWindows.push({
      startMin: pointer,
      endMin: RULES.campusHours.endMin,
      startTime: formatMinutesToTime(pointer),
      endTime: formatMinutesToTime(RULES.campusHours.endMin),
      minutes: RULES.campusHours.endMin - pointer,
      crossesLunch: pointer < 800 && RULES.campusHours.endMin > 750,
    });
  }

  return freeWindows;
}

// Find rooms matching user criteria
export function findRooms(
  query: RoomQuery,
  options: {
    referenceDate?: Date;
    rooms?: Room[];
    bookings?: Booking[];
  } = {}
): FindRoomsResult {
  const rooms: Room[] = options.rooms || (roomsData as unknown as Room[]);
  const refDate = options.referenceDate || new Date();
  const dateStr = query.date || formatIST(refDate, "yyyy-MM-dd");
  const dayStr = getDayOfWeekString(new Date(dateStr + "T12:00:00"));

  let startMin = query.startTime
    ? getMinutesSinceMidnight(new Date(`2026-01-01T${query.startTime}:00`))
    : getMinutesSinceMidnight(refDate);

  // Clamp startMin to campus hours
  startMin = Math.max(RULES.campusHours.startMin, Math.min(RULES.campusHours.endMin, startMin));

  let durationMin = query.durationMin || 60;
  if (query.endTime) {
    const endMinutes = getMinutesSinceMidnight(new Date(`2026-01-01T${query.endTime}:00`));
    durationMin = Math.max(10, endMinutes - startMin);
  }

  const targetEndMin = Math.min(RULES.campusHours.endMin, startMin + durationMin);
  const actualRequestedDuration = targetEndMin - startMin;

  const allBookings = options.bookings || buildBookings();
  const notes: string[] = [];

  const matches: RoomMatch[] = [];
  const partial: RoomMatch[] = [];

  // Check if requested time is outside campus hours or ends right at closing
  if (startMin >= RULES.campusHours.endMin) {
    notes.push("Campus is closed at the requested time (operating hours 08:00 - 18:00).");
    return {
      matches: [],
      partial: [],
      notes,
      resolvedQuery: {
        startMin,
        endMin: targetEndMin,
        date: dateStr,
        day: dayStr,
        durationMin,
      },
    };
  }

  for (const room of rooms) {
    // 1. Filter checks
    if (query.floor && query.floor.length > 0) {
      if (room.floor === null || !query.floor.includes(room.floor)) {
        continue;
      }
    }

    if (query.roomType && room.type !== query.roomType) {
      continue;
    }

    // AC check: if user asked for ac: true
    let acUnverified = false;
    if (query.ac === true) {
      if (room.ac === false) continue;
      if (room.ac === null) {
        acUnverified = true;
      }
    } else if (query.ac === false) {
      if (room.ac === true) continue;
    }

    // Capacity check
    if (query.minCapacity) {
      if (room.capacity !== null && room.capacity < query.minCapacity) {
        continue;
      }
    }

    // 2. Check availability window
    const targetDateObj = new Date(dateStr + "T10:00:00");
    const freeWindows = getFreeWindows(room.id, targetDateObj, { bookings: allBookings });

    // Look for windows overlapping [startMin, targetEndMin]
    let maxContinuousFree = 0;
    let bestWindow: FreeWindow | null = null;

    for (const w of freeWindows) {
      // Check overlap
      const overlapStart = Math.max(startMin, w.startMin);
      const overlapEnd = Math.min(targetEndMin, w.endMin);

      if (overlapStart < overlapEnd) {
        const overlapDuration = overlapEnd - overlapStart;
        if (overlapDuration > maxContinuousFree) {
          maxContinuousFree = overlapDuration;
          bestWindow = w;
        }
      }
    }

    if (!bestWindow || maxContinuousFree === 0) {
      continue;
    }

    // Determine if full match or partial match
    const isFull = maxContinuousFree >= actualRequestedDuration && bestWindow.startMin <= startMin && bestWindow.endMin >= targetEndMin;

    const floorLabel = room.floor !== null ? (RULES.floorLabels[room.floor] || `Floor ${room.floor}`) : "Unmapped floor";
    const acText = room.ac === true ? "AC verified" : room.ac === false ? "Non-AC" : "AC unverified";

    const bufferAfterEnd = Math.max(0, bestWindow.endMin - targetEndMin);
    const capacityWaste = room.capacity ? room.capacity - (query.minCapacity || 1) : 999;
    const requestedFloor = query.floor?.[0] ?? 0;
    const floorDistance = room.floor !== null ? Math.abs(room.floor - requestedFloor) : 10;

    // Match score: full match (1000) + buffer (up to 100) - floor distance - capacity penalty
    const matchScore = (isFull ? 1000 : 100) + Math.min(100, bufferAfterEnd) - floorDistance * 10 - Math.min(50, capacityWaste);

    const matchObj: RoomMatch = {
      room,
      window: bestWindow,
      minutesAvailable: maxContinuousFree,
      requestedMinutes: actualRequestedDuration,
      isFullMatch: isFull,
      matchScore,
      why: isFull
        ? `${floorLabel}, free for your full ${actualRequestedDuration} min (${formatMinutesToTime(startMin)} - ${formatMinutesToTime(targetEndMin)}) · ${acText}`
        : `${floorLabel}, free for ${maxContinuousFree} of your requested ${actualRequestedDuration} min (${bestWindow.startTime} - ${bestWindow.endTime})`,
      acUnverified,
    };

    if (isFull) {
      matches.push(matchObj);
    } else {
      partial.push(matchObj);
    }
  }

  // Sort matches by matchScore descending
  matches.sort((a, b) => b.matchScore - a.matchScore);
  partial.sort((a, b) => b.minutesAvailable - a.minutesAvailable || b.matchScore - a.matchScore);

  return {
    matches,
    partial,
    notes,
    resolvedQuery: {
      startMin,
      endMin: targetEndMin,
      date: dateStr,
      day: dayStr,
      durationMin: actualRequestedDuration,
    },
  };
}

// Full dataset validation
export function validateDataset(): ValidationReport {
  const sections = sectionsData as unknown as Section[];
  const rooms = roomsData as unknown as Room[];
  const bookings = buildBookings(sections);

  // 1. Duplicate files
  const duplicateFiles: string[] = [];
  for (const s of sections) {
    if (s.duplicateSource) {
      duplicateFiles.push(`${s.source} duplicates ${s.duplicateSource}`);
    }
  }

  // 2. Conflicts (enable all sections including Year 1 to check true data conflicts)
  const allSectionsWithY1 = sections.map((s) => ({ ...s, enabled: true }));
  const allBookingsWithY1 = buildBookings(allSectionsWithY1);
  const conflicts = detectConflicts(allBookingsWithY1);

  // 3. Unmapped rooms (floor === null)
  const unmappedRooms = rooms.filter((r) => r.floor === null);

  // 4. Missing metadata (ac === null or capacity === null)
  const missingAcRooms = rooms.filter((r) => r.ac === null);
  const missingCapRooms = rooms.filter((r) => r.capacity === null);
  const roomsWithMissing = Array.from(
    new Set([...missingAcRooms.map((r) => r.id), ...missingCapRooms.map((r) => r.id)])
  );

  return {
    duplicateFiles,
    conflicts,
    unmappedRooms,
    missingMetadata: {
      missingAcCount: missingAcRooms.length,
      missingCapacityCount: missingCapRooms.length,
      roomsWithMissingData: roomsWithMissing,
    },
    totalSections: sections.length,
    enabledSections: sections.filter((s) => s.enabled).length,
    totalRooms: rooms.length,
  };
}
