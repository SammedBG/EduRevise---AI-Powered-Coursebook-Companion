import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with cookie-based authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable cookies for all requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF token storage
let csrfToken = null;

// Request interceptor to add CSRF token
api.interceptors.request.use(
  async (config) => {
    // Add CSRF token for non-GET requests
    if (config.method !== 'get' && csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Function to get CSRF token
export const getCSRFToken = async () => {
  try {
    const response = await api.get('/csrf-token');
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
};

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
  getRecommendations: (pdfId, maxResults = 5) => api.get(`/youtube/recommendations/${pdfId}?maxResults=${maxResults}`),
  getBatchRecommendations: (pdfIds, maxResults = 5) => api.post('/youtube/recommendations/batch', { pdfIds, maxResults }),
};

export default api;
