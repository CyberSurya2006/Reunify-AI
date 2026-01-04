import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, MapPin, Loader2, AlertTriangle, Search, Sparkles, Palette, Tag } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { ItemCategory, ItemType } from '../types';
import { analyzeImage, ImageAnalysisResult } from '../services/geminiService';
import { useItems } from '../contexts/ItemsContext';

// Declare Leaflet global
declare const L: any;

export const Report: React.FC = () => {
  const { type } = useParams<{ type: string }>(); // 'lost' or 'found'
  const navigate = useNavigate();
  const { createItem } = useItems();
  
  // Normalize type
  const isLost = type?.toLowerCase() === 'lost';
  const itemType = isLost ? ItemType.LOST : ItemType.FOUND;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [step, setStep] = useState(1);
  
  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    image: null as File | null,
    title: '',
    category: CATEGORIES[0],
    description: '',
    color: '',
    brand: '',
    location: '',
    lat: 40.7128, // Default to NYC
    lng: -74.0060,
    date: new Date().toISOString().split('T')[0],
    uniqueIdentifier: '' // Only for Lost
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Map Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Initialize Map when Step 2 is active
  useEffect(() => {
    // Only initialize if we are on step 2 and the DOM element exists
    if (step === 2 && mapRef.current) {
      
      // Safety check: if map already exists (e.g. strict mode double invoke), remove it
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Create Map
      const map = L.map(mapRef.current).setView([formData.lat, formData.lng], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Add Marker
      const marker = L.marker([formData.lat, formData.lng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      // Event: Drag End
      marker.on('dragend', async (event: any) => {
        const position = event.target.getLatLng();
        await handleReverseGeocode(position.lat, position.lng);
      });

      // Event: Map Click
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        await handleReverseGeocode(lat, lng);
      });
      
      mapInstanceRef.current = map;
      
      // Invalidate size to ensure tiles load correctly if container size changed
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [step]); // Re-run only if step changes

  // Sync Map view when lat/lng changes (e.g. via Geolocation button or Search)
  useEffect(() => {
    if (step === 2 && mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([formData.lat, formData.lng], 15);
      markerRef.current.setLatLng([formData.lat, formData.lng]);
    }
  }, [formData.lat, formData.lng, step]);

  const handleReverseGeocode = async (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, lat, lng })); // Update coords immediately
    
    try {
      // Using OSM Nominatim for reverse geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      
      if (data && data.display_name) {
        // Shorten the address for better UX
        const shortAddress = data.display_name.split(',').slice(0, 3).join(',');
        setFormData(prev => ({
          ...prev,
          lat,
          lng,
          location: shortAddress
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          lat,
          lng,
          location: `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        }));
      }
    } catch (error) {
      console.warn("Reverse geocoding failed", error);
      setFormData(prev => ({
        ...prev,
        lat,
        lng,
        location: `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      }));
    }
  };

  const handleAddressSearch = async () => {
    if (!formData.location.trim()) return;
    setIsGeocoding(true);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        setFormData(prev => ({
          ...prev,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        }));
      } else {
        alert("Location not found. Please try a clearer address.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Error searching for location.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, image: file });
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Trigger Analysis
      setIsAnalyzing(true);
      setAnalysisResult(null);
      try {
        const result = await analyzeImage(url);
        setAnalysisResult(result);
        
        // Auto-fill color if empty and colors detected
        if (result.dominantColors.length > 0 && !formData.color) {
           // Simple auto-fill for convenience, but we'll let user override
           // setFormData(prev => ({ ...prev, color: result.dominantColors.join(', ') }));
        }
      } catch (error) {
        console.error("Image analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      setIsGeocoding(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
           const { latitude, longitude } = position.coords;
           await handleReverseGeocode(latitude, longitude);
           setIsGeocoding(false);
        },
        (error) => {
          console.error(error);
          alert("Could not retrieve your location.");
          setIsGeocoding(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        await createItem({
            type: itemType,
            title: formData.title || `${formData.color} ${formData.category}`,
            description: formData.description,
            category: formData.category as ItemCategory,
            location: {
                lat: formData.lat,
                lng: formData.lng,
                address: formData.location
            },
            image: previewUrl || 'https://via.placeholder.com/400', // Fallback
            color: formData.color,
            brand: formData.brand,
            uniqueIdentifier: isLost ? formData.uniqueIdentifier : undefined
        }, formData.image);

        // Success
        navigate('/dashboard');
    } catch (error) {
        console.error("Submission error:", error);
        alert("Failed to submit report. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Report {isLost ? 'Lost' : 'Found'} Item
        </h1>
        <p className="text-slate-500 mt-2">
          {isLost 
            ? "Help us find your item by providing as many details as possible." 
            : "Thank you for being a good samaritan. Let's reunite this item with its owner."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 w-full bg-slate-100">
          <div 
            className={`h-full transition-all duration-500 ${isLost ? 'bg-rose-500' : 'bg-teal-500'}`} 
            style={{ width: `${(step / 2) * 100}%` }}
          ></div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Upload Photo</label>
                <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${previewUrl ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400'}`}>
                  <input type="file" className="hidden" id="item-image" accept="image/*" onChange={handleImageChange} />
                  <label htmlFor="item-image" className="cursor-pointer w-full h-full flex flex-col items-center">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="h-48 object-contain rounded-lg shadow-sm" />
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                          <Camera className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-900">Click to upload image</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                      </>
                    )}
                  </label>
                </div>

                {/* AI Analysis Result */}
                {isAnalyzing && (
                  <div className="mt-4 flex items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 text-sm">
                    <Loader2 className="animate-spin mr-2 text-indigo-500" size={18} />
                    Analyzing image...
                  </div>
                )}

                {!isAnalyzing && analysisResult && (
                  <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-4 animate-[fadeIn_0.5s_ease-out]">
                    <div className="flex items-center gap-2 mb-3 text-indigo-700 font-bold text-sm">
                      <Sparkles size={16} />
                      <span>AI Detected Features</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-slate-400"><Tag size={14} /></div>
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Object Type</span>
                          <span className="text-slate-800 font-medium bg-white px-2 py-1 rounded border border-slate-200 shadow-sm text-sm">
                            {analysisResult.objectType}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-slate-400"><Palette size={14} /></div>
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Colors</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {analysisResult.dominantColors.map((color, i) => (
                              <div 
                                key={i} 
                                className="w-6 h-6 rounded-full border border-white shadow-sm ring-1 ring-slate-200" 
                                style={{ backgroundColor: color }} 
                                title={color}
                              />
                            ))}
                            <span className="text-xs text-slate-500 self-center ml-1">
                              {analysisResult.dominantColors.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select 
                    className="w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition p-2.5 text-sm text-slate-900"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as ItemCategory})}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date {isLost ? 'Lost' : 'Found'}</label>
                  <input 
                    type="date"
                    className="w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition p-2.5 text-sm text-slate-900"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isLost ? 'What was it?' : 'What did you find?'}
                </label>
                <input 
                  type="text"
                  placeholder={isLost ? "e.g., Blue iPhone 13 Pro with clear case" : "e.g., Black Leather Wallet"}
                  className="w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition p-2.5 text-sm text-slate-900"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end pt-4">
                 <button 
                  type="button" 
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Describe unique scratches, stickers, or contents..."
                  className="w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition p-2.5 text-sm text-slate-900"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                  <input 
                    type="text"
                    className="w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition p-2.5 text-sm text-slate-900"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brand / Model</label>
                  <input 
                    type="text"
                    className="w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition p-2.5 text-sm text-slate-900"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location Details</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text"
                    placeholder="e.g. Address, landmark, or city"
                    className="flex-grow rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition p-2.5 text-sm text-slate-900"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddressSearch();
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={isGeocoding}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition border border-indigo-200"
                    title="Search Address on Map"
                  >
                    {isGeocoding ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                  </button>
                  <button 
                    type="button"
                    onClick={handleGeolocation}
                    disabled={isGeocoding}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                    title="Use Current Location"
                  >
                    <MapPin size={20} />
                  </button>
                </div>
                
                {/* Map Container */}
                <div className="h-64 w-full rounded-xl border border-slate-200 overflow-hidden relative z-0" ref={mapRef}></div>
                <p className="text-xs text-slate-500 mt-2">Click on the map or drag the marker to visually pinpoint the exact spot.</p>
              </div>

              {isLost && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <label className="block text-sm font-bold text-amber-900 mb-1">
                        Proof of Ownership (Private)
                      </label>
                      <p className="text-xs text-amber-700 mb-2">
                        Only visible to you. Used for verification if someone finds your item.
                      </p>
                      <input 
                        type="text"
                        placeholder="e.g. Serial Number, Initials inside, Screen background"
                        className="w-full rounded-lg border-amber-200 bg-white focus:ring-2 focus:ring-amber-200 transition p-2.5 text-sm text-slate-900"
                        value={formData.uniqueIdentifier}
                        onChange={(e) => setFormData({...formData, uniqueIdentifier: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 text-slate-500 hover:text-slate-700 font-medium transition"
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`px-8 py-2.5 font-medium rounded-lg transition shadow-lg flex items-center ${
                    isLost 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200' 
                      : 'bg-teal-500 hover:bg-teal-600 text-white shadow-teal-200'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Processing AI...
                    </>
                  ) : 'Submit Report'}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};