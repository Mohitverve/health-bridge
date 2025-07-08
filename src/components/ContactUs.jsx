import React from 'react';
import '../styles/ContactUs.css';

export default function ContactUs() {
  return (
    <section className="contact-section" id='contact'>
      <div className="contact-container">
        {/* Left side: headline + blurb */}
        <div className="contact-info">
          <h2>Contact Us</h2>
          <p>
            Have questions or need guidance? Fill out the form and our team
            will be in touch within 24 hours.
          </p>
        </div>

        {/* Right side: the form */}
        <form className="contact-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="+1 555 123 4567"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Your Message</label>
            <textarea
              id="message"
              name="message"
              rows="5"
              placeholder="How can we help you today?"
            ></textarea>
          </div>

          <button type="submit" className="contact-submit">
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}
