

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  city: string;
  points: number;
  totalItems: number;
  co2Saved: number;
  rank?: number;
}

const LEADERBOARD_KEY = 'ecoSortLeaderboard';

export const getUserId = (): string => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};

export const getUserName = (): string => {
  return localStorage.getItem('userName') || 'Anonymous';
};

export const setUserName = (name: string): void => {
  localStorage.setItem('userName', name);
};

export const updateLeaderboard = (points: number, totalItems: number, co2Saved: number, city: string): void => {
  const userId = getUserId();
  const userName = getUserName();
  
  const leaderboard: LeaderboardEntry[] = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
  
  const existingIndex = leaderboard.findIndex(entry => entry.userId === userId);
  
  const entry: LeaderboardEntry = {
    userId,
    userName,
    city,
    points,
    totalItems,
    co2Saved,
  };
  
  if (existingIndex >= 0) {
    leaderboard[existingIndex] = entry;
  } else {
    leaderboard.push(entry);
  }
  
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
};

export const getLeaderboard = (city?: string): LeaderboardEntry[] => {
  const leaderboard: LeaderboardEntry[] = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');

  const filtered = city ? leaderboard.filter(entry => entry.city === city) : leaderboard;

  const sorted = filtered.sort((a, b) => b.points - a.points);

  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};

export const getUserRank = (city?: string): number => {
  const userId = getUserId();
  const leaderboard = getLeaderboard(city);
  const userEntry = leaderboard.find(entry => entry.userId === userId);
  return userEntry?.rank || 0;
};

export const seedDemoLeaderboard = (): void => {
  const demoData: LeaderboardEntry[] = [
    { userId: 'demo1', userName: 'Priya Kumar', city: 'Delhi', points: 2500, totalItems: 45, co2Saved: 45.5 },
    { userId: 'demo2', userName: 'Rahul Sharma', city: 'Mumbai', points: 2200, totalItems: 38, co2Saved: 38.2 },
    { userId: 'demo3', userName: 'Ananya Reddy', city: 'Bengaluru', points: 2100, totalItems: 35, co2Saved: 35.8 },
    { userId: 'demo4', userName: 'Vikram Singh', city: 'Delhi', points: 1900, totalItems: 32, co2Saved: 32.1 },
    { userId: 'demo5', userName: 'Sneha Patel', city: 'Ahmedabad', points: 1800, totalItems: 28, co2Saved: 28.5 },
    { userId: 'demo6', userName: 'Arjun Nair', city: 'Chennai', points: 1600, totalItems: 25, co2Saved: 25.3 },
    { userId: 'demo7', userName: 'Kavya Iyer', city: 'Bengaluru', points: 1500, totalItems: 22, co2Saved: 22.7 },
    { userId: 'demo8', userName: 'Rohan Gupta', city: 'Pune', points: 1400, totalItems: 20, co2Saved: 20.2 },
  ];
  
  const existing = localStorage.getItem(LEADERBOARD_KEY);
  if (!existing || existing === '[]') {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(demoData));
  }
};
