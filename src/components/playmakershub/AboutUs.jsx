import React from "react";
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
   const navigate = useNavigate();
   return (
      <div className="font-lexend bg-Radial bg-[#000000] text-white h-screen">
         {/* Header */}
         <header className="flex items-center justify-between p-4 shadow-md py-1 space-x-10 pt-3">
            <div className="flex items-center pl-3 w-3/5">
               <img src="playmakerslogo.png" alt="Logo" className="w-16 h-16" />
               <p className="text-2xl font-medium ml-4">Playmakers Hub</p>
            </div>
            <nav className="flex justify-center space-x-20">
               <a
                  onClick={() => navigate("/")}
                  className="text-[#FFFFFF] text-2xl font-medium hover:text-[#a83c70] cursor-pointer"
               >
                  Home
               </a>
               <a
                  onClick={() => navigate("/homepage/event/approved")}
                  className="text-[#FFFFFF] text-2xl font-medium hover:text-[#a83c70] cursor-pointer"
               >
                  Events
               </a>
               <a
                  onClick={() => navigate("/join")}
                  className="text-[#FFFFFF] text-2xl font-medium hover:text-[#a83c70] cursor-pointer"
               >
                  Join Us
               </a>
            </nav>
         </header>

         {/* Main Content */}
         <div className="bg-Arial px-8 py-10 bg-Radial bg-[#000000]">
            <div className="py-10">
               <h2 className="text-center text-3xl font-bold -mt-10 mb-8">
                  Types of Organizations
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-lg">
                  <div>
                     <p className="text-justify">
                        <span className="font-semibold">
                           University Student Government
                        </span>{" "}
                        is the highest student governing body of the University of
                        Science and Technology of Southern Philippines- CDO Campus. The
                        student government promotes holistic growth and development- an
                        ability which is vitally important in order for its constituents
                        to be capable in facing the demands and challenges of everyday
                        lives.
                     </p>
                  </div>
                  <div>
                     <p className="text-justify">
                        <span className="font-semibold">
                           Curricular Student Organizations
                        </span>{" "}
                        are aligned with academic disciplines and provide support and
                        enrichment activities related to specific fields of study, such
                        as the Student Council of Engineering and Architecture and the
                        Student Council of Science and Mathematics. These organizations
                        enhance student's learning in a certain academic discipline
                        through the conduct of special lecture series, symposia,
                        exhibits and other learning activities.
                     </p>
                  </div>
                  <div>
                     <p className="text-justify">
                        <span className="font-semibold">
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
                  <i className="fa fa-question-circle text-6xl mr-6"></i>
                  <p className="text-lg">
                     The Playmakers-USTP Music Organization, founded by Mark Gonzales
                     in 2013 and currently having Engr. Jerry Halibas as a coordinator,
                     is part of the Arts and Culture Division. With its 80 dedicated
                     members, Playmakers - USTP is responsible for organizing and
                     managing participants for music-related campus events such as
                     performances, concerts, and music competitions.
                  </p>
               </div>
               <div id="events" className="mb-10 flex items-start">
                  <i className="fa fa-calendar text-6xl mr-6"></i>
                  <p className="text-lg">
                     Playmakers manages around three to four events each month, which
                     is a significant workload considering the members are also
                     students with academic responsibilities and having a frequency of
                     three times a week practices for an upcoming event. Below is an
                     example of an event done by members.
                  </p>
               </div>
               <div className="mt-10 flex items-start">
                  <i className="fa fa-user-plus text-6xl mr-6"></i>
                  <p className="text-lg">
                     For details on joining the organization, follow our Facebook page
                     by clicking{" "}
                     <a
                        href="https://www.facebook.com/PlaymakersMusicOrganization"
                        className="underline font-bold"
                        target="_blank"
                        rel="noopener noreferrer"
                     >
                        this link.
                     </a>
                  </p>
               </div>
            </section>
         </div>
      </div>
   );
};

export default AboutUs;
