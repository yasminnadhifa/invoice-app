import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { authenticate } from "@/lib/auth";
import Receipt from "@/models/Receipt";
import Invoice from "@/models/Invoice";

export async function GET(request: NextRequest) {
  const auth = authenticate(request);
  if ("error" in auth) return auth.error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 15)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    const search = searchParams.get("search");
    if (search) {
      filter.$or = [
        { vendor: { $regex: search, $options: "i" } },
        { receiptNo: { $regex: search, $options: "i" } },
        { invoiceRef: { $regex: search, $options: "i" } },
      ];
    }

    const [receipts, total] = await Promise.all([
      Receipt.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-__v").lean(),
      Receipt.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: receipts,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = authenticate(request);
  if ("error" in auth) return auth.error;

  try {
    await connectDB();

    const body = await request.json();

    const required = [
      "dateReceived",
      "vendor",
      "receiptNo",
      "receiptDate",
      "billTo",
      "currency",
      "paymentMethod",
      "paidAmount",
      "validation",
      "validationNotes",
      "status",
      "reason",
    ] as const;

    const missing = required.filter((f) => !body[f] && body[f] !== 0);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          message: "Missing required fields",
          errors: Object.fromEntries(missing.map((f) => [f, "Required"])),
        },
        { status: 400 }
      );
    }

    await connectDB();

    // 1. Find invoice (if exists)
    let linkedInvoice = null;

    if (body.invoiceRef) {
      linkedInvoice = await Invoice.findOne({
        invoiceNo: body.invoiceRef,
      });

      if (!linkedInvoice) {
        return NextResponse.json(
          { message: `Invoice ${body.invoiceRef} not found` },
          { status: 400 }
        );
      }

      // 2. SAFE validation (no early crash, just flag)
      if (body.paidAmount !== linkedInvoice.grandTotal) {
        body.validation = "invalid";
        body.validationNotes = `Amount mismatch: receipt ${body.paidAmount} vs invoice ${linkedInvoice.grandTotal}`;
      }
    }

    // 3. SAVE RECEIPT FIRST (IMPORTANT)
    const receipt = await Receipt.create({
      ...body,
      dateReceived: new Date(body.dateReceived),
      receiptDate: new Date(body.receiptDate),
      createdBy: auth.payload.userId,
    });

    // 4. Update invoice ONLY if valid + matched
    if (linkedInvoice && body.validation === "valid") {
      const alreadyPaid = linkedInvoice.status === "paid";

      if (!alreadyPaid) {
        await Invoice.findOneAndUpdate(
          { invoiceNo: body.invoiceRef },
          {
            status: "paid",
            paidDate: new Date(body.receiptDate),
          }
        );
      }
    }

    return NextResponse.json(receipt.toObject(), { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { message: "Receipt number already exists for this vendor" },
        { status: 409 }
      );
    }

    console.error("POST /api/receipts error:", err);

    return NextResponse.json(
      { message: "Internal server error", errors: String(err) },
      { status: 500 }
    );
  }
}