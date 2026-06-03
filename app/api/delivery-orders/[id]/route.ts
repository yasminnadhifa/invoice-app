import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { authenticate } from "@/lib/auth";
import DeliveryOrder from "@/models/DeliveryOrder";
import Attachment from "@/models/Attachment";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = authenticate(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    await connectDB();

    const order = await DeliveryOrder.findById(id).select("-__v").lean();
    if (!order) {
      return NextResponse.json({ message: "Delivery order not found" }, { status: 404 });
    }

    const attachments = await Attachment.find({ entityId: id, entityType: "delivery-order" })
      .select("-__v -entityType -entityId")
      .lean();

    return NextResponse.json({ ...order, attachments });
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
    if (body.deliveryDate) body.deliveryDate = new Date(body.deliveryDate);

    const order = await DeliveryOrder.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    )
      .select("-__v")
      .lean();

    if (!order) {
      return NextResponse.json({ message: "Delivery order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ message: "Delivery order ID already exists" }, { status: 409 });
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

    const order = await DeliveryOrder.findByIdAndDelete(id).lean();
    if (!order) {
      return NextResponse.json({ message: "Delivery order not found" }, { status: 404 });
    }

    await Attachment.deleteMany({ entityId: id, entityType: "delivery-order" });

    return NextResponse.json({ message: "Delivery order deleted successfully" });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
