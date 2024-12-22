import { supabase } from "./supabase";

export const retrievePendingEvents = async (page = 1, pageSize = 8) => {
  try {
    const { data, error, count } = await supabase
      .from("events")
      .select(
        `
        *,
        bookings (
          organizer_first_name,
          organizer_last_name,
          organizer_email,
          event_location,
          event_type_name
        ),
        musicians_required(*)
      `,
        { count: "exact" } // This ensures you get the total count of events
      )
      .eq("event_status", "Pending")
      .order("date_created", { ascending: false }) // Ensure sorting is based on "date_created"
      .range((page - 1) * pageSize, page * pageSize - 1); // Apply pagination range

    if (error) throw error;

    return { data, count }; // Return data and total count for pagination
  } catch (error) {
    console.error("Error fetching pending events:", error);
    throw error;
  }
};

export const retrieveAcceptedEvents = async (page = 1, pageSize = 8) => {
  try {
    const { data, error, count } = await supabase
      .from("events")
      .select(
        `
        *,
        bookings (
          organizer_first_name,
          organizer_last_name,
          organizer_email,
          event_location,
          event_type_name
        ),
        musicians_required(*)
      `,
        { count: "exact" } // Include total count for pagination
      )
      .eq("event_status", "Accepted")
      .order("date_created", { ascending: false }) // Sort by date, latest first
      .range((page - 1) * pageSize, page * pageSize - 1); // Paginate results

    if (error) throw error;

    return { data, count };
  } catch (error) {
    console.error("Error fetching rejected events:", error);
    throw error;
  }
};

export const retrieveOngoingEvents = async (page, pageSize) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  try {
    const { data, error, count } = await supabase
      .from("events")
      .select(
        `
        *,
        bookings (
          booking_id,
          organizer_first_name,
          organizer_last_name,
          organizer_email,
          event_location,
          event_type_name
        ),
        musicians_required (
          guitarist,
          melodics,
          vocalist,
          bassist,
          percussionist
        ),
        participation (
          user_id,  
          musician_role,
          status,
          members_orgs (
            id,
            authid,  
            email,
            name,
            profile_image
          )
        )
      `,
        { count: "exact" }
      )
      .eq("event_status", "Ongoing")
      .range(from, to);

    if (error) throw error;

    return {
      data: data.map((event) => {
        const musicianData = event.musicians_required[0] || {};
        const roles = {
          guitarist: {
            required: musicianData.guitarist || 0,
            participants: [],
          },
          melodics: { required: musicianData.melodics || 0, participants: [] },
          vocalist: { required: musicianData.vocalist || 0, participants: [] },
          bassist: { required: musicianData.bassist || 0, participants: [] },
          percussionist: {
            required: musicianData.percussionist || 0,
            participants: [],
          },
        };

        // Map participation to the correct roles
        (event.participation || []).forEach((participant) => {
          const role = participant.musician_role.toLowerCase();
          if (roles[role]) {
            roles[role].participants.push({
              id: participant.user_id,
              email: participant.members_orgs.email,
              name: participant.members_orgs.name,
              profileImage: participant.members_orgs.profile_image,
              status: participant.status,
            });
          }
        });

        const totalMusicians =
          roles.guitarist.required +
          roles.melodics.required +
          roles.vocalist.required +
          roles.bassist.required +
          roles.percussionist.required;

        return { ...event, totalMusicians, musicians: roles };
      }),
      count, // Return total count for pagination
    };
  } catch (error) {
    console.error("Error fetching ongoing events:", error);
    throw error;
  }
};

export const retrieveHomeOngoingEvents = async () => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        bookings (
          booking_id,
          organizer_first_name,
          organizer_last_name,
          organizer_email,
          event_location,
          event_type_name
        ),
        musicians_required (
          guitarist,
          melodics,
          vocalist,
          bassist,
          percussionist
        ),
        participation (
          user_id,  
          musician_role,
          status,
          members_orgs (
            id,
            authid,  
            email,
            name,
            profile_image
          )
        )
      `
      )
      .eq("event_status", "Ongoing");

    if (error) throw error;

    return data.map((event) => {
      const musicianData = event.musicians_required[0] || {};

      const roles = {
        guitarist: {
          required: musicianData.guitarist || 0,
          participants: [],
        },
        melodics: {
          required: musicianData.melodics || 0,
          participants: [],
        },
        vocalist: {
          required: musicianData.vocalist || 0,
          participants: [],
        },
        bassist: {
          required: musicianData.bassist || 0,
          participants: [],
        },
        percussionist: {
          required: musicianData.percussionist || 0,
          participants: [],
        },
      };

      // Map participation to the correct roles
      (event.participation || []).forEach((participant) => {
        const role = participant.musician_role.toLowerCase();
        if (roles[role]) {
          roles[role].participants.push({
            id: participant.user_id, // Use the `user_id` (matches `authid`)
            email: participant.members_orgs.email,
            name: participant.members_orgs.name,
            profileImage: participant.members_orgs.profile_image,
            status: participant.status,
          });
        }
      });

      const totalMusicians =
        roles.guitarist.required +
        roles.melodics.required +
        roles.vocalist.required +
        roles.bassist.required +
        roles.percussionist.required;

      return {
        ...event,
        totalMusicians,
        musicians: roles,
      };
    });
  } catch (error) {
    console.error("Error fetching ongoing events:", error);
    throw error;
  }
};

export const retrieveRejectedEvents = async (page = 1, pageSize = 8) => {
  try {
    const { data, error, count } = await supabase
      .from("events")
      .select(
        `
        *,
        bookings (
          organizer_first_name,
          organizer_last_name,
          organizer_email,
          event_location,
          event_type_name
        ),
        musicians_required(*)
      `,
        { count: "exact" } // Include total count for pagination
      )
      .eq("event_status", "Rejected")
      .order("date_created", { ascending: false }) // Sort by date, latest first
      .range((page - 1) * pageSize, page * pageSize - 1); // Paginate results

    if (error) throw error;

    return { data, count };
  } catch (error) {
    console.error("Error fetching rejected events:", error);
    throw error;
  }
};

export const retrievePublishedEvents = async (page = 1, pageSize = 8) => {
  try {
    const { data, error, count } = await supabase
      .from("events")
      .select(
        `
        *,
        bookings (
          organizer_first_name,
          organizer_last_name,
          organizer_email,
          event_location,
          event_type_name
        ),
        musicians_required (
          guitarist,
          melodics,
          vocalist,
          bassist,
          percussionist
        ),
        participation (
          members_orgs (
            email,
            name,
            profile_image
          ),
          musician_role,
          status
        )
      `,
        {
          count: "exact",
        }
      )
      .eq("event_status", "Published")
      .order("date_created", { ascending: false }) // Sort by date, latest first
      .range((page - 1) * pageSize, page * pageSize - 1); // Paginate results

    if (error) throw error;
    const processedData = data.map((event) => {
      const musicianData = event.musicians_required[0] || {};

      const roles = {
        guitarist: {
          required: musicianData.guitarist || 0,
          participants: [],
        },
        melodics: {
          required: musicianData.melodics || 0,
          participants: [],
        },
        vocalist: {
          required: musicianData.vocalist || 0,
          participants: [],
        },
        bassist: {
          required: musicianData.bassist || 0,
          participants: [],
        },
        percussionist: {
          required: musicianData.percussionist || 0,
          participants: [],
        },
      };

      (event.participation || []).forEach((participant) => {
        const role = participant.musician_role.toLowerCase();
        if (roles[role]) {
          roles[role].participants.push({
            email: participant.members_orgs.email,
            name: participant.members_orgs.name,
            profileImage: participant.members_orgs.profile_image,
            status: participant.status,
          });
        }
      });

      const totalMusicians =
        roles.guitarist.required +
        roles.melodics.required +
        roles.vocalist.required +
        roles.bassist.required +
        roles.percussionist.required;

      return {
        ...event,
        totalMusicians,
        musicians: roles,
      };
    });

    return {
      data: processedData,
      count, // Include the total count of published events
    };
  } catch (error) {
    console.error("Error fetching ongoing events:", error);
    throw error;
  }
};

export const fetchPastEvents = async (page = 1, pageSize = 8) => {
  try {
    const offset = (page - 1) * pageSize; // Calculate offset for pagination
    const { data, error, count } = await supabase
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
          melodics,
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
    `,
        { count: "exact" } // Fetch the total count for pagination
      )
      .eq("event_status", "Past")
      .order("end_date", { ascending: false })
      .range(offset, offset + pageSize - 1);
    // Apply pagination range

    if (error) {
      console.log(error);
    }

    // Transform data into the desired structure
    const transformedData = data.map((event) => {
      const musicians = {
        guitarist: { required: 0, participants: [] },
        melodics: { required: 0, participants: [] },
        vocalist: { required: 0, participants: [] },
        bassist: { required: 0, participants: [] },
        percussionist: { required: 0, participants: [] },
      };

      if (event.musicians_required.length > 0) {
        const requiredData = event.musicians_required[0];
        Object.keys(musicians).forEach((role) => {
          if (requiredData[role] !== undefined) {
            musicians[role].required = requiredData[role];
          }
        });
      }

      if (event.participation.length > 0) {
        event.participation.forEach((participant) => {
          const role = participant.musician_role.toLowerCase();
          if (musicians[role]) {
            musicians[role].participants.push({
              userId: participant.user_id,
              name: participant.members_orgs?.name || "Unknown",
              email: participant.members_orgs?.email || "Unknown",
              mobile: participant.members_orgs?.mobile || "Unknown",
              profileImage: participant.members_orgs?.profile_image || null,
              status: participant.status,
            });
          }
        });
      }

      return {
        ...event,
        musicians,
      };
    });

    return {
      data: transformedData, // Paginated event data
      count, // Total number of events (for calculating total pages)
    };
  } catch (error) {
    console.error("Error fetching past events:", error);
    throw error;
  }
};

export const fetchEvents = async () => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_date", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Unexpected error fetching events:", err);
    return null;
  }
};

export const updateEventStatus = async (eventId, newStatus) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .update({ event_status: newStatus })
      .eq("event_id", eventId);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error updating event status:", error);
    throw error;
  }
};

export const updateEventStatusToPublished = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from("events") // Your table name
      .update({ event_status: "Published" }) // Update the event_status field
      .eq("event_id", eventId); // Match the event_id field

    if (error) {
      console.error("Error updating event status:", error.message);
      return { success: false, message: error.message };
    }

    console.log("Event status updated successfully:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, message: "Unexpected error occurred." };
  }
};
