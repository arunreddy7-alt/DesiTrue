"use client";

import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

type Campaign = {
  id: number;
  name: string;
  title: string;
  message: string;
  target_segment: string | null;
  coupon_id: number | null;
  status: string;
  scheduled_at: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

type Coupon = {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
};

const segments = [
  {
    value: "",
    label: "All Customers",
  },
  {
    value: "new_customer",
    label: "New Customers",
  },
  {
    value: "returning_customer",
    label: "Returning Customers",
  },
  {
    value: "high_value_customer",
    label: "High Value Customers",
  },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generatingImage, setGeneratingImage] =
    useState<number | null>(null);
  const [campaignAction, setCampaignAction] =
    useState<number | null>(null);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetSegment, setTargetSegment] = useState("");
  const [couponId, setCouponId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const [selectedCampaign, setSelectedCampaign] =
    useState<Campaign | null>(null);

  // ---------------------------------------------------------
  // FETCH CAMPAIGNS
  // ---------------------------------------------------------

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/campaigns/`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch campaigns.");
      }

      const data = await response.json();

      setCampaigns(data);
    } catch (error) {
      console.error(
        "FETCH CAMPAIGNS ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // FETCH COUPONS
  // ---------------------------------------------------------

  const fetchCoupons = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/coupons/`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch coupons.");
      }

      const data = await response.json();

      setCoupons(data);
    } catch (error) {
      console.error(
        "FETCH COUPONS ERROR:",
        error
      );
    }
  };

  // ---------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------

  useEffect(() => {
    fetchCampaigns();
    fetchCoupons();
  }, []);

  // ---------------------------------------------------------
  // RESET FORM
  // ---------------------------------------------------------

  const resetForm = () => {
    setName("");
    setTitle("");
    setMessage("");
    setTargetSegment("");
    setCouponId("");
    setScheduledAt("");
  };

  // ---------------------------------------------------------
  // CREATE CAMPAIGN
  // ---------------------------------------------------------

  const createCampaign = async () => {
    if (!name.trim()) {
      alert("Please enter a campaign name.");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a campaign title.");
      return;
    }

    if (!message.trim()) {
      alert("Please enter a campaign message.");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch(
        `${API_URL}/api/campaigns/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            title: title.trim(),
            message: message.trim(),
            target_segment:
              targetSegment || null,
            coupon_id: couponId
              ? Number(couponId)
              : null,
            status: scheduledAt
              ? "scheduled"
              : "draft",
            scheduled_at: scheduledAt
              ? new Date(
                  scheduledAt
                ).toISOString()
              : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to create campaign."
        );
      }

      resetForm();

      await fetchCampaigns();

      setSelectedCampaign(data);

      alert(
        "Campaign created successfully."
      );
    } catch (error) {
      console.error(
        "CREATE CAMPAIGN ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to create campaign."
      );
    } finally {
      setCreating(false);
    }
  };

  // ---------------------------------------------------------
  // GENERATE AI IMAGE
  // ---------------------------------------------------------

  const generateImage = async (
    campaignId: number
  ) => {
    try {
      setGeneratingImage(campaignId);

      const response = await fetch(
        `${API_URL}/api/campaigns/${campaignId}/generate-image`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to generate AI creative."
        );
      }

      setCampaigns((previous) =>
        previous.map((campaign) =>
          campaign.id === campaignId
            ? data
            : campaign
        )
      );

      setSelectedCampaign(data);

    } catch (error) {
      console.error(
        "GENERATE IMAGE ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate AI creative."
      );
    } finally {
      setGeneratingImage(null);
    }
  };

  // ---------------------------------------------------------
  // ACTIVATE CAMPAIGN
  // ---------------------------------------------------------

  const activateCampaign = async (
    campaignId: number
  ) => {
    try {
      setCampaignAction(campaignId);

      const response = await fetch(
        `${API_URL}/api/campaigns/${campaignId}/activate`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to activate campaign."
        );
      }

      await fetchCampaigns();
    } catch (error) {
      console.error(
        "ACTIVATE CAMPAIGN ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to activate campaign."
      );
    } finally {
      setCampaignAction(null);
    }
  };

  // ---------------------------------------------------------
  // DEACTIVATE CAMPAIGN
  // ---------------------------------------------------------

  const deactivateCampaign = async (
    campaignId: number
  ) => {
    try {
      setCampaignAction(campaignId);

      const response = await fetch(
        `${API_URL}/api/campaigns/${campaignId}/deactivate`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to deactivate campaign."
        );
      }

      await fetchCampaigns();
    } catch (error) {
      console.error(
        "DEACTIVATE CAMPAIGN ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to deactivate campaign."
      );
    } finally {
      setCampaignAction(null);
    }
  };

  // ---------------------------------------------------------
  // DELETE CAMPAIGN
  // ---------------------------------------------------------

  const deleteCampaign = async (
    campaignId: number
  ) => {
    const confirmed = window.confirm(
      "Delete this campaign permanently?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCampaignAction(campaignId);

      const response = await fetch(
        `${API_URL}/api/campaigns/${campaignId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to delete campaign."
        );
      }

      if (
        selectedCampaign?.id ===
        campaignId
      ) {
        setSelectedCampaign(null);
      }

      await fetchCampaigns();
    } catch (error) {
      console.error(
        "DELETE CAMPAIGN ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete campaign."
      );
    } finally {
      setCampaignAction(null);
    }
  };

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  const getStatusStyle = (
    status: string
  ) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "scheduled":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "completed":
        return "bg-purple-50 text-purple-700 border-purple-200";

      default:
        return "bg-zinc-100 text-zinc-600 border-zinc-200";
    }
  };

  const formatSegment = (
    segment: string | null
  ) => {
    if (!segment) {
      return "All Customers";
    }

    return segment
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getCoupon = (
    couponId: number | null
  ) => {
    if (!couponId) return null;

    return coupons.find(
      (coupon) => coupon.id === couponId
    );
  };

  return (
    <main className="min-h-screen bg-[#f6f6f3] text-zinc-900">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

          <div className="flex items-center gap-4">

            <button
              onClick={() => {
                window.location.href =
                  "/admin";
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100"
            >
              ←
            </button>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                DesiTrue Admin
              </p>

              <h1 className="text-xl font-bold tracking-tight">
                AI Campaign Studio
              </h1>
            </div>

          </div>

          <div className="hidden items-center gap-3 sm:flex">

            <div className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-600">
              ✨ AI Powered
            </div>

            <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-600">
              {campaigns.length} Campaign
              {campaigns.length !== 1
                ? "s"
                : ""}
            </div>

          </div>

        </div>

      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <section className="mb-8 overflow-hidden rounded-3xl bg-black p-7 text-white shadow-xl sm:p-10">

          <div className="max-w-3xl">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-zinc-200">
              ✦ Campaign Intelligence
            </div>

            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
              Create campaigns.
              <br />
              Generate creatives.
              <br />
              Engage customers.
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
              Build targeted customer campaigns,
              generate promotional creatives with AI,
              attach offers, and prepare campaigns
              for WhatsApp engagement.
            </p>

          </div>

        </section>

        {/* ================================================= */}
        {/* BUILDER */}
        {/* ================================================= */}

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">

          {/* BUILDER */}

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="mb-7">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                  ✦
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    Campaign Builder
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Define who you want to reach.
                  </p>
                </div>

              </div>

            </div>

            <div className="space-y-5">

              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Campaign Name
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Weekend Comeback"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
                />
              </div>

              {/* TITLE */}

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Message Title
                </label>

                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="We Miss You ❤️"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
                />
              </div>

              {/* SEGMENT + COUPON */}

              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Target Audience
                  </label>

                  <select
                    value={targetSegment}
                    onChange={(e) =>
                      setTargetSegment(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-black"
                  >
                    {segments.map(
                      (segment) => (
                        <option
                          key={
                            segment.value
                          }
                          value={
                            segment.value
                          }
                        >
                          {segment.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Attach Offer
                  </label>

                  <select
                    value={couponId}
                    onChange={(e) =>
                      setCouponId(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-black"
                  >
                    <option value="">
                      No Coupon
                    </option>

                    {coupons
                      .filter(
                        (coupon) =>
                          coupon.is_active
                      )
                      .map((coupon) => (
                        <option
                          key={coupon.id}
                          value={coupon.id}
                        >
                          {coupon.code} —{" "}
                          {coupon.discount_value}
                          {coupon.discount_type ===
                          "percentage"
                            ? "% OFF"
                            : " ₹ OFF"}
                        </option>
                      ))}
                  </select>
                </div>

              </div>

              {/* MESSAGE */}

              <div>
                <div className="mb-2 flex items-center justify-between">

                  <label className="text-sm font-semibold">
                    Campaign Message
                  </label>

                  <span className="text-xs text-zinc-400">
                    WhatsApp ready
                  </span>

                </div>

                <textarea
                  value={message}
                  onChange={(e) =>
                    setMessage(
                      e.target.value
                    )
                  }
                  rows={6}
                  placeholder="Come back this weekend and enjoy a special discount on your next order!"
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-black focus:bg-white"
                />
              </div>

              {/* SCHEDULE */}

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Schedule
                </label>

                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) =>
                    setScheduledAt(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-black"
                />

                <p className="mt-2 text-xs text-zinc-400">
                  Leave empty to keep the campaign
                  as a draft.
                </p>
              </div>

              {/* CREATE */}

              <button
                onClick={createCampaign}
                disabled={creating}
                className="w-full rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? "Creating Campaign..."
                  : "Create Campaign →"}
              </button>

            </div>

          </div>

          {/* ================================================= */}
          {/* AI CREATIVE PANEL */}
          {/* ================================================= */}

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="mb-6 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  ✨
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    AI Creative
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Generate a promotional image.
                  </p>
                </div>

              </div>

            </div>

            {selectedCampaign ? (
              <div>

                {/* IMAGE */}

                <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100">

                  {selectedCampaign.image_url ? (
                    <img
                      src={`${API_URL}${selectedCampaign.image_url}`}
                      alt={
                        selectedCampaign.title
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center px-8 text-center">

                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                        ✦
                      </div>

                      <h3 className="font-bold text-zinc-900">
                        No creative yet
                      </h3>

                      <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
                        Generate an AI-powered
                        promotional image for this
                        campaign.
                      </p>

                    </div>
                  )}

                  {generatingImage ===
                    selectedCampaign.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">

                      <div className="text-center text-white">

                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />

                        <p className="font-semibold">
                          Generating creative...
                        </p>

                        <p className="mt-1 text-xs text-zinc-300">
                          AI is designing your
                          campaign image
                        </p>

                      </div>

                    </div>
                  )}

                </div>

                {/* CREATIVE INFO */}

                <div className="mt-5">

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Selected Campaign
                      </p>

                      <h3 className="mt-1 text-lg font-bold">
                        {selectedCampaign.title}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                        selectedCampaign.status
                      )}`}
                    >
                      {selectedCampaign.status}
                    </span>

                  </div>

                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    {selectedCampaign.message}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">

                    <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
                      {formatSegment(
                        selectedCampaign.target_segment
                      )}
                    </span>

                    {selectedCampaign.coupon_id &&
                      getCoupon(
                        selectedCampaign.coupon_id
                      ) && (
                        <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
                          🎟️{" "}
                          {
                            getCoupon(
                              selectedCampaign.coupon_id
                            )?.code
                          }
                        </span>
                      )}

                  </div>

                  {/* GENERATE BUTTON */}

                  <button
                    onClick={() =>
                      generateImage(
                        selectedCampaign.id
                      )
                    }
                    disabled={
                      generatingImage !== null
                    }
                    className="mt-6 w-full rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generatingImage ===
                    selectedCampaign.id
                      ? "Generating AI Creative..."
                      : selectedCampaign.image_url
                      ? "↻ Regenerate AI Creative"
                      : "✨ Generate AI Creative"}
                  </button>

                </div>

              </div>
            ) : (
              <div className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-8 text-center">

                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                  ✦
                </div>

                <h3 className="font-bold">
                  Select a campaign
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
                  Create a campaign below, then
                  generate its AI promotional
                  creative here.
                </p>

              </div>
            )}

          </div>

        </section>

        {/* ================================================= */}
        {/* CAMPAIGN LIST */}
        {/* ================================================= */}

        <section className="mt-8">

          <div className="mb-5 flex items-end justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Campaign Library
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Your Campaigns
              </h2>
            </div>

          </div>

          {loading ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-black" />
              <p className="text-sm text-zinc-500">
                Loading campaigns...
              </p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-xl">
                ✦
              </div>

              <h3 className="font-bold">
                No campaigns yet
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Create your first campaign using
                the builder above.
              </p>

            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">

              {campaigns.map(
                (campaign) => (
                  <div
                    key={campaign.id}
                    className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >

                    {/* IMAGE */}

                    <button
                      onClick={() =>
                        setSelectedCampaign(
                          campaign
                        )
                      }
                      className="relative block aspect-[16/8] w-full overflow-hidden bg-zinc-100 text-left"
                    >

                      {campaign.image_url ? (
                        <img
                          src={`${API_URL}${campaign.image_url}`}
                          alt={
                            campaign.title
                          }
                          className="h-full w-full object-cover transition duration-500 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">

                          <div className="text-center">

                            <div className="text-2xl">
                              ✦
                            </div>

                            <p className="mt-2 text-xs font-medium text-zinc-500">
                              AI creative not
                              generated
                            </p>

                          </div>

                        </div>
                      )}

                      <div className="absolute left-4 top-4">
                        <span
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize backdrop-blur ${getStatusStyle(
                            campaign.status
                          )}`}
                        >
                          {campaign.status}
                        </span>
                      </div>

                    </button>

                    {/* DETAILS */}

                    <div className="p-5">

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            {campaign.name}
                          </p>

                          <h3 className="mt-1 text-lg font-bold">
                            {campaign.title}
                          </h3>

                        </div>

                        <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
                          #{campaign.id}
                        </span>

                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-500">
                        {campaign.message}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">

                        <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
                          👥{" "}
                          {formatSegment(
                            campaign.target_segment
                          )}
                        </span>

                        {campaign.coupon_id &&
                          getCoupon(
                            campaign.coupon_id
                          ) && (
                            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
                              🎟️{" "}
                              {
                                getCoupon(
                                  campaign.coupon_id
                                )?.code
                              }
                            </span>
                          )}

                        {campaign.scheduled_at && (
                          <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
                            📅 Scheduled
                          </span>
                        )}

                      </div>

                      {/* ACTIONS */}

                      <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-100 pt-5">

                        <button
                          onClick={() =>
                            setSelectedCampaign(
                              campaign
                            )
                          }
                          className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                        >
                          View
                        </button>

                        <button
                          onClick={() =>
                            generateImage(
                              campaign.id
                            )
                          }
                          disabled={
                            generatingImage !==
                            null
                          }
                          className="rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {generatingImage ===
                          campaign.id
                            ? "Generating..."
                            : campaign.image_url
                            ? "Regenerate"
                            : "✨ Generate"}
                        </button>

                        {campaign.status ===
                        "active" ? (
                          <button
                            onClick={() =>
                              deactivateCampaign(
                                campaign.id
                              )
                            }
                            disabled={
                              campaignAction ===
                              campaign.id
                            }
                            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              activateCampaign(
                                campaign.id
                              )
                            }
                            disabled={
                              campaignAction ===
                              campaign.id
                            }
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                          >
                            Activate
                          </button>
                        )}

                        <button
                          onClick={() =>
                            deleteCampaign(
                              campaign.id
                            )
                          }
                          disabled={
                            campaignAction ===
                            campaign.id
                          }
                          className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}