import { requireSession } from "@/lib/auth";
import { uploadPhoto } from "@/lib/supabase-storage";

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Chybí soubor" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ error: "Fotka je příliš velká (max 8 MB)" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Soubor musí být obrázek" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadPhoto(buffer, file.name, file.type);
    return Response.json({ url }, { status: 201 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Nahrání selhalo" },
      { status: 500 }
    );
  }
}
