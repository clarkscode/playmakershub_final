import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "react-toastify";

const CreateEventModal = ({ isOpen, onClose, adminName }) => {
  const [formData, setFormData] = useState({
    firstName: "Jie clark",
    lastName: "Terec",
    email: "jieclarkm@ustp.edu.ph",
    title: "Admin Event",
    eventType: "Department",
    eventTypeName: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "USTP Gymnasium",
    genreThemeHolder: "Genre", // Dropdown to toggle between "Genre" and "Theme"
    genre: "",
    theme: "",
    description: "Admin event description",
    // musician requirements
    guitarist: 0,
    vocalist: 0,
    bassist: 0,
    keyboardist: 0,
    percussionist: 0,
  });

  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Convert numeric inputs to numbers
    const newValue = [
      "guitarist",
      "vocalist",
      "bassist",
      "keyboardist",
      "percussionist",
    ].includes(name)
      ? parseInt(value, 10) || 0 // Default to 0 if empty or invalid
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
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

    if (!captchaVerified) {
      toast.error("Please verify the CAPTCHA.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // await adminCreateEventProcess(formData, adminName);
      console.log(formData);
      toast.success("Event created successfully!");
      onClose(); // Close modal after successful submission
    } catch (error) {
      toast.error("An error occurred while creating the event.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
                value={formData.endDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                required
              />
            </div>
          </div>
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
              "keyboardist",
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
          <div className="mb-6">
            <ReCAPTCHA
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
              onChange={handleCaptchaVerify}
            />
          </div>

          <div>
            <button
              type="submit"
              className={`w-full py-2 rounded-lg ${
                captchaVerified
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
              disabled={!captchaVerified || loading}
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
