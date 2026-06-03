"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DeliveryOrderListItem } from "@/types";
import { Sidebar } from "@/components/Sidebar";

export function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const COLUMNS = ["Doc ID", "PO Reference", "Sender", "Recipient", "Delivery Date", "Total"];

export default function DeliveryOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<DeliveryOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [userName, setUserName] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const params = new URLSearchParams({
      page: String(page),
      limit: "15",
      ...(search && { search }),
    });

    try {
      const res = await fetch(`/api/delivery-orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setOrders(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch {
      setError("Failed to load delivery orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search, router]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) setUserName(JSON.parse(user).name);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [search]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar active="delivery-orders" userName={userName} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">Delivery Orders</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {total} record{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex items-center gap-3 shrink-0">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base select-none pointer-events-none">
              ⌕
            </span>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3.5 py-2 text-sm text-slate-700 placeholder-slate-300 outline-none focus:border-indigo-400 focus:bg-white transition-colors"
              placeholder="Search doc ID, PO ref, sender, recipient…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg shrink-0">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 h-64 text-slate-400 text-sm">
              <span className="spinner" style={{ width: 22, height: 22 }} />
              Loading delivery orders…
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 h-64 text-slate-400">
              <span className="text-4xl opacity-30">📦</span>
              <p className="font-semibold text-slate-500">No delivery orders found</p>
              <p className="text-xs text-slate-400">
                {search ? "Try adjusting your search" : "Create one via POST /api/delivery-orders"}
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
                {orders.map((order, i) => (
                  <tr
                    key={order._id}
                    onClick={() => router.push(`/delivery-orders/${order._id}`)}
                    className="border-b border-slate-100 hover:bg-indigo-50/40 transition-colors cursor-pointer"
                    style={{ animationDelay: `${i * 18}ms` }}
                  >
                    <td className="px-4 py-3 font-mono text-indigo-500 text-xs whitespace-nowrap font-semibold">
                      {order.docId}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap font-mono">
                      {order.poReference || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap max-w-[160px] truncate">
                      {order.sender.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap max-w-[160px] truncate">
                      {order.recipient.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {formatDate(order.deliveryDate)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800 whitespace-nowrap">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
