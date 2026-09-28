import t1Bme from "@/data/timetables/1-bme.json";
import t1Ece from "@/data/timetables/1-ece.json";
import t2Bme from "@/data/timetables/2-bme.json";
import t2EceA from "@/data/timetables/2-ece-a.json";
import t2EceB from "@/data/timetables/2-ece-b.json";
import t3Bme from "@/data/timetables/3-bme.json";
import t3EceDs from "@/data/timetables/3-ece-ds.json";
import t3Ece from "@/data/timetables/3-ece.json";
import t4Bme from "@/data/timetables/4-bme.json";
import t4Ece from "@/data/timetables/4-ece.json";
import holidaysJson from "@/data/holidays-2026.json";
import { Holiday } from "@/lib/dates";

export const STATIC_TIMETABLES: Record<string, any> = {
  "1-bme": t1Bme,
  "1-ece": t1Ece,
  "2-bme": t2Bme,
  "2-ece-a": t2EceA,
  "2-ece-b": t2EceB,
  "3-bme": t3Bme,
  "3-ece-ds": t3EceDs,
  "3-ece": t3Ece,
  "4-bme": t4Bme,
  "4-ece": t4Ece,
};

export const STATIC_HOLIDAYS: Holiday[] = holidaysJson as Holiday[];
