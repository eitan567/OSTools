import React from 'react';
import './ProductShowcase.css';

const ProductShowcase = () => {
  return (
    <section className="product-showcase">
      <div className="showcase-content">
        <div className="showcase-text">
          <h2>Crafted for Startup, SaaS and Business Sites.</h2>
          <p>The main 'thrust' is to focus on educating attendees on how to best protect highly vulnerable business applications with interactive panel discussions and roundtables.</p>
          
          <ul className="feature-list">
            <li>Premium quality</li>
            <li>Tailwind CSS</li>
            <li>Use for lifetime</li>
            <li>Next.js</li>
            <li>Rich documentation</li>
            <li>Developer friendly</li>
          </ul>
        </div>
        
        <div className="showcase-visual">
          {/* Placeholder for visual elements */}
          <div className="visual-element ve-1"></div>
          <div className="visual-element ve-2"></div>
          <div className="visual-element ve-3"></div>
          <div className="visual-element ve-4"></div>
        </div>
      </div>
      
      <div className="showcase-details">
        <div className="detail-visual">
          {/* Placeholder for code snippet visual */}
          <div className="code-snippet">
            <div className="snippet-header">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="snippet-content">
              <div className="snippet-line"></div>
              <div className="snippet-line"></div>
              <div className="snippet-line"></div>
            </div>
          </div>
        </div>
        <div className="detail-text">
          <div className="detail-item">
            <h3>Bug free code</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </div>
          <div className="detail-item">
            <h3>Premier support</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.</p>
          </div>
          <div className="detail-item">
            <h3>Next.js</h3>
            <p>Lorem ipsum dolor sit amet, sed do eiusmod tempor incididunt consectetur adipiscing elit setim.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;