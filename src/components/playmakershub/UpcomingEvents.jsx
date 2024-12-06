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
        // Access user metadata directly
        const userMetadata = user?.user_metadata || {};
        const isAdmin = userMetadata.is_admin || false;
        const isSuperAdmin = userMetadata.is_super_admin || false;

        // If the user is an admin or developer (super admin), show an appropriate error message
        if (isAdmin || isSuperAdmin) {
          // toast.error("Admins and developers cannot participate in events.");
          console.log("Admins and developers cannot participate in events.");
          setMemberDetails(null);
          // Reset member details
          return;
        }

        // Query the `members_orgs` table
        const { data, error } = await supabase
          .from("members_orgs")
          .select("*")
          .eq("authid", authId)
          .single();

        if (error || !data) {
          // If no member data is found, assume the user is an admin or developer
          // toast.error(
          //   "No member record found. Only members can participate in events."
          // );
          // console.error(
          //   "You are admin. Only members can participate in events."
          // );
          setMemberDetails(null); // Reset member details
          return;
        }

        // Set member details if found
        setMemberDetails(data);
      } catch (err) {
        console.error("Error fetching member details:", err.message);
      }
    };

    const fetchOngoingEvents = async () => {
      try {
        const ongoingEvents = await retrieveOngoingEvents();
        // Filter out duplicate participations for events
        const cleanedEvents = ongoingEvents.map((event) => {
          Object.keys(event.musicians).forEach((role) => {
            const roleData = event.musicians[role];
            // Ensure participants list has no duplicates
            const uniqueParticipants = roleData.participants.filter(
              (value, index, self) =>
                index ===
                self.findIndex((participant) => participant.id === value.id)
            );
            roleData.participants = uniqueParticipants;
          });
          return event;
        });
        setEvents(cleanedEvents);
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
      // toast.error("Member details not found.");
      toast.error("Only members can participate in events.");
      return;
    }

    // Step 1: Restriction: Prevent participation if the user has 2+ backouts
    const { data: backouts, error: backoutError } = await supabase
      .from("backouts")
      .select("*")
      .eq("user_id", memberDetails.id);

    if (backoutError) {
      console.error("Error checking backouts:", backoutError.message);
      return;
    }

    if (backouts.length >= 2) {
      toast.error(
        "You cannot participate in events because you have 2 or more backouts."
      );
      return;
    }
    // Step 2: Check if the member has the required role for participation
    const memberRoles = JSON.parse(memberDetails.role || "[]");

    if (!memberRoles.includes(role)) {
      toast.error(`You do not have the role '${role}' to participate.`);
      return;
    }

    // Step 3: Check if the member meets the status requirement for the event

    try {
      setParticipationLoading(event.eventId);

      // Fetch the required statuses for the event from the status_required table
      const { data: statusRequired, error: statusError } = await supabase
        .from("status_required")
        .select("status_name")
        .eq("event_id", event.event_id)
        .single();

      if (statusError || !statusRequired) {
        toast.error("Failed to fetch status requirements for the event.");
        console.error("Error fetching status_required:", statusError?.message);
        console.log("Error fetching status_required:", statusError?.message);
        console.log("event id ", event.event_id);
        return;
      }

      const requiredStatuses = statusRequired.status_name || [];
      const memberStatus = memberDetails.status;
      // `status` column in `members_orgs`
      console.log("member status", memberStatus);
      console.log("required Statuses on event", requiredStatuses);

      // Check if the member's status is in the required statuses
      if (!requiredStatuses.includes(memberStatus)) {
        toast.error(
          `You are ineligible to participate in this event. Required: ${requiredStatuses.join(
            ", "
          )}`
        );
        return;
      }
      // Step 4: Insert participation for the user in the event
      const response = await handleParticipation(
        user.id,
        event,
        role,
        memberDetails
      );
      if (response.success) {
        toast.success(response.message);
        // Refresh events and member details
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

  const handleCancelParticipation = async (event) => {
    if (!user) {
      toast.error("User not logged in.");
      return;
    }

    try {
      // Step 1: Add a backout entry for this user and event
      const { error: backoutError } = await supabase
        .from("backouts")
        .insert([{ user_id: memberDetails.id, event_id: event.event_id }]);

      if (backoutError) {
        console.error("Error adding backout entry:", backoutError.message);
        toast.error("Failed to cancel participation.");
        return;
      }

      // Step 2: Count the user's total backouts
      const { data: backoutCountData, error: backoutCountError } =
        await supabase
          .from("backouts")
          .select("id", { count: "exact" })
          .eq("user_id", memberDetails.id);

      if (backoutCountError) {
        console.error(
          "Error fetching backout count:",
          backoutCountError.message
        );
        toast.error("Failed to update user status.");
        return;
      }

      const backoutCount = backoutCountData.length;

      // Step 3: Determine the new status based on backout count
      let newStatus = memberDetails.status;
      if (backoutCount === 1) {
        newStatus = "inactive";
      } else if (backoutCount >= 2) {
        newStatus = "probationary";
      }

      // Step 4: Update the member's status
      const { error: updateStatusError } = await supabase
        .from("members_orgs")
        .update({ status: newStatus })
        .eq("id", memberDetails.id);

      if (updateStatusError) {
        console.error(
          "Error updating member status:",
          updateStatusError.message
        );
        toast.error("Failed to update user status.");
        return;
      }

      // Step 5: Remove the user's participation in the event
      const { error: removeParticipationError } = await supabase
        .from("participation")
        .delete()
        .eq("user_id", user.id)
        .eq("event_id", event.event_id);

      if (removeParticipationError) {
        console.error(
          "Error removing user participation:",
          removeParticipationError.message
        );
        toast.error("Failed to cancel participation.");
        return;
      }

      toast.success("Participation canceled successfully!");

      // Step 6: Insert a notification for admin about the member's backout
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert([
          {
            event_id: event.event_id,
            user_id: null, // Admin notification
            notification_type: "web",
            content: `${memberDetails.name} has backed out of the event ${event.event_title}.`,
            sent_at: new Date(),
          },
        ]);

      if (notificationError) {
        console.error(
          `Error inserting notification for backout of member ${memberDetails.name}  from event ${event.event_title}:`,
          notificationError
        );
      } else {
        console.log(
          `Notification sent about member ${memberDetails.first_name} ${memberDetails.last_name} backout from event ${event.event_title}`
        );
      }
      // Step 7: Refresh the events and member details
      const refreshedEvents = await retrieveOngoingEvents();
      setEvents(refreshedEvents);

      const { data: updatedMemberDetails } = await supabase
        .from("members_orgs")
        .select("*")
        .eq("id", memberDetails.id)
        .single();

      setMemberDetails(updatedMemberDetails);
    } catch (error) {
      console.error("Error canceling participation:", error);
      toast.error("An error occurred while canceling participation.");
    }
  };

  const Spinner = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white"></div>
    </div>
  );

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-6 -mt-10">
      {events.length > 0 ? (
        events.map((event) => (
          <div
            key={event.event_id}
            className="bg-white shadow-lg rounded-lg overflow-hidden"
          >
            {/* Image Section */}
            <div className="h-40 bg-gray-200">
              <img
                src="https://res.cloudinary.com/dkncy2ebu/image/upload/v1732941697/playmakershub.png"
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
                      (participant) => {
                        return participant.id === user?.id;
                      }
                    );

                    const isRoleFull =
                      data.participants.length >= data.required;
                    return (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
                          <span className="text-gray-700 font-medium capitalize">
                            {role} ({data.required})
                          </span>
                          {isRoleFull ? (
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
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-500 font-medium">
                                Joined
                              </span>
                              <button
                                onClick={() => handleCancelParticipation(event)}
                                className="text-sm text-white px-4 py-1 rounded bg-red-500 hover:bg-red-600"
                              >
                                Cancel
                              </button>
                            </div>
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
        <p className="text-gray-600 col-span-full text-center">
          No upcoming events available
        </p>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default UpcomingEvents;
