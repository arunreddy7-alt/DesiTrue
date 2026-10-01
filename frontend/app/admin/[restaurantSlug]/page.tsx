"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = "http://localhost:8000";

type Restaurant = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;

  banner_url: string | null;
  tagline: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;

  phone: string | null;
  address: string | null;
  currency: string;
  tax_percentage: number;
  is_active: boolean;
};

type AuthUser = {
  id: number;
  email: string;
  role: string;
  restaurant_id: number | null;
  is_active: boolean;
};

const features = [
  {
    title: "Orders",
    description:
      "View incoming orders and manage preparation status.",
    icon: "📦",
    path: "orders",
  },
  {
    title: "Menu Management",
    description:
      "Manage categories, products, prices and availability.",
    icon: "🍔",
    path: "menu",
  },
  {
    title: "WhatsApp",
    description:
      "View and manage WhatsApp customer communication.",
    icon: "📱",
    path: "whatsapp",
  },
  {
    title: "Coupons",
    description:
      "Create and manage discounts and customer offers.",
    icon: "🎟️",
    path: "coupons",
  },
  {
    title: "Campaigns",
    description:
      "Create customer campaigns and WhatsApp promotions.",
    icon: "📢",
    path: "campaigns",
  },
  {
  title: "Branding",
  description:
    "Customize your restaurant logo, banner, tagline and brand colors.",
  icon: "🎨",
  path: "branding",
},
{
  title: "Recommendation Configuration",
  description:
    "Configure which products can recommend other products.",
  icon: "🤖",
  path: "recommendations",
},
{
  title: "Combos / Bundles",
  description:
    "Create and manage product combos and bundles.",
  icon: "🎁",
  path: "combos",
},
];

export default function RestaurantAdminHome() {
  const params = useParams();
  const router = useRouter();

  const restaurantSlug = String(
    params.restaurantSlug
  );

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [loading, setLoading] =
    useState(true);

  // =========================================================
  // AUTHENTICATION + RESTAURANT AUTHORIZATION
  // =========================================================

  useEffect(() => {
    const verifyAccess = async () => {
      const token =
        localStorage.getItem("access_token");

      const storedUser =
        localStorage.getItem("auth_user");

      // -----------------------------------------------------
      // NOT LOGGED IN
      // -----------------------------------------------------

      if (!token || !storedUser) {
        router.replace("/login");
        return;
      }

      try {
        const user: AuthUser =
          JSON.parse(storedUser);

        // ---------------------------------------------------
        // LOAD RESTAURANT
        // ---------------------------------------------------

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
          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "auth_user"
          );

          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Failed to load restaurants."
          );
        }

        const restaurants: Restaurant[] =
          await response.json();

        // ---------------------------------------------------
        // FIND RESTAURANT BY SLUG
        // ---------------------------------------------------

        const selectedRestaurant =
          restaurants.find(
            (item) =>
              item.slug === restaurantSlug
          );

        // ---------------------------------------------------
        // FAKE / NONEXISTENT SLUG
        // ---------------------------------------------------

        if (!selectedRestaurant) {
          router.replace("/admin");
          return;
        }

        // ---------------------------------------------------
        // INACTIVE RESTAURANT
        // ---------------------------------------------------

        if (!selectedRestaurant.is_active) {
          router.replace("/admin");
          return;
        }

        // ---------------------------------------------------
        // OWNER
        // ---------------------------------------------------

        if (user.role === "OWNER") {
          setRestaurant(selectedRestaurant);
          setLoading(false);
          return;
        }

        // ---------------------------------------------------
        // RESTAURANT ADMIN
        // ---------------------------------------------------

        if (user.role === "RESTAURANT_ADMIN") {
          if (!user.restaurant_id) {
            localStorage.removeItem(
              "access_token"
            );

            localStorage.removeItem(
              "auth_user"
            );

            router.replace("/login");
            return;
          }

          // Restaurant admin can ONLY access
          // their assigned restaurant.

          if (
            selectedRestaurant.id !==
            user.restaurant_id
          ) {
            router.replace("/admin");
            return;
          }

          setRestaurant(selectedRestaurant);
          setLoading(false);
          return;
        }

        // ---------------------------------------------------
        // UNKNOWN ROLE
        // ---------------------------------------------------

        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "auth_user"
        );

        router.replace("/login");
      } catch (error) {
        console.error(
          "Restaurant authorization error:",
          error
        );

        router.replace("/admin");
      }
    };

    verifyAccess();
  }, [restaurantSlug, router]);

  // =========================================================
  // FEATURE NAVIGATION
  // =========================================================

  const openFeature = (path: string) => {
    if (path === "orders") {
      router.push(
        `/admin/${restaurantSlug}/orders`
      );
      return;
    }

    if (path === "menu") {
      router.push(
        `/admin/menu?restaurant=${restaurantSlug}`
      );
      return;
    }

    if (path === "whatsapp") {
      router.push(
        `/whatsapp?restaurant=${restaurantSlug}`
      );
      return;
    }

    if (path === "coupons") {
      router.push(
        `/admin/coupons?restaurant=${restaurantSlug}`
      );
      return;
    }

    if (path === "campaigns") {
      router.push(
        `/admin/campaigns?restaurant=${restaurantSlug}`
      );
    }
    if (path === "branding") {
      router.push(
        `/admin/${restaurantSlug}/branding`
      );
      return;
    }
    if (path === "recommendations") {
      router.push(
        `/admin/${restaurantSlug}/recommendations`
      );
      return;
    }
    if (path === "combos") {
      router.push(
        `/admin/${restaurantSlug}/combos`
      );
      return;
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
          <p className="text-gray-500">
            Verifying restaurant access...
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // RESTAURANT NOT FOUND / ACCESS DENIED
  // =========================================================

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="rounded-2xl bg-white p-8 shadow-sm text-center">

          <h1 className="text-xl font-bold text-gray-900">
            Restaurant not available
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            You do not have access to this restaurant.
          </p>

          <button
            onClick={() => {
              router.replace("/admin");
            }}
            className="mt-5 rounded-xl bg-black px-5 py-3 text-white"
          >
            Back to Admin
          </button>

        </div>
      </main>
    );
  }

  // =========================================================
  // RESTAURANT DASHBOARD
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100">

      {/* =================================================== */}
      {/* HEADER */}
      {/* =================================================== */}

      <header className="sticky top-0 z-50 bg-black px-6 py-5 text-white shadow-lg">

        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-sm text-gray-400">
                Food Truck Admin
              </p>

              <h1 className="text-2xl font-bold">
                {restaurant.name}
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Restaurant operations & automation
              </p>

            </div>

            <div className="flex gap-2">

              <button
                onClick={() => {
                  router.push("/admin");
                }}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800"
              >
                All Food Trucks
              </button>

              <button
                onClick={() => {
                  router.push(
                    `/admin/${restaurantSlug}/orders`
                  );
                }}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
              >
                Orders
              </button>

            </div>

          </div>

        </div>

      </header>

      {/* =================================================== */}
      {/* MAIN */}
      {/* =================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-8">

          <h2 className="text-2xl font-bold text-gray-900">
            {restaurant.name} Dashboard
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Everything for this food truck in one place.
          </p>

        </div>

        {/* ================================================= */}
        {/* FEATURES */}
        {/* ================================================= */}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          {features.map((feature) => (

            <button
              key={feature.title}
              onClick={() =>
                openFeature(feature.path)
              }
              className="group rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-md"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                  {feature.icon}
                </div>

                <span className="text-gray-400 transition group-hover:translate-x-1">
                  →
                </span>

              </div>

              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {feature.description}
              </p>

            </button>

          ))}

        </div>

        {/* ================================================= */}
        {/* RESTAURANT INFORMATION */}
        {/* ================================================= */}

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Restaurant status
              </p>

              <p className="mt-1 text-lg font-semibold">
                {restaurant.is_active
                  ? "Active"
                  : "Inactive"}
              </p>

            </div>

            <div>

              <p className="text-sm text-gray-500">
                Currency
              </p>

              <p className="mt-1 text-lg font-semibold">
                {restaurant.currency}
              </p>

            </div>

            <div>

              <p className="text-sm text-gray-500">
                Tax
              </p>

              <p className="mt-1 text-lg font-semibold">
                {restaurant.tax_percentage}%
              </p>

            </div>

            <button
  onClick={() => {
    router.push(
      `/admin/food-trucks?restaurant=${restaurantSlug}`
    );
  }}
  className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium hover:bg-gray-50"
>
  Edit Restaurant
</button>

          </div>

        </div>

      </div>

    </main>
  );
}