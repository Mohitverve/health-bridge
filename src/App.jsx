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
import DoctorsPage from './pages/DoctorsPage';
import BlogsPage from './pages/BlogsPage';

export default function App() {
  return (
    <BrowserRouter>

      <Navbar />
<Header/>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/contact"     element={<Home scrollTo="contact" />} />
        <Route path="/get-quote"   element={<Home scrollTo="hero" />} />

        <Route path="/hospitals"   element={<HospitalsPage />} />
            <Route path="/About"   element={<AboutUsPage />} />
               <Route path="/Quote"   element={<GetQuotePage />} />
                <Route path="/Doc"   element={<DoctorsPage />} />
                     <Route path="/Blogs"   element={<BlogsPage />} />
       
        <Route path="/admin"       element={<Admin />} />
          <Route path="/Treatments"       element={<TreatmentsPage />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
