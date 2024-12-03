import { useEffect, useState } from "react";
import { supabase } from "../../database/supabase";

const DoneEvents = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch events where event_status is 'Published'
        const { data, error } = await supabase
          .from("events")
          .select(
            `
        *,
        bookings (
          organizer_first_name,
          organizer_last_name,
          organizer_email,
          event_location,
          event_type,
          event_type_name
        ),
        musicians_required (
          guitarist,
          keyboardist,
          vocalist,
          bassist,
          percussionist
        ),
        participation (
          user_id,
          musician_role,
          status,
          members_orgs (
            name,
            email,
            mobile,
            role,
            profile_image
          )
        )
      `
          )
          .eq("event_status", "Published");

        if (error) throw error;

        setEvents(data || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error.message);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const closeModal = () => setSelectedEvent(null);

  const Spinner = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white"></div>
    </div>
  );

  if (loading) return <Spinner />;

  return (
    <div className="p-6 -mt-12">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-10">
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event.event_id}
              className="bg-[#1E1E1E] shadow-lg rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setSelectedEvent(event)}
            >
              {/* Image Section */}
              <div className="h-40">
                <img
                  src="https://res.cloudinary.com/dkncy2ebu/image/upload/v1732941697/playmakershub.png"
                  alt={event.event_title}
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Event Details */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-white">
                  {event.event_title}
                </h3>
                <p className="text-sm text-gray-300">
                  {new Date(event.start_date).toLocaleDateString()} |{" "}
                  {event.bookings?.event_location}
                </p>

                {/* Participant Avatars */}
                <div className="flex items-center justify-between my-2">
                  <div className="flex space-x-2 mt-2">
                    {event.participation?.map((participant, index) => (
                      <img
                        key={index}
                        src={
                          participant.members_orgs.profile_image ||
                          "https://via.placeholder.com/40"
                        }
                        alt={participant.members_orgs.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-300">View Details</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-white">No upcoming events available</p>
        )}
      </div>

      {/* Modal for Event Details */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-[#1E1E1E] rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-white hover:text-white/50"
              onClick={closeModal}
            >
              ×
            </button>

            {/* Event Details */}
            <div>
              <div className="h-60">
                <img
                  src="https://res.cloudinary.com/dkncy2ebu/image/upload/v1732941697/playmakershub.png"
                  alt={selectedEvent.event_title}
                  className="object-cover w-full h-full rounded-t-lg"
                />
              </div>
              <h1 className="text-2xl font-bold text-white mt-4">
                {selectedEvent.event_title}
              </h1>
              <p className="text-sm text-white">
                {new Date(selectedEvent.start_date).toLocaleDateString()} -{" "}
                {new Date(selectedEvent.end_date).toLocaleDateString()} |{" "}
                {selectedEvent.bookings?.event_location}
              </p>
              <p className="mt-4 text-white">{selectedEvent.description}</p>

              {/* Participants */}
              <h2 className="mt-6 text-lg font-bold text-white">
                Participants:
              </h2>
              <div className="flex gap-4 mt-2">
                {selectedEvent.participation?.map((participant, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <img
                      src={
                        participant.members_orgs.profile_image ||
                        "https://via.placeholder.com/40"
                      }
                      alt={participant.members_orgs.name}
                      className="w-10 h-10 rounded-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoneEvents;
