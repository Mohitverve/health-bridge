// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Navbar         from './components/Navbar';
import Footer         from './components/Footer';

import Home           from './pages/Home';
import HospitalsPage  from './pages/HospitalsPage';

import Admin          from './pages/Admin';
import AboutUsPage from './pages/AboutUsPage';
import Header from './components/Header';
import TreatmentsPage from './pages/TreatmentsPage';
import GetQuotePage from './pages/GetQuotePage';
import BlogsPage from './pages/BlogsPage';
import TreatmentDetails from './pages/TreatmentDetails';
import { db } from './firebase'; 

export default function App() {
  return (
    <BrowserRouter>
<Header/>
      <Navbar />

      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/contact"     element={<Home scrollTo="contact" />} />
        <Route path="/get-quote"   element={<Home scrollTo="hero" />} />

        <Route path="/hospitals"   element={<HospitalsPage />} />
            <Route path="/About"   element={<AboutUsPage />} />
               <Route path="/Quote"   element={<GetQuotePage />} />
               
                     <Route path="/Blogs"   element={<BlogsPage />} />
       
       <Route path="/admin"       element={<Admin db={db} />} /> {/* ✅ Pass db */}
          <Route path="/Treatments"       element={<TreatmentsPage />} />
           <Route path="/treatments/:id" element={<TreatmentDetails />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
