import { supabase } from "./supabase";

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
        status: "participated", // participated or non-participated
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
        notification_type: "joined",
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
