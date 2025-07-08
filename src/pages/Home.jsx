// src/pages/Home.jsx
import React, { useEffect } from 'react';
import Hero             from '../components/HeroSection';
import PlanJourney      from '../components/PlanJourney';
import Treatments       from '../components/TreatmentsSection';
import AboutUs          from '../components/AboutUs';
import ContactUs        from '../components/ContactUs';
import Header from '../components/Header';
import TopHospitals from "../components/TopHospitals";

export default function Home({ scrollTo }) {
  useEffect(() => {
    if (!scrollTo) return;
    const id = scrollTo === 'hero' ? 'hero' : scrollTo;
    const el = document.getElementById(id);
    if (el) {
      // small delay if you just navigated from another route
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [scrollTo]);

  return (
    <main>
      <div>
        <Header/>
      </div>
      <section id="hero">
        <Hero />
      </section>
<section>
  <AboutUs/>
</section>
      <section id="plan-journey">
        <PlanJourney />
      </section>
<section>
  <TopHospitals/>
</section>
      <section id="treatments">
        <Treatments />
      </section>

     
      <section id="contact">
        <ContactUs />
      </section>

     
    </main>
  );
}
