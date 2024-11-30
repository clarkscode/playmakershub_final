import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import {
  retrieveOngoingEvents,
  handleParticipation,
  supabase,
} from "../../database/supabase";

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participationLoading, setParticipationLoading] = useState(null);
  const [user, setUser] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching current user:", error.message);
      } else {
        setUser(user);
        fetchMemberDetails(user?.id);
      }
    };

    const fetchMemberDetails = async (authId) => {
      try {
        const { data, error } = await supabase
          .from("members_orgs")
          .select("*")
          .eq("authid", authId)
          .single();

        if (error) {
          console.error("Error fetching member details:", error.message);
        } else {
          setMemberDetails(data);
        }
      } catch (err) {
        console.error("Error fetching member details:", err.message);
      }
    };

    const fetchOngoingEvents = async () => {
      try {
        const ongoingEvents = await retrieveOngoingEvents();
        setEvents(ongoingEvents);
      } catch (error) {
        console.error("Failed to fetch ongoing events:", error);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
    fetchOngoingEvents();
  }, []);

  const handleParticipate = async (role, event) => {
    if (!user) {
      toast.error("User not logged in.");
      return;
    }

    if (!memberDetails) {
      toast.error("Member details not found.");
      return;
    }

    const memberRoles = JSON.parse(memberDetails.role || "[]");
    if (!memberRoles.includes(role)) {
      toast.error(`You do not have the role '${role}' to participate.`);
      return;
    }

    setParticipationLoading(event.eventId);
    try {
      const response = await handleParticipation(
        user.id,
        event,
        role,
        memberDetails
      );
      if (response.success) {
        toast.success(response.message);
        const refreshedEvents = await retrieveOngoingEvents();
        setEvents(refreshedEvents);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error in participation:", error);
      toast.error("An error occurred while participating.");
    } finally {
      setParticipationLoading(null);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-6">
      <h2 className="text-2xl font-bold mb-6 text-center col-span-full">
        Upcoming Events
      </h2>
      {events.length > 0 ? (
        events.map((event) => (
          <div
            key={event.event_id}
            className="bg-black shadow-lg rounded-lg overflow-hidden"
          >
            {/* Image Section */}
            <div className="h-40 bg-gray-200">
              <img
                src="https://via.placeholder.com/400x200?text=Event+Image"
                alt={event.event_title}
                className="object-cover w-full h-full"
              />
            </div>

            {/* Event Details */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-800">
                {event.event_title}
              </h3>
              <p>{event.description}</p>
              <p className="text-sm text-gray-600">
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
                <h4 className="text-md font-semibold text-gray-700">
                  Roles Needed:
                </h4>
                {Object.entries(event.musicians)
                  // eslint-disable-next-line no-unused-vars
                  .filter(([_, data]) => data.required > 0)
                  .map(([role, data], index) => {
                    const alreadyParticipated = data.participants.some(
                      (participant) => participant.id === user?.id
                    );
                    const isRoleFull =
                      data.participants.length >= data.required;
                    return (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
                          <span className="text-gray-700 font-medium capitalize">
                            {role} ({data.required})
                          </span>
                          {isRoleFull  ? (
                            <span className="text-sm text-red-500 font-medium">
                              Full
                            </span>
                          ) : (
                            !alreadyParticipated && (
                              <button
                                onClick={() => handleParticipate(role, event)}
                                className={`text-sm text-white px-4 py-1 rounded ${
                                  participationLoading === event.event_id
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-500 hover:bg-blue-600"
                                }`}
                                disabled={
                                  participationLoading === event.event_id
                                }
                              >
                                {participationLoading === event.event_id
                                  ? "Loading..."
                                  : "Participate"}
                              </button>
                            )
                          )}
                          {alreadyParticipated && (
                            <span className="text-sm text-green-500 font-medium">
                              Joined
                            </span>
                          )}
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
        <p className="text-gray-700 col-span-full text-center">
          No upcoming events available
        </p>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default UpcomingEvents;
