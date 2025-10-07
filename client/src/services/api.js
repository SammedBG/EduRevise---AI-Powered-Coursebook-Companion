import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Allow cookies to be sent
});

// Request interceptor - cookies are automatically sent with withCredentials: true
api.interceptors.request.use(
  (config) => {
    // No need to manually add tokens - HttpOnly cookies are sent automatically
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
      // Only redirect to login if not already on login/register page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/login';
      }
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
  logout: () => api.post('/auth/logout'),
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

// YouTube API
export const youtubeAPI = {
  getRecommendations: (pdfId, params = {}) => api.get(`/youtube/recommendations/${pdfId}`, { params }),
  getBatchRecommendations: (data) => api.post('/youtube/recommendations/batch', data),
  getVideoDetails: (videoId) => api.get(`/youtube/video/${videoId}`)
};

export default api;
