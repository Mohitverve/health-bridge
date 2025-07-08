import React from 'react';
import {
  FileTextOutlined,
  TeamOutlined,
  DeploymentUnitOutlined,
  GlobalOutlined,
  HeartOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import '../styles/PlanJourney.css';

const steps = [
  {
    id: 'reports',
    title: 'Provide Reports',
    icon: <FileTextOutlined />,
    desc: 'Upload your medical files for initial review.',
  },
  {
    id: 'opinions',
    title: 'Get Opinions',
    icon: <TeamOutlined />,
    desc: 'Connect with top specialists for a second opinion.',
  },
  {
    id: 'arrival',
    title: 'Pre-Arrival',
    icon: <DeploymentUnitOutlined />,
    desc: 'We handle your airport pickups & lodging.',
  },
  {
    id: 'visa',
    title: 'Visa Support',
    icon: <GlobalOutlined />,
    desc: 'Advice & paperwork assistance for your visa.',
  },
  {
    id: 'treatment',
    title: 'Treatment Care',
    icon: <HeartOutlined />,
    desc: 'Seamless in-hospital experience & care.',
  },
  {
    id: 'followup',
    title: 'Follow-Up',
    icon: <RocketOutlined />,
    desc: 'Post-treatment check-ins and support.',
  },
];

export default function PlanJourney() {
  return (
    <section className="pj-section">
      <div className="pj-header">
        <h2>Plan Your Healthcare Journey</h2>
        <p>Honest guidance, reliable support, seamless journeys.</p>
      </div>

      <div className="pj-timeline-wrapper">
        {/* the central line */}
        <div className="pj-line" />

        {/* all steps */}
        <div className="pj-steps">
          {steps.map((step, i) => (
            <div key={step.id} className="pj-step">
              <div className="pj-step-circle">
                {step.icon}
                <span className="pj-step-num">{i + 1}</span>
              </div>
              <div className="pj-step-title">{step.title}</div>
              <div className="pj-step-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
