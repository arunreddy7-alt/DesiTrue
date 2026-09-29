"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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

export default function FoodTrucksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const restaurantSlug =
    searchParams.get("restaurant");

  const [restaurants, setRestaurants] =
    useState<Restaurant[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<RestaurantForm>(emptyForm);

  const [saving, setSaving] =
    useState(false);

  // =========================================================
  // AUTH HELPERS
  // =========================================================

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_user");
    router.replace("/login");
  };

  // =========================================================
  // FORM HELPERS
  // =========================================================

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

  const openEditForm = (
    restaurant: Restaurant
  ) => {
    setEditingId(restaurant.id);

    setForm({
      name: restaurant.name,
      slug: restaurant.slug,
      description:
        restaurant.description || "",
      logo_url:
        restaurant.logo_url || "",
      phone:
        restaurant.phone || "",
      address:
        restaurant.address || "",
      currency:
        restaurant.currency,
      tax_percentage:
        String(restaurant.tax_percentage),
      is_active:
        restaurant.is_active,

      admin_email: "",
      admin_password: "",
      admin_password_confirm: "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  // =========================================================
  // FETCH RESTAURANTS
  // =========================================================

  const fetchRestaurants = async () => {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        handleUnauthorized();
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
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Failed to fetch food trucks"
        );
      }

      const data: Restaurant[] =
        await response.json();

      // -----------------------------------------------------
      // SINGLE RESTAURANT MODE
      // -----------------------------------------------------

      if (restaurantSlug) {
        const selectedRestaurant =
          data.find(
            (restaurant) =>
              restaurant.slug ===
              restaurantSlug
          );

        if (!selectedRestaurant) {
          alert(
            "Restaurant not found."
          );

          router.replace("/admin");
          return;
        }

        setRestaurants([
          selectedRestaurant,
        ]);

        // Automatically open edit form
        openEditForm(
          selectedRestaurant
        );

        return;
      }

      // -----------------------------------------------------
      // NORMAL PLATFORM MODE
      // -----------------------------------------------------

      setRestaurants(data);
    } catch (error) {
      console.error(
        "Food trucks error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load food trucks."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchRestaurants();
  }, [restaurantSlug]);

  // =========================================================
  // SAVE RESTAURANT
  // =========================================================

  const saveRestaurant = async () => {
    if (!form.name.trim()) {
      alert("Food truck name is required.");
      return;
    }

    // Admin credentials are required only when creating a new food truck.
    if (!editingId) {
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

      if (
        form.admin_password !==
        form.admin_password_confirm
      ) {
        alert("Admin passwords do not match.");
        return;
      }
    }

    try {
      setSaving(true);

      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const payload = {
        name: form.name.trim(),

        // Backend requires slug, so generate one when the field is empty.
        slug:
          form.slug.trim() ||
          form.name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, ""),

        description:
          form.description.trim() || null,

        logo_url:
          form.logo_url.trim() || null,

        phone:
          form.phone.trim() || null,

        address:
          form.address.trim() || null,

        currency:
          form.currency.trim() || "INR",

        tax_percentage:
          Number(form.tax_percentage) || 0,

        is_active:
          form.is_active,

        // Only create a restaurant admin account when creating.
        ...(editingId
          ? {}
          : {
              admin_email:
                form.admin_email.trim(),
              admin_password:
                form.admin_password,
            }),
      };

      const url = editingId
        ? `${API_URL}/api/restaurants/${editingId}`
        : `${API_URL}/api/restaurants/`;

      const response = await fetch(
        url,
        {
          method: editingId
            ? "PATCH"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(
            payload
          ),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      // IMPORTANT:
      // Read the response body exactly ONCE.
      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Restaurant API error:",
          data
        );

        const errorMessage =
          Array.isArray(data.detail)
            ? data.detail
                .map(
                  (error: any) => {
                    const field =
                      Array.isArray(
                        error.loc
                      )
                        ? error.loc.join(".")
                        : "field";

                    return `${field}: ${error.msg}`;
                  }
                )
                .join("\n")
            : typeof data.detail ===
                "string"
              ? data.detail
              : "Failed to save food truck.";

        throw new Error(
          errorMessage
        );
      }

      await fetchRestaurants();

      // In single restaurant mode,
      // stay on this restaurant.
      if (restaurantSlug) {
        setShowForm(false);
        setEditingId(null);
      } else {
        closeForm();
      }
    } catch (error) {
      console.error(
        "Save restaurant error:",
        error
      );

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
  // TOGGLE RESTAURANT STATUS
  // =========================================================

  const toggleStatus = async (
    restaurant: Restaurant
  ) => {
    try {
      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response =
        await fetch(
          `${API_URL}/api/restaurants/${restaurant.id}/status?is_active=${!restaurant.is_active}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to update status."
        );
      }

      await fetchRestaurants();
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update status."
      );
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "auth_user"
    );

    router.replace("/login");
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100">

      {/* =================================================== */}
      {/* HEADER */}
      {/* =================================================== */}

      <header className="bg-black text-white px-6 py-5 sticky top-0 z-50 shadow-lg">

        <div className="max-w-6xl mx-auto">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <h1 className="text-2xl font-bold">
                Food Trucks
              </h1>

              <p className="text-gray-400 text-sm mt-1">
                {restaurantSlug
                  ? "Edit food truck configuration"
                  : "Manage restaurants and business configuration"}
              </p>

            </div>

            {/* ================================================= */}
            {/* ADMIN NAVIGATION */}
            {/* ================================================= */}

            <nav className="flex items-center gap-2 flex-wrap">

              <button
                onClick={() => {
                  router.push(
                    "/admin"
                  );
                }}
                className="px-4 py-2 rounded-lg border border-gray-700 text-white text-sm font-medium hover:bg-gray-800 transition"
              >
                Admin
              </button>

              {!restaurantSlug && (
                <>
                  <button
                    onClick={() => {
                      router.push(
                        "/admin/coupons"
                      );
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-700 text-white text-sm font-medium hover:bg-gray-800 transition"
                  >
                    Coupons
                  </button>

                  <button
                    onClick={() => {
                      router.push(
                        "/admin/campaigns"
                      );
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-700 text-white text-sm font-medium hover:bg-gray-800 transition"
                  >
                    Campaigns
                  </button>
                </>
              )}

              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg border border-red-500/40 text-red-300 text-sm font-medium hover:bg-red-500/10 transition"
              >
                Logout
              </button>

            </nav>

          </div>

        </div>

      </header>

      {/* =================================================== */}
      {/* MAIN */}
      {/* =================================================== */}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ================================================= */}
        {/* PAGE HEADER */}
        {/* ================================================= */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h2 className="text-2xl font-bold text-gray-900">
              {restaurantSlug
                ? "Edit Food Truck"
                : "Your Food Trucks"}
            </h2>

            <p className="text-gray-500 mt-1">
              {restaurantSlug
                ? "Update this food truck's configuration."
                : "Add and configure food trucks without changing application code."}
            </p>

          </div>

          {!restaurantSlug && (
            <button
              onClick={
                openCreateForm
              }
              className="px-5 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition"
            >
              + Add Food Truck
            </button>
          )}

        </div>

        {/* ================================================= */}
        {/* LOADING */}
        {/* ================================================= */}

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

            {!restaurantSlug && (
              <button
                onClick={
                  openCreateForm
                }
                className="mt-4 px-5 py-2 rounded-lg bg-black text-white"
              >
                Add your first food truck
              </button>
            )}

          </div>

        ) : (

          /* ================================================= */
          /* RESTAURANT CARDS */
          /* ================================================= */

          <div className="grid md:grid-cols-2 gap-6">

            {restaurants
              .filter(
                (restaurant) =>
                  !restaurantSlug ||
                  restaurant.slug ===
                    restaurantSlug
              )
              .map(
                (restaurant) => (

                  <div
                    key={
                      restaurant.id
                    }
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                  >

                    {/* ======================================= */}
                    {/* CARD HEADER */}
                    {/* ======================================= */}

                    <div className="p-6 border-b border-gray-100">

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex items-center gap-4">

                          {restaurant.logo_url ? (

                            <img
                              src={
                                restaurant.logo_url
                              }
                              alt={
                                restaurant.name
                              }
                              className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                            />

                          ) : (

                            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-500">
                              {restaurant.name
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>

                          )}

                          <div>

                            <h3 className="text-lg font-semibold text-gray-900">
                              {
                                restaurant.name
                              }
                            </h3>

                            <p className="text-sm text-gray-500">
                              /
                              {
                                restaurant.slug
                              }
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

                    {/* ======================================= */}
                    {/* DETAILS */}
                    {/* ======================================= */}

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
                            {
                              restaurant.currency
                            }
                          </p>

                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">

                          <p className="text-xs text-gray-500">
                            Tax
                          </p>

                          <p className="font-semibold text-gray-900 mt-1">
                            {
                              restaurant.tax_percentage
                            }
                            %
                          </p>

                        </div>

                      </div>

                      {restaurant.phone && (
                        <div>

                          <p className="text-xs text-gray-500">
                            Phone
                          </p>

                          <p className="text-sm text-gray-800 mt-1">
                            {
                              restaurant.phone
                            }
                          </p>

                        </div>
                      )}

                      {restaurant.address && (
                        <div>

                          <p className="text-xs text-gray-500">
                            Address
                          </p>

                          <p className="text-sm text-gray-800 mt-1">
                            {
                              restaurant.address
                            }
                          </p>

                        </div>
                      )}

                    </div>

                    {/* ======================================= */}
                    {/* ACTIONS */}
                    {/* ======================================= */}

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">

                      <button
                        onClick={() =>
                          openEditForm(
                            restaurant
                          )
                        }
                        className="flex-1 px-4 py-2.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
                      >
                        Edit
                      </button>

                      {!restaurantSlug && (
                        <button
                          onClick={() =>
                            toggleStatus(
                              restaurant
                            )
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
                      )}

                    </div>

                  </div>

                )
              )}

          </div>

        )}

      </div>

      {/* =================================================== */}
      {/* CREATE / EDIT MODAL */}
      {/* =================================================== */}

      {showForm && (

        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* ================================================= */}
            {/* MODAL HEADER */}
            {/* ================================================= */}

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
                onClick={
                  closeForm
                }
                disabled={saving}
                className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50"
              >
                ✕
              </button>

            </div>

            {/* ================================================= */}
            {/* FORM */}
            {/* ================================================= */}

            <div className="p-6 space-y-5">

              {/* NAME */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Food Truck Name *
                </label>

                <input
                  value={
                    form.name
                  }
                  onChange={(
                    event
                  ) =>
                    handleChange(
                      "name",
                      event.target
                        .value
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
                  value={
                    form.slug
                  }
                  onChange={(
                    event
                  ) =>
                    handleChange(
                      "slug",
                      event.target
                        .value
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
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    handleChange(
                      "description",
                      event.target
                        .value
                    )
                  }
                  rows={3}
                  placeholder="Describe this food truck..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-black resize-none"
                />

              </div>

              {/* ADMIN ACCOUNT - CREATE ONLY */}

              {!editingId && (
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
                          handleChange(
                            "admin_email",
                            event.target.value
                          )
                        }
                        placeholder="admin@burgergarage.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-black"
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
                          handleChange(
                            "admin_password",
                            event.target.value
                          )
                        }
                        placeholder="Minimum 8 characters"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-black"
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
                          handleChange(
                            "admin_password_confirm",
                            event.target.value
                          )
                        }
                        placeholder="Re-enter password"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* LOGO */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
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
                        event.target
                          .files?.[0];

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

              {/* PHONE + CURRENCY */}

              <div className="grid md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>

                  <input
                    value={
                      form.phone
                    }
                    onChange={(
                      event
                    ) =>
                      handleChange(
                        "phone",
                        event.target
                          .value
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
                    value={
                      form.currency
                    }
                    onChange={(
                      event
                    ) =>
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
                  value={
                    form.address
                  }
                  onChange={(
                    event
                  ) =>
                    handleChange(
                      "address",
                      event.target
                        .value
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
                  value={
                    form.tax_percentage
                  }
                  onChange={(
                    event
                  ) =>
                    handleChange(
                      "tax_percentage",
                      event.target
                        .value
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-black"
                />

              </div>

              {/* ACTIVE */}

              <label className="flex items-center gap-3 cursor-pointer">

                <input
                  type="checkbox"
                  checked={
                    form.is_active
                  }
                  onChange={(
                    event
                  ) =>
                    handleChange(
                      "is_active",
                      event.target
                        .checked
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

            {/* ================================================= */}
            {/* MODAL ACTIONS */}
            {/* ================================================= */}

            <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3">

              <button
                onClick={
                  closeForm
                }
                disabled={saving}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={
                  saveRestaurant
                }
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