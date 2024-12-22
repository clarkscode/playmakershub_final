import sendEmail from "./sendEmail";
import { supabase } from "./supabase";

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
          melodics: formData.melodics,
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
        },
      ])
      .select();

    if (bookingError) throw bookingError;

    const bookingId = bookingData[0]?.booking_id;
    const bookingNumber = bookingData[0]?.book_number;

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
          melodics: formData.melodics,
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
      },
    ]);

    if (updateLogError) throw updateLogError;

    // Step 5: Notify the organizer using sendEmail
    const organizerName = `${formData.firstName} ${formData.lastName}`;
    const emailSubject = "Event Created Successfully!";
    const emailBody = `
      Dear ${organizerName},
      <p>Your booking for the event titled "${formData.title}" has been successfully created!</p>
      <p>Here is your booking ID: <strong>${bookingNumber}</strong></p>
      <p>Please remember to keep this booking ID safe. You will need it if you want to make clarifications, updates, or cancellations for your booking.</p>
      <p>Best Regards,<br/>The Playmakers Family</p>
      <a href="https://www.playmakershub.org" target="_blank">www.playmakershub.org</a></p>
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
