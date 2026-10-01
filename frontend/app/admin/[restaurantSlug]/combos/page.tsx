"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = "http://localhost:8000";

type Restaurant = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
};

type Product = {
  id: number;
  restaurant_id: number;
  category_id: number;
  name: string;
  description?: string | null;
  price: number | string;
  image_url?: string | null;
  is_available?: boolean;
};

type ComboItem = {
  id: number;
  product_id: number;
  quantity: number;
};

type Combo = {
  id: number;
  restaurant_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number | string;
  is_active: boolean;
  items: ComboItem[];
};

type ComboFormItem = {
  product_id: number;
  quantity: number;
};

export default function CombosPage() {
  const params = useParams();
  const router = useRouter();

  const restaurantSlug = String(params.restaurantSlug);

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [combos, setCombos] =
    useState<Combo[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [formOpen, setFormOpen] =
    useState(false);

  const [editingCombo, setEditingCombo] =
    useState<Combo | null>(null);

  const [error, setError] =
    useState("");

  // =========================================================
  // FORM STATE
  // =========================================================

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [imageUrl, setImageUrl] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [comboItems, setComboItems] =
    useState<ComboFormItem[]>([]);

  // =========================================================
  // LOAD RESTAURANT + PRODUCTS + COMBOS
  // =========================================================

  useEffect(() => {
    const loadData = async () => {
      const token =
        localStorage.getItem("access_token");

      const storedUser =
        localStorage.getItem("auth_user");

      if (!token || !storedUser) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const user = JSON.parse(storedUser);

        // -----------------------------------------------------
        // LOAD RESTAURANTS
        // -----------------------------------------------------

        const restaurantsResponse =
          await fetch(
            `${API_URL}/api/restaurants/`,
            {
              cache: "no-store",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        if (restaurantsResponse.status === 401) {
          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "auth_user"
          );

          router.replace("/login");
          return;
        }

        if (!restaurantsResponse.ok) {
          throw new Error(
            "Failed to load restaurant."
          );
        }

        const restaurants: Restaurant[] =
          await restaurantsResponse.json();

        const selectedRestaurant =
          restaurants.find(
            (item) =>
              item.slug === restaurantSlug
          );

        if (!selectedRestaurant) {
          router.replace("/admin");
          return;
        }

        if (!selectedRestaurant.is_active) {
          router.replace("/admin");
          return;
        }

        // -----------------------------------------------------
        // RESTAURANT ADMIN ACCESS CHECK
        // -----------------------------------------------------

        if (
          user.role === "RESTAURANT_ADMIN" &&
          selectedRestaurant.id !==
            user.restaurant_id
        ) {
          router.replace("/admin");
          return;
        }

        setRestaurant(selectedRestaurant);

        // -----------------------------------------------------
        // LOAD PRODUCTS
        // -----------------------------------------------------

        const productsResponse =
          await fetch(
            `${API_URL}/api/products/?restaurant_id=${selectedRestaurant.id}`,
            {
              cache: "no-store",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        if (!productsResponse.ok) {
          throw new Error(
            "Failed to load products."
          );
        }

        const productData =
          await productsResponse.json();

        const productList: Product[] =
          Array.isArray(productData)
            ? productData
            : productData.products || [];

        setProducts(productList);

        // -----------------------------------------------------
        // LOAD COMBOS
        // -----------------------------------------------------

        const combosResponse =
          await fetch(
            `${API_URL}/api/combos/${selectedRestaurant.id}?include_inactive=true`,
            {
              cache: "no-store",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        if (!combosResponse.ok) {
          throw new Error(
            "Failed to load combos."
          );
        }

        const comboData: Combo[] =
          await combosResponse.json();

        setCombos(comboData);
      } catch (err) {
        console.error(
          "Combo management error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load combo management."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [restaurantSlug, router]);

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setName("");
    setDescription("");
    setImageUrl("");
    setPrice("");
    setComboItems([]);
    setEditingCombo(null);
    setError("");
  };

  // =========================================================
  // OPEN CREATE FORM
  // =========================================================

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  // =========================================================
  // OPEN EDIT FORM
  // =========================================================

  const openEditForm = (combo: Combo) => {
    setEditingCombo(combo);

    setName(combo.name);
    setDescription(
      combo.description || ""
    );

    setImageUrl(
      combo.image_url || ""
    );

    setPrice(
      String(combo.price)
    );

    setComboItems(
      combo.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }))
    );

    setError("");
    setFormOpen(true);
  };

  // =========================================================
  // CLOSE FORM
  // =========================================================

  const closeForm = () => {
    if (saving) return;

    setFormOpen(false);
    resetForm();
  };

  // =========================================================
  // ADD PRODUCT TO COMBO
  // =========================================================

  const addProduct = () => {
    const availableProduct =
      products.find(
        (product) =>
          product.is_available !== false &&
          !comboItems.some(
            (item) =>
              item.product_id ===
              product.id
          )
      );

    if (!availableProduct) {
      return;
    }

    setComboItems((current) => [
      ...current,
      {
        product_id:
          availableProduct.id,
        quantity: 1,
      },
    ]);
  };

  // =========================================================
  // REMOVE PRODUCT FROM COMBO
  // =========================================================

  const removeProduct = (
    productId: number
  ) => {
    setComboItems((current) =>
      current.filter(
        (item) =>
          item.product_id !== productId
      )
    );
  };

  // =========================================================
  // UPDATE PRODUCT QUANTITY
  // =========================================================

  const updateProductQuantity = (
    productId: number,
    quantity: number
  ) => {
    if (quantity < 1) return;

    setComboItems((current) =>
      current.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  };

  // =========================================================
  // CHANGE SELECTED PRODUCT
  // =========================================================

  const changeProduct = (
    currentProductId: number,
    newProductId: number
  ) => {
    if (
      comboItems.some(
        (item) =>
          item.product_id === newProductId &&
          item.product_id !==
            currentProductId
      )
    ) {
      return;
    }

    setComboItems((current) =>
      current.map((item) =>
        item.product_id ===
        currentProductId
          ? {
              ...item,
              product_id: newProductId,
            }
          : item
      )
    );
  };

  // =========================================================
  // REGULAR PRICE
  // =========================================================

  const regularPrice = useMemo(() => {
    return comboItems.reduce(
      (total, item) => {
        const product =
          products.find(
            (product) =>
              product.id ===
              item.product_id
          );

        if (!product) return total;

        return (
          total +
          Number(product.price) *
            item.quantity
        );
      },
      0
    );
  }, [comboItems, products]);

  // =========================================================
  // SAVINGS
  // =========================================================

  const savings = useMemo(() => {
    const comboPrice =
      Number(price || 0);

    return Math.max(
      regularPrice - comboPrice,
      0
    );
  }, [regularPrice, price]);

  const uploadComboImage = async (file: File) => {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be smaller than 5 MB.");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Only JPG, PNG, and WebP images are allowed."
    );
  }

  const token = localStorage.getItem("access_token");

  if (!token) {
    router.replace("/login");
    throw new Error("Authentication required.");
  }

  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/api/uploads/product-image`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to upload image."
    );
  }

  return `${API_URL}${data.url}`;
};

  // =========================================================
  // SAVE COMBO
  // =========================================================

  const saveCombo = async () => {
    if (!restaurant) return;

    setError("");

    const trimmedName =
      name.trim();

    const numericPrice =
      Number(price);

    if (!trimmedName) {
      setError(
        "Please enter a combo name."
      );
      return;
    }

    if (
      !price.trim() ||
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      setError(
        "Please enter a valid combo price."
      );
      return;
    }

    if (comboItems.length === 0) {
      setError(
        "A combo must contain at least one product."
      );
      return;
    }

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: trimmedName,
        description:
          description.trim() || null,
        image_url:
          imageUrl.trim() || null,
        price: numericPrice,
        items: comboItems,
      };

      const url = editingCombo
        ? `${API_URL}/api/combos/${restaurant.id}/${editingCombo.id}`
        : `${API_URL}/api/combos/${restaurant.id}`;

      const response =
        await fetch(url, {
          method: editingCombo
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            payload
          ),
        });

      const data =
        await response.json().catch(
          () => null
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
          data?.detail ||
            "Failed to save combo."
        );
      }

      // -----------------------------------------------------
      // UPDATE LOCAL LIST
      // -----------------------------------------------------

      if (editingCombo) {
        setCombos((current) =>
          current.map((combo) =>
            combo.id ===
            editingCombo.id
              ? data
              : combo
          )
        );
      } else {
        setCombos((current) => [
          data,
          ...current,
        ]);
      }

      closeForm();
    } catch (err) {
      console.error(
        "Save combo error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save combo."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // TOGGLE ACTIVE STATUS
  // =========================================================

  const toggleComboStatus = async (
    combo: Combo
  ) => {
    if (!restaurant) return;

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/combos/${restaurant.id}/${combo.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              is_active:
                !combo.is_active,
            }),
          }
        );

      const data =
        await response.json().catch(
          () => null
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
          data?.detail ||
            "Failed to update combo status."
        );
      }

      setCombos((current) =>
        current.map((item) =>
          item.id === combo.id
            ? data
            : item
        )
      );
    } catch (err) {
      console.error(
        "Combo status error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to update combo status."
      );
    }
  };

  // =========================================================
  // DELETE COMBO
  // =========================================================

  const deleteCombo = async (
    combo: Combo
  ) => {
    if (!restaurant) return;

    const confirmed =
      window.confirm(
        `Delete "${combo.name}"? This action cannot be undone.`
      );

    if (!confirmed) return;

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/combos/${restaurant.id}/${combo.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json().catch(
          () => null
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
          data?.detail ||
            "Failed to delete combo."
        );
      }

      setCombos((current) =>
        current.filter(
          (item) =>
            item.id !== combo.id
        )
      );
    } catch (err) {
      console.error(
        "Delete combo error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete combo."
      );
    }
  };

  // =========================================================
  // PRODUCT HELPER
  // =========================================================

  const getProduct = (
    productId: number
  ) => {
    return products.find(
      (product) =>
        product.id === productId
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
          <p className="text-gray-500">
            Loading combo management...
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // RESTAURANT NOT FOUND
  // =========================================================

  if (!restaurant) {
    return null;
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100">

      {/* =====================================================
          HEADER
      ===================================================== */}

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
                Combo & bundle management
              </p>
            </div>

            <div className="flex gap-2">

              <button
                onClick={() =>
                  router.push(
                    `/admin/${restaurantSlug}`
                  )
                }
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800"
              >
                Dashboard
              </button>

              <button
                onClick={() =>
                  router.push(
                    `/admin/${restaurantSlug}/orders`
                  )
                }
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
              >
                Orders
              </button>

            </div>

          </div>

        </div>

      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* PAGE TITLE */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Combos / Bundles
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Create and manage product combos for your restaurant.
            </p>
          </div>

          <button
            onClick={openCreateForm}
            className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            + Create Combo
          </button>

        </div>

        {/* ERROR */}

        {error && !formOpen && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ===================================================
            COMBOS
        =================================================== */}

        {combos.length === 0 ? (

          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

            <div className="text-5xl">
              🎁
            </div>

            <h3 className="mt-4 text-lg font-semibold">
              No combos yet
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Create your first combo or bundle.
            </p>

            <button
              onClick={openCreateForm}
              className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Create Combo
            </button>

          </div>

        ) : (

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {combos.map((combo) => (

              <div
                key={combo.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >

                {/* IMAGE */}

                <div className="h-44 bg-gray-100">

                  {combo.image_url ? (
                    <img
                      src={combo.image_url}
                      alt={combo.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">
                      🎁
                    </div>
                  )}

                </div>

                {/* CONTENT */}

                <div className="p-5">

                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {combo.name}
                      </h3>

                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          combo.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {combo.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    <p className="text-lg font-black text-gray-900">
                      ₹
                      {Number(
                        combo.price
                      ).toFixed(0)}
                    </p>

                  </div>

                  {combo.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-gray-500">
                      {combo.description}
                    </p>
                  )}

                  {/* ITEMS */}

                  <div className="mt-4 rounded-xl bg-gray-50 p-4">

                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Included Products
                    </p>

                    <div className="space-y-2">

                      {combo.items.map(
                        (item) => {
                          const product =
                            getProduct(
                              item.product_id
                            );

                          return (
                            <div
                              key={
                                item.id
                              }
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-gray-700">
                                {product?.name ||
                                  `Product #${item.product_id}`}
                              </span>

                              <span className="font-semibold text-gray-900">
                                ×{" "}
                                {item.quantity}
                              </span>
                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="mt-5 grid grid-cols-3 gap-2">

                    <button
                      onClick={() =>
                        openEditForm(combo)
                      }
                      className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        toggleComboStatus(
                          combo
                        )
                      }
                      className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      {combo.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    <button
                      onClick={() =>
                        deleteCombo(combo)
                      }
                      className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {formOpen && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCombo
                    ? "Edit Combo"
                    : "Create Combo"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Configure the products and price for this bundle.
                </p>
              </div>

              <button
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="space-y-6 p-6">

              {/* ERROR */}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* NAME */}

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Combo Name
                </label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Chicken Meal"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Chicken burger with fries and a drink."
                  className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* IMAGE */}

              <div>
  <label className="text-sm font-semibold text-gray-700">
    Combo Image
  </label>

  <div className="mt-2 rounded-xl border border-gray-300 p-4">

    <input
      type="file"
      accept="image/png,image/jpeg,image/webp"
      onChange={async (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        try {
          const uploadedUrl =
            await uploadComboImage(file);

          setImageUrl(uploadedUrl);
        } catch (error) {
          console.error(
            "Combo image upload error:",
            error
          );

          alert(
            error instanceof Error
              ? error.message
              : "Failed to upload image."
          );

          event.target.value = "";
        }
      }}
      className="block w-full text-sm"
    />

    {imageUrl && (
      <div className="mt-4 flex items-center gap-4">

        <img
          src={imageUrl}
          alt="Combo preview"
          className="h-20 w-20 rounded-xl border object-cover"
        />

        <div>
          <p className="text-sm font-semibold">
            Image uploaded
          </p>

          <p className="text-xs text-gray-500">
            This image will be displayed for the combo.
          </p>
        </div>

      </div>
    )}

  </div>
</div>

              {/* PRODUCTS */}

              <div>

                <div className="flex items-center justify-between">

                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Products
                    </label>

                    <p className="mt-1 text-xs text-gray-500">
                      Select the products included in this combo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addProduct}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    + Add Product
                  </button>

                </div>

                <div className="mt-4 space-y-3">

                  {comboItems.length === 0 ? (

                    <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">

                      <p className="text-sm text-gray-500">
                        No products added yet.
                      </p>

                      <button
                        type="button"
                        onClick={addProduct}
                        className="mt-3 text-sm font-semibold text-black underline"
                      >
                        Add a product
                      </button>

                    </div>

                  ) : (

                    comboItems.map(
                      (item) => {

                        const currentProduct =
                          getProduct(
                            item.product_id
                          );

                        return (

                          <div
                            key={
                              item.product_id
                            }
                            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center"
                          >

                            {/* SELECT */}

                            <select
                              value={
                                item.product_id
                              }
                              onChange={(
                                event
                              ) =>
                                changeProduct(
                                  item.product_id,
                                  Number(
                                    event.target.value
                                  )
                                )
                              }
                              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
                            >

                              {products
                                .filter(
                                  (product) =>
                                    product.is_available !==
                                      false ||
                                    product.id ===
                                      item.product_id
                                )
                                .map(
                                  (
                                    product
                                  ) => {

                                    const alreadySelected =
                                      comboItems.some(
                                        (
                                          selected
                                        ) =>
                                          selected.product_id ===
                                            product.id &&
                                          selected.product_id !==
                                            item.product_id
                                      );

                                    return (
                                      <option
                                        key={
                                          product.id
                                        }
                                        value={
                                          product.id
                                        }
                                        disabled={
                                          alreadySelected
                                        }
                                      >
                                        {
                                          product.name
                                        }{" "}
                                        — ₹
                                        {Number(
                                          product.price
                                        ).toFixed(
                                          0
                                        )}
                                      </option>
                                    );
                                  }
                                )}

                            </select>

                            {/* QUANTITY */}

                            <div className="flex items-center gap-2">

                              <span className="text-xs font-semibold text-gray-500">
                                Qty
                              </span>

                              <input
                                type="number"
                                min={1}
                                value={
                                  item.quantity
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateProductQuantity(
                                    item.product_id,
                                    Number(
                                      event.target
                                        .value
                                    )
                                  )
                                }
                                className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
                              />

                            </div>

                            {/* REMOVE */}

                            <button
                              type="button"
                              onClick={() =>
                                removeProduct(
                                  item.product_id
                                )
                              }
                              className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>

                          </div>

                        );
                      }
                    )

                  )}

                </div>

              </div>

              {/* PRICE */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Combo Price
                  </label>

                  <div className="relative mt-2">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={price}
                      onChange={(event) =>
                        setPrice(
                          event.target.value
                        )
                      }
                      placeholder="279"
                      className="w-full rounded-xl border border-gray-300 py-3 pl-9 pr-4 outline-none focus:border-black"
                    />

                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Regular Product Total
                  </p>

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    ₹
                    {regularPrice.toFixed(
                      0
                    )}
                  </p>

                  {savings > 0 && (
                    <p className="mt-1 text-sm font-semibold text-green-600">
                      Customer saves ₹
                      {savings.toFixed(
                        0
                      )}
                    </p>
                  )}

                </div>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-5">

              <button
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={saveCombo}
                disabled={saving}
                className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingCombo
                    ? "Save Changes"
                    : "Create Combo"}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}