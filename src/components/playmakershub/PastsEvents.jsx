import { useEffect, useState } from "react";
import { fetchPastEvents } from "../../database/events";

const PastsEvents = () => {
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 3;

  const getPastEvents = async () => {
    try {
      const { data, count } = await fetchPastEvents(currentPage, pageSize);
      setPastEvents(data);
      setTotalPages(Math.ceil(count / pageSize)); // Calculate total pages
    } catch (error) {
      console.error("Failed to fetch past events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPastEvents();
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const Spinner = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white"></div>
    </div>
  );

  if (loading) return <Spinner />;

  return (
    <div className="p-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 -mt-10">
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
          <p className="text-gray-600 col-span-full text-center">
            No past events available
          </p>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Previous
          </button>
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PastsEvents;
