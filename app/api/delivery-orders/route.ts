import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { connectDB } from "@/lib/mongodb";
import { authenticate } from "@/lib/auth";
import DeliveryOrder from "@/models/DeliveryOrder";
import Attachment from "@/models/Attachment";
import RequestLog from "@/models/RequestLog";
import { CreateDeliveryOrderRequest } from "@/types";

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
    if (status) filter.status = status;

    const search = searchParams.get("search");
    if (search) {
      filter.$or = [
        { docId: { $regex: search, $options: "i" } },
        { poReference: { $regex: search, $options: "i" } },
        { "sender.name": { $regex: search, $options: "i" } },
        { "recipient.name": { $regex: search, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      DeliveryOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-__v").lean(),
      DeliveryOrder.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: orders,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

async function logRequest(
  auth: ReturnType<typeof authenticate>,
  payload: Record<string, unknown> | undefined,
  files: { name: string; size: number; mimeType: string }[],
  responseStatus: number
) {
  if ("error" in auth) return;
  try {
    await connectDB();
    await RequestLog.create({
      endpoint: "/api/delivery-orders",
      method: "POST",
      authType: auth.authType,
      userId: auth.authType === "jwt" ? auth.payload.userId : undefined,
      payload: payload ? JSON.parse(JSON.stringify(payload)) : undefined,
      files,
      responseStatus,
    });
  } catch (e) {
    console.error("[RequestLog] failed to save:", e);
  }
}

export async function POST(request: NextRequest) {
  const auth = authenticate(request);
  if ("error" in auth) return auth.error;

  let logPayload: Record<string, unknown> | undefined;
  let logFiles: { name: string; size: number; mimeType: string }[] = [];

  try {
    await connectDB();

    const formData = await request.formData();

    const dataField = formData.get("data");
    if (!dataField || typeof dataField !== "string") {
      await logRequest(auth, undefined, [], 400);
      return NextResponse.json({ message: "Missing field: data (JSON string)" }, { status: 400 });
    }

    let body: CreateDeliveryOrderRequest;
    try {
      body = JSON.parse(dataField);
    } catch {
      await logRequest(auth, { raw: dataField }, [], 400);
      return NextResponse.json({ message: "Invalid JSON in field: data" }, { status: 400 });
    }

    const files = formData.getAll("files") as File[];
    const filesInfo = files.map((f) => ({ name: f.name, size: f.size, mimeType: f.type }));

    logPayload = body as unknown as Record<string, unknown>;
    logFiles = filesInfo;

    const required = ["docId", "currency", "deliveryDate", "sender", "recipient", "items", "subtotal", "total"] as const;
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      await logRequest(auth, body as unknown as Record<string, unknown>, filesInfo, 400);
      return NextResponse.json(
        { message: "Missing required fields", errors: Object.fromEntries(missing.map((f) => [f, "Required"])) },
        { status: 400 }
      );
    }

    const uploadedBy = auth.authType === "jwt" ? auth.payload.userId : "69faa99110af68af4b3baf9c";

    const order = await DeliveryOrder.create({
      ...body,
      documentType: "do",
      deliveryDate: new Date(body.deliveryDate),
      createdBy: uploadedBy,
    });

    // Upload any attached files — failures are non-fatal
    const uploadResults = await Promise.allSettled(
      files.map(async (file) => {
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const { url } = await put(`attachments/${filename}`, file, { access: "public" });
        return Attachment.create({
          filename,
          originalName: file.name,
          fileUrl: url,
          entityType: "delivery-order",
          entityId: order._id,
          fileType: "original",
          uploadedBy,
        });
      })
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attachments: any[] = [];
    const uploadErrors: string[] = [];
    for (const result of uploadResults) {
      if (result.status === "fulfilled") attachments.push(result.value.toObject());
      else uploadErrors.push(String(result.reason));
    }

    await logRequest(auth, body as unknown as Record<string, unknown>, filesInfo, 201);

    return NextResponse.json(
      {
        ...order.toObject(),
        attachments,
        ...(uploadErrors.length > 0 && { uploadErrors }),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const status = (err as { code?: number }).code === 11000 ? 409 : 500;
    await logRequest(auth, logPayload, logFiles, status);
    if (status === 409) {
      return NextResponse.json({ message: "Delivery order ID already exists" }, { status: 409 });
    }
    return NextResponse.json({ message: "Internal server error", errors: String(err) }, { status: 500 });
  }
}
