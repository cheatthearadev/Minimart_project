const BASE = import.meta.env.VITE_API_URL || 'https://minimart-project-2.onrender.com';

function getToken() {
  try {
    const saved = sessionStorage.getItem('minimart_user');
    if (saved) {
      const user = JSON.parse(saved);
      return user.token || null;
    }
  } catch {}
  return null;
}

async function request(endpoint, options = {}) {
  const { method = 'GET', body, isFormData = false } = options;
  const config = { method };

  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  config.headers = headers;

  if (body && !isFormData) {
    config.body = JSON.stringify(body);
  } else if (body && isFormData) {
    config.body = body;
  }

  const res = await fetch(`${BASE}/${endpoint}`, config);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `Server error: ${res.status}`);
  return data;
}

export const api = {
  get: (ep) => request(ep),
  post: (ep, body) => request(ep, { method: 'POST', body }),
  upload: async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const data = await request('UploadImage.php', { method: 'POST', body: fd, isFormData: true });
    return data.image;
  },

  login: (username, password) => request('login.php', { method: 'POST', body: { username, password } }),
  googleLogin: (credential) => request('GoogleLogin.php', { method: 'POST', body: { credential } }),
  register: (username, password, role) => request('register.php', { method: 'POST', body: { username, password, role } }),
  updateProfile: (body) => request('UpdateProfile.php', { method: 'POST', body }),

  getProducts: () => request('Product.php'),
  createProduct: (body) => request('CreateProduct.php', { method: 'POST', body }),
  updateProduct: (body) => request('UpdateProduct.php', { method: 'POST', body }),
  deleteProduct: (id) => request('DeleteProduct.php', { method: 'POST', body: { id } }),
  toggleFavorite: (id) => request('ToggleFavorite.php', { method: 'POST', body: { id } }),

  getCategories: () => request('Categories.php'),
  createCategory: (body) => request('CreateCategory.php', { method: 'POST', body }),
  updateCategory: (body) => request('UpdateCategory.php', { method: 'POST', body }),
  deleteCategory: (id) => request('DeleteCategory.php', { method: 'POST', body: { id } }),

  getSuppliers: () => request('Suppliers.php'),
  createSupplier: (body) => request('CreateSupplier.php', { method: 'POST', body }),
  updateSupplier: (body) => request('UpdateSupplier.php', { method: 'POST', body }),
  deleteSupplier: (id) => request('DeleteSupplier.php', { method: 'POST', body: { id } }),

  getCustomers: () => request('Customers.php'),
  createCustomer: (body) => request('CreateCustomer.php', { method: 'POST', body }),
  updateCustomer: (body) => request('UpdateCustomer.php', { method: 'POST', body }),
  deleteCustomer: (id) => request('DeleteCustomer.php', { method: 'POST', body: { id } }),
  lookupCustomer: (body) => request('LookupCustomer.php', { method: 'POST', body }),
  getCustomerDetail: (id, page = 1, perPage = 10) => request(`CustomersDetail.php?id=${id}&page=${page}&per_page=${perPage}`),

  getDiscounts: () => request('Discounts.php'),
  createDiscount: (body) => request('CreateDiscount.php', { method: 'POST', body }),
  updateDiscount: (body) => request('UpdateDiscount.php', { method: 'POST', body }),
  deleteDiscount: (id) => request('DeleteDiscount.php', { method: 'POST', body: { id } }),
  validateDiscount: (code, total) => request('ValidateDiscount.php', { method: 'POST', body: { code, total } }),

  getCoupons: () => request('coupons.php'),
  createCoupon: (body) => request('coupons.php', { method: 'POST', body }),
  updateCoupon: (body) => request('coupons.php', { method: 'PUT', body }),
  deleteCoupon: (id) => request('coupons.php', { method: 'DELETE', body: { id } }),
  validateCoupon: (code, orderTotal) => request('validate_coupon.php', { method: 'POST', body: { code, order_total: orderTotal } }),

  getOrders: () => request('Orders.php'),
  createOrder: (body) => request('CreateOrder.php', { method: 'POST', body }),
  voidOrder: (orderId) => request('VoidOrder.php', { method: 'POST', body: { order_id: orderId } }),

  getDeliveries: (status) => request(`Deliveries.php${status && status !== 'all' ? `?status=${status}` : ''}`),
  updateDeliveryStatus: (body) => request('UpdateDeliveryStatus.php', { method: 'POST', body }),

  getReturns: () => request('Returns.php'),
  createReturn: (body) => request('CreateReturn.php', { method: 'POST', body }),

  getUsers: () => request('Users.php'),
  createUser: (body) => request('CreateUser.php', { method: 'POST', body }),
  updateUser: (body) => request('UpdateUser.php', { method: 'POST', body }),
  deleteUser: (id, adminId) => request('DeleteUser.php', { method: 'POST', body: { id, admin_id: adminId } }),
  uploadProfileImage: async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const data = await request('UploadUserProfile.php', { method: 'POST', body: fd, isFormData: true });
    return data.image;
  },

  getShifts: () => request('Shifts.php'),
  startShift: (starting_cash) => request('StartShift.php', { method: 'POST', body: { starting_cash } }),
  endShift: (id, ending_cash) => request('EndShift.php', { method: 'POST', body: { id, ending_cash } }),

  getDashboardStats: () => request('DashboardStats.php'),
  getReports: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`Reports.php?${qs}`);
  },
  getZReport: (date) => request(`ZReport.php?date=${date || ''}`),

  sendTelegram: (message) => request('SendTelegram.php', { method: 'POST', body: { message } }),
};
