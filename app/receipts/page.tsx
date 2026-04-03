"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ReceiptListItem } from "@/types";
import { Badge } from "@/components/Badge";

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const COLUMNS = [
  "Date Received", "Vendor", "Receipt No", "Receipt Date", "Invoice Ref",
  "Bill To", "Items", "Subtotal", "Shipping", "Tax", "Grand Total",
  "Currency", "Payment Method", "Paid Amount", "Bank", "Account No",
  "Account Name", "Source",
];

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [userName, setUserName] = useState("");

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    const params = new URLSearchParams({
      page: String(page),
      limit: "15",
      ...(search && { search }),
      ...(sourceFilter && { source: sourceFilter }),
    });

    try {
      const res = await fetch(`/api/receipts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setReceipts(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch {
      setError("Failed to load receipts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search, sourceFilter, router]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) setUserName(JSON.parse(user).name);
  }, []);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);
  useEffect(() => { setPage(1); }, [search, sourceFilter]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            ◈
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-800">Invoicio</span>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          <button
            onClick={() => router.push("/invoices")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-sm font-medium transition-colors cursor-pointer w-full text-left bg-transparent border-none"
          >
            <span>⊞</span> Invoices
          </button>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-semibold cursor-default">
            <span>🧾</span> Receipts
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0">
              {userName.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 leading-tight truncate">{userName}</p>
              <p className="text-xs text-slate-400">Member</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors text-left cursor-pointer bg-transparent border-none"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="px-6 py-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">Receipts</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {total} record{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex items-center gap-3 shrink-0">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base select-none pointer-events-none">
              ⌕
            </span>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3.5 py-2 text-sm text-slate-700 placeholder-slate-300 outline-none focus:border-indigo-400 focus:bg-white transition-colors"
              placeholder="Search vendor, receipt no, invoice ref…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none focus:border-indigo-400 transition-colors cursor-pointer"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="">All sources</option>
            <option value="email">Email</option>
            <option value="manual">Manual</option>
            <option value="upload">Upload</option>
            <option value="api">API</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg shrink-0">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 h-64 text-slate-400 text-sm">
              <span className="spinner" style={{ width: 22, height: 22 }} />
              Loading receipts…
            </div>
          ) : receipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 h-64 text-slate-400">
              <span className="text-4xl opacity-30">🧾</span>
              <p className="font-semibold text-slate-500">No receipts found</p>
              <p className="text-xs text-slate-400">
                {search || sourceFilter
                  ? "Try adjusting your filters"
                  : "Create one via POST /api/receipts"}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                  {COLUMNS.map((col) => (
                    <th
                      key={col}
                      className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receipts.map((rec, i) => (
                  <tr
                    key={rec._id}
                    className="border-b border-slate-100 hover:bg-indigo-50/40 transition-colors animate-fade-in"
                    style={{ animationDelay: `${i * 18}ms` }}
                  >
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {formatDate(rec.dateReceived)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap max-w-[160px] truncate">
                      {rec.vendor}
                    </td>
                    <td className="px-4 py-3 font-mono text-indigo-500 text-xs whitespace-nowrap font-semibold">
                      {rec.receiptNo}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {formatDate(rec.receiptDate)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {rec.invoiceRef || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap max-w-[140px] truncate text-xs">
                      {rec.billTo}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 text-xs font-medium">
                      {rec.itemsCount}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {formatCurrency(rec.subtotal, rec.currency)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {formatCurrency(rec.shipping, rec.currency)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {formatCurrency(rec.tax, rec.currency)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800 whitespace-nowrap">
                      {formatCurrency(rec.grandTotal, rec.currency)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {rec.currency}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs font-medium">
                      {rec.paymentMethod}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-600 whitespace-nowrap">
                      {formatCurrency(rec.paidAmount, rec.currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs max-w-[120px] truncate">
                      {rec.bank || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {rec.accountNo || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap max-w-[120px] truncate text-xs">
                      {rec.accountName || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge value={rec.source} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}