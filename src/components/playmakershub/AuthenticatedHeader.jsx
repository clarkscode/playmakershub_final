import { useNavigate } from "react-router-dom";
import { playmakersLogo } from "../../assets"; // Adjust the path as needed
import { supabase } from "../../database/supabase";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";

const AuthenticatedHeader = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(3);
  const [updatedProfile, setUpdatedProfile] = useState({});
  const [color, setColor] = useState("Orange");
  const getCurrentUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Error fetching current user:", error.message);
    } else {
      setUser(user);
      fetchMemberDetails(user?.id);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to the first page
  };

  const fetchMemberDetails = async (authId) => {
    try {
      const { data, error } = await supabase
        .from("members_orgs")
        .select("*")
        .eq("authid", authId)
        .single();

      if (error) {
        console.error("Error fetching member details:", error.message);
      } else {
        const participationStatus = await fetchParticipationStatus(authId);
        if (participationStatus) {
          setColor(participationStatus);
        }
        setMemberDetails({ ...data });
        fetchParticipatedEvents(authId);
        setMemberDetails(data);
        setUpdatedProfile(data);
      }
    } catch (err) {
      console.error("Error fetching member details:", err.message);
    }
  };

  const fetchParticipatedEvents = async (authId) => {
    try {
      const { data, error } = await supabase
        .from("participation")
        .select(
          `
          event_id, 
          status, 
          events (
            event_id,
            event_title,
            start_date,
            end_date,
            description
          )
        `
        )
        .eq("user_id", authId);
      console.log(data);
      if (error) {
        console.error("Error fetching events:", error.message);
      } else {
        setEvents(data);
      }
    } catch (err) {
      console.error("Error fetching events:", err.message);
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("authToken");
    navigate("/member/login");
  };

  const togglePopover = () => {
    setIsPopoverVisible(!isPopoverVisible);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from("profiles")
          .upload(fileName, file);

        if (error) {
          console.error("Error uploading profile image:", error.message);
        } else {
          const publicURL = supabase.storage
            .from("profiles")
            .getPublicUrl(data.path).data.publicUrl;
          setUpdatedProfile((prev) => ({ ...prev, profile_image: publicURL }));
        }
      } catch (err) {
        console.error("Error uploading profile image:", err.message);
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!updatedProfile || !user?.id) {
        console.error("Profile data or user ID is missing");
        return;
      }

      const { error } = await supabase
        .from("members_orgs")
        .update({
          name: updatedProfile?.name || "",
          bio: updatedProfile?.bio || "",
          profile_image: updatedProfile?.profile_image || "",
          mobile: updatedProfile?.mobile || "",
        })
        .eq("authid", user?.id);

      if (error) {
        console.error("Error updating profile:", error.message);
        return;
      }
      getCurrentUser();
      setIsModalOpen(false); // Close modal
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Error saving profile:", err.message);
    }
  };

  const fetchParticipationStatus = async (authId) => {
    try {
      const { data: participations, error } = await supabase
        .from("participation")
        .select("*")
        .eq("user_id", authId);

      if (error) {
        console.error("Error fetching participation data:", error.message);
        return "Inactive";
      }

      const participationsPerMonth = participations.filter((p) =>
        dayjs(p.event_start_date).isSame(dayjs(), "month")
      ).length;

      const backouts = participations.filter(
        (p) => p.status === "Backout"
      ).length;
      const nonParticipations = participations.filter(
        (p) => p.status === "Non-Participation"
      ).length;
      console.log(participationsPerMonth);
      if (participationsPerMonth >= 2) return "Green";
      if (nonParticipations >= 3 || backouts >= 1) return "Orange";
      if (nonParticipations >= 5 || backouts >= 2) return "Red";

      return "Inactive";
    } catch (err) {
      console.error("Error calculating participation status:", err.message);
      return "Inactive";
    }
  };

  return (
    <header className="flex items-center justify-between p-4 shadow-md py-1">
      <img
        src={playmakersLogo}
        alt="Playmakers Logo"
        className="w-16 h-14 object-contain"
      />

      <nav className="flex justify-center space-x-20 w-full">
        <button
          onClick={() => navigate("/events")}
          className="text-[#FFFFFF] text-2xl font-medium hover:text-[#a83c70]"
        >
          Events
        </button>
        <button
          onClick={() => navigate("/playmakershub")}
          className="text-[#FFFFFF] text-4xl font-medium hover:text-[#a83c70]"
        >
          Playmakers Hub
        </button>
        <button
          onClick={() => navigate("")}
          className="text-[#FFFFFF] text-2xl font-medium hover:text-[#a83c70]"
        >
          Home
        </button>
      </nav>

      <div className="relative">
        {/* User Profile Image */}
        <div className="flex gap-1 items-center w-40">
          <img
            src={
              memberDetails?.profile_image || "https://via.placeholder.com/40"
            }
            alt="User Profile"
            className="w-12 h-12 rounded-full object-cover cursor-pointer"
            onClick={togglePopover}
          />
          <div className="flex flex-col items-start w-full">
            <p className="font-bold text-white whitespace-nowrap truncate">
              {memberDetails?.name || "User"}
            </p>
            <p className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  color === "Green"
                    ? "bg-green-500"
                    : color === "Orange"
                    ? "bg-orange-500"
                    : "bg-red-500"
                }`}
              ></span>
              <span className="text-sm font-medium text-gray-300">
                {memberDetails?.status || "Inactive"}
              </span>
            </p>
          </div>
        </div>

        {/* Popover Menu */}
        {isPopoverVisible && (
          <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md w-48 z-10">
            <button
              onClick={() => {
                setIsModalOpen(true); // Open modal
                setIsPopoverVisible(false); // Close popover
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-20 bg-black bg-opacity-50">
          <div className="bg-white w-1/3 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Edit Profile</h3>
            <form>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={updatedProfile.name || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={updatedProfile.bio || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
                {updatedProfile.profile_image && (
                  <img
                    src={updatedProfile.profile_image}
                    alt="Profile Preview"
                    className="w-16 h-16 rounded-full mt-2"
                  />
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Mobile
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={updatedProfile.mobile || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Events Participated</h4>
                {events.length > 0 ? (
                  <>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Event Name</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>End Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {events
                          .slice(
                            page * rowsPerPage,
                            page * rowsPerPage + rowsPerPage
                          )
                          .map((event) => {
                            console.log(event);
                            return (
                              <TableRow key={event.event_id}>
                                <TableCell>
                                  {event.events?.event_title || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    event.events?.start_date
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    event.events?.end_date
                                  ).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                    <TablePagination
                      component="div"
                      count={events.length}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 15]}
                    />
                  </>
                ) : (
                  <Typography>No events participated yet.</Typography>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-500 text-white rounded-md"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  onClick={handleSaveProfile}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default AuthenticatedHeader;
