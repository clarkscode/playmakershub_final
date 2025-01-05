import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "../../database/supabase";
import BookingForm from "../../components/playmakershub/BookingForm";
// React Icons
import { FaInfoCircle } from "react-icons/fa";
import sendEmail from "../../database/sendEmail";
import Navbar from "../admin/testing/Navbar";
import sendEmailTwo from "../../database/sendEmailTwo";
import { supabaseAdmin } from "../../database/supabaseAdmin";
import {
  createBookingProcess,
  fetchBookingStatus,
} from "../../database/bookings";

const UnauthNavbar = () => {
  const [popupVisible, setPopupVisible] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [bookingID, setBookingID] = useState(null);
  const [isJoinEnabled, setIsJoinEnabled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const [enteredBookingID, setEnteredBookingID] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [bookingStatus, setBookingStatus] = useState("Pending");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fetchedBookingID, setFetchedBookingID] = useState("");
  const [errors, setErrors] = useState({}); // Add errors state

  const modalRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    eventType: "Organization",
    eventTypeName: "",
    genreThemeHolder: "Genre",
    genre: "",
    theme: "",
    guitarist: 0,
    vocalist: 0,
    bassist: 0,
    melodics: 0,
    percussionist: 0,
    description: "",
  });

  const initialFormData = {
    title: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    eventType: "Organization",
    eventTypeName: "",
    genreThemeHolder: "Genre",
    genre: "",
    theme: "",
    guitarist: 0,
    vocalist: 0,
    bassist: 0,
    melodics: 0,
    percussionist: 0,
    description: "",
  };

  // Real-time field validation
  const validateField = (name, value) => {
    let error = "";
    if (!value) {
      error = "This field is required.";
    } else if (name === "email" && !/\S+@\S+\.\S+/.test(value)) {
      error = "Invalid email address.";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateBeforeSubmit = () => {
    const newErrors = {};

    // Check Event Type Name
    if (!formData.eventTypeName.trim()) {
      newErrors.eventTypeName = "Department/Organization Name is required";
    }

    // Check Genre/Theme
    if (formData.genreThemeHolder === "Genre" && !formData.genre.trim()) {
      newErrors.genre = "Genre Description is required";
    } else if (
      formData.genreThemeHolder === "Theme" &&
      !formData.theme.trim()
    ) {
      newErrors.theme = "Theme Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // If no errors, return true
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Run validation in real-time
    validateField(name, value);
  };

  const today = new Date().toISOString().split("T")[0];

  const togglePopup = () => setPopupVisible(!popupVisible);
  const onClose = () => {
    setPopupVisible(false);

    // If in view mode, refresh the page
    if (isViewMode) {
      window.location.reload();
    }
  };

  const notifyAdmins = async (eventName) => {
    try {
      // Step 1: Fetch all admin users based on their roles from authentication
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.error("Error fetching all admins", error);
        throw new Error("Failed to fetch users.");
      }

      // Step 2: Organize users by roles
      const roleMapping = {
        President: [],
        "Vice President (Internal)": [],
        "Vice President (External)": [],
      };

      data.users.forEach((user) => {
        const role = user.user_metadata?.role;
        if (role && roleMapping[role] !== undefined) {
          roleMapping[role].push({
            name: `${user.user_metadata?.first_name || "N/A"} ${
              user.user_metadata?.last_name || "N/A"
            }`,
            email: user.email,
          });
        }
      });

      // Step 3: Send personalized emails for each role

      const emailPromises = [];
      for (const [role, users] of Object.entries(roleMapping)) {
        for (const user of users) {
          const emailContent = `
          <p>Dear ${role}: ${user.name},</p>
          <p>A new booking request titled "<strong>${eventName}</strong>" has been submitted.</p>
          <p>
            Please visit your admin dashboard to review the event. 
            <a href="https://www.playmakershub.org/login" target="_blank">View Admin Dashboard</a>
          </p>
          <p>Best Regards,<br>The Playmakers Family</p>
        `;

          emailPromises.push(
            sendEmailTwo(
              user.email,
              "New Booking Request Received",
              emailContent
            )
          );
        }
      }

      // Insert notifications into database
      const notificationContent = `A new booking titled "${eventName}" has been received.`;
      const notificationInsert = await supabase.from("notifications").insert([
        {
          event_id: bookingID,
          notification_type: "New Booking",
          content: notificationContent,
          user_id: null,
          sent_at: new Date(),
        },
      ]);

      if (notificationInsert.error) {
        console.error(
          "Error inserting notification:",
          notificationInsert.error
        );
        throw new Error("Failed to insert notification.");
      }

      // Wait for all email promises to resolve
      await Promise.all(emailPromises);
      console.log("Emails successfully sent to all admins.");
    } catch (error) {
      console.error("Error notifying admins:", error);
    }
  };

  const checkIsUserAuthenticated = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      // console.log("Homepage - user has session", session);
    } catch (error) {
      console.error("Error checking user authentication:", error.message);
      toast.error("Failed to check authentication status.");
    }
  };

  useEffect(() => {
    const fetchJoinStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("join")
          .select("isOpen")
          .single();

        if (error) {
          console.error("Error fetching join status:", error.message);
        } else {
          setIsJoinEnabled(data?.isOpen);
        }
      } catch (err) {
        console.error("Unexpected error fetching join status:", err.message);
      }
    };
    fetchJoinStatus();
    checkIsUserAuthenticated();
  }, []);

  const handleCaptchaVerify = (value) => {
    setCaptchaVerified(!!value);
  };

  // Ensure musicians validation
  const isMusiciansValid =
    formData.guitarist > 0 ||
    formData.vocalist > 0 ||
    formData.bassist > 0 ||
    formData.melodics > 0 ||
    formData.percussionist > 0;

  const validateDateTime = () => {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    // const end = new Date(`${formData.endDate}T${formData.endTime}`);
    const todayDate = new Date(today);
    const now = new Date();

    // Ensure start date is not in the past
    if (startDate < todayDate) {
      toast.error("Start date cannot be in the past.");
      return false;
    }

    // Ensure end date is not before start date
    if (endDate < startDate) {
      toast.error("End date cannot be earlier than start date.");
      return false;
    }

    // Ensure start time is not in the past if start date is today
    if (
      formData.startDate === today &&
      start.getHours() * 60 + start.getMinutes() <
        now.getHours() * 60 + now.getMinutes()
    ) {
      toast.error("Start time cannot be in the past.");
      return false;
    }

    // Ensure start time is before end time for the same day
    if (
      formData.startDate === formData.endDate &&
      formData.startTime >= formData.endTime
    ) {
      toast.error("End time must be after start time for the same day.");
      return false;
    }

    // Optional: Ensure the event doesn't exceed a maximum duration
    const maxDuration = 7;
    const differenceInDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (differenceInDays > maxDuration) {
      toast.error(`Event duration cannot exceed ${maxDuration} days.`);
      return false;
    }

    // Optional: Ensure event duration is reasonable (e.g., not overnight)
    // if (end - start > 24 * 60 * 60 * 1000) {
    //   toast.error("Event cannot exceed 24 hours.");
    //   return false;
    // }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateBeforeSubmit()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!validateDateTime()) {
      return; // stop submission if validation fails
    }

    // Email domain validation
    // const emailDomain = formData.email.split("@")[1];
    // if (emailDomain !== "ustp.edu.ph") {
    //   toast.error("You are not allowed to book.");
    //   return;
    // }

    // Check if CAPTCHA is verified
    if (!captchaVerified) {
      toast.error("Please complete the CAPTCHA.");
      return;
    }

    if (!isMusiciansValid) {
      toast.error("Please select at least one musician.");
      return;
    }

    try {
      // Call the booking process
      const result = await createBookingProcess(formData);
      // const bookingID = result.bookingData[0]?.booking_id;
      const bookNumber = result.bookingData[0]?.book_number;

      setBookingID(bookNumber);
      console.log("Booking ID set:", bookNumber);

      //organizer's full name dynamically
      const organizerName = `${formData.firstName} ${formData.lastName}`;

      // email content
      const emailContent = `
          <p>Dear ${organizerName},</p>
          <p>Your booking for the event titled "${formData.title}" has been successfully created!</p>
          <p>Here is your booking ID: <strong>${bookNumber}</strong></p>
          <p>Please remember to keep this booking ID safe. You will need it if you want to make clarifications, updates, or cancellations for your booking.</p>
          <p>Best Regards,<br/>The Playmakers Family</p>
          <a href="https://www.playmakershub.org" target="_blank">www.playmakershub.org</a></p>
        `;

      // send the booking id to organizer
      await sendEmail(
        formData.email,
        `Your event "${formData.title}" booking confirmation`,
        emailContent
      );
      // Reset form fields
      setFormData(initialFormData);
      toast.success("Booked successfully!");
      notifyAdmins(formData.title);
      // console.log("Booking Result:", result);
    } catch (error) {
      toast.error("Failed to complete the booking process.");
      console.error("Booking Error:", error);
    }
  };

  const handleBookingIDSubmit = async () => {
    if (!enteredBookingID || enteredBookingID.trim() === "") {
      toast.error("Booking ID cannot be empty.");
      return;
    }
    try {
      const { data: booked, error } = await supabase
        .from("bookings")
        .select("booking_id")
        .eq("book_number", enteredBookingID)
        .single();

      if (error || !booked) {
        toast.error("Booking number not found.");
        console.error("handleBookingIDSubmit error:", error);
        return;
      }

      const bookingID = booked.booking_id;
      setFetchedBookingID(bookingID);

      const { data, error: detailsError } = await supabase
        .from("bookings")
        .select(
          `
          *,
          events (
            *,
            musicians_required (*)
          )
        `
        )
        .eq("booking_id", bookingID)
        .single();

      if (detailsError) throw detailsError;

      if (data) {
        // Check if the event status is "Pending" and set isEditMode accordingly
        const isEditable = data.events[0]?.event_status === "Pending";
        setIsEditMode(isEditable);
        setIsViewMode(!isEditable);
        // Fetch and set the booking status
        await fetchAndSetBookingStatus(bookingID);
        // console.log("fetchedBookingID", bookingID);

        // console.log("FETCHED DATA", data.events[0].event_id);

        // Extracting and organizing fetched data into the formData structure
        setFetchedData({
          organizerFirstName: data.organizer_first_name,
          organizerLastName: data.organizer_last_name,
          organizerEmail: data.organizer_email,
          location: data.event_location,
          eventType: data.event_type,
          eventTypeName: data.event_type_name,
          // genreThemeHolder: data.genreThemeHolder || "Genre", // default if not provided
          genreThemeHolder: data.genreThemeHolder,

          // Event Details
          title: data.events[0]?.event_title,
          startDate: data.events[0]?.start_date,
          endDate: data.events[0]?.end_date,
          startTime: data.events[0]?.start_time,
          endTime: data.events[0]?.end_time,
          genre: data.events[0]?.genre,
          theme: data.events[0]?.theme,
          description: data.events[0]?.description,

          // Musicians Required Details
          guitarist: data.events[0]?.musicians_required[0]?.guitarist,
          vocalist: data.events[0]?.musicians_required[0]?.vocalist,
          bassist: data.events[0]?.musicians_required[0]?.bassist,
          melodics: data.events[0]?.musicians_required[0]?.melodics,
          percussionist: data.events[0]?.musicians_required[0]?.percussionist,
        });
        if (!isEditable) {
          toast.error(
            "This booking is not editable because it is not pending."
          );
        }
      }
    } catch (error) {
      toast.error("Booking doesnt exist.");
      console.error("handleBookingIDSubmit", error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    // Ensure CAPTCHA is completed before proceeding
    if (!captchaVerified) {
      toast.error("Please complete the CAPTCHA to save changes.");
      return;
    }

    try {
      // Update the bookings table with organizer details
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          organizer_first_name: formData.firstName,
          organizer_last_name: formData.lastName,
          organizer_email: formData.email,
          event_location: formData.location,
          event_type: formData.eventType,
          event_type_name: formData.eventTypeName,
        })
        .eq("booking_id", fetchedBookingID);

      if (bookingError) throw bookingError;

      // Update the events table with event details
      const { error: eventError } = await supabase
        .from("events")
        .update({
          event_title: formData.title,
          start_date: formData.startDate,
          end_date: formData.endDate,
          start_time: formData.startTime,
          end_time: formData.endTime,
          genre: formData.genre,
          theme: formData.theme,
          description: formData.description,
        })
        .eq("booking_id", fetchedBookingID);

      if (eventError) throw eventError;

      // Fetch the event ID associated with the booking ID to update musician details
      const { data: eventData, error: fetchEventError } = await supabase
        .from("events")
        .select("event_id")
        .eq("booking_id", fetchedBookingID)
        .single();

      if (fetchEventError || !eventData) throw fetchEventError;

      const eventId = eventData.event_id;

      // Update the musicians_required table with musician details
      const { error: musicianError } = await supabase
        .from("musicians_required")
        .update({
          guitarist: formData.guitarist,
          vocalist: formData.vocalist,
          bassist: formData.bassist,
          melodics: formData.melodics,
          percussionist: formData.percussionist,
        })
        .eq("event_id", eventId);

      if (musicianError) throw musicianError;

      toast.success("Booking updated successfully!");
    } catch (error) {
      toast.error("Failed to update booking.");
      console.error("Error updating booking details:", error);
    }
  };

  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setPopupVisible(false);
    }
  };

  const handleEscKey = (e) => {
    if (e.key === "Escape") {
      setPopupVisible(false);
    }
  };

  useEffect(() => {
    if (popupVisible) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleEscKey);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [popupVisible]);

  useEffect(() => {
    if (fetchedData) {
      // console.log("fetch booking data", fetchedData);
      console.log("BOOKING ID", bookingID);
      setFormData({
        firstName: fetchedData.organizerFirstName,
        lastName: fetchedData.organizerLastName,
        email: fetchedData.organizerEmail,
        location: fetchedData.location,
        eventType: fetchedData.eventType,
        eventTypeName: fetchedData.eventTypeName,
        genreThemeHolder: fetchedData.genreThemeHolder ? "Genre" : "Theme", // default is genre sa edit mode
        title: fetchedData.title,
        startDate: fetchedData.startDate,
        endDate: fetchedData.endDate,
        startTime: fetchedData.startTime,
        endTime: fetchedData.endTime,
        genre: fetchedData.genre,
        theme: fetchedData.theme,
        description: fetchedData.description,
        guitarist: fetchedData.guitarist,
        vocalist: fetchedData.vocalist,
        bassist: fetchedData.bassist,
        melodics: fetchedData.melodics,
        percussionist: fetchedData.percussionist,
      });
    }
  }, [fetchedData]);

  // Function to fetch and set booking status
  const fetchAndSetBookingStatus = async (bookingID) => {
    try {
      const status = await fetchBookingStatus(bookingID);
      setBookingStatus(status);
    } catch (error) {
      console.error("fetchAndSetBookingStatus error Homepage", error);
      toast.error("Could not retrieve booking status.");
    }
  };

  return (
    <div>
      <Navbar
        isJoinEnabled={isJoinEnabled}
        onPopupToggle={togglePopup}
        isAuthenticated={isAuthenticated}
      />
      <main>
        {popupVisible && (
          <div className="fixed inset-0 bg-grey bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-lg">
            <BookingForm
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              handleEditSubmit={handleEditSubmit}
              handleBookingIDSubmit={handleBookingIDSubmit}
              enteredBookingID={enteredBookingID}
              setEnteredBookingID={setEnteredBookingID}
              fetchedBookingID={fetchedBookingID}
              captchaVerified={captchaVerified}
              handleCaptchaVerify={handleCaptchaVerify}
              modalRef={modalRef}
              today={today}
              isEditMode={isEditMode}
              isViewMode={isViewMode}
              onClose={onClose}
              status={bookingStatus}
              isMusiciansValid={isMusiciansValid}
              errors={errors} // Pass errors state
              handleValidation={validateField} // Pass validation logic
            />
          </div>
        )}

        {bookingID && (
          <div className="fixed inset-0 bg-grey bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-lg">
            <div className="bg-[#36303C] p-8 rounded-lg shadow-lg w-1/3 relative">
              <p className="text-xl text-white mb-4">
                Booking Successfully Sent!
              </p>

              <div className="flex items-center">
                <p className="text-lg text-[#C1C2D3] font-semibold mr-2">
                  Booking ID has been sent to your email
                </p>
                <FaInfoCircle
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-gray-300 cursor-pointer"
                />
                {showTooltip && (
                  <div className="absolute top-0 right-12 w-64 bg-gray-700 text-white text-sm p-2 rounded-lg shadow-md">
                    Keep this booking ID. You will need this whenever you want
                    to edit, or clarify your booking.
                  </div>
                )}
              </div>
              <button
                onClick={() => setBookingID(null)}
                className="w-full bg-[#40B267] text-white py-2 rounded-lg cursor-pointer mt-4"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UnauthNavbar;
