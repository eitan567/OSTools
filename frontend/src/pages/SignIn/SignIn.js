import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';

const SignIn = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (onLoginSuccess) onLoginSuccess();
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  const signInWithProvider = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      let idToken = await user.getIdToken();
      await fetch("http://localhost:5000/auth/firebase-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          idToken:idToken
        }),
        credentials: "include",
      });
      if (onLoginSuccess) onLoginSuccess();
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  const google = (e) => {
    e.preventDefault();
    signInWithProvider(new GoogleAuthProvider());
  };

  const github = (e) => {
    e.preventDefault();
    signInWithProvider(new GithubAuthProvider());
  };

  const facebook = (e) => {
    e.preventDefault();
    signInWithProvider(new FacebookAuthProvider());
  };

  const microsoft = (e) => {
    e.preventDefault();
    let provider = new OAuthProvider('microsoft.com')
    provider.setCustomParameters({
      // Use the consumers endpoint
      prompt: 'consent',
      tenant: 'consumers'
    });
    signInWithProvider(provider);
  };

  return (
    <div className="sign-in-container">
      <div className='sign-in-title'>
        <h2>Sign in to your account</h2>
        <p>Login to your account for a faster checkout.</p>      
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form className='sign-in-form' onSubmit={handleSignIn}>
        <div className='sign-in-buttons'>
          <button className="social-signin google" onClick={google}>Sign in with Google</button>
          <button className="social-signin github" onClick={github}>Sign in with Github</button>
          <button className="social-signin facebook" onClick={facebook}>Sign in with facebook</button>
          <button className="social-signin microsoft" onClick={microsoft}>Sign in with microsoft</button>
        </div>
        <div className='sign-up-form-group'>
          <div className="form-group">
            <label>Your Email</label>
            <input 
              type="email" 
              placeholder="Enter your Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Your Password</label>
            <input 
              type="password" 
              placeholder="Enter your Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-footer">
            <label>
              <input type="checkbox" /> Keep me signed in
            </label>
            <a href="/forgot-password" className="forgot-password">Forgot Password?</a>
          </div>
          <button type="submit" className="submit-button">Sign in</button>
        </div>
      </form>
      <p>Don't you have an account? <a href="/signup">Sign up</a></p>
    </div>
  );
};

export default SignIn;