"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

type Restaurant = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
};

type Category = {
  id: number;
  restaurant_id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
};

type Product = {
  id: number;
  restaurant_id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
};

export default function MenuManagementPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(
    null
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(false);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [productCategoryId, setProductCategoryId] = useState<number | "">("");

  // -----------------------------
  // Load restaurants
  // -----------------------------

  const loadRestaurants = async () => {
    try {
      const response = await fetch(`${API_URL}/api/restaurants/`);

      if (!response.ok) {
        throw new Error("Failed to load restaurants.");
      }

      const data = await response.json();

      setRestaurants(data);

      if (data.length > 0 && selectedRestaurantId === null) {
        setSelectedRestaurantId(data[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // -----------------------------
  // Load menu
  // -----------------------------

  const loadMenu = async (restaurantId: number) => {
    setLoading(true);

    try {
      const [categoriesResponse, productsResponse] = await Promise.all([
        fetch(
          `${API_URL}/api/categories/?restaurant_id=${restaurantId}`
        ),
        fetch(
          `${API_URL}/api/products/?restaurant_id=${restaurantId}&include_unavailable=true`
        ),
      ]);

      if (!categoriesResponse.ok) {
        throw new Error("Failed to load categories.");
      }

      if (!productsResponse.ok) {
        throw new Error("Failed to load products.");
      }

      const categoriesData = await categoriesResponse.json();
      const productsData = await productsResponse.json();

      setCategories(categoriesData);
      setProducts(productsData);

      if (categoriesData.length > 0) {
        setProductCategoryId(categoriesData[0].id);
      } else {
        setProductCategoryId("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId !== null) {
      loadMenu(selectedRestaurantId);
    }
  }, [selectedRestaurantId]);

  // -----------------------------
  // Create category
  // -----------------------------

  const createCategory = async () => {
    if (!selectedRestaurantId) return;

    if (!categoryName.trim() || !categorySlug.trim()) {
      alert("Category name and slug are required.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/categories/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurant_id: selectedRestaurantId,
          name: categoryName,
          slug: categorySlug,
          description: categoryDescription || null,
          is_active: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create category.");
      }

      setCategoryName("");
      setCategorySlug("");
      setCategoryDescription("");
      setShowCategoryForm(false);

      await loadMenu(selectedRestaurantId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  // -----------------------------
  // Upload product image
  // -----------------------------

  const uploadProductImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image must be smaller than 5 MB.");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Only JPG, PNG, and WebP images are allowed.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_URL}/api/uploads/product-image`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Failed to upload product image."
      );
    }

    return `${API_URL}${data.url}`;
  };

  // -----------------------------
  // Create product
  // -----------------------------

  const createProduct = async () => {
    if (!selectedRestaurantId) return;

    if (
      !productName.trim() ||
      !productPrice ||
      productCategoryId === ""
    ) {
      alert("Product name, price and category are required.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/products/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurant_id: selectedRestaurantId,
          category_id: Number(productCategoryId),
          name: productName,
          description: productDescription || null,
          price: Number(productPrice),
          image_url: productImageUrl || null,
          is_available: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create product.");
      }

      setProductName("");
      setProductDescription("");
      setProductPrice("");
      setProductImageUrl("");
      setShowProductForm(false);

      await loadMenu(selectedRestaurantId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  // -----------------------------
  // Toggle product availability
  // -----------------------------

  const toggleProductAvailability = async (product: Product) => {
    try {
      const response = await fetch(
        `${API_URL}/api/products/${product.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_available: !product.is_available,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update product."
        );
      }

      if (selectedRestaurantId !== null) {
        await loadMenu(selectedRestaurantId);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  // -----------------------------
  // Delete product
  // -----------------------------

  const deleteProduct = async (productId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/api/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to delete product."
        );
      }

      if (selectedRestaurantId !== null) {
        await loadMenu(selectedRestaurantId);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  // -----------------------------
  // Delete category
  // -----------------------------

  const deleteCategory = async (categoryId: number) => {
    const confirmed = window.confirm(
      "Delete this category?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/api/categories/${categoryId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to delete category."
        );
      }

      if (selectedRestaurantId !== null) {
        await loadMenu(selectedRestaurantId);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(
      (item) => item.id === categoryId
    );

    return category?.name || "Unknown category";
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">
            Admin Panel
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            Menu Management
          </h1>

          <p className="mt-2 text-gray-500">
            Manage categories and products for each food truck.
          </p>
        </div>

        {/* Restaurant selector */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">
            Select Food Truck
          </label>

          <select
            value={selectedRestaurantId ?? ""}
            onChange={(event) =>
              setSelectedRestaurantId(
                event.target.value
                  ? Number(event.target.value)
                  : null
              )
            }
            className="w-full max-w-md rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
          >
            <option value="">
              Select a food truck
            </option>

            {restaurants.map((restaurant) => (
              <option
                key={restaurant.id}
                value={restaurant.id}
              >
                {restaurant.name}
                {!restaurant.is_active
                  ? " (Inactive)"
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedRestaurantId !== null && (
          <>
            {/* Categories */}
            <section className="mb-10">

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Categories
                  </h2>

                  <p className="text-sm text-gray-500">
                    Organize your menu items.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowCategoryForm(!showCategoryForm)
                  }
                  className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  + Add Category
                </button>
              </div>

              {showCategoryForm && (
                <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                  <div className="grid gap-4 md:grid-cols-3">

                    <input
                      value={categoryName}
                      onChange={(event) =>
                        setCategoryName(event.target.value)
                      }
                      placeholder="Category name"
                      className="rounded-xl border border-gray-300 px-4 py-3 outline-none"
                    />

                    <input
                      value={categorySlug}
                      onChange={(event) =>
                        setCategorySlug(event.target.value)
                      }
                      placeholder="Slug e.g. burgers"
                      className="rounded-xl border border-gray-300 px-4 py-3 outline-none"
                    />

                    <input
                      value={categoryDescription}
                      onChange={(event) =>
                        setCategoryDescription(
                          event.target.value
                        )
                      }
                      placeholder="Description"
                      className="rounded-xl border border-gray-300 px-4 py-3 outline-none"
                    />

                  </div>

                  <div className="mt-4 flex gap-3">

                    <button
                      onClick={createCategory}
                      className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white"
                    >
                      Create Category
                    </button>

                    <button
                      onClick={() =>
                        setShowCategoryForm(false)
                      }
                      className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium"
                    >
                      Cancel
                    </button>

                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <h3 className="font-semibold">
                          {category.name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-400">
                          /{category.slug}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          category.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {category.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </div>

                    {category.description && (
                      <p className="mt-3 text-sm text-gray-500">
                        {category.description}
                      </p>
                    )}

                    <button
                      onClick={() =>
                        deleteCategory(category.id)
                      }
                      className="mt-4 text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                ))}

              </div>
            </section>

            {/* Products */}
            <section>

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Products
                  </h2>

                  <p className="text-sm text-gray-500">
                    Manage products, pricing and availability.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowProductForm(!showProductForm)
                  }
                  disabled={categories.length === 0}
                  className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  + Add Product
                </button>
              </div>

              {categories.length === 0 && (
                <div className="mb-5 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">
                  Create a category before adding products.
                </div>
              )}

              {showProductForm && categories.length > 0 && (
                <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                  <div className="grid gap-4 md:grid-cols-2">

                    <input
                      value={productName}
                      onChange={(event) =>
                        setProductName(event.target.value)
                      }
                      placeholder="Product name"
                      className="rounded-xl border border-gray-300 px-4 py-3 outline-none"
                    />

                    <input
                      value={productPrice}
                      onChange={(event) =>
                        setProductPrice(event.target.value)
                      }
                      placeholder="Price"
                      type="number"
                      min="0"
                      className="rounded-xl border border-gray-300 px-4 py-3 outline-none"
                    />

                    <select
                      value={productCategoryId}
                      onChange={(event) =>
                        setProductCategoryId(
                          event.target.value
                            ? Number(event.target.value)
                            : ""
                        )
                      }
                      className="rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none"
                    >
                      <option value="">
                        Select category
                      </option>

                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>

                    <div className="rounded-xl border border-gray-300 p-4">
                      <label className="mb-2 block text-sm font-medium">
                        Food Image
                      </label>

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];

                          if (!file) {
                            return;
                          }

                          try {
                            const uploadedUrl =
                              await uploadProductImage(file);

                            setProductImageUrl(uploadedUrl);
                          } catch (error) {
                            console.error(
                              "Product image upload error:",
                              error
                            );

                            alert(
                              error instanceof Error
                                ? error.message
                                : "Failed to upload product image."
                            );

                            event.target.value = "";
                          }
                        }}
                        className="block w-full text-sm"
                      />

                      {productImageUrl && (
                        <div className="mt-3 flex items-center gap-3">
                          <img
                            src={productImageUrl}
                            alt="Product preview"
                            className="h-20 w-20 rounded-xl border object-cover"
                          />

                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              Image uploaded
                            </p>
                            <p className="text-xs text-gray-500">
                              This image will be used for the product.
                            </p>

                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const response = await fetch(
                                    `${API_URL}/api/uploads/product-image?image_url=${encodeURIComponent(
                                      productImageUrl
                                    )}`,
                                    {
                                      method: "DELETE",
                                    }
                                  );

                                  const data = await response.json();

                                  if (!response.ok) {
                                    throw new Error(
                                      data.detail ||
                                        "Failed to remove image."
                                    );
                                  }

                                  setProductImageUrl("");
                                } catch (error) {
                                  console.error(
                                    "Product image removal error:",
                                    error
                                  );

                                  alert(
                                    error instanceof Error
                                      ? error.message
                                      : "Failed to remove image."
                                  );
                                }
                              }}
                              className="mt-2 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Remove Image
                            </button>
                          </div>
                        </div>
                      )}

                     
                    </div>

                    <textarea
                      value={productDescription}
                      onChange={(event) =>
                        setProductDescription(
                          event.target.value
                        )
                      }
                      placeholder="Product description"
                      className="min-h-[100px] rounded-xl border border-gray-300 px-4 py-3 outline-none md:col-span-2"
                    />

                  </div>

                  <div className="mt-4 flex gap-3">

                    <button
                      onClick={createProduct}
                      className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white"
                    >
                      Create Product
                    </button>

                    <button
                      onClick={() =>
                        setShowProductForm(false)
                      }
                      className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium"
                    >
                      Cancel
                    </button>

                  </div>
                </div>
              )}

              {loading ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                  Loading menu...
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                  No products found for this food truck.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                    >

                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-48 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-gray-100 text-sm text-gray-400">
                          No image
                        </div>
                      )}

                      <div className="p-5">

                        <div className="flex items-start justify-between gap-3">

                          <div>
                            <h3 className="font-semibold">
                              {product.name}
                            </h3>

                            <p className="mt-1 text-sm text-gray-400">
                              {getCategoryName(
                                product.category_id
                              )}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs ${
                              product.is_available
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {product.is_available
                              ? "Available"
                              : "Unavailable"}
                          </span>

                        </div>

                        {product.description && (
                          <p className="mt-3 text-sm text-gray-500">
                            {product.description}
                          </p>
                        )}

                        <div className="mt-4 flex items-center justify-between">

                          <span className="text-lg font-semibold">
                            ₹{Number(product.price).toFixed(2)}
                          </span>

                        </div>

                        <div className="mt-5 flex gap-2">

                          <button
                            onClick={() =>
                              toggleProductAvailability(product)
                            }
                            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                          >
                            {product.is_available
                              ? "Mark Unavailable"
                              : "Make Available"}
                          </button>

                          <button
                            onClick={() =>
                              deleteProduct(product.id)
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

            </section>
          </>
        )}
      </div>
    </div>
  );
}