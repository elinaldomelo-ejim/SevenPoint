import { User, Settings, Record, ClockInType } from '../types';

const API_URL = '';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  async login(credentials: any) {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/api/users`, { headers: getAuthHeader() });
    return res.json();
  },

  async createUser(data: any) {
    const res = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateUser(id: number, data: any) {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteUser(id: number) {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return res.json();
  },

  async getSettings(): Promise<Settings> {
    const res = await fetch(`${API_URL}/api/settings`);
    return res.json();
  },

  async updateSettings(data: any) {
    const res = await fetch(`${API_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getRecords(params?: any): Promise<Record[]> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/api/records?${query}`, { headers: getAuthHeader() });
    return res.json();
  },

  async createRecord(data: { date: string; clock_in_type: ClockInType; time: string; obs?: string; photo?: string }) {
    const res = await fetch(`${API_URL}/api/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteRecord(id: number) {
    const res = await fetch(`${API_URL}/api/records/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return res.json();
  }
};
