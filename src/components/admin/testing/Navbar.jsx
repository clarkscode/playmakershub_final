import { useState } from "react";
import { FaBars, FaRegWindowClose } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Navbar = ({ isJoinEnabled, onPopupToggle, isAuthenticated }) => {
  const [nav, setNav] = useState(false);

  const navigate = useNavigate();

  const handleNav = () => {
    setNav(!nav);
  };

  return (
    <header className="flex items-center justify-between p-4 shadow-md py-1">
      <div className="hidden md:flex flex-1"></div>

      {/* Centered Navigation */}
      <nav className="hidden md:flex justify-center space-x-20 w-full ">
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
        {isAuthenticated ? (
          <button
            onClick={() => navigate("/playmakershub")}
            className="text-[#FFFFFF] text-4xl font-bold"
          >
            Playmakers Hub
          </button>
        ) : (
          <button
            onClick={() => navigate("/")}
            className="text-[#FFFFFF] text-4xl font-bold"
          >
            Playmakers Hub
          </button>
        )}
        <button
          onClick={onPopupToggle}
          className="text-[#FFFFFF] text-2xl font-medium hover:text-[#a83c70]"
        >
          Booking
        </button>
        <button
          disabled={!isJoinEnabled}
          className={`text-[#FFFFFF] text-2xl font-medium ${
            isJoinEnabled
              ? "hover:text-[#a83c70]"
              : "cursor-not-allowed text-gray-500"
          }`}
          onClick={() => {
            if (isJoinEnabled) {
              navigate("/join");
            }
          }}
        >
          Join us
        </button>
      </nav>

      {/* Login button aligned to the right */}
      {isAuthenticated ? (
        <div></div>
      ) : (
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => navigate("/login")}
            className="font-poppins px-6 py-2 bg-[#992d5e] text-[#ffffff] text-md font-bold hover:bg-[#a83c70] rounded-full"
          >
            Login
          </button>
        </div>
      )}

      {/* For responsive Navigation Bar */}
      <div onClick={handleNav} className="p-4 block md:hidden">
        {nav ? (
          <FaRegWindowClose size={30} color="white" />
        ) : (
          <FaBars size={30} color="white" />
        )}
      </div>

      {/* Mobile menu */}
      <div
        className={`${
          nav
            ? "fixed left-0 top-0 w-[60%] h-full bg-Radial bg-black z-10 flex flex-col p-4 ease-in-out duration-50"
            : "fixed left-[-150%]"
        } md:hidden`}
      >
        <button
          className="text-white text-3xl font-bold mb-4"
          onClick={() => navigate("/")}
        >
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
          onClick={onPopupToggle}
          className="text-white text-2xl font-medium hover:text-[#a83c70] mb-2"
        >
          Booking
        </button>
        <button
          disabled={!isJoinEnabled}
          className={`text-[#FFFFFF] text-2xl font-medium ${
            isJoinEnabled
              ? "hover:text-[#a83c70]"
              : "cursor-not-allowed text-gray-500"
          }`}
          onClick={() => {
            if (isJoinEnabled) {
              navigate("/join");
            }
          }}
        >
          Join us
        </button>
      </div>
    </header>
  );
};

export default Navbar;
