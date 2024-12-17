import { supabase } from "./supabase";

export const retrievePendingEvents = async () => {
  try {
    const { data, error } = await supabase
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
        )
      `
      )
      .eq("event_status", "Pending");

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching pending events:", error);
    throw error;
  }
};

export const retrieveRejectedEvents = async () => {
  try {
    const { data, error } = await supabase
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
        )
      `
      )
      .eq("event_status", "Rejected");

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching rejected events:", error);
    throw error;
  }
};

export const retrieveAcceptedEvents = async () => {
  try {
    const { data, error } = await supabase
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
        )
      `
      )
      .eq("event_status", "Accepted");

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching accepted events:", error);
    throw error;
  }
};

export const retrieveOngoingEvents = async () => {
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
          keyboardist,
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
        keyboardist: {
          required: musicianData.keyboardist || 0,
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
        roles.keyboardist.required +
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

export const retrievePublishedEvents = async () => {
  try {
    const { data, error } = await supabase
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
          keyboardist,
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
      `
      )
      .eq("event_status", "Published");

    if (error) throw error;

    return data.map((event) => {
      const musicianData = event.musicians_required[0] || {};

      const roles = {
        guitarist: {
          required: musicianData.guitarist || 0,
          participants: [],
        },
        keyboardist: {
          required: musicianData.keyboardist || 0,
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
        roles.keyboardist.required +
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

export const fetchPastEvents = async () => {
  try {
    const { data, error } = await supabase
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
          keyboardist,
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
      `
      )
      .lt("end_date", new Date().toISOString())
      .order("end_date", { ascending: false });

    if (error) throw error;

    return data.map((event) => {
      const musicians = {
        guitarist: { required: 0, participants: [] },
        keyboardist: { required: 0, participants: [] },
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
