import React from 'react';
import { MapPin, Calendar, Tag, Navigation } from 'lucide-react';
import { Item, ItemType } from '../types';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
  distance?: number; // Distance in km
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick, distance }) => {
  const isLost = item.type === ItemType.LOST;

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 overflow-hidden cursor-pointer flex flex-col h-full relative"
    >
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img 
          src={item.image} 
          alt={item.title || item.description} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          isLost ? 'bg-rose-500 text-white' : 'bg-teal-500 text-white'
        }`}>
          {item.type}
        </div>
        {item.status === 'RESOLVED' && (
           <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-500 text-white">
             RESOLVED
           </div>
        )}
        
        {/* Distance Badge */}
        {distance !== undefined && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-lg flex items-center gap-1">
            <Navigation size={10} className="text-yellow-400" />
            {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`} away
          </div>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-500 mb-2">
          <Tag size={12} />
          <span>{item.category}</span>
        </div>
        
        <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">
          {item.title || `${item.color} ${item.category}`}
        </h3>
        
        <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-grow">
          {item.description}
        </p>
        
        <div className="space-y-2 mt-auto">
          <div className="flex items-center text-slate-400 text-xs">
            <MapPin size={14} className="mr-1" />
            <span className="truncate">{item.location.address || 'Unknown Location'}</span>
          </div>
          <div className="flex items-center text-slate-400 text-xs">
            <Calendar size={14} className="mr-1" />
            <span>{new Date(item.date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};