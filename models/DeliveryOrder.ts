import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDOItem {
  lineNumber: number;
  sku: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface IDOParty {
  name: string;
  address: string;
  phone: string;
}

export interface IDeliveryOrder extends Document {
  documentType: "do";
  docId: string;
  poReference?: string;
  currency: string;
  deliveryDate: Date;
  sender: IDOParty;
  recipient: IDOParty;
  items: IDOItem[];
  subtotal: number;
  shippingFee: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const doItemSchema = new Schema<IDOItem>(
  {
    lineNumber: { type: Number, required: true },
    sku: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const doPartySchema = new Schema<IDOParty>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const deliveryOrderSchema = new Schema<IDeliveryOrder>(
  {
    documentType: { type: String, default: "do" },
    docId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    poReference: { type: String, trim: true },
    currency: { type: String, required: true, default: "USD", uppercase: true },
    deliveryDate: { type: Date, required: true },
    sender: { type: doPartySchema, required: true },
    recipient: { type: doPartySchema, required: true },
    items: { type: [doItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const DeliveryOrder: Model<IDeliveryOrder> =
  mongoose.models.DeliveryOrder ??
  mongoose.model<IDeliveryOrder>("DeliveryOrder", deliveryOrderSchema);

export default DeliveryOrder;
