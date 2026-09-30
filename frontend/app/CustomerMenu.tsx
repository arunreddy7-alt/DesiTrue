"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Mic,
  MicOff,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Smartphone,
  Star,
  X,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

type Category = {
  id: number;
  restaurant_id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
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

type CartItem = {
  product: Product;
  quantity: number;
};

type Customer = {
  id: number;
  name: string | null;
  phone: string | null;
  whatsapp_opt_in: boolean;
  segment: string;
};

type OrderItem = {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  line_total: string | number;
};

type Order = {
  id: number;
  restaurant_id: number;
  customer_id: number | null;
  status: string;
  subtotal: string | number;
  discount: string | number;
  total: string | number;
  payment_status: string;
  items: OrderItem[];
};

type Feedback = {
  id: number;
  sentiment?: string | null;
  issue?: string | null;
};

type CouponValidationResponse = {
  valid: boolean;
  message: string;
  coupon_code: string | null;
  discount: number;
  final_total: number | null;
};

type VoiceAction =
  | "add_to_cart"
  | "remove_from_cart"
  | "update_quantity"
  | "view_cart"
  | "recommend_items"
  | "ask_clarification"
  | "checkout_confirmation"
  | "checkout"
  | "unknown";

type VoiceConversationState = {
  pending_product_ids: number[];
  last_selected_product_id: number | null;
  last_mentioned_product_id: number | null;
  pending_intent: string | null;
};

type VoiceResponse = {
  action: VoiceAction;
  product_id: number | null;
  quantity: number;
  response: string;
  requires_confirmation: boolean;
  conversation_state: VoiceConversationState;
};

type VoiceMessage = {
  role: "user" | "assistant";
  message: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const STATUS_STEPS = [
  {
    key: "confirmed",
    label: "Order Placed",
  },
  {
    key: "preparing",
    label: "Preparing",
  },
  {
    key: "ready",
    label: "Ready",
  },
  {
    key: "delivered",
    label: "Delivered",
  },
];

function money(value: number | string) {
  return `₹${Number(value).toFixed(0)}`;
}

function normalizeStatus(status: string) {
  if (status === "pending") return "confirmed";
  return status;
}

export default function Home() {
  const pathname = usePathname();

const restaurantSlug =
  pathname
    .split("/")
    .filter(Boolean)[0] || "desitrue";

const [restaurant, setRestaurant] =
  useState<Restaurant | null>(null);

const [products, setProducts] =
  useState<Product[]>([]);

const [categories, setCategories] =
  useState<Category[]>([]);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [productQuantity, setProductQuantity] = useState(1);

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("upi");

  const [isProcessingPayment, setIsProcessingPayment] =
    useState(false);

  const [checkoutError, setCheckoutError] = useState("");

  const [createdOrder, setCreatedOrder] =
    useState<Order | null>(null);

  const [trackingOrder, setTrackingOrder] =
    useState<Order | null>(null);

  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] =
    useState(false);

  const [feedbackError, setFeedbackError] = useState("");

  const [isSubmittingFeedback, setIsSubmittingFeedback] =
    useState(false);

  const [isLoadingProducts, setIsLoadingProducts] =
    useState(true);

  const [productsError, setProductsError] = useState("");

  // =========================================================
  // COUPON STATE
  // =========================================================

  const [couponCode, setCouponCode] = useState("");

  const [appliedCoupon, setAppliedCoupon] =
    useState<string | null>(null);

  const [couponDiscount, setCouponDiscount] =
    useState(0);

  const [couponError, setCouponError] = useState("");

  const [isApplyingCoupon, setIsApplyingCoupon] =
    useState(false);

  // =========================================================
  // VOICE ORDERING
  // =========================================================

  const [voiceOpen, setVoiceOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(
    "Tap the microphone and tell me what you want."
  );
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const voiceRecognitionRef =
    useRef<SpeechRecognitionLike | null>(null);
  const voiceSessionRef = useRef(false);
  const voiceMessagesRef = useRef<VoiceMessage[]>([]);
  const voiceStateRef = useRef<VoiceConversationState>({
    pending_product_ids: [],
    last_selected_product_id: null,
    last_mentioned_product_id: null,
    pending_intent: null,
  });

  useEffect(() => {
    voiceMessagesRef.current = voiceMessages;
  }, [voiceMessages]);

  // =========================================================
  // VOICE ORDERING HELPERS
  // =========================================================

  const speakVoiceResponse = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      if (voiceSessionRef.current && !checkoutOpen) {
        window.setTimeout(() => startVoiceListening(), 250);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopVoiceListening = () => {
    try {
      voiceRecognitionRef.current?.stop();
    } catch {
      // Recognition may already be stopped.
    }

    setIsListening(false);
  };

  const stopVoiceSession = () => {
    voiceSessionRef.current = false;
    stopVoiceListening();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setVoiceOpen(false);
    setIsVoiceProcessing(false);
    setVoiceStatus("Voice ordering stopped.");
  };

  const handleVoiceCommand = async (transcript: string) => {
    if (!restaurant || !transcript.trim()) return;

    const cleanTranscript = transcript.trim();
    setVoiceTranscript(cleanTranscript);
    setIsVoiceProcessing(true);
    setVoiceStatus("Thinking...");

    const userMessage: VoiceMessage = {
      role: "user",
      message: cleanTranscript,
    };

    const historyForRequest = voiceMessagesRef.current.slice(-6);

    setVoiceMessages((current) => [
      ...current,
      userMessage,
    ]);

    try {
      const response = await fetch(`${API_URL}/api/voice/command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          transcript: cleanTranscript,
          cart,
          conversation_history: historyForRequest,
          conversation_state: voiceStateRef.current,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Voice assistant failed to respond."
        );
      }

      const result = data as VoiceResponse;

      if (result.conversation_state) {
        voiceStateRef.current = result.conversation_state;
      }

      setVoiceMessages((current) => [
        ...current,
        {
          role: "assistant",
          message: result.response,
        },
      ]);

      if (result.action === "add_to_cart") {
        const product = products.find(
          (item) => item.id === result.product_id
        );

        if (product) {
          addToCart(product, result.quantity || 1);
          setVoiceStatus(`${product.name} added to your cart.`);
        } else {
          setVoiceStatus("I couldn't find that item on the menu.");
        }
      } else if (result.action === "remove_from_cart") {
        if (result.product_id !== null) {
          removeFromCart(result.product_id);
        }
        setVoiceStatus(result.response);
      } else if (result.action === "update_quantity") {
        if (result.product_id !== null) {
          const currentItem = cart.find(
            (item) => item.product.id === result.product_id
          );

          if (currentItem) {
            const change = (result.quantity || 1) - currentItem.quantity;
            if (change !== 0) {
              updateCartQuantity(result.product_id, change);
            }
          }
        }
        setVoiceStatus(result.response);
      } else if (result.action === "view_cart") {
        setIsCartOpen(true);
        setVoiceStatus(result.response);
      } else if (result.action === "checkout_confirmation") {
        // The customer is finished. Close the voice overlay so the
        // existing cart drawer is actually visible above it.
        voiceSessionRef.current = false;
        stopVoiceListening();

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }

        setVoiceStatus(result.response);
        setVoiceOpen(false);
        setIsCartOpen(true);
      } else if (result.action === "checkout") {
        // Close voice/cart UI and open the existing checkout directly.
        // Do not navigate home or clear the cart.
        voiceSessionRef.current = false;
        stopVoiceListening();

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }

        setVoiceStatus(result.response);
        setVoiceOpen(false);
        setIsCartOpen(false);
        setCheckoutError("");
        setCheckoutOpen(true);
      } else {
        setVoiceStatus(result.response);
      }

      speakVoiceResponse(result.response);
    } catch (error) {
      console.error("Voice ordering error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Sorry, I couldn't process that request.";

      setVoiceStatus(message);
      speakVoiceResponse(message);
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  const startVoiceListening = () => {
    if (!voiceSessionRef.current) return;

    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceStatus(
        "Voice input is not supported in this browser. Try Chrome or Edge."
      );
      return;
    }

    if (isVoiceProcessing) return;

    try {
      voiceRecognitionRef.current?.abort();
    } catch {
      // Ignore an already stopped recognition instance.
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0]?.transcript || "";

        if (event.results[i].isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      const displayed = (finalTranscript || interimTranscript).trim();
      setVoiceTranscript(displayed);

      if (finalTranscript.trim()) {
        setIsListening(false);
        void handleVoiceCommand(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);

      if (event?.error === "aborted") return;

      if (event?.error === "not-allowed") {
        setVoiceStatus(
          "Microphone permission was blocked. Allow microphone access and try again."
        );
        return;
      }

      if (event?.error === "no-speech") {
        setVoiceStatus("I didn't hear anything. Try again.");
        return;
      }

      setVoiceStatus("I couldn't hear you. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    voiceRecognitionRef.current = recognition;
    setVoiceTranscript("");
    setVoiceStatus("Listening...");
    setIsListening(true);

    try {
      recognition.start();
    } catch (error) {
      console.error("Voice recognition start error:", error);
      setIsListening(false);
      setVoiceStatus("Couldn't start the microphone. Try again.");
    }
  };

  const startVoiceSession = () => {
    if (!restaurant) return;

    voiceSessionRef.current = true;
    setVoiceOpen(true);
    setVoiceMessages([]);
    voiceMessagesRef.current = [];
    voiceStateRef.current = {
      pending_product_ids: [],
      last_selected_product_id: null,
      last_mentioned_product_id: null,
      pending_intent: null,
    };
    setVoiceTranscript("");
    setVoiceStatus(
      `Hi! I'm your ${restaurant.name} ordering assistant. What would you like?`
    );

    const greeting =
      `Hi! I'm your ${restaurant.name} ordering assistant. What would you like?`;

    speakVoiceResponse(greeting);
  };

  useEffect(() => {
    return () => {
      voiceSessionRef.current = false;

      try {
        voiceRecognitionRef.current?.abort();
      } catch {
        // Ignore cleanup errors.
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

 useEffect(() => {
  const loadRestaurantMenu = async () => {
    try {
      setIsLoadingProducts(true);
      setProductsError("");

      // ---------------------------------------------
      // 1. Find restaurant from URL slug
      // ---------------------------------------------

      const restaurantsResponse = await fetch(
        `${API_URL}/api/restaurants/`,
        {
          cache: "no-store",
        },
      );

      if (!restaurantsResponse.ok) {
        throw new Error(
          "Failed to load restaurants.",
        );
      }

      const restaurants: Restaurant[] =
        await restaurantsResponse.json();

      const selectedRestaurant =
        restaurants.find(
          (item) =>
            item.slug === restaurantSlug &&
            item.is_active,
        );

      if (!selectedRestaurant) {
        throw new Error(
          "Restaurant not found or currently unavailable.",
        );
      }

      setRestaurant(selectedRestaurant);

      // ---------------------------------------------
      // 2. Load restaurant categories
      // ---------------------------------------------

      const categoriesResponse = await fetch(
        `${API_URL}/api/categories/?restaurant_id=${selectedRestaurant.id}`,
        {
          cache: "no-store",
        },
      );

      if (!categoriesResponse.ok) {
        throw new Error(
          "Failed to load categories.",
        );
      }

      const categoryList: Category[] =
        await categoriesResponse.json();

      setCategories(
        categoryList.filter(
          (category) => category.is_active,
        ),
      );

      // ---------------------------------------------
      // 3. Load restaurant products
      // ---------------------------------------------

      const productsResponse = await fetch(
        `${API_URL}/api/products/?restaurant_id=${selectedRestaurant.id}`,
        {
          cache: "no-store",
        },
      );

      if (!productsResponse.ok) {
        throw new Error(
          "Failed to load products.",
        );
      }

      const data = await productsResponse.json();

      const productList: Product[] =
        Array.isArray(data)
          ? data
          : data.products || [];

      setProducts(productList);
    } catch (error) {
      console.error(
        "Restaurant menu error:",
        error,
      );

      setProductsError(
        error instanceof Error
          ? error.message
          : "We couldn't load the menu. Please try again.",
      );
    } finally {
      setIsLoadingProducts(false);
    }
  };

  loadRestaurantMenu();
}, [restaurantSlug]);

  // =========================================================
  // FILTER PRODUCTS
  // =========================================================

  const filteredProducts = useMemo(() => {
  return products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" ||
      product.category_id ===
        Number(selectedCategory);

    const search =
      searchQuery.toLowerCase().trim();

    const category = categories.find(
      (item) => item.id === product.category_id,
    );

    const categoryName =
      category?.name || "";

    const matchesSearch =
      !search ||
      product.name
        .toLowerCase()
        .includes(search) ||
      product.description
        ?.toLowerCase()
        .includes(search) ||
      categoryName
        .toLowerCase()
        .includes(search);

    return (
      matchesCategory &&
      matchesSearch
    );
  });
}, [
  products,
  categories,
  selectedCategory,
  searchQuery,
]);
  // =========================================================
  // CART
  // =========================================================

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.product.price) * item.quantity,
    0
  );

  // Final checkout total after coupon
  const finalTotal = Math.max(
    0,
    cartTotal - couponDiscount
  );

  // =========================================================
  // ADD TO CART
  // =========================================================

  const addToCart = (
    product: Product,
    quantity = 1
  ) => {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + quantity,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          product,
          quantity,
        },
      ];
    });
  };

  // =========================================================
  // UPDATE CART
  // =========================================================

  const updateCartQuantity = (
    productId: number,
    change: number
  ) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity:
                  item.quantity + change,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // =========================================================
  // REMOVE FROM CART
  // =========================================================

  const removeFromCart = (productId: number) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.product.id !== productId
      )
    );
  };

  // =========================================================
  // PRODUCT DETAILS
  // =========================================================

  const openProductDetails = (
    product: Product
  ) => {
    setSelectedProduct(product);
    setProductQuantity(1);
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
    setProductQuantity(1);
  };

  const addSelectedProductToCart = () => {
    if (!selectedProduct) return;

    addToCart(
      selectedProduct,
      productQuantity
    );

    closeProductDetails();
    setIsCartOpen(true);
  };

  // =========================================================
  // COUPON
  // =========================================================

 const applyCoupon = async () => {
  setCouponError("");

  const code = couponCode.trim().toUpperCase();

  if (!restaurant) {
    setCouponError(
      "Restaurant information is unavailable."
    );
    return;
  }

  if (!code) {
    setCouponError("Please enter a coupon code.");
    return;
  }

  if (cart.length === 0) {
    setCouponError("Your cart is empty.");
    return;
  }

  if (!restaurant) {
    setCouponError(
      "Restaurant information is unavailable."
    );
    return;
  }

  try {
    setIsApplyingCoupon(true);

    const response = await fetch(
      `${API_URL}/api/coupons/validate`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          restaurant_id: restaurant.id,
          code,
          order_total: cartTotal,
        }),
      }
    );

    const data: CouponValidationResponse =
      await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data?.message === "string"
          ? data.message
          : "Failed to validate coupon."
      );
    }

    if (!data.valid) {
      setAppliedCoupon(null);
      setCouponDiscount(0);

      setCouponError(
        data.message ||
          "This coupon cannot be applied."
      );

      return;
    }

    setAppliedCoupon(
      data.coupon_code || code
    );

    setCouponDiscount(
      Number(data.discount || 0)
    );

    setCouponCode(
      data.coupon_code || code
    );

    setCouponError("");
  } catch (error) {
    console.error(
      "COUPON VALIDATION ERROR:",
      error
    );

    setAppliedCoupon(null);
    setCouponDiscount(0);

    setCouponError(
      error instanceof Error
        ? error.message
        : "Failed to apply coupon."
    );
  } finally {
    setIsApplyingCoupon(false);
  }
};

  // =========================================================
  // REMOVE COUPON
  // =========================================================

  const removeCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponError("");
  };

  // =========================================================
  // CHECKOUT
  // =========================================================

  const openCheckout = () => {
    if (cart.length === 0) return;

    setCheckoutError("");

    setIsCartOpen(false);
    setCheckoutOpen(true);
  };

  const closeCheckout = () => {
    if (isProcessingPayment) return;

    setCheckoutOpen(false);
    setCheckoutError("");
  };

  // =========================================================
  // CREATE CUSTOMER + ORDER + PAYMENT
  // =========================================================

  const handlePayment = async () => {
    setCheckoutError("");
    if (!restaurant) {
  setCheckoutError(
    "Restaurant information is unavailable.",
  );
  return;
}
    if (!customerName.trim()) {
      setCheckoutError(
        "Please enter your name."
      );
      return;
    }

    if (!customerPhone.trim()) {
      setCheckoutError(
        "Please enter your phone number."
      );
      return;
    }

    if (cart.length === 0) {
      setCheckoutError(
        "Your cart is empty."
      );
      return;
    }

    try {
      setIsProcessingPayment(true);

      // =====================================================
      // 1. CREATE / FIND CUSTOMER
      // =====================================================

      const customerResponse =
        await fetch(
          `${API_URL}/api/customers/`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: customerName.trim(),
              phone: customerPhone.trim(),
              whatsapp_opt_in:
                whatsappOptIn,
            }),
          }
        );

      if (!customerResponse.ok) {
        throw new Error(
          "Failed to create customer."
        );
      }

      const customer: Customer =
        await customerResponse.json();

      // =====================================================
      // 2. CREATE ORDER
      // =====================================================
      //
      // NOTE:
      // The backend coupon/order integration will be
      // completed in the next step.
      //
      // We are already sending coupon_code here so the
      // frontend is ready for that backend change.
      // =====================================================

      const orderResponse =
        await fetch(
          `${API_URL}/api/orders/`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
  restaurant_id: restaurant?.id,
  customer_id: customer.id,
  items: cart.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
                })
              ),

              coupon_code:
                appliedCoupon,
            }),
          }
        );

      if (!orderResponse.ok) {
        const errorData =
          await orderResponse
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Failed to create order."
        );
      }

      const order: Order =
        await orderResponse.json();

      // =====================================================
      // 3. SIMULATED PAYMENT
      // =====================================================

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 1200)
      );

      const paymentResponse =
        await fetch(
          `${API_URL}/api/payments/${order.id}/simulate`,
          {
            method: "POST",
          }
        );

      if (!paymentResponse.ok) {
        const errorData =
          await paymentResponse
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Payment failed."
        );
      }

      // =====================================================
      // 4. FETCH LATEST ORDER
      // =====================================================

      const latestOrderResponse =
        await fetch(
          `${API_URL}/api/orders/${order.id}`
        );

      if (!latestOrderResponse.ok) {
        throw new Error(
          "Failed to load order."
        );
      }

      const latestOrder: Order =
        await latestOrderResponse.json();

      setCreatedOrder(latestOrder);
      setTrackingOrder(latestOrder);

      setCheckoutOpen(false);
      setIsCartOpen(false);

      // Keep cart temporarily so the order summary
      // can show product names/images.
    } catch (error) {
      console.error(
        "Payment/order error:",
        error
      );

      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // =========================================================
  // POLL ORDER STATUS
  // =========================================================

  useEffect(() => {
    if (!trackingOrder?.id) return;

    if (
      normalizeStatus(
        trackingOrder.status
      ) === "delivered"
    ) {
      return;
    }

    const interval =
      setInterval(async () => {
        try {
          const response =
            await fetch(
              `${API_URL}/api/orders/${trackingOrder.id}`,
              {
                cache: "no-store",
              }
            );

          if (!response.ok) return;

          const updatedOrder: Order =
            await response.json();

          setTrackingOrder(
            updatedOrder
          );

          setCreatedOrder(
            updatedOrder
          );

          if (
            normalizeStatus(
              updatedOrder.status
            ) === "delivered"
          ) {
            clearInterval(interval);
          }
        } catch (error) {
          console.error(
            "Order status refresh error:",
            error
          );
        }
      }, 3000);

    return () =>
      clearInterval(interval);
  }, [
    trackingOrder?.id,
    trackingOrder?.status,
  ]);

  // =========================================================
  // STATUS
  // =========================================================

  const currentStatus =
    normalizeStatus(
      trackingOrder?.status ||
        "confirmed"
    );

  const currentStatusIndex =
    STATUS_STEPS.findIndex(
      (step) =>
        step.key === currentStatus
    );

  const isDelivered =
    currentStatus ===
    "delivered";

  // =========================================================
  // FEEDBACK
  // =========================================================

  const handleSubmitFeedback =
    async () => {
      if (!createdOrder) return;

      setFeedbackError("");

      if (feedbackRating === 0) {
        setFeedbackError(
          "Please select a rating."
        );
        return;
      }

      if (!feedbackText.trim()) {
        setFeedbackError(
          "Please tell us about your experience."
        );
        return;
      }

      try {
        setIsSubmittingFeedback(
          true
        );

        const feedbackResponse =
          await fetch(
            `${API_URL}/api/feedback/`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                customer_id:
                  createdOrder.customer_id,

                order_id:
                  createdOrder.id,

                rating:
                  feedbackRating,

                text:
                  feedbackText.trim(),
              }),
            }
          );

        if (!feedbackResponse.ok) {
          throw new Error(
            "Failed to submit feedback."
          );
        }

        const feedback: Feedback =
          await feedbackResponse.json();

        // AI analysis in background
        try {
          await fetch(
            `${API_URL}/api/feedback/${feedback.id}/analyze`,
            {
              method: "POST",
            }
          );
        } catch (analysisError) {
          console.error(
            "Background feedback analysis error:",
            analysisError
          );
        }

        setFeedbackSubmitted(
          true
        );
      } catch (error) {
        console.error(
          "Feedback error:",
          error
        );

        setFeedbackError(
          "We couldn't submit your feedback. Please try again."
        );
      } finally {
        setIsSubmittingFeedback(
          false
        );
      }
    };

  // =========================================================
  // RESET / BACK TO MENU
  // =========================================================

  const backToMenu = () => {
    setCreatedOrder(null);
    setTrackingOrder(null);

    setFeedbackRating(0);
    setFeedbackText("");
    setFeedbackSubmitted(
      false
    );
    setFeedbackError("");

    setCustomerName("");
    setCustomerPhone("");
    setWhatsappOptIn(false);

    // Reset coupon
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponError("");

    setCart([]);
  };

  // =========================================================
  // ORDER SUMMARY HELPERS
  // =========================================================

  const getProductForOrderItem = (
    productId: number
  ) => {
    const cartProduct =
      cart.find(
        (item) =>
          item.product.id ===
          productId
      );

    if (cartProduct)
      return cartProduct.product;

    return products.find(
      (product) =>
        product.id === productId
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">

          <button
            onClick={backToMenu}
            className="text-left"
          >
            <div className="text-2xl font-black tracking-tight">
  {restaurant?.name || "Loading..."}
</div>

            <div className="text-xs text-zinc-500">
              Order. Enjoy. Share.
            </div>
          </button>

          <div className="flex items-center">
          <button
            onClick={() =>
              setIsCartOpen(true)
            }
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-800"
          >
            <ShoppingBag size={20} />

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={startVoiceSession}
            disabled={!restaurant}
            className="ml-2 flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Start voice ordering"
          >
            <Mic size={20} />
          </button>
          </div>

        </div>

      </header>

      {/* ================================================== */}
      {/* ORDER TRACKING */}
      {/* ================================================== */}

      {trackingOrder && (

        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">

            <div className="border-b border-zinc-100 p-6 sm:p-8">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-sm font-medium text-zinc-500">
                    Your Order
                  </p>

                  <h1 className="mt-1 text-2xl font-black">
                    Order #
                    {trackingOrder.id}
                  </h1>

                </div>

                <div className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold capitalize">
                  {currentStatus}
                </div>

              </div>

            </div>

            {/* ORDER ITEMS */}

            <div className="border-b border-zinc-100 p-6 sm:p-8">

              <h2 className="mb-4 text-lg font-bold">
                Your order
              </h2>

              <div className="space-y-4">

                {trackingOrder.items.map(
                  (item) => {

                    const product =
                      getProductForOrderItem(
                        item.product_id
                      );

                    return (
                      <div
                        key={
                          item.id ??
                          `${item.product_id}-${item.quantity}`
                        }
                        className="flex items-center justify-between gap-4"
                      >

                        <div className="flex items-center gap-3">

                          <div className="h-14 w-14 overflow-hidden rounded-xl bg-zinc-100">

                            {product?.image_url ? (
                              <img
                                src={
                                  product.image_url
                                }
                                alt={
                                  product.name
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-2xl">
                                🍔
                              </div>
                            )}

                          </div>

                          <div>

                            <p className="font-semibold">
                              {product?.name ||
                                `Product #${item.product_id}`}
                            </p>

                            <p className="text-sm text-zinc-500">
                              ×{" "}
                              {
                                item.quantity
                              }
                            </p>

                          </div>

                        </div>

                        <p className="font-semibold">
                          {money(
                            item.line_total
                          )}
                        </p>

                      </div>
                    );
                  }
                )}

              </div>

              <div className="mt-6 flex justify-between border-t border-zinc-100 pt-4 text-lg font-black">

                <span>Total</span>

                <span>
                  {money(
                    trackingOrder.total
                  )}
                </span>

              </div>

            </div>

            {/* STATUS */}

            <div className="p-6 sm:p-8">

              <h2 className="mb-8 text-lg font-bold">
                Order status
              </h2>

              <div className="relative">

                <div className="absolute left-[18px] top-4 h-[calc(100%-32px)] w-0.5 bg-zinc-200 sm:left-1/2 sm:h-0.5 sm:w-[calc(100%-80px)] sm:-translate-x-1/2" />

                <div className="relative grid grid-cols-1 gap-7 sm:grid-cols-4 sm:gap-3">

                  {STATUS_STEPS.map(
                    (
                      step,
                      index
                    ) => {

                      const completed =
                        currentStatusIndex >=
                        index;

                      const active =
                        currentStatusIndex ===
                        index;

                      return (

                        <div
                          key={
                            step.key
                          }
                          className="relative flex items-center gap-4 sm:flex-col sm:gap-3 sm:text-center"
                        >

                          <div
                            className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                              completed
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : "border-zinc-300 bg-white text-zinc-400"
                            }`}
                          >

                            {completed ? (
                              <Check size={17} />
                            ) : (
                              <span className="text-xs">
                                {index +
                                  1}
                              </span>
                            )}

                          </div>

                          <div>

                            <p
                              className={`text-sm font-bold ${
                                active
                                  ? "text-zinc-900"
                                  : completed
                                    ? "text-zinc-700"
                                    : "text-zinc-400"
                              }`}
                            >
                              {
                                step.label
                              }
                            </p>

                            {active &&
                              !isDelivered && (
                                <p className="mt-1 text-xs text-zinc-500">
                                  Your order is being
                                  processed
                                </p>
                              )}

                          </div>

                        </div>

                      );
                    }
                  )}

                </div>

              </div>

            </div>

            {/* WAITING */}

            {!isDelivered && (

              <div className="border-t border-zinc-100 bg-zinc-50 p-6 sm:p-8">

                <div className="flex items-start gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                    <Clock3 size={19} />
                  </div>

                  <div>

                    <h3 className="font-bold">
                      We&apos;ll keep you updated
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      The order status updates automatically
                      when the restaurant changes it.
                    </p>

                  </div>

                </div>

              </div>

            )}

            {/* DELIVERY + FEEDBACK */}

            {isDelivered && (

              <div className="border-t border-zinc-100 p-6 sm:p-8">

                {!feedbackSubmitted ? (

                  <>

                    <div className="mb-7 text-center">

                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <Check size={28} />
                      </div>

                      <h2 className="text-2xl font-black">
                        Your order has been delivered!
                      </h2>

                      <p className="mt-2 text-sm text-zinc-500">
                        How was your experience?
                      </p>

                    </div>

                    <div className="mx-auto max-w-xl">

                      <div className="flex justify-center gap-2">

                        {[1, 2, 3, 4, 5].map(
                          (rating) => (

                            <button
                              key={rating}
                              onClick={() =>
                                setFeedbackRating(
                                  rating
                                )
                              }
                              className="rounded-full p-2 transition hover:bg-zinc-100"
                              aria-label={`Rate ${rating} stars`}
                            >

                              <Star
                                size={32}
                                className={
                                  rating <=
                                  feedbackRating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-zinc-300"
                                }
                              />

                            </button>

                          )
                        )}

                      </div>

                      <textarea
                        value={
                          feedbackText
                        }
                        onChange={(
                          event
                        ) =>
                          setFeedbackText(
                            event.target
                              .value
                          )
                        }
                        placeholder="Tell us about your experience..."
                        rows={5}
                        className="mt-6 w-full resize-none rounded-2xl border border-zinc-200 bg-white p-4 text-sm outline-none transition focus:border-zinc-900"
                      />

                      {feedbackError && (

                        <p className="mt-3 text-sm font-medium text-red-600">
                          {feedbackError}
                        </p>

                      )}

                      <button
                        onClick={
                          handleSubmitFeedback
                        }
                        disabled={
                          isSubmittingFeedback
                        }
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-4 font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmittingFeedback
                          ? "Submitting..."
                          : "Submit Feedback"}
                      </button>

                      <p className="mt-4 text-center text-xs leading-5 text-zinc-400">
                        If you opted into WhatsApp updates,
                        we&apos;ll also follow up with you
                        there.
                      </p>

                    </div>

                  </>

                ) : (

                  <div className="py-6 text-center">

                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <Check size={30} />
                    </div>

                    <h2 className="text-2xl font-black">
                      Thanks for your feedback ❤️
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                      Your feedback helps us improve your
                      experience.
                    </p>

                  </div>

                )}

                <button
                  onClick={
                    backToMenu
                  }
                  className="mx-auto mt-7 flex items-center gap-2 rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold transition hover:bg-zinc-50"
                >
                  <ArrowLeft size={16} />
                  Back to Menu
                </button>

              </div>

            )}

          </div>

        </section>

      )}

      {/* ================================================== */}
      {/* MENU */}
      {/* ================================================== */}

      {!trackingOrder && (

        <>

          <section className="mx-auto max-w-7xl px-4 pb-5 pt-8 sm:px-6">

            <div className="mb-7">

              <p className="text-sm font-semibold text-orange-600">
  Welcome to {restaurant?.name || "our kitchen"}
</p>

              <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                What are you craving?
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                Explore the menu and find something you&apos;ll
                love.
              </p>

            </div>

            {/* SEARCH */}

            <div className="relative">

              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <input
                value={
                  searchQuery
                }
                onChange={(
                  event
                ) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search food..."
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-zinc-900"
              />

            </div>

            {/* CATEGORIES */}

            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">

              {[
  { id: "All", name: "All" },
  ...categories.map((category) => ({
    id: String(category.id),
    name: category.name,
  })),
].map((category) => (
  <button
    key={category.id}
    onClick={() =>
      setSelectedCategory(category.id)
    }
    className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
      selectedCategory === category.id
        ? "bg-zinc-900 text-white"
        : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
    }`}
  >
    {category.name}
  </button>
))}

            </div>

          </section>

          {/* PRODUCTS */}

          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">

            {isLoadingProducts ? (

              <div className="py-20 text-center text-sm text-zinc-500">
                Loading menu...
              </div>

            ) : productsError ? (

              <div className="rounded-2xl bg-red-50 p-5 text-center text-sm text-red-600">
                {productsError}
              </div>

            ) : filteredProducts.length ===
              0 ? (

              <div className="py-20 text-center">

                <div className="text-5xl">
                  🍽️
                </div>

                <h2 className="mt-4 text-xl font-bold">
                  No items found
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Try another search or category.
                </p>

              </div>

            ) : (

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                {filteredProducts.map(
                  (product) => (

                    <div
                      key={
                        product.id
                      }
                      className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >

                      <button
                        onClick={() =>
                          openProductDetails(
                            product
                          )
                        }
                        className="block w-full text-left"
                      >

                        <div className="aspect-[4/3] overflow-hidden bg-zinc-100">

                          {product.image_url ? (

                            <img
                              src={
                                product.image_url
                              }
                              alt={
                                product.name
                              }
                              className="h-full w-full object-cover transition duration-300 hover:scale-105"
                            />

                          ) : (

                            <div className="flex h-full w-full items-center justify-center text-6xl">
                              🍔
                            </div>

                          )}

                        </div>

                        <div className="p-5">

                          <div className="flex items-start justify-between gap-3">

                            <h2 className="font-bold">
                              {
                                product.name
                              }
                            </h2>

                            <span className="shrink-0 font-black">
                              {money(
                                product.price
                              )}
                            </span>

                          </div>

                          {product.description && (

                            <p className="mt-2 line-clamp-2 text-sm leading-5 text-zinc-500">
                              {
                                product.description
                              }
                            </p>

                          )}

                          <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-zinc-500">
                            View details
                            <ChevronRight
                              size={15}
                            />
                          </div>

                        </div>

                      </button>

                      <div className="px-5 pb-5">

                        <button
                          onClick={() =>
                            addToCart(
                              product
                            )
                          }
                          className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
                        >
                          Add to Cart
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        </>

      )}

      {/* ================================================== */}
      {/* VOICE ORDERING */}
      {/* ================================================== */}

      {voiceOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 p-4 sm:p-6">
          <div className="mx-auto flex h-full max-w-xl items-end sm:items-center">
            <div className="w-full overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-100 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                    Voice Ordering
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    Order with your voice
                  </h2>
                </div>

                <button
                  onClick={stopVoiceSession}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"
                  aria-label="Close voice ordering"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="max-h-[65vh] overflow-y-auto p-5">
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-sm font-semibold text-zinc-800">
                    {voiceStatus}
                  </p>

                  {voiceTranscript && (
                    <p className="mt-2 text-sm text-zinc-500">
                      You: “{voiceTranscript}”
                    </p>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  {voiceMessages.slice(-8).map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                          message.role === "user"
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-800"
                        }`}
                      >
                        {message.message}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center py-6">
                  <button
                    onClick={() => {
                      if (isListening) {
                        stopVoiceListening();
                        setVoiceStatus("Listening stopped.");
                      } else {
                        startVoiceListening();
                      }
                    }}
                    disabled={isVoiceProcessing}
                    className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition ${
                      isListening
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-orange-500 hover:bg-orange-600"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    aria-label={isListening ? "Stop listening" : "Start listening"}
                  >
                    {isListening ? <MicOff size={30} /> : <Mic size={30} />}
                  </button>

                  <p className="mt-3 text-xs text-zinc-400">
                    {isVoiceProcessing
                      ? "AI is processing your request..."
                      : isListening
                        ? "Listening..."
                        : "Tap to speak"}
                  </p>
                </div>

                {cart.length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">
                          Current cart
                        </p>
                        <p className="text-xs text-zinc-500">
                          {cartCount} {cartCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <p className="font-black">{money(cartTotal)}</p>
                    </div>

                    <button
                      onClick={() => setIsCartOpen(true)}
                      className="mt-3 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold hover:bg-zinc-50"
                    >
                      View Cart
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* PRODUCT DETAILS */}
      {/* ================================================== */}

      {selectedProduct && (

        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">

          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl">

            <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">

              {selectedProduct.image_url ? (

                <img
                  src={
                    selectedProduct.image_url
                  }
                  alt={
                    selectedProduct.name
                  }
                  className="h-full w-full object-cover"
                />

              ) : (

                <div className="flex h-full w-full items-center justify-center text-7xl">
                  🍔
                </div>

              )}

              <button
                onClick={
                  closeProductDetails
                }
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
              >
                <X size={20} />
              </button>

            </div>

            <div className="p-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <h2 className="text-2xl font-black">
                    {
                      selectedProduct.name
                    }
                  </h2>

                  {categories.find(
  (category) =>
    category.id === selectedProduct.category_id,
)?.name && (
  <p className="mt-1 text-sm text-zinc-500">
    {
      categories.find(
        (category) =>
          category.id ===
          selectedProduct.category_id,
      )?.name
    }
  </p>
)}

                </div>

                <p className="text-xl font-black">
                  {money(
                    selectedProduct.price
                  )}
                </p>

              </div>

              {selectedProduct.description && (

                <p className="mt-5 text-sm leading-6 text-zinc-600">
                  {
                    selectedProduct.description
                  }
                </p>

              )}

              <div className="mt-7 flex items-center justify-between rounded-2xl bg-zinc-50 p-3">

                <span className="text-sm font-bold">
                  Quantity
                </span>

                <div className="flex items-center gap-4">

                  <button
                    onClick={() =>
                      setProductQuantity(
                        Math.max(
                          1,
                          productQuantity -
                            1
                        )
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
                  >
                    <Minus size={16} />
                  </button>

                  <span className="w-5 text-center font-bold">
                    {
                      productQuantity
                    }
                  </span>

                  <button
                    onClick={() =>
                      setProductQuantity(
                        productQuantity +
                          1
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
                  >
                    <Plus size={16} />
                  </button>

                </div>

              </div>

              <button
                onClick={
                  addSelectedProductToCart
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-4 font-bold text-white transition hover:bg-zinc-800"
              >
                Add{" "}
                {productQuantity}{" "}
                to Cart

                <span>•</span>

                {money(
                  Number(
                    selectedProduct.price
                  ) *
                    productQuantity
                )}

              </button>

            </div>

          </div>

        </div>

      )}

      {/* ================================================== */}
      {/* CART DRAWER */}
      {/* ================================================== */}

      {isCartOpen && (

        <div className="fixed inset-0 z-50 bg-black/40">

          <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-zinc-100 p-5">

              <div>

                <h2 className="text-xl font-black">
                  Your Cart
                </h2>

                <p className="text-sm text-zinc-500">
                  {cartCount}{" "}
                  {cartCount === 1
                    ? "item"
                    : "items"}
                </p>

              </div>

              <button
                onClick={() =>
                  setIsCartOpen(
                    false
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"
              >
                <X size={19} />
              </button>

            </div>

            <div className="flex-1 overflow-y-auto p-5">

              {cart.length === 0 ? (

                <div className="flex h-full flex-col items-center justify-center text-center">

                  <ShoppingBag
                    size={45}
                    className="text-zinc-300"
                  />

                  <h3 className="mt-4 font-bold">
                    Your cart is empty
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    Add something delicious to get
                    started.
                  </p>

                </div>

              ) : (

                <div className="space-y-5">

                  {cart.map(
                    (item) => (

                      <div
                        key={
                          item.product.id
                        }
                        className="flex gap-3"
                      >

                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">

                          {item.product.image_url ? (

                            <img
                              src={
                                item
                                  .product
                                  .image_url
                              }
                              alt={
                                item
                                  .product
                                  .name
                              }
                              className="h-full w-full object-cover"
                            />

                          ) : (

                            <div className="flex h-full w-full items-center justify-center text-3xl">
                              🍔
                            </div>

                          )}

                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex justify-between gap-3">

                            <h3 className="truncate font-bold">
                              {
                                item
                                  .product
                                  .name
                              }
                            </h3>

                            <button
                              onClick={() =>
                                removeFromCart(
                                  item
                                    .product
                                    .id
                                )
                              }
                              className="text-xs text-zinc-400 hover:text-red-500"
                            >
                              Remove
                            </button>

                          </div>

                          <p className="mt-1 text-sm font-semibold">
                            {money(
                              item
                                .product
                                .price
                            )}
                          </p>

                          <div className="mt-3 flex items-center gap-3">

                            <button
                              onClick={() =>
                                updateCartQuantity(
                                  item
                                    .product
                                    .id,
                                  -1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100"
                            >
                              <Minus
                                size={14}
                              />
                            </button>

                            <span className="w-4 text-center text-sm font-bold">
                              {
                                item.quantity
                              }
                            </span>

                            <button
                              onClick={() =>
                                updateCartQuantity(
                                  item
                                    .product
                                    .id,
                                  1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100"
                            >
                              <Plus
                                size={14}
                              />
                            </button>

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

            {cart.length > 0 && (

              <div className="border-t border-zinc-100 p-5">

                <div className="mb-4 flex justify-between text-lg font-black">

                  <span>
                    Total
                  </span>

                  <span>
                    {money(
                      cartTotal
                    )}
                  </span>

                </div>

                <button
                  onClick={
                    openCheckout
                  }
                  className="w-full rounded-2xl bg-zinc-900 px-5 py-4 font-bold text-white transition hover:bg-zinc-800"
                >
                  Continue to Checkout
                </button>

              </div>

            )}

          </div>

        </div>

      )}

      {/* ================================================== */}
      {/* CHECKOUT */}
      {/* ================================================== */}

      {checkoutOpen && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-0 sm:p-6">

          <div className="mx-auto min-h-full w-full max-w-2xl bg-white sm:min-h-0 sm:rounded-3xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white p-5 sm:rounded-t-3xl">

              <div>

                <h2 className="text-xl font-black">
                  Checkout
                </h2>

                <p className="text-sm text-zinc-500">
                  Complete your order
                </p>

              </div>

              <button
                onClick={
                  closeCheckout
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"
              >
                <X size={19} />
              </button>

            </div>

            <div className="space-y-7 p-5 sm:p-7">

              {/* ================================================= */}
              {/* CUSTOMER */}
              {/* ================================================= */}

              <section>

                <h3 className="mb-4 text-lg font-bold">
                  Your details
                </h3>

                <div className="space-y-3">

                  <input
                    value={
                      customerName
                    }
                    onChange={(
                      event
                    ) =>
                      setCustomerName(
                        event.target
                          .value
                      )
                    }
                    placeholder="Your name"
                    className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-900"
                  />

                  <input
                    value={
                      customerPhone
                    }
                    onChange={(
                      event
                    ) =>
                      setCustomerPhone(
                        event.target
                          .value
                      )
                    }
                    placeholder="Phone number"
                    inputMode="tel"
                    className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-900"
                  />

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-zinc-50 p-4">

                    <input
                      type="checkbox"
                      checked={
                        whatsappOptIn
                      }
                      onChange={(
                        event
                      ) =>
                        setWhatsappOptIn(
                          event.target
                            .checked
                        )
                      }
                      className="mt-1 h-4 w-4"
                    />

                    <span>

                      <span className="block text-sm font-semibold">
                        Get order updates on WhatsApp
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-zinc-500">
                        We may use WhatsApp to send order
                        updates and a feedback follow-up.
                      </span>

                    </span>

                  </label>

                </div>

              </section>

              {/* ================================================= */}
              {/* ORDER SUMMARY */}
              {/* ================================================= */}

              <section>

                <h3 className="mb-4 text-lg font-bold">
                  Order summary
                </h3>

                <div className="space-y-3 rounded-2xl bg-zinc-50 p-4">

                  {cart.map(
                    (item) => (

                      <div
                        key={
                          item.product.id
                        }
                        className="flex justify-between gap-4 text-sm"
                      >

                        <span>
                          {
                            item
                              .product
                              .name
                          }{" "}
                          ×{" "}
                          {
                            item.quantity
                          }
                        </span>

                        <span className="font-semibold">
                          {money(
                            Number(
                              item
                                .product
                                .price
                            ) *
                              item.quantity
                          )}
                        </span>

                      </div>

                    )
                  )}

                  {/* SUBTOTAL */}

                  <div className="flex justify-between border-t border-zinc-200 pt-3 text-sm">

                    <span className="text-zinc-500">
                      Subtotal
                    </span>

                    <span className="font-semibold">
                      {money(
                        cartTotal
                      )}
                    </span>

                  </div>

                  {/* COUPON */}

                  <div className="border-t border-zinc-200 pt-4">

                    <div className="mb-2 flex items-center justify-between">

                      <p className="text-sm font-semibold">
                        Have a coupon?
                      </p>

                      {appliedCoupon && (

                        <button
                          onClick={
                            removeCoupon
                          }
                          className="text-xs font-semibold text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>

                      )}

                    </div>

                    {!appliedCoupon ? (

                      <div className="flex gap-2">

                        <input
                          value={
                            couponCode
                          }
                          onChange={(
                            event
                          ) => {
                            setCouponCode(
                              event.target.value.toUpperCase()
                            );
                            setCouponError(
                              ""
                            );
                          }}
                          onKeyDown={(
                            event
                          ) => {
                            if (
                              event.key ===
                              "Enter"
                            ) {
                              applyCoupon();
                            }
                          }}
                          placeholder="Enter coupon code"
                          className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold uppercase outline-none focus:border-zinc-900"
                        />

                        <button
                          onClick={
                            applyCoupon
                          }
                          disabled={
                            isApplyingCoupon
                          }
                          className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isApplyingCoupon
                            ? "Checking..."
                            : "Apply"}
                        </button>

                      </div>

                    ) : (

                      <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">

                        <div>

                          <p className="text-sm font-bold text-green-700">
                            {appliedCoupon}
                          </p>

                          <p className="text-xs text-green-600">
                            Coupon applied successfully
                          </p>

                        </div>

                        <Check
                          size={20}
                          className="text-green-600"
                        />

                      </div>

                    )}

                    {couponError && (

                      <p className="mt-2 text-xs font-medium text-red-600">
                        {couponError}
                      </p>

                    )}

                  </div>

                  {/* DISCOUNT */}

                  {couponDiscount >
                    0 && (

                    <div className="flex justify-between text-sm font-semibold text-green-600">

                      <span>
                        Coupon Discount
                      </span>

                      <span>
                        -{" "}
                        {money(
                          couponDiscount
                        )}
                      </span>

                    </div>

                  )}

                  {/* FINAL TOTAL */}

                  <div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-black">

                    <span>
                      Total
                    </span>

                    <span>
                      {money(
                        finalTotal
                      )}
                    </span>

                  </div>

                </div>

              </section>

              {/* ================================================= */}
              {/* PAYMENT */}
              {/* ================================================= */}

              <section>

                <h3 className="mb-4 text-lg font-bold">
                  Payment
                </h3>

                <div className="grid gap-3 sm:grid-cols-3">

                  <button
                    onClick={() =>
                      setPaymentMethod(
                        "upi"
                      )
                    }
                    className={`rounded-2xl border p-4 text-left ${
                      paymentMethod ===
                      "upi"
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200"
                    }`}
                  >

                    <Smartphone
                      size={20}
                    />

                    <p className="mt-3 text-sm font-bold">
                      UPI
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Google Pay / PhonePe
                    </p>

                  </button>

                  <button
                    onClick={() =>
                      setPaymentMethod(
                        "card"
                      )
                    }
                    className={`rounded-2xl border p-4 text-left ${
                      paymentMethod ===
                      "card"
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200"
                    }`}
                  >

                    <CreditCard
                      size={20}
                    />

                    <p className="mt-3 text-sm font-bold">
                      Card
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Credit / Debit
                    </p>

                  </button>

                  <button
                    onClick={() =>
                      setPaymentMethod(
                        "netbanking"
                      )
                    }
                    className={`rounded-2xl border p-4 text-left ${
                      paymentMethod ===
                      "netbanking"
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200"
                    }`}
                  >

                    <CreditCard
                      size={20}
                    />

                    <p className="mt-3 text-sm font-bold">
                      Net Banking
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      All major banks
                    </p>

                  </button>

                </div>

              </section>

              {/* ERROR */}

              {checkoutError && (

                <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">
                  {checkoutError}
                </div>

              )}

              {/* PAY */}

              <button
                onClick={
                  handlePayment
                }
                disabled={
                  isProcessingPayment
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-4 font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {isProcessingPayment
                  ? "Processing payment..."
                  : `Pay ${money(
                      finalTotal
                    )}`}

              </button>

              <p className="text-center text-xs text-zinc-400">
                Payment is simulated for this prototype.
              </p>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}