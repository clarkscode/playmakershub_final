import React from "react";

const Join = () => {
   return (
      <main className="min-h-screen bg-Radial bg-[#000000] flex flex-col items-center justify-center text-white">
         <h1 className="text-5xl font-bold mb-8 mt-10">Playmakers Entry Form</h1>
         <form className="w-full max-w-3xl bg-gray-800 p-8 rounded-lg shadow-md mb-10">
            <fieldset className="space-y-4">
               <label htmlFor="name" className="block">
                  Name
                  <input
                     type="text"
                     id="name"
                     name="name"
                     placeholder="Enter your full name"
                     className="w-full mt-1 p-3 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#D91E4B]"
                     required
                  />
               </label>
               <label htmlFor="email" className="block">
                  Email
                  <input
                     type="email"
                     id="email"
                     name="email"
                     placeholder="Enter your Email"
                     className="w-full mt-1 p-3 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#D91E4B]"
                     required
                  />
               </label>
               <label htmlFor="age" className="block">
                  Age (optional)
                  <input
                     type="number"
                     id="age"
                     name="age"
                     min="10"
                     max="120"
                     placeholder="Age"
                     className="w-full mt-1 p-3 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#D91E4B]"
                  />
               </label>
               <label htmlFor="role" className="block">
                  What is your primary role as a musician?
                  <select
                     id="role"
                     name="role"
                     className="w-full mt-1 p-3 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#D91E4B]"
                  >
                     <option value="">(Select Role)</option>
                     <option value="1">Guitarist</option>
                     <option value="2">Percussionist</option>
                     <option value="3">Keyboardist</option>
                     <option value="4">Vocalist</option>
                  </select>
               </label>
            </fieldset>

            <fieldset className="mt-8 space-y-2">
               <legend className="text-lg font-semibold">
                  Are you open to play other roles? (required)
               </legend>
               <label className="block">
                  <input
                     type="radio"
                     value="open"
                     name="role-flexibility"
                     defaultChecked
                     className="mr-2"
                  />
                  Yes, I am.
               </label>
               <label className="block">
                  <input
                     type="radio"
                     value="close"
                     name="role-flexibility"
                     className="mr-2"
                  />
                  No, I'm not.
               </label>
            </fieldset>

            <fieldset className="mt-8 space-y-2">
               <legend className="text-lg font-semibold">
                  If Yes, what are some other roles you can play? <br /> (Select all
                  that apply)
               </legend>
               {["Guitarist", "Percussionist", "Keyboardist", "Vocalist"].map(
                  (role, index) => (
                     <label key={index} className="block">
                        <input
                           type="checkbox"
                           value={index + 1}
                           name="other-roles"
                           className="mr-2"
                        />
                        {role}
                     </label>
                  )
               )}
            </fieldset>

            <fieldset className="mt-8 space-y-4">
               <label htmlFor="expectations" className="block">
                  What are the expectations you have in Playmakers?
                  <textarea
                     id="expectations"
                     name="expectations"
                     rows="5"
                     placeholder="My expectations in Playmakers are ..... "
                     className="w-full mt-1 p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#D91E4B]"
                  ></textarea>
               </label>

               <button
                  type="submit"
                  className="block w-full py-3 bg-[#992d5e] text-white font-bold rounded-lg hover:bg-[#2618A7] hover:bg-opacity-80 transition duration-200"
               >
                  Submit
               </button>
            </fieldset>
         </form>
      </main>
   );
};

export default Join;
