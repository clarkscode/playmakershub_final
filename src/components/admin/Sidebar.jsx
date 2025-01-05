import { Link, useLocation, useNavigate } from "react-router-dom";
import { playmakersLogo } from "../../assets";
import WidgetsIcon from "@mui/icons-material/Widgets";
import EventIcon from "@mui/icons-material/Event";
import GroupIcon from "@mui/icons-material/Group";
import AssessmentIcon from "@mui/icons-material/Assessment";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonPinIcon from "@mui/icons-material/PersonPin";
import LogoutIcon from "@mui/icons-material/Logout";
import ChatIcon from "@mui/icons-material/Chat";
import { supabase } from "../../database/supabase";
import { useState } from "react";
import { useEffect } from "react";

const Sidebar = () => {
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const [unreadBookingCount, setUnreadBookingCount] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();
  const activeStyle = "bg-[#5C1B33] text-white rounded-lg";
  const inactiveStyle = "text-gray-500";

  // Fetch unseen notifications on component mount
  useEffect(() => {
    const fetchUnseenNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("is_seen, notification_type")
        .eq("is_seen", false)
        .in("notification_type", ["New Booking", "backout", "joined"]); // Filter by notification_type

      if (error) {
        console.error("Error fetching unseen notifications:", error);
      } else {
        setNewNotificationCount(data.length); // Set count of unseen notifications
      }
    };

    const fetchUnreadBookings = async () => {
      try {
        // Fetch all booking_ids with unread messages
        const { data, error } = await supabase
          .from("chats")
          .select("booking_id")
          .eq("is_seen", false);

        if (error) throw error;

        // Use a Set to get unique booking_ids
        const uniqueBookingIds = new Set(data.map((chat) => chat.booking_id));

        // Set the count of distinct bookings with unread messages
        setUnreadBookingCount(uniqueBookingIds.size);
      } catch (error) {
        console.error("Error fetching unread bookings:", error.message);
      }
    };

    fetchUnreadBookings();
    fetchUnseenNotifications();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-chats")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chats" },
        async (payload) => {
          if (!payload.new.is_seen) {
            // Fetch all booking_ids again and count unique ones
            const { data, error } = await supabase
              .from("chats")
              .select("booking_id")
              .eq("is_seen", false);

            if (!error) {
              const uniqueBookingIds = new Set(
                data.map((chat) => chat.booking_id)
              );
              setUnreadBookingCount(uniqueBookingIds.size);
              playMessageSound();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Subscribe to new notifications and update the count
  useEffect(() => {
    const subscription = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          if (
            payload.new.notification_type === "New Booking" && // Only for "New Booking"
            location.pathname !== "/admin/notification"
          ) {
            setNewNotificationCount((prev) => prev + 1);
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [location.pathname]);

  const playNotificationSound = () => {
    const audio = new Audio("/sound/notifications.mp3");
    audio.play();
  };
  const playMessageSound = () => {
    const audio = new Audio("/sound/message.mp3");
    audio.play();
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    localStorage.removeItem("adminAuthToken");
    sessionStorage.removeItem("adminAuthToken");
    // navigate("/adminonly"); already change this
    navigate("/login");
  };

  // Mark "New Booking" notifications as seen
  const markNewBookingNotificationsAsSeen = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_seen: true })
        .eq("is_seen", false)
        .in("notification_type", ["New Booking", "backout", "joined"]); // Update only "New Booking, backout, joined" notifications

      if (error) {
        console.error("Error marking notifications as seen:", error);
      } else {
        setNewNotificationCount(0); // Reset the notification count
      }
    } catch (err) {
      console.error("Error during notification update:", err);
    }
  };

  return (
    <div className="w-full md:w-72 bg-white shadow-lg">
      <div className="p-4 flex items-center">
        <img
          src={playmakersLogo}
          width={70}
          height={70}
          alt="Playmakers Logo"
        />
        <h1 className="text-xl font-bold text-[#5C1B33] ml-4">Playmakers</h1>
      </div>
      <ul className="space-y-4 p-4">
        <li>
          <Link
            to="/admin/dashboard"
            className={`flex items-center py-3 px-4 text-md font-medium ${
              location.pathname === "/admin/dashboard"
                ? activeStyle
                : inactiveStyle
            }`}
          >
            <WidgetsIcon
              className={`mr-2 ${
                location.pathname === "/admin/dashboard"
                  ? "text-white"
                  : "text-gray-500"
              }`}
            />
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            to="/admin/events-management"
            className={`flex items-center py-3 px-4 text-md font-medium ${
              location.pathname === "/admin/events-management"
                ? activeStyle
                : inactiveStyle
            }`}
          >
            <EventIcon
              className={`mr-2 ${
                location.pathname === "/admin/events-management"
                  ? "text-white"
                  : "text-gray-500"
              }`}
            />
            Events Management
          </Link>
        </li>
        <li>
          <Link
            to="/admin/member-organization"
            className={`flex items-center py-3 px-4 text-md font-medium ${
              location.pathname === "/admin/member-organization"
                ? activeStyle
                : inactiveStyle
            }`}
          >
            <GroupIcon
              className={`mr-2 ${
                location.pathname === "/admin/member-organization"
                  ? "text-white"
                  : "text-gray-500"
              }`}
            />
            Member Organization
          </Link>
        </li>
        <li>
          <Link
            to="/admin/event-statistics"
            className={`flex items-center py-3 px-4 text-md font-medium ${
              location.pathname === "/admin/event-statistics"
                ? activeStyle
                : inactiveStyle
            }`}
          >
            <AssessmentIcon
              className={`mr-2 ${
                location.pathname === "/admin/event-statistics"
                  ? "text-white"
                  : "text-gray-500"
              }`}
            />{" "}
            Event Statistics
          </Link>
        </li>
        <li>
          <Link
            to="/admin/notification"
            className={`flex items-center py-3 px-4 text-md font-medium ${
              location.pathname === "/admin/notification"
                ? activeStyle
                : inactiveStyle
            }`}
            onClick={markNewBookingNotificationsAsSeen}
          >
            <div className="relative">
              <NotificationsIcon
                className={`mr-2 ${
                  location.pathname === "/admin/notification"
                    ? "text-white"
                    : "text-gray-500"
                }`}
              />
              {newNotificationCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {newNotificationCount}
                </span>
              )}
            </div>
            Notification
          </Link>
        </li>
        <li>
          <Link
            to="/admin/chat"
            className={`flex items-center py-3 px-4 text-md font-medium ${
              location.pathname === "/admin/chat" ? activeStyle : inactiveStyle
            }`}
          >
            <div className="relative">
              <ChatIcon
                className={`mr-2 ${
                  location.pathname === "/admin/chat"
                    ? "text-white"
                    : "text-gray-500"
                }`}
              />
              {unreadBookingCount > 0 && (
                <span className="absolute top-[-6px] right-[-6px] bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadBookingCount}
                </span>
              )}
            </div>
            Chat
          </Link>
        </li>
        <li>
          <Link
            to="/admin/profile"
            className={`flex items-center py-3 px-4 text-md font-medium ${
              location.pathname === "/admin/profile"
                ? activeStyle
                : inactiveStyle
            }`}
          >
            <PersonPinIcon
              className={`mr-2 ${
                location.pathname === "/admin/profile"
                  ? "text-white"
                  : "text-gray-500"
              }`}
            />
            Profile
          </Link>
        </li>
        <li>
          <Link
            to="/login"
            className={`flex items-center py-3 px-4 text-md font-medium ${
              location.pathname === "/login" ? activeStyle : inactiveStyle
            }`}
            onClick={handleLogout}
          >
            <LogoutIcon
              className={`mr-2 ${
                location.pathname === "/login" ? "text-white" : "text-gray-500"
              }`}
            />
            Logout
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
