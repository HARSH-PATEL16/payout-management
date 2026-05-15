"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";

export default function NewPayoutPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ vendor_id: "", amount: "", mode: "UPI", note: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.replace("/login"); return; }
    if (!loading && user?.role !== "OPS") router.replace("/payouts");
  }, [user, loading, router]);

  useEffect(() => {
    if (!token) return;
    apiFetch("/vendors", {}, token)
      .then((vs) => setVendors(vs.filter((v) => v.is_active)))
      .catch(() => {});
  }, [token]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.vendor_id) return setError("Please select a vendor");
    if (!form.amount || Number(form.amount) <= 0) return setError("Amount must be greater than 0");
    setSubmitting(true);
    try {
      const payout = await apiFetch("/payouts", {
        method: "POST",
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      }, token);
      router.push(`/payouts/${payout._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-5">
          <Link href="/payouts" className="text-sm text-gray-500 hover:text-gray-700">← Back to payouts</Link>
          <h1 className="text-lg font-semibold text-gray-900 mt-2">Create payout</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor <span className="text-red-500">*</span></label>
              <select
                name="vendor_id"
                value={form.vendor_id}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a vendor</option>
                {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode <span className="text-red-500">*</span></label>
              <div className="flex gap-3">
                {["UPI", "IMPS", "NEFT"].map((m) => (
                  <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value={m}
                      checked={form.mode === m}
                      onChange={handleChange}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm text-gray-700">{m}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Optional note or reference"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {submitting ? "Creating…" : "Create payout"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
