import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Bell, Search, BookOpen, X, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const Navbar = ({ activeTab, setActiveTab, onNavigateDetail, canGoBack, goBack }) => {
  const { notifications, currentUser, setNotifications, notes, pyqs, quizzes, dismissNotification } = useContext(AppContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Global search across all catalogs ──────────────────────────────────────
  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const lq = q.toLowerCase();
    const noteHits = notes
      .filter(n => n.title?.toLowerCase().includes(lq) || n.subject?.toLowerCase().includes(lq))
      .slice(0, 4)
      .map(n => ({ ...n, _type: 'note' }));
    const pyqHits = pyqs
      .filter(p => p.title?.toLowerCase().includes(lq) || p.subject?.toLowerCase().includes(lq))
      .slice(0, 3)
      .map(p => ({ ...p, _type: 'pyq' }));
    const quizHits = quizzes
      .filter(q => q.title?.toLowerCase().includes(lq) || q.subject?.toLowerCase().includes(lq))
      .slice(0, 3)
      .map(q => ({ ...q, _type: 'quiz' }));
    setSearchResults([...noteHits, ...pyqHits, ...quizHits]);
    setShowResults(true);
  };

  const handleResultClick = (item) => {
    const id = String(item._id || item.id);
    onNavigateDetail(item._type, id);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  // ── Notification routing ────────────────────────────────────────────────────
  const handleNotificationClick = (linkId, type) => {
    // Notify backend
    const notification = notifications.find(n => n.link === linkId);
    if (notification && notification._id) {
      api.put(`/doubts/notifications/${notification._id}/read`).catch(() => {});
    }

    setNotifications(notifications.map(n =>
      n.link === linkId ? { ...n, read: true } : n
    ));
    setShowNotifications(false);

    // Extract actual type and ID (e.g., "note:65bc...")
    let targetType = 'note';
    let targetId = linkId;
    if (linkId.includes(':')) {
      const parts = linkId.split(':');
      targetType = parts[0];
      targetId = parts[1];
    } else {
      if (linkId.startsWith('quiz')) targetType = 'quiz';
      else if (linkId.startsWith('pyq')) targetType = 'pyq';
    }

    if (type === 'upload') {
      onNavigateDetail(targetType, targetId);
    } else {
      setActiveTab('profile');
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3 flex justify-between items-center gap-3 shadow-lg">
      {/* Brand Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer shrink-0"
        onClick={() => setActiveTab('home')}
      >
        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-base shadow-md shadow-amber-500/20">
          CH
        </div>
        <span className="font-extrabold text-xl tracking-tight text-white hidden sm:block">
          Campus<span className="text-amber-500">Hive</span>
        </span>
      </div>

      {/* Back arrow — visible when there's a previous page */}
      {canGoBack && (
        <button
          onClick={goBack}
          title="Go back"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition shrink-0 text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
      )}

      {/* ── Center Global Search ─────────────────────────────────────────── */}
      <div className="flex-1 max-w-lg relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Search notes, PYQs, quizzes, subjects..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-amber-500 text-slate-200 text-sm transition"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Dropdown Results */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
            {searchResults.map(item => {
              const id = String(item._id || item.id);
              return (
                <button
                  key={id}
                  onClick={() => handleResultClick(item)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-800 transition flex items-center gap-3 border-b border-slate-800/50 last:border-0"
                >
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0 ${
                    item._type === 'quiz'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : item._type === 'pyq'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {item._type}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-500">{item.subject}</p>
                  </div>
                </button>
              );
            })}
            {searchResults.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">No results found.</div>
            )}
          </div>
        )}

        {/* No results state */}
        {showResults && searchQuery.length >= 2 && searchResults.length === 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 px-4 py-6 text-center text-xs text-slate-500">
            No results for "{searchQuery}"
          </div>
        )}
      </div>

      {/* ── Right Controls ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Browse / Home tab */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === 'home'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Browse</span>
        </button>

        {/* Upload tab */}
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === 'upload'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'border border-slate-800 hover:bg-slate-800 text-slate-300'
          }`}
        >
          Upload
        </button>

        {/* Notifications bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 relative transition"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
              <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800">
                <span className="font-bold text-sm text-slate-200">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        setNotifications(notifications.map(n => ({ ...n, read: true })));
                        setShowNotifications(false);
                      }}
                      className="text-xs text-amber-500 hover:underline mr-1"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-850 transition"
                    title="Close notifications"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto mt-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">No notifications yet.</div>
                ) : (
                  notifications.map((n, idx) => (
                    <div
                      key={n.id || idx}
                      onClick={() => handleNotificationClick(n.link, n.type)}
                      className={`p-3 rounded-lg hover:bg-slate-800 cursor-pointer transition text-left mb-1 border-l-2 relative group/item ${
                        n.read ? 'border-transparent opacity-60' : 'border-amber-500 bg-amber-500/5'
                      }`}
                    >
                      {/* Dismiss button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(n._id || n.id);
                        }}
                        title="Dismiss notification"
                        className="absolute top-2 right-2 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-950/40 transition opacity-0 group-hover/item:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <p className="text-xs text-slate-300 font-medium pr-6">{n.message}</p>
                      <span className="text-[10px] text-slate-500">{n.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile avatar button */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border transition ${
            activeTab === 'profile'
              ? 'bg-slate-800 border-amber-500/50'
              : 'border-slate-800 hover:bg-slate-800'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
            {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight max-w-[80px] truncate">
              {currentUser?.name?.split(' ')[0] || 'User'}
            </p>
            <span className="text-[10px] text-amber-500 font-bold leading-tight">
              ⭐ {currentUser?.karmaScore ?? 0}
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
