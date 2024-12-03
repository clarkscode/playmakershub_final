import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  createBookingProcess,
  fetchBookingStatus,
  supabase,
} from "../../database/supabase";
import BookingForm from "../../components/playmakershub/BookingForm";
// React Icons
import { FaBars, FaRegWindowClose } from 'react-icons/fa';
import sendEmail from "../../database/sendEmail";

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
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email domain validation
    /* const emailDomain = formData.email.split("@")[1];
    if (emailDomain !== "ustp.edu.ph") {
      toast.error("You are not allowed to book.");
      return;
    } */

    // Check if CAPTCHA is verified
    if (!captchaVerified) {
      toast.error("Please complete the CAPTCHA.");
      return;
    }

    try {
      // Call the booking process
      const result = await createBookingProcess(formData);
      const bookingID = result.bookingData[0].booking_id;
      setBookingID(bookingID);

      // email content
      const emailContent = `
          <p>Dear Organizer,</p>
          <p>Your booking for the event titled "${formData.title}" has been successfully created!</p>
          <p>Here is your booking ID: <strong>${bookingID}</strong></p>
          <p>Please remember to keep this booking ID safe. You will need it if you want to make clarifications, updates, or cancellations for your booking.</p>
          <p>Best Regards,<br/>The Playmakers Family</p>
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
          vocalist: data.events[0]?.musicians_required[0]?.vocalists,
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
      toast.error("Booking ID not found.");
      console.error("Error fetching booking data:", error);
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
          vocalists: formData.vocalist,
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
      console.log("fetch booking data", fetchedData);
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

  const [nav, setNav] = useState(false);

const handleNav = () => {
  setNav(!nav);
};

  return (
    <div className="">
  <div>
    <ToastContainer />
    <header className="flex items-center justify-between p-4 shadow-md py-1">
  {/* Mobile Navbar Toggle and Login Button */}
  <div className="flex flex-1 items-center justify-end p-4 md:hidden w-full">
    <button
      onClick={() => navigate("/member/login")}
      className="font-poppins px-6 py-1 bg-[#992d5e] text-[#ffffff] text-md font-bold hover:bg-[#a83c70] rounded-full mr-4"
    >
      Login
    </button>
    <div onClick={handleNav}>
      {nav ? <FaRegWindowClose size={30} color="white" /> : <FaBars size={30} color="white" />}
    </div>
  </div>

  {/* Centered Navigation for Desktop */}
  <nav className="hidden md:flex space-x-20 flex-1 justify-center">
    <button
      onClick={() => navigate("/about-us")}
      className="text-[#FFFFFF] text-2xl font-medium hover:text-[#a83c70]"
    >
      About
    </button>
    <button
      onClick={() => navigate("/homepage/events/published")}
      className="text-[#FFFFFF] text-2xl font-medium hover:text-[#a83c70]"
    >
      Events
    </button>
    <button
      onClick={() => navigate("/")}
      className="text-[#FFFFFF] text-4xl font-bold"
    >
      Playmakers Hub
    </button>
    <button
      onClick={togglePopup}
      className="text-[#FFFFFF] text-2xl font-medium hover:text-[#a83c70]"
    >
      Booking
    </button>
    <button
      disabled={!isJoinEnabled}
      className={`text-[#FFFFFF] text-2xl font-medium ${
        isJoinEnabled ? "hover:text-[#a83c70]" : "cursor-not-allowed text-gray-500"
      }`}
      onClick={() => {
        if (isJoinEnabled) {
          toast.info("Join functionality is coming soon!");
        }
      }}
    >
      Join us
    </button>
  </nav>

  {/* Login Button for Desktop */}
  <div className="hidden md:flex">
    <button
      onClick={() => navigate("/member/login")}
      className="font-poppins px-6 py-2 bg-[#992d5e] text-[#ffffff] text-md font-bold hover:bg-[#a83c70] rounded-full"
    >
      Login
    </button>
  </div>
</header>
  </div>

  {/* Mobile Navigation */}
  <div
    className={`${
      nav
        ? "fixed left-0 top-0 w-[60%] h-full bg-Radial bg-black z-10 flex flex-col p-4 ease-in-out duration-50"
        : "fixed left-[-150%]"
    } md:hidden`}
  >
    <button className="text-white text-3xl font-bold mb-4" onClick={() => navigate("/")}>
      Playmakers Hub
    </button>
    <button
      onClick={() => navigate("/about-us")}
      className="text-white text-2xl font-medium hover:text-[#a83c70] mb-2"
    >
      About
    </button>
    <button
      onClick={() => navigate("/homepage/events/published")}
      className="text-white text-2xl font-medium hover:text-[#a83c70] mb-2"
    >
      Events
    </button>
    <button
      onClick={togglePopup}
      className="text-white text-2xl font-medium hover:text-[#a83c70] mb-2"
    >
      Booking
    </button>
    <button
      disabled={!isJoinEnabled}
      className={`text-[#FFFFFF] text-2xl font-medium ${
        isJoinEnabled ? "hover:text-[#a83c70]" : "cursor-not-allowed text-gray-500"
      }`}
      onClick={() => {
        if (isJoinEnabled) {
          toast.info("Join functionality is coming soon!");
        }
      }}
    >
      Join us
    </button>
  </div>

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
              captchaVerified={captchaVerified}
              handleCaptchaVerify={handleCaptchaVerify}
              modalRef={modalRef}
              today={today}
              isEditMode={isEditMode}
              isViewMode={isViewMode}
              onClose={onClose}
              status={bookingStatus}
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
                    Keep this booking ID. You will need this whenever you want
                    to edit, or clarify your booking.
                  </div>
                )}
              </div>
              <div className="flex items-center">
                <p className="text-lg text-[#C1C2D3] font-semibold mr-2">
                  Booking ID has been sent to your email
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
      </main>
    </div>
  );
};

export default UnauthNavbar;
