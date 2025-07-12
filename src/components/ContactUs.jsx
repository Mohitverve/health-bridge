import React from 'react';
import { Card, Row, Col } from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import '../styles/ContactUs.css';

export default function ContactUs() {
  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        {/* left side */}
        <div className="contact-info">
          <h2>Contact Us</h2>
          <p>
            Have questions or need guidance? Reach out via email, phone, or
            visit our office—our team is standing by to help you.
          </p>
        </div>

        {/* right side */}
        <Card className="contact-card" bordered={false}>
          <Row gutter={[0, 24]}>
            <Col span={24} className="contact-item">
              <MailOutlined className="contact-icon" />
              <div>
                <h4>Email</h4>
                <p>support@healthbridge.com</p>
              </div>
            </Col>

            <Col span={24} className="contact-item">
              <PhoneOutlined className="contact-icon" />
              <div>
                <h4>Phone</h4>
                <p>+91 98765 43210</p>
              </div>
            </Col>

            <Col span={24} className="contact-item">
              <EnvironmentOutlined className="contact-icon" />
              <div>
                <h4>Address</h4>
                <p>123 Health St, New Delhi, India</p>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </section>
  );
}
