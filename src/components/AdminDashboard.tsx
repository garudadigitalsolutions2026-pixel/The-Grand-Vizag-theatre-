import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Film, Calendar, Image as ImageIcon, Loader2 } from 'lucide-react';

interface MovieData {
  title: string;
  description: string;
  posterUrl: string;
  date: string;
  time: string;
}

export default function AdminDashboard() {
  const [data, setData] = useState<MovieData>({
    title: '',
    description: '',
    posterUrl: '',
    date: '',
    time: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/movie')
      .then(res => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then(setData)
      .catch(err => console.error('Admin Fetch Error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/admin/movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      let resData;
      try {
        resData = await res.json();
      } catch (e) {
        resData = { error: 'Unknown server response' };
      }

      if (res.ok) {
        setMessage('The Estate has been updated successfully.');
      } else {
        setMessage(resData.error || 'Update failed');
      }
    } catch (err) {
      setMessage('Network error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-[#f2ca50] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl font-serif text-[#f2ca50] mb-4 tracking-widest">ADMIN MANOR</h1>
            <p className="text-[#99907c] italic uppercase tracking-[0.3em] text-sm">Curating the Cinematic Experience</p>
            <div className="w-48 h-px bg-gradient-to-r from-transparent via-[#f2ca50]/50 to-transparent mx-auto mt-8" />
          </motion.div>
        </header>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#131313] border border-[#4d4635] shadow-2xl rounded-sm overflow-hidden relative"
        >
          {/* Marble Texture Overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/black-marble.png')]" />
          
          <form onSubmit={handleUpdate} className="p-10 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Left Column: Movie Details */}
              <div className="space-y-8">
                <h3 className="text-[#f2ca50] font-bold tracking-widest uppercase text-xs border-b border-[#4d4635] pb-2 flex items-center gap-2">
                  <Film className="w-4 h-4" /> Feature Presentation
                </h3>
                
                <div>
                  <label className="block text-[10px] text-[#99907c] uppercase tracking-widest mb-2">Movie Title</label>
                  <input
                    type="text"
                    value={data.title}
                    onChange={e => setData({...data, title: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#4d4635] text-[#e5e2e1] px-4 py-3 rounded focus:border-[#f2ca50] outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#99907c] uppercase tracking-widest mb-2">Description / Tagline</label>
                  <textarea
                    value={data.description}
                    onChange={e => setData({...data, description: e.target.value})}
                    rows={3}
                    className="w-full bg-[#0a0a0a] border border-[#4d4635] text-[#e5e2e1] px-4 py-3 rounded focus:border-[#f2ca50] outline-none transition-all resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#99907c] uppercase tracking-widest mb-2 flex justify-between">
                    <span>Poster Image</span>
                    <span className="text-[#f2ca50]/50 lowercase italic font-normal">URL or Upload</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <ImageIcon className="absolute left-3 top-3.5 w-4 h-4 text-[#4d4635]" />
                      <input
                        type="text"
                        value={data.posterUrl}
                        onChange={e => setData({...data, posterUrl: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-[#4d4635] text-[#e5e2e1] pl-10 pr-4 py-3 rounded focus:border-[#f2ca50] outline-none transition-all text-xs"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                    <label className="bg-[#131313] border border-[#4d4635] hover:border-[#f2ca50] text-[#e5e2e1] px-4 py-3 rounded cursor-pointer transition-all flex items-center gap-2 group whitespace-nowrap">
                      <Film className="w-4 h-4 text-[#f2ca50] group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Upload</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const img = new Image();
                              img.onload = () => {
                                // Create canvas to downscale if needed (DynamoDB limit is 400KB)
                                const canvas = document.createElement('canvas');
                                let width = img.width;
                                let height = img.height;
                                const MAX_WIDTH = 800;
                                if (width > MAX_WIDTH) {
                                  height = (MAX_WIDTH / width) * height;
                                  width = MAX_WIDTH;
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(img, 0, 0, width, height);
                                // Compress to JPEG
                                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                                setData({...data, posterUrl: compressedDataUrl});
                              };
                              img.src = reader.result as string;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {data.posterUrl && data.posterUrl.startsWith('data:') && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-2 bg-[#0a0a0a] border border-[#4d4635] rounded inline-block"
                    >
                      <img src={data.posterUrl} alt="Preview" className="h-24 object-contain" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Right Column: Screening Management */}
              <div className="space-y-8">
                <h3 className="text-[#f2ca50] font-bold tracking-widest uppercase text-xs border-b border-[#4d4635] pb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Screening Logistics
                </h3>

                <div>
                  <label className="block text-[10px] text-[#99907c] uppercase tracking-widest mb-2">Screening Date</label>
                  <input
                    type="date"
                    value={data.date}
                    onChange={e => setData({...data, date: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#4d4635] text-[#e5e2e1] px-4 py-3 rounded focus:border-[#f2ca50] outline-none transition-all [color-scheme:dark]"
                  />
                </div>

                <div className="relative group">
                  <label className="block text-[10px] text-[#99907c] uppercase tracking-widest mb-2 flex justify-between">
                    <span>Showtime Reel</span>
                    <span className="text-[#f2ca50]/50 lowercase italic font-normal">Film Block</span>
                  </label>
                  <div className="relative bg-[#0a0a0a] border border-[#4d4635] p-2 rounded group-hover:border-[#f2ca50] transition-all">
                    {/* Film Sprockets */}
                    <div className="absolute top-1 left-0 right-0 flex justify-between px-2">
                       {[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-[#4d4635] rounded-sm" />)}
                    </div>
                    <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2">
                       {[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-[#4d4635] rounded-sm" />)}
                    </div>
                    
                    <input
                      type="time"
                      value={data.time}
                      onChange={e => setData({...data, time: e.target.value})}
                      className="w-full bg-transparent text-[#f2ca50] font-mono text-center text-2xl py-4 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  {message && (
                    <p className={`text-center mb-6 text-xs uppercase tracking-widest ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
                      {message}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full velvet-gradient border border-[#f2ca50]/60 py-4 rounded font-bold text-white tracking-[0.3em] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        UPDATE ESTATE
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
