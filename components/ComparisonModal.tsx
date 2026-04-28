"use client";

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

type Props = {
  mismatches: Mismatch[];
  comparison: { receipt: Attachment | null; invoice: Attachment | null };
  onClose: () => void;
};

export function ComparisonModal({ mismatches, comparison, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <p className="font-semibold text-slate-800 text-base">Mismatch Details</p>
            <p className="text-xs text-slate-400 mt-0.5">{mismatches.length} mismatch{mismatches.length !== 1 ? "es" : ""} found</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none bg-transparent border-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="px-8 py-6 flex flex-col gap-6">
          {/* Document comparison */}
          {(comparison.invoice || comparison.receipt) && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Document Comparison
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(["invoice", "receipt"] as const).map((side) => {
                  const att = comparison[side];
                  return (
                    <div key={side} className="flex flex-col gap-2">
                      <p className="text-xs font-medium text-slate-500 capitalize">{side}</p>
                      {att ? (
                        <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={att.fileUrl}
                            alt={side}
                            className="w-full object-cover rounded-xl border border-slate-100 max-h-72 hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ) : (
                        <div className="flex items-center justify-center h-40 rounded-xl border border-dashed border-slate-200 text-xs text-slate-300">
                          No attachment
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mismatch list */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Fields
            </p>
            <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {mismatches.map((m, i) => (
                <div key={i} className="px-5 py-4">
                  <p className="text-sm font-medium text-red-500 mb-3">{m.field}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl px-4 py-3">
                      <p className="text-[11px] text-slate-400 mb-1">Invoice</p>
                      <p className="text-sm text-slate-700 font-medium">{m.invoiceValue}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl px-4 py-3">
                      <p className="text-[11px] text-red-300 mb-1">Receipt</p>
                      <p className="text-sm text-red-600 font-medium">{m.receiptValue}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-red-400 mt-2">{m.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}