import { useEffect, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "react-toastify";
import { supabase } from "../../../database/supabase";
import { useNavigate } from "react-router-dom";
import { adminCreateEventProcess } from "../../../database/bookings";

const CreateEventModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    title: "",
    eventType: "Department",
    eventTypeName: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
    genreThemeHolder: "Genre", // Dropdown to toggle between "Genre" and "Theme"
    genre: "",
    theme: "",
    description: "",
    // musician requirements
    guitarist: 0,
    vocalist: 0,
    bassist: 0,
    melodics: 0,
    percussionist: 0,
  });

  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    startTime: "",
    endTime: "",
  });
  const [adminName, setAdminName] = useState(null);

  const today = new Date().toISOString().split("T")[0];
  const navigate = useNavigate();

  // Fetch adminName from Supabase Auth when the component mounts
  useEffect(() => {
    const fetchAdminName = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw new Error(userError.message);
        if (!user) throw new Error("No authenticated user found.");

        // Extract admin name from user_metadata
        const userMetaData = user.user_metadata || {};
        const adminData = {
          first_name: userMetaData.first_name || "",
          last_name: userMetaData.last_name || "",
        };
        const fetchedAdminName = `${adminData.first_name} ${adminData.last_name}`;

        setAdminName(fetchedAdminName);
      } catch (error) {
        // console.error("Error fetching admin name:", error);
        toast.error("Session expired, redirecting to login");
        await supabase.auth.signOut();
        localStorage.removeItem("adminAuthToken");
        localStorage.removeItem("adminRefreshToken");
        navigate("/member/login");
      }
    };

    fetchAdminName();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Convert numeric inputs to numbers
    const newValue = [
      "guitarist",
      "vocalist",
      "bassist",
      "melodics",
      "percussionist",
    ].includes(name)
      ? parseInt(value, 10) || 0 // Default to 0 if empty or invalid
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if ((name === "startTime" || name === "endTime") && formData.startDate) {
      const now = new Date();
      const [hours, minutes] = value.split(":").map(Number);
      const selectedTime = new Date();
      selectedTime.setHours(hours, minutes, 0, 0);

      const updatedErrors = { ...errors };

      if (
        formData.startDate === now.toISOString().split("T")[0] &&
        selectedTime < now
      ) {
        const currentTime = now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        updatedErrors[
          name
        ] = `You selected a past time. Please select a time after ${currentTime}.`;
      } else if (
        name === "endTime" &&
        new Date(`${formData.startDate}T${formData.startTime}`) >=
          new Date(`${formData.endDate}T${value}`)
      ) {
        updatedErrors.endTime =
          "The end time must be later than the start time. Please adjust your selection.";
      } else {
        updatedErrors[name] = ""; // Clear error if valid
      }

      setErrors(updatedErrors);
    }
  };

  const validateMusicians = () => {
    const { guitarist, vocalist, bassist, melodics, percussionist } = formData;
    return (
      guitarist > 0 ||
      vocalist > 0 ||
      bassist > 0 ||
      melodics > 0 ||
      percussionist > 0
    );
  };

  const handleCaptchaVerify = () => {
    setCaptchaVerified(true);
  };

  const validateForm = () => {
    const {
      firstName,
      lastName,
      email,
      title,
      eventTypeName,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
    } = formData;

    // Current date and time

    const now = new Date();
    const currentDateString = now.toISOString().split("T")[0];
    const updatedErrors = {};
    const currentTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (
      !firstName ||
      !lastName ||
      !email ||
      !title ||
      !eventTypeName ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime ||
      !location
    ) {
      toast.error("Please fill out all required fields.");
      return false;
    }

    if (!email.endsWith("@ustp.edu.ph")) {
      toast.error("Only @ustp.edu.ph email addresses are allowed.");
      return false;
    }

    if (!validateMusicians()) {
      toast.error(
        "Please specify at least one musician (Guitarist, Vocalist, etc.)."
      );
      return false;
    }

    if (!captchaVerified) {
      toast.error("Please verify the CAPTCHA.");
      return false;
    }

    if (formData.startDate === currentDateString) {
      const [startHours, startMinutes] = formData.startTime
        .split(":")
        .map(Number);
      const startTimeDate = new Date();
      startTimeDate.setHours(startHours, startMinutes, 0, 0);

      if (startTimeDate < now) {
        updatedErrors.startTime = `You selected a past time. Please select a time after ${currentTime}.`;
      }
    }

    if (formData.endDate === currentDateString) {
      const [endHours, endMinutes] = formData.endTime.split(":").map(Number);
      const endTimeDate = new Date();
      endTimeDate.setHours(endHours, endMinutes, 0, 0);

      if (endTimeDate < now) {
        updatedErrors.endTime = `You selected a past time. Please select a time after ${currentTime}.`;
      }
    }

    if (
      new Date(`${formData.startDate}T${formData.startTime}`) >
      new Date(`${formData.endDate}T${formData.endTime}`)
    ) {
      updatedErrors.endTime =
        "The end time must be later than the start time. Please adjust your selection.";
    }

    setErrors(updatedErrors);

    return Object.keys(updatedErrors).length === 0; // Return true if no errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Ensure adminName is available
      if (!adminName) {
        toast.error("Admin name not available. Please try again.");
        setLoading(false);
        return;
      }
      const { bookingData, eventData, musicianData } =
        await adminCreateEventProcess(formData, adminName);
      console.log(adminName);
      console.log("booking data", bookingData);
      console.log("event data", eventData);
      console.log("musicians data", musicianData);

      toast.success("Event created successfully!");
      onClose(); // Close the modal
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("An error occurred while creating the event.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const canSubmit = validateMusicians();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg sm:w-11/12 md:w-3/4 lg:w-1/2 max-h-screen overflow-y-scroll">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create Event</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Organizer's First Name and Last Name */}
          <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          {/* Organizer's Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 mt-1"
              placeholder="Enter organizer's email"
              required
            />
          </div>

          {/* Event Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Event Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 mt-1"
              placeholder="Enter event title"
              required
            />
          </div>

          {/* Event Type and Department/Organization */}
          <div className="flex space-x-4 mb-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">
                Event Type
              </label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                required
              >
                <option value="Department">Department</option>
                <option value="Organization">Organization</option>
              </select>
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">
                Department/Organization Name
              </label>
              <input
                type="text"
                name="eventTypeName"
                value={formData.eventTypeName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                placeholder="Enter name"
                required
              />
            </div>
          </div>

          {/* Dates and Times */}
          <div className="flex space-x-4 mb-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                min={today}
                value={formData.startDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                required
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                min={formData.startDate || today}
                value={formData.endDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                required
              />
            </div>
          </div>
          {/* start time and end time  */}
          <div className="flex space-x-4 mb-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                required
              />
              {errors.startTime && (
                <p className="text-sm text-red-600 mt-1">{errors.startTime}</p>
              )}
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                required
              />
              {errors.endTime && (
                <p className="text-sm text-red-600 mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 mt-1"
              placeholder="Enter location"
              required
            />
          </div>

          {/* Genre/Theme */}
          <p className="text-sm text-gray-400 mb-2">
            Genre: e.g Rock, Pop Music, Classical Music. <br />
            Theme: e.g Unveil the Secrets, Throwback Friday.
          </p>
          <div className="flex space-x-4 mb-4">
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-700">
                Genre/Theme
              </label>
              <select
                name="genreThemeHolder"
                value={formData.genreThemeHolder}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 mt-1"
              >
                <option value="Genre">Genre</option>
                <option value="Theme">Theme</option>
              </select>
            </div>
            <div className="w-2/3">
              <label className="block text-sm font-medium text-gray-700">
                {formData.genreThemeHolder === "Genre" ? "Genre" : "Theme"}{" "}
                Description
              </label>
              <input
                type="text"
                name={formData.genreThemeHolder === "Genre" ? "genre" : "theme"}
                value={
                  formData.genreThemeHolder === "Genre"
                    ? formData.genre
                    : formData.theme
                }
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                placeholder={`Enter ${
                  formData.genreThemeHolder === "Genre" ? "genre" : "theme"
                } description`}
              />
            </div>
          </div>

          {/* Musician Requirements */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              "guitarist",
              "vocalist",
              "bassist",
              "melodics",
              "percussionist",
            ].map((field, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-gray-700">
                  No. of {field.charAt(0).toUpperCase() + field.slice(1)}s
                </label>
                <input
                  type="number"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  min="0"
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                />
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 mt-1"
              rows="4"
              placeholder="Event description"
            />
          </div>

          {/* CAPTCHA */}
          {canSubmit && (
            <div className="mb-6">
              <ReCAPTCHA
                // test
                // sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                // production
                sitekey="6Ld7-ZMqAAAAAF7YrZhOzjlo4htz7PbAuT7MiJgo"
                onChange={handleCaptchaVerify}
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              className={`w-full py-2 rounded-lg ${
                canSubmit && captchaVerified
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
              disabled={!canSubmit || !captchaVerified || loading}
            >
              {loading ? "Creating Event..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
