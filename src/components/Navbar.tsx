import { useState } from 'react';
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 px-4 md:px-16 py-4 bg-[#131313]/95 backdrop-blur-md border-b border-[#4d4635] shadow-[0_4px_20px_rgba(212,175,55,0.15)]">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-4 hover:opacity-80 active:scale-95 transition-all duration-300 group"
            title="Return to the Landing Page"
          >
            <h1 className="text-xl md:text-2xl font-playfair tracking-widest text-[#f2ca50] group-hover:drop-shadow-[0_0_10px_rgba(242,202,80,0.3)]">THE GRAND VIZAG</h1>
          </Link>
        </div>

        {/* Desktop Links */}
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
            <div className="flex items-center gap-3 md:gap-6">
              <div className="flex items-center gap-2 text-[#f2ca50]">
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">{user.name}</span>
                <User className="w-5 h-5" />
              </div>
              <button 
                onClick={onLogout}
                className="text-[10px] font-bold uppercase tracking-widest text-[#99907c] hover:text-[#f2ca50] transition-all border border-[#99907c]/30 px-2 md:px-3 py-1 rounded-sm hover:border-[#f2ca50]/50"
              >
                Sign Out
              </button>
              
              {/* Mobile Menu Toggle */}
              {(user?.email === 'dattaeswar.tangeti@gmail.com' || user) && (
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden text-[#f2ca50]"
                >
                  <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                </button>
              )}
            </div>
          ) : (
            <Link to="/auth" className="flex items-center">
              <User className="text-[#f2ca50] w-6 h-6" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#131313] border-b border-[#4d4635] p-6 space-y-4 animate-in slide-in-from-top duration-300">
          {user?.email === 'dattaeswar.tangeti@gmail.com' && (
            <Link 
              to="/admin" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-xs font-bold uppercase tracking-[0.2em] text-[#f2ca50] border border-[#f2ca50]/30 px-4 py-3 rounded text-center"
            >
              Admin Manor
            </Link>
          )}
          {user && (
            <Link 
              to="/account" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-xs font-bold uppercase tracking-widest text-[#d0c5af] px-4 py-3 text-center border border-[#4d4635] rounded"
            >
              My Reservations
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
