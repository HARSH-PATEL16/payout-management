"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";

const ACTION_LABELS = { CREATED: "Created", SUBMITTED: "Submitted", APPROVED: "Approved", REJECTED: "Rejected" };
const ACTION_COLORS = {
  CREATED: "bg-gray-100 text-gray-600",
  SUBMITTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

function formatAmount(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function PayoutDetailPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actioning, setActioning] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const fetchData = () => {
    if (!token || !id) return;
    setFetching(true);
    apiFetch(`/payouts/${id}`, {}, token)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  };

  useEffect(fetchData, [token, id]);

  const doAction = async (action, body = {}) => {
    setActionError("");
    setActioning(action);
    try {
      await apiFetch(`/payouts/${id}/${action}`, { method: "POST", body: JSON.stringify(body) }, token);
      setShowRejectForm(false);
      setRejectReason("");
      fetchData();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActioning("");
    }
  };

  if (loading || fetching) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="text-center text-gray-400 py-20 text-sm">Loading…</div></div>;
  if (error) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="text-center text-red-500 py-20 text-sm">{error}</div></div>;

  const { payout, audits } = data || {};
  if (!payout) return null;

  const canSubmit = user?.role === "OPS" && payout.status === "Draft";
  const canApprove = user?.role === "FINANCE" && payout.status === "Submitted";
  const canReject = user?.role === "FINANCE" && payout.status === "Submitted";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Link href="/payouts" className="text-sm text-gray-500 hover:text-gray-700">← Back to payouts</Link>
        </div>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{payout.vendor_id?.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{formatAmount(payout.amount)} · {payout.mode}</p>
          </div>
          <StatusBadge status={payout.status} />
        </div>

        {actionError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{actionError}</div>
        )}

        {/* Action buttons */}
        {(canSubmit || canApprove || canReject) && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Actions</p>
            <div className="flex flex-wrap gap-2">
              {canSubmit && (
                <button
                  onClick={() => doAction("submit")}
                  disabled={!!actioning}
                  className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition"
                >
                  {actioning === "submit" ? "Submitting…" : "Submit for review"}
                </button>
              )}
              {canApprove && (
                <button
                  onClick={() => doAction("approve")}
                  disabled={!!actioning}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {actioning === "approve" ? "Approving…" : "Approve"}
                </button>
              )}
              {canReject && !showRejectForm && (
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                >
                  Reject
                </button>
              )}
            </div>
            {showRejectForm && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (required)"
                  rows={2}
                  className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => doAction("reject", { reason: rejectReason })}
                    disabled={!rejectReason.trim() || !!actioning}
                    className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {actioning === "reject" ? "Rejecting…" : "Confirm reject"}
                  </button>
                  <button
                    onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                    className="text-gray-500 text-sm hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payout details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Details</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt className="text-gray-500">Vendor</dt><dd className="font-medium text-gray-900 mt-0.5">{payout.vendor_id?.name}</dd></div>
            <div><dt className="text-gray-500">Amount</dt><dd className="font-medium text-gray-900 mt-0.5 font-mono">{formatAmount(payout.amount)}</dd></div>
            <div><dt className="text-gray-500">Mode</dt><dd className="font-medium text-gray-900 mt-0.5">{payout.mode}</dd></div>
            <div><dt className="text-gray-500">Created by</dt><dd className="font-medium text-gray-900 mt-0.5">{payout.created_by?.name}</dd></div>
            {payout.vendor_id?.upi_id && <div><dt className="text-gray-500">UPI ID</dt><dd className="font-medium text-gray-900 mt-0.5">{payout.vendor_id.upi_id}</dd></div>}
            {payout.vendor_id?.bank_account && <div><dt className="text-gray-500">Bank account</dt><dd className="font-medium text-gray-900 mt-0.5">{payout.vendor_id.bank_account}</dd></div>}
            {payout.note && <div className="col-span-2"><dt className="text-gray-500">Note</dt><dd className="text-gray-900 mt-0.5">{payout.note}</dd></div>}
            {payout.decision_reason && (
              <div className="col-span-2">
                <dt className="text-red-500">Rejection reason</dt>
                <dd className="text-red-700 mt-0.5 bg-red-50 p-2 rounded-lg">{payout.decision_reason}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Audit trail */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Audit trail</p>
          {audits?.length === 0 ? (
            <p className="text-sm text-gray-400">No history yet</p>
          ) : (
            <div className="space-y-2">
              {audits?.map((a, i) => (
                <div key={a._id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5" />
                    {i < audits.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" style={{ minHeight: 20 }} />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_COLORS[a.action]}`}>
                        {ACTION_LABELS[a.action]}
                      </span>
                      <span className="text-sm text-gray-700">by <strong>{a.performed_by?.name}</strong></span>
                      <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                    {a.note && <p className="text-xs text-gray-500 mt-0.5">{a.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
