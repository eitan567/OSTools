import React from 'react';
import './Header.css';
import { Link, useNavigate } from 'react-router-dom';
import UserPic from '../../../assets/images/empty_avatar.jpg';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase'; // Make sure this path is correct

const Header = ({ user, setUser }) => {  
  const navigate = useNavigate();

  const logout = async () => {
    try {
      // Firebase logout
      if (auth.currentUser) {
        await signOut(auth);
      }
      
      // Server-side logout
      // const response = await fetch("http://localhost:5000/auth/logout", { 
      //   method: "GET", 
      //   credentials: "include"
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      
      // Clear user from state
      setUser(null);
      
      // Use navigate instead of window.location for a smoother transition
      navigate('/');
    } catch (error) {
      console.error("Error signing out: ", error);
      // Even if there's an error, clear the user state and redirect
      setUser(null);
      navigate('/');
    }
  };

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
          <Link to="/#home">Home</Link>
          <Link to="/#main-features">Main Features</Link>
          <Link to="/#latest-blogs">Blog</Link>
          <Link to="/#ready-to-help">Support</Link>
          <Link to="/pages">Pages</Link>
        </nav>
        
        {user ? (
          <ul className="list logout-list">
            <li className="listItem user-display">
              <img
                src={user.picture || UserPic}
                alt=""
                className="avatar"
              />
              <div style={{lineHeight: "10px"}}>
                <div className="listItem display-name">{user.name}</div>
                <div className="listItem display-email">{user.email}</div>
              </div>
            </li>
            <li className="listItem logout" onClick={logout}>
              Logout
            </li>
          </ul>
        ) : (
          <div className="auth-buttons">
            <Link to="/sign-in" className="sign-in">Sign In</Link>
            <Link to="/sign-up" className="sign-in">Sign Up</Link>          
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;