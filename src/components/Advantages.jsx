import React from 'react';
import {
  GlobalOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import '../styles/Advantages.css';

const CARDS = [
  {
    icon: <GlobalOutlined />,
    title: 'Global Coverage',
    desc: 'Instant access to top hospitals & specialists worldwide.',
  },
  {
    icon: <TeamOutlined />,
    title: 'Verified Experts',
    desc: 'Every partner meets our high standards of care.',
  },
  {
    icon: <ClockCircleOutlined />,
    title: '24/7 Support',
    desc: 'We’re here for you around the clock, every day.',
  },
  {
    icon: <DollarOutlined />,
    title: 'Transparent Costs',
    desc: 'Upfront pricing with no hidden fees or surprises.',
  },
];

export default function Advantages() {
  return (
    <section className="advantages">
      <div className="advantages__intro">
        <h2>Why HealthBridge?</h2>
        <p>Cutting-edge tech meets heartfelt care.</p>
      </div>

      <hr className="advantages__divider" />

      <div className="advantages__grid">
        {CARDS.map((c, i) => (
          <div
            className={`advantages__card card--${i % 2}`}
            key={i}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="advantages__icon">{c.icon}</div>
            <h3 className="advantages__title">{c.title}</h3>
            <p className="advantages__desc">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
