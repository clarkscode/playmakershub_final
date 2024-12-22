import { useState, useEffect } from "react";
import { retrieveOngoingEvents } from "../../database/events";
import OngoingEventsTable from "./Reusable/OngoingEventsTable";

const OngoingEvents = () => {
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 8; // Number of events per page

  useEffect(() => {
    fetchOngoingEvents();
  }, [currentPage]);

  const fetchOngoingEvents = async () => {
    try {
      const { data, count } = await retrieveOngoingEvents(
        currentPage,
        pageSize
      );
      setOngoingEvents(data);
      // Calculate the total pages
      setTotalPages(Math.ceil(count / pageSize));
    } catch (err) {
      setError("Failed to retrieve ongoing events.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return; // Prevent out-of-bound pages
    setCurrentPage(newPage);
  };

  const handleEventUpdate = (updatedEventId, updatedEventData) => {
    setOngoingEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.event_id === updatedEventId
          ? { ...event, ...updatedEventData }
          : event
      )
    );
  };

  const handleEventDelete = (deletedEventId) => {
    setOngoingEvents((prevEvents) =>
      prevEvents.filter((event) => event.event_id !== deletedEventId)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-t-transparent border-[#5C1B33] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  if (ongoingEvents.length === 0) {
    return <div className="text-center mt-8">No ongoing events found</div>;
  }

  return (
    <div className="space-y-4">
      <table className="w-full text-left border-collapse border border-gray-300 rounded-lg">
        <thead className="bg-[#5C1B33] text-white">
          <tr>
            <th className="p-3">Event Title</th>
            <th className="p-3">Organizer</th>
            <th className="p-3">Email</th>
            <th className="p-3">Participants</th>
            <th>View</th>
            <th className="p-3">Participation filter</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {ongoingEvents.map((event, index) => (
            <OngoingEventsTable
              key={event.event_id}
              eventId={event.event_id}
              bookingId={event.bookings.booking_id}
              eventTitle={event.event_title}
              organizer={`${event.bookings.organizer_first_name} ${event.bookings.organizer_last_name}`}
              email={event.bookings.organizer_email}
              location={event.bookings.event_location}
              genre={event.genre}
              theme={event.theme}
              eventStart={{
                date: event.start_date,
                time: event.start_time,
              }}
              eventEnd={{
                date: event.end_date,
                time: event.end_time,
              }}
              status={event.event_status}
              participants={event.participation?.length}
              maxParticipants={event.totalMusicians}
              requiredParticipants={event.musicians_required}
              onEventUpdate={handleEventUpdate}
              onEventDelete={handleEventDelete}
              rowIndex={index}
            />
          ))}
        </tbody>
      </table>
      {/* Pagination Controls */}
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
    </div>
  );
};

export default OngoingEvents;
