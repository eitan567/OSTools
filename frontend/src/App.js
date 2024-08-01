import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import StockImageProcessor from './pages/StockImageProcessor';
import ScrollToTop from './components/common/ScrollToTop';
import WaveTool from './pages/WaveTool';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';
import ScrollToHome from './components/common/scrollToHome';
import SpriteAnimationTool from './pages/sprite-animation-tool';
import { NextUIProvider } from '@nextui-org/react';
import './App.css'

function App() {
  return (
    <NextUIProvider>
      <Router>
        <ScrollToTop />
        <ScrollToHome>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/stock-image-processor" element={<StockImageProcessor />} />
            <Route path='/sprite-animation-tool' element={<SpriteAnimationTool />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/wave-tool" element={<WaveTool />} />
          </Routes>
        </ScrollToHome>
      </Router>
    </NextUIProvider>
  );
}

export default App;