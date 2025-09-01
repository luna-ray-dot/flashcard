// src/app/users/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001', // your NestJS backend URL
  headers: { 'Content-Type': 'application/json' },
});

export const registerUser = async (user: { username: string; email: string; password: string }) => {
  const res = await api.post('/users/register', user);
  return res.data;
};

export const getUsers = async () => {
  const res = await api.get('/users');
  return res.data;
};
