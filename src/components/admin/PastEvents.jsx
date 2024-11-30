import { useEffect, useState } from "react";
import { fetchPastEvents } from "../../database/supabase";
import { FaMapMarkerAlt } from "react-icons/fa";

const PastEvents = () => {
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPastEvents = async () => {
      try {
        const data = await fetchPastEvents();
        setPastEvents(data);
      } catch (error) {
        console.error("Failed to fetch past events:", error);
      } finally {
        setLoading(false);
      }
    };

    getPastEvents();
  }, []);

  const formatDate = (date) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(date).toLocaleDateString("en-US", options);
  };

  const formatTime = (time) => {
    const options = { hour: "numeric", minute: "numeric", hour12: true };
    return new Date(`1970-01-01T${time}`).toLocaleTimeString("en-US", options);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {pastEvents.length > 0 ? (
        pastEvents.map((event) => (
          <div
            key={event.event_id}
            className=" text-white rounded-lg shadow-lg overflow-hidden h-max"
          >
            <div className="bg-gradient-to-r from-[#C2396C] to-[#5C1B33] p-4">
              {/* Theme Section */}
              {event.theme ? (
                <div className="flex justify-between items-center">
                  <span className="bg-white text-pink-600 text-xs font-semibold px-2 py-1 rounded-full">
                    Theme: {event?.theme}
                  </span>
                </div>
              ) : null}

              {/* Event Title */}
              <h2 className="text-xl font-bold mt-2">{event.event_title}</h2>

              {/* Organizer Info */}
            </div>
            <div className="p-4 text-black bg-white h-max">
              <div className="mt-4">
                <p className="text-sm font-semibold">
                  {event.bookings.organizer_first_name}{" "}
                  {event.bookings.organizer_last_name}
                </p>
                <p className="text-xs">{event.bookings.organizer_email}</p>
              </div>

              {/* Location Info */}
              <div className="mb-3 flex items-center justify-between my-2">
                <p className="flex items-center text-sm text-gray-600 font-semibold">
                  <FaMapMarkerAlt className="mr-2 text-[#5C1B33]" />{" "}
                  {event.bookings.event_location}
                </p>
                <span className="bg-[#FBEBF1] text-[#5C1B33] text-xs font-semibold px-3 py-1 rounded">
                  {event.bookings.event_type_name}
                </span>
              </div>

              {/* genre */}
              {event.genre && event.genre.length > 0 && (
                <div className="flex space-x-2 mt-4 text-black-600 text-sm font-semibold">
                  Genre:
                  <span
                    className={`bg-pink-500 text-white px-4 py-1 text-sm font-semibold ms-2`}
                  >
                    {event.genre}
                  </span>
                </div>
              )}

              {/* Event Dates */}
              <div className="grid grid-cols-2 divide-x divide-gray-300 text-center mt-4">
                <div>
                  <p className="text-xs text-gray-500">Event Start</p>
                  <p className="text-sm font-medium text-black">
                    {formatDate(event.start_date)}
                  </p>
                  <p className="text-sm text-black">
                    {formatTime(event.start_time)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Event End</p>
                  <p className="text-sm font-medium text-black">
                    {formatDate(event.end_date)}
                  </p>
                  <p className="text-sm text-black">
                    {formatTime(event.end_time)}
                  </p>
                </div>
              </div>

              {/* Roles and Participants */}
              <div className="mt-4">
                {Object.entries(event.musicians).map(([role, details]) => (
                  <div key={role} className="mt-2">
                    <p className="font-semibold capitalize">
                      {role} ({details.participants.length}/{details.required})
                    </p>
                    <div className="flex gap-2 mt-2">
                      {details.participants.map((participant, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-white text-gray-800 p-2 rounded shadow"
                        >
                          <img
                            src={participant.profileImage}
                            alt={participant.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-sm">{participant.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-white">No past events available</p>
      )}
    </div>
  );
};

export default PastEvents;
