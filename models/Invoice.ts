import mongoose, { Document, Model, Schema } from "mongoose";

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IInvoice extends Document {
  dateReceived: Date;
  vendor: string;
  invoiceNo: string;
  invoiceDate: Date;
  dueDate: Date;
  poNumber?: string;
  billTo: string;
  billToAddress?: string;
  items: IInvoiceItem[];
  itemsCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  currency: string;
  bank: string;
  accountNo: string;
  accountName: string;
  status: "pending" | "approved" | "paid" | "rejected" | "overdue";
  validation: "valid" | "invalid" | "pending";
  validationNotes: string;
  source: "manual" | "bot";
  paidDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    dateReceived: { type: Date, required: true },
    vendor: { type: String, required: true, trim: true },
    invoiceNo: { type: String, required: true, trim: true },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    poNumber: { type: String, trim: true },
    billTo: { type: String, required: false, trim: true },
    billToAddress: { type: String, required: false },
    items: { type: [invoiceItemSchema], default: [] },
    itemsCount: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: false, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: false, min: 0 },
    currency: { type: String, required: true, default: "USD", uppercase: true },
    bank: { type: String, required: false, trim: true },
    accountNo: { type: String, required: false, trim: true },
    accountName: { type: String, required: false, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "paid", "rejected", "overdue"],
      default: "pending",
    },
    validation: {
      type: String,
      enum: ["valid", "invalid", "pending"],
      default: "pending",
    },
    validationNotes: { type: String, required: true, trim: true },
    source: {
      type: String,
      enum: [ "manual", "bot"],
      default: "manual",
    },
    paidDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ invoiceNo: 1, vendor: 1 }, { unique: true });

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice ?? mongoose.model<IInvoice>("Invoice", invoiceSchema);

export default Invoice;