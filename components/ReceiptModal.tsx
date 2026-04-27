"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { formatCurrency, formatDate } from "@/app/invoices/page";

export function ReceiptDetailModal({
  receiptId,
  onClose,
}: {
  receiptId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/receipts/${receiptId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [receiptId]);

  const mismatches = data?.mismatches || [];

  const getMismatch = (index: number, field: string) =>
    mismatches.find(
      (m: any) =>
        Number(m.index) === index && m.field === field
    );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl border border-slate-200 w-[520px] max-h-[85vh] overflow-y-auto shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            Loading…
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-48 text-red-400 text-sm">
            Failed to load.
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">
                  {data.receiptNo}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {data.vendor} · {formatDate(data.receiptDate)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 flex flex-col gap-5">
              {/* Status */}
              <section>
                <Label>Status</Label>
                <div className="flex gap-2 mb-2">
                  <Badge value={data.status} />
                  <Badge value={data.validation} />
                </div>

                {data.status === "FLAGGED" && (
                  <div className="text-xs px-3 py-2 rounded-lg border bg-amber-50 border-amber-200 text-amber-800">
                    ⚠️ Mismatch detected
                  </div>
                )}
              </section>

              <hr className="border-slate-100" />

              {/* Receipt Info */}
              <section>
                <Label>Receipt Info</Label>
                <Grid>
                  <Field
                    label="Receipt Date"
                    value={formatDate(data.receiptDate)}
                  />
                  <Field
                    label="Date Received"
                    value={formatDate(data.dateReceived)}
                  />
                  <Field label="Vendor" value={data.vendor} />
                  <Field label="Bill To" value={data.billTo} />
                </Grid>
              </section>

              <hr className="border-slate-100" />

              {/* Items */}
              <section>
                <Label>
                  Items ({data.items?.length ?? data.itemsCount ?? 0})
                </Label>

                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Description", "Qty", "Price", "Total"].map((h) => (
                        <th
                          key={h}
                          className="text-left py-1.5 px-2 text-slate-400"
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
                          {/* Description */}
                          <td
                            className={`py-1.5 px-2 ${
                              descMismatch
                                ? "text-red-500 font-medium"
                                : "text-slate-700"
                            }`}
                          >
                            {item.description}
                            {descMismatch && (
                              <p className="text-[10px] text-red-400 mt-0.5">
                                {descMismatch.reason}
                              </p>
                            )}
                          </td>

                          {/* Qty */}
                          <td
                            className={
                              qtyMismatch
                                ? "text-red-500"
                                : "text-slate-500"
                            }
                          >
                            {item.quantity}
                          </td>

                          {/* Price */}
                          <td
                            className={
                              priceMismatch
                                ? "text-red-500"
                                : "text-slate-500"
                            }
                          >
                            {formatCurrency(
                              item.unitPrice,
                              data.currency
                            )}
                          </td>

                          {/* Total */}
                          <td
                            className={`text-right font-mono ${
                              totalMismatch
                                ? "text-red-500"
                                : "text-slate-600"
                            }`}
                          >
                            {formatCurrency(item.total, data.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* TOTALS */}
                <div className="flex flex-col items-end gap-1 text-xs mt-3">
                  <span className="text-slate-400">
                    Subtotal:{" "}
                    <span className="font-mono text-slate-600">
                      {formatCurrency(data.subtotal, data.currency)}
                    </span>
                  </span>

                  <span className="text-slate-400">
                    Shipping:{" "}
                    <span className="font-mono text-slate-600">
                      {formatCurrency(data.shipping, data.currency)}
                    </span>
                  </span>

                  <span className="text-slate-400">
                    Tax:{" "}
                    <span className="font-mono text-slate-600">
                      {formatCurrency(data.tax, data.currency)}
                    </span>
                  </span>

                  <span className="text-sm font-semibold text-slate-800 border-t pt-1.5 mt-1">
                    Grand Total:{" "}
                    <span className="font-mono">
                      {formatCurrency(data.grandTotal, data.currency)}
                    </span>
                  </span>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Bank */}
              <section>
                <Label>Bank Details</Label>
                <Grid>
                  <Field label="Bank" value={data.bank || "—"} />
                  <Field
                    label="Account Name"
                    value={data.accountName || "—"}
                  />
                  <Field
                    label="Account No"
                    value={data.accountNo || "—"}
                    mono
                  />
                </Grid>
              </section>
              {data.attachments && data.attachments.length > 0 && (
                <>
                  <hr className="border-slate-100" />
                  <section>
                    <Label>Attachments ({data.attachments.length})</Label>
                    <div className="flex flex-col gap-2">
                      {data.attachments.map((att) => {
                        const isImage = /\.(jpg|jpeg|png|webp)$/i.test(att.filename);
                        return (
                          <div key={att._id} className="border border-slate-100 rounded-lg overflow-hidden">
                            {isImage ? (
                              <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={att.fileUrl}
                                  alt={att.originalName}
                                  className="w-full object-cover max-h-48"
                                />
                              </a>
                            ) : (
                              
                                href={att.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2.5 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                <span>📄</span>
                                <span className="truncate">{att.originalName}</span>
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </>
              )}
              {/* Mismatch Summary */}
              {mismatches.length > 0 && (
                <>
                  <hr className="border-slate-100" />
                  <section>
                    <Label>Mismatch Details</Label>
                    <div className="text-xs border rounded-lg divide-y">
                      {mismatches.map((m: any, i: number) => (
                        <div key={i} className="p-2">
                          <p className="font-medium text-red-600">
                            {m.field}
                          </p>
                          <p className="text-slate-500">
                            Invoice: {m.invoiceValue}
                          </p>
                          <p className="text-slate-500">
                            Receipt: {m.receiptValue}
                          </p>
                          <p className="text-[10px] text-red-400 mt-1">
                            {m.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase text-slate-400 mb-2">
      {children}
    </p>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>;
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
      <p className={`text-xs ${mono ? "font-mono" : ""} text-slate-700`}>
        {value || "—"}
      </p>
    </div>
  );
}