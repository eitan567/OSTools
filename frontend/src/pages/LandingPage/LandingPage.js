import React, { useState } from 'react';
import './LandingPage.css';
import Header from '../../components/layout/Header';
import MainFeatures from '../MainFeatures';
import PricingSection from '../PricingSection';
import Footer from '../../components/layout/Footer';
import ReadyToHelp from '../ReadyToHelp';
import ProductShowcase from '../ProductShowcase';
import UserTestimonials from '../UserTestimonials';
import LatestBlogs from '../LatestBlogs';
import TicketForm from '../TicketForm';
import SignIn from '../SignIn';
import SignUp from '../SignUp';

const LandingPage = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleSignInClick = () => setShowSignIn(true);
  const handleSignUpClick = () => setShowSignUp(true);
  const closePopup = () => {
    setShowSignIn(false);
    setShowSignUp(false);
  };

  return (
    <div className="landing-page"> 
      <Header onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />
      <main>
      <div className="box">
        <div className="wave -one" />
        <div className="wave -two" />
        <div className="wave -three" />
      </div>
        {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 911" preserveAspectRatio="xMidYMid slice" height="500px" width="100%" style={{ position: "absolute", shapeRendering: "auto", opacity: "80%", height: "100%", width: "100%" }}>
          <defs>
            <linearGradient y2="0" y1="0" x2="1" x1="0" id="lg-nq4q5u6dq7r">
              <stop offset="0" stop-color="#ff00ff"></stop>
              <stop offset="1" stop-color="#00ffff"></stop>
            </linearGradient>
          </defs>
          <g transform="translate(0, -150) scale(1, 0.8)">
            <path opacity="0.4" fill="url(#lg-nq4q5u6dq7r)" d="M 0 0 L 0 526.812 Q 192 625.751 384 584.731 T 768 402.047 T 1152 437.688 T 1536 404.443 T 1920 216.993 L 1920 0 Z">
              <animate attributeName="d" dur="12s" repeatCount="indefinite" values="
                M 0 0 L 0 526.812 Q 192 625.751 384 584.731 T 768 402.047 T 1152 437.688 T 1536 404.443 T 1920 216.993 L 1920 0 Z;
                M 0 0 L 0 526.812 Q 192 725.751 384 484.731 T 768 352.047 T 1152 487.688 T 1536 454.443 T 1920 316.993 L 1920 0 Z;
                M 0 0 L 0 526.812 Q 192 525.751 384 684.731 T 768 502.047 T 1152 387.688 T 1536 304.443 T 1920 116.993 L 1920 0 Z;
                M 0 0 L 0 526.812 Q 192 625.751 384 584.731 T 768 402.047 T 1152 437.688 T 1536 404.443 T 1920 216.993 L 1920 0 Z"/>
            </path>
            <path opacity="0.4" fill="url(#lg-nq4q5u6dq7r)" d="M 0 0 L 0 540.954 Q 192 555.733 384 531.455 T 768 533.718 T 1152 471.691 T 1536 328.092 T 1920 333.31 L 1920 0 Z">
              <animate attributeName="d" dur="12s" repeatCount="indefinite" values="
                M 0 0 L 0 540.954 Q 192 555.733 384 531.455 T 768 533.718 T 1152 471.691 T 1536 328.092 T 1920 333.31 L 1920 0 Z;
                M 0 0 L 0 540.954 Q 192 655.733 384 431.455 T 768 433.718 T 1152 371.691 T 1536 428.092 T 1920 433.31 L 1920 0 Z;
                M 0 0 L 0 540.954 Q 192 455.733 384 631.455 T 768 633.718 T 1152 571.691 T 1536 228.092 T 1920 233.31 L 1920 0 Z;
                M 0 0 L 0 540.954 Q 192 555.733 384 531.455 T 768 533.718 T 1152 471.691 T 1536 328.092 T 1920 333.31 L 1920 0 Z"/>
            </path>
            <path opacity="0.4" fill="url(#lg-nq4q5u6dq7r)" d="M 0 0 L 0 625.681 Q 192 594.05 384 567.97 T 768 436.421 T 1152 503.34 T 1536 342.61 T 1920 284.21 L 1920 0 Z">
              <animate attributeName="d" dur="12s" repeatCount="indefinite" values="
                M 0 0 L 0 625.681 Q 192 594.05 384 567.97 T 768 436.421 T 1152 503.34 T 1536 342.61 T 1920 284.21 L 1920 0 Z;
                M 0 0 L 0 725.681 Q 192 494.05 384 667.97 T 768 536.421 T 1152 403.34 T 1536 242.61 T 1920 384.21 L 1920 0 Z;
                M 0 0 L 0 525.681 Q 192 694.05 384 467.97 T 768 336.421 T 1152 603.34 T 1536 442.61 T 1920 184.21 L 1920 0 Z;
                M 0 0 L 0 625.681 Q 192 594.05 384 567.97 T 768 436.421 T 1152 503.34 T 1536 342.61 T 1920 284.21 L 1920 0 Z"/>
            </path>
            <path opacity="0.4" fill="url(#lg-nq4q5u6dq7r)" d="M 0 0 L 0 579.298 Q 192 554.814 384 517.01 T 768 441.644 T 1152 477.676 T 1536 348.645 T 1920 325.907 L 1920 0 Z">
              <animate attributeName="d" dur="12s" repeatCount="indefinite" values="
                M 0 0 L 0 579.298 Q 192 554.814 384 517.01 T 768 441.644 T 1152 477.676 T 1536 348.645 T 1920 325.907 L 1920 0 Z;
                M 0 0 L 0 679.298 Q 192 454.814 384 617.01 T 768 541.644 T 1152 377.676 T 1536 448.645 T 1920 425.907 L 1920 0 Z;
                M 0 0 L 0 479.298 Q 192 654.814 384 417.01 T 768 341.644 T 1152 577.676 T 1536 248.645 T 1920 225.907 L 1920 0 Z;
                M 0 0 L 0 579.298 Q 192 554.814 384 517.01 T 768 441.644 T 1152 477.676 T 1536 348.645 T 1920 325.907 L 1920 0 Z"/>
            </path>
            <path opacity="0.4" fill="url(#lg-nq4q5u6dq7r)" d="M 0 0 L 0 628.308 Q 192 577.3 384 540.829 T 768 432.305 T 1152 426.623 T 1536 405.556 T 1920 388.676 L 1920 0 Z">
              <animate attributeName="d" dur="12s" repeatCount="indefinite" values="
                M 0 0 L 0 628.308 Q 192 577.3 384 540.829 T 768 432.305 T 1152 426.623 T 1536 405.556 T 1920 388.676 L 1920 0 Z;
                M 0 0 L 0 728.308 Q 192 477.3 384 640.829 T 768 532.305 T 1152 326.623 T 1536 305.556 T 1920 488.676 L 1920 0 Z;
                M 0 0 L 0 528.308 Q 192 677.3 384 440.829 T 768 332.305 T 1152 526.623 T 1536 505.556 T 1920 288.676 L 1920 0 Z;
                M 0 0 L 0 628.308 Q 192 577.3 384 540.829 T 768 432.305 T 1152 426.623 T 1536 405.556 T 1920 388.676 L 1920 0 Z;"/>
            </path>
          </g>          
        </svg> */}

        {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 911" preserveAspectRatio="xMidYMid slice" height="500px" width="100%" style={{ position: "absolute", shapeRendering: "auto", opacity: "80%", height: "100%", width: "100%" }}>
            <defs>
              <linearGradient id="bg">
                <stop offset="0%" style={{stopColor:"rgba(130,158,249,0.06)"}} />
                <stop offset="50%" style={{stopColor:"rgba(76,190,255,0.6)"}} />
                <stop offset="100%" style={{stopColor:"rgba(115,209,72,0.2)"}} />
              </linearGradient>
              <path id="wave" fill="url(#bg)" d="M-363.852,502.589c0,0,236.988-41.997,505.475,0\\n\\ts371.981,38.998,575.971,0s293.985-39.278,505.474,5.859s493.475,48.368,716.963-4.995v560.106H-363.852V502.589z" />
            </defs>
            <g>
              <use href="#wave" opacity=".3">
                <animateTransform attributeName="transform" attributeType="XML" type="translate" dur="10s" calcMode="spline" values="270 230; -334 180; 270 230" keyTimes="0; .5; 1" keySplines="0.42, 0, 0.58, 1.0;0.42, 0, 0.58, 1.0" repeatCount="indefinite" />
              </use>
              <use href="#wave" opacity=".6">
                <animateTransform attributeName="transform" attributeType="XML" type="translate" dur="8s" calcMode="spline" values="-270 230;243 220;-270 230" keyTimes="0; .6; 1" keySplines="0.42, 0, 0.58, 1.0;0.42, 0, 0.58, 1.0" repeatCount="indefinite" />
              </use>
              <use href="#wave" opacity=".9">
                <animateTransform attributeName="transform" attributeType="XML" type="translate" dur="6s" calcMode="spline" values="0 230;-140 200;0 230" keyTimes="0; .4; 1" keySplines="0.42, 0, 0.58, 1.0;0.42, 0, 0.58, 1.0" repeatCount="indefinite" />
              </use>
            </g>
        </svg> */}

        <section className="hero bkk-image-svg">
          <h1>Free and Open-Source Next.js Template for Startup & SaaS</h1>
          <p>
            Startup is free Next.js template for startups and SaaS business
            websites comes with all the essential pages, components, and
            sections you need to launch a complete business website, built-with
            Next 13.x and Tailwind CSS.
          </p>
          <a href="/get-started" className="cta-button primary" data-color1="#C33764" data-color2="#1D2671">
            Get Pro
          </a>
          <a href="/stock-image-processor" className="cta-button secondary">
            Stock Image Processor
          </a>
          <a href="/sprite-animation-tool" className="cta-button secondary">
            Sprite Animation Tool
          </a>
          <a href="/wave-tool" className="cta-button secondary">
            Wave Tool
          </a>
        </section>

        <MainFeatures />
        <ReadyToHelp />
        <ProductShowcase />
        <UserTestimonials />
        <PricingSection />
        <LatestBlogs />
        <TicketForm />
        <Footer />
      </main>

      {showSignIn && (
        <div className="popup-background" onClick={closePopup}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <SignIn />
          </div>
        </div>
      )}

      {showSignUp && (
        <div className="popup-background" onClick={closePopup}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <SignUp />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
