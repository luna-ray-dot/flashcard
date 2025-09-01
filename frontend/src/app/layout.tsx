"use client";

import "./globals.css";
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMe, logout } from "./auth/auth";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const me = await getMe();
        setUser(me);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <html lang="en">
        <body className="flex items-center justify-center h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-[#1a1a1a] text-red-500">
          <div className="text-3xl font-bold animate-pulse tracking-wide drop-shadow-lg">
            🚀 Loading Dashboard...
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="flex h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-[#1a1a1a] text-gray-100 font-sans">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 w-72 backdrop-blur-xl bg-black/40 border-r border-red-800/40 shadow-[0_0_25px_rgba(255,0,60,0.3)] transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-500 lg:translate-x-0 lg:static lg:inset-0`}
        >
          <div className="p-6 text-3xl font-extrabold tracking-wider bg-gradient-to-r from-red-500 to-red-700 text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(255,0,60,0.7)]">
            RHIBMS
          </div>
          <nav className="mt-8 space-y-3 px-4">
            {[
              { href: "/dashboard", label: "📊 Dashboard" },
              { href: "/cards", label: "🧠 Cards" },
              { href: "/analytics", label: "📈 Analytics" },
              { href: "/upload", label: "⬆️ Upload" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 rounded-xl bg-black/30 hover:bg-red-600/20 transition-all duration-300 text-lg font-medium border border-red-900/40 shadow-md hover:shadow-[0_0_15px_rgba(255,0,60,0.6)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex flex-col flex-1">
          {/* Navbar */}
          <header className="flex items-center justify-between backdrop-blur-xl bg-black/40 shadow-lg px-8 py-4 border-b border-red-900/40">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-3xl hover:text-red-500 transition-colors"
            >
              ☰
            </button>
            <div className="hidden md:flex items-center space-x-8 text-lg font-semibold">
              <Link href="/dashboard" className="hover:text-red-500 transition-colors">Dashboard</Link>
              <Link href="/upload" className="hover:text-red-500 transition-colors">Upload</Link>
              <Link href="/analytics" className="hover:text-red-500 transition-colors">Analytics</Link>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                <img
                  src={user?.avatarUrl || "/default-avatar.png"}
                  alt="avatar"
                  className="w-11 h-11 rounded-full border-2 border-red-600 shadow-lg hover:scale-105 transition-transform"
                />
                <span className="text-lg font-semibold tracking-wide text-red-400">
                  {user?.username || "User"}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-black/70 backdrop-blur-xl rounded-xl shadow-2xl py-3 border border-red-800/40 z-20 animate-fadeIn">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-lg hover:bg-red-600/20 transition-colors rounded-lg"
                  >
                    👤 Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-lg hover:bg-red-600/20 transition-colors rounded-lg"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-10 bg-gradient-to-tr from-black via-[#0a0a0a] to-[#1a1a1a] shadow-inner rounded-tl-3xl">
            <div className="animate-fadeInUp">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
