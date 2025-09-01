"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface LeaderboardEntry {
  username: string;
  xp: number;
}

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    axios.get('/api/contests/leaderboard')
      .then(res => setEntries(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Leaderboard 🏆</h2>
      <ol className="list-decimal pl-5">
        {entries.map((e, idx) => (
          <li key={idx}>
            {e.username} - {e.xp} XP
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Leaderboard;
