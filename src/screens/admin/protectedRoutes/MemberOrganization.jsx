import { useState, useEffect } from "react";
import MemberCard from "../../../components/admin/MemberCard";
import Modal from "../../../components/admin/Reusable/Modal";
import MemberForm from "../../../components/admin/Reusable/MemberForm";
import MemberDetailsModal from "../../../components/admin/MemberDetailsModal";
import Sidebar from "../../../components/admin/Sidebar";
import Header from "../../../components/admin/Header"; // Adjust the path as needed
import {
  deleteMember,
  fetchMembers,
  supabase,
  supabaseAdmin,
  updateMember,
} from "../../../database/supabase";
import { toast } from "react-toastify";
import sendEmail from "../../../database/sendEmail";

const MemberOrganization = () => {
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false); // New loading state
  const [newMember, setNewMember] = useState({
    email: "",
    password: "",
    role: [],
    genre: [],
    mobile: "",
    events: 0,
    join_date: "",
    status: "active",
    profile_image: "",
    name: "",
  });
  const [roles, setRoles] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filter, setFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadMembers = async () => {
    try {
      setLoading(true); // Start loading
      const data = await fetchMembers();
      const list = data?.map((v) => ({
        ...v,
        genre: JSON.parse(v.genre || []),
        role: JSON.parse(v.role || []),
      }));
      if (list) {
        setMembers(list);
      }
    } catch (error) {
      console.error("Error loading members:", error.message);
    } finally {
      setLoading(false); // End loading
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredMembers = members.filter((member) => {
    if (filter === "all") return true;
    return member.status === filter;
  });

  // Calculate paginated members
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateAccount = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedMember(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newMember.email,
        password: newMember.password,
      });

      if (authError) {
        console.error("Authentication error:", authError.message);
        toast.error("Failed to create user in authentication.");
        return;
      }

      const { password, ...memberData } = {
        ...newMember,
        role: roles,
        genre: genres,
        join_date: new Date().toISOString().split("T")[0],
        events: 0,
        authid: authData.user.id,
      };
      console.log(password);
      const { error: memberError } = await supabase
        .from("members_orgs")
        .insert(memberData);

      if (memberError) {
        console.error(
          "Error inserting into members_orgs:",
          memberError.message
        );
        toast.error("Failed to save member data.");
        return;
      }

      toast.success("Member created successfully!");
      loadMembers();
      setIsModalOpen(false);
      setNewMember({
        email: "",
        password: "",
        role: [],
        genre: [],
        mobile: "",
        status: "active",
        profile_image: "",
        name: "",
      });
      setRoles([]);
      setGenres([]);
    } catch (error) {
      console.error("Error in handleSubmit:", error.message);
      toast.error("An error occurred while creating the member.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (member) => {
    console.log(member);
    setSelectedMember(member);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateMember = async (id, updatedData) => {
    try {
      setLoading(true); // Show loading indicator
      console.log("Updating Member:", id, updatedData);

      // Update the database
      await updateMember(id, updatedData);
      // if (!updatedMember) {
      //   toast.error("Failed to update member in database.");
      //   return;
      // }

      // Update local state
      setMembers((prevMembers) =>
        prevMembers.map((member) =>
          member.id === id ? { ...member, ...updatedData } : member
        )
      );

      toast.success("Member updated successfully!");
      if (updatedData.status && updatedData.status !== "active") {
        console.log("here1");
        const member = members.find((member) => member.id === id);
        const recipientEmail = member.email;
        const subject = "Account Status Update";
        const content = `Hello ${member.name},<br/><br/>
        This is to inform you that your account status has been updated to <b>${updatedData.status}</b>.
        <br/><br/>If you have any questions, please contact playmakers admin.<br/><br/>
        <p>Best regards,<br/>The Playmakers Family</p>`;

        const emailResponse = await sendEmail(recipientEmail, subject, content);
        console.log(emailResponse);
        if (emailResponse.error) {
          toast.error("Failed to send email notification.");
        } else {
          toast.success("Email notification sent successfully.");
        }
      }

      setIsDetailsModalOpen(false);
    } catch (error) {
      console.error("Error updating member:", error.message);
      toast.error("An error occurred while updating the member.");
    } finally {
      setLoading(false); // End loading
    }
  };

  const handleDeleteMember = async (info) => {
    try {
      const { authid, id } = info;
      setLoading(true);
      await deleteMember(id);
      setMembers(members.filter((member) => member.id !== id));

      const { error } = await supabaseAdmin.auth.admin.deleteUser(authid);

      if (error) {
        console.error(
          "Error deleting user from authentication:",
          error.message
        );
        // Handle error if needed
      }

      setIsDetailsModalOpen(false);
    } catch (error) {
      console.error("Error deleting member:", error.message);
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FBEBF1] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Member Organization" />

        <div className="px-8 py-4 flex items-center justify-between ">
          {/* Filter Buttons */}
          <div className="flex space-x-4">
            {["all", "active", "inactive", "probationary"].map((status) => (
              <button
                key={status}
                className={`px-4 py-2 ${
                  filter === status ? "bg-gray-700 text-white" : "bg-gray-200"
                } rounded-lg`}
                onClick={() => {
                  setFilter(status);
                  setCurrentPage(1);
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} Members
              </button>
            ))}
          </div>
          <button
            className="bg-[#5C1B33] text-white px-6 py-2 rounded-lg"
            onClick={handleCreateAccount}
          >
            Create Member
          </button>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#5C1B33]"></div>
            <p className="ml-4 text-lg font-medium text-[#5C1B33]">
              Loading, please wait...
            </p>
          </div>
        ) : (
          <div
            className="px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto"
            style={{ maxHeight: "80vh" }}
          >
            {paginatedMembers.map((member, idx) => {
              {
                /* console.log("Current Members", member); */
              }
              return (
                <div
                  key={idx}
                  className="cursor-pointer"
                  onClick={() => handleViewDetails(member)}
                >
                  <MemberCard {...member} />
                </div>
              );
            })}
          </div>
        )}
        {/* Pagination Controls */}
        <div className="flex justify-between items-center px-4 py-2">
          <button
            className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <p className="text-sm">
            Page {currentPage} of {totalPages}
          </p>
          <button
            className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal for Adding Member */}
      <Modal isOpen={isModalOpen} title="Add Member" onClose={closeModal}>
        <MemberForm
          newMember={newMember}
          setNewMember={setNewMember}
          roles={roles}
          setRoles={setRoles}
          loading={loading}
          genres={genres}
          setGenres={setGenres}
          handleSubmit={handleSubmit}
        />
      </Modal>

      {/* Modal for Viewing Member Details */}
      {selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          isOpen={isDetailsModalOpen}
          onClose={closeModal}
          onUpdate={(updatedData) =>
            handleUpdateMember(selectedMember.id, updatedData)
          }
          onDelete={() => handleDeleteMember(selectedMember)}
        />
      )}
    </div>
  );
};

export default MemberOrganization;
