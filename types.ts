export enum ItemType {
  LOST = 'LOST',
  FOUND = 'FOUND'
}

export enum ItemCategory {
  ELECTRONICS = 'Electronics',
  WALLETS = 'Wallets',
  BAGS = 'Bags',
  ACCESSORIES = 'Accessories',
  CLOTHING = 'Clothing',
  DOCUMENTS = 'ID Documents',
  OTHERS = 'Others'
}

export enum ItemStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED'
}

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Item {
  id: string;
  userId: string;
  type: ItemType;
  image: string; // Base64 or URL
  title: string; // For lost items (e.g., "Blue iPhone 13")
  description: string;
  category: ItemCategory;
  location: LocationData;
  date: string;
  status: ItemStatus;
  // Specific fields
  color?: string;
  material?: string;
  brand?: string;
  uniqueIdentifier?: string; // Secret proof for lost items
  
  // Reporter Details
  reporterName?: string;
  reporterEmail?: string;
  reporterAvatar?: string;
}

export interface Match {
  id: string;
  lostItemId: string;
  foundItemId: string;
  confidenceScore: number;
  reasons: string[];
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface Stats {
  totalLost: number;
  totalFound: number;
  totalResolved: number;
}
