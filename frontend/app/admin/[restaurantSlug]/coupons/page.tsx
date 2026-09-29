"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

type Coupon = {
  id: number;
  restaurant_id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  minimum_order: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  target_segment: string | null;
  created_at: string;
};

const API_BASE = "http://127.0.0.1:8000";

export default function CouponManagementPage() {
  const params = useParams();

  const restaurantSlug = Array.isArray(params.restaurantSlug)
    ? params.restaurantSlug[0]
    : params.restaurantSlug;

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  const [couponForm, setCouponForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    minimum_order: "",
    maximum_discount: "",
    usage_limit: "",
    expires_at: "",
    target_segment: "",
  });

  // =========================================================
  // FETCH RESTAURANT
  // =========================================================

  const fetchRestaurant = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/restaurants/`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch restaurants.");
      }

      const data: Restaurant[] = await response.json();

      const foundRestaurant = data.find(
        (item) => item.slug === restaurantSlug
      );

      if (!foundRestaurant) {
        throw new Error("Restaurant not found.");
      }

      setRestaurant(foundRestaurant);
    } catch (error) {
      console.error(
        "FETCH RESTAURANT ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load restaurant."
      );
    }
  };

  // =========================================================
  // FETCH COUPONS
  // =========================================================

  const fetchCoupons = async (
    restaurantId?: number
  ) => {
    try {
      const id =
        restaurantId ?? restaurant?.id;

      if (!id) {
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/coupons/?restaurant_id=${id}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch coupons."
        );
      }

      const data = await response.json();

      setCoupons(data);
    } catch (error) {
      console.error(
        "FETCH COUPONS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load coupons."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!restaurantSlug) {
      return;
    }

    fetchRestaurant();
  }, [restaurantSlug]);

  useEffect(() => {
    if (!restaurant?.id) {
      return;
    }

    fetchCoupons(restaurant.id);

    const interval = setInterval(() => {
      fetchCoupons(restaurant.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [restaurant?.id]);

  // =========================================================
  // CREATE COUPON
  // =========================================================

  const createCoupon = async () => {
    if (!restaurant) {
      alert("Restaurant information is not available.");
      return;
    }

    if (!couponForm.code.trim()) {
      alert("Enter a coupon code.");
      return;
    }

    if (!couponForm.discount_value) {
      alert("Enter a discount value.");
      return;
    }

    setCreating(true);

    try {
      const payload = {
        restaurant_id: restaurant.id,

        code: couponForm.code
          .trim()
          .toUpperCase(),

        discount_type:
          couponForm.discount_type,

        discount_value: Number(
          couponForm.discount_value
        ),

        minimum_order: Number(
          couponForm.minimum_order || 0
        ),

        maximum_discount:
          couponForm.maximum_discount.trim() === ""
            ? null
            : Number(
                couponForm.maximum_discount
              ),

        usage_limit:
          couponForm.usage_limit.trim() === ""
            ? null
            : Number(
                couponForm.usage_limit
              ),

        expires_at: couponForm.expires_at
          ? new Date(
              couponForm.expires_at
            ).toISOString()
          : null,

        target_segment:
          couponForm.target_segment.trim() === ""
            ? null
            : couponForm.target_segment.trim(),
      };

      const response = await fetch(
        `${API_BASE}/api/coupons/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to create coupon."
        );
      }

      alert("Coupon created successfully.");

      setCouponForm({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        minimum_order: "",
        maximum_discount: "",
        usage_limit: "",
        expires_at: "",
        target_segment: "",
      });

      fetchCoupons(restaurant.id);
    } catch (error) {
      console.error(
        "CREATE COUPON ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to create coupon."
      );
    } finally {
      setCreating(false);
    }
  };

  // =========================================================
  // DEACTIVATE COUPON
  // =========================================================

  const deactivateCoupon = async (
    id: number
  ) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/coupons/${id}/deactivate`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to deactivate coupon."
        );
      }

      if (restaurant) {
        fetchCoupons(restaurant.id);
      }
    } catch (error) {
      console.error(
        "DEACTIVATE COUPON ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to deactivate coupon."
      );
    }
  };

  // =========================================================
  // ACTIVATE COUPON
  // =========================================================

  const activateCoupon = async (
    id: number
  ) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/coupons/${id}/activate`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to activate coupon."
        );
      }

      if (restaurant) {
        fetchCoupons(restaurant.id);
      }
    } catch (error) {
      console.error(
        "ACTIVATE COUPON ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to activate coupon."
      );
    }
  };

  // =========================================================
  // DELETE COUPON
  // =========================================================

  const deleteCoupon = async (
    id: number
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this coupon?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/coupons/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to delete coupon."
        );
      }

      if (restaurant) {
        fetchCoupons(restaurant.id);
      }
    } catch (error) {
      console.error(
        "DELETE COUPON ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete coupon."
      );
    }
  };

  // =========================================================
  // COUPON STATUS
  // =========================================================

  const getCouponStatus = (
    coupon: Coupon
  ) => {
    if (!coupon.is_active) {
      return {
        label: "Inactive",
        className:
          "bg-gray-200 text-gray-700",
      };
    }

    if (
      coupon.expires_at &&
      new Date(
        coupon.expires_at
      ).getTime() < Date.now()
    ) {
      return {
        label: "Expired",
        className:
          "bg-red-100 text-red-700",
      };
    }

    if (
      coupon.usage_limit !== null &&
      coupon.used_count >=
        coupon.usage_limit
    ) {
      return {
        label: "Limit Reached",
        className:
          "bg-orange-100 text-orange-700",
      };
    }

    return {
      label: "Active",
      className:
        "bg-green-100 text-green-700",
    };
  };

  // =========================================================
  // DISCOUNT FORMAT
  // =========================================================

  const formatDiscount = (
    coupon: Coupon
  ) => {
    if (
      coupon.discount_type ===
      "percentage"
    ) {
      return `${coupon.discount_value}% OFF`;
    }

    return `₹${coupon.discount_value} OFF`;
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (!restaurant && !error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          Loading restaurant...
        </div>
      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error && !restaurant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold">
            Unable to load restaurant
          </h2>

          <p className="mt-2 text-gray-500">
            {error}
          </p>

          <button
            onClick={() => {
              setError("");
              fetchRestaurant();
            }}
            className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 bg-black px-6 py-5 text-white shadow-lg">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold">
              {restaurant?.name} Admin
            </h1>

            <p className="text-sm text-gray-400">
              Coupon Management
            </p>
          </div>

          <nav className="flex items-center gap-3">

            <button
              onClick={() => {
                window.location.href =
                  `/admin/${restaurant?.slug}`;
              }}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white hover:text-black"
            >
              Dashboard
            </button>

            <button
              onClick={() => {
                window.location.href =
                  `/admin/${restaurant?.slug}/orders`;
              }}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white hover:text-black"
            >
              Orders
            </button>

            <button
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black"
            >
              Coupons
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/admin";
              }}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white hover:text-black"
            >
              All Trucks
            </button>

          </nav>

        </div>

      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* =====================================================
            PAGE TITLE
        ===================================================== */}

        <div className="mb-8">

          <h2 className="text-3xl font-bold">
            Coupon Management
          </h2>

          <p className="mt-2 text-gray-500">
            Create, manage and control promotional
            coupons for{" "}
            <span className="font-semibold text-gray-900">
              {restaurant?.name}
            </span>
            .
          </p>

        </div>

        {/* =====================================================
            RESTAURANT BANNER
        ===================================================== */}

        <div className="mb-8 rounded-2xl bg-black p-6 text-white shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-400">
                Food Truck
              </p>

              <h3 className="mt-1 text-2xl font-bold">
                {restaurant?.name}
              </h3>

              {restaurant?.description && (
                <p className="mt-1 text-sm text-gray-400">
                  {restaurant.description}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-white/10 px-5 py-3 text-right">

              <p className="text-xs text-gray-400">
                Restaurant ID
              </p>

              <p className="text-lg font-bold">
                #{restaurant?.id}
              </p>

            </div>

          </div>

        </div>

        {/* =====================================================
            CREATE COUPON
        ===================================================== */}

        <section className="mb-10 rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-6">

            <h3 className="text-xl font-bold">
              Create New Coupon
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Create a coupon specifically for{" "}
              <span className="font-semibold">
                {restaurant?.name}
              </span>
              .
            </p>

          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

            {/* CODE */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Coupon Code
              </label>

              <input
                type="text"
                value={couponForm.code}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    code:
                      e.target.value.toUpperCase(),
                  })
                }
                placeholder="DESI20"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* DISCOUNT TYPE */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Discount Type
              </label>

              <select
                value={
                  couponForm.discount_type
                }
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    discount_type:
                      e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              >
                <option value="percentage">
                  Percentage
                </option>

                <option value="fixed">
                  Fixed Amount
                </option>
              </select>
            </div>

            {/* DISCOUNT VALUE */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Discount Value
              </label>

              <input
                type="number"
                min="0"
                value={
                  couponForm.discount_value
                }
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    discount_value:
                      e.target.value,
                  })
                }
                placeholder={
                  couponForm.discount_type ===
                  "percentage"
                    ? "20"
                    : "100"
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* MINIMUM ORDER */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Minimum Order
              </label>

              <input
                type="number"
                min="0"
                value={
                  couponForm.minimum_order
                }
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    minimum_order:
                      e.target.value,
                  })
                }
                placeholder="300"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* MAXIMUM DISCOUNT */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Maximum Discount
              </label>

              <input
                type="number"
                min="0"
                value={
                  couponForm.maximum_discount
                }
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    maximum_discount:
                      e.target.value,
                  })
                }
                placeholder="150"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* USAGE LIMIT */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Usage Limit
              </label>

              <input
                type="number"
                min="1"
                value={
                  couponForm.usage_limit
                }
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    usage_limit:
                      e.target.value,
                  })
                }
                placeholder="100"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* EXPIRY */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Expiry Date
              </label>

              <input
                type="datetime-local"
                value={
                  couponForm.expires_at
                }
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    expires_at:
                      e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* TARGET SEGMENT */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Target Segment
              </label>

              <select
                value={
                  couponForm.target_segment
                }
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    target_segment:
                      e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              >
                <option value="">
                  All Customers
                </option>

                <option value="new_customer">
                  New Customers
                </option>

                <option value="returning_customer">
                  Returning Customers
                </option>

                <option value="high_value_customer">
                  High Value Customers
                </option>
              </select>
            </div>

          </div>

          <div className="mt-6">

            <button
              onClick={createCoupon}
              disabled={creating}
              className="rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating
                ? "Creating..."
                : "Create Coupon"}
            </button>

          </div>

        </section>

        {/* =====================================================
            COUPON LIST
        ===================================================== */}

        <section>

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h3 className="text-2xl font-bold">
                Existing Coupons
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Coupons created for{" "}
                <span className="font-semibold">
                  {restaurant?.name}
                </span>
                .
              </p>

            </div>

            <div className="rounded-lg bg-white px-4 py-2 text-sm font-semibold shadow-sm">
              {coupons.length} Coupon
              {coupons.length !== 1
                ? "s"
                : ""}
            </div>

          </div>

          {loading ? (

            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              Loading coupons...
            </div>

          ) : coupons.length === 0 ? (

            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

              <p className="font-semibold">
                No coupons created yet.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Create your first coupon above.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

              {coupons.map((coupon) => {

                const status =
                  getCouponStatus(coupon);

                return (

                  <div
                    key={coupon.id}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <div className="flex items-center gap-3">

                          <h4 className="text-xl font-bold">
                            {coupon.code}
                          </h4>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>

                        </div>

                        <p className="mt-2 text-lg font-semibold">
                          {formatDiscount(coupon)}
                        </p>

                      </div>

                      <div className="text-right text-sm text-gray-500">

                        <p>
                          Used:{" "}
                          {coupon.used_count}

                          {coupon.usage_limit !==
                          null
                            ? ` / ${coupon.usage_limit}`
                            : ""}
                        </p>

                      </div>

                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 text-sm">

                      <div>

                        <p className="text-gray-500">
                          Minimum Order
                        </p>

                        <p className="font-semibold">
                          ₹
                          {
                            coupon.minimum_order
                          }
                        </p>

                      </div>

                      <div>

                        <p className="text-gray-500">
                          Maximum Discount
                        </p>

                        <p className="font-semibold">
                          {coupon.maximum_discount !==
                          null
                            ? `₹${coupon.maximum_discount}`
                            : "No limit"}
                        </p>

                      </div>

                      <div>

                        <p className="text-gray-500">
                          Target Segment
                        </p>

                        <p className="font-semibold">
                          {coupon.target_segment ||
                            "All Customers"}
                        </p>

                      </div>

                      <div>

                        <p className="text-gray-500">
                          Expires
                        </p>

                        <p className="font-semibold">
                          {coupon.expires_at
                            ? new Date(
                                coupon.expires_at
                              ).toLocaleString()
                            : "Never"}
                        </p>

                      </div>

                    </div>

                    {/* ACTION BUTTONS */}

                    <div className="mt-6 flex gap-3 border-t border-gray-100 pt-5">

                      {coupon.is_active ? (

                        <button
                          onClick={() =>
                            deactivateCoupon(
                              coupon.id
                            )
                          }
                          className="rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                        >
                          Deactivate
                        </button>

                      ) : (

                        <button
                          onClick={() =>
                            activateCoupon(
                              coupon.id
                            )
                          }
                          className="rounded-lg border border-green-300 px-4 py-2 text-sm font-semibold text-green-600 transition hover:bg-green-50"
                        >
                          Activate
                        </button>

                      )}

                      <button
                        onClick={() =>
                          deleteCoupon(
                            coupon.id
                          )
                        }
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                );
              })}

            </div>

          )}

        </section>

      </div>

    </main>
  );
}