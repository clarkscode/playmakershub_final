import { format } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PublishedEventsTable = ({
  // eventId,
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
  // onEventUpdate,
  rowIndex,
}) => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  //  toggle the modal
  const toggleModal = () => setShowModal(!showModal);

  const musicians = requiredParticipants?.[0] || {};

  // Filter required musicians (only non-zero values)
  const filteredParticipants = Object.entries(musicians).filter(
    ([key, value]) => value > 0 && key !== "event_id" && key !== "musician_id"
  );

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

        <td>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-[#5C1B33] text-white rounded hover:bg-[#973559]"
          >
            View on Playmakers hub
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
                <span className="text-[#A855F7] font-bold"> {status}</span>
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

export default PublishedEventsTable;
