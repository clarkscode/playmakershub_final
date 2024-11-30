import PlaymakersLayout from "../../../components/playmakershub/PlaymakersLayout";

const PlaymakersHome = () => {
  const content = (
    <div className="flex justify-center items-center">
          <div className="main-content -space-x-10">
            <img
              src="playmakerslogo.png"
              alt="Playmakers Logo"
              className="logo object-cover"
            />
            <div className="main-text-container">
              <div className="pr-20">
                <h1 className="main-text bottom-5 font-lexend font-semibold text-[#fcfafa]">
                  Exploring Music
                  <br />
                  Within You
                </h1>
              </div>
            </div>
          </div>
        </div>
  );

  return <PlaymakersLayout content={content} />;
};

export default PlaymakersHome;
