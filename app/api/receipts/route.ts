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
      "dateReceived", "vendor", "receiptNo", "receiptDate",
      "billTo", "currency", "paymentMethod", "paidAmount", "validation", "validationNotes"
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

    if (body.invoiceRef) {
      const linkedInvoice = await Invoice.findOne({ invoiceNo: body.invoiceRef });
      if (!linkedInvoice) {
        return NextResponse.json(
          { message: `Invoice ${body.invoiceRef} not found` },
          { status: 400 }
        );
      }
      if (body.paidAmount !== linkedInvoice.grandTotal) {
        return NextResponse.json(
          { 
            message: `Amount mismatch: receipt paid ${body.paidAmount} but invoice total is ${linkedInvoice.grandTotal}`,
            expected: linkedInvoice.grandTotal,
            received: body.paidAmount
          },
          { status: 400 }
        );
      }
    }

    const receipt = await Receipt.create({
      ...body,
      dateReceived: new Date(body.dateReceived),
      receiptDate: new Date(body.receiptDate),
      createdBy: auth.payload.userId,
    });

    // If invoiceRef provided, update invoice status to paid
    if (body.invoiceRef) {
      await Invoice.findOneAndUpdate(
        { invoiceNo: body.invoiceRef },
        { status: "paid", paidDate: new Date(body.receiptDate) }
      );
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
    return NextResponse.json({ message: "Internal server error", errors: String(err) }, { status: 500 });
  }
}
