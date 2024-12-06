import { createClient } from "@supabase/supabase-js";
import sendEmail from "./sendEmail";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabaseAdminKey = import.meta.env.VITE_SUPABASE_ADMIN;
export const supabase = createClient(supabaseUrl, supabaseKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

export const createBookingProcess = async (formData) => {
  try {
    // Step 1: Insert the booking into the bookings table
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .insert([
        {
          organizer_first_name: formData.firstName,
          organizer_last_name: formData.lastName,
          organizer_email: formData.email,
          event_location: formData.location,
          event_type: formData.eventType,
          event_type_name: formData.eventTypeName,
          date_created: new Date(),
        },
      ])
      .select();

    if (bookingError) throw bookingError;

    const bookingId = bookingData[0]?.booking_id;

    // Step 2: Insert the event into the events table
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .insert([
        {
          booking_id: bookingId,
          event_title: formData.title,
          start_date: formData.startDate,
          end_date: formData.endDate,
          start_time: formData.startTime,
          end_time: formData.endTime,
          genre: formData.genre,
          theme: formData.theme,
          description: formData.description,
          event_status: "Pending",
          date_created: new Date(),
        },
      ])
      .select();

    if (eventError) throw eventError;

    const eventId = eventData[0]?.event_id;

    // Step 3: Insert the musician requirements into the musicians_required table
    const { data: musicianData, error: musicianError } = await supabase
      .from("musicians_required")
      .insert([
        {
          event_id: eventId,
          guitarist: formData.guitarist,
          vocalist: formData.vocalist,
          bassist: formData.bassist,
          keyboardist: formData.keyboardist,
          percussionist: formData.percussionist,
        },
      ])
      .select();

    if (musicianError) throw musicianError;

    return { bookingData, eventData, musicianData };
  } catch (error) {
    console.error("Error in booking process:", error);
    throw error;
  }
};

export const adminCreateEventProcess = async (formData, adminName) => {
  try {
    // Step 1: Insert the booking into the bookings table
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .insert([
        {
          organizer_first_name: formData.firstName,
          organizer_last_name: formData.lastName,
          organizer_email: formData.email,
          event_location: formData.location,
          event_type: formData.eventType,
          event_type_name: formData.eventTypeName,
          date_created: new Date(),
        },
      ])
      .select();

    if (bookingError) throw bookingError;

    const bookingId = bookingData[0]?.booking_id;

    // Step 2: Insert the event into the events table
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .insert([
        {
          booking_id: bookingId,
          event_title: formData.title,
          start_date: formData.startDate,
          end_date: formData.endDate,
          start_time: formData.startTime,
          end_time: formData.endTime,
          genre: formData.genre,
          theme: formData.theme,
          description: formData.description,
          event_status: "Accepted", // Directly accepted by admin
          date_created: new Date(),
        },
      ])
      .select();

    if (eventError) throw eventError;

    const eventId = eventData[0]?.event_id;

    // Step 3: Insert the musician requirements into the musicians_required table
    const { data: musicianData, error: musicianError } = await supabase
      .from("musicians_required")
      .insert([
        {
          event_id: eventId,
          guitarist: formData.guitarist,
          vocalist: formData.vocalist,
          bassist: formData.bassist,
          keyboardist: formData.keyboardist,
          percussionist: formData.percussionist,
        },
      ])
      .select();

    if (musicianError) throw musicianError;

    // Step 4: Log the creation into the updates table
    const { error: updateLogError } = await supabase.from("updates").insert([
      {
        update_type: "Added new events",
        updated_by: adminName,
        date_time: new Date().toISOString(),
      },
    ]);

    if (updateLogError) throw updateLogError;

    // Step 5: Notify the organizer using sendEmail
    const emailSubject = "Event Created Successfully!";
    const emailBody = `
      Dear Organizer,
      <p>Your booking for the event titled "${formData.title}" has been successfully created!</p>
      <p>Here is your booking ID: <strong>${bookingId}</strong></p>
      <p>Please remember to keep this booking ID safe. You will need it if you want to make clarifications, updates, or cancellations for your booking.</p>
      <p>Best Regards,<br/>The Playmakers Family</p>
    `;

    const emailResult = await sendEmail(
      formData.email,
      emailSubject,
      emailBody
    );
    if (emailResult instanceof Error) throw emailResult;

    return { bookingData, eventData, musicianData };
  } catch (error) {
    console.error("Error in adminCreateEventProcess:", error);
    throw error;
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

// export const retrieveOngoingEvents = async () => {
//   try {
//     const { data, error } = await supabase
//       .from("events")
//       .select(
//         `
//         *,
//         bookings (
//           organizer_first_name,
//           organizer_last_name,
//           organizer_email,
//           event_location,
//           event_type_name
//         ),
//         musicians_required (
//           guitarist,
//           keyboardist,
//           vocalist,
//           bassist,
//           percussionist
//         ),
//         participation (
//           members_orgs (
//             email,
//             name,
//             profile_image
//           ),
//           musician_role,
//           status
//         )
//       `
//       )
//       .eq("event_status", "Ongoing");

//     if (error) throw error;

//     return data.map((event) => {
//       const musicianData = event.musicians_required[0] || {};

//       const roles = {
//         guitarist: {
//           required: musicianData.guitarist || 0,
//           participants: [],
//         },
//         keyboardist: {
//           required: musicianData.keyboardist || 0,
//           participants: [],
//         },
//         vocalist: {
//           required: musicianData.vocalist || 0,
//           participants: [],
//         },
//         bassist: {
//           required: musicianData.bassist || 0,
//           participants: [],
//         },
//         percussionist: {
//           required: musicianData.percussionist || 0,
//           participants: [],
//         },
//       };

//       (event.participation || []).forEach((participant) => {
//         const role = participant.musician_role.toLowerCase();
//         if (roles[role]) {
//           roles[role].participants.push({
//             email: participant.members_orgs.email,
//             name: participant.members_orgs.name,
//             profileImage: participant.members_orgs.profile_image,
//             status: participant.status,
//           });
//         }
//       });

//       const totalMusicians =
//         roles.guitarist.required +
//         roles.keyboardist.required +
//         roles.vocalist.required +
//         roles.bassist.required +
//         roles.percussionist.required;

//       return {
//         ...event,
//         totalMusicians,
//         musicians: roles,
//       };
//     });
//   } catch (error) {
//     console.error("Error fetching ongoing events:", error);
//     throw error;
//   }
// };
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

// new

export const fetchBookingStatus = async (bookingID) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("event_status")
      .eq("booking_id", bookingID)
      .single();

    if (error) throw error;

    return data?.event_status || "Unknown"; // Return status or "Unknown" if not found
  } catch (error) {
    console.error("Error fetching booking status:", error);
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

// unuse
// export const fetchUserType = async (userId) => {
//   try {
//     const { data, error } = await supabase
//       .from("users")
//       .select("user_type")
//       .eq("id", userId)
//       .single();

//     if (error) throw error;

//     return data?.user_type;
//   } catch (error) {
//     console.error("Error fetching user type:", error);
//     throw error;
//   }
// };

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

export const createMember = async (memberData) => {
  try {
    const { data, error } = await supabase
      .from("members_orgs")
      .insert([memberData]);

    if (error) {
      console.error("Error creating member:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Unexpected error:", err);
    return null;
  }
};

export const fetchMembers = async () => {
  try {
    // Fetch members with their participation data
    const { data: members, error: memberError } = await supabase
      .from("members_orgs")
      .select("*, participation:participation_user_id_fkey(*)");

    if (memberError) {
      console.error("Error fetching members:", memberError.message);
      return null;
    }

    // Fetch all backouts (user_id is already indexed)
    const { data: backouts, error: backoutsError } = await supabase
      .from("backouts")
      .select("user_id");

    if (backoutsError) {
      console.error("Error fetching backouts:", backoutsError.message);
      return null;
    }

    // Debugging to verify backouts data
    // if (backouts) {
    //   console.log("Backouts data:", backouts);
    // }

    // Count backouts for each user
    const backoutCounts = backouts.reduce((acc, backout) => {
      acc[backout.user_id] = (acc[backout.user_id] || 0) + 1;
      return acc;
    }, {});

    // Map members and add totalParticipation and totalBackouts
    return members.map((member) => ({
      ...member,
      totalParticipation: member.participation.length,
      totalBackouts: backoutCounts[member.id] || 0,
      // Match `id` in members_orgs with `user_id` in backouts
    }));
  } catch (err) {
    console.error("Unexpected error:", err);
    return null;
  }
};

export const fetchMemberById = async (id) => {
  try {
    const { data, error } = await supabase
      .from("members_orgs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching member by ID:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Unexpected error:", err);
    return null;
  }
};

export const updateMember = async (id, updatedData) => {
  try {
    console.log("Updating member with ID:", id, "Data:", updatedData);
    // Remove `totalBackouts` field if it exists
    const { totalBackouts, ...dataToUpdate } = updatedData;

    const { data, error } = await supabase
      .from("members_orgs")
      .update(dataToUpdate)
      .eq("id", id);

    if (error) {
      console.error("Error updating member:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Unexpected error:", err);
    return null;
  }
};

export const deleteMember = async (id) => {
  try {
    const { data, error } = await supabase
      .from("members_orgs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting member:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Unexpected error:", err);
    return null;
  }
};

// Function to handle participation
export const handleParticipation = async (
  userId,
  event,
  musicianRole,
  user
) => {
  try {
    const { error: participationError } = await supabase
      .from("participation")
      .insert({
        user_id: userId,
        event_id: event.event_id,
        musician_role: musicianRole,
        status: "Pending",
      });
    console.log("handleParticipation called with:", {
      userId,
      eventId: event.eventId,
      musicianRole,
    });

    const { data, error } = await supabase.from("notifications").insert([
      {
        event_id: event.eventId,
        user_id: null,
        notification_type: "web",
        content: `${user.name || "A user"} has joined the event '${
          event.event_title
        }'.`,
        sent_at: new Date(),
      },
    ]);

    if (error) {
      console.error("Error inserting notification:", error);
    } else {
      console.log("Notification inserted successfully:", data);
    }
    if (participationError) {
      console.error("Error inserting into participation:", participationError);
      return {
        success: false,
        message: participationError.message,
      };
    } else {
      console.log("Participation inserted successfully");
    }

    return {
      success: true,
      message: "Participation recorded successfully.",
    };
  } catch (error) {
    console.error(error.message);
    return {
      success: false,
      message: error.message,
    };
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
