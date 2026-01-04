import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Tag, Share2, Flag, Navigation, Sparkles, Loader2, ScanLine, Maximize2, ZoomIn, ZoomOut, X, Palette, Mail, Phone, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { ItemCard } from '../components/ItemCard';
import { Item, ItemStatus } from '../types';
import { analyzeImage, ImageAnalysisResult } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useItems } from '../contexts/ItemsContext';

// Declare Leaflet globally since we loaded it via script tag
declare const L: any;

export const ItemDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { getItemById, items, markItemAsResolved } = useItems();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  
  // Fetch item from context
  const item = id ? getItemById(id) : undefined;
  
  const [nearbyItems, setNearbyItems] = useState<Item[]>([]);
  
  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);

  // Lightbox & Zoom State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  // Contact Modal State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [revealContact, setRevealContact] = useState(false);

  // Find nearby items
  useEffect(() => {
    if (!item) return;
    const others = items.filter(i => i.id !== item.id).slice(0, 3);
    setNearbyItems(others);
  }, [item, items]);

  // Reset zoom when lightbox opens
  useEffect(() => {
    if (isLightboxOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isLightboxOpen]);

  // Zoom handlers
  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 4));
  const handleZoomOut = () => {
    setScale(s => {
      const newScale = Math.max(s - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Initialize Map
  useEffect(() => {
    if (!item || !mapRef.current) return;

    const initMap = () => {
      if (mapInstanceRef.current) return;

      const { lat, lng } = item.location;
      
      const map = L.map(mapRef.current).setView([lat, lng], 15);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const mainIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${item.type === 'LOST' ? '#f43f5e' : '#14b8a6'}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      L.marker([lat, lng], { icon: mainIcon }).addTo(map);
    };

    const timer = setTimeout(initMap, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [item]);

  const handleAnalyzeImage = async () => {
    if (!item) return;
    setIsAnalyzing(true);
    try {
        const result = await analyzeImage(item.image);
        setAnalysisResult(result);
        setTimeout(() => {
            analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    } catch (error) {
        console.error("Analysis failed", error);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleMarkAsFound = async () => {
      if (!item) return;
      if (window.confirm("Mark as found? This resolves the case.")) {
          setIsResolving(true);
          try {
              await markItemAsResolved(item.id);
              navigate('/dashboard');
          } catch (e) {
              alert("Failed to update status.");
          } finally {
              setIsResolving(false);
          }
      }
  };

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold text-slate-400">Item not found</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 hover:underline">Return Home</button>
      </div>
    );
  }

  const isLost = item.type === 'LOST';
  const isOwner = user?.id === item.userId;

  const reporter = {
    id: item.userId,
    name: item.reporterName || 'Anonymous User',
    email: item.reporterEmail || 'Contact hidden',
    avatarUrl: item.reporterAvatar || `https://ui-avatars.com/api/?name=${item.reporterName || 'U'}&background=random`
  };

  const handleContactClick = () => {
    setRevealContact(false); // Reset reveal state
    setIsContactModalOpen(true);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-slate-500 hover:text-slate-800 transition mb-6 font-medium"
        >
          <ArrowLeft size={18} className="mr-2" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column: Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="relative h-80 bg-slate-100 group cursor-zoom-in" onClick={() => setIsLightboxOpen(true)}>
                <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className={`absolute top-4 left-4 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm z-10 ${isLost ? 'bg-rose-500 text-white' : 'bg-teal-500 text-white'}`}>
                  {item.type} ITEM
                </div>
                <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Maximize2 size={20} />
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAnalyzeImage(); }}
                  disabled={isAnalyzing}
                  className="absolute bottom-4 right-4 bg-white/90 backdrop-blur hover:bg-white text-indigo-600 px-4 py-2 rounded-xl shadow-lg font-semibold text-sm flex items-center gap-2 transition transform hover:scale-105 z-10"
                >
                  {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                </button>
              </div>
              
              {analysisResult && (
                <div ref={analysisRef} className="mx-6 mt-6 p-6 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-[fadeIn_0.5s_ease-out]">
                     <div className="flex items-center gap-2 mb-4 text-indigo-700 font-bold border-b border-indigo-100 pb-2">
                        <ScanLine size={18} className="text-purple-600" />
                        <h3>Gemini Analysis</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Object</p>
                            <div className="text-slate-800 font-semibold bg-white px-2 py-1 rounded border border-slate-200 inline-block">{analysisResult.objectType}</div>
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-500 uppercase mb-1">Colors</p>
                             <div className="flex gap-2">
                                {analysisResult.dominantColors.map((color, idx) => (
                                  <div key={idx} className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: color }} title={color}></div>
                                ))}
                             </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-indigo-100">
                           <p className="text-xs font-bold text-slate-500 uppercase mb-2">Features</p>
                           <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                             {analysisResult.features.map((feature, idx) => <li key={idx}>{feature}</li>)}
                           </ul>
                        </div>
                     </div>
                </div>
              )}

              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                     <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
                       <Tag size={16} />
                       {item.category}
                     </div>
                     <h1 className="text-3xl font-bold text-slate-900">{item.title}</h1>
                  </div>
                  {item.status === ItemStatus.RESOLVED && (
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase border border-green-200">Resolved</div>
                  )}
                </div>

                <p className="text-slate-600 text-lg leading-relaxed mb-6">{item.description}</p>

                <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 border border-slate-100 rounded-xl w-max pr-6">
                  <img src={reporter.avatarUrl} alt={reporter.name} className="w-10 h-10 rounded-full border border-white shadow-sm" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Reported by</p>
                    <p className="text-sm font-bold text-slate-900">{reporter.name} {isOwner && '(You)'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-1">Color</div>
                      <div className="font-medium text-slate-900">{item.color || 'N/A'}</div>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-1">Brand</div>
                      <div className="font-medium text-slate-900">{item.brand || 'N/A'}</div>
                   </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleContactClick}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-indigo-200"
                  >
                     {isOwner ? 'Manage Report' : 'Contact Reporter'}
                  </button>
                  <button className="p-3 border border-slate-200 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition"><Flag size={20} /></button>
                </div>

                {isOwner && isLost && item.status === ItemStatus.OPEN && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <button onClick={handleMarkAsFound} disabled={isResolving} className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition shadow-md shadow-green-200">
                           {isResolving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} I Found It
                        </button>
                    </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full min-h-[500px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><MapPin size={18} className="text-indigo-500" /> Location</h3>
                <span className="text-sm text-slate-500 truncate max-w-[200px]">{item.location.address}</span>
              </div>
              <div ref={mapRef} className="flex-grow w-full h-full z-0 min-h-[400px]"></div>
            </div>
          </div>
        </div>
      </div>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-[fadeIn_0.2s_ease-out]">
           <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
              <button onClick={() => setIsLightboxOpen(false)} className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition"><X size={20} /></button>
           </div>
           <div className="w-full h-full flex items-center justify-center" onClick={() => setIsLightboxOpen(false)}>
              <img src={item.image} alt={item.title} className="max-h-[90vh] max-w-[90vw]" />
           </div>
        </div>
      )}

      {/* Improved Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center animate-[fadeIn_0.2s_ease-out] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative animate-[slideIn_0.3s_ease-out]">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-600 z-0"></div>
                <button 
                    onClick={() => setIsContactModalOpen(false)}
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
                    <p className="text-slate-500 text-sm mb-8">{isOwner ? 'You (Reporter)' : 'Reporter'}</p>
                    
                    <div className="space-y-3 text-left">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl transition hover:border-indigo-200">
                             <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                                    <Mail size={14} /> Email Address
                                </div>
                                {!isOwner && (
                                    <button onClick={() => setRevealContact(!revealContact)} className="text-slate-400 hover:text-indigo-600 transition">
                                        {revealContact ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                )}
                             </div>
                             <div className="font-medium text-slate-900 break-all">
                                {isOwner || revealContact ? reporter.email : '••••••••••@••••.com'}
                             </div>
                             {!isOwner && !revealContact && <p className="text-[10px] text-slate-400 mt-1">Click eye icon to reveal</p>}
                        </div>

                        {/* Phone Placeholder */}
                         <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl opacity-70">
                             <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
                                <Phone size={14} /> Phone Number
                             </div>
                             <div className="font-medium text-slate-500 text-sm italic">
                                Not provided by user
                             </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsContactModalOpen(false)}
                        className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition shadow-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};