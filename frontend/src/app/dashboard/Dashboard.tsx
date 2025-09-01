
"use client";


import React, { useState, useEffect } from 'react';
import NextCard from '../ai/NextCard';
import AIChat from '../ai-chat/AIChat';
import CardBattle from '../cards/CardBattle';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import './Dashboard.css';

interface User {
  id: string;
  name: string;
  xp: number;
}

const Dashboard: React.FC<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentCardId, setCurrentCardId] = useState<string>('');

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`/users/${userId}`);
        setUser(res.data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        toast.error('Unable to load user info');
      }
    };
    fetchUser();
  }, [userId]);

  // Callback after completing a card
  const handleNextCardCompleted = (nextCardId: string, xpGained: number) => {
    setCurrentCardId(nextCardId);
    toast.success(`You earned ${xpGained} XP!`);
    setUser((prev) => prev && { ...prev, xp: prev.xp + xpGained });
  };

  return (
    <div className="dashboard-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Next Card / Spaced Repetition */}
      <div className="next-card-wrapper">
        <NextCard userId={userId} onCardCompleted={handleNextCardCompleted} />
      </div>

      {/* Real-time Card Battle */}
      <div className="card-battle-wrapper">
        {currentCardId ? (
          <CardBattle userId={userId} cardId={currentCardId} />
        ) : (
          <p>Complete a card to start battles!</p>
        )}
      </div>

      {/* AI-powered Hints / Chat */}
      <div className="ai-chat-wrapper">
        <AIChat userId={userId} />
      </div>
    </div>
  );
};

export default Dashboard;
