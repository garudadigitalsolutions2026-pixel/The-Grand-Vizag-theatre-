import { User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-16 py-4 bg-[#131313]/95 backdrop-blur-md border-b border-[#4d4635] shadow-[0_4px_20px_rgba(212,175,55,0.15)]">
      <div className="flex items-center gap-4">
        <Link 
          to="/" 
          className="flex items-center gap-4 hover:opacity-80 active:scale-95 transition-all duration-300 group"
          title="Return to the Landing Page"
        >
          <h1 className="text-2xl font-playfair tracking-widest text-[#f2ca50] group-hover:drop-shadow-[0_0_10px_rgba(242,202,80,0.3)]">THE GRAND VIZAG</h1>
        </Link>
      </div>
      <div className="hidden md:flex gap-8 items-center">
        {user?.email === 'dattaeswar.tangeti@gmail.com' && (
          <Link to="/admin" className="text-xs font-bold uppercase tracking-[0.2em] text-[#f2ca50] hover:scale-105 transition-all duration-300 border border-[#f2ca50]/30 px-3 py-1 rounded">Admin Manor</Link>
        )}
        {user && (
          <Link to="/account" className="text-xs font-bold uppercase tracking-widest text-[#d0c5af] hover:text-[#f2ca50] transition-all duration-300">My Reservations</Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[#f2ca50]">
              <span className="text-xs font-bold uppercase tracking-widest">{user.name}</span>
              <User className="w-5 h-5" />
            </div>
            <button 
              onClick={onLogout}
              className="text-[10px] font-bold uppercase tracking-widest text-[#99907c] hover:text-[#f2ca50] transition-all border border-[#99907c]/30 px-3 py-1 rounded-sm hover:border-[#f2ca50]/50"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link to="/auth" className="flex items-center">
            <User className="text-[#f2ca50] w-6 h-6" />
          </Link>
        )}
      </div>
    </header>
  );
}
