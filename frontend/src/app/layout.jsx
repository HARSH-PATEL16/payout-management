import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = { title: "Payout Manager", description: "Payout Management MVP" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
