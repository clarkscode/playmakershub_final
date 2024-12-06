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
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  // ListSubheader,
} from "@mui/material";
import { FaBell } from "react-icons/fa";
import CloseIcon from "@mui/icons-material/Close";
import CodeIcon from "@mui/icons-material/Code";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const getCurrentUser = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error fetching current user:", userError.message);
      // clear auth token of member if session is expired - jieclarkdev
      await supabase.auth.signOut();
      localStorage.removeItem("authToken");
      navigate("/member/login");
    }

    const userMetadata = user?.user_metadata || {};
    const isAdmin = userMetadata.is_admin || false;
    const isSuperAdmin = userMetadata.is_super_admin || false;
    const role = userMetadata.role || "";

    // Admins and Super Admins
    if (isAdmin || isSuperAdmin) {
      // console.log("fuckkkkk", isAdmin);
      // console.log("fuckkkkk super", isSuperAdmin);
      setMemberDetails({
        first_name: userMetadata.first_name || "",
        last_name: userMetadata.last_name || "",
        role: role || "",
        is_super_admin: isSuperAdmin,
        is_admin: isAdmin,
      });
      setUpdatedProfile({
        first_name: userMetadata.first_name || "",
        last_name: userMetadata.last_name || "",
      });
      return; // No need to fetch `members_orgs` for admins or super admins
    }

    // Now fetch the corresponding member details from members_orgs using user.id (authId)
    const { data: memberData, error: memberError } = await supabase
      .from("members_orgs")
      .select("id") // Only select the id column
      .eq("authid", user.id)
      .single(); // We expect a single result

    if (memberError) {
      // diri ang error
      console.log("is admin", isAdmin);
      console.log("is super admin", isSuperAdmin);
      console.error("Error fetching member details:", memberError.message);
      return;
    }

    setUser(user);
    fetchMemberDetails(user?.id);
    fetchNotifications(memberData?.id);
    // console.log("authenticated user id", user.id);
    // console.log("member id in members_orgs table", memberData.id);
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

      if (error || !data) {
        // console.error("Error fetching member details:", error.message);
        // toast.error("Member details not found. Please contact support.");
        console.error("Member details not found. Please contact support.");
        setMemberDetails(null);
        return;
      } else {
        const participationStatus = await fetchParticipationStatus(
          authId,
          data.id
        );

        if (participationStatus) {
          console.log("member participation status", participationStatus);
          setColor(participationStatus);
        }
        fetchParticipatedEvents(authId);
        setMemberDetails(data);
        setUpdatedProfile(data);
      }
    } catch (err) {
      console.error("fetchMemberDetails ERROR:", err);
    }
  };

  // Fetch notifications for the logged-in user
  const fetchNotifications = async (authId) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", authId)
        .order("sent_at", { ascending: false }); // Order by most recent

      if (error) {
        console.error("Error fetching notifications:", error.message);
      } else {
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err.message);
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
      // Use members_orgs.id
      // console.log(data);
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
    navigate("/");
  };

  const togglePopover = () => {
    setIsPopoverVisible(!isPopoverVisible);
  };

  const toggleDrawer = (isOpen) => {
    setIsDrawerOpen(isOpen);
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
      if (memberDetails?.is_admin || memberDetails?.is_super_admin) {
        // For admins/super admins, ensure `first_name` and `last_name` are present.
        if (!updatedProfile.first_name || !updatedProfile.last_name) {
          console.error("Admin profile data is missing required fields.");
          console.log("Updated Profile:", updatedProfile);
          return;
        }
      } else {
        // For regular members, ensure `user.id` exists and `updatedProfile` has relevant fields.
        if (!user?.id) {
          console.error("User ID is missing for regular member.");
          console.log("Updated Profile:", updatedProfile);
          return;
        }
      }

      // Update `user_metadata` for admins
      if (memberDetails?.is_admin || memberDetails?.is_super_admin) {
        console.log("Updating admin profile...");
        const { error: adminError } = await supabase.auth.updateUser({
          data: {
            first_name: updatedProfile.first_name,
            last_name: updatedProfile.last_name,
          },
        });

        if (adminError) {
          console.error("Error updating admin profile:", adminError.message);
          toast.error("Failed to update admin profile.");
          return;
        }
        toast.success("Admin profile updated successfully!");
        setIsModalOpen(false); // Close modal
        getCurrentUser(); // Refresh user data
        return;
      }

      // Update `members_orgs` for regular members
      console.log("Updating member profile...");
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
        console.error("Error updating member profile:", error.message);
        return;
      }

      toast.success("Member profile updated successfully!");
      getCurrentUser(); // Refresh user data
      setIsModalOpen(false); // Close modal
    } catch (err) {
      console.error("Error saving profile:", err.message);
      toast.error("An unexpected error occurred while saving the profile.");
    }
  };

  const fetchParticipationStatus = async (authId, membersId) => {
    try {
      const { data: participations, error } = await supabase
        .from("participation")
        .select("*")
        .eq("user_id", authId);

      if (error) {
        console.error("Error fetching participation data:", error.message);
        return "Inactive";
      }

      const { data: backouts, error: backoutError } = await supabase
        .from("backouts")
        .select("*")
        .eq("user_id", membersId);

      if (backoutError) {
        console.error("Error fetching backout data:", backoutError.message);
        return "Inactive";
      }
      console.log("fetchParticipationStatus", participations);

      const participationsPerMonth = participations.filter((p) =>
        dayjs(p.event_start_date).isSame(dayjs(), "month")
      ).length;

      const backoutCount = backouts.length;

      console.log("participationsPerMonth", participationsPerMonth);
      console.log("backouts", backoutCount);

      if (participationsPerMonth >= 2) return "Green";
      if (backoutCount === 1) return "Orange";
      if (backoutCount >= 2) return "Red";

      return "Inactive";
    } catch (err) {
      console.error("Error calculating participation status:", err.message);
      return "Inactive";
    }
  };

  return (
    <header className="flex items-center justify-between p-4 shadow-md py-1 relative">
      <img
        src={playmakersLogo}
        alt="Playmakers Logo"
        className="w-18 h-16 object-contain pl-5 relative"
      />

      <nav className="flex justify-center space-x-20 w-full pl-20 relative">
        <button
          onClick={() => navigate("/events")}
          className="text-[#FFFFFF] text-2xl font-medium hover:text-[#a83c70]"
        >
          Events
        </button>
        <button
          onClick={() => navigate("/playmakershub")}
          className="text-[#FFFFFF] text-4xl font-medium"
        >
          Playmakers Hub
        </button>
        <button
          onClick={() => navigate("/playmakershub")}
          className="text-[#FFFFFF] text-2xl font-medium hover:text-[#a83c70]"
        >
          Home
        </button>
      </nav>

      <div className="relative flex items-center gap-4">
        {/* Notifications Icon */}
        {user && (
          <button
            onClick={() => toggleDrawer(true)}
            className="text-[#FFFFFF] text-2xl font-medium"
          >
            <FaBell />
          </button>
        )}

        {/* Notifications Drawer */}
        <Drawer
          anchor="right"
          open={isDrawerOpen}
          onClose={() => toggleDrawer(false)}
        >
          <div className="w-80 flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 shadow-md">
              <Typography variant="h6">Notifications</Typography>
              <IconButton onClick={() => toggleDrawer(false)}>
                <CloseIcon />
              </IconButton>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {notifications.length > 0 ? (
                <List>
                  {notifications.map((notification, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={notification.content}
                        secondary={new Date(
                          notification.sent_at
                        ).toLocaleString()}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography className="text-gray-500">
                  No new notifications.
                </Typography>
              )}
            </div>
          </div>
        </Drawer>

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
            {/* User Name */}
            {memberDetails?.is_admin || memberDetails?.is_super_admin ? (
              <p
                className="font-bold text-white truncate max-w-[7rem] break-words"
                title={
                  memberDetails?.first_name
                    ? `${memberDetails.first_name} ${memberDetails.last_name}`
                    : "Loading..."
                }
              >
                {memberDetails?.first_name
                  ? `${memberDetails.first_name} ${memberDetails.last_name}`
                  : "Loading..."}
              </p>
            ) : (
              <p
                className="font-bold text-white truncate max-w-[7rem] break-words"
                title={memberDetails?.name || "User"}
              >
                {memberDetails?.name || "Loading..."}
              </p>
            )}
            {/* Display Role for Admin or Status for Members */}
            {memberDetails?.is_admin || memberDetails?.is_super_admin ? (
              <p className="text-sm font-medium text-gray-300">
                {memberDetails.role}
              </p>
            ) : (
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
                  {memberDetails?.status || "loading..."}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Popover Menu */}
        {isPopoverVisible && (
          <div className="absolute right-0 top-10 mt-2 bg-white shadow-lg rounded-md w-48 z-10">
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
          <div className="bg-white w-1/2 rounded-lg shadow-lg p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Profile</h3>
            {memberDetails?.is_super_admin ? (
              <div className=" p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {/* Use the CodeIcon from MUI */}
                    <CodeIcon className="h-6 w-6 text-black/80" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-black/80">
                      {memberDetails.first_name} {memberDetails.last_name} is
                      one of the developers of PlaymakersHub.
                    </p>
                  </div>
                </div>
              </div>
            ) : memberDetails?.is_admin ? (
              <div className="bg-[#46152C]  p-2  mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <WorkspacePremiumIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-white">
                      {memberDetails.first_name} {memberDetails.last_name} is
                      the President of Playmakers.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <form>
              {/* Admin Fields */}
              {memberDetails?.is_admin || memberDetails?.is_super_admin ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={updatedProfile.first_name || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={updatedProfile.last_name || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Member Fields */}
                  <div className="mb-4">
                    {/* Member Role ( Removes quotes and brackets ) */}
                    <div className="bg-[#5C1B33] px-2 py-2 mb-5">
                      <p className="text-sm font-medium text-white/90">
                        Roles:{" "}
                        {memberDetails.role
                          .split(",")
                          .map((r) => r.trim().replace(/['"[\]]/g, ""))
                          .join(" and ")}
                      </p>
                    </div>
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
                </>
              )}
              {memberDetails?.is_admin || memberDetails.is_super_admin ? (
                <div className="mt-6 mb-5">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md shadow-md">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-6 w-6 text-blue-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 16h-1v-4h-1m1-4h.01M12 19c-4.418 0-8-1.79-8-4V7a4 4 0 014-4h8a4 4 0 014 4v8c0 2.21-3.582 4-8 4z"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-blue-800">
                          Admin Notes
                        </h3>
                        <p className="mt-2 text-sm text-blue-700">
                          As a playmakers admin or developer, you cannot:
                        </p>
                        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                          <li>Participate in events.</li>
                          <li>Have a status badge like members.</li>
                        </ul>
                        {/* <p className="mt-2 text-sm text-blue-700">
                          These restrictions ensure that admin roles remain
                          focused on managing the platform effectively.
                        </p> */}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
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
              )}
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
