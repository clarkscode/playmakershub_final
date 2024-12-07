import { useState } from "react";

const EventFeedback = ({ onSubmitFeedback }) => {
  const [feedback, setFeedback] = useState({
    effort: 0,
    quality: 0,
    communication: 0,
    technicality: 0,
    overall: 0,
    comments: "",
  });
  const [isFocused, setIsFocused] = useState(false);

  const emojiMap = {
    1: "😡 Very Bad",
    2: "😟 Bad",
    3: "😐 Okay",
    4: "🙂 Good",
    5: "😄 Very Good",
  };

  const handleRatingChange = (field, value) => {
    setFeedback({ ...feedback, [field]: value });
  };

  const handleCommentChange = (e) => {
    setFeedback({ ...feedback, comments: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmitFeedback) onSubmitFeedback(feedback);
  };

  return (
    <div>
      <div className="p-6 bg-gradient-to-r from-[#C2396C] to-[#5C1B33]">
        <h2 className="text-xl font-bold text-white mb-2">
          Playmakers Event Feedback
        </h2>
      </div>
      <div className="bg-white rounded-lg p-6 shadow-md mt-6">
        <form onSubmit={handleSubmit}>
          {/* Feedback Questions */}
          {[
            "effort",
            "quality",
            "communication",
            "technicality",
            "overall",
          ].map((field, index) => (
            <div key={index} className="mb-6">
              <label
                className="block text-lg font-medium text-gray-700 mb-2"
                htmlFor={field}
              >
                {field === "effort"
                  ? "1. How would you rate the members' effort and involvement in the activity or project?"
                  : field === "quality"
                  ? "2. How would you rate the quality of work and skills during the activity or project?"
                  : field === "communication"
                  ? "3. How well did team members work and communicate with each other?"
                  : field === "technicality"
                  ? "4. How well were technicalities handled?"
                  : "5. How would you rate your overall experience with the event?"}
              </label>
              <div className="flex items-center space-x-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`w-12 h-12 flex justify-center items-center rounded-full border text-lg ${
                      feedback[field] === value
                        ? "bg-[#A83C70] text-white"
                        : "border-gray-300 text-gray-700"
                    }`}
                    onClick={() => handleRatingChange(field, value)}
                  >
                    {value === 1
                      ? "😡"
                      : value === 2
                      ? "😟"
                      : value === 3
                      ? "😐"
                      : value === 4
                      ? "🙂"
                      : "😄"}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {emojiMap[feedback[field]] || "Rate your experience"}
              </p>
            </div>
          ))}

          {/* Additional Comments */}
          <div className="mb-6">
            <label
              className="block text-lg font-medium text-gray-700 mb-2"
              htmlFor="comments"
            >
              Additional Comments
            </label>
            <textarea
              id="comments"
              rows="4"
              className={`w-full p-2 rounded-lg border ${
                isFocused
                  ? "border-gray-300 focus:ring-[#A83C70]"
                  : feedback.comments === ""
                  ? "border-gray-300"
                  : "border-red-500"
              } focus:border-[#A83C70] focus:ring-[#A83C70]`}
              placeholder="Type your comments here..."
              value={feedback.comments}
              onChange={handleCommentChange}
              onFocus={() => setIsFocused(true)} // Set focus to true
              onBlur={() => setIsFocused(false)} // Set focus to false
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-[#A83C70] text-white py-2 px-8 hover:bg-[#8e325b] transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default EventFeedback;
