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

type Order = {
  id: number;
  restaurant_id: number;
  customer_id: number | null;
  status: string;
  subtotal: string;
  discount: string;
  total: string;
  payment_status: string;
  items: {
    product_id: number;
    quantity: number;
    unit_price: string;
    line_total: string;
  }[];
};

type Feedback = {
  id: number;
  customer_id: number | null;
  order_id: number | null;
  rating: number;
  text: string;
  sentiment: string | null;
  issue: string | null;
  created_at: string;
};

const API_URL = "http://localhost:8000";

const statusSteps = [
  "confirmed",
  "preparing",
  "ready",
  "delivered",
];

export default function RestaurantOrdersPage() {
  const params = useParams();

  const restaurantSlug = String(
    params.restaurantSlug
  );

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [feedback, setFeedback] =
    useState<Feedback[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [feedbackLoading, setFeedbackLoading] =
    useState(true);

  const [updatingOrder, setUpdatingOrder] =
    useState<number | null>(null);

  const [restaurantError, setRestaurantError] =
    useState("");

  // =========================================================
  // FETCH RESTAURANT
  // =========================================================

  const fetchRestaurant = async () => {
    try {
      setRestaurantError("");

      const response = await fetch(
        `${API_URL}/api/restaurants/`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch restaurants."
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

      return selectedRestaurant;
    } catch (error) {
      console.error(
        "Restaurant error:",
        error
      );

      setRestaurantError(
        error instanceof Error
          ? error.message
          : "Restaurant not found."
      );

      return null;
    }
  };

  // =========================================================
  // FETCH ORDERS
  // =========================================================

const fetchOrders = async (restaurantId: number) => {
     try {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const response = await fetch(
      `${API_URL}/api/orders/?restaurant_id=${restaurantId}`,
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
      window.location.href = "/login";
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();

      throw new Error(
        errorData.detail || "Failed to fetch orders"
      );
    }

    const data = await response.json();

    setOrders(data);
  } catch (error) {
    console.error("Orders error:", error);
  } finally {
    setLoading(false);
  }
};

  // =========================================================
  // FETCH FEEDBACK
  // =========================================================

  const fetchFeedback = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/feedback/`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch feedback."
        );
      }

      const data: Feedback[] =
        await response.json();

      setFeedback(data);
    } catch (error) {
      console.error(
        "Feedback error:",
        error
      );
    } finally {
      setFeedbackLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      const selectedRestaurant =
        await fetchRestaurant();

      if (!selectedRestaurant) {
        setLoading(false);
        return;
      }

await fetchOrders(selectedRestaurant.id);
      await fetchFeedback();
    };

    initialize();
  }, [restaurantSlug]);

  // =========================================================
  // POLLING
  // =========================================================

  useEffect(() => {
    if (!restaurant?.id) {
      return;
    }

    const interval = setInterval(() => {
        fetchOrders(restaurant.id);
      fetchFeedback();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [restaurant?.id]);

  // =========================================================
  // UPDATE ORDER STATUS
  // =========================================================

const updateStatus = async (
  orderId: number,
  status: string
) => {
  try {
    setUpdatingOrder(orderId);

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const response = await fetch(
      `${API_URL}/api/orders/${orderId}/status?status=${status}`,
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
        errorData.detail || "Failed to update order"
      );
    }

    if (restaurant?.id) {
  await fetchOrders(restaurant.id);
}
  } catch (error) {
    console.error("Status update error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Failed to update order"
    );
  } finally {
    setUpdatingOrder(null);
  }
};
  // =========================================================
  // ORDER STATUS HELPERS
  // =========================================================

  const getNextStatus = (
    status: string
  ) => {
    if (status === "confirmed") {
      return "preparing";
    }

    if (status === "preparing") {
      return "ready";
    }

    if (status === "ready") {
      return "delivered";
    }

    return null;
  };

  const getButtonText = (
    status: string
  ) => {
    if (status === "confirmed") {
      return "Start Preparing";
    }

    if (status === "preparing") {
      return "Mark Ready";
    }

    if (status === "ready") {
      return "Mark Delivered";
    }

    return "Completed";
  };

  const getStatusLabel = (
    status: string
  ) => {
    if (status === "confirmed") {
      return "Order Placed";
    }

    if (status === "preparing") {
      return "Preparing";
    }

    if (status === "ready") {
      return "Ready";
    }

    if (status === "delivered") {
      return "Delivered";
    }

    return status;
  };

  const getStatusStyle = (
    status: string
  ) => {
    if (status === "confirmed") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "preparing") {
      return "bg-orange-100 text-orange-700";
    }

    if (status === "ready") {
      return "bg-purple-100 text-purple-700";
    }

    if (status === "delivered") {
      return "bg-green-100 text-green-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  // =========================================================
  // FEEDBACK HELPERS
  // =========================================================

  const getOrderFeedback = (
    orderId: number
  ) => {
    return feedback.filter(
      (item) =>
        item.order_id === orderId
    );
  };

  const getSentimentStyle = (
    sentiment: string | null
  ) => {
    if (sentiment === "positive") {
      return "bg-green-100 text-green-700";
    }

    if (sentiment === "negative") {
      return "bg-red-100 text-red-700";
    }

    if (sentiment === "neutral") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-gray-100 text-gray-500";
  };

  const getSentimentLabel = (
    sentiment: string | null
  ) => {
    if (!sentiment) {
      return "Not analyzed";
    }

    return (
      sentiment.charAt(0).toUpperCase() +
      sentiment.slice(1)
    );
  };

  // =========================================================
  // RESTAURANT ERROR
  // =========================================================

  if (restaurantError) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md w-full">
          <div className="text-4xl mb-4">
            ⚠️
          </div>

          <h1 className="text-xl font-bold text-gray-900">
            Restaurant Not Found
          </h1>

          <p className="text-gray-500 text-sm mt-2">
            {restaurantError}
          </p>

          <button
            onClick={() => {
              window.location.href =
                "/admin";
            }}
            className="mt-6 px-5 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition"
          >
            Back to Admin
          </button>
        </div>
      </main>
    );
  }

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

            {/* RESTAURANT INFO */}

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Food Truck Admin
              </p>

              <h1 className="text-2xl font-bold mt-1">
                {restaurant?.name || "Restaurant"} Admin
              </h1>

              <p className="text-gray-400 text-sm mt-1">
                Order management & automation control
              </p>
            </div>

            {/* NAVIGATION */}

            <nav className="flex flex-wrap items-center gap-2">

              {/* DASHBOARD */}

              <button
                onClick={() => {
                  window.location.href =
                    `/admin/${restaurantSlug}`;
                }}
                className="px-4 py-2 rounded-lg text-white border border-gray-700 text-sm font-medium hover:bg-gray-800 transition"
              >
                Dashboard
              </button>

              {/* ORDERS */}

              <button
                onClick={() => {
                  window.location.href =
                    `/admin/${restaurantSlug}/orders`;
                }}
                className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-200 transition"
              >
                Orders
              </button>

              {/* MENU */}

              <button
                onClick={() => {
                  window.location.href =
                    `/admin/menu?restaurant=${restaurantSlug}`;
                }}
                className="px-4 py-2 rounded-lg text-white border border-gray-700 text-sm font-medium hover:bg-gray-800 transition"
              >
                Menu
              </button>

              {/* COUPONS */}

              <button
                onClick={() => {
                  window.location.href =
                    `/admin/coupons?restaurant=${restaurantSlug}`;
                }}
                className="px-4 py-2 rounded-lg text-white border border-gray-700 text-sm font-medium hover:bg-gray-800 transition"
              >
                Coupons
              </button>

              {/* CAMPAIGNS */}

              <button
                onClick={() => {
                  window.location.href =
                    `/admin/campaigns?restaurant=${restaurantSlug}`;
                }}
                className="px-4 py-2 rounded-lg text-white border border-gray-700 text-sm font-medium hover:bg-gray-800 transition"
              >
                Campaigns
              </button>

              {/* ALL FOOD TRUCKS */}

              <button
                onClick={() => {
                  window.location.href =
                    "/admin";
                }}
                className="px-4 py-2 rounded-lg text-white border border-gray-700 text-sm font-medium hover:bg-gray-800 transition"
              >
                All Trucks
              </button>

            </nav>

          </div>

        </div>
      </header>

      {/* ===================================================== */}
      {/* MAIN CONTENT */}
      {/* ===================================================== */}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* =================================================== */}
        {/* RESTAURANT BANNER */}
        {/* =================================================== */}

        <div className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Current workspace
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {restaurant?.name}
              </h2>

              {restaurant?.description && (
                <p className="text-sm text-gray-500 mt-1">
                  {restaurant.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">

              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  restaurant?.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {restaurant?.is_active
                  ? "Active"
                  : "Inactive"}
              </span>

              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                {restaurant?.currency}
              </span>

            </div>

          </div>

        </div>

        {/* =================================================== */}
        {/* ORDERS SECTION */}
        {/* =================================================== */}

        <section>

          <div className="mb-6">

            <h2 className="text-xl font-semibold text-gray-900">
              {restaurant?.name} Orders
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Manage customer orders and trigger automated
              notifications for this food truck.
            </p>

          </div>

          {/* LOADING */}

          {loading ? (

            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">

              <div className="animate-pulse">

                <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />

                <p className="text-gray-500 text-sm mt-4">
                  Loading orders...
                </p>

              </div>

            </div>

          ) : orders.length === 0 ? (

            /* NO ORDERS */

            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-200">

              <div className="text-4xl mb-4">
                📦
              </div>

              <p className="text-gray-900 font-medium">
                No orders found
              </p>

              <p className="text-gray-500 text-sm mt-1">
                New {restaurant?.name} orders will appear here.
              </p>

            </div>

          ) : (

            /* ORDERS */

            <div className="space-y-5">

              {orders.map((order) => {

                const nextStatus =
                  getNextStatus(
                    order.status
                  );

                const orderFeedback =
                  getOrderFeedback(
                    order.id
                  );

                const currentIndex =
                  statusSteps.indexOf(
                    order.status
                  );

                return (

                  <div
                    key={order.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                  >

                    {/* ======================================= */}
                    {/* ORDER HEADER */}
                    {/* ======================================= */}

                    <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                      <div>

                        <div className="flex items-center gap-3 flex-wrap">

                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{order.id}
                          </h3>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(
                              order.status
                            )}
                          </span>

                        </div>

                        <p className="text-sm text-gray-500 mt-2">
                          Customer ID:{" "}
                          {order.customer_id ??
                            "Guest"}
                        </p>

                      </div>

                      <div className="text-left md:text-right">

                        <p className="text-xs text-gray-500">
                          Payment
                        </p>

                        <p className="font-medium text-green-600 capitalize">
                          {order.payment_status}
                        </p>

                        <p className="text-lg font-bold text-gray-900 mt-1">
                          ₹{order.total}
                        </p>

                      </div>

                    </div>

                    {/* ======================================= */}
                    {/* ORDER PROGRESS */}
                    {/* ======================================= */}

                    <div className="px-6 py-5 border-b border-gray-100">

                      <div className="flex items-center">

                        {statusSteps.map(
                          (step, index) => {

                            const isCompleted =
                              currentIndex >=
                              index;

                            return (

                              <div
                                key={step}
                                className="flex items-center flex-1 last:flex-none"
                              >

                                <div className="flex flex-col items-center">

                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                                      isCompleted
                                        ? "bg-black text-white"
                                        : "bg-gray-200 text-gray-500"
                                    }`}
                                  >
                                    {isCompleted
                                      ? "✓"
                                      : index + 1}
                                  </div>

                                  <span className="text-xs text-gray-500 mt-2 whitespace-nowrap">
                                    {getStatusLabel(
                                      step
                                    )}
                                  </span>

                                </div>

                                {index <
                                  statusSteps.length -
                                    1 && (

                                  <div
                                    className={`h-1 flex-1 mx-2 rounded ${
                                      currentIndex >
                                      index
                                        ? "bg-black"
                                        : "bg-gray-200"
                                    }`}
                                  />

                                )}

                              </div>

                            );
                          }
                        )}

                      </div>

                    </div>

                    {/* ======================================= */}
                    {/* ORDER ITEMS */}
                    {/* ======================================= */}

                    <div className="px-6 py-5">

                      <h4 className="font-medium text-gray-900 mb-3">
                        Order Items
                      </h4>

                      <div className="space-y-2">

                        {order.items.map(
                          (item) => (

                            <div
                              key={`${order.id}-${item.product_id}`}
                              className="flex items-center justify-between text-sm"
                            >

                              <div className="text-gray-600">

                                Product #
                                {item.product_id}

                                <span className="text-gray-400 ml-2">
                                  ×{" "}
                                  {item.quantity}
                                </span>

                              </div>

                              <div className="font-medium text-gray-800">
                                ₹
                                {
                                  item.line_total
                                }
                              </div>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                    {/* ======================================= */}
                    {/* CUSTOMER FEEDBACK */}
                    {/* ======================================= */}

                    <div className="px-6 py-5 border-t border-gray-100">

                      <div className="mb-4">

                        <h4 className="font-semibold text-gray-900">
                          Customer Feedback
                        </h4>

                        <p className="text-xs text-gray-500 mt-1">
                          Feedback and AI insights for this order
                        </p>

                      </div>

                      {feedbackLoading ? (

                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">

                          <p className="text-sm text-gray-500">
                            Loading feedback...
                          </p>

                        </div>

                      ) : orderFeedback.length ===
                        0 ? (

                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">

                          <p className="text-sm text-gray-500">
                            No feedback submitted for this order yet.
                          </p>

                        </div>

                      ) : (

                        <div className="space-y-4">

                          {orderFeedback.map(
                            (item) => (

                              <div
                                key={item.id}
                                className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
                              >

                                {/* FEEDBACK CONTENT */}

                                <div className="p-4">

                                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">

                                    <div>

                                      <p className="text-xs text-gray-500 mb-1">
                                        Rating
                                      </p>

                                      <div className="flex items-center gap-2">

                                        <span className="text-lg">
                                          {"⭐".repeat(
                                            item.rating
                                          )}
                                        </span>

                                        <span className="text-sm font-medium text-gray-700">
                                          {item.rating}/5
                                        </span>

                                      </div>

                                    </div>

                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${getSentimentStyle(
                                        item.sentiment
                                      )}`}
                                    >
                                      🤖{" "}
                                      {getSentimentLabel(
                                        item.sentiment
                                      )}
                                    </span>

                                  </div>

                                  <div className="mt-4">

                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                      Customer said
                                    </p>

                                    <p className="text-gray-800 leading-relaxed">
                                      “{item.text}”
                                    </p>

                                  </div>

                                </div>

                                {/* AI ANALYSIS */}

                                <div className="border-t border-gray-200 bg-white p-4">

                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                                    AI Analysis
                                  </p>

                                  <div className="grid md:grid-cols-2 gap-3">

                                    <div className="rounded-lg bg-gray-50 p-3">

                                      <p className="text-xs text-gray-500">
                                        Sentiment
                                      </p>

                                      <p className="font-semibold text-gray-900 mt-1">
                                        {getSentimentLabel(
                                          item.sentiment
                                        )}
                                      </p>

                                    </div>

                                    <div className="rounded-lg bg-gray-50 p-3">

                                      <p className="text-xs text-gray-500">
                                        Detected Issue
                                      </p>

                                      <p className="font-semibold text-gray-900 mt-1">
                                        {item.issue ||
                                          "No specific issue detected"}
                                      </p>

                                    </div>

                                  </div>

                                </div>

                              </div>

                            )
                          )}

                        </div>

                      )}

                    </div>

                    {/* ======================================= */}
                    {/* ACTION */}
                    {/* ======================================= */}

                    <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">

                      {nextStatus ? (

                        <button
                          onClick={() =>
                            updateStatus(
                              order.id,
                              nextStatus
                            )
                          }
                          disabled={
                            updatingOrder ===
                            order.id
                          }
                          className="w-full md:w-auto px-6 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {updatingOrder ===
                          order.id
                            ? "Updating..."
                            : getButtonText(
                                order.status
                              )}
                        </button>

                      ) : (

                        <div className="text-sm text-green-600 font-medium">
                          ✓ Order completed
                        </div>

                      )}

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