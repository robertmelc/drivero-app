import { prisma } from "@/lib/prisma";

/**
 * Daily cron job (configure in vercel.json or an external scheduler) that scans every
 * vehicle's deadline fields and upserts a pending Notification once each falls within
 * its lead_days window. Protected by CRON_SECRET so it can't be triggered publicly.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const LEAD_DAYS = 14;
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + LEAD_DAYS);

  const vehicles = await prisma.vehicle.findMany({
    where: { status: "active" },
    select: {
      id: true,
      companyId: true,
      stkValidUntil: true,
      vignetteValidUntil: true,
      insuranceLiabilityValidUntil: true,
    },
  });

  const deadlineFields = [
    { field: "stkValidUntil", type: "stk" as const },
    { field: "vignetteValidUntil", type: "vignette" as const },
    { field: "insuranceLiabilityValidUntil", type: "insurance" as const },
  ];

  let created = 0;
  for (const vehicle of vehicles) {
    for (const { field, type } of deadlineFields) {
      const dueDate = vehicle[field as keyof typeof vehicle] as Date | null;
      if (!dueDate || dueDate > horizon) continue;

      const existing = await prisma.notification.findFirst({
        where: { vehicleId: vehicle.id, type, status: { in: ["pending", "sent"] } },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          companyId: vehicle.companyId,
          vehicleId: vehicle.id,
          type,
          dueDate,
          leadDays: LEAD_DAYS,
          status: "pending",
        },
      });
      created++;
      // TODO: send the actual e-mail here (see drivero-reminder-email.html for the template)
    }
  }

  return Response.json({ ok: true, created });
}
