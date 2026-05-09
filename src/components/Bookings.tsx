import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Ticket, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  status: string;
  userEmail: string;
  bookedAt: string;
}

export default function Bookings({ user }: { user: any }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [movie, setMovie] = useState<any>(null);

  const isAdmin = user?.email === 'dattaeswar.tangeti@gmail.com';

  const isPast = (dateStr: string) => {
    if (!dateStr) return false;
    const showDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return showDate < today;
  };

  const handleUnblock = async (seatId: string) => {
    if (!window.confirm(`Are you sure you want to release seat ${seatId}?`)) return;
    
    try {
      const res = await fetch('/api/admin/seats/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ seatIds: [seatId] }),
      });
      if (res.ok) {
        setBookings(prev => prev.filter(b => b.id !== seatId));
      } else {
        alert('Failed to unblock');
      }
    } catch (err) {
      alert('Network Error');
    }
  };

  const currentBookings = bookings.filter(b => !isPast(movie?.date));
  const previousBookings = bookings.filter(b => isPast(movie?.date));

  useEffect(() => {
    Promise.all([
      fetch('/api/user/bookings', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
      fetch('/api/movie').then(res => res.ok ? res.json() : {})
    ])
    .then(([bookingData, movieData]) => {
      if (Array.isArray(bookingData)) {
        setBookings(bookingData);
      } else {
        console.error('Bookings data is not an array:', bookingData);
        setBookings([]);
      }
      setMovie(movieData);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-[#f2ca50] animate-spin" />
      </div>
    );
  }

  const BookingCard = ({ booking, index, isHistory = false }: { booking: Booking, index: number, isHistory?: boolean, key?: any }) => (
    <motion.div
      key={booking.id}
      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-[#131313] border ${isHistory ? 'border-[#4d4635]/30 grayscale-[0.5]' : 'border-[#4d4635]'} p-8 relative overflow-hidden group hover:border-[#f2ca50]/50 transition-all duration-500`}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Ticket className="w-20 h-20 text-[#f2ca50]" />
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] text-[#f2ca50] font-bold uppercase tracking-[0.3em] block mb-1">RESERVED SEAT</span>
            <h3 className="text-4xl font-serif text-[#e5e2e1] uppercase">{booking.id}</h3>
          </div>
          <div className={`${isHistory ? 'bg-[#99907c]/10 border-[#99907c]/30' : 'bg-[#f2ca50]/10 border-[#f2ca50]/30'} border px-3 py-1 rounded`}>
            <span className={`text-[10px] ${isHistory ? 'text-[#99907c]' : 'text-[#f2ca50]'} font-bold uppercase tracking-widest`}>
              {isHistory ? 'EXPIRED' : 'CONFIRMED'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-[#4d4635] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#99907c]" />
            </div>
            <div>
              <span className="text-[9px] text-[#99907c] uppercase tracking-widest block">SCREENING DATE</span>
              <span className="text-sm text-[#d0c5af] tracking-widest uppercase">{movie?.date || 'OCT 24, 2026'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-[#4d4635] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#99907c]" />
            </div>
            <div>
              <span className="text-[9px] text-[#99907c] uppercase tracking-widest block">SHOWTIME</span>
              <span className="text-sm text-[#d0c5af] tracking-widest uppercase">{movie?.time || '20:00'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-[#4d4635] flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#99907c]" />
            </div>
            <div>
              <span className="text-[9px] text-[#99907c] uppercase tracking-widest block">LOCATION</span>
              <span className="text-sm text-[#d0c5af] tracking-widest uppercase">THE GRAND VIZAG ESTATE</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#4d4635] flex justify-between items-center text-[9px] text-[#99907c] uppercase tracking-widest">
          <span>Reserved on {new Date(booking.bookedAt).toLocaleDateString()}</span>
          {isAdmin && !isHistory ? (
            <button 
              onClick={() => handleUnblock(booking.id)}
              className="text-[#f2ca50] hover:text-[#ff989b] transition-colors border border-[#f2ca50]/30 px-2 py-1 rounded"
            >
              Release Block
            </button>
          ) : (
            <span>TID: {booking.id}-{Date.now().toString().slice(-4)}</span>
          )}
        </div>
      </div>

      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/black-marble.png')]" />
    </motion.div>
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-5xl font-serif text-[#f2ca50] mb-4 tracking-widest uppercase">MY RESERVATIONS</h1>
            <p className="text-[#99907c] italic uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-sm">Your Personal Schedule at the Manor</p>
            <div className="w-48 h-px bg-gradient-to-r from-transparent via-[#f2ca50]/50 to-transparent mx-auto mt-8" />
          </motion.div>
        </header>

        {bookings.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-[#131313] border border-[#4d4635] rounded-sm"
          >
            <Ticket className="w-16 h-16 text-[#4d4635] mx-auto mb-6" />
            <p className="text-[#99907c] uppercase tracking-widest text-sm">No reservations found for your account.</p>
          </motion.div>
        ) : (
          <div className="space-y-20">
            {currentBookings.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-[#f2ca50] mb-8 border-l-2 border-[#f2ca50] pl-4">Upcoming Screenings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {currentBookings.map((booking, index) => (
                    <BookingCard key={booking.id} booking={booking} index={index} />
                  ))}
                </div>
              </section>
            )}

            {previousBookings.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-[#99907c] mb-8 border-l-2 border-[#99907c] pl-4">Past Memories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {previousBookings.map((booking, index) => (
                    <BookingCard key={booking.id} booking={booking} index={index} isHistory />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
