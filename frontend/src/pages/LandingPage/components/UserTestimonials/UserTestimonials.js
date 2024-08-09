import React from 'react';
import './UserTestimonials.css';
import Man from '../../../../assets/images/man.png';

const testimonials = [
  {
    id: 1,
    name: 'Musharof Chy',
    role: 'Founder @TailGrids',
    quote: '"Our members are so impressed. It\'s intuitive. It\'s clean. It\'s distraction free. If you\'re building a community."',
    avatar: Man
  },
  {
    id: 2,
    name: 'Devid Weilium',
    role: 'Founder @Uideck',
    quote: '"Our members are so impressed. It\'s intuitive. It\'s clean. It\'s distraction free. If you\'re building a community."',
    avatar: Man
  },
  {
    id: 3,
    name: 'Lethium Frenci',
    role: 'Founder @Lineicons',
    quote: '"Our members are so impressed. It\'s intuitive. It\'s clean. It\'s distraction free. If you\'re building a community."',
    avatar: Man
  }
];

const UserTestimonials = () => {
  return (
    <section className="user-testimonials">
      <div className="testimonials-content">
        <h2>What Our Users Says</h2>
        <p className='headerText'>There are many variations of passages of Lorem Ipsum available but the majority have suffered alteration in some form.</p>
        
        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="star-rating">
                {'★'.repeat(5)}
              </div>
              <p className="quote">{testimonial.quote}</p>
              <div className="user-info">
                <img src={testimonial.avatar} alt={testimonial.name} className="user-avatar" />
                <div>
                  <h3>{testimonial.name}</h3>
                  <p>{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UserTestimonials;
