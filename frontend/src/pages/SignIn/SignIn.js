import React from 'react';
import './SignIn.css';

const SignIn = () => {
  return (
    <div className="sign-in-container">
      <h2>Sign in to your account</h2>
      <p>Login to your account for a faster checkout.</p>
      <form>
        <button className="social-signin google">Sign in with Google</button>
        <button className="social-signin github">Sign in with Github</button>
        <div className="divider">Or, sign in with your email</div>
        <div className="form-group">
          <label>Your Email</label>
          <input type="email" placeholder="Enter your Email" />
        </div>
        <div className="form-group">
          <label>Your Password</label>
          <input type="password" placeholder="Enter your Password" />
        </div>
        <div className="form-footer">
          <label>
            <input type="checkbox" /> Keep me signed in
          </label>
          <a href="/forgot-password" className="forgot-password">Forgot Password?</a>
        </div>
        <button type="submit" className="submit-button">Sign in</button>
      </form>
      <p>Don’t you have an account? <a href="/signup">Sign up</a></p>
    </div>
  );
};

export default SignIn;
