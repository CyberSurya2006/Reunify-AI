import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Match, ItemStatus, Item } from '../types';
import { useAuth } from './AuthContext';
import { useItems } from './ItemsContext';
import { matchItems } from '../services/geminiService';

interface NotificationContextType {
  matches: Match[];
  unreadCount: number;
  latestMatch: Match | null;
  isScanning: boolean;
  clearLatestMatch: () => void;
  markAsRead: () => void;
  triggerScan: (force?: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { items, loading: itemsLoading } = useItems(); 
  const [matches, setMatches] = useState<Match[]>([]);
  const [latestMatch, setLatestMatch] = useState<Match | null>(null);
  const [hasRead, setHasRead] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Ref to prevent multiple simultaneous scans
  const isScanningRef = useRef(false);
  // Ref to track checked pairs so we don't spam the API for the same pair in one session
  const checkedPairs = useRef<Set<string>>(new Set());

  // Reset state when user changes
  useEffect(() => {
    setMatches([]);
    setLatestMatch(null);
    setHasRead(false);
    checkedPairs.current.clear();
    isScanningRef.current = false;
  }, [user]);

  const triggerScan = useCallback(async (force = false) => {
    if (!user || itemsLoading || isScanningRef.current) return;

    try {
      isScanningRef.current = true;
      setIsScanning(true);

      if (force) {
        console.log("[Reunify] Force scan initiated. Clearing cache.");
        checkedPairs.current.clear();
      }

      // Sort items by date descending (Newest first)
      const sortedItems = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Define Groups - INCREASED LIMITS for testing visibility
      const myLostItems = sortedItems.filter(i => i.userId === user.id && i.type === 'LOST' && i.status === ItemStatus.OPEN).slice(0, 20);
      const myFoundItems = sortedItems.filter(i => i.userId === user.id && i.type === 'FOUND' && i.status === ItemStatus.OPEN).slice(0, 20);
      
      const allLostItems = sortedItems.filter(i => i.type === 'LOST' && i.status === ItemStatus.OPEN).slice(0, 50);
      const allFoundItems = sortedItems.filter(i => i.type === 'FOUND' && i.status === ItemStatus.OPEN).slice(0, 50);

      // Generate Candidates Tuples: { lost: Item, found: Item }
      const candidates: { lost: Item, found: Item, id: string }[] = [];
      const seenPairs = new Set<string>();

      // 1. Check MY LOST items against ALL FOUND items
      for (const lost of myLostItems) {
        for (const found of allFoundItems) {
          if (lost.id === found.id) continue; 
          const id = `m-${lost.id}-${found.id}`;
          if (!seenPairs.has(id)) {
            candidates.push({ lost, found, id });
            seenPairs.add(id);
          }
        }
      }

      // 2. Check MY FOUND items against ALL LOST items
      for (const found of myFoundItems) {
        for (const lost of allLostItems) {
          if (lost.id === found.id) continue;
          const id = `m-${lost.id}-${found.id}`;
          if (!seenPairs.has(id)) {
            candidates.push({ lost, found, id });
            seenPairs.add(id);
          }
        }
      }

      console.log(`[Reunify] Scanning ${candidates.length} candidate pairs...`);

      const newMatches: Match[] = [];

      for (const { lost, found, id } of candidates) {
          const pairKey = `${id}-${lost.title}-${found.title}`; // Key includes titles to handle updates

          // Skip if already checked in this session (unless forced cleared above)
          if (checkedPairs.current.has(pairKey)) continue;

          // Skip if we already have a confirmed high-confidence match in state
          if (matches.some(m => m.id === id && m.confidenceScore > 80)) continue;

          try {
              // Throttle: Small delay to prevent rate limits
              await new Promise(resolve => setTimeout(resolve, 800));

              const result = await matchItems(lost, found);
              
              // Mark as checked
              checkedPairs.current.add(pairKey);

              // Lower threshold to 40% for testing visibility
              if (result.confidenceScore >= 40) {
                   const newMatch: Match = {
                      id,
                      lostItemId: lost.id,
                      foundItemId: found.id,
                      confidenceScore: result.confidenceScore,
                      reasons: result.reasons,
                      status: 'PENDING'
                   };
                   newMatches.push(newMatch);
              }
          } catch (err) {
              console.error(`Error matching ${lost.id} vs ${found.id}:`, err);
          }
      }

      if (newMatches.length > 0) {
          setMatches(prev => {
              const combined = [...prev];
              newMatches.forEach(nm => {
                  if (!combined.some(c => c.id === nm.id)) {
                      combined.unshift(nm);
                  }
              });
              return combined;
          });
          
          // Only notify if we actually added something new to the top
          const isActuallyNew = newMatches.some(nm => !matches.find(m => m.id === nm.id));
          if (isActuallyNew) {
             setLatestMatch(newMatches[0]);
             setHasRead(false);
          }
      } else if (force && candidates.length > 0) {
          console.log("[Reunify] Force scan complete. No new matches found.");
      }

    } catch (error) {
      console.error("Scan failed:", error);
    } finally {
      setIsScanning(false);
      isScanningRef.current = false;
    }
  }, [items, user, itemsLoading, matches]);

  // Auto-scan when items change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Don't force scan on auto-update, just check new stuff
      triggerScan(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [items.length, triggerScan]);

  const clearLatestMatch = () => setLatestMatch(null);
  const markAsRead = () => setHasRead(true);

  const unreadCount = hasRead ? 0 : matches.length;

  return (
    <NotificationContext.Provider value={{ 
      matches, 
      unreadCount, 
      latestMatch, 
      isScanning,
      clearLatestMatch,
      markAsRead,
      triggerScan
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};