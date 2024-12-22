import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "../../../database/supabase";
import LinearProgress from "@mui/material/LinearProgress";
import sendEmail from "../../../database/sendEmail";
import { toast } from "react-toastify";

const OngoingEventsTable = ({
  eventId,
  //   bookingId,
  requiredParticipants,
  eventTitle,
  organizer,
  email,
  location,
  genre,
  theme,
  eventStart,
  eventEnd,
  status,
  participants,
  maxParticipants,
  onEventUpdate,
  onEventDelete,
  rowIndex,
}) => {
  const [participationFilter, setParticipationFilter] = useState("green");
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isPresident, setIsPresident] = useState(false);

  const musicians = requiredParticipants?.[0] || {};

  // Filter required musicians (only non-zero values)
  const filteredParticipants = Object.entries(musicians).filter(
    ([key, value]) => value > 0 && key !== "event_id" && key !== "musician_id"
  );

  useEffect(() => {
    // Fetch current user's role
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userRole = user?.user_metadata?.role;
      setIsPresident(userRole === "President"); // Set true if user is "President"
    };

    fetchUserRole();
  }, []);

  // Function to toggle modal
  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const participationPercentage = Math.min(
    (participants / maxParticipants) * 100,
    100
  );
  const isFull = participants >= maxParticipants;

  const participationOptions = [
    { label: "Open for Anyone", value: "green" },
    { label: "Inactive Members", value: "orange" },
    { label: "Probationary Members", value: "red" },
  ];

  // update status requirement of event
  const updateStatusRequired = async (eventId, statuses) => {
    try {
      console.log("statuses", statuses);

      const { data, error } = await supabase
        .from("status_required")
        .update({ status_name: statuses })
        .eq("event_id", eventId);
      if (error) {
        console.log(error);
      }

      console.log("playmakers admin updated status_required:", data);
      return data;
    } catch (error) {
      console.error("Error in insertStatusRequired:", error.message);
      throw error;
    }
  };

  const notifyMembersBasedOnFilter = async (eventId, eventTitle, filter) => {
    let statusesToNotify = [];

    if (filter === "green") {
      console.log("filter", filter);
      statusesToNotify = ["active", "inactive", "probationary"]; // Notify all members
    } else if (filter === "orange") {
      console.log("filter", filter);

      statusesToNotify = ["inactive", "probationary"]; // Notify inactive(orange) and probationary (red) members
    } else if (filter === "red") {
      console.log("filter", filter);

      statusesToNotify = ["probationary"]; // Notify only probationary(red) members
    }

    try {
      if (status === "Ongoing") {
        await updateStatusRequired(eventId, statusesToNotify);
        console.log("statusesToNotify", statusesToNotify);
      }

      // Fetch members based on participation status
      const { data: members, error } = await supabase
        .from("members_orgs")
        .select("*")
        .in("status", statusesToNotify);

      if (error) throw error;

      // Notify members via email
      for (const member of members) {
        // Send email notification
        await sendEmail(
          member.email,
          `You are invited to participate in "${eventTitle}"`,
          `<p>Hello ${member.name},</p>
         <p>You are invited to participate in the event "<strong>${eventTitle}</strong>"!</p>
         <p>For more details, visit Playmakers Hub.</p>
         <p>Thank you for reaching out to Playmakers - USTP!</p>
         <p>Best regards,<br/>The Playmakers Family</p>
         <a href="https://www.playmakershub.org" target="_blank">www.playmakershub.org</a></p>
         `
        );

        // Send in-app (web) notification
        const notificationPayload = {
          event_id: eventId,
          user_id: member.id,
          notification_type: "web",
          content: `You are invited to participate in the event "${eventTitle}". Visit Playmakers Hub for more details.`,
          sent_at: new Date(),
        };
        // console.log("Notification payload: ", notificationPayload);

        const { data, error } = await supabase
          .from("notifications")
          .insert(notificationPayload);

        if (error) {
          console.error("Error inserting notification: ", error.message);
        } else {
          console.log("Notification inserted: ", data);
        }
      }
    } catch (error) {
      console.error("Error notifying members: ", error);
      // toast.error("Failed to notify members");
    }
  };

  const handleSaveFilter = async () => {
    try {
      setIsSaving(true);

      // Notify members based on the new filter
      await notifyMembersBasedOnFilter(
        eventId,
        eventTitle,
        participationFilter
      );

      // You can update any local state or UI here if needed, for example:
      onEventUpdate(eventId, { participationFilter });

      toast.success("Participation filter updated successfully!");
    } catch (error) {
      console.error("Error updating participation filter:", error);
      toast.error("Failed to update participation filter.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the event "${eventTitle}"?`
    );
    if (!confirmDelete) return;

    try {
      // Example: Delete logic in the database
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("event_id", eventId);

      if (error) throw error;

      onEventDelete(eventId);
      toast.success("Event deleted successfully!");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event.");
    }
  };

  const handlePublishEvent = async () => {
    try {
      if (!isPresident) {
        toast.error("Only President role can publish events.");
        return;
      }

      const { error } = await supabase
        .from("events")
        .update({ event_status: "Published" })
        .eq("event_id", eventId);

      if (error) throw error;

      onEventUpdate(eventId, { status: "Published" });
      toast.success("Event published successfully!");
    } catch (error) {
      console.error("Error publishing event:", error);
      toast.error("Failed to publish event.");
    }
  };

  return (
    <>
      <tr
        className={`${
          rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
        } hover:bg-gray-100`}
      >
        <td className="p-3 font-semibold">{eventTitle}</td>
        <td className="p-3">{organizer}</td>
        <td className="p-3 text-blue-500 underline">{email}</td>
        <td className="p-3">
          Participants: {participants}/{maxParticipants}
          <LinearProgress
            variant="determinate"
            value={participationPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "#e0e0e0",
              "& .MuiLinearProgress-bar": {
                backgroundColor:
                  participationPercentage === 100 ? "#5C1B33" : "#A7A7A7",
              },
            }}
          />
        </td>
        <td>
          <button
            onClick={toggleModal}
            className="text-blue-500 underline hover:text-blue-700"
          >
            View Details
          </button>
        </td>
        <td className="p-3">
          {!isFull && (
            <div className="flex items-center gap-2">
              <select
                value={participationFilter}
                onChange={(e) => {
                  setParticipationFilter(e.target.value);
                  console.log("selected filter", e.target.value);
                }}
                className="block w-full px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md"
              >
                {participationOptions.map((option, index) => (
                  <option key={index} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSaveFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={isSaving}
              >
                Save
              </button>
            </div>
          )}
        </td>
        <td>
          <div className="flex items-center gap-2">
            <button
              disabled={!isFull || !isPresident}
              onClick={handlePublishEvent}
              className={`px-4 py-2 text-white rounded ${
                isFull && isPresident
                  ? "bg-[#40B267] hover:bg-green-700" // Enabled when full
                  : "bg-gray-400 cursor-not-allowed" // Disabled when not full
              }`}
            >
              Publish Event
            </button>
            <button
              onClick={handleDeleteEvent}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete Event
            </button>
          </div>
        </td>
      </tr>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg w-3/4 md:w-1/2 p-6 shadow-lg">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#5C1B33]">
                Event Details
              </h2>
              <button
                onClick={toggleModal}
                className="text-gray-600 hover:text-gray-900 text-xl"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>Event Title:</strong> {eventTitle}
              </p>
              <p>
                <strong>Organizer:</strong> {organizer}
              </p>
              <p>
                <strong>Email:</strong> {email}
              </p>
              <p>
                <strong>Location:</strong> {location}
              </p>
              {genre && (
                <p>
                  <strong>Genre:</strong> {genre}
                </p>
              )}
              {theme && (
                <p>
                  <strong>Theme:</strong> {theme}
                </p>
              )}
              <p>
                <strong>Event Start:</strong>{" "}
                {format(new Date(eventStart.date), "PPPP")} at{" "}
                {format(
                  new Date(`${eventStart.date}T${eventStart.time}`),
                  "hh:mm a"
                )}
              </p>
              <p>
                <strong>Event End:</strong>{" "}
                {format(new Date(eventEnd.date), "PPPP")} at{" "}
                {format(
                  new Date(`${eventEnd.date}T${eventEnd.time}`),
                  "hh:mm a"
                )}
              </p>
              <p>
                <strong>Status:</strong>
                <span className="text-[#3B82F6] font-bold"> {status}</span>
              </p>
              {/* Required Musicians */}
              {filteredParticipants.length > 0 && (
                <div>
                  <strong>Required Participants:</strong>
                  <ul className="list-disc pl-5">
                    {filteredParticipants.map(([role, count]) => (
                      <li key={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}: {count}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end mt-4">
              <button
                onClick={toggleModal}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OngoingEventsTable;
