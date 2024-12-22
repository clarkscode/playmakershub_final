import { useState, useEffect } from "react";
import MemberCard from "../../../components/admin/MemberCard";
import Modal from "../../../components/admin/Reusable/Modal";
import MemberForm from "../../../components/admin/Reusable/MemberForm";
import MemberDetailsModal from "../../../components/admin/MemberDetailsModal";
import Sidebar from "../../../components/admin/Sidebar";
import Header from "../../../components/admin/Header";
import { supabase } from "../../../database/supabase";
import { toast } from "react-toastify";
import sendEmail from "../../../database/sendEmail";
import { Chip } from "@mui/material";
import { NewReleases as NewBadgeIcon } from "@mui/icons-material";
import { FaQuestion } from "react-icons/fa";
import { supabaseAdmin } from "../../../database/supabaseAdmin";
import {
  deleteMember,
  fetchMembers,
  updateMember,
} from "../../../database/members";

const MemberOrganization = () => {
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newMember, setNewMember] = useState({
    email: "",
    password: "",
    role: [],
    genre: [],
    mobile: "",
    events: 0,
    join_date: "",
    status: "inactive",
    profile_image: "",
    name: "",
  });
  const [roles, setRoles] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  // const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // Filter by status
  const [roleFilter, setRoleFilter] = useState("all"); // New state for role filtering
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null); // Define profilePicture state

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sort the members by join_date or other criteria
  const sortMembersByDate = (membersList) => {
    return [...membersList].sort(
      (a, b) => new Date(b.join_date) - new Date(a.join_date)
    ); // Newest members first
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      // Start loading

      const data = await fetchMembers();
      const parsedMembers = data?.map((v) => ({
        ...v,
        genre: JSON.parse(v.genre || []),
        role: JSON.parse(v.role || []),
      }));
      if (parsedMembers) {
        const sortedMembers = sortMembersByDate(parsedMembers);
        setMembers(sortedMembers);
        // Save sorted members
      }
    } catch (error) {
      console.error("Error loading members:", error.message);
    } finally {
      setLoading(false);
      // End loading
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredMembers = members.filter((member) => {
    const matchesStatus =
      statusFilter === "all" || member.status === statusFilter;
    const matchesSearch = searchQuery
      ? member.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesRole =
      roleFilter === "all" || member.role.includes(roleFilter);

    return matchesStatus && matchesSearch && matchesRole;
  });

  // Calculate paginated members
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const toggleTooltip = () => {
    setIsTooltipOpen((prevState) => !prevState);
  };

  // Check if a member is "New"
  const isNewMember = (joinDate) => {
    const now = new Date();
    const joinedAt = new Date(joinDate);
    const diffInHours = (now - joinedAt) / (1000 * 60 * 60);
    return diffInHours <= 24; // Returns true if within 24 hours
  };

  const handleCreateAccount = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedMember(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value); // Update the search query state
    setCurrentPage(1); // Reset to page 1 when search query changes
  };

  // Utility function to generate a strong random password
  const generatePassword = (length = 12) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Auto-generate password
      const userPass = generatePassword();
      // Step 1: Create the member's authentication record
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newMember.email,
        password: userPass,
      });

      if (authError) {
        console.error("Authentication error:", authError.message);
        // toast.error("Failed to create user in authentication.");
        toast.error("Failed to create member");
        return;
      }

      // Step 2: Upload the profile picture to Supabase Storage
      let profileImageUrl = "";
      if (profilePicture) {
        const fileName = `${Date.now()}_${profilePicture.name}`;
        const { data: fileData, error: fileError } = await supabase.storage
          .from("profiles")
          .upload(fileName, profilePicture);

        if (fileError) {
          console.error("Error uploading profile picture:", fileError.message);
          toast.error("Failed to upload profile picture.");
          return;
        }

        profileImageUrl = `https://jpeheolrqpywermjdcyg.supabase.co/storage/v1/object/public/profiles/${fileData.path}`;
      }

      // Step 3: Insert the member data into the `members_orgs` table
      const { password, ...memberData } = {
        ...newMember,
        profile_image: profileImageUrl,
        role: roles,
        genre: genres,
        join_date: new Date().toISOString().split("T")[0],
        events: 0,
        authid: authData.user.id,
      };

      // console.log("member password", password);
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

      // Send the email with credentials
      const subject = "Your Member Account Credentials";
      const content = `
      <p>Dear ${newMember.name},</p>
      <p>Your member account has been successfully created. Below are your login credentials:</p>
      <p><strong>Email:</strong> ${newMember.email}</p>
      <p><strong>Password:</strong> ${userPass}</p>
      <p>We recommend that you log in and change your password as soon as possible.</p>
      <p>Best regards,<br/>The Playmakers Team</p>
      <a href="https://www.playmakershub.org" target="_blank">www.playmakershub.org</a></p>

    `;

      await sendEmail(newMember.email, subject, content);

      toast.success("Member created and email sent successfully!");

      // Add new member to the list and sort it
      setMembers((prevMembers) =>
        sortMembersByDate([{ ...memberData }, ...prevMembers])
      );

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
    // console.log(member);
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
      const existingMember = members.find((member) => member.id === id);

      if (updatedData.status && updatedData.status !== existingMember.status) {
        const member = members.find((member) => member.id === id);
        const recipientEmail = member.email;
        const subject = "Account Status Update";
        const content = `Hello ${member.name},<br/><br/>
        This is to inform you that your account status has been updated to <b>${updatedData.status}</b>.
        <br/><br/>If you have any questions, please contact playmakers admin.<br/><br/>
        <p>Best regards,<br/>The Playmakers Family</p>
        <a href="https://www.playmakershub.org" target="_blank">www.playmakershub.org</a></p>
        `;

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
      const { authid, id, profile_image } = info;
      // Ensure profile_image is passed in info
      setLoading(true);
      console.log("profile image of member", profile_image);
      // Step 1: Delete the profile picture from Supabase storage
      if (profile_image) {
        const fileName = profile_image.split("/").pop(); // Extract the file name from the URL
        console.log("Extracted file name:", fileName);

        const { error: deleteImageError } = await supabase.storage
          .from("profiles")
          .remove([fileName]);

        if (deleteImageError) {
          console.error(
            "Error deleting profile picture:",
            deleteImageError.message
          );
          toast.error("Failed to delete profile picture.");
        } else {
          console.log("Profile picture deleted successfully:", fileName);
          toast.success("Profile picture deleted successfully.");
        }
      }
      // Step 2: Delete the member from the database
      await deleteMember(id);
      setMembers(members.filter((member) => member.id !== id));

      // Step 3: Delete the authentication user
      const { error } = await supabaseAdmin.auth.admin.deleteUser(authid);

      if (error) {
        console.error(
          "Error deleting user from authentication:",
          error.message
        );
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
                  statusFilter === status
                    ? "bg-gray-700 text-white"
                    : "bg-gray-200"
                } rounded-lg`}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} Members
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <div className="ml-3 relative">
              <FaQuestion
                className="text-[#5C1B33] cursor-pointer"
                size={20}
                onClick={toggleTooltip}
              />
              {isTooltipOpen && (
                <div
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 p-4 bg-white shadow-lg rounded-lg text-gray-700 text-sm z-50"
                  style={{ maxWidth: "90vw" }}
                >
                  <p className="mb-2 font-semibold">
                    Member Status Change Rules:
                  </p>
                  <ul className="list-disc pl-4">
                    <li>
                      <span className="font-bold">Case 1:</span> 1 backout =
                      <span className="text-orange-600 font-semibold">
                        {" "}
                        Inactive
                      </span>
                      .
                    </li>
                    <li>
                      <span className="font-bold">Case 2:</span> Total
                      participation: 1 + 1 backout =
                      <span className="text-orange-600 font-semibold">
                        {" "}
                        Inactive
                      </span>
                      .
                    </li>
                    <li>
                      <span className="font-bold">Case 3:</span> Participation ≥
                      2 in a month + 1 backout =
                      <span className="text-green-600 font-semibold">
                        {" "}
                        Active
                      </span>
                      .
                    </li>
                    <li>
                      <span className="font-bold">Case 4:</span> Any
                      participation + 2 backouts in a month =
                      <span className="text-red-600 font-semibold">
                        {" "}
                        Probationary
                      </span>
                      .
                      <span className="italic">
                        (Admin will review the reason for multiple backouts.)
                      </span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <button
              className="bg-[#5C1B33] text-white px-6 py-2 rounded-lg"
              onClick={handleCreateAccount}
            >
              Create Member
            </button>
          </div>
        </div>

        {/* Role Filter Buttons */}
        <div className="px-8 py-4 flex space-x-4">
          {[
            "all",
            "guitarist",
            "vocalist",
            "bassist",
            "melodics",
            "percussionist",
          ].map((role) => (
            <button
              key={role}
              className={`px-4 py-2 ${
                roleFilter === role ? "bg-blue-500 text-white" : "bg-gray-200"
              } rounded-lg`}
              onClick={() => handleRoleFilter(role)}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="px-8 py-4">
          <input
            type="text"
            placeholder="Search Members by Name"
            className="w-full p-2 border border-gray-300 rounded-lg"
            value={searchQuery}
            onChange={handleSearchChange}
          />
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
                  className="relative cursor-pointer flex"
                  onClick={() => handleViewDetails(member)}
                >
                  {/* Dynamic "New" Badge */}
                  {isNewMember(member.join_date) && (
                    <Chip
                      icon={<NewBadgeIcon />}
                      label="New"
                      size="small"
                      color="white"
                      className="absolute top-2 left-2 z-10"
                      sx={{
                        backgroundColor: "#5C1B33",
                        color: "#FFFFFF",
                        zIndex: 10,
                      }}
                    />
                  )}
                  <MemberCard {...member} />
                </div>
              );
            })}
          </div>
          // End of the change sa height balancing.
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
          setProfilePicture={setProfilePicture}
          profilePicture={profilePicture}
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
      {/* {console.log("selected member ", selectedMember)} */}
    </div>
  );
};

export default MemberOrganization;
