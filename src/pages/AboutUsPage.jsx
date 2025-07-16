import React from 'react';
import { Row, Col, Statistic, Button } from 'antd';
import {
  GlobalOutlined,
  ClockCircleOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import '../styles/AboutUsPage.css';
import heroIllustration from '../assets/health.jpg';
import { useNavigate } from 'react-router-dom';
import WhyHealthBridge from '../components/WhyHealthBridge';


export default function AboutUsPage() {

   const navigate = useNavigate();
  return (
    <div className="au-page">
      {/* HERO */}
      <section className="au-hero">
        <div className="au-hero-text">
          <h1>About HealthBridge</h1>
          <p>
            We bridge patients and world-class care—removing obstacles and guiding you
            seamlessly from first inquiry through follow-up.
          </p>
          <Button type="primary" size="large"  onClick={() => navigate('/quote')}>
            Get a Quote
          </Button>
        </div>
        <div className="au-hero-image">
          <img src={heroIllustration} alt="Healthcare illustration" />
        </div>
      </section>

      {/* MISSION / VISION */}
      <section className="au-mv">
        <div className="au-card">
          <h2>Our Mission</h2>
          <p>
            Empower every patient with transparent access to world-class healthcare,
            no matter where they live.
          </p>
        </div>
        <div className="au-card">
          <h2>Our Vision</h2>
          <p>
            A world where geography no longer limits care—powered by trust, technology,
            and compassionate support.
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="au-stats">
        <Statistic
          title="Years Serving"
          value={10}
          prefix={<ClockCircleOutlined />}
        />
        <Statistic
          title="Partner Hospitals"
          value={120}
          prefix={<GlobalOutlined />}
        />
        <Statistic
          title="Patients Helped"
          value={50000}
          prefix={<HeartOutlined />}
        />
      </section>

      <WhyHealthBridge/>
    </div>
  );
}
