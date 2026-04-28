import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { authenticate } from "@/lib/auth";
import Invoice from "@/models/Invoice";
import Attachment from "@/models/Attachment";
import Receipt from "@/models/Receipt";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = authenticate(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    await connectDB();
    const invoice = await Invoice.findById(id).select("-__v").lean();
    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }
    const [attachments, receipts] = await Promise.all([
      Attachment.find({ entityId: id, entityType: "invoice" })
        .select("-__v -entityType -entityId")
        .lean(),
      Receipt.find({ invoiceRef: invoice.invoiceNo })
        .select("_id receiptNo vendor receiptDate status validation grandTotal currency")
        .lean(),
    ]);

    return NextResponse.json({ ...invoice, attachments, receipts });
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
    const dateFields = ["dateReceived", "invoiceDate", "dueDate", "paidDate"] as const;
    for (const field of dateFields) {
      if (body[field]) body[field] = new Date(body[field]);
    }

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    )
      .select("-__v")
      .lean();

    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { message: "Invoice number already exists for this vendor" },
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

    const invoice = await Invoice.findByIdAndDelete(id).lean();
    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Invoice deleted successfully" });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}