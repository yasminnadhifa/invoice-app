export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateInvoiceRequest {
  dateReceived: string;
  vendor: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  poNumber?: string;
  billTo: string;
  billToAddress: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  itemsCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  currency: string;
  bank: string;
  accountNo: string;
  accountName: string;
  status?: "pending" | "approved" | "paid" | "rejected" | "overdue";
  validation?: "valid" | "invalid" | "pending";
  validationNotes: string;
  source?: "manual" | "bot"; 
  paidDate?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceListItem {
  _id: string;
  dateReceived: string;
  vendor: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  poNumber?: string;
  billTo: string;
  billToAddress: string;

  items: InvoiceItem[]; 
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

  paidDate?: string;

  createdBy: string; 
  createdAt: string;
  updatedAt: string; 
  attachments?: {
  _id: string;
  originalName: string;
  fileUrl: string;
  filename: string;
}[];
}

export interface InvoiceListResponse {
  data: InvoiceListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateReceiptRequest {
  dateReceived: string;
  vendor: string;
  receiptNo: string;
  receiptDate: string;
  invoiceRef?: string;
  billTo: string;
  billToAddress: string;
  items?: { description: string; quantity: number; unitPrice: number; total: number }[];
  itemsCount?: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  grandTotal: number;
  currency: string;
  paymentMethod: string;
  paidAmount: number;
  bank?: string;
  accountNo?: string;
  accountName?: string;
  validation:string;
  validationNotes: string;
  source?: "manual" | "bot";
}

export interface DOItem {
  lineNumber: number;
  sku: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface DOParty {
  name: string;
  address: string;
  phone: string;
}

export interface CreateDeliveryOrderRequest {
  documentType?: "do";
  docId: string;
  poReference?: string;
  currency: string;
  deliveryDate: string;
  sender: DOParty;
  recipient: DOParty;
  items: DOItem[];
  subtotal: number;
  shippingFee: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface DeliveryOrderListItem {
  _id: string;
  documentType: "do";
  docId: string;
  poReference?: string;
  currency: string;
  deliveryDate: string;
  sender: DOParty;
  recipient: DOParty;
  items: DOItem[];
  subtotal: number;
  shippingFee: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  attachments?: {
    _id: string;
    originalName: string;
    fileUrl: string;
    filename: string;
    fileType?: "original" | "converted";
  }[];
}

export interface InvoiceMismatch {
  index: number;
  field: "description" | "quantity" | "unitPrice" | "total";
  invoiceValue: string | number;
  receiptValue: string | number;
  reason: string;
}export interface ReceiptListItem {
  _id: string;
  dateReceived: string;
  vendor: string;
  receiptNo: string;
  receiptDate: string;
  invoiceRef?: string;
  billTo: string;
  billToAddress: string;
  itemsCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  currency: string;
  paymentMethod: string;
  paidAmount: number;
  bank?: string;
  accountNo?: string;
  accountName?: string;
  source: string;
  status?: "MATCH" | "FLAGGED";
  reason?: string;
  mismatches?: InvoiceMismatch[];
  validation: string;
  createdAt: string;
  attachments?: {
  _id: string;
  originalName: string;
  fileUrl: string;
  filename: string;
}[];
}