import mongoose, { Document, Model, Schema } from "mongoose";

export interface IReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IReceipt extends Document {
  dateReceived: Date;
  vendor: string;
  receiptNo: string;
  receiptDate: Date;
  invoiceRef?: string; // links to Invoice.invoiceNo for data matching
  billTo?: string;
  billToAddress?: string;
  items: IReceiptItem[];
  itemsCount: number;
  subtotal: number;
  shipping?: number;
  tax: number;
  grandTotal: number;
  currency: string;
  paymentMethod: string;
  paidAmount: number;
  bank?: string;
  accountNo?: string;
  accountName?: string;
  source: "email" | "manual" | "upload" | "api";
  validation: "valid" | "invalid" | "pending";
  validationNotes: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const receiptItemSchema = new Schema<IReceiptItem>(
  {
    description: { type: String, required: false },
    quantity: { type: Number, required: false, min: 0 },
    unitPrice: { type: Number, required: false, min: 0 },
    total: { type: Number, required: false, min: 0 },
  },
  { _id: false }
);

const receiptSchema = new Schema<IReceipt>(
  {
    dateReceived: { type: Date, required: true },
    vendor: { type: String, required: true, trim: true },
    receiptNo: { type: String, required: true, trim: true },
    receiptDate: { type: Date, required: true },
    invoiceRef: { type: String, trim: true }, // optional link to invoice
    billTo: { type: String, required: false, trim: true },
    billToAddress: { type: String, required: false },
    items: { type: [receiptItemSchema], default: [] },
    itemsCount: { type: Number, required: false, min: 0 },
    subtotal: { type: Number, required: false, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "USD", uppercase: true },
    paymentMethod: { type: String, required: false, trim: true },
    paidAmount: { type: Number, required: false, min: 0 },
    bank: { type: String, trim: true },
    accountNo: { type: String, trim: true },
    accountName: { type: String, trim: true },
    validation: {
      type: String,
      enum: ["valid", "invalid", "pending"],
      default: "pending",
    },
    validationNotes: { type: String, required: true, trim: true },
    source: {
      type: String,
      enum: ["bot","manual"],
      default: "manual",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

receiptSchema.index({ receiptNo: 1, vendor: 1 }, { unique: true });

const Receipt: Model<IReceipt> =
  mongoose.models.Receipt ?? mongoose.model<IReceipt>("Receipt", receiptSchema);

export default Receipt;
