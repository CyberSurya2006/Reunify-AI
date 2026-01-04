import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Shield, MapPin, Calendar, AlertTriangle, X, Loader2, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import { Item, Match, ItemCategory, ItemType } from '../types';
import { useItems } from '../contexts/ItemsContext';
import { useAuth } from '../contexts/AuthContext';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ItemCategory;
  onVerify: (answer: string) => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({ isOpen, onClose, category, onVerify }) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  let question = "What is a unique detail about this item?";
  let placeholder = "e.g., A scratch on the back";
  let hint = "Provide a detail not visible in the photo to prove ownership.";

  switch (category) {
    case ItemCategory.ELECTRONICS:
      question = "Please provide the serial number or last 4 digits of IMEI.";
      placeholder = "e.g., SN: 1234567890";
      hint = "Check your purchase receipt or box.";
      break;
    case ItemCategory.WALLETS:
    case ItemCategory.BAGS:
      question = "What is the color of the inner lining or specific contents?";
      placeholder = "e.g., Red silk lining, or a library card inside";
      hint = "Something only the owner would know.";
      break;
    case ItemCategory.DOCUMENTS:
      question = "What is the birth month or issuing city listed?";
      placeholder = "e.g., March, or Springfield";
      break;
    case ItemCategory.CLOTHING:
      question = "What is the size label or a unique laundry mark?";
      placeholder = "e.g., Size M, tag cut off";
      break;
    default:
      question = "Please describe a hidden unique detail known only to you.";
      placeholder = "e.g., Initials 'JD' written inside";
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate verification API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onVerify(answer);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-[slideIn_0.3s_ease-out]">
        
        {isSuccess ? (
           <div className="p-12 text-center">
             <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-[bounce_0.5s_infinite]">
               <Check size={32} strokeWidth={3} />
             </div>
             <h3 className="text-2xl font-bold text-slate-800 mb-2">Ownership Verified!</h3>
             <p className="text-slate-500">Connecting you with the finder...</p>
           </div>
        ) : (
          <>
            <div className="bg-indigo-600 p-6 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-indigo-200 hover:text-white transition"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <Shield size={24} className="text-indigo-200" />
                <h3 className="text-xl font-bold">Verify Ownership</h3>
              </div>
              <p className="text-indigo-100 text-sm opacity-90">
                To prevent fraud, please answer a security question based on the item category.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {question}
                </label>
                <input 
                  type="text" 
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={placeholder}
                  required
                  className="w-full rounded-lg border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition p-3 text-slate-900"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> {hint}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!answer.trim() || isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition shadow-lg shadow-indigo-200 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : 'Submit Answer'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporter: {
    name: string;
    email: string;
    avatarUrl: string;
  };
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, reporter }) => {
  const [revealContact, setRevealContact] = useState(false);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center animate-[fadeIn_0.2s_ease-out] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative animate-[slideIn_0.3s_ease-out]">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-600 z-0"></div>
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition z-10 bg-black/10 rounded-full p-1"
            >
                <X size={20} />
            </button>
            
            <div className="p-8 pt-20 text-center relative z-10">
                <img 
                    src={reporter.avatarUrl} 
                    alt={reporter.name} 
                    className="w-24 h-24 rounded-full border-4 border-white mx-auto mb-4 shadow-md bg-white"
                />
                <h3 className="text-2xl font-bold text-slate-900">{reporter.name}</h3>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold mb-6">
                    <Check size={12} strokeWidth={3} /> Match Verified
                </div>
                
                <div className="space-y-3 text-left">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl transition hover:border-indigo-200">
                            <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                                <Mail size={14} /> Email Address
                            </div>
                                <button onClick={() => setRevealContact(!revealContact)} className="text-slate-400 hover:text-indigo-600 transition">
                                    {revealContact ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            <div className="font-medium text-slate-900 break-all">
                            {revealContact ? reporter.email : '••••••••••@••••.com'}
                            </div>
                            {!revealContact && <p className="text-[10px] text-slate-400 mt-1">Click eye icon to reveal</p>}
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl opacity-70">
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
                            <Phone size={14} /> Phone Number
                            </div>
                            <div className="font-medium text-slate-500 text-sm italic">
                            Not provided by user
                            </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button 
                      onClick={() => window.location.href = `mailto:${reporter.email}`}
                      disabled={!revealContact}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                  >
                      <Mail size={18} /> Send Email
                  </button>
                  <button 
                      onClick={onClose}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                  >
                      Close
                  </button>
                </div>
            </div>
        </div>
    </div>
  );
}

export const MatchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getItemById } = useItems();
  const { user } = useAuth();
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  
  const match: Match | undefined = location.state?.match;

  if (!match) {
      return (
          <div className="min-h-screen flex items-center justify-center flex-col p-4 text-center">
              <AlertTriangle size={48} className="text-amber-500 mb-4" />
              <h2 className="text-2xl font-bold text-slate-800">Match Not Found</h2>
              <p className="text-slate-500 mt-2 mb-6">Could not retrieve match details. Please access this page from your Dashboard.</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold"
              >
                  Go to Dashboard
              </button>
          </div>
      );
  }

  const lostItem = getItemById(match.lostItemId);
  const foundItem = getItemById(match.foundItemId);

  if (!lostItem || !foundItem) {
    return (
        <div className="p-12 text-center">
            <h3 className="text-xl font-bold text-slate-800">Item Data Unavailable</h3>
            <p className="text-slate-500">One of the items in this match seems to have been removed.</p>
            <button onClick={() => navigate('/dashboard')} className="mt-4 text-indigo-600 font-bold hover:underline">Return Home</button>
        </div>
    );
  }
  
  const isMyLostItem = lostItem.userId === user?.id;

  const handleVerificationComplete = (answer: string) => {
    // In a real app, verify the answer with the backend
    console.log("Verified with answer:", answer);
    setIsVerificationOpen(false);
    setIsContactOpen(true);
  };

  // Determine who we are contacting.
  // If I lost the item (isMyLostItem), I contact the finder (foundItem owner).
  // If I found the item (!isMyLostItem), I contact the loser (lostItem owner).
  const targetItem = isMyLostItem ? foundItem : lostItem;
  const contactReporter = {
    name: targetItem.reporterName || 'Anonymous User',
    email: targetItem.reporterEmail || 'Contact hidden',
    avatarUrl: targetItem.reporterAvatar || `https://ui-avatars.com/api/?name=${targetItem.reporterName || 'U'}&background=random`
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Verification Modal */}
      <VerificationModal 
        isOpen={isVerificationOpen} 
        onClose={() => setIsVerificationOpen(false)}
        category={lostItem.category}
        onVerify={handleVerificationComplete}
      />

      {/* Contact Modal */}
      <ContactModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)}
        reporter={contactReporter}
      />

      {/* Header */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-slate-500 hover:text-slate-800 transition mb-6 font-medium"
      >
        <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Match Analysis</h1>
          <p className="text-slate-500">AI comparison of report #{lostItem.id} and #{foundItem.id}.</p>
        </div>
        <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 ${match.confidenceScore > 80 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          <div className="text-sm font-semibold uppercase tracking-wider">Confidence Score</div>
          <div className="text-3xl font-black">{match.confidenceScore}%</div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        
        {/* Left Column: Lost Item */}
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-rose-50 p-4 border-b border-rose-100 flex justify-between items-center">
            <span className="font-bold text-rose-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> 
              {isMyLostItem ? 'Your Lost Item' : 'Reported Lost Item'}
            </span>
          </div>
          <div className="h-64 overflow-hidden bg-slate-100 relative">
            <img src={lostItem.image} alt="Lost" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <h3 className="text-white font-bold text-lg">{lostItem.title}</h3>
            </div>
          </div>
          <div className="p-6 space-y-4 flex-grow">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
              <p className="text-slate-700 text-sm">{lostItem.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Color</label>
                <p className="text-slate-800 font-medium">{lostItem.color || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Material</label>
                <p className="text-slate-800 font-medium">{lostItem.material || 'N/A'}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Location Lost</label>
              <div className="flex items-center text-slate-700 text-sm mt-1">
                <MapPin size={14} className="mr-1 text-rose-500" /> {lostItem.location.address}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Found Item */}
        <div className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden flex flex-col relative">
           {/* Connecting Badge */}
           <div className="absolute top-1/2 -left-4 md:-left-4 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border border-slate-100 hidden md:block">
             <div className="bg-indigo-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-bold">VS</div>
           </div>

          <div className="bg-teal-50 p-4 border-b border-teal-100 flex justify-between items-center">
            <span className="font-bold text-teal-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span> 
              {!isMyLostItem ? 'Your Found Item' : 'Potential Match'}
            </span>
            <span className="text-xs font-medium text-teal-600 bg-teal-100 px-2 py-1 rounded">ID: {foundItem.id.substring(0,6)}</span>
          </div>
          <div className="h-64 overflow-hidden bg-slate-100 relative">
            <img src={foundItem.image} alt="Found" className="w-full h-full object-cover" />
             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <h3 className="text-white font-bold text-lg">{foundItem.title}</h3>
            </div>
          </div>
          <div className="p-6 space-y-4 flex-grow">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
              <p className="text-slate-700 text-sm">{foundItem.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Color</label>
                <p className="text-slate-800 font-medium">{foundItem.color || 'N/A'}</p>
              </div>
               <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Brand/Model</label>
                <p className="text-slate-800 font-medium">{foundItem.brand || 'N/A'}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Location Found</label>
              <div className="flex items-center text-slate-700 text-sm mt-1">
                <MapPin size={14} className="mr-1 text-teal-500" /> {foundItem.location.address}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AI Reasons Card */}
      <div className="bg-indigo-900 rounded-2xl p-8 text-white mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        
        <div className="flex items-start gap-4 relative z-10">
          <div className="bg-white/10 p-3 rounded-xl">
             <Shield size={24} className="text-indigo-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Gemini AI Matching Logic</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
              {match.reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Check size={18} className="text-green-400 mt-0.5 shrink-0" />
                  <span className="text-indigo-100 text-sm leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 border-t border-slate-200 pt-8">
        <button 
          className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition flex items-center justify-center gap-2"
          onClick={() => navigate(-1)}
        >
          Not a Match
        </button>
        <button 
          className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition flex items-center justify-center gap-2"
          onClick={() => setIsVerificationOpen(true)}
        >
          <Check size={20} />
          {isMyLostItem ? 'Yes, This Is Mine' : 'Yes, Correct Match'}
        </button>
      </div>

    </div>
  );
};