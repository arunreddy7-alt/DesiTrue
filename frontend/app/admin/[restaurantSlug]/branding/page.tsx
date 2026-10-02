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

export default function RestaurantBrandingPage() {
  const params = useParams();
  const router = useRouter();

  const restaurantSlug = String(params.restaurantSlug);

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const [tagline, setTagline] = useState("");

  const [logoFile, setLogoFile] =
    useState<File | null>(null);

  const [bannerFile, setBannerFile] =
    useState<File | null>(null);

  const [logoPreview, setLogoPreview] =
    useState<string | null>(null);

  const [bannerPreview, setBannerPreview] =
    useState<string | null>(null);

  const [primaryColor, setPrimaryColor] =
    useState("#18181B");

  const [secondaryColor, setSecondaryColor] =
    useState("#FAF9F6");

  const [accentColor, setAccentColor] =
    useState("#F97316");

  // =========================================================
  // LOAD RESTAURANT
  // =========================================================

  useEffect(() => {
    const loadRestaurant = async () => {
      const token =
        localStorage.getItem("access_token");

      const storedUser =
        localStorage.getItem("auth_user");

      if (!token || !storedUser) {
        router.replace("/login");
        return;
      }

      try {
        const user: AuthUser =
          JSON.parse(storedUser);

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

        const selectedRestaurant =
          restaurants.find(
            (item) =>
              item.slug === restaurantSlug &&
              item.is_active
          );

        if (!selectedRestaurant) {
          router.replace("/admin");
          return;
        }

        // Restaurant admin can only access
        // their assigned restaurant.
        if (
          user.role ===
          "RESTAURANT_ADMIN"
        ) {
          if (
            !user.restaurant_id ||
            selectedRestaurant.id !==
              user.restaurant_id
          ) {
            router.replace("/admin");
            return;
          }
        }

        // Only OWNER and RESTAURANT_ADMIN
        // can access this page.
        if (
          user.role !== "OWNER" &&
          user.role !==
            "RESTAURANT_ADMIN"
        ) {
          router.replace("/admin");
          return;
        }

        setRestaurant(
          selectedRestaurant
        );

        setName(
          selectedRestaurant.name
        );

        setDescription(
          selectedRestaurant.description ||
            ""
        );

        setLogoUrl(
          selectedRestaurant.logo_url ||
            ""
        );

        setBannerUrl(
          selectedRestaurant.banner_url ||
            ""
        );

        setTagline(
          selectedRestaurant.tagline ||
            ""
        );

        setPrimaryColor(
          selectedRestaurant.primary_color ||
            "#18181B"
        );

        setSecondaryColor(
          selectedRestaurant.secondary_color ||
            "#FAF9F6"
        );

        setAccentColor(
          selectedRestaurant.accent_color ||
            "#F97316"
        );

        setLoading(false);
      } catch (error) {
        console.error(
          "Branding page error:",
          error
        );

        router.replace("/admin");
      }
    };

    loadRestaurant();
  }, [restaurantSlug, router]);

  // =========================================================
  // IMAGE UPLOAD
  // =========================================================

  const uploadImage = async (
    file: File
  ): Promise<string | null> => {
    if (!restaurant) {
      return null;
    }

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      router.replace("/login");
      return null;
    }

    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    try {
      const response = await fetch(
        `${API_URL}/api/restaurants/${restaurant.id}/branding/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
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

        return null;
      }

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Failed to upload image."
        );
      }

      const data =
        await response.json();

      return data.url as string;
    } catch (error) {
      console.error(
        "Image upload error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to upload image."
      );

      return null;
    }
  };

  // =========================================================
  // SAVE BRANDING
  // =========================================================

  const saveBranding = async () => {
    if (!restaurant) {
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

    setSaving(true);

    try {
      // Keep existing images unless
      // a new file was selected.
      let finalLogoUrl = logoUrl;
      let finalBannerUrl = bannerUrl;

      // -----------------------------------------------------
      // Upload new logo
      // -----------------------------------------------------

      if (logoFile) {
        const uploadedLogo =
          await uploadImage(
            logoFile
          );

        if (!uploadedLogo) {
          setSaving(false);
          return;
        }

        finalLogoUrl =
          uploadedLogo;
      }

      // -----------------------------------------------------
      // Upload new banner
      // -----------------------------------------------------

      if (bannerFile) {
        const uploadedBanner =
          await uploadImage(
            bannerFile
          );

        if (!uploadedBanner) {
          setSaving(false);
          return;
        }

        finalBannerUrl =
          uploadedBanner;
      }

      // -----------------------------------------------------
      // Update restaurant
      // -----------------------------------------------------

      const response =
        await fetch(
          `${API_URL}/api/restaurants/${restaurant.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              name,

              description:
                description || null,

              logo_url:
                finalLogoUrl || null,

              banner_url:
                finalBannerUrl || null,

              tagline:
                tagline || null,

              primary_color:
                primaryColor,

              secondary_color:
                secondaryColor,

              accent_color:
                accentColor,
            }),
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
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Failed to update restaurant branding."
        );
      }

      const updatedRestaurant:
        Restaurant =
          await response.json();

      setRestaurant(
        updatedRestaurant
      );

      // Update URLs with the newly
      // uploaded image paths.
      setLogoUrl(
        finalLogoUrl
      );

      setBannerUrl(
        finalBannerUrl
      );

      // Clear selected files.
      setLogoFile(null);
      setBannerFile(null);

      // Clear local previews.
      setLogoPreview(null);
      setBannerPreview(null);

      alert(
        "Branding updated successfully."
      );
    } catch (error) {
      console.error(
        "Branding update error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update branding."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOGO FILE SELECT
  // =========================================================

  const handleLogoChange = (
    file: File | null
  ) => {
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    setLogoFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setLogoPreview(previewUrl);
  };

  // =========================================================
  // BANNER FILE SELECT
  // =========================================================

  const handleBannerChange = (
    file: File | null
  ) => {
    if (!file) {
      setBannerFile(null);
      setBannerPreview(null);
      return;
    }

    setBannerFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setBannerPreview(previewUrl);
  };

  // =========================================================
  // IMAGE URL HELPER
  // =========================================================

  const getImageUrl = (
    imagePath: string | null
  ) => {
    if (!imagePath) {
      return null;
    }

    // If the backend already returned
    // a complete URL, use it directly.
    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    return `${API_URL}${imagePath}`;
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
          <p className="text-gray-500">
            Loading branding settings...
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

  // Current images
  const currentLogoUrl =
    getImageUrl(logoUrl);

  const currentBannerUrl =
    getImageUrl(bannerUrl);

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main
      className="min-h-screen bg-gray-100"
      style={{
        "--brand-primary": primaryColor,
        "--brand-secondary": secondaryColor,
        "--brand-accent": accentColor,
      } as React.CSSProperties}
    >

      {/* =================================================== */}
      {/* HEADER */}
      {/* =================================================== */}

      <header className="sticky top-0 z-50 px-6 py-5 text-white shadow-lg" style={{ backgroundColor: primaryColor }}>

        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-sm text-gray-400">
                Restaurant Admin
              </p>

              <h1 className="text-2xl font-bold">
                {restaurant.name}
              </h1>

              <p className="mt-1 text-sm text-gray-300">
                {tagline || "Branding & appearance"}
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

      {/* =================================================== */}
      {/* CONTENT */}
      {/* =================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-8">

          <h2 className="text-2xl font-bold text-gray-900">
            Restaurant Branding
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Customize how your restaurant appears to customers.
          </p>

        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* ================================================= */}
          {/* SETTINGS */}
          {/* ================================================= */}

          <div className="lg:col-span-2 space-y-6">

            {/* =============================================== */}
            {/* BASIC BRANDING */}
            {/* =============================================== */}

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

              <h3 className="text-lg font-semibold text-gray-900">
                Basic Branding
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Configure your restaurant's identity.
              </p>

              <div className="mt-6 space-y-5">

                {/* Restaurant Name */}

                <div>

                  <label className="text-sm font-medium text-gray-700">
                    Restaurant Name
                  </label>

                  <input
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    placeholder="Restaurant name"
                  />

                </div>

                {/* Tagline */}

                <div>

                  <label className="text-sm font-medium text-gray-700">
                    Tagline
                  </label>

                  <input
                    value={tagline}
                    onChange={(e) =>
                      setTagline(
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    placeholder="Fresh food. Great vibes."
                  />

                </div>

                {/* Description */}

                <div>

                  <label className="text-sm font-medium text-gray-700">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    placeholder="Tell customers about your restaurant..."
                  />

                </div>

              </div>

            </section>

            {/* =============================================== */}
            {/* IMAGES */}
            {/* =============================================== */}

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

              <h3 className="text-lg font-semibold text-gray-900">
                Images
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Upload your restaurant logo and banner image.
              </p>

              <div className="mt-6 space-y-6">

                {/* ========================================= */}
                {/* LOGO */}
                {/* ========================================= */}

                <div>

                  <label className="text-sm font-medium text-gray-700">
                    Restaurant Logo
                  </label>

                  <div className="mt-2 rounded-xl border border-dashed border-gray-300 p-5">

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) =>
                        handleLogoChange(
                          e.target.files?.[0] ||
                            null
                        )
                      }
                      className="block w-full text-sm text-gray-500"
                    />


                    {logoFile && (
                      <p className="mt-3 text-sm font-medium text-gray-700">
                        Selected:{" "}
                        {logoFile.name}
                      </p>
                    )}

                    {/* Logo preview */}

                    {(logoPreview ||
                      currentLogoUrl) && (
                      <div className="mt-4">

                        <p className="mb-2 text-xs font-medium text-gray-500">
                          Preview
                        </p>

                        <img
                          src={
                            logoPreview ||
                            currentLogoUrl ||
                            ""
                          }
                          alt="Restaurant logo"
                          className="h-24 w-24 rounded-xl border object-cover"
                        />

                      </div>
                    )}

                  </div>

                </div>

                {/* ========================================= */}
                {/* BANNER */}
                {/* ========================================= */}

                <div>

                  <label className="text-sm font-medium text-gray-700">
                    Restaurant Banner
                  </label>

                  <div className="mt-2 rounded-xl border border-dashed border-gray-300 p-5">

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) =>
                        handleBannerChange(
                          e.target.files?.[0] ||
                            null
                        )
                      }
                      className="block w-full text-sm text-gray-500"
                    />

                   

                    {bannerFile && (
                      <p className="mt-3 text-sm font-medium text-gray-700">
                        Selected:{" "}
                        {bannerFile.name}
                      </p>
                    )}

                    {/* Banner preview */}

                    {(bannerPreview ||
                      currentBannerUrl) && (
                      <div className="mt-4">

                        <p className="mb-2 text-xs font-medium text-gray-500">
                          Preview
                        </p>

                        <img
                          src={
                            bannerPreview ||
                            currentBannerUrl ||
                            ""
                          }
                          alt="Restaurant banner"
                          className="h-40 w-full rounded-xl border object-cover"
                        />

                      </div>
                    )}

                  </div>

                </div>

              </div>

            </section>

            {/* =============================================== */}
            {/* COLORS */}
            {/* =============================================== */}

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

              <h3 className="text-lg font-semibold text-gray-900">
                Brand Colors
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Choose the colors used across the customer experience.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-3">

                <ColorInput
                  label="Primary"
                  value={primaryColor}
                  onChange={
                    setPrimaryColor
                  }
                />

                <ColorInput
                  label="Secondary"
                  value={
                    secondaryColor
                  }
                  onChange={
                    setSecondaryColor
                  }
                />

                <ColorInput
                  label="Accent"
                  value={accentColor}
                  onChange={
                    setAccentColor
                  }
                />

              </div>

            </section>

            {/* =============================================== */}
            {/* SAVE */}
            {/* =============================================== */}

            <div className="flex justify-end">

              <button
                onClick={saveBranding}
                disabled={saving}
                className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Uploading & Saving..."
                  : "Save Branding"}
              </button>

            </div>

          </div>

          {/* ================================================= */}
          {/* PREVIEW */}
          {/* ================================================= */}

          <div>

            <div className="sticky top-28 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <h3 className="text-lg font-semibold text-gray-900">
                Preview
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Customer-facing preview.
              </p>

              <div
                className="mt-5 overflow-hidden rounded-2xl border"
                style={{
                  backgroundColor:
                    secondaryColor,
                }}
              >

                {/* Banner */}

                {(
                  bannerPreview ||
                  currentBannerUrl
                ) ? (

                  <img
                    src={
                      bannerPreview ||
                      currentBannerUrl ||
                      ""
                    }
                    alt="Restaurant banner"
                    className="h-32 w-full object-cover"
                  />

                ) : (

                  <div
                    className="flex h-32 items-center justify-center text-white"
                    style={{
                      backgroundColor:
                        primaryColor,
                    }}
                  >
                    Banner Preview
                  </div>

                )}

                <div className="p-5">

                  <div className="flex items-center gap-3">

                    {/* Logo */}

                    {(
                      logoPreview ||
                      currentLogoUrl
                    ) ? (

                      <img
                        src={
                          logoPreview ||
                          currentLogoUrl ||
                          ""
                        }
                        alt="Restaurant logo"
                        className="h-14 w-14 rounded-xl object-cover border"
                      />

                    ) : (

                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white"
                        style={{
                          backgroundColor:
                            accentColor,
                        }}
                      >
                        {name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                    )}

                    <div>

                      <h4
                        className="font-bold"
                        style={{
                          color:
                            primaryColor,
                        }}
                      >
                        {name ||
                          "Restaurant Name"}
                      </h4>

                      <p className="text-xs text-gray-500">
                        {tagline ||
                          "Your restaurant tagline"}
                      </p>

                    </div>

                  </div>

                  {/* Order Button */}

                  <button
                    className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white"
                    style={{
                      backgroundColor:
                        accentColor,
                    }}
                  >
                    Order Now
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

// ===========================================================
// COLOR INPUT
// ===========================================================

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>

      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="mt-2 flex items-center gap-3">

        <input
          type="color"
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          className="h-12 w-14 cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
        />

        <input
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-3 text-sm uppercase outline-none focus:border-black"
          placeholder="#000000"
        />

      </div>

    </div>
  );
}