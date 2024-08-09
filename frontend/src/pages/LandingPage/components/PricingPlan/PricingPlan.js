import React from 'react';

const PricingPlan = ({ title, price, period, description }) => (
  <div className="plan">
    <h3>{title}</h3>
    <div className="plan-price">${price}<span>{period}</span></div>
    <p>{description}</p>
    <button className="start-trial-btn">Start Free Trial</button>
    <ul>
      <li>All UI Components</li>
      <li>Use with Unlimited Projects</li>
      <li>Commercial Use</li>
      <li>Email Support</li>
      <li>Lifetime Access</li>
      <li>Free Lifetime Updates</li>
    </ul>
  </div>
);

export default PricingPlan;