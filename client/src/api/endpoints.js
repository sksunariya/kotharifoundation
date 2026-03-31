import api from './axios';

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// Config
export const configAPI = {
  getPublic: () => api.get('/config/public'),
  getAdmin: () => api.get('/admin/config'),
  update: (data) => api.put('/admin/config', data),
};

// Categories
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getOne: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/admin/categories', data),
  update: (id, data) => api.put(`/admin/categories/${id}`, data),
  delete: (id) => api.delete(`/admin/categories/${id}`),
};

// Slots
export const slotAPI = {
  getAll: (params) => api.get('/slots', { params }),
  getOne: (id) => api.get(`/slots/${id}`),
  create: (data) => api.post('/admin/slots', data),
  update: (id, data) => api.put(`/admin/slots/${id}`, data),
  delete: (id) => api.delete(`/admin/slots/${id}`),
};

// Bookings
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getMy: () => api.get('/bookings/my'),
  getStatus: (ref) => api.get(`/bookings/status/${ref}`),
  getAll: (params) => api.get('/admin/bookings', { params }),
  cancel: (id) => api.put(`/admin/bookings/${id}/cancel`),
  setMeetLink: (id, meetLink) => api.put(`/admin/bookings/${id}/meet-link`, { meetLink }),
};

// Payments
export const paymentAPI = {
  submit: (formData) => api.post('/payments', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  resubmit: (id, formData) => api.put(`/payments/${id}/resubmit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => api.get('/admin/payments', { params }),
  verify: (id, data) => api.put(`/admin/payments/${id}/verify`, data),
  reject: (id, data) => api.put(`/admin/payments/${id}/reject`, data),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
};

// Instructors
export const instructorAPI = {
  getAll: () => api.get('/instructors'),
  getOne: (id) => api.get(`/instructors/${id}`),
  getAdminAll: () => api.get('/admin/instructors'),
  create: (data) => api.post('/admin/instructors', data),
  update: (id, data) => api.put(`/admin/instructors/${id}`, data),
  delete: (id) => api.delete(`/admin/instructors/${id}`),
};
