"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type WhatsAppMessage = {
  id: number;
  customer_id: number;
  order_id: number | null;
  phone: string;
  message_type: string;
  message: string;
  media_url: string | null;
  status: string;
  created_at: string;
};

type Conversation = {
  customerId: number;
  orderId: number | null;
  phone: string;
  messages: WhatsAppMessage[];
};

const API_URL = "http://localhost:8000";

export default function WhatsAppPage() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<string | null>(null);

  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedConversationRef = useRef<string | null>(null);

  const selectConversation = (key: string) => {
    selectedConversationRef.current = key;
    setSelectedConversation(key);
  };

  /*
   * Fetch all WhatsApp messages
   */
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/whatsapp/messages`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch WhatsApp messages");
      }

      const data: WhatsAppMessage[] = await response.json();

      setMessages(data);

      if (
        data.length > 0 &&
        selectedConversationRef.current === null
      ) {
        const firstMessage = data[0];

        const firstKey =
          `${firstMessage.customer_id}-${firstMessage.order_id ?? "general"}`;

        selectedConversationRef.current = firstKey;
        setSelectedConversation(firstKey);
      }
    } catch (error) {
      console.error("WhatsApp messages error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Initial load + polling
   */
  useEffect(() => {
    fetchMessages();

    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchMessages]);

  /*
   * Build conversations
   */
  const conversations = useMemo<Conversation[]>(() => {
    const map = new Map<string, Conversation>();

    for (const message of messages) {
      const key =
        `${message.customer_id}-${message.order_id ?? "general"}`;

      if (!map.has(key)) {
        map.set(key, {
          customerId: message.customer_id,
          orderId: message.order_id,
          phone: message.phone,
          messages: [],
        });
      }

      map.get(key)!.messages.push(message);
    }

    const result = Array.from(map.values());

    result.sort((a, b) => {
      const aLast =
        a.messages[a.messages.length - 1];

      const bLast =
        b.messages[b.messages.length - 1];

      return (
        new Date(bLast.created_at).getTime() -
        new Date(aLast.created_at).getTime()
      );
    });

    return result;
  }, [messages]);

  /*
   * Active conversation
   */
  const activeConversation = useMemo(() => {
    if (!selectedConversation) {
      return null;
    }

    return (
      conversations.find(
        (conversation) =>
          `${conversation.customerId}-${conversation.orderId ?? "general"}` ===
          selectedConversation
      ) ?? null
    );
  }, [conversations, selectedConversation]);

  /*
   * Scroll to newest message
   */
  const previousMessageCount = useRef(0);

  useEffect(() => {
    if (!activeConversation) {
      return;
    }

    const currentCount =
      activeConversation.messages.length;

    if (currentCount > previousMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }

    previousMessageCount.current = currentCount;
  }, [activeConversation]);

  /*
   * Send customer message
   */
  const sendMessage = async () => {
    const trimmedMessage = messageText.trim();

    if (
      !trimmedMessage ||
      sending ||
      !activeConversation
    ) {
      return;
    }

    try {
      setSending(true);

      const response = await fetch(
        `${API_URL}/api/whatsapp/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_id:
              activeConversation.customerId,

            order_id:
              activeConversation.orderId,

            message: trimmedMessage,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.detail ||
            "Failed to send message"
        );
      }

      setMessageText("");

      await fetchMessages();
    } catch (error) {
      console.error("Send message error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getLastMessage = (
    conversation: Conversation
  ) => {
    const last =
      conversation.messages[
        conversation.messages.length - 1
      ];

    if (!last) {
      return "";
    }

    return last.message.replace(/\n/g, " ");
  };

  const isCustomerMessage = (
    message: WhatsAppMessage
  ) => {
    return (
      message.message_type ===
      "customer_reply"
    );
  };

  /*
   * Resolve media URL from backend
   */
  const getMediaUrl = (
    mediaUrl: string | null
  ) => {
    if (!mediaUrl) {
      return null;
    }

    if (mediaUrl.startsWith("http://") ||
        mediaUrl.startsWith("https://")) {
      return mediaUrl;
    }

    return `${API_URL}${mediaUrl}`;
  };

  return (
    <main className="h-screen bg-[#d9dbd5] flex justify-center overflow-hidden">
      <div className="w-full max-w-7xl h-full bg-white flex shadow-2xl">

        {/* ================================================= */}
        {/* LEFT SIDEBAR */}
        {/* ================================================= */}

        <aside className="w-[360px] bg-white border-r border-gray-200 flex flex-col">

          {/* Header */}
          <div className="bg-[#075e54] text-white px-5 py-4 flex-shrink-0">
            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-xl">
                🍔
              </div>

              <div>
                <h1 className="font-semibold text-lg">
                  DesiTrue
                </h1>

                <p className="text-xs text-green-100">
                  WhatsApp Inbox
                </p>
              </div>

            </div>
          </div>

          {/* Inbox header */}
          <div className="px-4 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-gray-900">
                  Conversations
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Customer communication
                </p>
              </div>

              <div className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {conversations.length}
              </div>

            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">

            {loading ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                No conversations yet.
              </div>
            ) : (
              conversations.map(
                (conversation) => {

                  const key =
                    `${conversation.customerId}-${conversation.orderId ?? "general"}`;

                  const isActive =
                    selectedConversation === key;

                  const lastMessage =
                    conversation.messages[
                      conversation.messages.length - 1
                    ];

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        selectConversation(key)
                      }
                      className={`w-full text-left px-4 py-4 border-b border-gray-100 transition ${
                        isActive
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >

                      <div className="flex items-center gap-3">

                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg flex-shrink-0">
                          👤
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-center justify-between gap-2">

                            <h3 className="font-semibold text-gray-900 truncate">
                              Customer #
                              {conversation.customerId}
                            </h3>

                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                              {formatTime(
                                lastMessage.created_at
                              )}
                            </span>

                          </div>

                          <div className="flex items-center justify-between mt-1">

                            <p className="text-xs text-gray-500">
                              {conversation.orderId
                                ? `Order #${conversation.orderId}`
                                : "Campaign"}
                            </p>

                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              {conversation.messages.length}
                            </span>

                          </div>

                          <p className="text-xs text-gray-400 truncate mt-1">
                            {getLastMessage(
                              conversation
                            )}
                          </p>

                        </div>

                      </div>

                    </button>
                  );
                }
              )
            )}

          </div>

          <div className="border-t bg-gray-50 px-4 py-3 flex-shrink-0">
            <p className="text-[10px] text-gray-400 text-center">
              🧪 Prototype WhatsApp simulator
            </p>
          </div>

        </aside>

        {/* ================================================= */}
        {/* RIGHT CHAT */}
        {/* ================================================= */}

        <section className="flex-1 flex flex-col bg-[#efeae2] min-w-0">

          {!activeConversation ? (
            <div className="flex-1 flex items-center justify-center">

              <div className="text-center">

                <div className="text-6xl mb-4">
                  💬
                </div>

                <h2 className="text-xl font-semibold text-gray-700">
                  DesiTrue WhatsApp
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Select a conversation to start.
                </p>

              </div>

            </div>
          ) : (
            <>

              {/* Chat header */}
              <header className="bg-[#075e54] text-white px-5 py-3 flex items-center gap-3 flex-shrink-0">

                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  👤
                </div>

                <div className="flex-1">

                  <h2 className="font-semibold">
                    Customer #
                    {activeConversation.customerId}
                  </h2>

                  <p className="text-xs text-green-100">
                    {activeConversation.phone ||
                      "No phone number"}

                    {" • "}

                    {activeConversation.orderId
                      ? `Order #${activeConversation.orderId}`
                      : "Campaign"}
                  </p>

                </div>

                <div className="text-xs text-green-100">
                  SIMULATOR
                </div>

              </header>

              {/* Chat body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">

                <div className="flex justify-center mb-6">

                  <div className="bg-[#fff3c4] text-[#665c3b] text-xs px-4 py-2 rounded-lg shadow-sm text-center">
                    Messages are simulated locally.
                    <br />
                    Customer #
                    {activeConversation.customerId}

                    {" • "}

                    {activeConversation.orderId
                      ? `Order #${activeConversation.orderId}`
                      : "Campaign"}
                  </div>

                </div>

                <div className="max-w-3xl mx-auto space-y-3">

                  {activeConversation.messages.map(
                    (message) => {

                      const customerMessage =
                        isCustomerMessage(message);

                      const mediaUrl =
                        getMediaUrl(
                          message.media_url
                        );

                      const isCampaign =
                        message.message_type ===
                        "campaign";

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            customerMessage
                              ? "justify-start"
                              : "justify-end"
                          }`}
                        >

                          <div
                            className={`max-w-[75%] rounded-lg overflow-hidden shadow-sm ${
                              customerMessage
                                ? "bg-white"
                                : "bg-[#d9fdd3]"
                            }`}
                          >

                            {/* Campaign image */}
                            {mediaUrl && (
                              <div className="bg-gray-100">

                                <img
                                  src={mediaUrl}
                                  alt={
                                    isCampaign
                                      ? "DesiTrue campaign"
                                      : "WhatsApp media"
                                  }
                                  className="w-full max-h-[360px] object-cover"
                                  onError={(event) => {
                                    event.currentTarget.style.display =
                                      "none";
                                  }}
                                />

                              </div>
                            )}

                            <div className="px-3 py-2">

                              <p className="text-[10px] font-semibold text-gray-500 mb-1">
                                {customerMessage
                                  ? "Customer"
                                  : isCampaign
                                  ? "DesiTrue • Campaign"
                                  : "DesiTrue"}
                              </p>

                              <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                                {message.message}
                              </p>

                              <div
                                className={`flex items-center gap-1 mt-1 ${
                                  customerMessage
                                    ? "justify-start"
                                    : "justify-end"
                                }`}
                              >

                                <span className="text-[10px] text-gray-500">
                                  {formatTime(
                                    message.created_at
                                  )}
                                </span>

                                {!customerMessage && (
                                  <span className="text-xs text-blue-500">
                                    ✓✓
                                  </span>
                                )}

                              </div>

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                  <div ref={messagesEndRef} />

                </div>

              </div>

              {/* Input */}
              <div className="bg-[#f0f2f5] px-5 py-4 border-t flex-shrink-0">

                <div className="max-w-3xl mx-auto flex items-center gap-3">

                  <input
                    type="text"
                    value={messageText}
                    onChange={(event) =>
                      setMessageText(
                        event.target.value
                      )
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    disabled={sending}
                    className="flex-1 bg-white rounded-full px-5 py-3 text-sm text-gray-800 outline-none border border-gray-200 focus:border-[#25d366]"
                  />

                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={
                      sending ||
                      !messageText.trim()
                    }
                    className="w-12 h-12 rounded-full bg-[#25d366] text-white flex items-center justify-center font-semibold hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {sending ? "..." : "➤"}
                  </button>

                </div>

                <p className="text-[10px] text-gray-400 text-center mt-2">
                  Prototype • Local WhatsApp simulation
                </p>

              </div>

            </>
          )}

        </section>

      </div>
    </main>
  );
}