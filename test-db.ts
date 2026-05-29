import 'dotenv/config';
import { prisma } from './lib/prisma';

async function main() {
  console.log("🟢 1. Testing DB connection and creating a new Student...");
  const student = await prisma.student.create({
    data: { name: "Test Student - Phase 0 Verification" }
  });
  console.log("   ✅ Student created successfully:", student);

  console.log("\n🟢 2. Adding a Mark for this Student...");
  const mark = await prisma.mark.create({
    data: {
      studentId: student.id,
      date: new Date("2026-05-29T00:00:00.000Z"),
      mark: 10,
      remark: "Excellent"
    }
  });
  console.log("   ✅ Mark created successfully:", mark);

  console.log("\n🟢 3. Reading back the Student with their Marks...");
  const result = await prisma.student.findUnique({
    where: { id: student.id },
    include: { marks: true }
  });
  console.log("   ✅ Read successful:");
  console.log(JSON.stringify(result, null, 2));

  console.log("\n🟢 4. Testing unique constraint (trying to insert duplicate mark for same day)...");
  try {
    await prisma.mark.create({
      data: {
        studentId: student.id,
        date: new Date("2026-05-29T00:00:00.000Z"), // exact same date
        mark: 5,
        remark: "Satisfactory"
      }
    });
    console.error("   ❌ ERROR: Unique constraint failed to prevent duplicate!");
  } catch (err: any) {
    if (err.code === 'P2002') {
      console.log("   ✅ Unique constraint correctly rejected duplicate mark! (Error code P2002)");
    } else {
      console.error("   ⚠️ Unexpected error:", err);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    // Prisma v7 driver adapter disconnect is implicit or handled automatically in some environments,
    // but calling $disconnect is still good practice.
    await (prisma as any).$disconnect();
  });
