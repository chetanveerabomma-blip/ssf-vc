export interface SquadMessageParams {
  roomId: string;
  roomLabel?: string;
  floor?: number | null;
  freeUntil?: string | null; // HH:mm or null
  isRestOfDay?: boolean;
  untilEpoch?: number;
  appUrl?: string;
}

export function formatTime12Hour(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = Number(hStr);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function formatFloorText(floor: number | null | undefined): string {
  if (floor === null || floor === undefined) return "Unmapped area";
  if (floor === 0) return "Ground floor";
  if (floor === 1) return "1st floor";
  if (floor === 2) return "2nd floor";
  if (floor === 3) return "3rd floor";
  return `${floor}th floor`;
}

export function buildSquadMessage(params: SquadMessageParams): string {
  const {
    roomId,
    roomLabel,
    floor,
    freeUntil,
    isRestOfDay,
    untilEpoch,
    appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ssf-vc.vercel.app",
  } = params;

  const displayRoom = (roomLabel || roomId).replace(/-/g, " ");
  const floorText = formatFloorText(floor);

  const timeText = isRestOfDay
    ? "the rest of the day"
    : freeUntil
    ? formatTime12Hour(freeUntil)
    : "further notice";

  const untilParam = untilEpoch ? `?until=${untilEpoch}` : "";
  const link = `${appUrl}/r/${encodeURIComponent(roomId)}${untilParam}`;

  const message = `📍 Heading to ${displayRoom} (${floorText}). It's free until ${timeText}. Come fast! 🏃 ${link}`;

  // Clean control characters and cap at 300 characters
  return message.replace(/[\x00-\x1F\x7F]/g, "").slice(0, 300);
}

export function getWhatsAppUrl(message: string, recipientNumber?: string): string {
  const encoded = encodeURIComponent(message);
  if (recipientNumber) {
    const cleanNum = recipientNumber.replace(/[^0-9]/g, "");
    return `https://wa.me/${cleanNum}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}
