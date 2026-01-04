import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, PlusCircle, Bell, User, Menu, X, Check, ArrowRight, ChevronRight, LogIn } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { Match } from '../types';

// Toast Notification Component (Internal)
const NotificationToast = ({ match, onClose, onViewDetails }: { match: Match; onClose: () => void; onViewDetails: () => void }) => (
  <div className="fixed top-24 right-4 z-[60] w-80 animate-[slideIn_0.5s_ease-out]">
    <div className="bg-white rounded-xl shadow-2xl border border-indigo-100 p-4 relative overflow-hidden">
       <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
       <div className="flex items-start gap-4">
         <div className="bg-indigo-50 rounded-full p-2.5 text-indigo-600 shrink-0 mt-1">
           <Bell size={20} />
         </div>
         <div className="flex-1 min-w-0">
           <div className="flex justify-between items-start">
              <h4 className="font-bold text-slate-900 text-sm">New Match Found!</h4>
              <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition -mt-1 -mr-1">
                 <X size={16} />
              </button>
           </div>
           <p className="text-xs text-slate-500 mt-1 leading-relaxed">
             Gemini detected a <span className="font-bold text-indigo-600">{match.confidenceScore}% confidence</span> match.
           </p>
         </div>
       </div>
       <button 
          onClick={onViewDetails}
          className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center justify-center gap-1"
       >
         View Match Details <ArrowRight size={12} />
       </button>
    </div>
  </div>
);

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);
  
  const { matches, unreadCount, markAsRead, latestMatch, clearLatestMatch } = useNotifications();
  const { user, signOut } = useAuth();

  const isAuthPage = location.pathname === '/login';

  // Helper to get user display info
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff`;

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Toast Auto-dismiss
  useEffect(() => {
    if (latestMatch && user) {
      const timer = setTimeout(() => {
        clearLatestMatch();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [latestMatch, clearLatestMatch, user]);

  const handleToggleNotif = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen) {
      markAsRead();
    }
  };

  const handleViewMatch = (match: Match) => {
    setIsNotifOpen(false);
    clearLatestMatch();
    navigate(`/match/${match.id}`, { state: { match } });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Global Toast - Only show if user is logged in */}
      {latestMatch && user && (
        <NotificationToast 
          match={latestMatch} 
          onClose={clearLatestMatch} 
          onViewDetails={() => handleViewMatch(latestMatch)} 
        />
      )}

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  R
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-800">Reunify</span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {user ? (
                <>
                  <Link to="/browse" className="text-slate-500 hover:text-indigo-600 font-medium transition">Browse</Link>
                  <Link to="/report/lost" className="text-slate-500 hover:text-indigo-600 font-medium transition">Report Lost</Link>
                  <Link to="/report/found" className="text-slate-500 hover:text-indigo-600 font-medium transition">Report Found</Link>
                  
                  <div className="flex items-center space-x-4 border-l pl-6 border-slate-200">
                    {/* Notification Bell */}
                    <div className="relative" ref={notifRef}>
                      <button 
                        onClick={handleToggleNotif}
                        className={`relative p-2 transition rounded-full hover:bg-slate-100 ${isNotifOpen ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-500'}`}
                      >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                        )}
                      </button>

                      {/* Notification Tray */}
                      {isNotifOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl ring-1 ring-black ring-opacity-5 py-0 overflow-hidden animate-[fadeIn_0.1s_ease-out] z-50">
                          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-700">Notifications</h3>
                            {unreadCount > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{unreadCount} New</span>}
                          </div>
                          
                          <div className="max-h-96 overflow-y-auto">
                            {matches.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 text-sm">
                                No notifications yet.
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-50">
                                {matches.map(match => (
                                  <div 
                                    key={match.id} 
                                    onClick={() => handleViewMatch(match)}
                                    className="p-4 hover:bg-slate-50 transition cursor-pointer group"
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${match.confidenceScore >= 90 ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {match.confidenceScore}% Match
                                      </span>
                                      <span className="text-[10px] text-slate-400">Now</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-800 mb-0.5">Potential Match Found</p>
                                    <p className="text-xs text-slate-500 line-clamp-2">
                                      {match.reasons[0]}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                            <Link 
                              to="/dashboard" 
                              onClick={() => setIsNotifOpen(false)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1"
                            >
                              View All in Dashboard <ChevronRight size={12} />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>

                    <Link to="/dashboard" className="flex items-center gap-2 group">
                      <img src={avatarUrl} alt="Profile" className="w-8 h-8 rounded-full border border-slate-200 group-hover:border-indigo-400 transition" />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 hidden lg:block max-w-[100px] truncate">
                        {displayName}
                      </span>
                    </Link>
                    
                    <button onClick={handleSignOut} className="text-sm font-medium text-slate-400 hover:text-slate-600">
                        <span className="sr-only">Sign Out</span>
                        <LogIn size={20} className="rotate-180" />
                    </button>
                  </div>
                </>
              ) : (
                <Link to="/login" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition">
                   <LogIn size={18} /> Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="text-slate-500 hover:text-slate-700 p-2"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 animate-fade-in">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {user ? (
                <>
                  <div className="flex items-center px-3 py-3 mb-2 border-b border-slate-100">
                    <img src={avatarUrl} alt="Profile" className="w-10 h-10 rounded-full mr-3" />
                    <div>
                      <p className="font-bold text-slate-800">{displayName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">Dashboard</Link>
                  <Link to="/browse" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">Browse Items</Link>
                  <Link to="/report/lost" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">Report Lost</Link>
                  <Link to="/report/found" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">Report Found</Link>
                  <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-rose-600 hover:bg-rose-50">Sign Out</button>
                </>
              ) : (
                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50">Sign In</Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">© 2026 Reunify. Built with Gemini AI.</p>
        </div>
      </footer>
    </div>
  );
};
