import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section" style={{minWidth: "500px",paddingRight: "6rem"}}>
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30.7 0H1.3C0.58 0 0 0.58 0 1.3V30.7C0 31.42 0.58 32 1.3 32H30.7C31.42 32 32 31.42 32 30.7V1.3C32 0.58 31.42 0 30.7 0Z" fill="#4A6CF7"/>
              <path d="M8.5 8.5H23.5V23.5H8.5V8.5Z" fill="white"/>
            </svg>
            Startup
          </div>
          <p style={{maxWidth: "315px"}}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer lobortis.</p>
          <div className="social-links">
            <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
            <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
            <a href="#" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
            <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>
        <div className="footer-section">
          <h3 style={{marginTop: "0"}}>Useful Links</h3>
          <ul>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/about">About</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3 style={{marginTop: "0"}}>Terms</h3>
          <ul>
            <li><Link to="/tos">TOS</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/refund">Refund Policy</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3 style={{marginTop: "0"}}>Support & Help</h3>
          <ul>
            <li><Link to="/support">Open Support Ticket</Link></li>
            <li><Link to="/terms">Terms of Use</Link></li>
            <li><Link to="/about">About</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>Template by Uideck and Next.js Templates</p>
      </div>
    </footer>
  );
};

export default Footer;