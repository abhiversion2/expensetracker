// Default members specified in requirements:
// 1. Prabhat, 2. Abhijit, 3. Gadam, 4. Kali, 5. Pandey, 6. Rohit

export const DEFAULT_MEMBERS = [
  {
    id: 'm_prabhat',
    name: 'Prabhat',
    avatarColor: '#6366f1', // Indigo
    initials: 'PR',
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'm_abhijit',
    name: 'Abhijit',
    avatarColor: '#ec4899', // Pink
    initials: 'AB',
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'm_gadam',
    name: 'Gadam',
    avatarColor: '#10b981', // Emerald
    initials: 'GD',
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'm_kali',
    name: 'Kali',
    avatarColor: '#f59e0b', // Amber
    initials: 'KL',
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'm_pandey',
    name: 'Pandey',
    avatarColor: '#8b5cf6', // Purple
    initials: 'PD',
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'm_rohit',
    name: 'Rohit',
    avatarColor: '#06b6d4', // Cyan
    initials: 'RH',
    createdAt: '2026-08-01T10:00:00Z',
  },
];

export const DEFAULT_CATEGORIES = [
  { id: 'cat_food', name: 'Food & Dining', icon: 'Utensils', color: '#f97316' },
  { id: 'cat_travel', name: 'Travel & Trips', icon: 'Plane', color: '#0ea5e9' },
  { id: 'cat_petrol', name: 'Petrol & Fuel', icon: 'Fuel', color: '#ef4444' },
  { id: 'cat_entertainment', name: 'Entertainment & Movies', icon: 'Film', color: '#a855f7' },
  { id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
  { id: 'cat_hotel', name: 'Hotel & Stay', icon: 'Hotel', color: '#14b8a6' },
  { id: 'cat_bills', name: 'Bills & Utilities', icon: 'Receipt', color: '#eab308' },
  { id: 'cat_snacks', name: 'Tea & Snacks', icon: 'Coffee', color: '#84cc16' },
  { id: 'cat_other', name: 'Other', icon: 'Tag', color: '#64748b' },
];

export const DEFAULT_SETTINGS = {
  groupName: 'Apna Gang',
  currency: '₹',
  weekStartDay: 1, // 1 = Monday, 0 = Sunday
  humorMode: true, // "Kanjoos of the week 😂" friendly banter
  lowestSpenderCriteria: 'paid', // 'paid' (amount actually paid) or 'share' (personal share)
  theme: 'dark', // 'dark' or 'light'
  notificationsEnabled: true,
  kanjoosJokes: [
    "Bhai ne paisa bachane ka world record bana diya 😂",
    "Paisa bachane ki ninja technique koi inse seekhe! 🥷",
    "Dhandho no dhandho: Spending minimum, chilling maximum! 💰",
    "Saving master in the house! Treat kab de rahe ho? 🍕",
    "Pocket tight, future bright! Award goes to you 🏆",
  ],
};

// Initial expenses are clean and empty by default
export const SAMPLE_EXPENSES = [];
