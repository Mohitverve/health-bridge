import React, { useEffect, useRef } from 'react';
import { AimOutlined, EyeOutlined, HeartOutlined } from '@ant-design/icons';
import '../styles/AboutUs.css';

const features = [
  {
    key: 'mission',
    Icon: AimOutlined,
    title: 'Our Mission',
    desc:
      'Empower every patient with seamless access to world-class healthcare, no matter where they live.',
  },
  {
    key: 'vision',
    Icon: EyeOutlined,
    title: 'Our Vision',
    desc:
      'A world where quality care is a right—bridged by transparency, tech & trust.',
  },
  {
    key: 'values',
    Icon: HeartOutlined,
    title: 'Our Values',
    desc:
      'Compassion • Integrity • Excellence—guiding every interaction on your health journey.',
  },
];

export default function AboutUs() {
  const sectionRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    sectionRef.current
      .querySelectorAll('.about-card')
      .forEach(card => observer.observe(card));
  }, []);

  return (
    <section className="about-section" ref={sectionRef} id='about'>
      <div className="blob-bg" />
      <div className="about-intro">
        <h2>Who We Are</h2>
        <p>
          At HealthBridge we harness cutting-edge technology and heartfelt care to connect you
          with the very best hospitals and specialists worldwide.
        </p>
      </div>

      <div className="about-features">
        {features.map(({ key, Icon, title, desc }) => (
          <div className="about-card" key={key}>
            <div className="about-icon-wrapper">
              <div className="about-icon-bg" />
              <Icon className="about-icon" />
            </div>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
