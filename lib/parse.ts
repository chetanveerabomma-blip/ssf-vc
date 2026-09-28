import { RoomQuery } from "@/lib/schemas";
import { formatIST, getISTNow, resolveTime } from "@/lib/time";

export function parseQueryWithRegex(text: string, referenceTime?: Date): RoomQuery {
  const query = text.toLowerCase();
  const assumptions: string[] = [];

  // Check for prompt injections / off-topic
  const isInjection =
    query.includes("ignore rules") ||
    query.includes("ignore previous instructions") ||
    query.includes("system prompt") ||
    query.includes("reveal secrets") ||
    query.includes("list all faculty") ||
    query.includes("delete all");

  const isOffTopic =
    isInjection ||
    query.includes("weather") ||
    query.includes("recipe") ||
    query.includes("who won") ||
    query.includes("joke") ||
    (query.length > 10 &&
      !query.includes("room") &&
      !query.includes("lab") &&
      !query.includes("floor") &&
      !query.includes("empty") &&
      !query.includes("free") &&
      !query.includes("ac") &&
      !query.includes("study") &&
      !query.includes("team") &&
      !query.includes("class") &&
      !query.includes("hall") &&
      !query.includes("seat") &&
      !query.includes("capacity"));

  if (isOffTopic) {
    return {
      assumptions: ["Request is off-topic or unrelated to finding rooms."],
      off_topic: true,
    };
  }

  // Floors
  let floor: number[] | undefined;
  if (query.includes("ground floor") || query.includes("ground")) {
    floor = [0];
  } else if (query.includes("first floor") || query.includes("1st floor")) {
    floor = [1];
  } else if (query.includes("second floor") || query.includes("2nd floor")) {
    floor = [2];
  } else if (query.includes("third floor") || query.includes("3rd floor")) {
    floor = [3];
  } else if (query.includes("fourth floor") || query.includes("4th floor") || query.includes("4th")) {
    floor = [4];
  } else if (query.includes("fifth floor") || query.includes("5th floor")) {
    floor = [5];
  } else if (query.includes("sixth floor") || query.includes("6th floor")) {
    floor = [6];
  }

  // AC
  let ac: boolean | undefined;
  if (query.includes("non-ac") || query.includes("non ac") || query.includes("without ac")) {
    ac = false;
  } else if (/\bac\b/.test(query) || query.includes("air condition") || query.includes("air-condition")) {
    ac = true;
  }

  // Room Type
  let roomType: "CLASSROOM" | "LAB" | "CDC" | "OTHER" | undefined;
  if (query.includes("lab") || query.includes("laboratory")) {
    roomType = "LAB";
  } else if (query.includes("cdc")) {
    roomType = "CDC";
  } else if (query.includes("classroom") || query.includes("lecture hall")) {
    roomType = "CLASSROOM";
  }

  // Capacity / Team
  let minCapacity: number | undefined;
  const capacityMatch = query.match(/(\d+)\s*(?:people|persons|students|seats|members)/);
  if (capacityMatch) {
    minCapacity = parseInt(capacityMatch[1], 10);
    assumptions.push(`Minimum capacity set to ${minCapacity}`);
  } else if (query.includes("me and my team") || query.includes("team") || query.includes("group")) {
    minCapacity = 5;
    assumptions.push("Group size estimated at ~5 students ('me and my team')");
  }

  // Quiet preference
  const quietPreference = query.includes("quiet") || query.includes("silent") || query.includes("peaceful");
  if (quietPreference) {
    assumptions.push("Quiet space preferred");
  }

  // Resolve time expressions
  const timeRes = resolveTime(text, referenceTime);
  assumptions.push(...timeRes.assumptions);

  const startH = Math.floor(timeRes.startMin / 60);
  const startM = timeRes.startMin % 60;
  const startTime = `${startH.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`;

  return {
    floor,
    ac,
    minCapacity,
    roomType,
    date: timeRes.dateStr,
    startTime,
    durationMin: timeRes.durationMin,
    quietPreference,
    assumptions,
  };
}
