const API_BASE = '/api';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const isFormData = options.body instanceof FormData;
  const headers = isFormData ? { ...options.headers } : { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, signal: controller.signal });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Server timed out. Please try again.');
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Unable to connect to server.');
    }
    throw err;
  } finally { clearTimeout(timeout); }
}

const api = {
  auth: {
    register: (d) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(d) }),
    login: (d) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(d) }),
    me: () => apiRequest('/auth/me'),
    updateProfile: (d) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(d) }),
  },
  products: {
    list: (search, category) => {
      let q = '';
      if (search || category) {
        q = '?';
        if (search) q += `search=${encodeURIComponent(search)}`;
        if (search && category) q += '&';
        if (category) q += `category=${encodeURIComponent(category)}`;
      }
      return apiRequest(`/products${q}`);
    },
    get: (id) => apiRequest(`/products/${id}`),
    categories: () => apiRequest('/products/categories'),
  },
  cart: {
    get: () => apiRequest('/cart'),
    add: (pid, qty) => apiRequest('/cart/add', { method: 'POST', body: JSON.stringify({ productId: pid, quantity: qty }) }),
    update: (pid, qty) => apiRequest('/cart/update', { method: 'PUT', body: JSON.stringify({ productId: pid, quantity: qty }) }),
    remove: (pid) => apiRequest(`/cart/remove/${pid}`, { method: 'DELETE' }),
    clear: () => apiRequest('/cart/clear', { method: 'DELETE' }),
  },
  orders: {
    place: (data) => apiRequest('/orders/place', { method: 'POST', body: JSON.stringify(data) }),
    list: () => apiRequest('/orders'),
    get: (id) => apiRequest(`/orders/${id}`),
    updateStatus: (id, status, note) => apiRequest(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
  },
  admin: {
    login: (d) => apiRequest('/auth/admin/login', { method: 'POST', body: JSON.stringify(d) }),
    register: (d) => apiRequest('/auth/admin/register', { method: 'POST', body: JSON.stringify(d) }),
    users: () => apiRequest('/admin/users'),
    orders: () => apiRequest('/admin/orders'),
    order: (id) => apiRequest(`/admin/orders/${id}`),
    updateOrderStatus: (id, status, note) => apiRequest(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
    products: () => apiRequest('/admin/products'),
    deleteProduct: (id) => apiRequest(`/admin/products/${id}`, { method: 'DELETE' }),
  },
  sellerAuth: {
    login: (d) => apiRequest('/auth/seller/login', { method: 'POST', body: JSON.stringify(d) }),
    register: (d) => apiRequest('/auth/seller/register', { method: 'POST', body: JSON.stringify(d) }),
  },
  upload: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return apiRequest('/upload', { method: 'POST', body: fd });
  },
  uploadMultiple: (files) => {
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('images', f));
    return apiRequest('/upload-multiple', { method: 'POST', body: fd });
  },
  seller: {
    products: () => apiRequest('/seller/products'),
    create: (d) => apiRequest('/seller/products', { method: 'POST', body: JSON.stringify(d) }),
    update: (id, d) => apiRequest(`/seller/products/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id) => apiRequest(`/seller/products/${id}`, { method: 'DELETE' }),
  },
};
