import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Camera, Save, ArrowLeft, Loader2, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    notifications: true
  });

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        bio: user.user_metadata?.bio || '',
        notifications: user.user_metadata?.notifications !== false // Default true
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update Supabase user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          phone: formData.phone,
          bio: formData.bio,
          notifications: formData.notifications
        }
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${formData.name || 'User'}&background=6366f1&color=fff`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-slate-500 hover:text-slate-800 transition mb-6 font-medium"
      >
        <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32 relative">
           {/* Cover Photo Placeholder */}
        </div>
        
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-8">
            <div className="relative">
              <img 
                src={avatarUrl} 
                alt="Profile" 
                className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white"
              />
              <button className="absolute bottom-0 right-0 bg-slate-800 text-white p-1.5 rounded-full hover:bg-slate-700 transition border-2 border-white">
                <Camera size={14} />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Edit Profile</h1>
            <p className="text-slate-500 text-sm">Update your personal information and preferences.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe"
                    className="pl-10 w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition p-2.5 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-slate-400" />
                  </div>
                  <input 
                    type="email" 
                    value={formData.email}
                    disabled
                    className="pl-10 w-full rounded-lg border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed p-2.5 text-sm"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={16} className="text-slate-400" />
                  </div>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 000-0000"
                    className="pl-10 w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition p-2.5 text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
              <textarea 
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell us a bit about yourself..."
                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition p-2.5 text-sm text-slate-900"
              />
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Notifications</h3>
              <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                <div className={`w-10 h-6 rounded-full relative transition-colors ${formData.notifications ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.notifications ? 'left-5' : 'left-1'}`}></div>
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={formData.notifications}
                  onChange={(e) => setFormData({...formData, notifications: e.target.checked})}
                />
                <div className="flex-1">
                   <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                     <Bell size={14} className="text-indigo-500" /> Match Alerts
                   </div>
                   <p className="text-xs text-slate-500">Receive emails when Gemini finds a high-confidence match.</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-4">
               <button 
                type="submit" 
                disabled={isLoading}
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-lg shadow-indigo-200 flex items-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
