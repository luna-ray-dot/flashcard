"use client";

import Link from "next/link";
import { ChartBar, Users, Layers, Database } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gradient-to-b from-indigo-950/90 via-purple-950/80 to-pink-950/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] p-6 h-screen hidden md:flex flex-col">
      {/* Title */}
      <h2 className="text-3xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-pink tracking-wide">
        RHIBMS
      </h2>

      {/* Navigation */}
      <ul className="space-y-4 flex-1">
        <li>
          <Link
            href="/users"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-semibold text-white/80 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(79,209,255,0.6)] transition-all duration-300"
          >
            <Users className="w-5 h-5 text-neon-blue" />
            Users
          </Link>
        </li>
        <li>
          <Link
            href="/cards"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-semibold text-white/80 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(244,114,182,0.7)] transition-all duration-300"
          >
            <Layers className="w-5 h-5 text-neon-pink" />
            Cards
          </Link>
        </li>
        <li>
          <Link
            href="/knowledge-graph"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-semibold text-white/80 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(79,209,255,0.6)] transition-all duration-300"
          >
            <Database className="w-5 h-5 text-neon-blue" />
            Knowledge Graph
          </Link>
        </li>
        <li>
          <Link
            href="/analytics"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-semibold text-white/80 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(244,114,182,0.7)] transition-all duration-300"
          >
            <ChartBar className="w-5 h-5 text-neon-pink" />
            Analytics
          </Link>
        </li>
      </ul>

      {/* Footer / Brand */}
      <div className="mt-10 text-sm text-center text-white/40">
        © {new Date().getFullYear()} RHIBMS
      </div>
    </aside>
  );
}
