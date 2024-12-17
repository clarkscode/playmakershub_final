import { supabase } from "./supabase";

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
