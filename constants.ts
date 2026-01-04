import { Item, ItemCategory, ItemStatus, ItemType, User, Match } from './types';

export const CATEGORIES = Object.values(ItemCategory);

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex.j@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=alex',
};

export const MOCK_ITEMS: Item[] = [
  {
    id: 'l1',
    userId: 'u1',
    type: ItemType.LOST,
    image: 'https://picsum.photos/400/300?random=1',
    title: 'Lost Black Leather Wallet',
    description: 'Black leather wallet, lost near Central Park. Contains ID and credit cards.',
    category: ItemCategory.WALLETS,
    location: { lat: 40.785091, lng: -73.968285, address: 'Central Park, NY' },
    date: new Date().toISOString(),
    status: ItemStatus.OPEN,
    color: 'Black',
    material: 'Leather',
    uniqueIdentifier: 'Initials AJ inside',
  },
  {
    id: 'f1',
    userId: 'u2',
    type: ItemType.FOUND,
    image: 'https://picsum.photos/400/300?random=2',
    title: 'Found iPhone 13',
    description: 'Found a blue iPhone 13 on a bench. Screen is cracked.',
    category: ItemCategory.ELECTRONICS,
    location: { lat: 40.785091, lng: -73.968285, address: 'Central Park, NY' },
    date: new Date(Date.now() - 86400000).toISOString(),
    status: ItemStatus.OPEN,
    color: 'Blue',
    brand: 'Apple',
  },
  {
    id: 'l2',
    userId: 'u1',
    type: ItemType.LOST,
    image: 'https://picsum.photos/400/300?random=3',
    title: 'Lost Golden Retriever',
    description: 'Wearing a red collar. Answers to "Buddy".',
    category: ItemCategory.OTHERS,
    location: { lat: 34.0522, lng: -118.2437, address: 'Los Angeles, CA' },
    date: new Date(Date.now() - 172800000).toISOString(),
    status: ItemStatus.RESOLVED,
    color: 'Golden',
  }
];

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    lostItemId: 'l1',
    foundItemId: 'f2', // hypothetically exists
    confidenceScore: 88,
    reasons: ['Category Match: Wallets', 'Color Match: Black', 'Location proximity < 500m'],
    status: 'PENDING'
  }
];