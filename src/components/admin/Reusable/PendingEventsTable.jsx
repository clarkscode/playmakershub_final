import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { supabase } from "../../../database/supabase";
import sendEmail from "../../../database/sendEmail";
import { useState } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";

const PendingEventsTable = ({
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
  // State to manage modal visibility
  const [showModal, setShowModal] = useState(false);

  const musicians = requiredParticipants?.[0] || {};

  // Filter required musicians (only non-zero values)
  const filteredParticipants = Object.entries(musicians).filter(
    ([key, value]) => value > 0 && key !== "event_id" && key !== "musician_id"
  );

  //  toggle the modal
  const toggleModal = () => setShowModal(!showModal);

  const fetchOrganizerName = async (eventId) => {
    try {
      const { data: organizerData, error } = await supabase
        .from("events")
        .select("bookings(organizer_first_name, organizer_last_name)")
        .eq("event_id", eventId)
        .single();

      if (error) {
        console.error("Error fetching organizer's name:", error);
        throw new Error("Failed to fetch organizer's name");
      }

      if (!organizerData || !organizerData.bookings) {
        throw new Error("Organizer details not found");
      }

      const { organizer_first_name, organizer_last_name } =
        organizerData.bookings;
      return `${organizer_first_name} ${organizer_last_name}`;
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  };

  const handleAcceptEvent = async (eventId, organizerEmail, eventTitle) => {
    try {
      // Get the admin's name from localStorage or sessionStorage
      const adminName = localStorage.getItem("adminName") || "Admin";
      // Update the event status to 'Accepted'
      const { error } = await supabase
        .from("events")
        .update({ event_status: "Accepted" })
        .eq("event_id", eventId);

      if (error) throw error;

      // Insert a new record in the updates table
      const { error: updatesError } = await supabase.from("updates").insert([
        {
          update_type: `Added new events`,
          updated_by: adminName,
        },
      ]);

      if (updatesError) throw updatesError;

      const organizerFullname = await fetchOrganizerName(eventId);

      // Send email notification to the organizer
      await sendEmail(
        organizerEmail,
        `Your event "${eventTitle}" has been accepted!`,
        `<p>Dear ${organizerFullname},</p>
         <p>Your event "<strong>${eventTitle}</strong>" has been accepted by Playmakers Admin.</p>
         <p>For more details, visit your <strong>Previous Booking</strong> located at the top right corner of the booking form.</p>
         <p>Thank you for reaching out to Playmakers - USTP!</p>
         <p>Best Regards, 
         <br/>The Playmakers Family</p>
         <a href="https://www.playmakershub.org" target="_blank">www.playmakershub.org</a></p>
         `
      );

      // alert("Event accepted successfully and the organizer has been notified!");
      toast.success(
        "Event accepted successfully and the organizer has been notified!"
      );
      onEventUpdate(eventId);
    } catch (error) {
      console.error("Error accepting event:", error);
      // alert("Failed to accept the event.");
      toast.error("Failed to accept the event.");
    }
  };

  const handleRejectEvent = async (eventId, organizerEmail, eventTitle) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ event_status: "Rejected" })
        .eq("event_id", eventId);

      if (error) throw error;

      const organizerFullname = await fetchOrganizerName(eventId);

      await sendEmail(
        organizerEmail,
        `Your event "${eventTitle}" has been rejected`,
        `<p>Dear ${organizerFullname},</p><p>Unfortunately, your event "<strong>${eventTitle}</strong>" has been rejected by Playmakers Admin. Please contact us for more details.</p><p>Best regards,<br/>Playmakers Admin</p>`
      );

      // alert("Event rejected successfully and the organizer has been notified!");
      toast.success(
        "Event rejected successfully and the organizer has been notified!"
      );
      onEventUpdate(eventId);
    } catch (error) {
      console.error("Error rejecting event:", error);
      // alert("Failed to reject the event.");
      toast.error("Failed to reject the event.");
    }
  };
  return (
    <>
      <tr
        className={`${
          rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
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
        <td className="p-3 flex gap-2">
          <button
            onClick={() => handleAcceptEvent(eventId, email, eventTitle)}
            className="flex items-center gap-2 bg-[#40B267] text-white px-3 py-1 rounded-md hover:bg-green-600 transition duration-200"
          >
            <FaCheckCircle /> Accept
          </button>
          <button
            onClick={() => handleRejectEvent(eventId, email, eventTitle)}
            className="flex items-center gap-2 bg-[#5C1B33] text-white px-3 py-1 rounded-md hover:bg-red-600 transition duration-200"
          >
            <FaTimesCircle /> Reject
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
                <span className="text-[#EAB308] font-bold"> {status}</span>
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

export default PendingEventsTable;
