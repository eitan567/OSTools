import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import StockImageProcessor from './components/StockImageProcessor';
import ScrollToTop from './components/ScrollToTop';
import WaveTool from './components/WaveTool';
import SignInPage from './components/SignIn';
import SignUpPage from './components/SignUp';
import ScrollToHome from './components/scrollToHome';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ScrollToHome>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/stock-image-processor" element={<StockImageProcessor />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/wave-tool" element={<WaveTool />} />
        </Routes>
      </ScrollToHome>
    </Router>
  );
}

export default App;