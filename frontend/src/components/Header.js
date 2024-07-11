import React from 'react';
import './Header.css';

const Header = ({ onSignInClick, onSignUpClick }) => {
  return (
    <header className="sticky-header">
      <div className="header-content">
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30.7 0H1.3C0.58 0 0 0.58 0 1.3V30.7C0 31.42 0.58 32 1.3 32H30.7C31.42 32 32 31.42 32 30.7V1.3C32 0.58 31.42 0 30.7 0Z" fill="#4A6CF7"/>
            <path d="M8.5 8.5H23.5V23.5H8.5V8.5Z" fill="white"/>
          </svg>
          Startup
        </div>
        <nav>
          <a href="/#home">Home</a>
          <a href="/#main-features">Main Features</a>
          <a href="/blog">Blog</a>
          <a href="/support">Support</a>
          <a href="/pages">Pages</a>
        </nav>
        <div className="auth-buttons">
          <button onClick={onSignInClick} className="sign-in">Sign In</button>
          <button onClick={onSignUpClick} className="sign-up">Sign Up</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
