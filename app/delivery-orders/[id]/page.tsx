"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { DeliveryOrderListItem } from "@/types";
import { formatCurrency, formatDate } from "@/app/delivery-orders/page";

type Attachment = {
  _id: string;
  filename: string;
  fileUrl: string;
  originalName: string;
  fileType?: "original" | "converted";
};

export default function DeliveryOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [doc, setDoc] = useState<DeliveryOrderListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/delivery-orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setDoc)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-400 text-sm">
        Delivery order not found.
      </div>
    );
  }

  const attachments: Attachment[] = (doc as any).attachments || [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar active="delivery-orders" />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-8 py-5 border-b border-slate-200 bg-white flex items-center gap-4 shadow-sm shrink-0">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-slate-600 text-sm transition-colors bg-transparent border-none cursor-pointer"
          >
            ← Back
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-slate-800">{doc.docId}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {doc.sender.name} → {doc.recipient.name} · {formatDate(doc.deliveryDate)}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-8 py-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <SectionLabel>Document Info</SectionLabel>
              <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                <Field label="Doc ID" value={doc.docId} mono />
                <Field label="PO Reference" value={doc.poReference || "—"} mono />
                <Field label="Currency" value={doc.currency} />
                <Field label="Delivery Date" value={formatDate(doc.deliveryDate)} />
                <Field label="Items" value={String(doc.items.length)} />
                <Field label="Created" value={formatDate(doc.createdAt)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <SectionLabel>Sender</SectionLabel>
                <p className="text-sm font-semibold text-slate-800 mb-1">{doc.sender.name}</p>
                <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">{doc.sender.address}</p>
                <p className="text-xs text-slate-400 mt-2">{doc.sender.phone}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <SectionLabel>Recipient</SectionLabel>
                <p className="text-sm font-semibold text-slate-800 mb-1">{doc.recipient.name}</p>
                <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">{doc.recipient.address}</p>
                <p className="text-xs text-slate-400 mt-2">{doc.recipient.phone}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <SectionLabel>Items ({doc.items.length})</SectionLabel>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["#", "SKU", "Description", "Qty", "Unit", "Unit Price", "Total"].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-slate-400 font-normal text-xs">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doc.items.map((item) => (
                    <tr key={item.lineNumber} className="border-b border-slate-50">
                      <td className="py-3 px-3 text-slate-400 text-xs">{item.lineNumber}</td>
                      <td className="py-3 px-3 font-mono text-indigo-500 text-xs">{item.sku}</td>
                      <td className="py-3 px-3 text-slate-700">{item.description}</td>
                      <td className="py-3 px-3 text-slate-500">{item.quantity}</td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{item.unit}</td>
                      <td className="py-3 px-3 text-slate-500">{formatCurrency(item.unitPrice, doc.currency)}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatCurrency(item.totalPrice, doc.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex flex-col items-end gap-1.5 text-sm mt-5">
                <TotalRow label="Subtotal" value={formatCurrency(doc.subtotal, doc.currency)} />
                <TotalRow label="Shipping Fee" value={formatCurrency(doc.shippingFee, doc.currency)} />
                <TotalRow
                  label={`Tax (${(doc.taxRate * 100).toFixed(3).replace(/\.?0+$/, "")}%)`}
                  value={formatCurrency(doc.taxAmount, doc.currency)}
                />
                <div className="border-t border-slate-100 pt-2 mt-1">
                  <span className="text-base font-semibold text-slate-800">
                    Total <span className="font-mono">{formatCurrency(doc.total, doc.currency)}</span>
                  </span>
                </div>
              </div>
            </div>

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
