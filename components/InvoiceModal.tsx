"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { formatCurrency, formatDate, isOverdue } from "@/app/invoices/page";
import { InvoiceItem, InvoiceListItem } from "@/types";

export function InvoiceDetailModal({ invoiceId, onClose }: {
  invoiceId: string;
  onClose: () => void;
}) {
  const [inv, setInv] = useState<InvoiceListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setInv)
      .finally(() => setLoading(false));
  }, [invoiceId]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl border border-slate-200 w-[520px] max-h-[85vh] overflow-y-auto shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading…</div>
        ) : !inv ? (
          <div className="flex items-center justify-center h-48 text-red-400 text-sm">Failed to load.</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">{inv.invoiceNo}</p>
                <p className="text-xs text-slate-400 mt-0.5">{inv.vendor} · {formatDate(inv.invoiceDate)}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none mt-0.5">✕</button>
            </div>

            <div className="px-6 py-4 flex flex-col gap-5">
              {/* Status */}
              <section>
                <Label>Status &amp; Validation</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge value={inv.status} />
                  <Badge value={inv.validation} />
                  <Badge value={inv.source} />
                </div>
                {/* validationNotes */}
                <div className={`text-xs px-3 py-2.5 rounded-lg border leading-relaxed ${
                  inv.validation === "valid"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : inv.validation === "invalid"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}>
                  <span className="font-semibold block mb-1">Validation Notes</span>
                  {inv.validationNotes || "—"}
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Invoice Info */}
              <section>
                <Label>Invoice Info</Label>
                <Grid>
                  <Field label="Invoice Date" value={formatDate(inv.invoiceDate)} />
                  <Field label="Due Date" value={formatDate(inv.dueDate)} danger={isOverdue(inv.dueDate, inv.status)} />
                  <Field label="PO Number" value={inv.poNumber || "—"} mono />
                  <Field label="Bill To" value={inv.billTo} />
                  <Field label="Date Received" value={formatDate(inv.dateReceived)} />
                  {inv.paidDate && <Field label="Paid Date" value={formatDate(inv.paidDate)} />}
                </Grid>
              </section>

              <hr className="border-slate-100" />

              {/* Items */}
              <section>
                <Label>Items ({inv.items?.length ?? inv.itemsCount})</Label>
                <table className="w-full text-xs border-collapse mb-3">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Description","Qty","Unit","Price"].map(h => (
                        <th key={h} className="text-left py-1.5 px-2 text-slate-400 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(inv.items || []).map((item: InvoiceItem, i: number) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-1.5 px-2 text-slate-700">{item.description}</td>
                        <td className="py-1.5 px-2 text-slate-500">{item.quantity}</td>
                        <td className="py-1.5 px-2 text-slate-500">{item.total}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-600">
                          {formatCurrency(item.unitPrice, inv.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex flex-col items-end gap-1 text-xs">
                  <span className="text-slate-400">Subtotal: <span className="font-mono text-slate-600">{formatCurrency(inv.subtotal, inv.currency)}</span></span>
                  <span className="text-slate-400">Shipping: <span className="font-mono text-slate-600">{formatCurrency(inv.shipping, inv.currency)}</span></span>
                  <span className="text-slate-400">Tax: <span className="font-mono text-slate-600">{formatCurrency(inv.tax, inv.currency)}</span></span>
                  <span className="text-sm font-semibold text-slate-800 border-t border-slate-100 pt-1.5 mt-1">
                    Grand Total: <span className="font-mono">{formatCurrency(inv.grandTotal, inv.currency)}</span>
                  </span>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Bank */}
              <section>
                <Label>Bank Details</Label>
                <Grid>
                  <Field label="Bank" value={inv.bank} />
                  <Field label="Account Name" value={inv.accountName} />
                  <Field label="Account No" value={inv.accountNo} mono />
                </Grid>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper sub-components
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{children}</p>;
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>;
}
function Field({ label, value, mono, danger }: { label: string; value: string; mono?: boolean; danger?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
      <p className={`text-xs ${mono ? "font-mono" : ""} ${danger ? "text-red-500 font-medium" : "text-slate-700"}`}>
        {value}
      </p>
    </div>
  );
}