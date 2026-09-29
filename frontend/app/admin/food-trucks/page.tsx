"use client";

import { useEffect, useState } from "react";

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

type RestaurantForm = {
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  phone: string;
  address: string;
  currency: string;
  tax_percentage: string;
  is_active: boolean;
};

const emptyForm: RestaurantForm = {
  name: "",
  slug: "",
  description: "",
  logo_url: "",
  phone: "",
  address: "",
  currency: "INR",
  tax_percentage: "0",
  is_active: true,
};

export default function FoodTrucksPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<RestaurantForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/restaurants/`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch food trucks");
      }

      const data = await response.json();
      setRestaurants(data);
    } catch (error) {
      console.error("Food trucks error:", error);
      alert("Failed to load food trucks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleChange = (
    field: keyof RestaurantForm,
    value: string | boolean
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (restaurant: Restaurant) => {
    setEditingId(restaurant.id);

    setForm({
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description || "",
      logo_url: restaurant.logo_url || "",
      phone: restaurant.phone || "",
      address: restaurant.address || "",
      currency: restaurant.currency,
      tax_percentage: String(restaurant.tax_percentage),
      is_active: restaurant.is_active,
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveRestaurant = async () => {
    if (!form.name.trim()) {
      alert("Food truck name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || null,
        logo_url: form.logo_url.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        currency: form.currency.trim() || "INR",
        tax_percentage: Number(form.tax_percentage) || 0,
        is_active: form.is_active,
      };

      const url = editingId
        ? `${API_URL}/api/restaurants/${editingId}`
        : `${API_URL}/api/restaurants/`;

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to save food truck."
        );
      }

      await fetchRestaurants();
      closeForm();
    } catch (error) {
      console.error("Save restaurant error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save food truck."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (restaurant: Restaurant) => {
    try {
      const response = await fetch(
        `${API_URL}/api/restaurants/${restaurant.id}/status?is_active=${!restaurant.is_active}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update status."
        );
      }

      await fetchRestaurants();
    } catch (error) {
      console.error("Status update error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update status."
      );
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <header className="bg-black text-white px-6 py-5 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h1 className="text-2xl font-bold">
                Food Trucks
              </h1>

              <p className="text-gray-400 text-sm mt-1">
                Manage restaurants and business configuration
              </p>
            </div>

            {/* ADMIN NAVIGATION */}

            <nav className="flex items-center gap-2 flex-wrap">

              <button
                onClick={() => {
                  window.location.href = "/admin";
                }}
                className="px-4 py-2 rounded-lg border border-gray-700 text-white text-sm font-medium hover:bg-gray-800 transition"
              >
                Orders
              </button>

              <button
                onClick={() => {
                  window.location.href = "/admin/coupons";
                }}
                className="px-4 py-2 rounded-lg border border-gray-700 text-white text-sm font-medium hover:bg-gray-800 transition"
              >
                Coupons
              </button>

              <button
                onClick={() => {
                  window.location.href = "/admin/campaigns";
                }}
                className="px-4 py-2 rounded-lg border border-gray-700 text-white text-sm font-medium hover:bg-gray-800 transition"
              >
                Campaigns
              </button>

              <button
                className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-200 transition"
              >
                Food Trucks
              </button>

            </nav>

          </div>

        </div>
      </header>

      {/* ===================================================== */}
      {/* MAIN */}
      {/* ===================================================== */}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* PAGE HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Your Food Trucks
            </h2>

            <p className="text-gray-500 mt-1">
              Add and configure food trucks without changing
              application code.
            </p>
          </div>

          <button
            onClick={openCreateForm}
            className="px-5 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition"
          >
            + Add Food Truck
          </button>

        </div>

        {/* ===================================================== */}
        {/* LOADING */}
        {/* ===================================================== */}

        {loading ? (

          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-gray-500">
              Loading food trucks...
            </p>
          </div>

        ) : restaurants.length === 0 ? (

          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-gray-500">
              No food trucks configured yet.
            </p>

            <button
              onClick={openCreateForm}
              className="mt-4 px-5 py-2 rounded-lg bg-black text-white"
            >
              Add your first food truck
            </button>
          </div>

        ) : (

          /* =================================================== */
          /* RESTAURANT CARDS */
          /* =================================================== */

          <div className="grid md:grid-cols-2 gap-6">

            {restaurants.map((restaurant) => (

              <div
                key={restaurant.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >

                {/* CARD HEADER */}

                <div className="p-6 border-b border-gray-100">

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-center gap-4">

                      {restaurant.logo_url ? (

                        <img
                          src={restaurant.logo_url}
                          alt={restaurant.name}
                          className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                        />

                      ) : (

                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-500">
                          {restaurant.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                      )}

                      <div>

                        <h3 className="text-lg font-semibold text-gray-900">
                          {restaurant.name}
                        </h3>

                        <p className="text-sm text-gray-500">
                          /{restaurant.slug}
                        </p>

                      </div>

                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
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

                </div>

                {/* DETAILS */}

                <div className="p-6 space-y-4">

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Description
                    </p>

                    <p className="text-sm text-gray-800 mt-1">
                      {restaurant.description ||
                        "No description added."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500">
                        Currency
                      </p>

                      <p className="font-semibold text-gray-900 mt-1">
                        {restaurant.currency}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500">
                        Tax
                      </p>

                      <p className="font-semibold text-gray-900 mt-1">
                        {restaurant.tax_percentage}%
                      </p>
                    </div>

                  </div>

                  {restaurant.phone && (
                    <div>
                      <p className="text-xs text-gray-500">
                        Phone
                      </p>

                      <p className="text-sm text-gray-800 mt-1">
                        {restaurant.phone}
                      </p>
                    </div>
                  )}

                  {restaurant.address && (
                    <div>
                      <p className="text-xs text-gray-500">
                        Address
                      </p>

                      <p className="text-sm text-gray-800 mt-1">
                        {restaurant.address}
                      </p>
                    </div>
                  )}

                </div>

                {/* ACTIONS */}

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">

                  <button
                    onClick={() =>
                      openEditForm(restaurant)
                    }
                    className="flex-1 px-4 py-2.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      toggleStatus(restaurant)
                    }
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                      restaurant.is_active
                        ? "border border-red-200 text-red-600 hover:bg-red-50"
                        : "border border-green-200 text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {restaurant.is_active
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* ===================================================== */}
      {/* CREATE / EDIT MODAL */}
      {/* ===================================================== */}

      {showForm && (

        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* MODAL HEADER */}

            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId
                    ? "Edit Food Truck"
                    : "Add Food Truck"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Configure the business without changing code.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
              >
                ✕
              </button>

            </div>

            {/* FORM */}

            <div className="p-6 space-y-5">

              {/* NAME */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Food Truck Name *
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    handleChange(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Burger Garage"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* SLUG */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug
                </label>

                <input
                  value={form.slug}
                  onChange={(event) =>
                    handleChange(
                      "slug",
                      event.target.value
                    )
                  }
                  placeholder="burger-garage"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-black"
                />

                <p className="text-xs text-gray-400 mt-1">
                  Leave empty to generate automatically.
                </p>
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    handleChange(
                      "description",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Describe this food truck..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              {/* LOGO */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>

                <input
                  value={form.logo_url}
                  onChange={(event) =>
                    handleChange(
                      "logo_url",
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* PHONE + CURRENCY */}

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>

                  <input
                    value={form.phone}
                    onChange={(event) =>
                      handleChange(
                        "phone",
                        event.target.value
                      )
                    }
                    placeholder="+91..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>

                  <input
                    value={form.currency}
                    onChange={(event) =>
                      handleChange(
                        "currency",
                        event.target.value.toUpperCase()
                      )
                    }
                    placeholder="INR"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

              </div>

              {/* ADDRESS */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>

                <textarea
                  value={form.address}
                  onChange={(event) =>
                    handleChange(
                      "address",
                      event.target.value
                    )
                  }
                  rows={2}
                  placeholder="Food truck location..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              {/* TAX */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Percentage
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.tax_percentage}
                  onChange={(event) =>
                    handleChange(
                      "tax_percentage",
                      event.target.value
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* ACTIVE */}

              <label className="flex items-center gap-3 cursor-pointer">

                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    handleChange(
                      "is_active",
                      event.target.checked
                    )
                  }
                  className="w-4 h-4"
                />

                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Active Food Truck
                  </p>

                  <p className="text-xs text-gray-500">
                    Customers can order from active trucks.
                  </p>
                </div>

              </label>

            </div>

            {/* MODAL ACTIONS */}

            <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3">

              <button
                onClick={closeForm}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={saveRestaurant}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Save Changes"
                  : "Create Food Truck"}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}