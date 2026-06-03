"use client";

import { useRouter } from "next/navigation";

export type SidebarActive = "invoices" | "receipts" | "delivery-orders";

interface SidebarProps {
  active: SidebarActive;
  userName?: string;
  onLogout?: () => void;
}

export function Sidebar({ active, userName, onLogout }: SidebarProps) {
  const router = useRouter();

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          ◈
        </div>
        <span className="font-bold text-sm tracking-tight text-slate-800">NIP</span>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        <NavItem
          label="Invoices"
          icon={<InvoicesIcon />}
          active={active === "invoices"}
          onClick={() => router.push("/invoices")}
        />
        <NavItem
          label="Receipts"
          icon={<ReceiptsIcon />}
          active={active === "receipts"}
          onClick={() => router.push("/receipts")}
        />
        <NavItem
          label="Delivery Orders"
          icon={<DeliveryIcon />}
          active={active === "delivery-orders"}
          onClick={() => router.push("/delivery-orders")}
        />
      </nav>

      {userName && (
        <div className="p-4 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 leading-tight truncate">{userName}</p>
              <p className="text-xs text-slate-400">Member</p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors text-left cursor-pointer bg-transparent border-none"
            >
              Sign out →
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

function NavItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left border-none cursor-pointer ${
        active
          ? "bg-indigo-50 text-indigo-600 font-semibold"
          : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function InvoicesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function ReceiptsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
      <line x1="16" y1="8" x2="8" y2="8" />
      <line x1="16" y1="12" x2="8" y2="12" />
      <line x1="12" y1="16" x2="8" y2="16" />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
