"use client";

import React, { useEffect, useState } from "react";
const API_URL = "http://localhost:8000";

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

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

  // Admin credentials — used only when creating
  admin_email: string;
  admin_password: string;
  admin_password_confirm: string;
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

  admin_email: "",
  admin_password: "",
  admin_password_confirm: "",
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] =
    useState<Restaurant | null>(null);

  const [form, setForm] = useState<RestaurantForm>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  // =========================================================
  // AUTH / FORM HELPERS
  // =========================================================

  const handleUnauthorized = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_user");
    window.location.href = "/login";
  };

  const handleChange = (
    field: keyof RestaurantForm,
    value: string | boolean
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =========================================================
  // FETCH RESTAURANTS
  // =========================================================

  const fetchRestaurants = async () => {
    try {
      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`${API_URL}/api/restaurants/`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("auth_user");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch food trucks");
      }

      const data = await response.json();
      setRestaurants(data);
    } catch (error) {
      console.error("Restaurants error:", error);
      alert("Failed to load food trucks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // =========================================================
  // FORM HELPERS
  // =========================================================

  const updateField = (
    field: keyof RestaurantForm,
    value: string | boolean
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingRestaurant(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);

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

  admin_email: "",
  admin_password: "",
  admin_password_confirm: "",
});

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingRestaurant(null);
    setForm(emptyForm);
  };

  // =========================================================
  // CREATE / UPDATE RESTAURANT
  // =========================================================

  const saveRestaurant = async () => {
    if (!form.name.trim()) {
      alert("Food truck name is required.");
      return;
    }
    if (!editingRestaurant) {
      if (!form.admin_email.trim()) {
        alert("Admin email is required.");
        return;
      }

      if (!form.admin_password) {
        alert("Admin password is required.");
        return;
      }

      if (form.admin_password.length < 8) {
        alert("Admin password must be at least 8 characters.");
        return;
      }

      if (form.admin_password !== form.admin_password_confirm) {
        alert("Admin passwords do not match.");
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
  name: form.name.trim(),

  slug:
    form.slug.trim() ||
    form.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),

  description: form.description.trim() || null,
  logo_url: form.logo_url.trim() || null,
  phone: form.phone.trim() || null,
  address: form.address.trim() || null,
  currency: form.currency.trim() || "INR",
  tax_percentage: Number(form.tax_percentage) || 0,
  is_active: form.is_active,

  ...(editingRestaurant
    ? {}
    : {
        admin_email: form.admin_email.trim(),
        admin_password: form.admin_password,
      }),
};

      const url = editingRestaurant
        ? `${API_URL}/api/restaurants/${editingRestaurant.id}`
        : `${API_URL}/api/restaurants/`;

      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(url, {
        method: editingRestaurant ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("auth_user");
        window.location.href = "/login";
        return;
      }

     if (!response.ok) {
  const errorData = await response.json();

  console.error("Backend error:", errorData);

  let errorMessage = "Failed to save food truck.";

  if (Array.isArray(errorData.detail)) {
    errorMessage = errorData.detail
      .map((error: any) => {
        const field = Array.isArray(error.loc)
          ? error.loc.join(".")
          : "field";

        return `${field}: ${error.msg}`;
      })
      .join("\n");
  } else if (typeof errorData.detail === "string") {
    errorMessage = errorData.detail;
  }

  throw new Error(errorMessage);
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

  // =========================================================
  // ACTIVATE / DEACTIVATE
  // =========================================================

  const toggleRestaurantStatus = async (restaurant: Restaurant) => {
    try {
      setUpdatingStatus(restaurant.id);

      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/restaurants/${restaurant.id}/status?is_active=${!restaurant.is_active}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("auth_user");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.detail || "Failed to update food truck status"
        );
      }

      await fetchRestaurants();
    } catch (error) {
      console.error("Restaurant status error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update food truck status."
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  // =========================================================
  // PAGE
  // =========================================================

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
                DesiTrue Admin
              </h1>

              <p className="text-gray-400 text-sm mt-1">
                Food truck configuration & management
              </p>
            </div>

            {/* ADMIN NAVIGATION */}

            <nav className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  window.location.href = "/admin";
                }}
                className="px-4 py-2 rounded-lg text-white border border-gray-700 text-sm font-medium hover:bg-gray-800 transition"
              >
                Orders
              </button>

              <button
                onClick={() => {
                  window.location.href = "/admin/coupons";
                }}
                className="px-4 py-2 rounded-lg text-white border border-gray-700 text-sm font-medium hover:bg-gray-800 transition"
              >
                Coupons
              </button>

              <button
                onClick={() => {
                  window.location.href = "/admin/campaigns";
                }}
                className="px-4 py-2 rounded-lg text-white border border-gray-700 text-sm font-medium hover:bg-gray-800 transition"
              >
                Campaigns
              </button>

              <button
                onClick={() => {
                  window.location.href = "/admin/restaurants";
                }}
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
              Food Trucks
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Manage restaurants, menus, pricing, taxes and
              configuration.
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
        {/* CONFIGURATION INFO */}
        {/* ===================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg">
              ⚙️
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                Configuration-driven platform
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Each food truck can have its own configuration.
                Adding another food truck does not require backend
                code changes.
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================== */}
        {/* RESTAURANT LIST */}
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
              className="mt-4 px-5 py-2.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800"
            >
              Add First Food Truck
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* CARD HEADER */}

                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-bold text-lg">
                        {restaurant.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {restaurant.name}
                        </h3>

                        <p className="text-sm text-gray-400 mt-1">
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

                  {restaurant.description && (
                    <p className="text-sm text-gray-600 mt-4">
                      {restaurant.description}
                    </p>
                  )}
                </div>

                {/* CONFIGURATION */}

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">
                        Currency
                      </p>

                      <p className="font-semibold text-gray-900 mt-1">
                        {restaurant.currency}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">
                        Tax
                      </p>

                      <p className="font-semibold text-gray-900 mt-1">
                        {restaurant.tax_percentage}%
                      </p>
                    </div>
                  </div>

                  {restaurant.phone && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500">
                        Phone
                      </p>

                      <p className="text-sm text-gray-800 mt-1">
                        {restaurant.phone}
                      </p>
                    </div>
                  )}

                  {restaurant.address && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">
                        Address
                      </p>

                      <p className="text-sm text-gray-800 mt-1">
                        {restaurant.address}
                      </p>
                    </div>
                  )}

                  {/* ACTIONS */}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() =>
                        openEditForm(restaurant)
                      }
                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 text-sm font-medium hover:bg-gray-50 transition"
                    >
                      Edit Configuration
                    </button>

                    <button
                      onClick={() =>
                        toggleRestaurantStatus(restaurant)
                      }
                      disabled={
                        updatingStatus === restaurant.id
                      }
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                        restaurant.is_active
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {updatingStatus === restaurant.id
                        ? "..."
                        : restaurant.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </div>
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
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}

            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingRestaurant
                    ? "Edit Food Truck"
                    : "Add Food Truck"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Configure restaurant-level settings.
                </p>
              </div>

              <button
                onClick={closeForm}
                disabled={saving}
                className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
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
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  placeholder="e.g. Burger Garage"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* SLUG */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug
                </label>

                <input
                  type="text"
                  value={form.slug}
                  onChange={(event) =>
                    updateField("slug", event.target.value)
                  }
                  placeholder="burger-garage"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />

                <p className="text-xs text-gray-400 mt-1">
                  Leave empty to generate automatically from the
                  name.
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
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Short description of the food truck..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none resize-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* ADMIN ACCOUNT - CREATE ONLY */}

              {!editingRestaurant && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      Admin Account
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Create the login credentials for this food truck.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Email *
                      </label>

                      <input
                        type="email"
                        value={form.admin_email}
                        onChange={(event) =>
                          updateField("admin_email", event.target.value)
                        }
                        placeholder="admin@burgergarage.com"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Password *
                      </label>

                      <input
                        type="password"
                        value={form.admin_password}
                        onChange={(event) =>
                          updateField("admin_password", event.target.value)
                        }
                        placeholder="Minimum 8 characters"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Admin Password *
                      </label>

                      <input
                        type="password"
                        value={form.admin_password_confirm}
                        onChange={(event) =>
                          updateField(
                            "admin_password_confirm",
                            event.target.value
                          )
                        }
                        placeholder="Re-enter password"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PHONE + CURRENCY */}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>

                  <input
                    type="text"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    placeholder="+91..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>

                  <input
                    type="text"
                    value={form.currency}
                    onChange={(event) =>
                      updateField(
                        "currency",
                        event.target.value.toUpperCase()
                      )
                    }
                    placeholder="INR"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>
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
                    updateField(
                      "tax_percentage",
                      event.target.value
                    )
                  }
                  placeholder="5"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* ADDRESS */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>

                <textarea
                  value={form.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                  placeholder="Food truck / restaurant address..."
                  rows={2}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none resize-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* LOGO */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>

                <div className="space-y-3">

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={async (
                      event
                    ) => {

                      const file =
                        event.target.files?.[0];

                      if (!file) {
                        return;
                      }

                      if (
                        file.size >
                        5 *
                          1024 *
                          1024
                      ) {
                        alert(
                          "Logo must be smaller than 5 MB."
                        );

                        event.target.value =
                          "";

                        return;
                      }

                      const formData =
                        new FormData();

                      formData.append(
                        "file",
                        file
                      );

                      try {

                        const token =
                          getToken();

                        if (!token) {
                          handleUnauthorized();
                          return;
                        }

                        const response =
                          await fetch(
                            `${API_URL}/api/uploads/restaurant-logo`,
                            {
                              method:
                                "POST",
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                              body:
                                formData,
                            }
                          );

                        if (
                          response.status ===
                          401
                        ) {
                          handleUnauthorized();
                          return;
                        }

                        const data =
                          await response.json();

                        if (
                          !response.ok
                        ) {
                          throw new Error(
                            data.detail ||
                              "Failed to upload logo."
                          );
                        }

                        handleChange(
                          "logo_url",
                          `${API_URL}${data.url}`
                        );

                      } catch (
                        error
                      ) {

                        console.error(
                          "Logo upload error:",
                          error
                        );

                        alert(
                          error instanceof
                          Error
                            ? error.message
                            : "Failed to upload logo."
                        );

                      }

                    }}
                    className="block w-full rounded-lg border border-gray-300 p-2 text-sm"
                  />

                  {form.logo_url && (

                    <div className="flex items-center gap-3">

                      <img
                        src={
                          form.logo_url
                        }
                        alt="Restaurant logo preview"
                        className="h-16 w-16 rounded-lg object-cover border"
                      />

                      <span className="text-sm text-gray-500">
                        Logo uploaded
                      </span>

                    </div>

                  )}

                </div>
              </div>

              {/* ACTIVE */}

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">
                      Food Truck Active
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Inactive food trucks can remain configured
                      but should not accept new orders.
                    </p>
                  </div>

                 <input
  type="checkbox"
  checked={form.is_active}
  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
    updateField("is_active", event.target.checked);
  }}
  className="w-5 h-5 accent-black"
/>
                </label>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeForm}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={saveRestaurant}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? "Saving..."
                  : editingRestaurant
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