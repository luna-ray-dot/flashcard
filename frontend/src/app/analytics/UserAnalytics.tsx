'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface Metrics {
  totalInteractions: number;
  correctCount: number;
  accuracy: number;
  avgHesitation: number;
}

export default function UserAnalytics({ userId }: { userId: string }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await axios.get(`/api/analytics/${userId}`);
        setMetrics(res.data);
      } catch (error) {
        console.error('Failed to fetch user metrics:', error);
      }
    }

    fetchMetrics();
  }, [userId]);

  if (!metrics) return <p>Loading analytics...</p>;

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-lg font-bold mb-2">Learning Analytics</h2>
      <ul className="space-y-1">
        <li>Total Interactions: {metrics.totalInteractions}</li>
        <li>Correct Answers: {metrics.correctCount}</li>
        <li>Accuracy: {(metrics.accuracy * 100).toFixed(2)}%</li>
        <li>Average Hesitation: {metrics.avgHesitation.toFixed(2)}s</li>
      </ul>
    </div>
  );
}
