import { useState, useEffect } from "react";
import { supabase } from "../../database/supabase";

export const RecentUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch updates from the `updates` table
  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from("updates")
        .select("*")
        .order("date_time", { ascending: false });

      if (error) {
        console.error("Error fetching updates:", error.message);
        return;
      }

      setUpdates(data || []);
    } catch (error) {
      console.error("Unexpected error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  return (
    <div className="animate__animated animate__fadeIn">
      {loading ? (
        <div className="text-center text-gray-500 py-4">Loading updates...</div>
      ) : updates.length > 0 ? (
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-[#EFFBEF]">
              <th className="py-2 text-[#5C1B33] text-sm">Update Type</th>
              <th className="py-2 text-[#5C1B33] text-sm">Updated By</th>
              <th className="py-2 text-[#5C1B33] text-sm">Date and Time</th>
            </tr>
          </thead>
          <tbody>
            {updates.map((update) => (
              <tr key={update.update_id} className="text-center">
                <td className="py-2">{update.update_type || "..."}</td>
                <td className="py-2">{update.updated_by || "..."}</td>
                <td className="py-2">
                  {new Date(update.date_time).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center text-gray-500 py-4">
          No recent updates found.
        </div>
      )}
    </div>
  );
};
