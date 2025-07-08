import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/Treatments.css';

import cardioImg   from '../assets/cardiology.png';
import neuroImg    from '../assets/neurology.png';
import oncoImg     from '../assets/oncology.png';
import orthoImg    from '../assets/orthopedics.png';
import gastroImg   from '../assets/gastroenterology.png';
import nephroImg   from '../assets/nephrology.png';

const HARD_TREATMENTS = [
  { id:'cardiology',       name:'Cardiology',       img:cardioImg,  desc:'Comprehensive heart care—diagnostics, interventions & rehab.' },
  { id:'neurology',        name:'Neurology',        img:neuroImg,   desc:'Expert management for strokes, epilepsy, Parkinson’s & migraines.' },
  { id:'oncology',         name:'Oncology',         img:oncoImg,    desc:'Cutting-edge cancer treatments: chemo, radiation & immunotherapy.' },
  { id:'orthopedics',      name:'Orthopedics',      img:orthoImg,   desc:'Bone & joint care—replacements, arthroscopy & sports injuries.' },
  { id:'gastroenterology', name:'Gastroenterology', img:gastroImg,  desc:'Full GI suite: endoscopy, IBD/IBS care & liver treatments.' },
  { id:'nephrology',       name:'Nephrology',       img:nephroImg,  desc:'Kidney support: dialysis, transplant evaluation & chronic care.' },
];

export default function Treatments() {
  const [live, setLive]   = useState([]);
  const [index, setIndex] = useState(0);

  // 1️⃣ Fetch Firestore treatments once
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'treatments'));
        setLive(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Failed to fetch treatments:', e);
      }
    })();
  }, []);

  // 2️⃣ Use live if available, else fallback
  const list = live.length > 0 ? live : HARD_TREATMENTS;
  const count = list.length;

  // 3️⃣ Auto-advance every 5s
  useEffect(() => {
    const iv = setInterval(() => {
      setIndex(i => (i + 2) % count);
    }, 5000);
    return () => clearInterval(iv);
  }, [count]);

  // 4️⃣ Pick two to display
  const pair = [
    list[index],
    list[(index + 1) % count]
  ];

  return (
    <section className="tm-section">
      <h2 className="tm-heading">Our Treatments</h2>
      <p className="tm-subheading">Explore our specialties below.</p>

      <div className="tm-stripes">
        {pair.map((t, i) => (
          <div key={t.id} className={`tm-stripe ${i % 2 === 1 ? 'reverse' : ''}`}>
            <div
              className="tm-image"
              style={{ backgroundImage: `url(${t.img})` }}
              role="img"
              aria-label={t.name}
            />
            <div className="tm-text">
              <h3>{t.name}</h3>
              <p>{t.desc}</p>
              <a href={`#${t.id}`} className="tm-link">Learn More →</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
