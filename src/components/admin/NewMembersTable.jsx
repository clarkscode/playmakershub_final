import { useEffect, useState } from "react";
import { supabase } from "../../database/supabase";

export const NewMembersTable = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Query the `members_orgs` table to fetch recent members
        const { data, error } = await supabase
          .from("members_orgs")
          .select("name, join_date, role, status")
          .order("join_date", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching members:", error);
        } else {
          setMembers(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading members...</div>;
  }
  return (
    <table className="min-w-full bg-white rounded-lg animate__animated animate__fadeIn">
      <thead className="bg-[#EFFBEF]">
        <tr>
          <th className="py-2 text-[#5C1B33] text-sm">Member Name</th>
          <th className="py-2 text-[#5C1B33] text-sm">Join Date</th>
          <th className="py-2 text-[#5C1B33] text-sm">Role</th>
          <th className="py-2 text-[#5C1B33] text-sm">Status</th>
        </tr>
      </thead>
      <tbody>
        {members.map((member, index) => (
          <tr key={index} className="text-center">
            <td className="py-2 text-[#4B4B4C]">{member.name}</td>
            <td className="py-2 text-[#4B4B4C]">
              {new Date(member.join_date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </td>
            <td className="py-2 text-[#4B4B4C]">
              {(() => {
                try {
                  const parsedRole = JSON.parse(member.role);
                  // Parse the role string
                  return Array.isArray(parsedRole)
                    ? parsedRole.join(", ")
                    : member.role;
                } catch {
                  return member.role;
                }
              })()}
            </td>
            <td
              className={`py-2  ${
                member.status !== "active"
                  ? "text-[#4B4B4C]/60 font-semibold"
                  : "text-[#40B267] font-semibold"
              }`}
            >
              {member.status}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
