import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed from JSON data...");

  // 1. Seed Sections & Subjects
  const sectionsPath = path.join(process.cwd(), "data", "sections.json");
  if (fs.existsSync(sectionsPath)) {
    const raw = fs.readFileSync(sectionsPath, "utf8");
    const sectionsData = JSON.parse(raw);
    console.log(`Found ${sectionsData.length} sections to seed...`);

    for (const sec of sectionsData) {
      await prisma.section.upsert({
        where: { id: sec.id },
        update: {
          year: sec.year,
          branch: sec.branch,
          label: sec.label,
        },
        create: {
          id: sec.id,
          year: sec.year,
          branch: sec.branch,
          label: sec.label,
        },
      });

      // Extract unique subjects
      const subjectMap = new Map<string, { code: string; name: string; type: string; periods: number }>();
      for (const slotKey in sec.slots || {}) {
        const slot = sec.slots[slotKey];
        if (slot?.code && !subjectMap.has(slot.code)) {
          subjectMap.set(slot.code, {
            code: slot.code,
            name: slot.title || slot.code,
            type: slot.isLab ? "LAB" : "THEORY",
            periods: slot.isLab ? 2 : 1,
          });
        }
      }

      for (const [code, subj] of subjectMap.entries()) {
        await prisma.subject.upsert({
          where: {
            sectionId_code: {
              sectionId: sec.id,
              code: subj.code,
            },
          },
          update: {
            name: subj.name,
            type: subj.type,
            periodsPerSession: subj.periods,
          },
          create: {
            code: subj.code,
            name: subj.name,
            type: subj.type,
            periodsPerSession: subj.periods,
            sectionId: sec.id,
          },
        });
      }
    }
  }

  // 2. Seed RoomMeta
  const roomsPath = path.join(process.cwd(), "data", "rooms.json");
  if (fs.existsSync(roomsPath)) {
    const roomsData = JSON.parse(fs.readFileSync(roomsPath, "utf8"));
    console.log(`Found ${roomsData.length} rooms to seed...`);

    for (const r of roomsData) {
      await prisma.roomMeta.upsert({
        where: { id: r.id },
        update: {
          label: r.label || r.id,
          floor: r.floor,
          type: r.type,
          ac: r.ac,
          capacity: r.capacity,
          notes: r.notes || null,
        },
        create: {
          id: r.id,
          label: r.label || r.id,
          floor: r.floor,
          type: r.type,
          ac: r.ac,
          capacity: r.capacity,
          notes: r.notes || null,
        },
      });
    }
  }

  // 3. Seed Holidays
  const holidaysPath = path.join(process.cwd(), "data", "holidays-2026.json");
  if (fs.existsSync(holidaysPath)) {
    const holidaysData = JSON.parse(fs.readFileSync(holidaysPath, "utf8"));
    console.log(`Found ${holidaysData.length} holidays to seed...`);

    for (const h of holidaysData) {
      await prisma.holiday.upsert({
        where: { date: h.date },
        update: {
          name: h.name,
          type: h.type || "PUBLIC",
        },
        create: {
          date: h.date,
          name: h.name,
          type: h.type || "PUBLIC",
        },
      });
    }
  }

  // 4. Seed BuildingLayout
  const layoutPath = path.join(process.cwd(), "data", "layout.json");
  if (fs.existsSync(layoutPath)) {
    const layoutData = JSON.parse(fs.readFileSync(layoutPath, "utf8"));
    console.log(`Found ${layoutData.floors.length} layout floors to seed...`);

    for (const f of layoutData.floors) {
      const floorInt = f.floor !== null ? f.floor : -1;
      await prisma.buildingLayout.upsert({
        where: { floor: floorInt },
        update: {
          roomsJson: JSON.stringify(f.rooms),
          corridorsJson: JSON.stringify(f.corridors || []),
          stairsJson: JSON.stringify((f.elements || []).filter((e: any) => e.type === "STAIR")),
          liftsJson: JSON.stringify((f.elements || []).filter((e: any) => e.type === "LIFT")),
        },
        create: {
          id: `floor-${floorInt}`,
          floor: floorInt,
          roomsJson: JSON.stringify(f.rooms),
          corridorsJson: JSON.stringify(f.corridors || []),
          stairsJson: JSON.stringify((f.elements || []).filter((e: any) => e.type === "STAIR")),
          liftsJson: JSON.stringify((f.elements || []).filter((e: any) => e.type === "LIFT")),
        },
      });
    }
  }

  // 5. Seed Default Users
  const studentPw = await bcrypt.hash("student123", 10);
  await prisma.user.upsert({
    where: { regNo: "RA2311004010001" },
    update: {},
    create: {
      regNo: "RA2311004010001",
      name: "Rahul Sharma",
      email: "rahul@srmist.edu.in",
      passwordHash: studentPw,
      role: "STUDENT",
      sectionId: "III-ECE-A",
    },
  });

  const adminPw = await bcrypt.hash("srm-eee-admin", 10);
  await prisma.user.upsert({
    where: { regNo: "ADMIN001" },
    update: {},
    create: {
      regNo: "ADMIN001",
      name: "Department Admin",
      email: "admin@srmist.edu.in",
      passwordHash: adminPw,
      role: "ADMIN",
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
