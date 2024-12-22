import { useEffect, useState } from "react";
import { fetchPastEvents } from "../../database/events";
import PastEventsTable from "./Reusable/PastEventsTable";

const PastEvents = () => {
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 8;

  const getPastEvents = async () => {
    try {
      const { data, count } = await fetchPastEvents(currentPage, pageSize);
      setPastEvents(data);
      setTotalPages(Math.ceil(count / pageSize)); // Calculate total pages
    } catch (error) {
      console.error("Failed to fetch past events:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getPastEvents();
  }, [currentPage]);

  useEffect(() => {
    getPastEvents();
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-t-transparent border-[#5C1B33] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (pastEvents.length === 0) {
    return <div className="text-center mt-8">No past events found</div>;
  }

  return (
    <div className="space-y-4">
      {refreshing && (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-t-transparent border-[#5C1B33] rounded-full animate-spin"></div>
        </div>
      )}
      <table className="w-full text-left border-collapse border border-gray-300 rounded-lg">
        <thead className="bg-[#5C1B33] text-white">
          <tr>
            <th className="p-3">Event Title</th>
            <th className="p-3">Organizer</th>
            <th className="p-3">Email</th>
            <th className="p-3">Status</th>
            <th className="p-3">View</th>
          </tr>
        </thead>
        <tbody>
          {pastEvents.map((event, index) => (
            <PastEventsTable
              key={event.event_id}
              eventId={event.event_id}
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
              status={event.event_status}
              eventEnd={{
                date: event.end_date,
                time: event.end_time,
              }}
              department={
                event.bookings.event_type === "Department"
                  ? event.bookings.event_type_name
                  : null
              }
              organization={
                event.bookings.event_type === "Organization"
                  ? event.bookings.event_type_name
                  : null
              }
              requiredParticipants={event.musicians_required}
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

export default PastEvents;
