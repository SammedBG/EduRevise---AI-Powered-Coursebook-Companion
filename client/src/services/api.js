import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// PDF API
export const pdfAPI = {
  upload: (formData) => api.post('/pdfs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => api.get('/pdfs'),
  getById: (id) => api.get(`/pdfs/${id}`),
  delete: (id) => api.delete(`/pdfs/${id}`),
  search: (query) => api.get(`/pdfs/search/${query}`),
  process: (id) => api.post(`/pdfs/${id}/process`),
};

// Chat API
export const chatAPI = {
  getAll: () => api.get('/chat'),
  create: (data) => api.post('/chat', data),
  getById: (id) => api.get(`/chat/${id}`),
  sendMessage: (id, message) => api.post(`/chat/${id}/messages`, message),
  delete: (id) => api.delete(`/chat/${id}`),
};

// Quiz API
export const quizAPI = {
  generate: (data) => api.post('/quiz/generate', data),
  getAll: () => api.get('/quiz'),
  getById: (id) => api.get(`/quiz/${id}`),
  submit: (id, answers) => api.post(`/quiz/${id}/submit`, answers),
  getResults: (id) => api.get(`/quiz/${id}/results`),
  regenerate: (id, data) => api.post(`/quiz/${id}/regenerate`, data),
  delete: (id) => api.delete(`/quiz/${id}`),
};

// Progress API
export const progressAPI = {
  getDashboard: () => api.get('/progress/dashboard'),
  getSubjectProgress: (subject) => api.get(`/progress/subject/${subject}`),
  getTopicProgress: (topicId) => api.get(`/progress/topic/${topicId}`),
  getRecommendations: () => api.get('/progress/recommendations'),
  getAnalytics: (period) => api.get(`/progress/analytics?period=${period}`),
};

export default api;
