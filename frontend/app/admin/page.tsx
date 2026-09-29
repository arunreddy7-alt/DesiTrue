"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:8000";

type Restaurant = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
};

type AuthUser = {
  id: number;
  email: string;
  role: string;
  restaurant_id: number | null;
  is_active: boolean;
};

export default function AdminHome() {
  const router = useRouter();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  // =========================================================
  // AUTHENTICATION / AUTHORIZATION
  // =========================================================

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem("access_token");
      const storedUser = localStorage.getItem("auth_user");

      if (!token || !storedUser) {
        router.replace("/login");
        return;
      }

      try {
        const user: AuthUser = JSON.parse(storedUser);

        // -----------------------------------------------------
        // RESTAURANT ADMIN
        // -----------------------------------------------------

        if (user.role === "RESTAURANT_ADMIN") {
          if (!user.restaurant_id) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("auth_user");

            router.replace("/login");
            return;
          }

          const restaurantResponse = await fetch(
            `${API_URL}/api/restaurants/${user.restaurant_id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

          if (!restaurantResponse.ok) {
            throw new Error(
              "Unable to load your assigned restaurant."
            );
          }

          const restaurant =
            await restaurantResponse.json();

          router.replace(
            `/admin/${restaurant.slug}`
          );

          return;
        }

        // -----------------------------------------------------
        // ONLY OWNER CAN ACCESS PLATFORM ADMIN
        // -----------------------------------------------------

        if (user.role !== "OWNER") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("auth_user");

          router.replace("/login");
          return;
        }

        // Owner is allowed to continue.
        setAuthChecking(false);
      } catch (error) {
        console.error(
          "Authentication error:",
          error
        );

        localStorage.removeItem("access_token");
        localStorage.removeItem("auth_user");

        router.replace("/login");
      }
    };

    checkAuthentication();
  }, [router]);

  // =========================================================
  // LOAD RESTAURANTS
  // =========================================================

  useEffect(() => {
    if (authChecking) {
      return;
    }

    const loadRestaurants = async () => {
      try {
        const token =
          localStorage.getItem("access_token");

        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/restaurants/`,
          {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("auth_user");

          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Failed to load restaurants."
          );
        }

        const data = await response.json();

        setRestaurants(data);
      } catch (error) {
        console.error(
          "Restaurant loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, [authChecking, router]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_user");

    router.replace("/login");
  };

  // =========================================================
  // AUTH LOADING
  // =========================================================

  if (authChecking) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Checking authentication...
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // PLATFORM ADMIN
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <header className="bg-black px-6 py-6 text-white shadow-lg">
        <div className="mx-auto max-w-7xl">

          <div className="flex items-start justify-between gap-6">

            <div>
              <p className="text-sm text-gray-400">
                Platform Administration
              </p>

              <h1 className="mt-1 text-3xl font-bold">
                Food Commerce Admin
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Manage food trucks and platform-wide
                operations.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-black"
            >
              Logout
            </button>

          </div>

        </div>
      </header>

      {/* ===================================================== */}
      {/* MAIN CONTENT */}
      {/* ===================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* =================================================== */}
        {/* FOOD TRUCKS */}
        {/* =================================================== */}

        <div className="mb-8 flex items-end justify-between gap-6">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Food Trucks
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose a business workspace.
            </p>
          </div>

          <button
            onClick={() => {
              router.push("/admin/food-trucks");
            }}
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Manage Food Trucks
          </button>

        </div>

        {/* =================================================== */}
        {/* RESTAURANT LIST */}
        {/* =================================================== */}

        {loading ? (

          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              Loading food trucks...
            </p>
          </div>

        ) : restaurants.length === 0 ? (

          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

            <p className="text-gray-500">
              No food trucks configured.
            </p>

            <button
              onClick={() => {
                router.push("/admin/food-trucks");
              }}
              className="mt-4 rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white"
            >
              Add Food Truck
            </button>

          </div>

        ) : (

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {restaurants.map((restaurant) => (

              <button
                key={restaurant.id}
                onClick={() => {
                  router.push(
                    `/admin/${restaurant.slug}`
                  );
                }}
                className="group rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-2xl">

                    {restaurant.logo_url ? (
                      <img
                        src={restaurant.logo_url}
                        alt={restaurant.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "🍔"
                    )}

                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      restaurant.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {restaurant.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>

                </div>

                <h3 className="mt-5 text-xl font-bold text-gray-900">
                  {restaurant.name}
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  /{restaurant.slug}
                </p>

                {restaurant.description && (
                  <p className="mt-4 text-sm leading-6 text-gray-500">
                    {restaurant.description}
                  </p>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">

                  <span className="text-sm font-medium text-gray-900">
                    Open Dashboard
                  </span>

                  <span className="text-gray-400 transition group-hover:translate-x-1">
                    →
                  </span>

                </div>

              </button>

            ))}

          </div>

        )}

        {/* =================================================== */}
        {/* PLATFORM FEATURES */}
        {/* =================================================== */}

        <section className="mt-12">

          <h2 className="text-xl font-bold text-gray-900">
            Platform Features
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Global configuration and automation tools.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* FOOD TRUCKS */}

            <button
              onClick={() => {
                router.push("/admin/food-trucks");
              }}
              className="rounded-2xl border bg-white p-5 text-left hover:shadow-sm"
            >
              <div className="text-2xl">
                🏪
              </div>

              <h3 className="mt-3 font-semibold">
                Food Trucks
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Manage businesses and configuration.
              </p>
            </button>

            {/* CAMPAIGNS */}

            <button
              onClick={() => {
                router.push("/admin/campaigns");
              }}
              className="rounded-2xl border bg-white p-5 text-left hover:shadow-sm"
            >
              <div className="text-2xl">
                📢
              </div>

              <h3 className="mt-3 font-semibold">
                Campaigns
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Manage customer campaigns.
              </p>
            </button>

            {/* COUPONS */}

            <button
              onClick={() => {
                router.push("/admin/coupons");
              }}
              className="rounded-2xl border bg-white p-5 text-left hover:shadow-sm"
            >
              <div className="text-2xl">
                🎟️
              </div>

              <h3 className="mt-3 font-semibold">
                Coupons
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Manage discounts and offers.
              </p>
            </button>

            {/* WHATSAPP */}

            <button
              onClick={() => {
                router.push("/whatsapp");
              }}
              className="rounded-2xl border bg-white p-5 text-left hover:shadow-sm"
            >
              <div className="text-2xl">
                📱
              </div>

              <h3 className="mt-3 font-semibold">
                WhatsApp
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Open the WhatsApp simulator.
              </p>
            </button>

          </div>

        </section>

      </div>
    </main>
  );
}