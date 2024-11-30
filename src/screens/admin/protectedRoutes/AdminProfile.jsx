import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../../../components/admin/Sidebar";
import Header from "../../../components/admin/Header";
import { supabase } from "../../../database/supabase";

const AdminProfile = () => {
  const [adminData, setAdminData] = useState(null);
  const [joinStatus, setJoinStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false); // For save button loading

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw new Error(authError.message);

      if (!user) throw new Error("No authenticated user found.");

      // Fetch admin profile
      const { data, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userError) throw new Error(userError.message);

      setAdminData(data);

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
          updatedBy: `${adminData.first_name} ${adminData.last_name}`, // Use admin name
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

      const { error: updateError } = await supabase
        .from("users")
        .update(adminData)
        .eq("id", adminData.id);

      if (updateError) throw new Error(updateError.message);
      const adminName = localStorage.getItem("adminName") || "Admin";

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

  useEffect(() => {
    fetchAdminData();
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
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    name="mobile_number"
                    value={adminData.mobile_number || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
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
