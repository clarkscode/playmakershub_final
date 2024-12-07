import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  createBookingProcess,
  fetchBookingStatus,
  supabase,
} from "../../../database/supabase";
import BookingForm from "../../../components/playmakershub/BookingForm";
// React Icons
import { FaInfoCircle } from "react-icons/fa";
import sendEmail from "../../../database/sendEmail";
import Navbar from "../../../components/admin/testing/Navbar";

const Homepage = () => {
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

  const navigate = useNavigate();
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
    keyboardist: 0,
    percussionist: 0,
    description: "",
  });

  const today = new Date().toISOString().split("T")[0];

  const togglePopup = () => setPopupVisible(!popupVisible);
  const onClose = () => {
    setPopupVisible(false);

    // If in view mode, refresh the page
    if (isViewMode) {
      window.location.reload();
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Ensure the input time is valid
    const validateFutureTime = (fieldName, value) => {
      const today = new Date();
      const [hours, minutes] = value.split(":").map(Number);
      const inputTime = new Date();
      inputTime.setHours(hours, minutes, 0, 0);

      if (inputTime <= today) {
        toast.error(
          `${fieldName} cannot be in the past. Please select a future time.`
        );
        return false;
      }
      return true;
    };

    if (name === "startTime" || name === "endTime") {
      const isValid = validateFutureTime(
        name === "startTime" ? "Start Time" : "End Time",
        value
      );
      if (!isValid) return;
    }

    setFormData((prevData) => ({ ...prevData, [name]: value }));
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

  // Function to fetch and set booking status
  const fetchAndSetBookingStatus = async (bookingID) => {
    try {
      const status = await fetchBookingStatus(bookingID);
      setBookingStatus(status);
    } catch (error) {
      console.error("Failed to fetch booking status:", error);
      toast.error("Could not retrieve booking status.");
    }
  };

  const handleCaptchaVerify = (value) => {
    setCaptchaVerified(!!value);
  };

  // Ensure musicians validation
  const isMusiciansValid =
    formData.guitarist > 0 ||
    formData.vocalist > 0 ||
    formData.bassist > 0 ||
    formData.keyboardist > 0 ||
    formData.percussionist > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email domain validation
    const emailDomain = formData.email.split("@")[1];
    if (emailDomain !== "ustp.edu.ph") {
      toast.error("You are not allowed to book.");
      return;
    }

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
      const bookingID = result.bookingData[0].booking_id;
      setBookingID(bookingID);

      //organizer's full name dynamically
      const organizerName = `${formData.firstName} ${formData.lastName}`;

      // email content
      const emailContent = `
          <p>Dear ${organizerName},</p>
          <p>Your booking for the event titled "${formData.title}" has been successfully created!</p>
          <p>Here is your booking ID: <strong>${bookingID}</strong></p>
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
      toast.success("Booked successfully!");
      console.log("Booking Result:", result);
    } catch (error) {
      toast.error("Failed to complete the booking process.");
      console.error("Booking Error:", error);
    }
  };

  const handleBookingIDSubmit = async () => {
    try {
      const { data, error } = await supabase
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
        .eq("booking_id", enteredBookingID)
        .single();

      if (error) throw error;

      if (data) {
        // Check if the event status is "Pending" and set isEditMode accordingly
        const isEditable = data.events[0]?.event_status === "Pending";
        setIsEditMode(isEditable);
        setIsViewMode(!isEditable);
        // Fetch and set the booking status
        await fetchAndSetBookingStatus(enteredBookingID);

        console.log("FETCHED DATA", data.events[0].event_id);

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
          keyboardist: data.events[0]?.musicians_required[0]?.keyboardist,
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
        .eq("booking_id", enteredBookingID);

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
        .eq("booking_id", enteredBookingID);

      if (eventError) throw eventError;

      // Fetch the event ID associated with the booking ID to update musician details
      const { data: eventData, error: fetchEventError } = await supabase
        .from("events")
        .select("event_id")
        .eq("booking_id", enteredBookingID)
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
          keyboardist: formData.keyboardist,
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
        keyboardist: fetchedData.keyboardist,
        percussionist: fetchedData.percussionist,
      });
    }
  }, [fetchedData]);

  return (
    <div className="bg-Radial h-screen bg-[#000000]">
      <Navbar
        isJoinEnabled={isJoinEnabled}
        onPopupToggle={togglePopup}
        isAuthenticated={isAuthenticated}
      />

      <main className="flex justify-center items-center">
        <div className="Content flex flex-col md:flex-row md:justify-between px-4 md:px-10">
          <div className="main-content -space-x-10">
            <img
              src="playmakerslogo.png"
              alt="Playmakers Logo"
              className="logo object-cover"
            />
            <div className="main-text-container">
              <div className=" flex justify-center flex-col pl-7">
                <h1 className="main-text bottom-5 font-lexend font-semibold text-[#fcfafa]">
                  Exploring Music
                  <br />
                  Within You
                </h1>
                <p
                  className="sub-text text-[#7e7e7e] font-poppins mt-4 text-lg cursor-pointer"
                  onClick={() => navigate("/about-us")}
                >
                  About us ➡
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

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
            captchaVerified={captchaVerified}
            handleCaptchaVerify={handleCaptchaVerify}
            modalRef={modalRef}
            today={today}
            isEditMode={isEditMode}
            isViewMode={isViewMode}
            onClose={onClose}
            status={bookingStatus}
            isMusiciansValid={isMusiciansValid}
          />
        </div>
      )}

      {bookingID && (
        <div className="fixed inset-0 bg-grey bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-lg">
          <div className="bg-[#36303C] p-8 rounded-lg shadow-lg w-1/3 relative">
            <p className="text-xl text-white mb-4">
              Booking Successfully Sent!
            </p>
            <div className="flex items-center mb-4">
              <p className="text-sm text-gray-300 mr-2">Your Booking ID:</p>
              <FaInfoCircle
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-gray-300 cursor-pointer"
              />
              {showTooltip && (
                <div className="absolute top-0 right-12 w-64 bg-gray-700 text-white text-sm p-2 rounded-lg shadow-md">
                  Keep this booking ID. You will need this whenever you want to
                  edit, or clarify your booking.
                </div>
              )}
            </div>
            <div className="flex items-center">
              <p className="text-lg text-[#C1C2D3] font-semibold mr-2">
                Booking ID has been sent to your email, check on spam
              </p>
            </div>
            <button
              onClick={() => setBookingID(null)}
              className="w-full bg-[#b70039] text-white py-2 rounded-lg cursor-pointer mt-4"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
