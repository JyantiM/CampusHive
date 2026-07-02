import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import api from '../utils/api';
import { LogIn, ShieldAlert, UserPlus, Eye, Users } from 'lucide-react';

const Auth = ({ onAuthSuccess }) => {
  const { loadUserProfile, branchesList, setCurrentUser } = useContext(AppContext);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState(branchesList[0]);
  const [year, setYear] = useState('3rd Year');

  // OTP Verification flow
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  const validateCollegeEmail = (emailStr) => {
    const normalized = emailStr.toLowerCase().trim();
    return normalized.endsWith('.ac.in') || normalized.endsWith('.edu') || normalized.endsWith('university.in');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Please fill out all the input fields.');
      return;
    }
    if (!validateCollegeEmail(email)) {
      alert('Authentication restricted. Sign up is only permitted using verified college emails (e.g. ending in @university.ac.in).');
      return;
    }

    try {
      const res = await api.post('/auth/send-otp', {
        name,
        email,
        branch,
        year,
        password
      });

      if (res.data.success) {
        setOtpSent(true);
        alert('Verification OTP code sent to your email. Check your inbox (or simulated console output).');
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to dispatch verification OTP.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', {
        email,
        otp: otpInput
      });

      if (res.data.token) {
        localStorage.setItem('campushive_token', res.data.token);
        await loadUserProfile();
        onAuthSuccess();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Incorrect verification OTP code.');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const performLogin = async (loginEmail, loginPassword) => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      alert('Please fill in email and password.');
      return;
    }

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword
      });

      if (res.data.token) {
        localStorage.setItem('campushive_token', res.data.token);
        await loadUserProfile();
        onAuthSuccess();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid credentials.');
    }
  };

  // Quick Login triggers
  const handleQuickLogin = async (role) => {
    if (role === 'student') {
      await performLogin('jyanti.k@university.ac.in', 'password123');
    } else if (role === 'senior') {
      await performLogin('amit.s@university.ac.in', 'password123');
    }
  };

  // Skip Login completely for guest browsing
  const handleGuestBrowse = () => {
    localStorage.setItem('campushive_token', 'mock_guest_token');
    setCurrentUser({
      name: 'Guest Student',
      email: 'guest@university.ac.in',
      branch: branchesList[0],
      year: '1st Year',
      karmaScore: 10,
      followedSubjects: ['DBMS'],
      uploadsCount: 0
    });
    onAuthSuccess();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-6 text-left relative overflow-hidden">
        {/* Brand visual header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-2xl mx-auto shadow-lg shadow-amber-500/10">
            CH
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Welcome to CampusHive</h2>
            <p className="text-xs text-slate-400">The premier academic resource hub for college students.</p>
          </div>
        </div>

        {/* Auth Domain Alert Banner */}
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-400 leading-normal">
            <strong>College Access:</strong> Verification checks apply. Logins and registrations are restricted to verified academic email suffix domains (e.g. <code className="bg-slate-950 text-amber-500 px-1 py-0.5 rounded font-mono">@university.ac.in</code> or <code className="bg-slate-950 text-amber-500 px-1 py-0.5 rounded font-mono">.edu</code>).
          </p>
        </div>

        {/* Send OTP Registration Subflow */}
        {isSignUp ? (
          !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jyanti Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">College Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. student@university.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">College Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 animate-none w-full"
                  >
                    {branchesList.map((br, idx) => (
                      <option key={idx} value={br}>{br}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 w-full"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secure Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm transition shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Send Verification OTP</span>
              </button>
            </form>
          ) : (
            // Enter OTP Subflow
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center space-y-1">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">OTP Sent!</span>
                <p className="text-xs text-slate-400">Please enter the 4-digit code generated by our Nodemailer OTP service.</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">4-Digit Verification Code</label>
                <input
                  type="text"
                  placeholder="e.g. 1234"
                  maxLength="6"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-center text-lg font-black font-mono tracking-widest text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm transition shadow-md shadow-amber-500/10"
              >
                Verify Code & Register
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-400 hover:underline"
              >
                Change Registration Details
              </button>
            </form>
          )
        ) : (
          // Direct login form
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">College Email Address</label>
              <input
                type="email"
                placeholder="student@university.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm transition shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Verify & Sign In</span>
            </button>

            {/* Test Credentials Quick Login Box */}
            <div className="border-t border-slate-800/80 pt-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Login (Test Accounts)</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('student')}
                  className="px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-bold hover:bg-slate-800 hover:border-amber-500/40 transition"
                >
                  Student (Jyanti)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('senior')}
                  className="px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-bold hover:bg-slate-800 hover:border-amber-500/40 transition"
                >
                  Senior (Amit)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Action Bypass Buttons */}
        <div className="border-t border-slate-800/60 pt-3 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleGuestBrowse}
            className="text-xs text-amber-500 hover:text-amber-400 hover:underline font-bold"
          >
            Browse as Guest Student &rarr;
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setOtpSent(false);
            }}
            className="text-xs text-slate-500 hover:text-slate-400 hover:underline"
          >
            {isSignUp ? 'Already registered? Sign In' : 'Create Verified Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
