import { useEffect, useState } from "react";
import { supabase } from "../../database/supabase";
import Sidebar from "../admin/Sidebar";
import Header from "../admin/Header";
import dayjs from "dayjs";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingStatus, setBookingStatus] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [disabledChatMessage, setDisabledChatMessage] = useState("");
  const [isResolved, setIsResolved] = useState(false);

  // Fetch authenticated admin's email
  const fetchAdminEmail = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      setAdminEmail(data.user.email);
    } catch (error) {
      console.error("Error fetching authenticated user:", error.message);
    }
  };

  // Fetch all bookings
  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, events(event_title)")
        .order("date_created", { ascending: true });

      if (error) throw error;
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error.message);
    }
  };

  // Fetch messages and booking status
  const fetchChatDetails = async () => {
    if (!selectedBooking) return;

    try {
      setLoadingMessages(true);

      // Fetch messages
      const { data: chatData, error: chatError } = await supabase
        .from("chats")
        .select("*")
        .eq("booking_id", selectedBooking.booking_id)
        .order("timestamp", { ascending: true });

      if (chatError) throw chatError;
      setMessages(chatData);

      // Check if the chat is resolved
      const isResolvedChat = chatData.some((msg) => msg.resolved === true);
      setIsResolved(isResolvedChat);

      // Fetch booking status
      const { data: bookingStatusData, error: bookingStatusError } =
        await supabase
          .from("events")
          .select("event_status")
          .eq("booking_id", selectedBooking.booking_id)
          .single();

      if (bookingStatusError) throw bookingStatusError;
      setBookingStatus(bookingStatusData.event_status);

      // Update disabled chat message
      updateDisabledChatMessage(isResolvedChat, bookingStatusData.event_status);
    } catch (error) {
      console.error("Error fetching chat details:", error.message);
      setDisabledChatMessage("An error occurred while loading chat details.");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Update the disabled chat message based on status and resolution
  const updateDisabledChatMessage = (isResolved, status) => {
    if (isResolved) {
      setDisabledChatMessage(
        "This conversation has been resolved. No further messages can be sent."
      );
    } else if (status !== "Pending") {
      setDisabledChatMessage(
        `You can't make conversation because the event is now ${status}.`
      );
    } else {
      setDisabledChatMessage("");
    }
  };

  // Send a message
  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedBooking) {
      try {
        const { error } = await supabase.from("chats").insert([
          {
            booking_id: selectedBooking.booking_id,
            sender_role: "admin",
            sender_email: adminEmail,
            message: newMessage,
            timestamp: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
        setNewMessage(""); // Clear input field
      } catch (error) {
        console.error("Error sending message:", error.message);
      }
    }
  };

  // Handle resolve button click
  const handleResolve = async () => {
    if (selectedBooking) {
      try {
        const { error } = await supabase
          .from("chats")
          .update({ resolved: true })
          .eq("booking_id", selectedBooking.booking_id);

        if (error) throw error;

        setIsResolved(true);
        setDisabledChatMessage(
          "This conversation has been resolved. No further messages can be sent."
        );
      } catch (error) {
        console.error("Error resolving chat:", error.message);
      }
    }
  };

  // Real-time subscription for messages and updates
  const subscribeToMessages = () => {
    if (!selectedBooking) return;

    const channel = supabase
      .channel(`chats:booking_id=${selectedBooking.booking_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chats",
          filter: `booking_id=eq.${selectedBooking.booking_id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    fetchAdminEmail();
    fetchBookings();
  }, []);

  useEffect(() => {
    fetchChatDetails();
    const unsubscribe = subscribeToMessages();
    return unsubscribe;
  }, [selectedBooking]);

  return (
    <div className="min-h-screen flex bg-[#FBEBF1]">
      <Sidebar />
      <div className="flex-1">
        <Header title="Chat" />
        <div className="p-8">
          <div className="flex space-x-4">
            {/* Sidebar for Booking List */}
            <div className="w-1/4 bg-white rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">
                Select Booking
              </h3>
              {bookings.map((booking) => (
                <button
                  key={booking.booking_id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`w-full text-left py-2 px-4 rounded-lg mb-2 ${
                    selectedBooking?.booking_id === booking.booking_id
                      ? "bg-[#5C1B33] text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {booking.events?.[0]?.event_title || "No Title"}
                </button>
              ))}
            </div>

            {/* Chat Section */}
            <div className="w-3/4 bg-white rounded-lg p-6 flex flex-col shadow-lg">
              {selectedBooking ? (
                <>
                  {/* Booking Status */}
                  <div className="text-gray-600 mb-4 flex justify-between items-center">
                    <div>
                      <span>Booking Status:</span>{" "}
                      <span
                        className={`px-3 py-1 rounded-full text-white font-semibold text-sm ${
                          bookingStatus === "Pending"
                            ? "bg-yellow-500"
                            : bookingStatus === "Accepted"
                            ? "bg-green-500"
                            : bookingStatus === "Rejected"
                            ? "bg-red-500"
                            : bookingStatus === "Ongoing"
                            ? "bg-blue-500"
                            : bookingStatus === "Published"
                            ? "bg-purple-500"
                            : bookingStatus === "Past"
                            ? "bg-gray-500"
                            : "bg-gray-300"
                        }`}
                      >
                        {bookingStatus}
                      </span>
                    </div>

                    {/* Resolve Button */}
                    {!isResolved && (
                      <button
                        onClick={handleResolve}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                      >
                        Resolve
                      </button>
                    )}
                  </div>

                  {/* Disabled Chat Message */}
                  {disabledChatMessage && (
                    <p className="text-red-500 text-sm mb-4">
                      {disabledChatMessage}
                    </p>
                  )}

                  {/* Scrollable Chat Container */}
                  {!disabledChatMessage && (
                    <div className="flex-1 overflow-y-auto max-h-96 space-y-4 mb-4 p-2">
                      {loadingMessages ? (
                        <p>Loading messages...</p>
                      ) : (
                        messages.map((msg, index) => {
                          const showDateSeparator =
                            index === 0 ||
                            dayjs(msg.timestamp).format("YYYY-MM-DD") !==
                              dayjs(messages[index - 1].timestamp).format(
                                "YYYY-MM-DD"
                              );

                          return (
                            <div key={msg.chat_id}>
                              {/* Date Separator */}
                              {showDateSeparator && (
                                <div className="text-center text-gray-500 text-xs mb-2">
                                  {dayjs(msg.timestamp).format(
                                    "dddd, MMM D, YYYY"
                                  )}
                                </div>
                              )}
                              <div
                                className={`flex flex-col ${
                                  msg.sender_role === "admin"
                                    ? "items-start"
                                    : "items-end"
                                }`}
                              >
                                {msg.sender_role === "organizer" && (
                                  <p className="text-xs text-gray-500 mb-1">
                                    {selectedBooking.organizer_first_name}{" "}
                                    {selectedBooking.organizer_last_name}
                                  </p>
                                )}
                                <div
                                  title={dayjs(msg.timestamp).format("h:mm A")}
                                  className={`${
                                    msg.sender_role === "admin"
                                      ? "bg-black text-white"
                                      : "bg-white text-black border border-gray-300"
                                  } p-2 px-4 rounded-[18px] max-w-xs text-sm relative`}
                                >
                                  <span>{msg.message}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Chat Input */}
                  {!disabledChatMessage && (
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow bg-gray-200 text-gray-800 p-3 rounded-full outline-none mr-2"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="bg-[#973659] hover:bg-[#64233b] text-white rounded-full px-4 py-2"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Select a booking to start chat.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
