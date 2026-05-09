import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Summary from './Summary';

interface Seat {
  id: string;
  status: 'available' | 'booked';
  userId?: number;
}

export default function Theater({ user }: { user: any }) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [movie, setMovie] = useState<any>(null);

  const sortSeats = (seatArray: Seat[]) => {
    return [...seatArray].sort((a, b) => {
      const aMatch = a.id.match(/^([A-Z]+)(\d+)$/);
      const bMatch = b.id.match(/^([A-Z]+)(\d+)$/);
      if (!aMatch || !bMatch) return a.id.localeCompare(b.id);
      const [, aL, aN] = aMatch;
      const [, bL, bN] = bMatch;
      if (aL !== bL) return aL.localeCompare(bL);
      return parseInt(aN) - parseInt(bN);
    });
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/seats').then(res => res.ok ? res.json() : []),
      fetch('/api/movie').then(res => res.ok ? res.json() : {})
    ])
    .then(([seatData, movieData]) => {
      if (Array.isArray(seatData)) {
        setSeats(sortSeats(seatData));
      }
      if (movieData && typeof movieData === 'object') setMovie(movieData);
      setLoading(false);
    })
    .catch(() => {
      setLoading(false);
    });
  }, []);

  const toggleSeat = (id: string) => {
    if (seats.find(s => s.id === id)?.status === 'booked') return;
    setSelectedSeats(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  if (loading) return <div className="text-primary text-center pt-32">Opening the Grand Doors...</div>;

  return (
    <div className="relative pt-32 pb-16 px-6 md:px-16 flex flex-col lg:flex-row gap-12 items-start justify-center min-h-screen">
      {/* Theater View */}
      <div className="flex-1 w-full max-w-[800px] space-y-12">
        {movie && (
          <div className="flex flex-col md:flex-row gap-8 items-center mb-12 bg-[#131313] p-8 border border-[#4d4635] shadow-2xl relative overflow-hidden">
            {/* Poster */}
            <div className="w-48 h-72 flex-shrink-0 bg-[#0a0a0a] border border-[#f2ca50]/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative group overflow-hidden">
              {movie.posterUrl ? (
                <img referrerPolicy="no-referrer" src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                   <div className="text-[#f2ca50] font-serif text-3xl mb-4">G.V.</div>
                   <div className="text-[10px] text-[#99907c] uppercase tracking-widest leading-relaxed">{movie.title}</div>
                </div>
              )}
              <div className="absolute inset-0 border-[10px] border-transparent border-t-[#f2ca50]/10 border-l-[#f2ca50]/10" />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
               <div className="text-[#f2ca50] text-[10px] uppercase tracking-[0.4em] mb-4">Now Presenting</div>
               <h1 className="text-4xl font-serif text-[#e5e2e1] mb-2 tracking-widest uppercase">{movie.title}</h1>
               <p className="text-[#99907c] italic text-sm mb-6 max-w-md">{movie.description}</p>
               <div className="flex flex-wrap gap-6 justify-center md:justify-start items-center">
                 <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#f2ca50] animate-pulse" />
                    <span className="text-xs uppercase tracking-widest text-[#d0c5af]">
                      {movie.date ? new Date(movie.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Opening Soon'}
                    </span>
                 </div>
                 <div className="text-[#4d4635]">|</div>
                 <div className="relative px-4 py-2 bg-[#131313] border border-[#4d4635] rounded overflow-hidden">
                    {/* Film Reel Detail */}
                    <div className="absolute top-0.5 left-0 right-0 flex justify-between px-1 scale-75 opacity-50">
                       {[...Array(4)].map((_, i) => <div key={i} className="w-1 h-1 bg-[#f2ca50] rounded-full" />)}
                    </div>
                    <div className="absolute bottom-0.5 left-0 right-0 flex justify-between px-1 scale-75 opacity-50">
                       {[...Array(4)].map((_, i) => <div key={i} className="w-1 h-1 bg-[#f2ca50] rounded-full" />)}
                    </div>
                    <div className="text-xs uppercase tracking-[0.2em] font-bold text-[#f2ca50]">{movie.time || '20:00'}</div>
                 </div>
               </div>

               <div className="mt-8 flex justify-center md:justify-start">
                 <button 
                   onClick={() => document.getElementById('seat-selection')?.scrollIntoView({ behavior: 'smooth' })}
                   className="group relative px-6 py-3 border border-[#f2ca50]/50 hover:bg-[#f2ca50] transition-all duration-500 overflow-hidden"
                 >
                   <span className="relative z-10 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f2ca50] group-hover:text-black transition-colors duration-500">Secure Your Passage</span>
                   <div className="absolute inset-0 bg-[#f2ca50] -translate-x-[101%] group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
                 </button>
               </div>
            </div>
            
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/black-marble.png')]" />
          </div>
        )}

        <div className="relative" id="seat-selection">
          <div className="h-2 w-full bg-gradient-to-r from-transparent via-[#f2ca50]/50 to-transparent mb-12"></div>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-playfair text-[#f2ca50] mb-2">Screen</h2>
            <div className="w-full h-8 bg-gradient-to-b from-[#f2ca50]/10 to-transparent blur-xl"></div>
          </div>

          {/* Seat Grid */}
          <div className="grid grid-cols-10 gap-3 max-w-[500px] mx-auto">
            {seats.map(seat => (
              <motion.button
                key={seat.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSeat(seat.id)}
                disabled={seat.status === 'booked'}
                className={`
                  aspect-square rounded-t-lg border-2 flex items-center justify-center text-[10px] font-bold
                  ${seat.status === 'booked' 
                    ? 'bg-[#800000]/60 border-[#800000] text-[#e5e2e1] cursor-not-allowed opacity-80' 
                    : selectedSeats.includes(seat.id)
                      ? 'bg-[#f2ca50] border-[#f2ca50] text-[#131313] shadow-[0_0_15px_rgba(242,202,80,0.5)]'
                      : 'bg-transparent border-[#99907c] text-[#99907c] hover:border-[#f2ca50] hover:text-[#f2ca50]'
                  }
                `}
              >
                {seat.id}
              </motion.button>
            ))}
          </div>

          <div className="mt-12 flex justify-center gap-8 text-xs font-bold uppercase tracking-widest text-[#99907c]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#99907c] rounded-t-sm"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#f2ca50] rounded-t-sm"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#800000]/60 border-2 border-[#800000] rounded-t-sm"></div>
              <span>Occupied</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary View */}
      {selectedSeats.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-[500px]"
        >
          <Summary 
            selectedSeats={selectedSeats} 
            user={user} 
            onSuccess={() => {
              setSelectedSeats([]);
              // Refresh seats
              fetch('/api/seats')
                .then(res => res.json())
                .then(data => setSeats(sortSeats(data)));
            }} 
          />
        </motion.div>
      )}
    </div>
  );
}
