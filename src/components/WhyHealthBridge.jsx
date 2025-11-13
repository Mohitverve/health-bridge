import React from 'react';
import { motion } from 'framer-motion';
import {
  GlobalOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HeartOutlined
} from '@ant-design/icons';
import '../styles/WhyHealthBridge.css';

export default function WhyHealthBridge() {
  const features = [
    {
      title: 'Global Network',
      icon: <GlobalOutlined />, 
      desc: 'Connect with top hospitals and specialists worldwide.'
    },
    {
      title: 'Trusted Partnerships',
      icon: <CheckCircleOutlined />, 
      desc: 'Only accredited, high-quality providers in our network.'
    },
    {
      title: 'Seamless Experience',
      icon: <ClockCircleOutlined />, 
      desc: 'End-to-end support from booking to recovery.'
    },
    {
      title: '24/7 Support',
      icon: <HeartOutlined />, 
      desc: 'Always-on assistance for peace of mind.'
    },
  ];

  return (
    <section className="why-section">
      <h2 className="why-heading">Why Choose MedwayHorizon?</h2>
      <div className="why-grid">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="why-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            <div className="why-icon">{f.icon}</div>
            <h3 className="why-title">{f.title}</h3>
            <p className="why-desc">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}