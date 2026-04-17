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
}