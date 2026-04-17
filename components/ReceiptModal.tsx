"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { formatCurrency, formatDate } from "@/app/invoices/page";

export function ReceiptDetailModal({ receiptId, onClose }: {
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
    mismatches.find((m: any) => m.index === index && m.field === field);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl border border-slate-200 w-[520px] max-h-[85vh] overflow-y-auto shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading…</div>
        ) : !data ? (
          <div className="flex items-center justify-center h-48 text-red-400 text-sm">Failed to load.</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">{data.receiptNo}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {data.vendor} · {formatDate(data.receiptDate)}
                </p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
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

              {/* Items */}
              <section>
                <Label>Items ({data.items?.length})</Label>

                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Description","Qty","Price","Total"].map(h => (
                        <th key={h} className="text-left py-1.5 px-2 text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {data.items.map((item: any, i: number) => {
                      const descMismatch = getMismatch(i, "description");
                      const qtyMismatch = getMismatch(i, "quantity");
                      const priceMismatch = getMismatch(i, "unitPrice");
                      const totalMismatch = getMismatch(i, "total");

                      return (
                        <tr key={i} className="border-b border-slate-50">
                          
                          {/* Description */}
                          <td className={`py-1.5 px-2 ${
                            descMismatch ? "text-red-500 font-medium" : "text-slate-700"
                          }`}>
                            {item.description}
                            {descMismatch && (
                              <p className="text-[10px] text-red-400 mt-0.5">
                                {descMismatch.reason}
                              </p>
                            )}
                          </td>

                          {/* Qty */}
                          <td className={qtyMismatch ? "text-red-500" : "text-slate-500"}>
                            {item.quantity}
                          </td>

                          {/* Price */}
                          <td className={priceMismatch ? "text-red-500" : "text-slate-500"}>
                            {formatCurrency(item.unitPrice, data.currency)}
                          </td>

                          {/* Total */}
                          <td className={`text-right font-mono ${
                            totalMismatch ? "text-red-500" : "text-slate-600"
                          }`}>
                            {formatCurrency(item.total, data.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>

              <hr className="border-slate-100" />

              {/* Mismatch Detail (Summary) */}
              {mismatches.length > 0 && (
                <section>
                  <Label>Mismatch Details</Label>
                  <div className="text-xs border rounded-lg divide-y">
                    {mismatches.map((m: any, i: number) => (
                      <div key={i} className="p-2">
                        <p className="font-medium text-red-600">{m.field}</p>
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
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}

// helpers (reuse yours)
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase text-slate-400 mb-2">{children}</p>;
}