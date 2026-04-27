import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { authenticate } from "@/lib/auth";
import Receipt from "@/models/Receipt";
import Attachment from "@/models/Attachment";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = authenticate(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    await connectDB();
    const receipt = await Receipt.findById(id).select("-__v").lean();
    if (!receipt) {
      return NextResponse.json({ message: "receipt not found" }, { status: 404 });
    }
    const attachments = await Attachment.find({ entityId: id, entityType: "receipt" })
      .select("-__v -entityType -entityId")
      .lean();
    return NextResponse.json({...receipt, attachments});
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = authenticate(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    await connectDB();

    const body = await request.json();

    // Convert date strings if present
    const dateFields = ["dateReceived", "receiptDate", "dueDate", "paidDate"] as const;
    for (const field of dateFields) {
      if (body[field]) body[field] = new Date(body[field]);
    }

    const receipt = await Receipt.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    )
      .select("-__v")
      .lean();

    if (!receipt) {
      return NextResponse.json({ message: "receipt not found" }, { status: 404 });
    }

    return NextResponse.json(receipt);
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { message: "receipt number already exists for this vendor" },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: "Internal server error", errors: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = authenticate(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    await connectDB();

    const receipt = await Receipt.findByIdAndDelete(id).lean();
    if (!receipt) {
      return NextResponse.json({ message: "receipt not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "receipt deleted successfully" });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}