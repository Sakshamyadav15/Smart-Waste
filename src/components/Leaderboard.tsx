import { Trophy, Medal, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLeaderboard, getUserId, seedDemoLeaderboard, type LeaderboardEntry } from '../services/leaderboard';

interface LeaderboardProps {
  city?: string;
}

export default function Leaderboard({ city }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const currentUserId = getUserId();

  useEffect(() => {
    
    seedDemoLeaderboard();
    
    const refreshLeaderboard = () => {
      setLeaderboard(getLeaderboard(city));
    };
    
    refreshLeaderboard();

    const interval = setInterval(refreshLeaderboard, 3000);
    
    return () => clearInterval(interval);
  }, [city]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-green-50 border-2 border-green-500';
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300';
    return 'bg-white border border-gray-200';
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 animate-fadeIn">
      <div className="space-y-4">
        {}
        <div className="flex items-center justify-center gap-2 pb-4 border-b border-gray-200">
          <Trophy className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-800">
            {city ? `${city} Leaderboard` : 'Global Leaderboard'}
          </h2>
        </div>

        {}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {leaderboard.slice(0, 10).map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            return (
              <div
                key={entry.userId}
                className={`${getRankBg(entry.rank || 0, isCurrentUser)} rounded-xl p-4 transition-all hover:shadow-md`}
              >
                <div className="flex items-center gap-4">
                  {}
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank || 0)}
                  </div>

                  {}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isCurrentUser ? 'text-green-700' : 'text-gray-800'}`}>
                      {entry.userName}
                      {isCurrentUser && ' (You)'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.totalItems} items • {entry.co2Saved.toFixed(1)} kg CO₂
                    </p>
                  </div>

                  {}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full">
                    <p className="text-sm font-bold">{entry.points}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {}
        {leaderboard.length === 0 && (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No entries yet. Be the first!</p>
          </div>
        )}

        {}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-4">
          <p className="text-xs text-blue-800 text-center">
            💡 Earn points by classifying waste! E-waste = 100pts, Plastic = 70pts
          </p>
        </div>
      </div>
    </div>
  );
}
