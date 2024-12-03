import { useEffect, useState } from "react";
import { supabase } from "../../../database/supabase";
import { toast, ToastContainer } from "react-toastify";

// Validation Messages
const VALIDATION_ERRORS = {
  NAME_REQUIRED: "Name is required.",
  EMAIL_REQUIRED: "Email is required.",
  EMAIL_INVALID: "Invalid email address.",
  PHONE_REQUIRED: "Mobile number is required.",
  PHONE_INVALID: "Invalid mobile number.",
  PHONE_DUPLICATE: "This phone number is already in use.",
  PASSWORD_REQUIRED: "Password is required.",
  PASSWORD_SHORT: "Password must be at least 8 characters long.",
  PROFILE_REQUIRED: "Profile picture is required.",
  ROLES_REQUIRED: "Exactly 2 roles are required for each member.",
  GENRES_REQUIRED: "At least one genre is required.",
};

// Helper Functions
const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
const validatePhoneNumber = (phone) => /^\d{10,12}$/.test(phone);

// Function to check for phone number uniqueness
const checkPhoneNumberUniqueness = async (phone) => {
  if (!phone) return false;

  const { data, error } = await supabase
    .from("members_orgs")
    .select("mobile")
    .eq("mobile", phone);

  if (error) {
    console.error("Error checking phone number:", error.message);
    return false;
  }

  return data.length > 0;
  // If the number exists, return true
};

const MemberForm = ({
  newMember,
  setNewMember,
  roles,
  setRoles,
  genres,
  setGenres,
  loading,
  handleSubmit,
}) => {
  const [newRole, setNewRole] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [formIsValid, setFormIsValid] = useState(false);

  // Add a role
  const handleAddRole = () => {
    if (newRole) {
      setRoles((prev) => [...prev, newRole.trim().toLowerCase()]);
      setNewRole("");
    }
  };

  // Add a genre
  const handleAddGenre = () => {
    if (newGenre) {
      setGenres((prev) => [...prev, newGenre.trim().toLowerCase()]);
      setNewGenre("");
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === "mobile" ? value.replace(/\D/g, "") : value; // Allow only numbers for phone
    setNewMember((prev) => ({ ...prev, [name]: updatedValue }));
  };

  // Handle file change for profile picture
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfilePicture(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result); // Show preview
    reader.readAsDataURL(file);
  };

  // Upload Profile Picture
  const handleUpload = async () => {
    if (!profilePicture) return;
    try {
      setUploading(true);
      const fileName = `${Date.now()}_${profilePicture.name}`;

      const { data, error } = await supabase.storage
        .from("profiles")
        .upload(fileName, profilePicture);

      if (error) throw new Error(error.message);

      const manualPublicURL = `${import.meta.env.VITE_IMG_URL}/${data.path}`;
      toast.success("Profile picture uploaded successfully!");
      setNewMember((prev) => ({ ...prev, profile_image: manualPublicURL }));
    } catch (error) {
      console.error("Error uploading file:", error.message);
      toast.error("An error occurred during the upload.");
    } finally {
      setUploading(false);
    }
  };

  // Form validation logic
  const validateForm = async () => {
    const validationErrors = {};
    const { name, email, mobile, password } = newMember;

    if (!name) validationErrors.name = VALIDATION_ERRORS.NAME_REQUIRED;
    if (!email) {
      validationErrors.email = VALIDATION_ERRORS.EMAIL_REQUIRED;
    } else if (!validateEmail(email)) {
      validationErrors.email = VALIDATION_ERRORS.EMAIL_INVALID;
    }
    if (!mobile) {
      validationErrors.mobile = VALIDATION_ERRORS.PHONE_REQUIRED;
    } else if (!validatePhoneNumber(mobile)) {
      validationErrors.mobile = VALIDATION_ERRORS.PHONE_INVALID;
    } else if (await checkPhoneNumberUniqueness(mobile)) {
      validationErrors.mobile = VALIDATION_ERRORS.PHONE_DUPLICATE;
    }
    if (!password) {
      validationErrors.password = VALIDATION_ERRORS.PASSWORD_REQUIRED;
    } else if (password.length < 8) {
      validationErrors.password = VALIDATION_ERRORS.PASSWORD_SHORT;
    }
    if (!profilePicture)
      validationErrors.profilePicture = VALIDATION_ERRORS.PROFILE_REQUIRED;

    if (roles.length !== 2) {
      validationErrors.roles = VALIDATION_ERRORS.ROLES_REQUIRED;
    }

    if (genres.length === 0) {
      validationErrors.genres = VALIDATION_ERRORS.GENRES_REQUIRED;
    }

    setErrors(validationErrors);
    setFormIsValid(Object.keys(validationErrors).length === 0);
    return Object.keys(validationErrors).length === 0;
  };

  // Form submission handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (await validateForm()) {
        handleSubmit();
        toast.success("Member created successfully! 🎉");
      }
    } catch (error) {
      console.error("Error submitting the form:", error.message);
      toast.error("Failed to create member. Please try again.");
    }
  };

  // Validate form on dependency change
  useEffect(() => {
    validateForm();
  }, [newMember, roles, genres, profilePicture]);

  return (
    <form
      onSubmit={handleFormSubmit}
      className="p-6 bg-white rounded-lg max-h-[80vh] overflow-y-auto"
    >
      {/* Name */}
      <FormInput
        label="Name"
        type="text"
        name="name"
        value={newMember.name}
        onChange={handleInputChange}
        error={errors.name}
        placeholder="Enter name"
      />

      {/* Email */}
      <FormInput
        label="Email"
        type="email"
        name="email"
        value={newMember.email}
        onChange={handleInputChange}
        error={errors.email}
        placeholder="Enter email"
      />

      {/* Password */}
      <FormInput
        label="Password"
        type="password"
        name="password"
        value={newMember.password}
        onChange={handleInputChange}
        error={errors.password}
        placeholder="Enter password"
      />

      {/* Roles */}
      <TagInput
        label="Role(s)"
        value={newRole}
        items={roles}
        onAdd={handleAddRole}
        onChange={(e) => setNewRole(e.target.value)}
        error={errors.roles}
        placeholder="Enter role"
      />

      {/* Genres */}
      <TagInput
        label="Genre(s)"
        value={newGenre}
        items={genres}
        onAdd={handleAddGenre}
        onChange={(e) => setNewGenre(e.target.value)}
        error={errors.genres}
        placeholder="Enter genre"
      />

      {/* Mobile */}
      <FormInput
        label="Mobile Number"
        type="text"
        name="mobile"
        value={newMember.mobile}
        onChange={handleInputChange}
        error={errors.mobile}
        placeholder="Enter mobile number"
      />

      {/* Profile Picture */}
      <FileInput
        label="Profile Picture"
        onChange={handleFileChange}
        previewImage={previewImage}
        error={errors.profilePicture}
        onUpload={handleUpload}
        uploading={uploading}
      />

      {/* Submit Button */}
      <SubmitButton isDisabled={!formIsValid || loading} loading={loading} />

      <ToastContainer position="top-right" autoClose={3000} />
    </form>
  );
};

// Form Input Component
const FormInput = ({
  label,
  type,
  name,
  value,
  onChange,
  error,
  placeholder,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={`mt-1 block w-full border ${
        error ? "border-red-500" : "border-gray-300"
      } rounded-md shadow-sm py-2 px-3`}
      placeholder={placeholder}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

// Tag Input Component
const TagInput = ({
  label,
  value,
  items,
  onAdd,
  onChange,
  error,
  placeholder,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="flex space-x-2">
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="flex-1 mt-1 block border border-gray-300 rounded-md shadow-sm py-2 px-3"
        placeholder={placeholder}
      />
      <button
        type="button"
        className="px-4 py-2 bg-green-500 text-white rounded-md"
        onClick={onAdd}
      >
        Add
      </button>
    </div>
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={index}
          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
        >
          {item}
        </span>
      ))}
    </div>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

// File Input Component
const FileInput = ({
  label,
  onChange,
  previewImage,
  error,
  onUpload,
  uploading,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="file"
      accept="image/*"
      onChange={onChange}
      className="mt-1 block w-full border border-gray-300 rounded-md"
    />
    {previewImage && (
      <div className="mt-4">
        <img
          src={previewImage}
          alt="Preview"
          className="w-32 h-32 object-cover rounded-md"
        />
      </div>
    )}
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    <button
      type="button"
      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
      onClick={onUpload}
      disabled={uploading}
    >
      {uploading ? "Uploading..." : "Upload Picture"}
    </button>
  </div>
);

// Submit Button Component
const SubmitButton = ({ isDisabled, loading }) => (
  <button
    type="submit"
    disabled={isDisabled}
    className={`w-full px-4 py-2 rounded-md ${
      isDisabled
        ? "bg-gray-400 text-gray-700 cursor-not-allowed"
        : "bg-blue-500 text-white hover:bg-blue-600"
    }`}
  >
    {loading ? "Submitting..." : "Submit"}
  </button>
);

export default MemberForm;
