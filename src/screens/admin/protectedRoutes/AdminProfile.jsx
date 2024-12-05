import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../../../components/admin/Sidebar";
import Header from "../../../components/admin/Header";
import { supabase } from "../../../database/supabase";
import { useNavigate } from "react-router-dom";
const AdminProfile = () => {
  const [adminData, setAdminData] = useState(null);
  const [joinStatus, setJoinStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false); // For save button loading

  const navigate = useNavigate();
  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // // Get the token from localStorage
      // const adminAuthToken = localStorage.getItem("adminAuthToken");
      // if (!adminAuthToken) throw new Error("Authentication token is missing.");

      // // Restore session using the token
      // const { data: session, error: sessionError } =
      //   await supabase.auth.setSession({
      //     access_token: adminAuthToken,
      //     refresh_token: localStorage.getItem("adminRefreshToken"),
      //     // Save refresh token during login
      //   });

      // if (sessionError) throw new Error(sessionError.message);

      // const { user } = session;
      // if (!user) throw new Error("No authenticated user found.");

      // Get the current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);
      if (!user) throw new Error("No authenticated user found.");

      // Access user_metadata directly
      const userMetaData = user.user_metadata || {};
      // console.log("user meta data in profile", user.user_metadata);
      const adminData = {
        first_name: userMetaData.first_name || "",
        last_name: userMetaData.last_name || "",
        email: user.email || "",
        role: userMetaData.role || "",
      };
      setAdminData(adminData);
      // Fetch join table data
      const { data: joinData, error: joinError } = await supabase
        .from("join")
        .select("*")
        .eq("id", 1)
        .single();

      if (joinError) throw new Error("Error fetching join status.");

      setJoinStatus(joinData.isOpen);
    } catch (err) {
      setError(err.message);
      console.log("admin profile error", error);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinStatusToggle = async () => {
    try {
      const updatedStatus = !joinStatus;

      const { error } = await supabase
        .from("join")
        .update({
          isOpen: updatedStatus,
          updatedBy: `${adminData.first_name} ${adminData.last_name}`,
          // Use admin name
        })
        .eq("id", 1);

      if (error) throw new Error(error.message);

      setJoinStatus(updatedStatus);
      toast.success(
        `Join status successfully updated to ${
          updatedStatus ? "Open" : "Closed"
        }`
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdminData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);

      // Update the user's metadata using supabase.auth.updateUser
      const updates = {
        data: {
          first_name: adminData.first_name,
          last_name: adminData.last_name,
          role: adminData.role,
        },
      };

      const { error: updateError } = await supabase.auth.updateUser(updates);

      if (updateError) throw new Error(updateError.message);

      const adminName = `${adminData.first_name} ${adminData.last_name}`;

      // Insert into the `updates` table
      const updateLog = {
        update_type: "Profile Update",
        updated_by: adminName,
        date_time: new Date().toISOString(),
      };

      const { error: logError } = await supabase
        .from("updates")
        .insert(updateLog);

      if (logError) throw new Error(logError.message);

      setIsEditing(false);
      toast.success("Profile updated and changes logged successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Failed to refresh session:", error);
        throw error;
      }

      // Update tokens in localStorage
      const { session } = data;
      localStorage.setItem("adminAuthToken", session.access_token);
      localStorage.setItem("adminRefreshToken", session.refresh_token);
    } catch (err) {
      console.error("Error refreshing session:", err.message);
      toast.error("Session expired. Please log in again.");
      navigate("/adminonly");
    }
  };

  useEffect(() => {
    fetchAdminData();
    refreshSession();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBEBF1]">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#FBEBF1]">
      <Sidebar />
      <div className="flex-1">
        <Header title="Profile" />
        {loading ? (
          <div className="min-h-screen flex items-center justify-center bg-[#FBEBF1]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#5C1B33]"></div>
              <p className="mt-4 text-lg font-semibold text-[#5C1B33]">
                Loading admin profile...
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Admin Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={adminData.first_name || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={adminData.last_name || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={adminData.email || ""}
                    onChange={handleInputChange}
                    disabled
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={adminData.role || ""}
                    disabled
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className={`px-4 py-2 ${
                        saving
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-500 text-white"
                      } rounded-md`}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-md"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-bold">Join Status</h3>
                <p className="mb-4">
                  Current Status:{" "}
                  <span className="font-semibold">
                    {joinStatus ? "Open" : "Closed"}
                  </span>
                </p>
                <button
                  onClick={handleJoinStatusToggle}
                  className={`px-4 py-2 ${
                    joinStatus
                      ? "bg-red-500 text-white"
                      : "bg-green-500 text-white"
                  } rounded-md`}
                >
                  {joinStatus ? "Close Join" : "Open Join"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default AdminProfile;
