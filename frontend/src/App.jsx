import React, { useState, useEffect, useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import MaterialDetail from './pages/MaterialDetail';
import QuizDetail from './pages/QuizDetail';
import { LogOut, Loader2 } from 'lucide-react';

const AppContent = () => {
  const { currentUser } = useContext(AppContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ── Navigation history stack ─────────────────────────────────────────────
  // Each entry: { tab: string, detail?: { type, id } }
  const [navStack, setNavStack] = useState([{ tab: 'home' }]);
  const currentNav = navStack[navStack.length - 1];
  const activeTab = currentNav.tab;

  // Push a new tab onto the stack
  const pushNav = (tab, detail = null) => {
    const entry = detail ? { tab, detail } : { tab };
    setNavStack(prev => [...prev, entry]);
    window.scrollTo(0, 0);
  };

  // Pop back to previous page
  const goBack = () => {
    if (navStack.length > 1) {
      setNavStack(prev => prev.slice(0, -1));
      window.scrollTo(0, 0);
    }
  };

  // Jump directly to a tab (resets stack above home)
  const setActiveTab = (tab) => {
    setNavStack([{ tab: 'home' }, ...(tab !== 'home' ? [{ tab }] : [])]);
    window.scrollTo(0, 0);
  };

  const handleNavigateDetail = (type, id) => {
    pushNav('detail', { type, id });
  };

  useEffect(() => {
    const token = localStorage.getItem('campushive_token');
    if (token) setIsAuthenticated(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('campushive_token');
    setIsAuthenticated(false);
    setNavStack([{ tab: 'home' }]);
  };

  const renderPage = () => {
    if (activeTab === 'detail' && currentNav.detail) {
      const { type, id } = currentNav.detail;
      if (type === 'quiz') {
        return <QuizDetail id={id} onBack={goBack} />;
      }
      return <MaterialDetail type={type} id={id} onBack={goBack} />;
    }

    switch (activeTab) {
      case 'home':
        return <Home onNavigateDetail={handleNavigateDetail} />;
      case 'upload':
        return <Upload setActiveTab={setActiveTab} />;
      case 'profile':
        return <Profile onNavigateDetail={handleNavigateDetail} />;
      default:
        return <Home onNavigateDetail={handleNavigateDetail} />;
    }
  };

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm">Loading CampusHive profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNavigateDetail={handleNavigateDetail}
        canGoBack={navStack.length > 1}
        goBack={goBack}
      />

      <main className="flex-1 pb-20">
        {renderPage()}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-5 text-center text-xs text-slate-600 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 CampusHive — Built for verified student networks at IIT.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-slate-500 hover:text-rose-400 font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
