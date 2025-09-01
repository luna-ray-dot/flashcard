'use client';

import { useState } from 'react';
import axios from 'axios';

export default function CardCreate() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('text'); // text, image, cloze
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/cards', {
        title,
        content,
        type,
      });
      setMessage('Card created successfully!');
      setTitle('');
      setContent('');
      setType('text');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error creating card.');
    }
  };

  return (
    <div className="bg-white shadow rounded p-6">
      <h2 className="text-xl font-bold mb-4">Create New Flashcard</h2>
      {message && <p className="mb-4 text-green-600">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            required
          ></textarea>
        </div>
        <div>
          <label className="block mb-1 font-medium">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="cloze">Cloze</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Create Card
        </button>
      </form>
    </div>
  );
}
