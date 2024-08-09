import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import StockImageProcessor from './pages/StockImageProcessor';
import LandingPage from './pages/LandingPage';
import ScrollToTop from './components/common/ScrollToTop';
import WaveTool from './pages/WaveTool';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';
import ScrollToHome from './components/common/scrollToHome';
import SpriteAnimationTool from './pages/sprite-animation-tool';
import { NextUIProvider } from '@nextui-org/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase'; // Make sure to create this file
import './App.css'

// Add this at the top of your file
const originalError = console.error;
console.error = (...args) => {
  if (args[0] instanceof Error && args[0].message.includes('"[object Object]" is not valid JSON')) {
    // Ignore this specific error
    return;
  }
  originalError.apply(console, args);
};

function App() {
  const [user, setUser] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleSignInClick = () => setShowSignIn(true);
  const handleSignUpClick = () => setShowSignUp(true);
  const closePopup = () => {
    setShowSignIn(false);
    setShowSignUp(false);
  };

  const fetchUser = useCallback(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        // setUser(firebaseUser);
        let idToken = await firebaseUser.getIdToken();
        // console.log(idToken);
        // Optionally sync with your server
        let user_data = await fetch("http://localhost:5000/auth/firebase-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            idToken:idToken
          }),
          credentials: "include",
        });
        user_data = await user_data.json();
        setUser(user_data.user);
      } else {
        // If no Firebase user, try fetching from your server
        // try {
        //   const response = await fetch("http://localhost:5000/auth/login/success", {
        //     method: "GET",
        //     credentials: "include",
        //     headers: {
        //       Accept: "application/json",
        //       "Content-Type": "application/json",
        //       "Access-Control-Allow-Credentials": true,
        //     },
        //   });
        //   if (response.ok) {
        //     const data = await response.json();
        //     setUser(data.user);
        //   } else {
        //     // Don't throw an error, just set user to null
        //     setUser(null);
        //   }
        // } catch (error) {
        //   console.error("Error fetching user:", error);
        //   setUser(null);
        // }
      }
      setIsLoading(false);
    });
  
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = fetchUser();
    return () => unsubscribe();
  }, [fetchUser]);

  const handleLogin = useCallback(() => {
    fetchUser();
    closePopup();
  }, [fetchUser]);

  const ProtectedRoute = ({ children }) => {
    if (isLoading) {
      return <div>Loading...</div>;
    }
    if (!user) {
      return <Navigate to="/sign-in" replace />;
    }
    return children;
  };

  const SignInRoute = () => {
    const navigate = useNavigate();
    useEffect(() => {
      handleSignInClick();
      navigate('/');
    }, [navigate]);
    return null;
  };

  const SignUpRoute = () => {
    const navigate = useNavigate();
    useEffect(() => {
      handleSignUpClick();
      navigate('/');
    }, [navigate]);
    return null;
  };

  return (
    <NextUIProvider>
      <Router>
        <ScrollToTop />
        <ScrollToHome>
          <Routes>
            <Route path="/" element={<LandingPage user={user} setUser={setUser} />} />
            <Route path="/stock-image-processor" element={
              <ProtectedRoute>
                <StockImageProcessor user={user} setUser={setUser} />
              </ProtectedRoute>
            } />
            <Route path='/sprite-animation-tool' element={
              <ProtectedRoute>
                <SpriteAnimationTool />
              </ProtectedRoute>
            } />
            <Route path="/sign-in" element={<SignInRoute />} />
            <Route path="/sign-up" element={<SignUpRoute />} />
            <Route path="/wave-tool" element={<WaveTool />} />
          </Routes>
        </ScrollToHome>
        {showSignIn && (
        <div className="popup-background" onClick={closePopup}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <SignInPage onLoginSuccess={handleLogin} />
          </div>
        </div>
      )}

      {showSignUp && (
        <div className="popup-background" onClick={closePopup}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <SignUpPage onSignUpSuccess={handleLogin} />
          </div>
        </div>
      )}
      </Router>
    </NextUIProvider>
  );
}

export default App;