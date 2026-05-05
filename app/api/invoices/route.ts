import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { authenticate } from "@/lib/auth";
import Invoice from "@/models/Invoice";
import { CreateInvoiceRequest } from "@/types";

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

    const status = searchParams.get("status");
    if (status === "overdue") {
      filter.dueDate = { $lt: new Date() };

      // optional: exclude paid invoices
      filter.status = { $ne: "paid" };
    } else if (status) {
      filter.status = status;
    }


    const search = searchParams.get("search");
    if (search) {
      filter.$or = [
        { vendor: { $regex: search, $options: "i" } },
        { invoiceNo: { $regex: search, $options: "i" } },
        { billTo: { $regex: search, $options: "i" } },
      ];
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-__v").lean(),
      Invoice.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: invoices,
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

    const body: CreateInvoiceRequest = await request.json();

    const required = [
      "dateReceived", "vendor", "invoiceNo", "invoiceDate", "dueDate",
      "billTo", "currency",  "validation", "validationNotes"
    ] as const;

    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json(
        {
          message: "Missing required fields",
          errors: Object.fromEntries(missing.map((f) => [f, "Required"])),
        },
        { status: 400 }
      );
    }

    const invoice = await Invoice.create({
      ...body,
      dateReceived: new Date(body.dateReceived),
      invoiceDate: new Date(body.invoiceDate),
      dueDate: new Date(body.dueDate),
      paidDate: body.paidDate ? new Date(body.paidDate) : undefined,
      createdBy: auth.authType === "jwt" ? auth.payload.userId : "system", 
    });

    return NextResponse.json(invoice.toObject(), { status: 201 });
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