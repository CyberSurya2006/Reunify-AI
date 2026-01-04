import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Filter, Loader2, Navigation, SlidersHorizontal, Palette, Box, Calendar, X } from 'lucide-react';
import { ItemCard } from '../components/ItemCard';
import { CATEGORIES } from '../constants';
import { Item } from '../types';
import { useItems } from '../contexts/ItemsContext';

// Helper: Calculate distance using Haversine formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export const Browse: React.FC = () => {
  const navigate = useNavigate();
  const { items: allItems } = useItems();
  
  // Basic Filters
  const [viewType, setViewType] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Data
  const [filteredItems, setFilteredItems] = useState<{ item: Item; distance?: number }[]>([]);

  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        setLocationError("Unable to retrieve your location");
        setIsLocating(false);
      }
    );
  };

  const clearFilters = () => {
     setSearchTerm('');
     setViewType('ALL');
     setSelectedCategory('All Categories');
     setSelectedColor('');
     setSelectedMaterial('');
     setStartDate('');
     setEndDate('');
  };

  useEffect(() => {
    let items = allItems.map(item => {
      let distance = undefined;
      if (userLocation) {
        distance = getDistanceFromLatLonInKm(
          userLocation.lat,
          userLocation.lng,
          item.location.lat,
          item.location.lng
        );
      }
      return { item, distance };
    });

    // 1. Filter by Type
    if (viewType !== 'ALL') {
      items = items.filter(({ item }) => item.type === viewType);
    }

    // 2. Filter by Search Term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      items = items.filter(({ item }) => 
        item.title.toLowerCase().includes(lowerTerm) ||
        item.description.toLowerCase().includes(lowerTerm) ||
        item.location.address?.toLowerCase().includes(lowerTerm)
      );
    }

    // 3. Filter by Category
    if (selectedCategory !== 'All Categories') {
      items = items.filter(({ item }) => item.category === selectedCategory);
    }

    // 4. Filter by Color
    if (selectedColor) {
      items = items.filter(({ item }) => 
        item.color?.toLowerCase().includes(selectedColor.toLowerCase())
      );
    }

    // 5. Filter by Material
    if (selectedMaterial) {
      items = items.filter(({ item }) => 
        item.material?.toLowerCase().includes(selectedMaterial.toLowerCase())
      );
    }

    // 6. Filter by Date Range
    if (startDate) {
        items = items.filter(({ item }) => new Date(item.date) >= new Date(startDate));
    }
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of the day
        items = items.filter(({ item }) => new Date(item.date) <= end);
    }

    // 7. Sort
    items.sort((a, b) => {
      // If location is active, sort by distance
      if (userLocation && a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      // Otherwise sort by date (newest first)
      return new Date(b.item.date).getTime() - new Date(a.item.date).getTime();
    });

    setFilteredItems(items);
  }, [viewType, searchTerm, selectedCategory, selectedColor, selectedMaterial, startDate, endDate, userLocation, allItems]);

  const activeFilterCount = [
    selectedCategory !== 'All Categories',
    selectedColor,
    selectedMaterial,
    startDate,
    endDate
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Browse Items</h1>
          <p className="text-slate-500 mt-2">Search lost and found reports in your area.</p>
        </div>

        {/* Controls Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-8 sticky top-20 z-30 transition-all">
          <div className="flex flex-col gap-4">
            
            {/* Primary Filters Row */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-slate-400" />
                </div>
                <input 
                  type="text"
                  placeholder="Search by name, description, or address..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition text-sm text-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Type Toggle */}
              <div className="flex bg-slate-100 rounded-xl p-1 shrink-0">
                {(['ALL', 'LOST', 'FOUND'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setViewType(type)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                      viewType === type 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {type === 'ALL' ? 'All' : type === 'LOST' ? 'Lost' : 'Found'}
                  </button>
                ))}
              </div>

               {/* Filter Toggle Button */}
               <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border transition text-sm font-medium ${
                    showFilters || activeFilterCount > 0
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal size={18} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

               {/* Location Button */}
               <button 
                onClick={handleGetLocation}
                disabled={isLocating}
                className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition text-sm font-medium ${
                  userLocation 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isLocating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Navigation size={18} className={userLocation ? "fill-indigo-700" : ""} />
                )}
                {userLocation ? 'Near Me' : 'Use My Location'}
              </button>
            </div>
            
            {/* Advanced Filters Grid */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pt-4 border-t border-slate-100 animate-[fadeIn_0.2s_ease-out]">
                {/* Category */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter size={16} className="text-slate-400" />
                  </div>
                  <select 
                    className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-sm text-slate-900 w-full appearance-none cursor-pointer hover:bg-slate-50 transition"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option>All Categories</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* Color */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Palette size={16} className="text-slate-400" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Color (e.g. Red)"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition text-sm text-slate-900"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                  />
                </div>

                {/* Material */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Box size={16} className="text-slate-400" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Material (e.g. Leather)"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition text-sm text-slate-900"
                    value={selectedMaterial}
                    onChange={(e) => setSelectedMaterial(e.target.value)}
                  />
                </div>

                {/* Start Date */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-slate-400" />
                  </div>
                  <input 
                    type="date"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition text-sm text-slate-900"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <div className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-slate-400 font-medium">From Date</div>
                </div>

                {/* End Date */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-slate-400" />
                  </div>
                  <input 
                    type="date"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition text-sm text-slate-900"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                   <div className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-slate-400 font-medium">To Date</div>
                </div>
              </div>
            )}
          </div>

          {locationError && (
            <div className="mt-3 text-xs text-rose-500 flex items-center gap-1">
               <MapPin size={12} /> {locationError}
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-slate-700 font-semibold flex items-center gap-2">
            {filteredItems.length} Result{filteredItems.length !== 1 && 's'}
            {userLocation && <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Sorted by distance</span>}
          </h2>
        </div>

        {/* Items Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map(({ item, distance }) => (
              <ItemCard 
                key={item.id} 
                item={item} 
                distance={distance}
                onClick={() => navigate(`/item/${item.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Search className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No items found</h3>
            <p className="text-slate-500">Try adjusting your filters or search term.</p>
            <button 
               onClick={clearFilters}
               className="mt-4 text-indigo-600 font-medium hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <X size={16} /> Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};