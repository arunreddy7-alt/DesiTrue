"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_URL = "http://localhost:8000";

type Restaurant = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
  tax_percentage: number;
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
    title: "Feedback",
    description:
      "Review customer feedback and AI analysis.",
    icon: "⭐",
    path: "feedback",
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
    title: "Food Truck Settings",
    description:
      "Manage restaurant identity, tax, contact and status.",
    icon: "⚙️",
    path: "settings",
  },
];

export default function RestaurantAdminHome() {
  const params = useParams();

  const restaurantSlug = String(
    params.restaurantSlug
  );

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/restaurants/`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load restaurant."
          );
        }

        const restaurants: Restaurant[] =
          await response.json();

        const selectedRestaurant =
          restaurants.find(
            (item) =>
              item.slug === restaurantSlug
          );

        if (!selectedRestaurant) {
          throw new Error(
            "Restaurant not found."
          );
        }

        setRestaurant(selectedRestaurant);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurant();
  }, [restaurantSlug]);

  const openFeature = (path: string) => {
    if (path === "orders") {
      window.location.href =
        `/admin/${restaurantSlug}/orders`;
      return;
    }

    if (path === "menu") {
      window.location.href =
        `/admin/menu?restaurant=${restaurantSlug}`;
      return;
    }

    if (path === "whatsapp") {
      window.location.href =
        `/whatsapp?restaurant=${restaurantSlug}`;
      return;
    }

    if (path === "feedback") {
      window.location.href =
        `/admin/${restaurantSlug}/feedback`;
      return;
    }

    if (path === "coupons") {
      window.location.href =
        `/admin/coupons?restaurant=${restaurantSlug}`;
      return;
    }

    if (path === "campaigns") {
      window.location.href =
        `/admin/campaigns?restaurant=${restaurantSlug}`;
      return;
    }

    if (path === "settings") {
      window.location.href =
        `/admin/food-trucks`;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">
          Loading admin...
        </p>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-bold">
            Restaurant not found
          </h1>

          <button
            onClick={() => {
              window.location.href =
                "/admin";
            }}
            className="mt-5 rounded-xl bg-black px-5 py-3 text-white"
          >
            Back to Admin
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
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
                  window.location.href =
                    "/admin";
                }}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800"
              >
                All Food Trucks
              </button>

              <button
                onClick={() => {
                  window.location.href =
                    `/admin/${restaurantSlug}/orders`;
                }}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
              >
                Orders
              </button>
            </div>

          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {restaurant.name} Dashboard
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Everything for this food truck in one place.
          </p>
        </div>

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
                window.location.href =
                  "/admin/food-trucks";
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