import React from 'react';
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import '../styles/Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      {/* Top section with columns */}
      <div className="footer-columns">
        {/* About */}
        <div className="footer-column">
          <h4>About HealthBridge</h4>
          <p>
            HealthBridge connects international patients with top Indian
            hospitals and specialists, ensuring seamless care, transparent
            pricing, and end-to-end support for your medical journey.
          </p>
        </div>

        {/* Our Services */}
        <div className="footer-column">
          <h4>Our Services</h4>
          <ul>
            <li><a href="#hospitals">Hospitals</a></li>
            <li><a href="#doctors">Doctors</a></li>
            <li><a href="#treatments">Treatments</a></li>
            <li><a href="#visa">Visa Assistance</a></li>
            <li><a href="#support">Patient Support</a></li>
          </ul>
        </div>

        {/* Useful Links */}
        <div className="footer-column">
          <h4>Useful Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-column">
          <h4>Contact Info</h4>
          <ul className="contact-list">
            <li>
              <PhoneOutlined /> <a href="tel:+911234567890">+91 12345 67890</a>
            </li>
            <li>
              <MailOutlined />{' '}
              <a href="mailto:info@healthbridge.com">
                info@healthbridge.com
              </a>
            </li>
            <li>
              <EnvironmentOutlined /> 123 Medical Plaza, New Delhi, India
            </li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="footer-divider" />

      {/* Bottom bar */}
      <div className="footer-bottom">
        <ul className="footer-legal">
          <li><a href="#terms">Terms &amp; Conditions</a></li>
          <li><a href="#privacy">Privacy Policy</a></li>
        </ul>
        <div className="footer-copy">
          © {new Date().getFullYear()} HealthBridge. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
