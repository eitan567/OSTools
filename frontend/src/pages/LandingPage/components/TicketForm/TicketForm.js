import React from 'react';
import './TicketForm.css';

const TicketForm = () => {
  return (
    <section className="ticket-form">
      <div className="ticket-form-container">
        <div className="form-section">
          <h2>Need Help? Open a Ticket</h2>
          <p>Our support team will get back to you ASAP via email.</p>
          <form>
            <div className="fields-group">              
              <div className="form-group">
                <label>Your Name</label>
                <input type="text" placeholder="Enter your name" />
              </div>
              <div className="form-group">
                <label>Your Email</label>
                <input type="email" placeholder="Enter your email" />
              </div>
            </div>
            <div className="form-group" style={{"marginBottom": "0px"}}>
              <label>Your Message</label>
              <textarea placeholder="Enter your Message"></textarea>
            </div>
            <button type="submit" className="submit-button">Submit Ticket</button>
          </form>
        </div>
        <div className="subscribe-section">
          <h2>Subscribe to receive future updates</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ullamcorper.</p>
          <form>
            <div className="form-group">
              <label>Your Name</label>
              <input type="text" placeholder="Enter your name" />
            </div>
            <div className="form-group">
              <label>Your Email</label>
              <input type="email" placeholder="Enter your email" />
            </div>
            <button type="submit" className="subscribe-button">Subscribe</button>
          </form>
          <p>No spam guaranteed, So please don’t send any spam mail.</p>
        </div>
      </div>
    </section>
  );
};

export default TicketForm;
