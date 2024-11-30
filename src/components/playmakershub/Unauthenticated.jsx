import UnauthNavbar from "./UnauthNavbar";
import DoneEvents from "./DoneEvents";

const Unauthenticated = () => {
  return (
    <div className="p-0 bg-Radial h-screen bg-[#000000]">
      <UnauthNavbar />
      {/* Tab Buttons */}
      <div>
        <button className="text-white font-bold text-xl p-5 -mb-5 pl-10">
          Published Events
        </button>
      </div>
      <div className="p-6 -mt-4">
        <DoneEvents />
      </div>
    </div>
  );
};

export default Unauthenticated;
