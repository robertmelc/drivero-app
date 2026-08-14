import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const protocol = await prisma.handoverProtocol.findFirst({
    where: { id: params.id, vehicle: { companyId: session.companyId } },
    include: {
      vehicle: true,
      driver: { select: { email: true } },
    },
  });

  if (!protocol) return Response.json({ error: "Protokol nenalezen" }, { status: 404 });

  if (session.role === "driver" && protocol.userId !== session.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ protocol });
}
