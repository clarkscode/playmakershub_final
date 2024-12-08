import { useState, useEffect } from "react";
import { supabase } from "../database/supabase";
import { supabaseAdmin } from "../database/supabaseAdmin";
import sendEmailTwo from "../database/sendEmailTwo";

// Utility to generate a strong random password
const generatePassword = (length = 12) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const CreateAdmin = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [role, setRole] = useState("President");
  const [availableRoles, setAvailableRoles] = useState([
    "President",
    "Vice President (Internal)",
    "Vice President (External)",
    "Developer",
  ]);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useEffect(() => {
    const fetchExistingRoles = async () => {
      try {
        // Fetch all authentication users from Supabase
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
          console.error("Error fetching users:", error.message);
          setError("Failed to fetch existing roles.");
          return;
        }

        // Extract existing roles from users' metadata
        const existingRoles = data.users.map(
          (user) => user.user_metadata?.role
        );

        // Count how many of each role exist
        const roleCounts = {
          President: existingRoles.filter((role) => role === "President")
            .length,
          "Vice President (Internal)": existingRoles.filter(
            (role) => role === "Vice President (Internal)"
          ).length,
          "Vice President (External)": existingRoles.filter(
            (role) => role === "Vice President (External)"
          ).length,
          Developer: existingRoles.filter((role) => role === "Developer")
            .length,
        };

        // Remove roles from the dropdown if they already exist
        const updatedRoles = [
          "President",
          "Vice President (Internal)",
          "Vice President (External)",
          "Developer",
        ].filter((role) => {
          if (role === "Developer") {
            return roleCounts[role] < 5; // Allow up to 5 Developers
          }
          return roleCounts[role] === 0; // Allow other roles if they don't exist
        });

        setAvailableRoles(updatedRoles);

        // Disable button if all roles exist and Developer count is 5
        const isDisabled =
          roleCounts.President > 0 &&
          roleCounts["Vice President (Internal)"] > 0 &&
          roleCounts["Vice President (External)"] > 0 &&
          roleCounts.Developer >= 5;

        setIsButtonDisabled(isDisabled);
      } catch (err) {
        console.error("Error fetching roles:", err);
        setError("An unexpected error occurred while fetching roles.");
      }
    };

    fetchExistingRoles();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Generate a strong password
    const password = generatePassword();

    try {
      // Sign up a new user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
            is_admin: true,
            is_super_admin: false,
          },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }
      // Send the password to the email
      const subject = "Your Playmakers Admin Account Credentials";
      const content = `
          <p>Dear ${firstName} ${lastName},</p>
          <p>Your Playmakers Admin account has been successfully created. Below are your login credentials:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p>Don't share your password to anyone.</p>
          <p>We recommend that you log in and change your password as soon as possible.</p>
          <p>Best regards,<br/>Playmakers Team</p>
          <a href="https://www.playmakershub.org" target="_blank">www.playmakershub.org</a></p>
      `;

      // KANI RA NA 2ND EMAIL API KAY GAMAY RAMAN NI NGA REQUEST
      await sendEmailTwo(email, subject, content);
      // console.log("Signup successful:", data);

      // Clear session (sign out the newly created user)
      await supabase.auth.signOut();
      // console.log("Session cleared after signup");

      // Indicate success to the user
      setSuccess(true);

      // Clear input fields
      setEmail("");
      setFirstName("");
      setLastName("");
      setRole("President");
    } catch (err) {
      console.error("Error creating admin:", err);
      setError("An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Create Admin Account</h1>
        {error && <p className="text-red-500">{error}</p>}
        {success && (
          <p className="text-green-500">Admin account created successfully!</p>
        )}
        <form onSubmit={handleCreateAdmin}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="mt-1 p-2 w-full border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="mt-1 p-2 w-full border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 p-2 w-full border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 p-2 w-full border rounded bg-white"
              disabled={availableRoles.length === 0}
            >
              {availableRoles.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full ${
              isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isButtonDisabled}
          >
            Create Admin
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAdmin;
