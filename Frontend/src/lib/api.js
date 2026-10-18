export class ApiError extends Error {
  constructor(status, message, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

// Cliente HTTP para la API del backend. La sesión viaja en cookies httpOnly.
async function request(path, { method = 'GET', body, formData } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      // Con FormData el navegador fija el Content-Type multipart (con boundary).
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // 502/504 sin JSON: el proxy de Vite no alcanza el backend (no está arrancado o falló al iniciar).
    const fallback =
      !data && (res.status === 502 || res.status === 504)
        ? 'El servidor de la API no está disponible. Comprueba que el backend esté arrancado.'
        : 'Ha ocurrido un error inesperado';
    throw new ApiError(res.status, data?.error ?? fallback, data?.fields);
  }
  return data;
}

export const api = {
  getSession: () => request('/auth/session'),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  logout: () => request('/auth/logout', { method: 'POST', body: {} }),
  updateProfile: (data) => request('/profile', { method: 'PATCH', body: data }),

  forgotPassword: (email) => request('/auth/password/forgot', { method: 'POST', body: { email } }),
  verifyPasswordCode: (email, token) => request('/auth/password/verify', { method: 'POST', body: { email, token } }),
  resetPassword: (password) => request('/auth/password/reset', { method: 'POST', body: { password } }),

  listInvoices: () => request('/invoices'),
  createInvoice: (data) => request('/invoices', { method: 'POST', body: data }),
  updateInvoice: (id, data) => request(`/invoices/${id}`, { method: 'PATCH', body: data }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: 'DELETE', body: {} }),
  extractInvoice: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/invoices/extract', { method: 'POST', formData });
  },

  listCustomers: () => request('/customers'),
  createCustomer: (data) => request('/customers', { method: 'POST', body: data }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PATCH', body: data }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE', body: {} }),

  listSubscriptions: () => request('/subscriptions'),
  createSubscription: (data) => request('/subscriptions', { method: 'POST', body: data }),
  updateSubscription: (id, data) => request(`/subscriptions/${id}`, { method: 'PATCH', body: data }),
  deleteSubscription: (id) => request(`/subscriptions/${id}`, { method: 'DELETE', body: {} }),

  listPayments: () => request('/payments'),
  createPayment: (data) => request('/payments', { method: 'POST', body: data }),
  updatePayment: (id, data) => request(`/payments/${id}`, { method: 'PATCH', body: data }),
  deletePayment: (id) => request(`/payments/${id}`, { method: 'DELETE', body: {} }),
};
