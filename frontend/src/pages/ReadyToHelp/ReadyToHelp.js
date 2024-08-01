import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import './ReadyToHelp.css';
import ReadyToHelpImg from '../../assets/images/readyToHelp.png';
import FormboldSVG from '../../assets/images/formbold.svg';

const ReadyToHelp = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  return (
    <section className="ready-to-help">
      <div className="ready-to-help-content">
        <h2>We are ready to help</h2>
        <p>There are many variations of passages of Lorem Ipsum available but the majority have suffered alteration in some form.</p>
        <div className="video-container">       
          <img src={ReadyToHelpImg} alt="Video Thumbnail" width={"100%"} height={"100%"} style={{position: "absolute",left: "0",zIndex: "-1"}}/>        
          <ReactPlayer
            url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" // Replace with your actual video URL
            width="100%"
            height="100%"
            playing={isPlaying}
            controls={isPlaying}
            light="/path-to-your-video-thumbnail.jpg" // Replace with your actual thumbnail path
            playIcon={
              <button className="play-button" aria-label="Play video">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 3L19 12L5 21V3Z" fill="white"/>
                </svg>
              </button>
            }
            onClickPreview={handlePlayClick}
          />
        </div>
      </div>
      <div className="company-logos">
        <img alt="Formbold" loading="lazy" decoding="async" src={FormboldSVG} style={{ width: "100%", inset: 0, color: "transparent" }} />
        <img alt="Formbold" loading="lazy" decoding="async" src={FormboldSVG} style={{ width: "100%", inset: 0, color: "transparent" }} />
        <img alt="Formbold" loading="lazy" decoding="async" src={FormboldSVG} style={{ width: "100%", inset: 0, color: "transparent" }} />
        <img alt="Formbold" loading="lazy" decoding="async" src={FormboldSVG} style={{ width: "100%", inset: 0, color: "transparent" }} />
        <img alt="Formbold" loading="lazy" decoding="async" src={FormboldSVG} style={{ width: "100%", inset: 0, color: "transparent" }} />                
        <img alt="Formbold" loading="lazy" decoding="async" src={FormboldSVG} style={{ width: "100%", inset: 0, color: "transparent" }} />
      </div>
    </section>
  );
};

export default ReadyToHelp;