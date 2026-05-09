/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Theater from './components/Theater';
import AdminDashboard from './components/AdminDashboard';
import Bookings from './components/Bookings';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="text-[#f2ca50] font-playfair text-2xl tracking-[0.2em] animate-pulse">
          THE GRAND VIZAG
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-[#e5e2e1] font-hanken relative">
        <Navbar user={user} onLogout={handleLogout} />
        
        {/* GLOBAL CINEMATIC ATTRACTION */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* The Video Source */}
          <iframe 
            src="https://drive.google.com/file/d/1Wh0GvJA4VkAD_IZn2Cznt1xGEIZcnefa/preview" 
            className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 opacity-30 blur-[2px] scale-110 pointer-events-none"
            frameBorder="0" 
            allow="autoplay; encrypted-media" 
          ></iframe>
          
          {/* Aesthetic Overlays: Dark Gradient + Marble Texture + Vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black shadow-[inset_0_0_200px_rgba(0,0,0,1)]" />
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/black-marble.png')]" />
          
          {/* Chiaroscuro Spotlighting */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#f2ca50]/5 rounded-full blur-[150px]"></div>
        </div>

        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<Theater user={user} />} />
            <Route 
              path="/auth" 
              element={user ? <Navigate to="/" /> : <Auth onLogin={setUser} />} 
            />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/account" element={<Bookings user={user} />} />
          </Routes>
        </main>

        {/* Ornate Divider */}
        <div className="flex justify-center items-center gap-4 py-12">
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-[#4d4635]"></div>
          <span className="material-symbols-outlined text-[#f2ca50]/40 text-xl">workspace_premium</span>
          <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-[#4d4635]"></div>
        </div>

        {/* Footer */}
        <footer className="w-full py-16 px-6 md:px-16 flex flex-col items-center gap-8 bg-[#131313] border-t border-[#4d4635]">
          <Link to="/" className="text-3xl font-playfair text-[#f2ca50] tracking-widest uppercase hover:opacity-80 transition-opacity">THE GRAND VIZAG</Link>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#99907c] text-center">© MMXXVI THE GRAND VIZAG. AN EXCLUSIVE CINEMATIC ESTATE.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
