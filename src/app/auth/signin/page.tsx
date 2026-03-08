"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("dev@example.com");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("credentials", {
      email,
      password: "dummy",
      callbackUrl: "/dashboard",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg border-2 border-gray-300 bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">
          Cortex OS - ログイン
        </h1>
        <p className="mb-4 text-sm text-gray-700">
          開発用：任意のメールアドレスでログインできます
        </p>
        <div className="mb-6 rounded bg-gray-50 p-4 text-sm">
          <p className="mb-2 font-semibold text-gray-900">テストアカウント:</p>
          <ul className="space-y-1 text-gray-700">
            <li>
              <strong>STAFF:</strong> staff@example.com
            </li>
            <li>
              <strong>LEAD:</strong> lead@example.com
            </li>
            <li>
              <strong>MANAGER:</strong> manager@example.com
            </li>
          </ul>
          <p className="mt-2 text-xs text-gray-600">
            ※パスワードは不要です（開発環境のみ）
          </p>
        </div>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border-2 border-gray-400 p-3 text-base focus:border-black focus:outline-none"
              placeholder="dev@example.com"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-black py-3 text-base font-semibold text-white hover:bg-gray-800"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
