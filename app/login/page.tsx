"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const body = isRegister
      ? { name: form.name, email: form.email, password: form.password }
      : { email: form.email, password: form.password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Something went wrong");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/invoices");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-200/60 p-9 animate-fade-in">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              ◈
            </div>
            <span className="font-bold text-[15px] tracking-tight text-slate-800">NIP</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-800 mb-1">
            {isRegister ? "Create account" : "Welcome back"}
          </h1>
          <p className="text-slate-400 text-sm mb-7">
            {isRegister ? "Start managing invoices" : "Sign in to your workspace"}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Full name
                </label>
                <input
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Email
              </label>
              <input
                className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Password
              </label>
              <input
                className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm shadow-indigo-200"
            >
              {loading ? <span className="spinner" /> : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer bg-transparent border-none transition-colors"
              onClick={() => { setIsRegister(!isRegister); setError(""); }}
            >
              {isRegister ? "Sign in" : "Register"}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          NIP · Invoice & Receipt Management System
        </p>
      </div>
    </div>
  );
}