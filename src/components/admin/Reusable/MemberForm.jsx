import { useEffect, useState } from "react";
import { supabase } from "../../../database/supabase";
import { toast } from "react-toastify";

// Validation Messages
const VALIDATION_ERRORS = {
  NAME_REQUIRED: "Name is required.",
  EMAIL_REQUIRED: "Email is required.",
  EMAIL_INVALID: "Invalid email address.",
  PHONE_REQUIRED: "Mobile number is required.",
  PHONE_INVALID: "Invalid mobile number.",
  PHONE_DUPLICATE: "This phone number is already in use.",
  PROFILE_REQUIRED: "Profile picture is required.",
  ROLES_REQUIRED: "Exactly 2 roles are required for each member.",
  GENRES_REQUIRED: "At least one genre is required.",
};

// Helper Functions
const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
const validatePhoneNumber = (phone) => /^09\d{9}$/.test(phone);

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
  setProfilePicture,
  profilePicture,
}) => {
  // const [newRole, setNewRole] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [formIsValid, setFormIsValid] = useState(false);
  const [newRole, setNewRole] = useState("");
  /* 
  ✅
  Ang mga roles sa Create Member(tong 5) kai butangan og Others para makadugang ang playmakers og new role tas e change ang keyboardist -> Melodics ana jayvee 

  */

  // Hardcoded lists for roles and genres
  const availableRoles = [
    "guitarist",
    "vocalist",
    "bassist",
    "melodics",
    "percussionist",
  ];
  const availableGenres = [
    "Rock",
    "Pop",
    "Jazz",
    "Classical",
    "Hip-Hop",
    "etc..",
  ];

  // Handle role selection
  const handleRoleSelection = (role) => {
    if (roles.includes(role)) {
      // Remove the role if already selected
      setRoles(roles.filter((r) => r !== role));
    } else if (roles.length < 2) {
      // Add the role if fewer than 2 are selected
      setRoles([...roles, role]);
    } else {
      toast.error("You can only select 2 roles in total.");
    }
  };

  const checkEmailExists = async (email) => {
    const { data, error } = await supabase
      .from("members_orgs")
      .select("email")
      .eq("email", email);

    if (error) {
      console.error("Error checking email:", error);
      return false;
    }

    return data.length > 0;
  };

  // Handle adding a custom role
  const handleAddCustomRole = () => {
    if (newRole) {
      const roleToAdd = newRole.trim().toLowerCase();

      // Check if the total number of roles (predefined + custom) is already 2
      if (roles.length >= 2) {
        toast.error("You can only select 2 roles in total.");
        return;
      }

      if (!roles.includes(roleToAdd)) {
        setRoles((prev) => [...prev, roleToAdd]);
        setNewRole(""); // Clear input field
      } else {
        toast.error("This role already exists.");
      }
    }
  };

  // Function to remove a custom role
  const handleRemoveRole = (roleToRemove) => {
    setRoles((prev) => prev.filter((role) => role !== roleToRemove));
  };

  // Function to remove a genre
  const handleRemoveGenre = (genreToRemove) => {
    setGenres((prev) => prev.filter((genre) => genre !== genreToRemove));
  };

  // Handle genre selection
  // const handleGenreChange = (e) => {
  //   const selectedGenres = Array.from(
  //     e.target.selectedOptions,
  //     (option) => option.value
  //   );
  //   setGenres(selectedGenres);
  // };

  // Add a role
  // const handleAddRole = () => {
  //   if (newRole) {
  //     setRoles((prev) => [...prev, newRole.trim().toLowerCase()]);
  //     setNewRole("");
  //   }
  // };

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
    const updatedValue =
      name === "mobile" ? value.replace(/\D/g, "").slice(0, 11) : value;
    // Allow only numbers for phone and 11 digits only
    setNewMember((prev) => ({ ...prev, [name]: updatedValue }));
  };

  // Handle file change for profile picture
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Save the selected file locally.
    setProfilePicture(file);
    const reader = new FileReader();
    // Show preview
    reader.onload = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
  };

  // Form validation logic
  const validateForm = async () => {
    const validationErrors = {};
    const { name, email, mobile } = newMember;

    if (!name) validationErrors.name = VALIDATION_ERRORS.NAME_REQUIRED;
    if (!email) {
      validationErrors.email = VALIDATION_ERRORS.EMAIL_REQUIRED;
    } else if (!validateEmail(email)) {
      validationErrors.email = VALIDATION_ERRORS.EMAIL_INVALID;
    } else if (await checkEmailExists(email)) {
      validationErrors.email = "Email already exists.";
    }

    if (!mobile) {
      validationErrors.mobile = VALIDATION_ERRORS.PHONE_REQUIRED;
    } else if (!validatePhoneNumber(mobile)) {
      validationErrors.mobile = VALIDATION_ERRORS.PHONE_INVALID;
    } else if (await checkPhoneNumberUniqueness(mobile)) {
      validationErrors.mobile = VALIDATION_ERRORS.PHONE_DUPLICATE;
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

      {/* Roles */}
      {/* <TagInput
        label="Role(s)"
        value={newRole}
        items={roles}
        onAdd={handleAddRole}
        onChange={(e) => setNewRole(e.target.value)}
        error={errors.roles}
        placeholder="Enter role"
      /> */}

      {/* Roles Checkboxes */}
      <CheckboxInput
        label="Role(s)"
        options={availableRoles}
        selectedOptions={roles}
        onChange={handleRoleSelection}
        error={errors.roles}
      />

      {/* Custom Role Input */}
      <TagInput
        label="Other Roles"
        value={newRole}
        items={roles.filter((role) => !availableRoles.includes(role))} // Display only custom roles
        onAdd={handleAddCustomRole}
        onChange={(e) => setNewRole(e.target.value)}
        // error={errors.roles}
        onRemove={handleRemoveRole}
        placeholder="Enter other role"
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
        onRemove={handleRemoveGenre}
        examples={availableGenres}
      />

      {/* Genres Dropdown */}
      {/* <DropdownInput
        label="Genre(s)"
        options={availableGenres}
        selectedOptions={genres}
        onChange={handleGenreChange}
        multiple
        error={errors.genres}
      /> */}

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
      />

      {/* Submit Button */}
      <SubmitButton isDisabled={!formIsValid || loading} loading={loading} />
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

// Dropdown Component
// const DropdownInput = ({
//   label,
//   options,
//   selectedOptions,
//   onChange,
//   multiple,
//   error,
// }) => (
//   <div className="mb-4">
//     <label className="block text-sm font-medium text-gray-700">{label}</label>
//     <select
//       multiple={multiple}
//       value={selectedOptions}
//       onChange={onChange}
//       className={`mt-1 block w-full border ${
//         error ? "border-red-500" : "border-gray-300"
//       } rounded-md shadow-sm py-2 px-3`}
//     >
//       {options.map((option, index) => (
//         <option key={index} value={option}>
//           {option}
//         </option>
//       ))}
//     </select>
//     {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
//   </div>
// );

// Checkbox Input Component for Roles
const CheckboxInput = ({
  label,
  options,
  selectedOptions,
  onChange,
  error,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="mt-2 space-y-2">
      {options.map((option, index) => (
        <label key={index} className="flex items-center">
          <input
            type="checkbox"
            value={option}
            checked={selectedOptions.includes(option)}
            onChange={() => onChange(option)}
            className="mr-2"
          />
          {option}
        </label>
      ))}
    </div>
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
  onRemove,
  examples,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {/* Display Notes or Examples */}
    {examples && (
      <p className="text-sm text-gray-500 mt-1 mb-2">
        Examples: {examples.join(", ")}
      </p>
    )}
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
        <div
          key={index}
          className="flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm"
        >
          <span>{item}</span>
          <button
            type="button"
            onClick={() => onRemove(item)} // Call remove function
            className="ml-2 text-red-500 hover:text-red-700"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

// File Input Component
const FileInput = ({ label, onChange, previewImage, error }) => (
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
