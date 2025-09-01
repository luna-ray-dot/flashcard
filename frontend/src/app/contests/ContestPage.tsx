"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Leaderboard from './Leaderboard';
import toast from 'react-hot-toast';

interface ContestProps {
  userId: string;
  cardId: string;
}

const ContestPage: React.FC<ContestProps> = ({ userId, cardId }) => {
  const [participants, setParticipants] = useState<string[]>([userId]);
  const [contestId, setContestId] = useState<string | null>(null);

  const startContest = async () => {
    try {
      const res = await axios.post('/api/contests/create', { cardId, participants });
      setContestId(res.data.id);
      toast.success('Contest started!');
    } catch (err) {
      toast.error('Failed to start contest');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">🏆 Contest Mode</h1>
      <button
        onClick={startContest}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4"
      >
        Start Contest
      </button>

      {contestId && <p>Contest ID: {contestId}</p>}

      <Leaderboard />
    </div>
  );
};

export default ContestPage;
