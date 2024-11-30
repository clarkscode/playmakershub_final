import { useNavigate } from "react-router-dom";
import { FaQuestion, FaExclamation } from "react-icons/fa";

// Importing the images
import CurricularImg from "../../assets/AboutUs/Curricular.png";
import NonCurricularImg from "../../assets/AboutUs/Non-curricular.png";
import USGImg from "../../assets/AboutUs/USG.png";

const AboutUs = () => {
  const navigate = useNavigate();
  return (
    <div className="font-lexend bg-Radial bg-[#000000] text-white h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-4 shadow-md space-x-10 pt-2 py-1 pb-2">
        <div className="flex items-center pl-3 w-3/5">
          <img src="playmakerslogo.png" alt="Logo" className="w-16 h-16" />
          <p className="text-2xl font-bold ml-4">Playmakers Hub</p>
        </div>
        <nav className="flex justify-center space-x-20">
          <a
            onClick={() => navigate("/")}
            className="text-[#FFFFFF] text-2xl font-medium hover:text-[#a83c70] cursor-pointer"
          >
            Home
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <div className="bg-lexend px-8 py-10 bg-Radial bg-[#000000]">
        <div className="py-10">
          <h2 className="text-center text-4xl font-bold -mt-10 mb-8 font-lexend">
            Types of Organizations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xl">
            <div className="flex flex-col items-center">
              <img src={USGImg} alt="USG" className="w-40 h-40" />
              <p className="text-justify">
                <span className="font-bold">University Student Government</span>{" "}
                is the highest student governing body of the University of
                Science and Technology of Southern Philippines- CDO Campus. The
                student government promotes holistic growth and development- an
                ability which is vitally important in order for its constituents
                to be capable in facing the demands and challenges of everyday
                lives.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <img src={CurricularImg} alt="Curricular" className="w-40 h-40" />
              <p className="text-justify">
                <span className="font-bold">
                  Curricular Student Organizations
                </span>
                are aligned with academic disciplines and provide support and
                enrichment activities related to specific fields of study, such
                as the Student Council of Engineering and Architecture and the
                Student Council of Science and Mathematics. These organizations
                enhance student&apos;s learning in a certain academic discipline
                through the conduct of special lecture series, symposia,
                exhibits and other learning activities.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <img
                src={NonCurricularImg}
                alt="Non-Curricular"
                className="w-40 h-40"
              />
              <p className="text-justify">
                <span className="font-bold">
                  Non-Curricular Student Organizations
                </span>{" "}
                focus on extracurricular interests such as arts, culture,
                leadership, and community service, including the University City
                Scholars - USTP, and the Google Developer Student Clubs USTP.
                The Arts and Culture Division falls into the category of
                non-curricular student organization includes groups dedicated to
                artistic and cultural expression, such as the Gintong Amihan
                Dance Troupe, and Playmakers.
              </p>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <section className="py-10">
          <div id="about" className="mb-10 flex items-start">
            {/* Icon with Circular Background */}
            <div className="flex-shrink-0 flex items-center justify-center mr-4 bg-gray-800 rounded-full w-20 h-20">
              <FaQuestion className="text-3xl text-white" />
            </div>
            <p className="text-xl leading-relaxed">
              The Playmakers-USTP Music Organization, founded by Mark Gonzales
              in 2013 and currently having Engr. Jerry Halibas as a coordinator,
              is part of the Arts and Culture Division. With its 80 dedicated
              members, Playmakers - USTP is responsible for organizing and
              managing participants for music-related campus events such as
              performances, concerts, and music competitions.
            </p>
          </div>

          <div id="events" className="mb-10 flex items-start">
            {/* Icon with Circular Background */}
            <div className="flex-shrink-0 flex items-center justify-center mr-4 bg-gray-800 rounded-full w-20 h-20">
              <FaExclamation className="text-3xl text-white" />
            </div>
            <p className="text-xl leading-relaxed">
              Playmakers manages around three to four events each month, which
              is a significant workload considering the members are also
              students with academic responsibilities and having a frequency of
              three times a week practices for an upcoming event. Examples of
              events include the Opening Act for Intramurals, SwiftiesNight
              2023, SCITC General Assembly, and more.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
