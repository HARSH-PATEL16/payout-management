"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const ROLE_COLORS = { OPS: "bg-amber-100 text-amber-800", FINANCE: "bg-teal-100 text-teal-800" };

export default function Navbar() {
  const { user, logout } = useAuth();
  const path = usePathname();

  const nav = [
    { href: "/payouts", label: "Payouts" },
    { href: "/vendors", label: "Vendors" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 flex items-center h-14 gap-6">
        <span className="font-semibold text-gray-900 text-sm">Payout Manager</span>
        <div className="flex gap-1 flex-1">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                path.startsWith(href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user.name}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>
              {user.role}
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-800 transition"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
