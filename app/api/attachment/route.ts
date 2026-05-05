import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { connectDB } from "@/lib/mongodb";
import Attachment from "@/models/Attachment";
import { authenticate } from "@/lib/auth";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  const auth = authenticate(request);
  if ("error" in auth) return auth.error;

  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;
    const fileType = (formData.get("fileType") as string) ?? "original";
    if (!file || !entityType || !entityId) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return NextResponse.json({ message: "Invalid entityId" }, { status: 400 });
    }

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { url } = await put(`attachments/${filename}`, file, { access: "public" });

    const attachment = await Attachment.create({
      filename,
      originalName: file.name,
      fileUrl: url,
      entityType,
      entityId,
      fileType,
      uploadedBy: auth.authType === "jwt" ? auth.payload.userId : "system",
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { message: "Upload failed", error: String(err) },
      { status: 500 }
    );
  }
}