// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Navbar         from './components/Navbar';
import Footer         from './components/Footer';

import Home           from './pages/Home';
import HospitalsPage  from './pages/HospitalsPage';

import Admin          from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/about"       element={<Home scrollTo="about" />} />
        <Route path="/contact"     element={<Home scrollTo="contact" />} />
        <Route path="/get-quote"   element={<Home scrollTo="hero" />} />

        <Route path="/hospitals"   element={<HospitalsPage />} />
       
        <Route path="/admin"       element={<Admin />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
