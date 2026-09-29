"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Invalid email or password."
        );
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem(
        "auth_user",
        JSON.stringify(data.user)
      );

if (data.user.role === "OWNER") {
  router.push("/admin");
} else if (data.user.role === "RESTAURANT_ADMIN") {
  if (!data.user.restaurant_id) {
    throw new Error(
      "Your account is not assigned to a restaurant."
    );
  }

  const restaurantResponse = await fetch(
    `${API_URL}/api/restaurants/${data.user.restaurant_id}`
  );

  if (!restaurantResponse.ok) {
    throw new Error(
      "Unable to load your assigned restaurant."
    );
  }

  const restaurant = await restaurantResponse.json();

  router.push(`/admin/${restaurant.slug}`);
} else {
  throw new Error(
    "Your account does not have a valid admin role."
  );
}
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm text-white/50 uppercase tracking-[0.25em]">
            DesiTrue
          </p>

          <h1 className="mt-3 text-4xl font-semibold">
            Admin Login
          </h1>

          <p className="mt-2 text-white/50">
            Sign in to manage your food truck.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm text-white/70 mb-2"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="admin@desitrue.com"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-white/30"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm text-white/70 mb-2"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-white/30"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}