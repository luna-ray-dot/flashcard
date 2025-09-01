'use client';

import { useState } from 'react';
import { login } from '../auth/auth';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900 relative overflow-hidden">
      {/* Neon Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(-45deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:40px_40px] animate-pulse"></div>

      {/* Floating Orbs */}
      <div className="absolute w-72 h-72 bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-20 left-10"></div>
      <div className="absolute w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 bottom-20 right-10"></div>

      {/* Card */}
      <div className="relative bg-black/30 backdrop-blur-2xl border border-cyan-400/30 shadow-[0_0_25px_rgba(0,255,255,0.3)] rounded-3xl p-10 max-w-md w-full z-10">
        <h2 className="text-5xl font-extrabold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400 drop-shadow-[0_0_20px_rgba(0,255,255,0.7)]">
          Login
        </h2>

        {error && (
          <p className="mb-4 text-center text-red-400 font-medium animate-pulse">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-cyan-200 tracking-wide">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 text-cyan-100 border border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition shadow-[0_0_15px_rgba(0,255,255,0.2)]"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-cyan-200 tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 text-cyan-100 border border-fuchsia-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition shadow-[0_0_15px_rgba(255,0,255,0.2)]"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all transform hover:scale-105"
          >
            Authenticate
          </button>
        </form>

        <p className="mt-8 text-center text-gray-300">
          No account?{' '}
          <Link
            href="/register"
            className="text-fuchsia-400 hover:text-cyan-400 font-semibold underline transition-all"
          >
            Register now
          </Link>
        </p>
      </div>

      {/* Blob Animation Keyframes */}
      <style jsx global>{`
        .animate-blob {
          animation: blob 8s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
