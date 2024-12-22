import { useState } from "react";
import { format } from "date-fns";

const PastEventsTable = ({
  // eventId,
  eventTitle,
  organizer,
  email,
  location,
  genre,
  status,
  theme,
  eventStart,
  eventEnd,
  department,
  organization,
  requiredParticipants,
  rowIndex,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Filter required musicians (only non-zero values)
  const filteredParticipants = Object.entries(
    requiredParticipants || {}
  ).filter(
    ([key, value]) => value > 0 && key !== "event_id" && key !== "musician_id"
  );

  // Toggle the modal
  const toggleModal = () => setShowModal(!showModal);

  return (
    <>
      <tr
        className={`${
          rowIndex % 2 === 0 ? "bg-gray-100" : "bg-gray-200"
        } hover:bg-gray-300 transition duration-200`}
      >
        {/* Event Title */}
        <td className="p-3 font-semibold">{eventTitle}</td>

        {/* Organizer */}
        <td className="p-3">{organizer}</td>

        {/* Email */}
        <td className="p-3 text-blue-500 underline">{email}</td>
        <td className="p-3">{status}</td>

        {/* View Details */}
        <td className="p-3">
          <button
            onClick={toggleModal}
            className="text-blue-500 underline hover:text-blue-700"
          >
            View Details
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
              {department && (
                <p>
                  <strong>Department:</strong> {department}
                </p>
              )}
              {organization && (
                <p>
                  <strong>Organization:</strong> {organization}
                </p>
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

export default PastEventsTable;
