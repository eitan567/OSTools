import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';

const SignUp = ({ onSignUpSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError('You must agree to the Terms and Conditions and Privacy Policy.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      await sendUserToServer(userCredential.user);
      if (onSignUpSuccess) onSignUpSuccess();
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  const signUpWithProvider = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      await sendUserToServer(result.user);
      if (onSignUpSuccess) onSignUpSuccess();
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  const sendUserToServer = async (user) => {
    try {
      let idToken = await user.getIdToken();
      const response = await fetch("http://localhost:5000/auth/firebase-login", {
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

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorDetails}`);
      }

      const responseData = await response.json();      
      console.log("Response data:", responseData);
    } catch (error) {
      console.error("Error sending user data to server:", error);
    }
  };

  const google = (e) => {
    e.preventDefault();
    signUpWithProvider(new GoogleAuthProvider());
  };

  const github = (e) => {
    e.preventDefault();
    signUpWithProvider(new GithubAuthProvider());
  };

  const facebook = (e) => {
    e.preventDefault();
    signUpWithProvider(new FacebookAuthProvider());
  };

  const microsoft = (e) => {
    e.preventDefault();
    let provider = new OAuthProvider('microsoft.com')
    provider.setCustomParameters({
      // Use the consumers endpoint
      prompt: 'consent',
      tenant: 'consumers'
    });
    signUpWithProvider(provider);   
  };

  return (
    <div className="sign-up-container">
      <div className='sign-up-title'>
        <h2>Create your account</h2>
        <p>It's totally free and super easy</p>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form className='sign-up-form' onSubmit={handleSignUp}>
        <div className='sign-up-buttons'>
          <button className="social-signin google" onClick={google}>Sign up with Google</button>
          <button className="social-signin github" onClick={github}>Sign up with Github</button>
          <button className="social-signin facebook" onClick={facebook}>Sign up with facebook</button>
          <button className="social-signin microsoft" onClick={microsoft}>Sign up with microsoft</button>
        </div>
        <div className='sign-up-form-group'>
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              placeholder="Enter your full name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
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
              <input 
                type="checkbox" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              /> By creating an account means you agree to the <a href="/terms">Terms and Conditions</a>, and our <a href="/privacy">Privacy Policy</a>
            </label>
          </div>
          <button type="submit" className="submit-button">Sign up</button>
        </div>
      </form>
      <p>Already using Startup? <a href="/signin">Sign in</a></p>
    </div>
  );
};

export default SignUp;
