export interface PeriodTime {
  period: number;
  name: string;
  startMin: number; // minutes from midnight
  endMin: number;
  isBreak?: boolean;
  isLunch?: boolean;
}

export const PERIOD_GRIDS: Record<string, PeriodTime[]> = {
  Y2_4: [
    { period: 1, name: "P1", startMin: 540, endMin: 590 }, // 09:00 - 09:50
    { period: 2, name: "P2", startMin: 590, endMin: 640 }, // 09:50 - 10:40
    { period: 0, name: "TEA", startMin: 640, endMin: 650, isBreak: true }, // 10:40 - 10:50
    { period: 3, name: "P3", startMin: 650, endMin: 700 }, // 10:50 - 11:40
    { period: 4, name: "P4", startMin: 700, endMin: 750 }, // 11:40 - 12:30
    { period: 5, name: "P5 (LUNCH)", startMin: 750, endMin: 800, isLunch: true }, // 12:30 - 13:20
    { period: 6, name: "P6", startMin: 800, endMin: 850 }, // 13:20 - 14:10
    { period: 7, name: "P7", startMin: 850, endMin: 900 }, // 14:10 - 15:00
    { period: 0, name: "TEA", startMin: 900, endMin: 910, isBreak: true }, // 15:00 - 15:10
    { period: 8, name: "P8", startMin: 910, endMin: 960 }, // 15:10 - 16:00
    { period: 9, name: "P9", startMin: 960, endMin: 1010 }, // 16:00 - 16:50
  ],
  Y1: [
    { period: 1, name: "P1", startMin: 540, endMin: 590 }, // 09:00 - 09:50
    { period: 2, name: "P2", startMin: 595, endMin: 645 }, // 09:55 - 10:45
    { period: 3, name: "P3", startMin: 650, endMin: 700 }, // 10:50 - 11:40
    { period: 4, name: "P4", startMin: 705, endMin: 755 }, // 11:45 - 12:35
    { period: 5, name: "P5 (LUNCH)", startMin: 755, endMin: 810, isLunch: true }, // 12:35 - 13:30
    { period: 6, name: "P6", startMin: 810, endMin: 860 }, // 13:30 - 14:20
    { period: 7, name: "P7", startMin: 865, endMin: 915 }, // 14:25 - 15:15
    { period: 8, name: "P8", startMin: 920, endMin: 970 }, // 15:20 - 16:10
    { period: 9, name: "P9", startMin: 975, endMin: 1025 }, // 16:15 - 17:05
  ],
};

export const RULES = {
  timezone: "Asia/Kolkata",
  semester: {
    startDate: "2026-08-29",
    endDate: "2026-11-29",
  },
  campusHours: {
    startMin: 480, // 08:00
    endMin: 1080, // 18:00
  },
  freeSoonThresholdMin: 30,
  strictReservation: false,
  slashMeansBoth: true,
  floorLabels: {
    0: "Ground Floor",
    1: "First Floor",
    2: "Second Floor",
    3: "Third Floor",
    4: "Fourth Floor",
    5: "Fifth Floor",
    6: "Sixth Floor",
  } as Record<number, string>,
};

export function getFloorFromRoomId(roomId: string): number | null {
  if (roomId === "TB-106" || roomId === "WORKSHOP") return 0;
  const match = roomId.match(/(\d+)/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (num >= 100 && num < 200) return 0;
  if (num >= 200 && num < 300) return 1;
  if (num >= 300 && num < 400) return 2;
  if (num >= 400 && num < 500) return 3;
  if (num >= 500 && num < 600) return 4;
  if (num >= 600 && num < 700) return 5;
  if (num >= 700 && num < 800) return 6;
  return null;
}
