import { supabase } from "../../../database/supabase";
import sendEmail from "../../../database/sendEmail";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { updateEventStatus } from "../../../database/events";
import { format } from "date-fns";

const AcceptedEventsTable = ({
  eventId,
  eventTitle,
  organizer,
  email,
  location,
  genre,
  theme,
  eventStart,
  eventEnd,
  status,
  department,
  organization,
  requiredParticipants,
  onEventUpdate,
  rowIndex,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [participationFilter, setParticipationFilter] = useState("green");

  // participation filter dropdown
  const participationOptions = [
    { label: "Open for Anyone", color: "bg-green-500", value: "green" },
    { label: "Inactive Members ", color: "bg-orange-500", value: "orange" },
    { label: "Probationary Members", color: "bg-red-500", value: "red" },
  ];

  const isOngoing = status === "Ongoing";
  const isAccepted = status === "Accepted";

  useEffect(() => {
    console.log(requiredParticipants);
    console.log("participation filter", participationFilter);
  }, []);

  const musicians = requiredParticipants?.[0] || {};

  // Filter required musicians (only non-zero values)
  const filteredParticipants = Object.entries(musicians).filter(
    ([key, value]) => value > 0 && key !== "event_id" && key !== "musician_id"
  );

  //  toggle the modal
  const toggleModal = () => setShowModal(!showModal);

  // Insert statusesToNotify along with event_id into status_required table
  const insertStatusRequired = async (eventId, statuses) => {
    try {
      const { data, error } = await supabase
        .from("status_required")
        .insert([{ event_id: eventId, status_name: statuses }]);
      // statuses is Array
      if (error) {
        throw new Error(`Failed to insert statuses: ${error.message}`);
      }

      console.log("Inserted into status_required:", data);
      return data;
    } catch (error) {
      console.error("Error in insertStatusRequired:", error.message);
      throw error;
    }
  };

  // update status requirement of event
  const updateStatusRequired = async (eventId, statuses) => {
    try {
      const { data, error } = await supabase
        .from("status_required")
        .update({ status_name: statuses }) // Update only the `status_name` column
        .eq("event_id", eventId); // Add WHERE clause to specify the row to update
      if (error) {
        throw new Error(`Failed to insert statuses: ${error.message}`);
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
      if (isAccepted) {
        console.log("I am in Accepted tab");
        await insertStatusRequired(eventId, statusesToNotify);
      }

      if (isOngoing) {
        console.log("I am in Ongoing tab");
        await updateStatusRequired(eventId, statusesToNotify);
      }

      // Fetch members based on participation status
      const { data: members, error } = await supabase
        .from("members_orgs")
        .select("*")
        .in("status", statusesToNotify);

      if (error) throw error;

      // Notify members via email and Playmakers Hub (web)
      // ANG WEB NOTIFICATION SA MEMBERS NA PART OPTIONAL
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

  // Function to handle creating the event and notifying based on the filter
  const handleCreateEvent = async () => {
    try {
      // Update event status to "Ongoing"
      await updateEventStatus(eventId, "Ongoing");

      // Notify members based on the participation filter
      await notifyMembersBasedOnFilter(
        eventId,
        eventTitle,
        participationFilter
      );
      // console.log("gi set nga filter", participationFilter);
      // console.log("member email", email);
      toast.success("Event Successfully created and members notified!");
      onEventUpdate(eventId);
    } catch (error) {
      console.error("Error updating event status:", error);
      toast.error("Failed to create event");
    }
  };

  return (
    <>
      <tr
        className={`${
          rowIndex % 2 === 0 ? "bg-green-50" : "bg-gray-50"
        } hover:bg-gray-100`}
      >
        {/* Event Title */}
        <td className="p-3 font-semibold">{eventTitle}</td>

        {/* Organizer */}
        <td className="p-3">{organizer}</td>

        {/* Email */}
        <td className="p-3 text-blue-500 underline">{email}</td>

        <td className="p-3">
          {/* View Details Button */}
          <button
            onClick={toggleModal}
            className="text-blue-500 underline hover:text-blue-700"
          >
            View Details
          </button>
        </td>

        {/* Actions */}
        <td className="p-3">
          {status === "Accepted" && (
            <div className="flex flex-col">
              <select
                value={participationFilter}
                onChange={(e) => setParticipationFilter(e.target.value)}
                className="block w-full px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md"
              >
                {participationOptions.map((option, index) => (
                  <option key={index} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </td>
        <td>
          <button
            onClick={handleCreateEvent}
            className="px-4 py-2 bg-[#40B267] text-white rounded hover:bg-green-600"
          >
            Create Event
          </button>
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
              {genre ? (
                <p>
                  <strong>Genre:</strong> {genre}
                </p>
              ) : null}
              {theme ? (
                <p>
                  <strong>Theme:</strong> {theme}
                </p>
              ) : null}
              <p>
                <strong>Event Start:</strong>
                {format(new Date(eventStart.date), "PPPP")} at{" "}
                {format(
                  new Date(`${eventStart.date}T${eventStart.time}`),
                  "hh:mm a"
                )}
              </p>
              <p>
                <strong>Event End:</strong>
                {format(new Date(eventEnd.date), "PPPP")} at{" "}
                {format(
                  new Date(`${eventEnd.date}T${eventEnd.time}`),
                  "hh:mm a"
                )}
              </p>
              <p>
                <strong>Status:</strong>
                <span className="text-[#40B267] font-bold"> {status}</span>
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

              {department ? (
                <p>
                  <strong>Department:</strong> {department}
                </p>
              ) : null}
              {organization ? (
                <p>
                  <strong>Organization:</strong> {organization}
                </p>
              ) : null}
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

export default AcceptedEventsTable;
