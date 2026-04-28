"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { formatCurrency, formatDate, isOverdue } from "@/app/invoices/page";
import { InvoiceItem, InvoiceListItem } from "@/types";

type Attachment = {
  _id: string;
  filename: string;
  fileUrl: string;
  originalName: string;
  fileType?: "original" | "converted";
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [inv, setInv] = useState<InvoiceListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/invoices/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setInv)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-400 text-sm">
        Invoice not found.
      </div>
    );
  }

  const attachments: Attachment[] = (inv as any).attachments || [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            ◈
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-800">NIP</span>
        </div>
        <nav className="flex-1 p-3">
          <button
            onClick={() => router.push("/invoices")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-semibold w-full text-left border-none"
          >
            <span>⊞</span> Invoices
          </button>
          <button
            onClick={() => router.push("/receipts")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-sm font-medium transition-colors w-full text-left border-none"
          >
            <span>🧾</span> Receipts
          </button>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="px-8 py-5 border-b border-slate-200 bg-white flex items-center gap-4 shadow-sm shrink-0">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-slate-600 text-sm transition-colors bg-transparent border-none cursor-pointer"
          >
            ← Back
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">{inv.invoiceNo}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {inv.vendor} · {formatDate(inv.invoiceDate)}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-8 py-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">

            {/* Status */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <SectionLabel>Status</SectionLabel>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge value={inv.status} />
                <Badge value={inv.validation} />
                <Badge value={inv.source} />
              </div>
              {inv.validationNotes && (
                <div className={`text-sm px-4 py-3 rounded-xl border leading-relaxed ${
                  inv.validation === "valid"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : inv.validation === "invalid"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}>
                  <span className="font-semibold block mb-1 text-xs uppercase tracking-wider">
                    Validation Notes
                  </span>
                  {inv.validationNotes}
                </div>
              )}
            </div>

            {/* Info + Bank side by side */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <SectionLabel>Invoice Info</SectionLabel>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="Invoice Date" value={formatDate(inv.invoiceDate)} />
                  <Field
                    label="Due Date"
                    value={formatDate(inv.dueDate)}
                    danger={isOverdue(inv.dueDate, inv.status)}
                  />
                  <Field label="Date Received" value={formatDate(inv.dateReceived)} />
                  {inv.paidDate && (
                    <Field label="Paid Date" value={formatDate(inv.paidDate)} />
                  )}
                  <Field label="PO Number" value={inv.poNumber || "—"} mono />
                  <Field label="Bill To" value={inv.billTo} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <SectionLabel>Bank Details</SectionLabel>
                <div className="grid grid-cols-1 gap-y-5">
                  <Field label="Bank" value={inv.bank || "—"} />
                  <Field label="Account Name" value={inv.accountName || "—"} />
                  <Field label="Account No" value={inv.accountNo || "—"} mono />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <SectionLabel>Items ({inv.items?.length ?? (inv as any).itemsCount ?? 0})</SectionLabel>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Description", "Qty", "Price", "Total"].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 px-3 text-slate-400 font-normal text-xs"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(inv.items || []).map((item: InvoiceItem, i: number) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-3 px-3 text-slate-700">{item.description}</td>
                      <td className="py-3 px-3 text-slate-500">{item.quantity}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {formatCurrency(item.unitPrice, inv.currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatCurrency(item.total, inv.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex flex-col items-end gap-1.5 text-sm mt-5">
                <TotalRow label="Subtotal" value={formatCurrency(inv.subtotal, inv.currency)} />
                <TotalRow label="Shipping" value={formatCurrency(inv.shipping, inv.currency)} />
                <TotalRow label="Tax" value={formatCurrency(inv.tax, inv.currency)} />
                <div className="border-t border-slate-100 pt-2 mt-1">
                  <span className="text-base font-semibold text-slate-800">
                    Grand Total{" "}
                    <span className="font-mono">
                      {formatCurrency(inv.grandTotal, inv.currency)}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <SectionLabel>Attachments ({attachments.length})</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  {attachments.map((att) => {
                    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(att.filename);
                    return (
                      <div key={att._id} className="border border-slate-100 rounded-xl overflow-hidden">
                        {isImage ? (
                          <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={att.fileUrl}
                              alt={att.originalName}
                              className="w-full object-cover max-h-64 hover:opacity-90 transition-opacity"
                            />
                          </a>
                        ) : (
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            <span>📄</span>
                            <span className="truncate flex-1">{att.originalName}</span>
                            {att.fileType && (
                              <span className="text-[11px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full shrink-0">
                                {att.fileType}
                              </span>
                            )}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-4">
      {children}
    </p>
  );
}

function Field({
  label,
  value,
  mono,
  danger,
}: {
  label: string;
  value: string;
  mono?: boolean;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-sm ${mono ? "font-mono" : ""} ${danger ? "text-red-500 font-medium" : "text-slate-700"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-slate-400">
      {label} <span className="font-mono text-slate-600">{value}</span>
    </span>
  );
}