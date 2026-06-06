import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:expired'));
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (credentials) => API.post('/auth/register', credentials),
  me: () => API.get('/auth/me'),
  changePassword: (data) => API.put('/auth/password', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.post('/auth/reset-password', data)
};

export const customerAPI = {
  addCustomer: (data) => API.post('/customers/add', data),
  getAllCustomers: (params) => API.get('/customers', { params }),
  getCustomer: (id) => API.get(`/customers/${id}`),
  getCustomersByWeekDay: (day, params) => API.get(`/customers/weekday/${day}`, { params }),
  searchCustomers: (query, params = {}) => API.get('/customers/search', { params: { query, ...params } }),
  updateCustomer: (id, data) => API.put(`/customers/${id}`, data),
  deleteCustomer: (id) => API.delete(`/customers/${id}`)
};

export const paymentAPI = {
  getPaymentsByCustomer: (customerId, params) => API.get(`/payments/customer/${customerId}`, { params }),
  getPaymentHistory: (customerId) => API.get(`/payments/history/${customerId}`),
  getPaymentsByWeekDay: (day, params) => API.get(`/payments/weekday/${day}`, { params }),
  getPendingPayments: (params) => API.get('/payments/pending/list', { params }),
  getOverduePayments: (params) => API.get('/payments/overdue/list', { params }),
  getDashboardStats: () => API.get('/payments/dashboard/stats'),
  getDailyReport: () => API.get('/payments/dashboard/daily-report'),
  updatePayment: (id, data) => API.put(`/payments/${id}`, data)
};

export default API;
