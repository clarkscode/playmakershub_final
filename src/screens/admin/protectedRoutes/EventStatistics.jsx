// /* eslint-disable react-hooks/exhaustive-deps */
// import { useEffect, useState } from "react";
// import { Bar, Line } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   ArcElement,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { supabase } from "../../../database/supabase"; // Adjust as needed
// import Sidebar from "../../../components/admin/Sidebar";
// import Header from "../../../components/admin/Header";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   ArcElement,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const EventStatistics = () => {
//   const [chartData, setChartData] = useState(null);
//   const [participantsChartData, setParticipantsChartData] = useState(null);
//   const [eventDurationChartData, setEventDurationChartData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchEventData();
//   }, []);

//   const fetchEventData = async () => {
//     try {
//       setLoading(true);

//       const { data: events, error: eventError } = await supabase
//         .from("events")
//         .select("*");
//       const { data: participants, error: participantsError } = await supabase
//         .from("participation")
//         .select("*");

//       if (eventError || participantsError) {
//         setError(eventError?.message || participantsError?.message);
//         return;
//       }

//       processEventData(events);
//       processParticipantsData(events, participants);
//       processEventDurations(events);
//     } catch (err) {
//       setError("An unexpected error occurred.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const processEventData = (events) => {
//     const genreCounts = {};

//     events.forEach((event) => {
//       if (event.genre) {
//         genreCounts[event.genre] = (genreCounts[event.genre] || 0) + 1;
//       } else {
//         genreCounts["No Genre"] = (genreCounts["No Genre"] || 0) + 1;
//       }
//     });

//     const genres = Object.keys(genreCounts);
//     const counts = Object.values(genreCounts);

//     setChartData({
//       labels: genres,
//       datasets: [
//         {
//           label: "Number of Events",
//           data: counts,
//           backgroundColor: "rgba(75, 192, 192, 0.6)",
//           borderColor: "rgba(75, 192, 192, 1)",
//           borderWidth: 1,
//         },
//       ],
//     });
//   };

//   const processParticipantsData = (events, participants) => {
//     const eventParticipationCounts = events.map((event) => {
//       const count = participants.filter(
//         (p) => p.event_id === event.event_id
//       ).length;
//       return {
//         eventTitle: event.event_title,
//         count,
//       };
//     });

//     setParticipantsChartData({
//       labels: eventParticipationCounts.map((ep) => ep.eventTitle),
//       datasets: [
//         {
//           label: "Participants",
//           data: eventParticipationCounts.map((ep) => ep.count),
//           backgroundColor: "rgba(255, 99, 132, 0.6)",
//           borderColor: "rgba(255, 99, 132, 1)",
//           borderWidth: 1,
//         },
//       ],
//     });
//   };

//   const processEventDurations = (events) => {
//     const durations = events.map((event) => {
//       const start = new Date(`${event.start_date}T${event.start_time}`);
//       const end = new Date(`${event.end_date}T${event.end_time}`);
//       const durationHours = Math.abs(end - start) / (1000 * 60 * 60); // Calculate duration in hours
//       return {
//         eventTitle: event.event_title,
//         duration: durationHours,
//       };
//     });

//     setEventDurationChartData({
//       labels: durations.map((d) => d.eventTitle),
//       datasets: [
//         {
//           label: "Event Duration (hours)",
//           data: durations.map((d) => d.duration),
//           backgroundColor: "rgba(54, 162, 235, 0.6)",
//           borderColor: "rgba(54, 162, 235, 1)",
//           borderWidth: 1,
//         },
//       ],
//     });
//   };

//   if (loading) return <p>Loading...</p>;
//   if (error) return <p className="text-red-500">Error: {error}</p>;

//   return (
//     <div className="min-h-screen flex bg-[#FBEBF1]">
//       <Sidebar />
//       <div className="flex-1">
//         <Header title="Event Statistics" />
//         <div className="p-6 space-y-8">
//           {/* Genre Chart */}
//           <div className="p-5 bg-white shadow rounded-lg">
//             <h2 className="text-lg font-semibold text-gray-700 mb-4">
//               Number of Events per Genre
//             </h2>
//             {chartData ? (
//               <Bar data={chartData} />
//             ) : (
//               <p>No data available to display.</p>
//             )}
//           </div>

//           {/* Participants Chart */}
//           <div className="p-5 bg-white shadow rounded-lg">
//             <h2 className="text-lg font-semibold text-gray-700 mb-4">
//               Participants per Event
//             </h2>
//             {participantsChartData ? (
//               <Bar data={participantsChartData} />
//             ) : (
//               <p>No data available to display.</p>
//             )}
//           </div>

//           {/* Event Duration Chart */}
//           <div className="p-5 bg-white shadow rounded-lg">
//             <h2 className="text-lg font-semibold text-gray-700 mb-4">
//               Event Duration (in Hours)
//             </h2>
//             {eventDurationChartData ? (
//               <Line data={eventDurationChartData} />
//             ) : (
//               <p>No data available to display.</p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EventStatistics;

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
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
} from "chart.js";
import { supabase } from "../../../database/supabase"; // Adjust path as needed
import Sidebar from "../../../components/admin/Sidebar";
import Header from "../../../components/admin/Header";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const EventStatistics = () => {
  const [chartData, setChartData] = useState(null); // Monthly Events
  const [eventDistributionData, setEventDistributionData] = useState(null); // Event Types (Pie Chart)
  const [participantsChartData, setParticipantsChartData] = useState(null); // Participants per Event
  const [eventDurationChartData, setEventDurationChartData] = useState(null); // Event Duration
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    try {
      setLoading(true);

      const { data: events, error: eventError } = await supabase
        .from("events")
        .select("*");
      const { data: participants, error: participantsError } = await supabase
        .from("participation")
        .select("*");

      if (eventError || participantsError) {
        setError(eventError?.message || participantsError?.message);
        return;
      }

      processMonthlyEventData(events);
      processEventDistributionData(events);
      processParticipantsData(events, participants);
      processEventDurations(events);
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Process Monthly Events for Bar Chart
  const processMonthlyEventData = (events) => {
    const months = Array(12).fill(0); // Create an array with 12 zero values for each month

    events.forEach((event) => {
      const monthIndex = new Date(event.start_date).getMonth(); // Get the month index (0 for Jan, 11 for Dec)
      months[monthIndex] += 1; // Increment the count for that month
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

  // Process Event Distribution for Pie Chart
  const processEventDistributionData = (events) => {
    const departmentEvents = events.filter(
      (event) => event.event_type === "department"
    ).length;
    const organizationEvents = events.filter(
      (event) => event.event_type === "organization"
    ).length;

    setEventDistributionData({
      labels: ["Department Events", "Organization Events"],
      datasets: [
        {
          label: "Event Distribution",
          data: [departmentEvents, organizationEvents],
          backgroundColor: ["#FF6384", "#36A2EB"],
          borderColor: ["#FF6384", "#36A2EB"],
        },
      ],
    });
  };

  // Process Participants Data for Bar Chart
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

  // Process Event Durations for Line Chart
  const processEventDurations = (events) => {
    const durations = events.map((event) => {
      const start = new Date(`${event.start_date}T${event.start_time}`);
      const end = new Date(`${event.end_date}T${event.end_time}`);
      const durationHours = Math.abs(end - start) / (1000 * 60 * 60); // Calculate duration in hours
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="min-h-screen flex bg-[#FBEBF1]">
      <Sidebar />
      <div className="flex-1">
        <Header title="Event Statistics" />
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Event Distribution Chart */}
          <div className="p-5 bg-white shadow rounded-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Monthly Event Distribution Chart
            </h2>
            {chartData ? (
              <Bar data={chartData} />
            ) : (
              <p>No data available to display.</p>
            )}
          </div>

          {/* Event Distribution Pie Chart */}
          <div className="p-5 bg-white shadow rounded-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Event Statistics
            </h2>
            {eventDistributionData ? (
              <Pie data={eventDistributionData} />
            ) : (
              <p>No data available to display.</p>
            )}
          </div>

          {/* Participants per Event */}
          <div className="p-5 bg-white shadow rounded-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Participants per Event
            </h2>
            {participantsChartData ? (
              <Bar data={participantsChartData} />
            ) : (
              <p>No data available to display.</p>
            )}
          </div>

          {/* Event Duration */}
          <div className="p-5 bg-white shadow rounded-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Event Duration (in Hours)
            </h2>
            {eventDurationChartData ? (
              <Line data={eventDurationChartData} />
            ) : (
              <p>No data available to display.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventStatistics;
