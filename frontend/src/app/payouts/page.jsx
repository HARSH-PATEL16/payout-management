"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";

const STATUSES = ["", "Draft", "Submitted", "Approved", "Rejected"];

function formatAmount(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function PayoutsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [payouts, setPayouts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [status, setStatus] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!token) return;
    apiFetch("/vendors", {}, token).then(setVendors).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setFetching(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (vendorId) params.set("vendor_id", vendorId);
    apiFetch(`/payouts?${params}`, {}, token)
      .then(setPayouts)
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, [token, status, vendorId]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-semibold text-gray-900">Payouts</h1>
          {user?.role === "OPS" && (
            <Link
              href="/payouts/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              + New payout
            </Link>
          )}
        </div>

        <div className="flex gap-3 mb-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
          </select>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All vendors</option>
            {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
        )}

        {fetching ? (
          <div className="text-center text-gray-400 py-16 text-sm">Loading payouts…</div>
        ) : payouts.length === 0 ? (
          <div className="text-center text-gray-400 py-16 text-sm">No payouts found</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.vendor_id?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-gray-800">{formatAmount(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{p.mode}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/payouts/${p._id}`} className="text-indigo-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
