import React from 'react';
import './MainFeatures.css';
import FeaturesData from '../FeaturesData';

const MainFeatures = () => {
  return (
    <section id="main-features" className="main-features">
      <h2>Main Features</h2>
      <p>There are many variations of passages of Lorem Ipsum available but the majority have suffered alteration in some form.</p>
      <div className="features-grid">
        {FeaturesData.map((feature) => (
          <div key={feature.id} className="feature-item">
            <div className="feature-icon">
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.paragraph}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MainFeatures;