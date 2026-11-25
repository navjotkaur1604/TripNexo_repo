import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('tripnexo_token') || localStorage.getItem('tripnexo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong while communicating with the server.';
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  getMe: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (payload) => api.put('/auth/me', payload).then((r) => r.data),
  uploadProfileImage: (formData) =>
    api
      .post('/auth/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  toggleFavorite: (destinationId) => api.post(`/auth/favorites/${destinationId}`).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export const destinationAPI = {
  list: (params) => api.get('/destinations', { params }).then((r) => r.data),
  getById: (id) => api.get(`/destinations/${id}`).then((r) => r.data),
  create: (payload) => api.post('/destinations', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/destinations/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/destinations/${id}`).then((r) => r.data),
};

export const tripAPI = {
  list: () => api.get('/trips').then((r) => r.data),
  getById: (id) => api.get(`/trips/${id}`).then((r) => r.data),
  create: (payload) => api.post('/trips', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/trips/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/trips/${id}`).then((r) => r.data),
  regenerate: (id, payload = {}) => api.post(`/trips/${id}/generate-itinerary`, payload).then((r) => r.data),
  duplicate: (id) => api.post(`/trips/${id}/duplicate`).then((r) => r.data),
};

export const budgetAPI = {
  estimate: (payload) => api.post('/budget/estimate', payload).then((r) => r.data),
  getTripBudget: (tripId) => api.get(`/budget/trip/${tripId}`).then((r) => r.data),
};

export const reviewAPI = {
  listByDestination: (destinationId) => api.get(`/reviews/${destinationId}`).then((r) => r.data),
  create: (payload) => api.post('/reviews', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/reviews/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/reviews/${id}`).then((r) => r.data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  getUsers: () => api.get('/admin/users').then((r) => r.data),
  getTrips: () => api.get('/admin/trips').then((r) => r.data),
};

export default api;
