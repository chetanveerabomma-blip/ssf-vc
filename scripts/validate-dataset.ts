import { validateDataset } from "../lib/engine";

console.log("=========================================");
console.log("FLOOR MANAGER - DATASET VALIDATION REPORT");
console.log("=========================================\n");

const report = validateDataset();

console.log(`Total Sections Found: ${report.totalSections}`);
console.log(`Enabled Sections: ${report.enabledSections}`);
console.log(`Total Rooms Registered: ${report.totalRooms}\n`);

console.log("--- 1. DUPLICATE FILES ---");
if (report.duplicateFiles.length > 0) {
  report.duplicateFiles.forEach((d) => console.log(` [!] ${d}`));
} else {
  console.log(" None found.");
}

console.log("\n--- 2. CONFLICTS DETECTED (across all 12 sections) ---");
if (report.conflicts.length > 0) {
  report.conflicts.forEach((c) => {
    console.log(
      ` [CONFLICT] Room: ${c.roomId} | Day: ${c.day} | ${Math.floor(c.startMin / 60)}:${(c.startMin % 60).toString().padStart(2, "0")} - ${Math.floor(c.endMin / 60)}:${(c.endMin % 60).toString().padStart(2, "0")}`
    );
    c.bookings.forEach((b) => {
      console.log(`   - Section: ${b.sectionLabel} (Slot: ${b.slot}, Kind: ${b.kind})`);
    });
  });
} else {
  console.log(" No conflicts detected.");
}

console.log("\n--- 3. UNMAPPED ROOMS (Floor: null) ---");
if (report.unmappedRooms.length > 0) {
  report.unmappedRooms.forEach((r) => {
    console.log(` [UNMAPPED] ${r.id} (${r.label}) - Type: ${r.type}`);
  });
} else {
  console.log(" All rooms assigned to floors.");
}

console.log("\n--- 4. MISSING METADATA AUDIT ---");
console.log(` Rooms missing AC status: ${report.missingMetadata.missingAcCount}`);
console.log(` Rooms missing Capacity: ${report.missingMetadata.missingCapacityCount}`);
console.log(` Total rooms with unverified metadata: ${report.missingMetadata.roomsWithMissingData.length}`);

console.log("\n=========================================");
console.log("VALIDATION FINISHED");
console.log("=========================================");
