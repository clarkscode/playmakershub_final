import { useState, useEffect } from "react";
import EventCard from "./EventCard";
import { retrievePublishedEvents } from "../../database/supabase";

const PublishedEvents = () => {
  const [publishedEvents, setPublishedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOngoingEvents = async () => {
      try {
        const data = await retrievePublishedEvents();
        setPublishedEvents(data);
        // console.log(data);
      } catch (err) {
        setError("Failed to retrieve ongoing events.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOngoingEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-t-transparent border-[#5C1B33] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (publishedEvents.length === 0) {
    return <div className="text-center mt-8">No published events found</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {publishedEvents.map((event, index) => {
        return (
          <EventCard
            key={index}
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
            eventEnd={{
              date: event.end_date,
              time: event.end_time,
            }}
            status={event.event_status}
            department={event.department}
            organization={event.bookings.event_type_name}
            participants={event.participation?.length}
            maxParticipants={event.totalMusicians}
          />
        );
      })}
    </div>
  );
};

export default PublishedEvents;
