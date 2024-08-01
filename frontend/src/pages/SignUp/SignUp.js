import React from 'react';
import './SignUp.css';

const SignUp = () => {
  return (
    <div className="sign-up-container">
      <h2>Create your account</h2>
      <p>It's totally free and super easy</p>
      <form>
        <button className="social-signin google">Sign in with Google</button>
        <button className="social-signin github">Sign in with Github</button>
        <div className="divider">Or, register with your email</div>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" placeholder="Enter your full name" />
        </div>
        <div className="form-group">
          <label>Work Email</label>
          <input type="email" placeholder="Enter your Email" />
        </div>
        <div className="form-group">
          <label>Your Password</label>
          <input type="password" placeholder="Enter your Password" />
        </div>
        <div className="form-footer">
          <label>
            <input type="checkbox" /> By creating an account means you agree to the <a href="/terms">Terms and Conditions</a>, and our <a href="/privacy">Privacy Policy</a>
          </label>
        </div>
        <button type="submit" className="submit-button">Sign up</button>
      </form>
      <p>Already using Startup? <a href="/signin">Sign in</a></p>
    </div>
  );
};

export default SignUp;
