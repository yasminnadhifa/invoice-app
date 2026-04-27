import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import Attachment from "@/models/Attachment";
import { authenticate } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = authenticate(request);
  if ("error" in auth) return auth.error;

  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;

    if (!file || !entityType || !entityId) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "uploads-private");
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const attachment = await Attachment.create({
      filename: fileName,
      originalName: file.name,
      entityType,
      entityId,
      uploadedBy: auth.payload.userId,
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { message: "Upload failed", error: String(err) },
      { status: 500 }
    );
  }
}