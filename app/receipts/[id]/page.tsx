"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { formatCurrency, formatDate } from "@/app/invoices/page";
import { ComparisonModal } from "@/components/ComparisonModal";

type Attachment = {
  _id: string;
  filename: string;
  fileUrl: string;
  originalName: string;
  fileType?: "original" | "converted";
};

type Mismatch = {
  index?: number;
  field: string;
  invoiceValue: string;
  receiptValue: string;
  reason: string;
};

type ComparisonAttachments = {
  receipt: Attachment | null;
  invoice: Attachment | null;
};

export default function ReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/receipts/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  const mismatches: Mismatch[] = data?.mismatches || [];
  const attachments: Attachment[] = data?.attachments || [];
  const comparison: ComparisonAttachments = data?.comparisonAttachments ?? {
    receipt: null,
    invoice: null,
  };

  const getMismatch = (index: number, field: string) =>
    mismatches.find((m) => Number(m.index) === index && m.field === field);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-400 text-sm">
        Receipt not found.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar — sama seperti receipts/page.tsx */}
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
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-sm font-medium transition-colors w-full text-left bg-transparent border-none"
          >
            <span>⊞</span> Invoices
          </button>
          <button
            onClick={() => router.push("/receipts")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-semibold w-full text-left bg-transparent border-none"
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
            <h1 className="text-lg font-bold tracking-tight text-slate-800">{data.receiptNo}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {data.vendor} · {formatDate(data.receiptDate)}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-8 py-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">

            {/* Status */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <SectionLabel>Status</SectionLabel>
              <div className="flex gap-2 mb-4">
                <Badge value={data.status} />
                <Badge value={data.validation} />
              </div>
              {data.status === "FLAGGED" && (
                <button
                  onClick={() => setComparisonOpen(true)}
                  className="w-full text-left text-sm px-4 py-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-800 flex items-center gap-2 hover:bg-amber-100 transition-colors"
                >
                  <span>⚠️ Mismatch detected — click to compare documents</span>
                  <span className="ml-auto text-xs">→</span>
                </button>
              )}
            </div>

            {/* Info + Bank side by side */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <SectionLabel>Receipt Info</SectionLabel>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="Receipt Date" value={formatDate(data.receiptDate)} />
                  <Field label="Date Received" value={formatDate(data.dateReceived)} />
                  <Field label="Vendor" value={data.vendor} />
                  <Field label="Bill To" value={data.billTo} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <SectionLabel>Bank Details</SectionLabel>
                <div className="grid grid-cols-1 gap-y-5">
                  <Field label="Bank" value={data.bank || "—"} />
                  <Field label="Account Name" value={data.accountName || "—"} />
                  <Field label="Account No" value={data.accountNo || "—"} mono />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <SectionLabel>Items ({data.items?.length ?? 0})</SectionLabel>
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
                  {(data.items || []).map((item: any, i: number) => {
                    const descMismatch = getMismatch(i, "description");
                    const qtyMismatch = getMismatch(i, "quantity");
                    const priceMismatch = getMismatch(i, "unitPrice");
                    const totalMismatch = getMismatch(i, "total");

                    return (
                      <tr key={i} className="border-b border-slate-50">
                        <td className={`py-3 px-3 ${descMismatch ? "text-red-500 font-medium" : "text-slate-700"}`}>
                          {item.description}
                          {descMismatch && (
                            <p className="text-[11px] text-red-400 mt-0.5 font-normal">
                              {descMismatch.reason}
                            </p>
                          )}
                        </td>
                        <td className={`py-3 px-3 ${qtyMismatch ? "text-red-500" : "text-slate-500"}`}>
                          {item.quantity}
                        </td>
                        <td className={`py-3 px-3 ${priceMismatch ? "text-red-500" : "text-slate-500"}`}>
                          {formatCurrency(item.unitPrice, data.currency)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono ${totalMismatch ? "text-red-500" : "text-slate-600"}`}>
                          {formatCurrency(item.total, data.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex flex-col items-end gap-1.5 text-sm mt-5">
                <TotalRow label="Subtotal" value={formatCurrency(data.subtotal, data.currency)} />
                <TotalRow label="Shipping" value={formatCurrency(data.shipping, data.currency)} />
                <TotalRow label="Tax" value={formatCurrency(data.tax, data.currency)} />
                <div className="border-t border-slate-100 pt-2 mt-1">
                  <span className="text-base font-semibold text-slate-800">
                    Grand Total{" "}
                    <span className="font-mono">{formatCurrency(data.grandTotal, data.currency)}</span>
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

      {/* Comparison Modal */}
      {comparisonOpen && (
        <ComparisonModal
          mismatches={mismatches}
          comparison={comparison}
          onClose={() => setComparisonOpen(false)}
        />
      )}
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

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-sm ${mono ? "font-mono" : ""} text-slate-700`}>{value || "—"}</p>
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