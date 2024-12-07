/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
} from "chart.js";
import { supabase } from "../../../database/supabase";
import Sidebar from "../../../components/admin/Sidebar";
import Header from "../../../components/admin/Header";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
);

const EventStatistics = () => {
  // Chart data states
  const [chartData, setChartData] = useState(null); // Monthly Events
  const [eventDistributionData, setEventDistributionData] = useState(null); // Event Distribution (Pie Chart)
  const [participantsChartData, setParticipantsChartData] = useState(null); // Participants per Event
  const [eventDurationChartData, setEventDurationChartData] = useState(null); // Event Duration
  const [feedbackChartData, setFeedbackChartData] = useState(null); // Feedback Ratings
  const [feedbackSentimentData, setFeedbackSentimentData] = useState(null); // Feedback Sentiment

  // Loading and Error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all event-related data
  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        const { data: events, error: eventError } = await supabase.from(
          "events"
        ).select(`
          *,
          bookings (event_type)
        `);
        /* 
        join ang events and bookings table para makuha ang event_type
        */

        const { data: participants, error: participantsError } = await supabase
          .from("participation")
          .select("*");

        if (eventError || participantsError) {
          throw new Error(
            eventError?.message || participantsError?.message || "Fetch error"
          );
        }

        // Process the data for the charts
        processMonthlyEventData(events);
        processEventDistributionData(events);
        processParticipantsData(events, participants);
        processEventDurations(events);
      } catch (err) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchFeedbackData = async () => {
      try {
        const { data: feedbackData, error: feedbackError } = await supabase
          .from("event_feedback")
          .select("*");

        if (feedbackError) {
          throw new Error(feedbackError.message);
        }

        processFeedbackChartData(feedbackData); // Process feedback data
        processFeedbackSentiment(feedbackData); // Process feedback sentiment
      } catch (err) {
        setError(err.message || "Failed to fetch feedback data.");
      }
    };

    fetchFeedbackData();

    fetchEventData();
  }, []);

  // Helper function: Process Monthly Events for Bar Chart
  const processMonthlyEventData = (events) => {
    const months = Array(12).fill(0); // 12 months array

    events.forEach((event) => {
      const monthIndex = new Date(event.start_date).getMonth();
      // Get the month index
      months[monthIndex] += 1;
      // Increment the count for that month
    });

    setChartData({
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Number of Events",
          data: months,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    });
  };

  const processFeedbackChartData = (feedbackData) => {
    const categories = [
      "effort_rating",
      "quality_rating",
      "communication_rating",
      "technicality_rating",
      "overall_rating",
    ];
    const categoryAverages = categories.map((category) => {
      const total = feedbackData.reduce(
        (sum, feedback) => sum + feedback[category],
        0
      );
      return (total / feedbackData.length).toFixed(2); // Average rating
    });

    setFeedbackChartData({
      labels: ["Effort", "Quality", "Communication", "Technicality", "Overall"],
      datasets: [
        {
          label: "Average Ratings",
          data: categoryAverages,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
          ],
          borderColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
          borderWidth: 1,
        },
      ],
    });
  };

  const processFeedbackSentiment = (feedbackData) => {
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };

    feedbackData.forEach((feedback) => {
      const avgRating =
        (feedback.effort_rating +
          feedback.quality_rating +
          feedback.communication_rating +
          feedback.technicality_rating +
          feedback.overall_rating) /
        5;

      if (avgRating >= 4) sentimentCounts.positive += 1;
      else if (avgRating === 3) sentimentCounts.neutral += 1;
      else sentimentCounts.negative += 1;
    });

    setFeedbackSentimentData({
      labels: ["Positive", "Neutral", "Negative"],
      datasets: [
        {
          label: "Feedback Sentiment",
          data: [
            sentimentCounts.positive,
            sentimentCounts.neutral,
            sentimentCounts.negative,
          ],
          backgroundColor: ["#36A2EB", "#FFCE56", "#FF6384"],
        },
      ],
    });
  };

  // Helper function: Process Event Distribution for Pie Chart
  const processEventDistributionData = (events) => {
    const departmentEvents = events.filter(
      (event) => event.bookings?.event_type === "Department"
    ).length;

    const organizationEvents = events.filter(
      (event) => event.bookings?.event_type === "Organization"
    ).length;

    setEventDistributionData({
      labels: ["Department Events", "Organization Events"],
      datasets: [
        {
          label: "Event Distribution",
          data: [departmentEvents, organizationEvents],
          backgroundColor: ["#FF6384", "#36A2EB"],
          borderColor: ["#FF6384", "#36A2EB"],
          borderWidth: 1,
        },
      ],
    });
  };

  // Helper function: Process Participants Data for Bar Chart
  const processParticipantsData = (events, participants) => {
    const eventParticipationCounts = events.map((event) => {
      const count = participants.filter(
        (p) => p.event_id === event.event_id
      ).length;
      return {
        eventTitle: event.event_title,
        count,
      };
    });

    setParticipantsChartData({
      labels: eventParticipationCounts.map((ep) => ep.eventTitle),
      datasets: [
        {
          label: "Participants per Event",
          data: eventParticipationCounts.map((ep) => ep.count),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    });
  };

  // Helper function: Process Event Durations for Line Chart
  const processEventDurations = (events) => {
    const durations = events.map((event) => {
      const start = new Date(`${event.start_date}T${event.start_time}`);
      const end = new Date(`${event.end_date}T${event.end_time}`);
      const durationHours = Math.abs(end - start) / (1000 * 60 * 60);
      // Calculate duration in hours
      return {
        eventTitle: event.event_title,
        duration: durationHours,
      };
    });

    setEventDurationChartData({
      labels: durations.map((d) => d.eventTitle),
      datasets: [
        {
          label: "Event Duration (hours)",
          data: durations.map((d) => d.duration),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    });
  };

  // Render error message
  if (error) {
    /* return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBEBF1]">
        <p className="text-red-500 font-bold text-lg">{error}</p>
      </div>
    ); */
    console.log("EVENT STATISTICS ERROR0", error);
  }

  return (
    <div className="min-h-screen flex bg-[#FBEBF1]">
      <Sidebar />
      <div className="flex-1">
        <Header title="Event Statistics" />
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center bg-[#FBEBF1]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-500"></div>
            <p className="ml-4 text-lg text-gray-700 font-medium">Loading...</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Event Distribution Chart */}
            <ChartContainer title="Monthly Event Distribution Chart">
              <div>
                {/* Bar Chart */}
                <Bar data={chartData} />
                {/* Year with Icon */}
                <div className="flex justify-center items-center mt-4">
                  {/* MUI Icon */}
                  <CheckCircleIcon
                    style={{ color: "#7B1D3F", fontSize: "16px" }}
                    className="mr-2"
                  />
                  {/* Year Text */}
                  <p className="text-gray-700 text-lg">
                    <span className="font-medium">Year</span>{" "}
                    <span className="text-[#7B1D3F] font-bold">
                      {new Date().getFullYear()}
                    </span>
                  </p>
                </div>
              </div>
            </ChartContainer>

            {/* Event Distribution Pie Chart */}
            <div className=" w-full max-w-[400px] ">
              <ChartContainer title="Event Statistics">
                {eventDistributionData ? (
                  <Doughnut
                    data={eventDistributionData}
                    key={JSON.stringify(eventDistributionData)}
                    options={{
                      responsive: true, // Keep it responsive
                    }}
                  />
                ) : (
                  <p>No data available for the chart</p>
                )}
              </ChartContainer>
            </div>

            {/* Participants per Event */}
            <ChartContainer title="Participants per Event">
              <Bar data={participantsChartData} />
            </ChartContainer>

            {/* Event Duration */}
            <ChartContainer title="Event Duration (in Hours)">
              <Line data={eventDurationChartData} />
            </ChartContainer>

            {/* Feedback Ratings */}
            <ChartContainer title="Average Feedback Ratings">
              <Bar data={feedbackChartData} />
            </ChartContainer>

            {/* Feedback Sentiment */}
            <ChartContainer title="Feedback Sentiment">
              <Doughnut data={feedbackSentimentData} />
            </ChartContainer>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Chart Container Component
const ChartContainer = ({ title, children }) => (
  <div className="p-5 bg-white shadow rounded-lg">
    <h2 className="text-lg font-semibold text-gray-700 mb-4">{title}</h2>
    {children}
  </div>
);

export default EventStatistics;
