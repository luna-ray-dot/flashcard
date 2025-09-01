'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Card {
  id: string;
  title: string;
  type: string;
  content: string;
  relationships?: string[];
}

export default function CardList() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    try {
      const res = await axios.get('http://localhost:3001/cards');
      setCards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
    const interval = setInterval(fetchCards, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>Loading cards...</p>;

  return (
    <div className="bg-white shadow rounded p-6">
      <h2 className="text-xl font-bold mb-4">Flashcards</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Relationships</th>
            </tr>
          </thead>
          <tbody>
            {cards.map(card => (
              <tr key={card.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-2">{card.id}</td>
                <td className="px-4 py-2">{card.title}</td>
                <td className="px-4 py-2">{card.type}</td>
                <td className="px-4 py-2">{card.relationships?.join(', ') || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
