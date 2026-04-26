import api from './axios';

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }),
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
  uploadBranding: (formData) => api.post('/admin/config/branding', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Categories
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getOne: (id) => api.get(`/categories/${id}`),
  create: (formData) => api.post('/admin/categories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/admin/categories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
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
  getResubmitDetails: (id) => api.get(`/bookings/${id}/resubmit-details`),
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

// Resources
export const resourceAPI = {
  getForSlot: (slotId) => api.get(`/resources/${slotId}`),
  getAdminForSlot: (slotId) => api.get(`/admin/resources/${slotId}`),
  create: (data) => api.post('/admin/resources', data),
  update: (id, data) => api.put(`/admin/resources/${id}`, data),
  delete: (id) => api.delete(`/admin/resources/${id}`),
  uploadFile: (formData, onProgress) => api.post('/admin/resources/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress ? (e) => onProgress(Math.round((e.loaded / e.total) * 100)) : undefined,
  }),
};

// Instructors
export const instructorAPI = {
  getAll: () => api.get('/instructors'),
  getOne: (id) => api.get(`/instructors/${id}`),
  getAdminAll: () => api.get('/admin/instructors'),
  create: (formData) => api.post('/admin/instructors', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/admin/instructors/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/admin/instructors/${id}`),
};

// Reviews
export const reviewAPI = {
  submit: (data) => api.post('/reviews', data),
  getPublished: () => api.get('/reviews/published'),
  getMy: () => api.get('/reviews/my'),
  getAdmin: (params) => api.get('/admin/reviews', { params }),
  createAdmin: (data) => api.post('/admin/reviews', data),
  update: (id, data) => api.put(`/admin/reviews/${id}`, data),
  approve: (id, data) => api.put(`/admin/reviews/${id}/approve`, data),
  reject: (id, data) => api.put(`/admin/reviews/${id}/reject`, data),
  delete: (id) => api.delete(`/admin/reviews/${id}`),
};

// Queries
export const queryAPI = {
  submit: (data) => api.post('/queries', data),
  getAdmin: (params) => api.get('/admin/queries', { params }),
  update: (id, data) => api.put(`/admin/queries/${id}`, data),
  delete: (id) => api.delete(`/admin/queries/${id}`),
};

// Carousel
export const carouselAPI = {
  getPublic: () => api.get('/carousel'),
  getAdmin: () => api.get('/admin/carousel'),
  create: (formData) => api.post('/admin/carousel', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/admin/carousel/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/admin/carousel/${id}`),
  reorder: (slides) => api.put('/admin/carousel/reorder', { slides }),
};
