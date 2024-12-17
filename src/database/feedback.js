import { supabase } from "./supabase";

export const insertFeedback = async (feedbackData) => {
  try {
    const { data, error } = await supabase
      .from("event_feedback")
      .insert([feedbackData]);

    if (error) {
      console.error("Error inserting feedback:", error);
      console.log("feedbackData", feedbackData);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Unexpected error inserting feedback:", err);
    throw err;
  }
};
