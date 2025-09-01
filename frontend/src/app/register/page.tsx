'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function UserRegister() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/users/register', {
        username,
        email,
        password,
      });
      setMessage('User registered successfully!');
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error registering user.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      {/* Animated glowing orbs */}
      <div className="absolute w-80 h-80 bg-neon-pink rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse top-24 left-16"></div>
      <div className="absolute w-96 h-96 bg-neon-blue rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse bottom-24 right-16"></div>

      {/* Registration Card */}
      <div className="relative bg-[rgba(14, 60, 6, 0.05)] backdrop-blur-xl border border-[rgba(10, 239, 193, 0.2)] shadow-2xl rounded-2xl p-10 max-w-md w-full z-10">
        <h2 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-pink drop-shadow-lg">
          Create Your Account
        </h2>

        {message && (
          <p
            className={`mb-4 text-center font-medium ${
              message.includes('success')
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-200">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.1)] text-white border border-[rgba(28, 234, 169, 0.2)] focus:outline-none focus:ring-2 focus:ring-neon-blue transition"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-200">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.1)] text-white border border-[rgba(28, 234, 169, 0.2)] focus:outline-none focus:ring-2 focus:ring-neon-pink transition"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-200">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[rgba(33, 135, 50, 0.1)] text-white border border-[rgba(34, 181, 122, 0.78)] focus:outline-none focus:ring-2 focus:ring-neon-blue transition"
              placeholder="Enter password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-neon-pink to-neon-blue hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            Register
          </button>
        </form>

        <p className="mt-8 text-center text-gray-300">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-neon-pink hover:text-neon-blue font-semibold underline transition-all"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
