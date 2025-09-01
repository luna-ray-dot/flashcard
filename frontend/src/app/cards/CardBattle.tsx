"use client";

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Howl } from 'howler';

interface Participant {
  userId: string;
  answer?: string;
  correct?: boolean;
  time?: number;
}

interface Battle {
  id: string;
  cardId: string;
  participants: Participant[];
  winner?: string;
}

const socket: Socket = io('http://localhost:3001'); // adjust backend port

interface CardBattleProps {
  userId: string;
  cardId: string;
  userXP?: number;
}

const flipSound = new Howl({ src: ['/sounds/flip.mp3'], volume: 0.5 });

const CardBattle: React.FC<CardBattleProps> = ({ userId, cardId, userXP = 0 }) => {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [answer, setAnswer] = useState('');
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    async function initBattle() {
      try {
        const res = await axios.post('http://localhost:3001/battles/create', { cardId });
        const battleId = res.data.id;
        socket.emit('joinBattle', { battleId, userId });

        socket.on('battleUpdate', (updatedBattle: Battle) => {
          setBattle(updatedBattle);
          setFlipped(true);
          flipSound.play();
          setTimeout(() => setFlipped(false), 1000);
        });

        socket.on('notification', (data: { message: string; type: 'success' | 'error' }) => {
          toast[data.type](data.message);
        });

        // AI fallback for single player
        setTimeout(() => {
          if (battle?.participants.length === 1 && !battle.participants.some(p => p.userId === 'AI_BOT')) {
            const aiAccuracy = Math.max(0.3, 0.8 - userXP * 0.01);
            const aiDelay = 2000 + Math.min(userXP * 50, 5000);
            const aiAnswer = Math.random() < aiAccuracy ? 'correct' : 'wrong';

            socket.emit('joinBattle', { battleId, userId: 'AI_BOT' });
            setTimeout(() => {
              socket.emit('submitAnswer', { battleId, userId: 'AI_BOT', answer: aiAnswer });
            }, aiDelay);
          }
        }, 2000);

      } catch (err) {
        toast.error('Failed to create battle');
      }
    }

    initBattle();

    return () => {
      socket.off('battleUpdate');
      socket.off('notification');
    };
  }, [cardId, userId, userXP]);

  const submitAnswer = () => {
    if (!battle) return;
    socket.emit('submitAnswer', { battleId: battle.id, userId, answer });
    setAnswer('');
  };

  return (
    <div className="card-battle-container p-4 border rounded-md shadow-md bg-white dark:bg-gray-800">
      <h2 className="text-lg font-semibold mb-2 text-center">🆚 Card Battle</h2>

      {battle ? (
        <>
          <div className="mb-4 text-center">
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-100 dark:bg-gray-700 p-4 rounded shadow cursor-pointer inline-block"
              onClick={() => { setFlipped(!flipped); flipSound.play(); }}
            >
              <strong>Card ID:</strong> {battle.cardId}
            </motion.div>
          </div>

          <div className="flex mb-4 space-x-2">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer"
              className="border rounded px-2 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={submitAnswer}
              className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
            >
              Submit
            </button>
          </div>

          <div className="mb-2">
            <h3 className="font-semibold">Participants:</h3>
            <ul className="list-disc pl-5">
              {battle.participants.map(p => (
                <li key={p.userId}>
                  {p.userId} - {p.answer ?? 'No answer'} - {p.correct === undefined ? '' : p.correct ? '✅' : '❌'}
                </li>
              ))}
            </ul>
          </div>

          {battle.winner && (
            <h3 className="mt-2 font-bold text-green-600 text-center">Winner: {battle.winner} 🎉</h3>
          )}
        </>
      ) : (
        <p className="text-center">Loading battle...</p>
      )}
    </div>
  );
};

export default CardBattle;
