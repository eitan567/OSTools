import React, { useState } from 'react';
import PricingPlan from './PricingPlan';
import './PricingSection.css';

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="pricing">
      <h2>Simple and Affordable Pricing</h2>
      <p>There are many variations of passages of Lorem Ipsum available but the majority have suffered alteration in some form.</p>
      <div className="pricing-toggle">
        <span>Monthly</span>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={isYearly}
            onChange={() => setIsYearly(!isYearly)}
          />
          <span className="slider round"></span>
        </label>
        <span>Yearly</span>
      </div>
      <div className="pricing-plans">
        <PricingPlan 
          title="Lite"
          price={isYearly ? "400" : "40"}
          period={isYearly ? "/yr" : "/mo"}
          description="Lorem ipsum dolor sit amet adiscing elit Mauris egestas enim."
        />
        <PricingPlan 
          title="Basic"
          price={isYearly ? "399" : "39"}
          period={isYearly ? "/yr" : "/mo"}
          description="Lorem ipsum dolor sit amet adiscing elit Mauris egestas enim."
        />
        <PricingPlan 
          title="Plus"
          price={isYearly ? "589" : "58"}
          period={isYearly ? "/yr" : "/mo"}
          description="Lorem ipsum dolor sit amet adiscing elit Mauris egestas enim."
        />
      </div>
    </section>
  );
};

export default PricingSection;
