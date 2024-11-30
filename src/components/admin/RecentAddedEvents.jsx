import { useEffect, useState } from "react";
import { supabase } from "../../database/supabase";

export const RecentAddedEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("events").select("*");
        if (error) {
          console.error("Error fetching events:", error.message);
          return;
        }
        setEvents(data || []);
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return <p>Loading events...</p>;
  }

  if (events.length === 0) {
    return <p>No events found.</p>;
  }

  return (
    <table className="min-w-full bg-white rounded-lg animate__animated animate__fadeIn">
      <thead className="bg-[#EFFBEF]">
        <tr>
          <th className="py-2 text-[#5C1B33] text-sm">Event Title</th>
          <th className="py-2 text-[#5C1B33] text-sm">Theme</th>
          <th className="py-2 text-[#5C1B33] text-sm">Start Date</th>
          <th className="py-2 text-[#5C1B33] text-sm">Start Time</th>
          <th className="py-2 text-[#5C1B33] text-sm">End Time</th>
          <th className="py-2 text-[#5C1B33] text-sm">Status</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event, index) => (
          <tr key={index} className="text-center">
            <td className="py-2 text-[#4B4B4C]">{event.event_title}</td>
            <td className="py-2 text-[#4B4B4C]">{event.theme}</td>
            <td className="py-2 text-[#4B4B4C]">{event.start_date}</td>
            <td className="py-2 text-[#4B4B4C]">{event.start_time}</td>
            <td className="py-2 text-[#4B4B4C]">{event.end_time}</td>
            <td
              className={`py-2 ${
                event.event_status !== "Ongoing"
                  ? "text-[#4B4B4C]/60 font-semibold"
                  : "text-[#40B267] font-semibold"
              }`}
            >
              {event.event_status}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
