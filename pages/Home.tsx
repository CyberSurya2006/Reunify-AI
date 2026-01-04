import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stats } from '../types';

export const Home: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ totalLost: 0, totalFound: 0, totalResolved: 0 });

  // Simulate counting up animation
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        totalLost: Math.min(prev.totalLost + 5, 1240),
        totalFound: Math.min(prev.totalFound + 4, 980),
        totalResolved: Math.min(prev.totalResolved + 3, 850),
      }));
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-50 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Reunite with what <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">truly matters.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-10 leading-relaxed">
              The AI-powered Lost & Found platform. We use Gemini to match lost items with found reports instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/report/lost" className="w-full sm:w-auto px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg hover:shadow-rose-500/25 transition transform hover:-translate-y-1">
                I Lost Something
              </Link>
              <Link to="/report/found" className="w-full sm:w-auto px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-teal-500/25 transition transform hover:-translate-y-1">
                I Found Something
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl font-black text-rose-500 mb-2">{stats.totalLost.toLocaleString()}+</div>
              <div className="text-slate-500 font-medium uppercase tracking-wide text-sm">Lost Reports</div>
            </div>
            <div className="text-center p-6 border-l-0 md:border-l border-slate-100">
              <div className="text-4xl font-black text-teal-500 mb-2">{stats.totalFound.toLocaleString()}+</div>
              <div className="text-slate-500 font-medium uppercase tracking-wide text-sm">Items Found</div>
            </div>
            <div className="text-center p-6 border-l-0 md:border-l border-slate-100">
              <div className="text-4xl font-black text-indigo-500 mb-2">{stats.totalResolved.toLocaleString()}+</div>
              <div className="text-slate-500 font-medium uppercase tracking-wide text-sm">Happy Reunions</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-indigo-600 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10">Ready to join the community?</h2>
            <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto relative z-10">
              Create an account to track your reports and get instant AI notifications when matches are found.
            </p>
            <Link to="/dashboard" className="inline-block bg-white text-indigo-600 font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-indigo-50 transition relative z-10">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};