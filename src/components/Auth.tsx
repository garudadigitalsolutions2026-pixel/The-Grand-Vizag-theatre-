import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Auth({ onLogin }: { onLogin: (user: any) => void }) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authType, setAuthType] = useState<'customer' | 'admin'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (isReset = false) => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    setLoading(true);
    setError('');
    const endpoint = isReset ? '/api/auth/reset-password-request' : '/api/auth/send-otp';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        if (isReset) setMessage(data.message);
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch (err) {
      setError('Connection failed. Is your Vercel backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (mode === 'register' && !otpSent) {
      handleSendOtp(false);
      return;
    }

    if (mode === 'forgot' && !otpSent) {
      handleSendOtp(true);
      return;
    }

    let endpoint = '';
    let body = {};

    if (mode === 'login') {
      endpoint = '/api/auth/login';
      body = { email, password };
    } else if (mode === 'register') {
      endpoint = '/api/auth/register';
      body = { email, password, name, otp };
    } else if (mode === 'forgot') {
      endpoint = '/api/auth/reset-password-verify';
      body = { email, otp, newPassword: password };
    }

    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        if (mode === 'forgot') {
          setMessage(data.message);
          setMode('login');
          setOtpSent(false);
          setOtp('');
          setPassword('');
        } else {
          onLogin(data);
          navigate('/');
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 px-4 bg-[#131313]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md marble-texture border border-[#f2ca50]/40 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] gold-glow p-8"
      >
        <div className="flex border-b border-[#4d4635] mb-8">
          <button 
            type="button"
            onClick={() => { setAuthType('customer'); setMode('login'); }}
            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${authType === 'customer' ? 'text-[#f2ca50] border-b-2 border-[#f2ca50]' : 'text-[#99907c] hover:text-[#d0c5af]'}`}
          >
            Guest Access
          </button>
          <button 
            type="button"
            onClick={() => { setAuthType('admin'); setMode('login'); }}
            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${authType === 'admin' ? 'text-[#f2ca50] border-b-2 border-[#f2ca50]' : 'text-[#99907c] hover:text-[#d0c5af]'}`}
          >
            Stewardship
          </button>
        </div>

        <h2 className="text-2xl font-serif text-[#f2ca50] text-center mb-8 uppercase tracking-widest">
          {authType === 'admin' 
            ? 'Steward Login' 
            : mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Join the Estate' : 'Recover Access'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#99907c] mb-2">Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#131313] border border-[#4d4635] text-[#e5e2e1] px-4 py-3 rounded focus:border-[#f2ca50] focus:ring-1 focus:ring-[#f2ca50] outline-none transition-all"
                required={mode === 'register'}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#99907c] mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#131313] border border-[#4d4635] text-[#e5e2e1] px-4 py-3 rounded focus:border-[#f2ca50] focus:ring-1 focus:ring-[#f2ca50] outline-none transition-all"
              required
            />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#99907c]">
                {mode === 'forgot' ? 'New Password' : 'Password'}
              </label>
              {mode === 'login' && (
                <button 
                  type="button"
                  onClick={() => { setMode('forgot'); setOtpSent(false); setError(''); setMessage(''); }}
                  className="text-[10px] text-[#f2ca50] hover:underline uppercase tracking-widest"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#131313] border border-[#4d4635] text-[#e5e2e1] px-4 py-3 rounded focus:border-[#f2ca50] focus:ring-1 focus:ring-[#f2ca50] outline-none transition-all"
              required
            />
          </div>

          {otpSent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#f2ca50]">Access Code</label>
                <button 
                  type="button"
                  onClick={() => handleSendOtp(mode === 'forgot')}
                  disabled={loading}
                  className="text-[10px] text-[#f2ca50] hover:underline disabled:opacity-50"
                >
                  {loading ? 'Resending...' : 'Resend Code'}
                </button>
              </div>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                className="w-full bg-[#131313] border border-[#f2ca50] text-[#f2ca50] px-4 py-3 rounded focus:ring-1 focus:ring-[#f2ca50] outline-none transition-all placeholder:text-[#f2ca50]/30"
                required={otpSent}
              />
            </motion.div>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {message && <p className="text-[#f2ca50] text-sm text-center italic">{message}</p>}
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full velvet-gradient border border-[#f2ca50]/60 py-4 rounded font-bold text-white tracking-[0.3em] hover:scale-[1.02] transition-transform duration-300 shadow-[0_10px_20px_rgba(141,18,39,0.3)] disabled:opacity-50 uppercase text-xs"
          >
            {loading ? 'Processing...' : (
              mode === 'forgot' 
                ? (otpSent ? 'Update Password' : 'Send Reset Code')
                : mode === 'register' 
                  ? (otpSent ? 'Verify & Join' : 'Send Access Code')
                  : 'Enter Theater'
            )}
          </button>
        </form>
        <p className="text-center mt-8 text-[#99907c] text-xs uppercase tracking-widest">
          {mode === 'login' ? "New Guest? " : mode === 'register' ? "Already a Member? " : "Remembered? "}
          <button 
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setOtpSent(false);
              setError('');
              setMessage('');
            }}
            className="text-[#f2ca50] hover:underline font-bold"
          >
            {mode === 'login' ? 'Register' : 'Login'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
