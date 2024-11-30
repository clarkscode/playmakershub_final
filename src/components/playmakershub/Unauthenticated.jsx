import { useState, useEffect } from "react";
import { fetchPastEvents } from "../../database/supabase";
import UnauthNavbar from "./UnauthNavbar";
import DoneEvents from "./DoneEvents";

const Unauthenticated = () => {
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("");

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

  const openModal = (event) => setSelectedEvent(event);
  const closeModal = () => setSelectedEvent(null);

//   const Spinner = () => (
//     <div className="fixed inset-0 flex items-center justify-center bg-Radial bg-[#000000] bg-opacity-50 z-50">
//       <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white"></div>
//     </div>
//   );

//   if (loading) return <Spinner />;

  return (
    <div className="p-0 bg-Radial h-screen bg-[#000000]">
        <UnauthNavbar/>
      {/* Tab Buttons */}
      <div>
      <button
        className= "text-green-500 font-bold text-xl p-5 -mb-5 pl-10"
      >
        Approved Events
      </button>
      </div>

      {/* Event Grid
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-5 ">
        {pastEvents.length > 0 ? (
          pastEvents.map((event) => (
            <div
              key={event.event_id}
              className="bg-gray-800 p-4 rounded shadow-md"
            >
              <h3 className="text-xl font-bold text-white">{event.event_title}</h3>
              <p className="text-gray-400">
                {new Date(event.start_date).toLocaleDateString()} -{" "}
                {new Date(event.end_date).toLocaleDateString()} |{" "}
                {event.bookings?.event_location || "Location not available"}
              </p>
              <p className="text-gray-300">
                Organizer: {event.bookings?.organizer_first_name}{" "}
                {event.bookings?.organizer_last_name}
              </p>
              <p
                className="text-blue-500 cursor-pointer"
                onClick={() => openModal(event)}
              >
                View Details
              </p>
            </div>
          ))
        ) : (
          <p className="text-white">No past events available</p>
        )}
      </div> */}

      {/* Pop-up Modal
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-lg shadow-xl max-w-lg w-full text-white">
            <h2 className="text-2xl font-bold">{selectedEvent.event_title}</h2>
            <p className="text-gray-400">
              {new Date(selectedEvent.start_date).toLocaleDateString()} -{" "}
              {new Date(selectedEvent.end_date).toLocaleDateString()} |{" "}
              {selectedEvent.bookings?.event_location || "Location not available"}
            </p>
            <p className="mt-2">
              {selectedEvent.description ||
                "No description available for this event."}
            </p>
            <p className="mt-4">
              Organizer: {selectedEvent.bookings?.organizer_first_name}{" "}
              {selectedEvent.bookings?.organizer_last_name}
            </p>
            <button
              className="mt-6 bg-red-500 px-4 py-2 rounded text-white"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )} */}
      <div className="p-6 -mt-4">
        <DoneEvents />
      </div>
    </div>
    
  );
};

export default Unauthenticated;
