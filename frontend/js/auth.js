function isLoggedIn() { return !!localStorage.getItem('token'); }

function getCurrentUser() {
  const stored = localStorage.getItem('user');
  return stored ? JSON.parse(stored) : null;
}

function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function logout() {
  clearAuth();
  showToast('Signed out', 'info');
  updateNavbar();
  window.location.href = '/';
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = e.target.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('form-error');
  btn.disabled = true; btn.textContent = 'Signing in...'; errorEl.textContent = '';
  try {
    const data = await api.auth.login({ email, password });
    setAuth(data.token, data.user);
    showToast(`Welcome back, ${data.user.name}!`, 'success');
    updateNavbar();
    window.location.href = '/';
  } catch (err) { errorEl.textContent = err.message; }
  finally { btn.disabled = false; btn.textContent = 'Sign In'; }
}

async function handleSellerLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = e.target.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('form-error');
  btn.disabled = true; btn.textContent = 'Signing in...'; errorEl.textContent = '';
  try {
    const data = await api.sellerAuth.login({ email, password });
    setAuth(data.token, data.user);
    showToast(`Welcome, ${data.user.name}!`, 'success');
    updateNavbar();
    window.location.href = '/pages/seller-dashboard.html';
  } catch (err) { errorEl.textContent = err.message; }
  finally { btn.disabled = false; btn.textContent = 'Sign In'; }
}

async function handleSellerRegister(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm-password')?.value;
  const btn = e.target.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('form-error');
  if (password !== confirm) { errorEl.textContent = 'Passwords do not match.'; return; }
  btn.disabled = true; btn.textContent = 'Creating seller account...'; errorEl.textContent = '';
  try {
    const data = await api.sellerAuth.register({ name, email, password });
    setAuth(data.token, data.user);
    showToast('Seller account created!', 'success');
    updateNavbar();
    window.location.href = '/pages/seller-dashboard.html';
  } catch (err) { errorEl.textContent = err.message; }
  finally { btn.disabled = false; btn.textContent = 'Create Seller Account'; }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = e.target.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('form-error');
  btn.disabled = true; btn.textContent = 'Signing in...'; errorEl.textContent = '';
  try {
    const data = await api.admin.login({ email, password });
    setAuth(data.token, data.user);
    showToast(`Welcome, ${data.user.name}!`, 'success');
    updateNavbar();
    window.location.href = '/pages/admin-dashboard.html';
  } catch (err) { errorEl.textContent = err.message; }
  finally { btn.disabled = false; btn.textContent = 'Sign In'; }
}

async function handleAdminRegister(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm-password')?.value;
  const secret = document.getElementById('admin-secret').value.trim();
  const btn = e.target.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('form-error');
  if (password !== confirm) { errorEl.textContent = 'Passwords do not match.'; return; }
  if (!secret) { errorEl.textContent = 'Admin secret key is required.'; return; }
  btn.disabled = true; btn.textContent = 'Creating admin account...'; errorEl.textContent = '';
  try {
    const data = await api.admin.register({ name, email, password, secret });
    setAuth(data.token, data.user);
    showToast('Admin account created!', 'success');
    updateNavbar();
    window.location.href = '/pages/admin-dashboard.html';
  } catch (err) { errorEl.textContent = err.message; }
  finally { btn.disabled = false; btn.textContent = 'Create Admin Account'; }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm-password')?.value;
  const btn = e.target.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('form-error');
  if (password !== confirm) { errorEl.textContent = 'Passwords do not match.'; return; }
  btn.disabled = true; btn.textContent = 'Creating account...'; errorEl.textContent = '';
  try {
    const data = await api.auth.register({ name, email, password });
    setAuth(data.token, data.user);
    showToast('Account created!', 'success');
    updateNavbar();
    window.location.href = '/';
  } catch (err) { errorEl.textContent = err.message; }
  finally { btn.disabled = false; btn.textContent = 'Create Account'; }
}

async function checkAuth() {
  if (!isLoggedIn()) return null;
  try {
    const user = await api.auth.me();
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch { clearAuth(); return null; }
}

function updateNavbar() {
  const user = getCurrentUser();
  const container = document.getElementById('nav-right');
  if (!container) return;

  if (user) {
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    if (user.role === 'admin') {
      container.innerHTML = `
        <a href="/pages/cart.html" class="nav-icon-btn cart-link" title="Cart">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        </a>
        <div class="dropdown" id="user-dropdown">
          <button class="avatar-btn" onclick="toggleDropdown()" title="Account">${initial}</button>
          <div class="dropdown-menu" id="dropdown-menu">
            <div class="dropdown-label">${user.name}</div>
            <a href="/pages/admin-dashboard.html"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Admin Dashboard</a>
            <div class="divider"></div>
            <button onclick="logout()"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg> Sign Out</button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <button class="nav-icon-btn" onclick="toggleSearch()" title="Search">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </button>
        <a href="/pages/cart.html" class="nav-icon-btn cart-link" title="Cart">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        </a>
        <div class="dropdown" id="user-dropdown">
          <button class="avatar-btn" onclick="toggleDropdown()" title="Account">${initial}</button>
          <div class="dropdown-menu" id="dropdown-menu">
            <div class="dropdown-label">${user.name}</div>
            <a href="/pages/dashboard.html"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> My Dashboard</a>
            <a href="/pages/orders.html"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> My Orders</a>
            ${user.role === 'seller' ? `<a href="/pages/seller-dashboard.html"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg> Seller Dashboard</a>` : ''}
            <div class="divider"></div>
            <button onclick="logout()"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg> Sign Out</button>
          </div>
        </div>
      `;
    }
  } else {
    container.innerHTML = `
      <a href="/pages/login.html" class="btn btn-primary btn-sm">Sign In</a>
    `;
  }
}

function toggleDropdown() {
  document.getElementById('user-dropdown')?.classList.toggle('open');
}

function toggleSearch() {
  const el = document.getElementById('mobile-search');
  if (el) el.classList.toggle('open');
}

function toggleMobileMenu() {
  document.getElementById('nav-center')?.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const dd = document.getElementById('user-dropdown');
  if (dd && !dd.contains(e.target)) dd.classList.remove('open');
});

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  const open = btn.querySelector('.eye-open');
  const closed = btn.querySelector('.eye-closed');
  if (open) open.style.display = isPassword ? 'none' : '';
  if (closed) closed.style.display = isPassword ? '' : 'none';
}

function requireAuth() {
  if (!isLoggedIn()) { window.location.href = '/pages/login.html'; return false; }
  return true;
}
