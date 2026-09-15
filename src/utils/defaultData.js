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

// Realistic initial sample expenses to showcase the app's full capabilities right from first launch
export const SAMPLE_EXPENSES = [
  {
    id: 'exp_1',
    description: 'Dinner at Bawarchi',
    amount: 1800,
    paidBy: 'm_abhijit',
    date: '2026-09-14',
    time: '20:45',
    category: 'Food & Dining',
    notes: 'Butter chicken and naan feast',
    participants: [
      { memberId: 'm_prabhat', share: 300 },
      { memberId: 'm_abhijit', share: 300 },
      { memberId: 'm_gadam', share: 300 },
      { memberId: 'm_kali', share: 300 },
      { memberId: 'm_pandey', share: 300 },
      { memberId: 'm_rohit', share: 300 },
    ],
    splitType: 'equal',
    createdAt: '2026-09-14T20:45:00Z',
  },
  {
    id: 'exp_2',
    description: 'Highway Petrol for Trip',
    amount: 1500,
    paidBy: 'm_prabhat',
    date: '2026-09-13',
    time: '08:30',
    category: 'Petrol & Fuel',
    notes: 'Full tank at Indian Oil',
    participants: [
      { memberId: 'm_prabhat', share: 250 },
      { memberId: 'm_abhijit', share: 250 },
      { memberId: 'm_gadam', share: 250 },
      { memberId: 'm_kali', share: 250 },
      { memberId: 'm_pandey', share: 250 },
      { memberId: 'm_rohit', share: 250 },
    ],
    splitType: 'equal',
    createdAt: '2026-09-13T08:30:00Z',
  },
  {
    id: 'exp_3',
    description: 'IMAX Movie Tickets',
    amount: 1400,
    paidBy: 'm_pandey',
    date: '2026-09-12',
    time: '19:15',
    category: 'Entertainment & Movies',
    notes: 'Weekend Sci-Fi blockbuster',
    participants: [
      { memberId: 'm_prabhat', share: 350 },
      { memberId: 'm_abhijit', share: 350 },
      { memberId: 'm_pandey', share: 350 },
      { memberId: 'm_gadam', share: 350 },
    ],
    splitType: 'equal',
    createdAt: '2026-09-12T19:15:00Z',
  },
  {
    id: 'exp_4',
    description: 'Tapri Chai & Samosa Snacks',
    amount: 420,
    paidBy: 'm_gadam',
    date: '2026-09-11',
    time: '17:30',
    category: 'Tea & Snacks',
    notes: 'Evening tea break',
    participants: [
      { memberId: 'm_prabhat', share: 70 },
      { memberId: 'm_abhijit', share: 70 },
      { memberId: 'm_gadam', share: 70 },
      { memberId: 'm_kali', share: 70 },
      { memberId: 'm_pandey', share: 70 },
      { memberId: 'm_rohit', share: 70 },
    ],
    splitType: 'equal',
    createdAt: '2026-09-11T17:30:00Z',
  },
  {
    id: 'exp_5',
    description: 'Groceries & Cold Drinks',
    amount: 880,
    paidBy: 'm_kali',
    date: '2026-09-10',
    time: '16:00',
    category: 'Shopping',
    notes: 'House party supplies',
    participants: [
      { memberId: 'm_prabhat', share: 176 },
      { memberId: 'm_abhijit', share: 176 },
      { memberId: 'm_gadam', share: 176 },
      { memberId: 'm_kali', share: 176 },
      { memberId: 'm_pandey', share: 176 },
    ],
    splitType: 'equal',
    createdAt: '2026-09-10T16:00:00Z',
  },
  {
    id: 'exp_6',
    description: 'Weekend Highway Dhaba',
    amount: 650,
    paidBy: 'm_rohit',
    date: '2026-09-09',
    time: '21:00',
    category: 'Food & Dining',
    notes: 'Parathas and lassi',
    participants: [
      { memberId: 'm_prabhat', share: 130 },
      { memberId: 'm_abhijit', share: 130 },
      { memberId: 'm_gadam', share: 130 },
      { memberId: 'm_pandey', share: 130 },
      { memberId: 'm_rohit', share: 130 },
    ],
    splitType: 'equal',
    createdAt: '2026-09-09T21:00:00Z',
  },
];
