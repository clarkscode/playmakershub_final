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
    eventType: "Department", // Dropdown to toggle between "Department" and "Organization"
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

  const [errors, setErrors] = useState({});
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [adminName, setAdminName] = useState(null);
  const [availableMusicians, setAvailableMusicians] = useState([]);
  const [isFormValid, setIsFormValid] = useState(false);

  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  // Fetch adminName from Supabase Auth when the component mounts
  useEffect(() => {
    const fetchAdminName = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          navigate("/member/login");
          return;
        }

        // Extract admin name from user_metadata
        const userMetaData = user.user_metadata || {};
        const isAdmin = userMetaData.is_admin || false;
        const isSuperAdmin = userMetaData.is_super_admin || false;

        if (!isAdmin && !isSuperAdmin) {
          navigate("/member/login");
          return;
        }

        const adminData = {
          first_name: userMetaData.first_name || "",
          last_name: userMetaData.last_name || "",
        };
        const fetchedAdminName = `${adminData.first_name} ${adminData.last_name}`;

        setAdminName(fetchedAdminName);
      } catch (error) {
        console.error("Error fetching admin name:", error);
        await supabase.auth.signOut();
        localStorage.removeItem("adminAuthToken");
        localStorage.removeItem("adminRefreshToken");
        navigate("/member/login");
      }
    };

    const fetchAvailableMusicians = async () => {
      const { data, error } = await supabase
        .from("members_orgs")
        .select("role");

      if (error) {
        console.error("Error fetching available musicians:", error);
      } else {
        console.log("members_orgs data:", data);
        const musicianCounts = data.reduce((acc, member) => {
          const roles = JSON.parse(member.role);
          roles.forEach((role) => {
            if (!acc[role]) {
              acc[role] = 0;
            }
            acc[role]++;
          });
          return acc;
        }, {});
        setAvailableMusicians(musicianCounts);
      }
    };

    fetchAvailableMusicians();
    fetchAdminName();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    validateField(name, value);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleGenreThemeChange = (e) => {
    const { value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      genreThemeHolder: value,
      genre: value === "Genre" ? prevData.genre : "",
      theme: value === "Theme" ? prevData.theme : "",
    }));

    validateField("genreThemeHolder", value);
  };

  const handleEventTypeChange = (e) => {
    const { value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      eventType: value,
      eventTypeName: value === "Department" ? prevData.eventTypeName : "",
    }));

    validateField("eventType", value);
  };

  const handleCaptchaChange = (value) => {
    setCaptchaVerified(!!value);
  };

  const fieldLabels = {
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    title: "Title",
    startDate: "Start Date",
    eventType: "Event Type",
    eventTypeName: "Event Type Name",
    genreThemeHolder: "Genre/Theme",
    endDate: "End Date",
    startTime: "Start Time",
    endTime: "End Time",
    location: "Location",
    description: "Description",
    genre: "Genre",
    theme: "Theme",
  };

  const validateField = (name, value) => {
    let error = "";
    const now = new Date();
    const currentDateString = now.toISOString().split("T")[0];
    const currentTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    switch (name) {
      case "firstName":
      case "lastName":
      case "title":
      case "eventTypeName":
      case "location":
      case "description":
      case "genre":
      case "genreThemeHolder":
      case "theme":
      case "eventType":
        if (!value.trim()) {
          error = `${fieldLabels[name]} is required.`;
        }
        break;
      case "email":
        if (!value.trim()) {
          error = "Email is required.";
        } else if (!value.endsWith("@ustp.edu.ph")) {
          error = "Only @ustp.edu.ph email addresses are allowed.";
        } else if (!validateEmail(value)) {
          error = "Invalid email.";
        }
        break;
      case "startDate":
      case "endDate":
        if (!value.trim()) {
          error = `${fieldLabels[name]} is required.`;
        } else if (value < currentDateString) {
          error = "Cannot book on past days.";
        }
        break;
      case "startTime":
      case "endTime":
        if (!value.trim()) {
          error = `${name} is required.`;
        } else {
          const [hours, minutes] = value.split(":").map(Number);
          if (hours < 9 || (hours === 21 && minutes > 0) || hours > 21) {
            error = "Time must be between 9:00 AM and 9:00 PM.";
          }
        }
        break;
      default:
        break;
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));

    // Check if the form is valid
    const updatedErrors = { ...errors, [name]: error };
    const isValid = Object.values(updatedErrors).every((err) => !err);
    setIsFormValid(isValid);
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validateForm = () => {
    const updatedErrors = {};
    Object.keys(formData).forEach((key) => {
      validateField(key, formData[key]);
      if (errors[key]) {
        updatedErrors[key] = errors[key];
      }
    });

    if (
      !formData.guitarist &&
      !formData.vocalist &&
      !formData.bassist &&
      !formData.melodics &&
      !formData.percussionist
    ) {
      updatedErrors.musicians = "At least one musician is required.";
    }

    setErrors(updatedErrors);
    return Object.keys(updatedErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    if (!captchaVerified) {
      toast.error("Please verify the CAPTCHA.");
      return;
    }

    const success = await adminCreateEventProcess(formData, adminName);
    if (success) {
      toast.success("Event created successfully!");
      onClose();
    } else {
      toast.error("Failed to create event.");
    }
  };

  const fieldConfigurations = [
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      placeholder: "Enter first name",
    },
    {
      name: "lastName",
      label: "Last Name",
      type: "text",
      placeholder: "Enter last name",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "Enter email",
    },
    {
      name: "title",
      label: "Title",
      type: "text",
      placeholder: "Enter title",
    },
    { name: "startDate", label: "Start Date", type: "date" },
    { name: "endDate", label: "End Date", type: "date" },
    { name: "startTime", label: "Start Time", type: "time" },
    { name: "endTime", label: "End Time", type: "time" },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "Enter location",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Enter description",
    },
  ];

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
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Event Type
            </label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleEventTypeChange}
              onBlur={handleBlur}
              className="w-full border border-gray-300 rounded-lg p-2 mt-1"
            >
              <option value="Department">Department</option>
              <option value="Organization">Organization</option>
            </select>
            <input
              type="text"
              name="eventTypeName"
              value={formData.eventTypeName}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full border border-gray-300 rounded-lg p-2 mt-1"
              placeholder={`Enter ${formData.eventType.toLowerCase()} name`}
            />
            {errors.eventTypeName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.eventTypeName}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Genre/Theme
            </label>
            <select
              name="genreThemeHolder"
              value={formData.genreThemeHolder}
              onChange={handleGenreThemeChange}
              onBlur={handleBlur}
              className="w-full border border-gray-300 rounded-lg p-2 mt-1"
            >
              <option value="Genre">Genre</option>
              <option value="Theme">Theme</option>
            </select>
            <input
              type="text"
              name={formData.genreThemeHolder.toLowerCase()}
              value={formData[formData.genreThemeHolder.toLowerCase()]}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full border border-gray-300 rounded-lg p-2 mt-1"
              placeholder={`Enter ${formData.genreThemeHolder.toLowerCase()}`}
            />
            {errors.genreTheme && (
              <p className="text-red-500 text-sm mt-1">{errors.genreTheme}</p>
            )}
          </div>

          {fieldConfigurations.map((field) => (
            <div className="mb-4" key={field.name}>
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                  placeholder={field.placeholder}
                  onBlur={handleBlur}
                  min={today}
                />
              )}
              {errors[field.name] && (
                <p className="text-red-500 text-sm mt-1">
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}

          {Object.keys(availableMusicians).length > 0 && (
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Available Musicians
              </label>
              {Object.keys(availableMusicians).map((role) => (
                <div key={role} className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {role}
                  </label>
                  <select
                    name={role}
                    value={formData[role]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                  >
                    {[...Array(availableMusicians[role] + 1).keys()].map(
                      (num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      )
                    )}
                  </select>
                  {errors[role] && (
                    <p className="text-red-500 text-sm mt-1">{errors[role]}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {isFormValid && (
            <div className="mb-4">
              <ReCAPTCHA
                // sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                // production
                sitekey="6Ld7-ZMqAAAAAF7YrZhOzjlo4htz7PbAuT7MiJgo"
                onChange={handleCaptchaChange}
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg shadow ${
                isFormValid
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!isFormValid}
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
