import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Howl } from 'howler'; // For flip sounds
import './NextCard.css'; // 3D flip styles

interface Card {
  id: string;
  title: string;
  content: string;
  level?: number;
}

interface Props {
  userId: string;
}

const API_URL = 'http://localhost:3001'; // Change if your backend runs elsewhere

const flipSound = new Howl({
  src: ['/sounds/flip.mp3'], // Ensure this file exists in public/sounds
});

// Axios instance with JWT
const getApi = () =>
  axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('jwt') || ''}`,
    },
  });

const NextCard: React.FC<Props> = ({ userId }) => {
  const [card, setCard] = useState<Card | null>(null);
  const [showFront, setShowFront] = useState(true);
  const [xp, setXp] = useState(0);
  const [error, setError] = useState('');

  const fetchNextCard = async () => {
    setError('');
    try {
      const api = getApi();
      const res = await api.get(`/cards/next/${userId}`);
      setCard(res.data || null);
      setShowFront(true);
    } catch (err: any) {
      setError('Failed to fetch next card. Please login again or try later.');
      setCard(null);
    }
  };

  const reviewCard = async (correct: boolean) => {
    if (!card) return;

    flipSound.play();
    setShowFront((prev) => !prev); // Flip card animation

    try {
      const api = getApi();
      const res = await api.post('/cards/review', {
        userId,
        cardId: card.id,
        correct,
      });

      setXp((prev) => prev + (res.data.xpGain || 0));
      setTimeout(fetchNextCard, 1500); // Show next card after 1.5s
    } catch (err) {
      setError('Failed to record review. Please try again.');
    }
  };

  useEffect(() => {
    fetchNextCard();
    // eslint-disable-next-line
  }, []);

  if (error) return <div className="card-container text-red-500">{error}</div>;
  if (!card) return <div className="card-container">No cards available!</div>;

  return (
    <div className="card-container">
      <div className={`card ${showFront ? '' : 'flipped'}`}>
        <div className="front">{card.title}</div>
        <div className="back">{card.content}</div>
      </div>

      <div className="buttons">
        <button onClick={() => reviewCard(true)}>✅ Correct</button>
        <button onClick={() => reviewCard(false)}>❌ Incorrect</button>
      </div>

      <div className="xp-display">XP: {xp}</div>
    </div>
  );
};

export default NextCard;
