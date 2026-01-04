import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Item, ItemStatus } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

interface ItemsContextType {
  items: Item[];
  loading: boolean;
  createItem: (itemData: Omit<Item, 'id' | 'userId' | 'date' | 'status'>, file: File | null) => Promise<void>;
  markItemAsResolved: (itemId: string) => Promise<void>;
  getItemById: (id: string) => Item | undefined;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export const ItemsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper: Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Helper: Map Database Row (Snake Case) to App Item (Camel Case)
  const mapDbToItem = (data: any): Item => ({
    id: data.id,
    userId: data.user_id, // Map user_id -> userId
    type: data.type,
    title: data.title || '',
    description: data.description || '',
    category: data.category,
    image: data.image || '',
    location: data.location || { lat: 0, lng: 0, address: '' },
    date: data.created_at, // Map created_at -> date
    status: data.status,
    color: data.color,
    material: data.material,
    brand: data.brand,
    uniqueIdentifier: data.unique_identifier, // Map unique_identifier -> uniqueIdentifier
    reporterName: data.reporter_name,
    reporterEmail: data.reporter_email,
    reporterAvatar: data.reporter_avatar
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    
    if (supabase) {
      try {
          const { data, error } = await supabase
              .from('items')
              .select('*')
              .order('created_at', { ascending: false });
          
          if (error) {
            console.error("Supabase fetch error:", error);
          } else if (data) {
             const mappedItems = data.map(mapDbToItem);
             setItems(mappedItems);
          }
      } catch (err) {
          console.error("Unexpected error fetching items:", err);
      }
    }
    setLoading(false);
  }, []);

  // Initial Fetch & Realtime Subscription
  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel('public:items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = mapDbToItem(payload.new);
            setItems((prev) => [newItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
             const updatedItem = mapDbToItem(payload.new);
             setItems((prev) => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
          } else if (payload.eventType === 'DELETE') {
             setItems((prev) => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  const createItem = async (itemData: Omit<Item, 'id' | 'userId' | 'date' | 'status'>, file: File | null) => {
    if (!user) throw new Error("User must be logged in");

    // Process Image
    let imageUrl = itemData.image; 
    if (file) {
        imageUrl = await fileToBase64(file);
    }

    // Get Reporter Info from Auth
    const reporterName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous';
    const reporterEmail = user.email;
    const reporterAvatar = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${reporterName}&background=random`;

    // Construct Payload for DB (Snake Case)
    // We let Supabase generate the ID and Created_At
    const dbPayload = {
        user_id: user.id,
        type: itemData.type,
        title: itemData.title,
        description: itemData.description,
        category: itemData.category,
        status: ItemStatus.OPEN,
        image: imageUrl,
        location: itemData.location, // Sent as JSON object
        color: itemData.color,
        material: itemData.material,
        brand: itemData.brand,
        unique_identifier: itemData.uniqueIdentifier,
        
        // Save reporter details explicitly so we can display them later
        reporter_name: reporterName,
        reporter_email: reporterEmail,
        reporter_avatar: reporterAvatar
    };

    try {
        const { error } = await supabase.from('items').insert([dbPayload]);
        
        if (error) {
            console.error("Supabase Insert Error Details:", error.message, error.details);
            throw new Error(error.message);
        }
        // No need to manually update state; Realtime subscription handles it.
    } catch (err: any) {
        console.error("Failed to save to Supabase:", err);
        throw err; // Propagate to UI for alert
    }
  };

  const markItemAsResolved = async (itemId: string) => {
    if (!user) throw new Error("User must be logged in");
    
    try {
        const { error } = await supabase
            .from('items')
            .update({ status: ItemStatus.RESOLVED })
            .eq('id', itemId)
            .eq('user_id', user.id); // Ensure user owns item
        
        if (error) throw error;
    } catch (err) {
        console.error("Failed to resolve item:", err);
        throw err;
    }
  };

  const getItemById = (id: string) => {
    return items.find(i => i.id === id);
  };

  return (
    <ItemsContext.Provider value={{ items, loading, createItem, markItemAsResolved, getItemById }}>
      {children}
    </ItemsContext.Provider>
  );
};

export const useItems = () => {
  const context = useContext(ItemsContext);
  if (!context) throw new Error('useItems must be used within an ItemsProvider');
  return context;
};
