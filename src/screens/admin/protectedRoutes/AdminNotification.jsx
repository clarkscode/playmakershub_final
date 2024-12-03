/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import Sidebar from "../../../components/admin/Sidebar";
import Header from "../../../components/admin/Header";
import { supabase } from "../../../database/supabase";
import { Chip } from "@mui/material";
import { NewReleases as NewBadgeIcon } from "@mui/icons-material";

const AdminNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch notifications and run initial event checks
    const initialize = async () => {
      await checkAndNotifyAllEvents(); // Check and notify events on load
      await fetchNotifications(); // Fetch existing notifications
    };

    initialize();

    // Setup real-time subscription for new notifications
    const subscription = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prevNotifications) => [
            payload.new,
            ...prevNotifications,
          ]);
        }
      )
      .subscribe();

    console.log(notifications);
    return () => {
      // Cleanup subscription on unmount
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("content, sent_at, user_id, event_id")
        .or(
          "and(user_id.is.null,event_id.is.null),and(user_id.is.null,event_id.not.is.null)"
        )
        .order("sent_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setNotifications(data);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const checkAndNotifyAllEvents = async () => {
    try {
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("event_id");

      if (eventsError) {
        console.error("Error fetching events:", eventsError);
        return;
      }

      for (const event of events) {
        await checkAndNotifyEventFull(event.event_id);
      }
    } catch (err) {
      console.error("Error checking events:", err);
    }
  };

  const checkAndNotifyEventFull = async (eventId) => {
    try {
      const { data: required, error: requiredError } = await supabase
        .from("musicians_required")
        .select("guitarist, keyboardist, vocalist, bassist, percussionist")
        .eq("event_id", eventId)
        .maybeSingle();

      if (requiredError) {
        console.error(
          `Error fetching musician requirements for event ID ${eventId}:`,
          requiredError
        );
        return;
      }

      if (!required) {
        console.warn(
          `No musician requirements found for event ID ${eventId}. Skipping this event.`
        );
        return;
      }

      const totalRequired =
        (required.guitarist || 0) +
        (required.keyboardist || 0) +
        (required.vocalist || 0) +
        (required.bassist || 0) +
        (required.percussionist || 0);

      const { data: participants, error: participantsError } = await supabase
        .from("participation")
        .select("*")
        .eq("event_id", eventId);

      if (participantsError) {
        console.error(
          `Error fetching participants for event ID ${eventId}:`,
          participantsError
        );
        return;
      }

      if (participants.length >= totalRequired) {
        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("event_title")
          .eq("event_id", eventId)
          .single();

        if (eventError) {
          console.error(
            `Error fetching event name for event ID ${eventId}:`,
            eventError
          );
          return;
        }

        const { data: existingNotification, error: notificationCheckError } =
          await supabase
            .from("notifications")
            .select("notification_id")
            .eq("event_id", eventId)
            .eq("notification_type", "web")
            .is("user_id", null)
            .maybeSingle();

        if (notificationCheckError) {
          console.error(
            `Error checking existing notification for event ID ${eventId}:`,
            notificationCheckError
          );
          return;
        }

        if (!existingNotification) {
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert([
              {
                event_id: eventId,
                user_id: null,
                notification_type: "web",
                content: `The event ${event.event_title} has reached full capacity.`,
                sent_at: new Date(),
              },
            ]);

          if (notificationError) {
            console.error(
              `Error inserting notification for event ID ${eventId}:`,
              notificationError
            );
          } else {
            console.log(`Notification sent for event ID ${eventId}`);
          }
        }
      }
    } catch (err) {
      console.error(
        `Unexpected error in checkAndNotifyEventFull for event ID ${eventId}:`,
        err
      );
    }
  };

  // Check if a notification is "new" (sent within the last 15 minutes)
  const isNewNotification = (sentAt) => {
    const now = new Date();
    const sentDate = new Date(sentAt);
    const diffInMinutes = (now - sentDate) / (1000 * 60);
    // Difference sa minutes
    return diffInMinutes <= 15;
    // then e Mark as "new" if within 15 minutes ang notifications
  };

  return (
    <div className="min-h-screen flex bg-[#FBEBF1]">
      <Sidebar />
      <div className="flex-1">
        <Header title="Notifications" />
        <div className="p-6">
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Notifications</h2>
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5C1B33]"></div>
                <p className="ml-4 text-gray-600">Loading...</p>
              </div>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : notifications.length > 0 ? (
              <ul className="space-y-4">
                {notifications.map((notification, index) => (
                  <li
                    key={index}
                    className={`p-4 border rounded-md shadow-sm ${
                      isNewNotification(notification.sent_at)
                        ? "bg-green-100 border-green-500"
                        : "bg-gray-100"
                    } relative`}
                  >
                    <p className="text-gray-700">{notification.content}</p>
                    <span className="text-gray-500 text-sm">
                      Sent at: {new Date(notification.sent_at).toLocaleString()}
                    </span>
                    {isNewNotification(notification.sent_at) && (
                      <Chip
                        icon={<NewBadgeIcon />}
                        label="New"
                        size="small"
                        color="white"
                        className="absolute top-2 right-2"
                        sx={{
                          backgroundColor: "#5C1B33",
                          color: "#FFFFFF",
                        }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No notifications to display.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotification;
