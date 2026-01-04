import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Star, Shield, MapPin, Calendar, CheckCircle } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  // Mock data simulation based on userId
  const user = {
    id: userId,
    name: 'Jane Doe',
    avatarUrl: `https://i.pravatar.cc/150?u=${userId}`,
    bio: 'Community member helping reunite lost items with their owners.',
    location: 'New York, NY',
    joinDate: 'March 2023',
    trustScore: 98,
    itemsReported: 5,
    itemsFound: 12,
    badges: ['Top Finder', 'Verified Email', 'Community Guardian']
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-slate-500 hover:text-slate-800 transition mb-6 font-medium"
      >
        <ArrowLeft size={18} className="mr-2" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-teal-500 to-emerald-600 relative">
             <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold border border-white/30">
                Public Profile
             </div>
        </div>
        
        <div className="px-8 pb-10">
          <div className="flex flex-col md:flex-row gap-6 items-start -mt-12 mb-8">
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-white"
            />
            <div className="mt-14 md:mt-14 flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {user.name}
                            <Shield size={20} className="text-indigo-500" />
                        </h1>
                        <p className="text-slate-500 text-sm flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1"><MapPin size={14} /> {user.location}</span>
                            <span className="flex items-center gap-1"><Calendar size={14} /> Joined {user.joinDate}</span>
                        </p>
                    </div>
                    <div className="text-center bg-indigo-50 px-4 py-2 rounded-xl">
                        <div className="text-2xl font-black text-indigo-600">{user.trustScore}</div>
                        <div className="text-[10px] uppercase font-bold text-indigo-400">Trust Score</div>
                    </div>
                </div>
            </div>
          </div>

          <p className="text-slate-600 mb-8 leading-relaxed max-w-2xl">
             {user.bio}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
               <div className="text-2xl font-bold text-slate-800">{user.itemsReported}</div>
               <div className="text-xs text-slate-500 font-bold uppercase">Items Reported</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
               <div className="text-2xl font-bold text-teal-600">{user.itemsFound}</div>
               <div className="text-xs text-slate-500 font-bold uppercase">Items Found</div>
            </div>
             <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-2">
               <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                  <Star size={20} fill="currentColor" />
               </div>
               <div>
                   <div className="text-sm font-bold text-slate-800">4.9/5</div>
                   <div className="text-[10px] text-slate-500 font-bold uppercase">Rating</div>
               </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award size={18} className="text-amber-500" />
                Badges & Verification
            </h3>
            <div className="flex flex-wrap gap-3">
              {user.badges.map((badge, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700 font-medium">
                   <CheckCircle size={14} className="text-green-500" />
                   {badge}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};