import { useState, useEffect, useRef } from "react";
import { FaQuestion } from "react-icons/fa";

const Tooltip = () => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tooltipRef = useRef(null);

  const toggleTooltip = (e) => {
    e.stopPropagation(); // Prevent click event from propagating
    setIsTooltipOpen((prev) => !prev);
  };

  // Close tooltip when clicking outside
  const handleClickOutside = (e) => {
    if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
      setIsTooltipOpen(false);
    }
  };

  useEffect(() => {
    if (isTooltipOpen) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isTooltipOpen]);

  return (
    <div className="relative">
      {/* Tooltip Icon */}
      <FaQuestion
        className="text-[#5C1B33] cursor-pointer"
        size={20}
        onClick={toggleTooltip}
        aria-expanded={isTooltipOpen}
        aria-describedby="tooltip-content"
      />
      {isTooltipOpen && (
        <div
          ref={tooltipRef}
          id="tooltip-content"
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 p-4 bg-white shadow-lg rounded-lg text-gray-700 text-sm z-50"
          style={{ maxWidth: "90vw" }}
        >
          <p className="mb-2 font-semibold">Member Status Change Rules:</p>
          <ul className="list-disc pl-4">
            <li>
              <span className="font-bold">Case 1:</span> 1 backout ={" "}
              <span className="text-orange-600 font-semibold">Inactive</span>.
            </li>
            <li>
              <span className="font-bold">Case 2:</span> Total participation: 1
              + 1 backout ={" "}
              <span className="text-orange-600 font-semibold">Inactive</span>.
            </li>
            <li>
              <span className="font-bold">Case 3:</span> Participation ≥ 2 in a
              month + 1 backout ={" "}
              <span className="text-green-600 font-semibold">Active</span>.
            </li>
            <li>
              <span className="font-bold">Case 4:</span> Any participation + 2
              backouts in a month ={" "}
              <span className="text-red-600 font-semibold">Probationary</span>.
              <span className="italic">
                (Admin will review the reason for multiple backouts.)
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
