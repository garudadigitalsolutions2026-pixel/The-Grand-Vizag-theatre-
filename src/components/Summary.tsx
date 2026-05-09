import { useState, useEffect } from 'react';
import { CreditCard, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SummaryProps {
  selectedSeats: string[];
  user: any;
  onSuccess: () => void;
}

export default function Summary({ selectedSeats, user, onSuccess }: SummaryProps) {
  const navigate = useNavigate();
  const ticketPrice = 2200; // ₹2,200 per ticket
  const subtotal = selectedSeats.length * ticketPrice;
  const serviceFee = 350;
  const total = subtotal + serviceFee;

  const [processing, setProcessing] = useState(false);
  const [movie, setMovie] = useState<any>(null);

  useEffect(() => {
    fetch('/api/movie')
      .then(res => res.ok ? res.json() : {})
      .then(setMovie)
      .catch(err => console.error('Summary Fetch Error:', err));
  }, []);

  const handleBooking = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!(window as any).Razorpay) {
      alert('Payment system is still loading. Please wait a moment.');
      return;
    }

    setProcessing(true);
    try {
      console.log('Initiating payment for seats:', selectedSeats);
      // 1. Create Order on Server
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: total }),
      });
      
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        console.error('Server Order Error:', orderData);
        alert(`Failed to create order: ${orderData.error}`);
        setProcessing(false);
        return;
      }

      console.log('Order created successfully:', orderData.id);

      // 2. Open Razorpay Checkout
      const options = {
        key: 'rzp_test_ShReictGH7Zex4', // Public key
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'The Grand Vizag',
        description: `Booking for ${selectedSeats.join(', ')}`,
        order_id: orderData.id,
        handler: async (response: any) => {
          console.log('Payment successful receipt:', response.razorpay_payment_id);
          // 3. Complete Booking on Server after successful payment
          try {
            const bookRes = await fetch('/api/seats/book', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ 
                seatIds: selectedSeats,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature 
              }),
            });
            const bookData = await bookRes.json();
            if (bookRes.ok) {
              alert('Reservation Confirmed! Welcome to the Estate.');
              onSuccess();
            } else {
              alert(`Booking error: ${bookData.error}`);
              setProcessing(false);
            }
          } catch (err) {
            console.error('Booking completion error:', err);
            alert('Payment succeeded but reservation failed. Please contact support.');
            setProcessing(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#f2ca50',
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            console.log('Payment checkout closed');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        alert(`Payment Failed: ${response.error.description}`);
        setProcessing(false);
      });
      rzp.open();

    } catch (err) {
      console.error('Checkout process error:', err);
      alert('Could not connect to payment gateway.');
      setProcessing(false);
    }
  };

  return (
    <div className="marble-texture border border-[#f2ca50]/40 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] gold-glow relative z-10 max-w-lg mx-auto lg:max-w-none">
      {/* Card Header */}
      <div className="bg-[#2a2a2a]/50 border-b border-[#4d4635] p-6 md:p-8 text-center">
        <p className="text-[10px] font-bold text-[#f2ca50] tracking-[0.2em] mb-2 uppercase">RESERVATION SUMMARY</p>
        <h2 className="text-4xl font-playfair text-[#e5e2e1] uppercase tracking-wider">{movie?.title || 'Oppenheimer'}</h2>
        <p className="text-sm text-[#d0c5af] mt-2 italic">{movie?.description}</p>
      </div>

      {/* Card Content */}
      <div className="p-6 md:p-8 space-y-6 md:space-y-8">
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="text-[10px] font-bold text-[#99907c] block mb-2 uppercase tracking-widest">DATE & TIME</label>
            <p className="text-lg text-[#e5e2e1]">{movie?.date || 'Oct 24, 2026'} • {movie?.time || '20:00'}</p>
          </div>
          <div className="text-right">
            <label className="text-[10px] font-bold text-[#99907c] block mb-2 uppercase tracking-widest">ESTATE WING</label>
            <p className="text-lg text-[#e5e2e1]">The Manor Room</p>
          </div>
        </div>

        {/* Selected Seats */}
        <div className="border-t border-b border-[#4d4635] py-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-[10px] font-bold text-[#99907c] block mb-2 uppercase tracking-widest">SELECTED SEATS</label>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map(seat => (
                  <span key={seat} className="px-3 py-1 bg-[#8d1227]/30 border border-[#8d1227] text-[#ff989b] rounded font-bold">{seat}</span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span className="material-symbols-outlined text-[#f2ca50] text-4xl">chair</span>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#d0c5af]">{selectedSeats.length}x Premium Armchair Tickets</span>
            <span className="text-[#e5e2e1]">₹{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#d0c5af]">Concierge Service Fee</span>
            <span className="text-[#e5e2e1]">₹{serviceFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-2xl font-playfair pt-4 border-t border-[#4d4635] text-[#f2ca50]">
            <span>TOTAL</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Action */}
        <div className="pt-4 space-y-4">
          <button 
            onClick={handleBooking}
            disabled={processing}
            className={`w-full velvet-gradient border-2 border-[#f2ca50]/60 py-5 rounded-lg shadow-[0_10px_20px_rgba(141,18,39,0.3)] hover:scale-[1.02] transition-transform duration-300 group disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs font-bold text-white tracking-[0.2em] uppercase">
                {processing ? 'PROCESSING...' : (user ? 'PAY VIA RAZORPAY' : 'LOGIN TO RESERVE')}
              </span>
              {!processing && (user ? <CreditCard className="w-5 h-5 text-white" /> : <ArrowRight className="w-5 h-5 text-white" />)}
            </div>
          </button>

          {user?.email === 'dattaeswar.tangeti@gmail.com' && (
            <button 
              onClick={async () => {
                setProcessing(true);
                try {
                  const res = await fetch('/api/admin/seats/block', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ seatIds: selectedSeats }),
                  });
                  if (res.ok) {
                    alert('Seats Blocked Strategically - No Payment Collected.');
                    onSuccess();
                  } else {
                    const data = await res.json();
                    alert(`Error: ${data.error}`);
                  }
                } catch (err) {
                  alert('Network Error');
                } finally {
                  setProcessing(false);
                }
              }}
              disabled={processing}
              className="w-full bg-[#131313] border border-[#f2ca50]/40 py-4 rounded-lg text-[10px] font-bold text-[#f2ca50] uppercase tracking-[0.3em] hover:bg-[#f2ca50] hover:text-black transition-all duration-500 disabled:opacity-50"
            >
              Master Block (Admin)
            </button>
          )}

          <p className="text-center text-[10px] text-[#99907c] mt-6 tracking-widest uppercase">SECURE ENCRYPTED TRANSACTION</p>
        </div>
      </div>

      {/* Ornate Footer */}
      <div className="h-2 w-full bg-gradient-to-r from-transparent via-[#f2ca50]/50 to-transparent"></div>
    </div>
  );
}
