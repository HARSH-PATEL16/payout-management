const STYLES = {
  Draft: "bg-gray-100 text-gray-600",
  Submitted: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
