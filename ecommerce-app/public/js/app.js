// ─── STATE ─────────────────────────────────────────────────────────────────
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentPage = 1;

const API = '/api';

// ─── INIT ───────────────────────────────────────────────────────────────────
window.onload = () => {
  updateNavbar();
  showPage('home');
};

// ─── NAVIGATION ─────────────────────────────────────────────────────────────
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');

  if (page === 'products') loadProducts();
  if (page === 'cart') renderCart();
  if (page === 'orders') loadOrders();
  if (page === 'admin') loadAdmin();
}

function updateNavbar() {
  if (token && currentUser) {
    document.getElementById('nav-auth').style.display = 'none';
    document.getElementById('nav-user').style.display = 'inline';
    if (currentUser.role === 'admin') {
      document.getElementById('nav-admin').style.display = 'inline';
    }
  } else {
    document.getElementById('nav-auth').style.display = 'inline';
    document.getElementById('nav-user').style.display = 'none';
  }
  document.getElementById('cart-count').textContent = cart.length;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Login failed'; errEl.style.display = 'block'; return; }

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));
    updateNavbar();
    showPage('products');
  } catch (e) {
    errEl.textContent = 'Network error'; errEl.style.display = 'block';
  }
}

async function register() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('register-error');
  const sucEl = document.getElementById('register-success');
  errEl.style.display = 'none'; sucEl.style.display = 'none';

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Registration failed'; errEl.style.display = 'block'; return; }
    sucEl.textContent = 'Registered successfully! Please login.'; sucEl.style.display = 'block';
    setTimeout(() => showPage('login'), 1500);
  } catch (e) {
    errEl.textContent = 'Network error'; errEl.style.display = 'block';
  }
}

function logout() {
  token = null; currentUser = null; cart = [];
  localStorage.clear();
  updateNavbar();
  showPage('home');
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
async function loadProducts(page = 1, search = '') {
  currentPage = page;
  const res = await fetch(`${API}/products?page=${page}&limit=8&search=${search}`);
  const data = await res.json();

  const grid = document.getElementById('products-grid');
  grid.innerHTML = data.products.map(p => `
    <div class="product-card">
      ${p.image_url
        ? `<img src="${p.image_url}" alt="${p.name}">`
        : `<div class="product-img-placeholder">🛍️</div>`}
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">₹${parseFloat(p.price).toFixed(2)}</div>
        <div class="product-stock">Stock: ${p.stock}</div>
        <button class="btn btn-primary btn-sm" onclick="addToCart(${p.id}, '${p.name}', ${p.price})">Add to Cart</button>
        <button class="btn btn-sm" onclick="viewProduct(${p.id})" style="margin-left:0.5rem">Details</button>
      </div>
    </div>
  `).join('') || '<p>No products found.</p>';

  // Pagination
  const totalPages = Math.ceil(data.total / 8);
  const pagEl = document.getElementById('pagination');
  pagEl.innerHTML = Array.from({ length: totalPages }, (_, i) =>
    `<button class="${i + 1 === page ? 'active' : ''}" onclick="loadProducts(${i + 1})">${i + 1}</button>`
  ).join('');
}

let searchTimeout;
function searchProducts(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadProducts(1, val), 300);
}

async function viewProduct(id) {
  const res = await fetch(`${API}/products/${id}`);
  const p = await res.json();
  document.getElementById('modal-body').innerHTML = `
    <h2>${p.name}</h2>
    ${p.image_url ? `<img src="${p.image_url}" style="width:100%;border-radius:8px;margin:1rem 0">` : ''}
    <p style="margin:1rem 0;color:#666">${p.description || 'No description'}</p>
    <p style="font-size:1.5rem;color:#e94560;font-weight:bold">₹${parseFloat(p.price).toFixed(2)}</p>
    <p style="color:#888;margin-bottom:1rem">Stock: ${p.stock}</p>
    <button class="btn btn-primary" onclick="addToCart(${p.id},'${p.name}',${p.price});closeModal()">Add to Cart</button>
  `;
  document.getElementById('product-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('product-modal').style.display = 'none';
}

// ─── CART ────────────────────────────────────────────────────────────────────
function addToCart(id, name, price) {
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.quantity++; }
  else { cart.push({ id, name, price, quantity: 1 }); }
  localStorage.setItem('cart', JSON.stringify(cart));
  document.getElementById('cart-count').textContent = cart.length;
  alert(`${name} added to cart!`);
}

function renderCart() {
  const el = document.getElementById('cart-items');
  if (cart.length === 0) {
    el.innerHTML = '<p>Your cart is empty.</p>';
    document.getElementById('cart-total').innerHTML = '';
    document.getElementById('checkout-btn').style.display = 'none';
    return;
  }

  let total = 0;
  el.innerHTML = cart.map((item, idx) => {
    total += item.price * item.quantity;
    return `
      <div class="cart-item">
        <div><strong>${item.name}</strong><br>₹${item.price} × ${item.quantity}</div>
        <div>
          ₹${(item.price * item.quantity).toFixed(2)}
          <button class="btn btn-danger btn-sm" style="margin-left:1rem" onclick="removeFromCart(${idx})">Remove</button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('cart-total').innerHTML = `Total: ₹${total.toFixed(2)}`;
  document.getElementById('checkout-btn').style.display = token ? 'block' : 'none';
  if (!token) {
    el.innerHTML += '<p style="color:#e94560;margin-top:1rem">Please <a href="#" onclick="showPage(\'login\')">login</a> to checkout.</p>';
  }
}

function removeFromCart(idx) {
  cart.splice(idx, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  document.getElementById('cart-count').textContent = cart.length;
  renderCart();
}

async function placeOrder() {
  if (!token) { showPage('login'); return; }
  const items = cart.map(i => ({ product_id: i.id, quantity: i.quantity }));

  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ items })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Order failed'); return; }

    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    document.getElementById('cart-count').textContent = 0;
    alert(`Order placed! Order ID: ${data.orderId}`);
    showPage('orders');
  } catch (e) {
    alert('Network error');
  }
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────
async function loadOrders() {
  if (!token) { showPage('login'); return; }
  const res = await fetch(`${API}/orders/my-orders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const orders = await res.json();
  const el = document.getElementById('orders-list');
  el.innerHTML = orders.length === 0 ? '<p>No orders yet.</p>' : orders.map(o => `
    <div class="order-card">
      <strong>Order #${o.id}</strong>
      <span class="order-status status-${o.status}">${o.status.toUpperCase()}</span>
      <p>Products: ${o.products || 'N/A'}</p>
      <p>Total: ₹${parseFloat(o.total).toFixed(2)}</p>
      <p style="color:#888;font-size:0.85rem">${new Date(o.created_at).toLocaleString()}</p>
    </div>
  `).join('');
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────
async function loadAdmin() {
  if (!currentUser || currentUser.role !== 'admin') { showPage('home'); return; }

  // Load stats
  const res = await fetch(`${API}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
  const stats = await res.json();
  document.getElementById('admin-stats').innerHTML = `
    <div class="stat-card"><div class="stat-number">${stats.totalUsers}</div><div class="stat-label">Total Users</div></div>
    <div class="stat-card"><div class="stat-number">${stats.totalOrders}</div><div class="stat-label">Total Orders</div></div>
    <div class="stat-card"><div class="stat-number">₹${parseFloat(stats.totalRevenue || 0).toFixed(0)}</div><div class="stat-label">Revenue</div></div>
    <div class="stat-card"><div class="stat-number">${stats.totalProducts}</div><div class="stat-label">Products</div></div>
  `;

  loadAdminProducts();
}

function adminTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('admin-products').style.display = tab === 'products' ? 'block' : 'none';
  document.getElementById('admin-users').style.display = tab === 'users' ? 'block' : 'none';
  document.getElementById('admin-orders').style.display = tab === 'orders' ? 'block' : 'none';

  if (tab === 'users') loadAdminUsers();
  if (tab === 'orders') loadAdminOrders();
  if (tab === 'products') loadAdminProducts();
}

async function loadAdminProducts() {
  const res = await fetch(`${API}/products?limit=100`);
  const data = await res.json();
  document.getElementById('admin-products-list').innerHTML = `
    <table><thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead>
    <tbody>${data.products.map(p => `
      <tr>
        <td>${p.id}</td><td>${p.name}</td><td>₹${p.price}</td><td>${p.stock}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Delete</button></td>
      </tr>`).join('')}
    </tbody></table>`;
}

async function addProduct() {
  const name = document.getElementById('prod-name').value;
  const price = document.getElementById('prod-price').value;
  const stock = document.getElementById('prod-stock').value;
  const description = document.getElementById('prod-desc').value;
  const imageFile = document.getElementById('prod-image').files[0];

  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('stock', stock);
  formData.append('description', description);
  if (imageFile) formData.append('image', imageFile);

  const res = await fetch(`${API}/products`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  const data = await res.json();
  if (!res.ok) { alert(data.error || 'Failed'); return; }
  alert('Product added!');
  loadAdminProducts();
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  await fetch(`${API}/products/${id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
  });
  loadAdminProducts();
}

async function loadAdminUsers() {
  const res = await fetch(`${API}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
  const users = await res.json();
  document.getElementById('admin-users-list').innerHTML = `
    <table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Action</th></tr></thead>
    <tbody>${users.map(u => `
      <tr>
        <td>${u.id}</td><td>${u.name}</td><td>${u.email}</td>
        <td>${u.role}</td><td>${new Date(u.created_at).toLocaleDateString()}</td>
        <td>${u.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})">Delete</button>` : '-'}</td>
      </tr>`).join('')}
    </tbody></table>`;
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  await fetch(`${API}/admin/users/${id}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
  });
  loadAdminUsers();
}

async function loadAdminOrders() {
  const res = await fetch(`${API}/orders/all`, { headers: { 'Authorization': `Bearer ${token}` } });
  const orders = await res.json();
  document.getElementById('admin-orders-list').innerHTML = `
    <table><thead><tr><th>ID</th><th>User</th><th>Products</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>${orders.map(o => `
      <tr>
        <td>#${o.id}</td><td>${o.user_name}</td><td>${o.products || 'N/A'}</td>
        <td>₹${parseFloat(o.total).toFixed(2)}</td>
        <td><span class="order-status status-${o.status}">${o.status}</span></td>
        <td>
          <select onchange="updateOrderStatus(${o.id}, this.value)" class="input" style="margin:0;padding:0.3rem">
            <option value="pending" ${o.status==='pending'?'selected':''}>Pending</option>
            <option value="paid" ${o.status==='paid'?'selected':''}>Paid</option>
            <option value="shipped" ${o.status==='shipped'?'selected':''}>Shipped</option>
          </select>
        </td>
      </tr>`).join('')}
    </tbody></table>`;
}

async function updateOrderStatus(id, status) {
  await fetch(`${API}/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status })
  });
}
