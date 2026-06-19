const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('focusfight_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Network error');
  }
  return response.json();
};

export const authApi = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
};

export const challengeApi = {
  create: (body) => request('/challenges', { method: 'POST', body }),
  list: () => request('/challenges'),
  getByInviteCode: (inviteCode) => request(`/challenges/${inviteCode}`),
  respond: (inviteCode, accepted) => request(`/challenges/${inviteCode}/respond`, { method: 'POST', body: { accepted } }),
  delete: (id) => request(`/challenges/${id}`, { method: 'DELETE' }),
  removeParticipant: (id, participantId) => request(`/challenges/${id}/remove/${participantId}`, { method: 'POST' }),
};

export const inviteApi = {
  getInvite: (code) => request(`/invite/${code}`),
};

export const notificationApi = {
  list: () => request('/notifications'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
};

export const usageApi = {
  sync: (body) => request('/usage/sync', { method: 'POST', body }),
  history: (challengeId) => request(`/usage/challenge/${challengeId}`),
};
