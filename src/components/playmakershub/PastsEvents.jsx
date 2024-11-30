import { useEffect, useState } from "react";
import { fetchPastEvents } from "../../database/supabase";

const PastsEvents = () => {
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

  const Spinner = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white"></div>
    </div>
  );

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-6 -mt-10">
      {pastEvents.length > 0 ? (
        pastEvents.map((event) => (
          <div
            key={event.event_id}
            className="bg-[#1E1E1E] shadow-lg rounded-lg overflow-hidden"
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
              <p>{event.description}</p>
              <p className="text-sm text-white">
                {new Date(event.start_date).toLocaleDateString()} -{" "}
                {new Date(event.end_date).toLocaleDateString()} |{" "}
                {event.bookings.event_location}
              </p>
              <p className="text-sm text-gray-500">
                Organizer: {event.bookings.organizer_first_name}{" "}
                {event.bookings.organizer_last_name}
              </p>
              <p className="text-sm text-gray-500">
                Total Musicians Required: {event.totalMusicians}
              </p>

              {/* Roles Section */}
              <div className="mt-4">
                <h4 className="text-md font-semibold text-white mb-2">
                  Participants Needed:
                </h4>
                {Object.entries(event.musicians)
                  // eslint-disable-next-line no-unused-vars
                  .filter(([_, data]) => data.required > 0)
                  .map(([role, data], index) => {
                    return (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
                          <span className="text-gray-700 font-medium capitalize">
                            {role} ({data.required})
                          </span>
                        </div>
                        {/* Display participants */}
                        <div className="mt-2">
                          {data.participants.map((participant, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 bg-gray-50 p-2 rounded"
                            >
                              <img
                                src={
                                  participant.profileImage ||
                                  "https://via.placeholder.com/40"
                                }
                                alt={participant.name}
                                className="w-10 h-10 rounded-full"
                              />
                              <span className="text-gray-700 font-medium">
                                {participant.name || "Anonymous"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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

export default PastsEvents;
