import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createSignedUploadUrl } from "@/lib/supabase-storage";

const SignRequestSchema = z.object({
  fileName: z.string().min(1),
  bucket: z.enum(["handover-photos", "receipts"]).optional(),
});

export async function POST(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = SignRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const result = await createSignedUploadUrl(parsed.data.fileName, parsed.data.bucket);
    return Response.json(result, { status: 201 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Příprava nahrání selhala" },
      { status: 500 }
    );
  }
}
