import React from 'react'
import Navbar from '../components/Navbar'
import TopHospitals from '../components/TopHospitals'
import PlanJourney from '../components/PlanJourney'
import Specialties from '../components/TreatmentsSection'
import HeroSection from '../components/HeroSection'
import ContactUs from '../components/ContactUs'
import Footer from '../components/Footer'
import Header from '../components/Header'

const Home = () => {
  return (
    <div>
      <Header/>
      <Navbar/>
      <HeroSection/>
      <TopHospitals/>
      <PlanJourney/>
    <Specialties/>
    <ContactUs/>
    <Footer/>
    </div>
  )
}

export default Home
