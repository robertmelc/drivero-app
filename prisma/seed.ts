import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo12345", 12);

  const company = await prisma.company.create({
    data: {
      name: "Drivero Demo s.r.o.",
      ico: "12345678",
      plan: "profi",
      users: {
        create: [
          { email: "admin@drivero-demo.cz", passwordHash, role: "admin", status: "active", startedAt: new Date() },
          { email: "jan.novak@drivero-demo.cz", passwordHash, role: "driver", status: "active", startedAt: new Date() },
          { email: "petra.svobodova@drivero-demo.cz", passwordHash, role: "driver", status: "active", startedAt: new Date() },
        ],
      },
    },
    include: { users: true },
  });

  const driver = company.users.find((u) => u.email.startsWith("jan"))!;

  const vehicle = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      spz: "3AB 4521",
      vin: "TMBJJ7NX0M0123456",
      make: "Škoda",
      model: "Octavia Combi",
      year: 2024,
      fuelType: "diesel",
      ownershipType: "owned",
      odometerKm: 84213,
      stkValidUntil: new Date("2026-08-09"),
      vignetteValidUntil: new Date("2027-01-31"),
      insuranceLiabilityValidUntil: new Date("2027-03-03"),
      insuranceProvider: "Kooperativa",
      assignments: { create: { userId: driver.id, validFrom: new Date("2025-01-15") } },
    },
  });

  await prisma.serviceRecord.create({
    data: {
      vehicleId: vehicle.id,
      type: "regular_service",
      serviceDate: new Date("2026-05-12"),
      odometerKm: 78400,
      supplier: "Škoda Auto servis Praha 9",
      costAmount: 6200,
    },
  });

  console.log("Seed complete:", { company: company.name, vehicle: vehicle.spz });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
