import { useEffect, useState } from "react";
import { StatCard } from "../../../components/admin/StatCard";
import { RecentAddedEvents } from "../../../components/admin/RecentAddedEvents";
import { NewMembersTable } from "../../../components/admin/NewMembersTable";
import { RecentUpdates } from "../../../components/admin/RecentUpdates";
import Sidebar from "../../../components/admin/Sidebar";
import Header from "../../../components/admin/Header";
import { supabase } from "../../../database/supabase";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("recentlyAdded");
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeMembers: 0,
    completedEvents: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("event_id");
      const { data: activeMembers, error: membersError } = await supabase
        .from("users")
        .select("id")
        .eq("participation_status", "Green");
      const { data: completedEvents, error: completedError } = await supabase
        .from("events")
        .select("event_id")
        .eq("event_status", "Completed");

      if (eventsError || membersError || completedError) {
        console.error("Error fetching stats:", {
          eventsError,
          membersError,
          completedError,
        });
        return;
      }

      setStats({
        totalEvents: events.length,
        activeMembers: activeMembers.length,
        completedEvents: completedEvents.length,
      });
    };

    fetchStats();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex bg-[#FBEBF1]">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header Component */}
        <Header title="Dashboard" />

        {/* Dashboard Content */}
        <div className="p-4 animate__animated animate__fadeIn">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="No. of total events" value={stats.totalEvents} />
            <StatCard
              label="No. of active members"
              value={stats.activeMembers}
            />
            <StatCard
              label="No. of completed events"
              value={stats.completedEvents}
            />
          </div>

          {/* Tab Navigation */}
          <div className="mt-8">
            <h2 className="text-lg font-bold text-[#5c1b33]">
              Recent Activity Log
            </h2>
            <div className="flex mt-4 bg-white rounded-lg p-2 stroke-[#A7A9C0]">
              <button
                className={`p-2 text-[#4B4B4C] font-bold px-5 text-sm  ${
                  activeTab === "recentlyAdded"
                    ? "border-b-2 border-[#5C1B33]"
                    : ""
                }`}
                onClick={() => handleTabChange("recentlyAdded")}
              >
                Recently Added Events
              </button>
              <button
                className={`p-2 text-[#4B4B4C] font-bold px-5 text-sm ${
                  activeTab === "newMembers"
                    ? "border-b-2 border-[#5C1B33]"
                    : ""
                }`}
                onClick={() => handleTabChange("newMembers")}
              >
                Newly Joined Members
              </button>
              <button
                className={`p-2 text-[#4B4B4C] font-bold px-5 text-sm ${
                  activeTab === "recentUpdates"
                    ? "border-b-2 border-[#5C1B33]"
                    : ""
                }`}
                onClick={() => handleTabChange("recentUpdates")}
              >
                Recent Updates
              </button>
            </div>
            {/* Content Based sa  Active Tab */}
            <div className="mt-4">
              {activeTab === "recentlyAdded" && <RecentAddedEvents />}
              {activeTab === "newMembers" && <NewMembersTable />}
              {activeTab === "recentUpdates" && <RecentUpdates />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
