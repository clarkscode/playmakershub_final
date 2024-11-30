import { useEffect, useState } from "react";
import { fetchPastEvents } from "../../database/supabase";

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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-6">
      {pastEvents.length > 0 ? (
        pastEvents.map((event) => (
          <div
            key={event.event_id}
            className=" text-white rounded-lg shadow-lg overflow-hidden h-max"
          >
            <div className="bg-gradient-to-r from-[#C2396C] to-[#5C1B33] p-4">
              {/* Theme Section */}
              <div className="flex justify-between items-center">
                <span className="bg-white text-pink-600 text-xs font-semibold px-2 py-1 rounded-full">
                  Theme: {event.theme}
                </span>
              </div>

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
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-lg">location_on</span>
                  <p className="text-sm">{event.bookings.event_location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-icons text-lg">domain</span>
                  <p className="text-sm">{event.bookings.event_type_name}</p>
                </div>
              </div>

              {/* Event Date and Time */}
              <div className="mt-4 grid grid-cols-2 text-xs">
                <div>
                  <p className="font-semibold">Event Start</p>
                  <p>
                    {event.start_date}{" "}
                    {event.start_time}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Event End</p>
                  <p>
                    {event.end_date}{" "}
                    {event.end_time}
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
