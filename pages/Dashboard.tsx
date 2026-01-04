import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ItemCard } from '../components/ItemCard';
import { Settings, LogOut, Check, AlertCircle, Plus, SearchX, Radar, Loader2, RefreshCw } from 'lucide-react';
import { Match } from '../types';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useItems } from '../contexts/ItemsContext';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LOST' | 'FOUND'>('LOST');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { items, loading } = useItems();
  
  // Use global notification state
  const { matches, isScanning, triggerScan } = useNotifications();
  
  if (!user) return null; 

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff`;

  const userItems = items.filter(item => 
    item.userId === user.id && item.type === activeTab
  );

  const handleViewMatch = (match: Match) => {
    navigate(`/match/${match.id}`, { state: { match } });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleForceScan = () => {
    triggerScan(true); // Force scan
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar / Profile */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center sticky top-24">
            <div className="relative inline-block mb-4">
              <img 
                src={avatarUrl} 
                alt={displayName} 
                className="w-24 h-24 rounded-full border-4 border-indigo-50 mx-auto"
              />
              <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
            </div>
            <h2 className="text-xl font-bold text-slate-800 break-words">{displayName}</h2>
            <p className="text-slate-500 text-sm mb-6 break-all">{user.email}</p>
            
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/profile')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-medium transition"
              >
                <Settings size={16} /> Edit Profile
              </button>
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-lg text-sm font-medium transition"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[600px]">
            <div className="border-b border-slate-100 p-4 flex gap-4">
              <button 
                onClick={() => setActiveTab('LOST')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition ${activeTab === 'LOST' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                My Lost Items
              </button>
              <button 
                onClick={() => setActiveTab('FOUND')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition ${activeTab === 'FOUND' ? 'bg-teal-50 text-teal-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                My Found Items
              </button>
            </div>
            
            <div className="p-6">
              {loading ? (
                 <div className="text-center py-20 text-slate-400">Loading reports...</div>
              ) : userItems.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="text-slate-300" />
                  </div>
                  <h3 className="text-slate-900 font-medium mb-1">No reports yet</h3>
                  <p className="text-slate-400 text-sm mb-6">You haven't reported any {activeTab.toLowerCase()} items.</p>
                  
                  <button 
                    onClick={() => navigate(`/report/${activeTab.toLowerCase()}`)}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus size={18} /> Report {activeTab === 'LOST' ? 'Lost Item' : 'Found Item'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userItems.map(item => (
                    <ItemCard 
                      key={item.id} 
                      item={item} 
                      onClick={() => navigate(`/item/${item.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Notifications Panel */}
        <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-24">
              <div className="bg-indigo-600 p-4">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <div className={`w-2 h-2 bg-green-400 rounded-full ${isScanning ? 'animate-ping' : ''}`}></div>
                        AI Matches
                    </h3>
                    <button 
                        onClick={handleForceScan}
                        disabled={isScanning}
                        className="text-indigo-200 hover:text-white transition disabled:opacity-50"
                        title="Force Scan"
                    >
                        <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
                    </button>
                </div>
                <p className="text-indigo-200 text-xs flex items-center gap-1 min-h-[1.5em]">
                  {isScanning ? (
                    <>
                      <Loader2 size={10} className="animate-spin" /> Scanning reports...
                    </>
                  ) : (
                    <>
                        {matches.length} matches found
                    </>
                  )}
                </p>
              </div>
              
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {matches.length > 0 ? (
                  matches.map(match => (
                    <div key={match.id} className="p-4 hover:bg-indigo-50 transition cursor-pointer group animate-[fadeIn_0.5s_ease-out]">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${match.confidenceScore >= 80 ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}`}>
                          {match.confidenceScore}% Match
                        </span>
                        <span className="text-xs text-slate-400">
                          {match.id.startsWith('m-') ? 'New' : 'Recent'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">Potential match found!</p>
                      
                      <div className="space-y-1 mb-3">
                        {match.reasons.slice(0, 2).map((reason, idx) => (
                          <div key={idx} className="flex items-center text-xs text-slate-600">
                            <Check size={10} className="text-indigo-500 mr-1.5 shrink-0" />
                            <span className="truncate">{reason}</span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => handleViewMatch(match)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition opacity-0 group-hover:opacity-100"
                      >
                        Verify Match
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <Radar className={`mx-auto mb-2 opacity-50 ${isScanning ? 'animate-pulse text-indigo-400' : ''}`} size={32} />
                    <p className="text-sm font-medium text-slate-600">
                      {isScanning ? 'AI is analyzing...' : 'No matches yet'}
                    </p>
                    <p className="text-xs mt-1">
                         Gemini is monitoring for you. <br/>
                         <button onClick={handleForceScan} className="text-indigo-600 hover:underline mt-2">Scan Now</button>
                    </p>
                  </div>
                )}
              </div>
            </div>
        </div>

      </div>
    </div>
  );
};