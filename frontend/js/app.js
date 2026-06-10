function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function renderProducts(products, containerId = 'product-grid') {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!products || products.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>No products found</h3><p>Try adjusting your search or filters.</p></div>`;
    return;
  }
  container.innerHTML = products.map(p => {
    const sc = p.stock <= 0 ? 'out-of-stock' : p.stock <= 10 ? 'low-stock' : 'in-stock';
    const st = p.stock <= 0 ? 'Out of Stock' : p.stock <= 10 ? `Only ${p.stock} left` : 'In Stock';
    const tag = p.stock <= 5 ? '<span class="product-card-tag tag-sale">Low Stock</span>' : '';
    const allImgs = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
    const imgSrc = allImgs[0] || '';
    const pid = escapeHtml(p._id || p.id);
    return `<div class="product-card">
      <div class="product-card-image-wrap" onclick="window.location.href='/pages/product-detail.html?id=${pid}'">
        <img src="${imgSrc}" alt="${escapeHtml(p.name)}" class="product-card-image" loading="lazy" data-product-imgs="${escapeHtml(JSON.stringify(allImgs))}" data-current="0" onerror="this.src='https://via.placeholder.com/400?text=No+Image'">
        ${allImgs.length > 1 ? `
        <div class="card-img-dots">${allImgs.map((_, di) => `<span class="${di === 0 ? 'active' : ''}"></span>`).join('')}</div>` : ''}
        ${tag}
      </div>
      <div class="product-card-body" onclick="window.location.href='/pages/product-detail.html?id=${pid}'">
        <div class="product-card-category">${escapeHtml(p.category)}</div>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="product-desc">${escapeHtml(p.description)}</div>
        <div class="product-card-footer">
          <span class="product-price">₹${p.price.toFixed(2)}</span>
          <span class="product-stock ${sc}">${st}</span>
        </div>
      </div>
    </div>`;
  }).join('');
  initAutoSlides(container);
}

function slideCardImage(btn, dir) {
  const wrap = btn.closest('.product-card-image-wrap');
  const img = wrap.querySelector('.product-card-image');
  const dots = wrap.querySelectorAll('.card-img-dots span');
  let imgs;
  try { imgs = JSON.parse(img.dataset.productImgs || '[]'); } catch { imgs = []; }
  if (!imgs.length) return;
  let cur = parseInt(img.dataset.current) || 0;
  cur = (cur + dir + imgs.length) % imgs.length;
  img.dataset.current = cur;
  img.src = imgs[cur];
  dots.forEach((d, i) => d.classList.toggle('active', i === cur));
}

function initAutoSlides(container) {
  (container || document).querySelectorAll('.product-card-image-wrap').forEach(wrap => {
    if (wrap.dataset.autoSlideInit) return;
    const img = wrap.querySelector('.product-card-image');
    const dots = wrap.querySelectorAll('.card-img-dots span');
    if (!img || !dots.length) return;
    let imgs;
    try { imgs = JSON.parse(img.dataset.productImgs || '[]'); } catch { imgs = []; }
    if (imgs.length <= 1) return;
    wrap.dataset.autoSlideInit = '1';
    let cur = 0;
    let interval = setInterval(() => {
      cur = (cur + 1) % imgs.length;
      img.dataset.current = cur;
      img.src = imgs[cur];
      dots.forEach((d, i) => d.classList.toggle('active', i === cur));
    }, 3000);
    wrap.addEventListener('mouseenter', () => { clearInterval(interval); interval = null; });
    wrap.addEventListener('mouseleave', () => {
      if (!interval) interval = setInterval(() => {
        cur = (cur + 1) % imgs.length;
        img.dataset.current = cur;
        img.src = imgs[cur];
        dots.forEach((d, i) => d.classList.toggle('active', i === cur));
      }, 3000);
    });
  });
}

async function loadProducts(searchQuery, category) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
  try {
    const products = await api.products.list(searchQuery, category);
    renderProducts(products);
  } catch (err) { grid.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`; }
}

async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { document.getElementById('detail-container').innerHTML = '<div class="empty-state"><h3>Product not found</h3></div>'; return; }
  const container = document.getElementById('detail-container');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
  try {
    const product = await api.products.get(id);
    renderProductDetail(product);
  } catch (err) { container.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`; }
}

function renderProductDetail(product) {
  const container = document.getElementById('detail-container');
  const sc = product.stock <= 0 ? 'out-of-stock' : product.stock <= 10 ? 'low-stock' : 'in-stock';
  const st = product.stock <= 0 ? 'Out of Stock' : product.stock <= 10 ? `Only ${product.stock} left` : 'In Stock';
  const imgs = (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : []);
  container.innerHTML = `
    <div class="product-detail-grid">
      <div>
        <div class="product-detail-image-wrap">
          <img id="detail-main-img" src="${imgs[0] || ''}" alt="${escapeHtml(product.name)}" class="product-detail-image" onerror="this.src='https://via.placeholder.com/600?text=No+Image'">
        </div>
        ${imgs.length > 1 ? `<div style="display:flex;gap:8px;margin-top:12px" id="detail-thumbs">${imgs.map((src, i) => `
          <div data-index="${i}" style="width:72px;height:72px;border:2px solid ${i === 0 ? 'var(--black)' : 'var(--gray-300)'};cursor:pointer;overflow:hidden" onclick="document.getElementById('detail-main-img').src=this.querySelector('img').src;document.querySelectorAll('#detail-thumbs > div').forEach(d=>d.style.borderColor='var(--gray-300)');this.style.borderColor='var(--black)'">
            <img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.src='https://via.placeholder.com/72'">
          </div>`).join('')}</div>` : ''}
      </div>
      <div class="product-detail-info">
        <div class="product-detail-category">${escapeHtml(product.category)}</div>
        <h1>${escapeHtml(product.name)}</h1>
        <div class="product-detail-price">₹${product.price.toFixed(2)}</div>
        <div class="product-detail-desc">${escapeHtml(product.description)}</div>
        <div class="product-meta">
          <div class="product-meta-item"><span class="product-stock ${sc}">${st}</span></div>
          <div class="product-meta-item"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg> Free shipping</div>
          <div class="product-meta-item"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> 30-day returns</div>
        </div>
        <div class="product-detail-actions">
          <button class="btn btn-primary btn-lg" onclick="addToCart('${escapeHtml(product._id || product.id)}')" ${product.stock <= 0 ? 'disabled' : ''}>${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart — ₹' + product.price.toFixed(2)}</button>
          <a href="/pages/products.html" class="btn btn-outline btn-lg">Continue Shopping</a>
        </div>
      </div>
    </div>`;
}

async function loadCheckoutPage() {
  if (!requireAuth()) return;
  const container = document.getElementById('checkout-container');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
  try {
    const items = await api.cart.get();
    if (!items || items.length === 0) {
      container.innerHTML = '<div class="empty-state"><h3>Your cart is empty</h3><p>Add some products before checking out.</p><a href="/pages/products.html" class="btn btn-primary">Browse Products</a></div>';
      document.getElementById('checkout-sidebar').innerHTML = ''; return;
    }
    renderCheckout(items);
  } catch (err) { container.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`; }
}

function renderCheckout(items) {
  const user = getCurrentUser();
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const platformFee = subtotal * 0.05;
  const total = subtotal + platformFee;
  document.getElementById('checkout-container').innerHTML = `
    <div class="checkout-form-card">
      <h2 style="margin-bottom:24px;font-weight:700">Shipping Information</h2>
      <form id="checkout-form" onsubmit="placeOrder(event)">
        <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="full-name" value="${escapeHtml(user?.name || '')}" required></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="email" type="email" value="${escapeHtml(user?.email || '')}" required></div>
        <div class="form-group"><label class="form-label">Shipping Address</label><input class="form-input" id="address" placeholder="123 Main St, City, State, ZIP" required></div>
        <div class="form-group"><label class="form-label">Phone Number</label><input class="form-input" id="phone" type="tel" placeholder="+1 (555) 000-0000" required></div>
        <div class="form-group"><label class="form-label">Delivery Instructions</label><textarea class="form-textarea" id="delivery-note" placeholder="Optional: gate code, landmark, etc."></textarea></div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%;margin-top:8px">Place Order — ₹${total.toFixed(2)}</button>
      </form>
    </div>`;
  document.getElementById('checkout-sidebar').innerHTML = `
    <div class="checkout-summary-card">
      <h3 style="margin-bottom:16px;font-weight:700">Order Summary</h3>
      ${items.map(i => `<div class="checkout-item"><span>${escapeHtml(i.name)} × ${i.quantity}</span><span>₹${(i.price * i.quantity).toFixed(2)}</span></div>`).join('')}
      <div class="checkout-item"><span>Shipping</span><span>Free</span></div>
      <div class="checkout-item"><span>Platform Fee (5%)</span><span>₹${platformFee.toFixed(2)}</span></div>
      <div class="checkout-total"><span>Total</span><span>₹${total.toFixed(2)}</span></div>
    </div>`;
  setTimeout(initMapAutocomplete, 100);
}

async function placeOrder(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const address = document.getElementById('address').value.trim();
  const phone = document.getElementById('phone').value.trim();
  if (!address || !phone) { showToast('Please fill in address and phone.', 'error'); return; }
  btn.disabled = true; btn.textContent = 'Processing...';
  try {
    const result = await api.orders.place({ address, phone });
    showToast('Order placed!', 'success');
    window.location.href = `/pages/order-confirmation.html?id=${result.id}`;
  } catch (err) { showToast(err.message, 'error'); btn.disabled = false; btn.textContent = 'Place Order'; }
}

async function loadOrderConfirmation() {
  if (!requireAuth()) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id || id === 'undefined' || id === 'null') { document.getElementById('confirmation-container').innerHTML = '<div class="empty-state"><h3>Order not found</h3></div>'; return; }
  const container = document.getElementById('confirmation-container');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
  try {
    const order = await api.orders.get(id);
    const subtotal = order.subtotal || order.products.reduce((s, p) => s + p.price * p.quantity, 0);
    const platformFee = order.platformFee || (subtotal * 0.05);
    container.innerHTML = `<div class="confirmation-card">
      <div class="confirmation-icon"><svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div>
      <h1>Order Confirmed!</h1>
      <p>Thank you for your purchase. Your order has been placed.</p>
      <div class="order-number-badge">Order #${order._id || order.id}</div>
      <div class="order-fee-breakdown">
        <div class="fee-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
        <div class="fee-row"><span>Platform Fee (5%)</span><span>₹${platformFee.toFixed(2)}</span></div>
        <div class="fee-row total"><span>Total Charged</span><span>₹${order.totalAmount.toFixed(2)}</span></div>
      </div>
      ${order.address ? `<div class="order-shipping-address"><strong>Shipping to:</strong><br>${escapeHtml(order.address)}</div>` : ''}
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:20px">
        <a href="/pages/order-tracking.html?id=${order._id || order.id}" class="btn btn-primary">Track Order</a>
        <a href="/pages/orders.html" class="btn btn-outline">All Orders</a>
        <a href="/pages/products.html" class="btn btn-outline">Shop More</a>
      </div>
    </div>`;
  } catch (err) { container.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`; }
}

async function loadOrdersPage() {
  if (!requireAuth()) return;
  const container = document.getElementById('orders-container');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
  try {
    const orders = await api.orders.list();
    renderOrders(orders);
  } catch (err) { container.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`; }
}

function renderOrders(orders) {
  const container = document.getElementById('orders-container');
  if (!orders || orders.length === 0) {
    container.innerHTML = `<div class="empty-state"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><h3>No orders yet</h3><p>Your order history will appear here.</p><a href="/pages/products.html" class="btn btn-primary">Start Shopping</a></div>`; return;
  }
  container.innerHTML = orders.map(o => {
    const subtotal = o.subtotal || o.products.reduce((s, p) => s + p.price * p.quantity, 0);
    const platformFee = o.platformFee || (subtotal * 0.05);
    return `<div class="order-card">
      <div class="order-header">
        <div><span class="order-id">Order #${o._id || o.id}</span><span style="color:var(--text-muted);font-size:0.85rem;margin-left:12px">${new Date(o.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</span></div>
        <span class="order-status ${o.status}">${o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span>
      </div>
      <div class="order-products">${o.products.map(p => `<div class="order-product"><span>${escapeHtml(p.name)} × ${p.quantity}</span><span>₹${(p.price * p.quantity).toFixed(2)}</span></div>`).join('')}</div>
      <div class="order-fee-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
      <div class="order-fee-row"><span>Platform Fee (5%)</span><span>₹${platformFee.toFixed(2)}</span></div>
      <div class="order-total">Total: ₹${o.totalAmount.toFixed(2)}</div>
      ${o.address ? `<div class="order-ship-address">${escapeHtml(o.address)}</div>` : ''}
      <div style="margin-top:12px"><a href="/pages/order-tracking.html?id=${o._id || o.id}" class="btn btn-sm btn-outline">Track Order</a></div>
    </div>`;
  }).join('');
}

async function loadDashboard() {
  if (!requireAuth()) return;
  const user = getCurrentUser();
  if (!user) return;
  document.getElementById('dash-name').textContent = user.name;
  document.getElementById('dash-name-display').textContent = user.name;
  document.getElementById('dash-email').textContent = user.email;
  document.getElementById('dash-role').textContent = user.role || 'Customer';
  document.getElementById('dash-role-display').textContent = user.role || 'Customer';
  document.getElementById('dash-joined').textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
  document.getElementById('dash-joined-display').textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

  const sellerBtn = document.getElementById('dash-seller-btn');
  if (sellerBtn) sellerBtn.style.display = user.role === 'seller' ? 'inline-flex' : 'none';

  try {
    const orders = await api.orders.list();
    document.getElementById('dash-order-count').textContent = orders.length;
  } catch { document.getElementById('dash-order-count').textContent = '—'; }
}

function switchDashTab(tab) {
  document.querySelectorAll('.dash-nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelector(`.dash-nav-item[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`dash-${tab}`)?.classList.add('active');
}

async function updateProfile(e) {
  e.preventDefault();
  const name = document.getElementById('edit-name').value.trim();
  if (!name) return;
  try {
    await api.auth.updateProfile({ name });
    const user = getCurrentUser();
    user.name = name;
    localStorage.setItem('user', JSON.stringify(user));
    showToast('Profile updated!', 'success');
    document.getElementById('dash-name').textContent = name;
    document.getElementById('dash-name-display').textContent = name;
  } catch (err) { showToast(err.message, 'error'); }
}

/* ========== ADMIN DASHBOARD ========== */
async function loadAdminDashboard() {
  if (!requireAuth()) return;
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    document.querySelector('.dashboard-content').innerHTML = '<div class="empty-state"><h3>Admin Access Only</h3><p>You need an admin account to access this page.</p></div>';
    return;
  }
  try {
    const [users, orders, products] = await Promise.all([
      api.admin.users(),
      api.admin.orders(),
      api.admin.products()
    ]);

    document.getElementById('admin-user-count').textContent = users.length;
    document.getElementById('admin-order-count').textContent = orders.length;
    document.getElementById('admin-product-count').textContent = products.length;
    const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    document.getElementById('admin-revenue').textContent = `₹${revenue.toFixed(2)}`;

    renderAdminUsers(users);
    renderAdminOrders(orders);
    renderAdminProducts(products);
  } catch (err) {
    document.querySelector('.dashboard-content').innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function renderAdminUsers(users) {
  const container = document.getElementById('admin-users-list');
  container.innerHTML = `
    <div style="overflow-x:auto">
      <table class="admin-table">
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
        <tbody>${users.map(u => `
          <tr>
            <td>#${u.id}</td>
            <td>${escapeHtml(u.name)}</td>
            <td>${escapeHtml(u.email)}</td>
            <td><span class="order-status ${u.role}">${u.role}</span></td>
            <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderAdminOrders(orders) {
  const container = document.getElementById('admin-orders-list');
  if (!orders.length) {
    container.innerHTML = '<div class="empty-state"><p>No orders yet.</p></div>'; return;
  }
  container.innerHTML = orders.map(o => `
    <div class="admin-order-card">
      <div class="order-header">
        <div><span class="order-id">Order #${o._id || o.id}</span><span style="color:var(--text-muted);font-size:0.85rem;margin-left:12px">${new Date(o.createdAt).toLocaleDateString()}</span></div>
        <span class="order-status ${o.status}">${o.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
      </div>
      <div class="order-products">${o.products.map(p => `<div class="order-product"><span>${escapeHtml(p.name)} × ${p.quantity}</span><span>₹${(p.price * p.quantity).toFixed(2)}</span></div>`).join('')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:2px solid var(--black)">
        <span style="font-weight:700">₹${o.totalAmount.toFixed(2)}</span>
        <div style="display:flex;gap:8px;align-items:center">
          <select class="form-input" style="width:auto;padding:6px 10px;font-size:0.8rem;margin-bottom:0" onchange="updateAdminOrderStatus('${escapeHtml(o._id || o.id)}', this.value)">
            <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="out_for_delivery" ${o.status === 'out_for_delivery' ? 'selected' : ''}>Out for Delivery</option>
            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
      </div>
    </div>`).join('');
}

async function updateAdminOrderStatus(id, status) {
  try {
    await api.admin.updateOrderStatus(id, status);
    showToast(`Order #${id} updated to ${status.replace(/_/g, ' ')}`, 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

function renderAdminProducts(products) {
  const container = document.getElementById('admin-products-list');
  if (!products.length) {
    container.innerHTML = '<div class="empty-state"><p>No products yet.</p></div>'; return;
  }
  container.innerHTML = products.map(p => {
    const imgSrc = (p.images && p.images.length > 0) ? p.images[0] : (p.image || '');
    return `
    <div class="admin-product-card">
      <img src="${imgSrc}" alt="" onerror="this.src='https://via.placeholder.com/60'">
      <div class="apc-info">
        <h4>${escapeHtml(p.name)}</h4>
        <p>₹${p.price.toFixed(2)} · Stock: ${p.stock} · ${escapeHtml(p.category)}</p>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteAdminProduct(${p.id})">Delete</button>
    </div>`;
  }).join('');
}

async function deleteAdminProduct(id) {
  if (!confirm('Delete this product permanently?')) return;
  try {
    await api.admin.deleteProduct(id);
    showToast('Product deleted.', 'info');
    loadAdminDashboard();
  } catch (err) { showToast(err.message, 'error'); }
}

let sellerEditId = null;

async function loadSellerDashboard() {
  const container = document.getElementById('seller-container');
  try {
    if (!requireAuth()) return;
    const user = getCurrentUser();
    if (!user || user.role !== 'seller') {
      if (container) container.innerHTML = '<div class="empty-state"><h3>Seller Access Only</h3><p>You need a seller account to access this page.</p></div>';
      return;
    }
    if (!container) return;
    container.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
    const products = await api.seller.products();
    const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
    const totalValue = products.reduce((s, p) => s + p.price * (p.stock || 0), 0);

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px;margin-bottom:32px">
        <div style="border:3px solid var(--black);padding:24px;text-align:center;background:var(--white)">
          <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px;color:var(--text-muted)">Total Products</div>
          <div style="font-size:2.4rem;font-weight:900">${products.length}</div>
        </div>
        <div style="border:3px solid var(--black);padding:24px;text-align:center;background:var(--white)">
          <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px;color:var(--text-muted)">Total Stock</div>
          <div style="font-size:2.4rem;font-weight:900">${totalStock}</div>
        </div>
        <div style="border:3px solid var(--black);padding:24px;text-align:center;background:var(--white)">
          <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px;color:var(--text-muted)">Inventory Value</div>
          <div style="font-size:1.6rem;font-weight:900">₹${totalValue.toFixed(2)}</div>
        </div>
      </div>

      <div class="seller-tabs-wrap">
        <button class="seller-tab-btn active" data-tab="overview" onclick="switchSellerTab('overview')">Overview</button>
        <button class="seller-tab-btn" data-tab="add" onclick="switchSellerTab('add')">${sellerEditId ? 'Edit Product' : 'Add Product'}</button>
        <button class="seller-tab-btn" data-tab="products" onclick="switchSellerTab('products')">My Products (${products.length})</button>
      </div>

      <div id="seller-tab-overview" class="seller-tab-content" style="display:block">
        <div style="padding:24px;border:3px solid var(--black);background:var(--gray-100)">
          <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:12px">Welcome, ${escapeHtml(user.name)}!</h3>
          <p style="color:var(--text-muted);font-size:0.9rem;line-height:1.7">You have <strong style="color:var(--black)">${products.length} products</strong> listed with a total of <strong style="color:var(--black)">${totalStock} units</strong> in stock. Use the tabs above to add new products or manage your existing listings.</p>
        </div>
      </div>

      <div id="seller-tab-add" class="seller-tab-content" style="display:none">
        <form class="seller-product-form" id="seller-product-form" onsubmit="sellerEditId ? updateSellerProduct(event) : addSellerProduct(event)">
          <div class="form-group full"><label class="form-label">Product Name</label><input class="form-input" id="sp-name" required></div>
          <div class="form-group full"><label class="form-label">Description</label><textarea class="form-textarea" id="sp-desc" required></textarea></div>
          <div class="form-group"><label class="form-label">Price (₹)</label><input class="form-input" id="sp-price" type="number" step="0.01" min="0" required></div>
          <div class="form-group"><label class="form-label">Stock</label><input class="form-input" id="sp-stock" type="number" min="0" value="10"></div>
          <div class="form-group"><label class="form-label">Category</label><select class="form-select" id="sp-category"><option value="men">Men</option><option value="women">Women</option><option value="accessories">Accessories</option><option value="electronics">Electronics</option><option value="shoes">Shoes</option><option value="sports">Sports & Fitness</option></select></div>
          <div class="form-group"><label class="form-label">Product Images</label><input class="form-input" id="sp-image" type="file" accept="image/*" multiple><div id="sp-image-previews" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"></div></div>
          <div class="form-group full" style="display:flex;gap:8px;margin-top:4px">
            <button type="submit" class="btn btn-primary">${sellerEditId ? 'Update Product' : 'Add Product'}</button>
            ${sellerEditId ? '<button type="button" class="btn btn-outline" onclick="cancelEdit()">Cancel</button>' : ''}
          </div>
        </form>
      </div>

      <div id="seller-tab-products" class="seller-tab-content" style="display:none">
        ${products.length === 0 ? '<div class="empty-state" style="padding:40px 24px"><p>No products yet. Go to the Add Product tab to list your first product!</p></div>' : products.map(p => {
          const imgs = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
          return `
          <div class="seller-product-card" data-description="${escapeHtml(p.description || '')}">
            <div class="spc-images" style="display:flex;gap:4px;flex-shrink:0">
              ${imgs.slice(0, 4).map(src => `<img src="${src}" alt="" onerror="this.src='https://via.placeholder.com/120'" style="width:54px;height:54px;border:2px solid var(--black);object-fit:cover">`).join('')}
              ${imgs.length > 4 ? `<div style="width:54px;height:54px;border:2px solid var(--black);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;background:var(--gray-100)">+${imgs.length - 4}</div>` : ''}
            </div>
            <div class="spc-info"><h4>${escapeHtml(p.name)}</h4><p>₹${p.price.toFixed(2)} · Stock: ${p.stock} · ${escapeHtml(p.category)}</p></div>
            <div style="display:flex;gap:6px">
              <button class="btn btn-outline btn-sm" onclick="editSellerProduct('${p._id || p.id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteSellerProduct('${p._id || p.id}')">Delete</button>
            </div>
          </div>`;}).join('')}
      </div>`;

    const fileInput = document.getElementById('sp-image');
    const previews = document.getElementById('sp-image-previews');
    if (fileInput && previews) {
      fileInput.addEventListener('change', () => {
        previews.innerHTML = '';
        Array.from(fileInput.files).forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'width:80px;height:80px;border:2px solid var(--black);overflow:hidden';
            const img = document.createElement('img');
            img.style.cssText = 'width:100%;height:100%;object-fit:cover';
            img.src = e.target.result;
            wrap.appendChild(img);
            previews.appendChild(wrap);
          };
          reader.readAsDataURL(file);
        });
      });
    }

    if (sellerEditId) switchSellerTab('add');
  } catch (err) {
    console.error("loadSellerDashboard error caught:", err);
    if (container) container.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function switchSellerTab(tab) {
  document.querySelectorAll('.seller-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.seller-tab-content').forEach(el => {
    el.style.display = el.id === 'seller-tab-' + tab ? 'block' : 'none';
  });
}

function editSellerProduct(id) {
  const card = document.querySelector(`.seller-product-card .btn-outline[onclick*="'${id}'"]`)?.closest('.seller-product-card');
  if (!card) return;
  sellerEditId = id;
  document.getElementById('sp-name').value = card.querySelector('h4').textContent;
  const info = card.querySelector('.spc-info p').textContent;
  const price = parseFloat(info.match(/₹([\d.]+)/)?.[1] || 0);
  const stock = parseInt(info.match(/Stock:\s*(\d+)/)?.[1] || 0);
  const cat = info.match(/·\s*(\w+)/)?.[1] || '';
  document.getElementById('sp-price').value = price;
  document.getElementById('sp-stock').value = stock;
  if (cat) document.getElementById('sp-category').value = cat;
  document.getElementById('sp-desc').value = card.dataset.description || '';
  document.getElementById('sp-image').value = '';
  const previews = document.getElementById('sp-image-previews');
  if (previews) {
    previews.innerHTML = '';
    const imgs = card.querySelectorAll('.spc-images img, .seller-product-card > img');
    imgs.forEach(img => {
      if (img.src) {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'width:80px;height:80px;border:2px solid var(--black);overflow:hidden';
        const p = document.createElement('img');
        p.style.cssText = 'width:100%;height:100%;object-fit:cover';
        p.src = img.src;
        wrap.appendChild(p);
        previews.appendChild(wrap);
      }
    });
  }
  const addBtn = document.querySelector('.seller-tab-btn[data-tab="add"]');
  if (addBtn) addBtn.textContent = 'Edit Product';
  const submitBtn = document.querySelector('#seller-product-form button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Update Product';
  let cancelBtn = document.querySelector('#seller-product-form .btn-outline[onclick*="cancelEdit"]');
  if (!cancelBtn) {
    const form = document.getElementById('seller-product-form');
    if (form) {
      cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-outline';
      cancelBtn.setAttribute('onclick', 'cancelEdit()');
      cancelBtn.textContent = 'Cancel';
      form.appendChild(cancelBtn);
    }
  }
  switchSellerTab('add');
}

function cancelEdit() {
  sellerEditId = null;
  document.getElementById('seller-product-form').reset();
  document.getElementById('sp-image-previews').innerHTML = '';
  const addBtn = document.querySelector('.seller-tab-btn[data-tab="add"]');
  if (addBtn) addBtn.textContent = 'Add Product';
  const submitBtn = document.querySelector('#seller-product-form button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Add Product';
  const cancelBtn = document.querySelector('#seller-product-form .btn-outline[onclick*="cancelEdit"]');
  if (cancelBtn) cancelBtn.remove();
  switchSellerTab('overview');
}

async function addSellerProduct(e) {
  e.preventDefault();
  const name = document.getElementById('sp-name').value.trim();
  const description = document.getElementById('sp-desc').value.trim();
  const price = document.getElementById('sp-price').value;
  if (!name || !description || !price) { showToast('Please fill all required fields.', 'error'); return; }
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Adding...';
  let images = [];
  const fileInput = document.getElementById('sp-image');
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    try {
      const uploadRes = await api.uploadMultiple(fileInput.files);
      images = uploadRes.urls;
    } catch (uploadErr) { showToast('Image upload failed, product added without images.', 'info'); }
  }
  try {
    await api.seller.create({
      name, description, price,
      stock: document.getElementById('sp-stock').value || 0,
      category: document.getElementById('sp-category').value,
      images
    });
    showToast('Product listed!', 'success');
    await loadSellerDashboard();
    switchSellerTab('products');
  } catch (err) { showToast(err.message, 'error'); btn.disabled = false; btn.textContent = 'Add Product'; }
}

async function updateSellerProduct(e) {
  e.preventDefault();
  if (!sellerEditId) return;
  const name = document.getElementById('sp-name').value.trim();
  const description = document.getElementById('sp-desc').value.trim();
  const price = document.getElementById('sp-price').value;
  if (!name || !description || !price) { showToast('Please fill all required fields.', 'error'); return; }
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Updating...';
  let images;
  const fileInput = document.getElementById('sp-image');
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    try {
      const uploadRes = await api.uploadMultiple(fileInput.files);
      images = uploadRes.urls;
    } catch (uploadErr) { showToast('Image upload failed, product updated without new images.', 'info'); }
  }
  try {
    await api.seller.update(sellerEditId, {
      name, description, price,
      stock: document.getElementById('sp-stock').value || 0,
      category: document.getElementById('sp-category').value,
      ...(images ? { images } : {})
    });
    showToast('Product updated!', 'success');
    sellerEditId = null;
    await loadSellerDashboard();
    switchSellerTab('products');
  } catch (err) { showToast(err.message, 'error'); btn.disabled = false; btn.textContent = 'Update Product'; }
}

async function deleteSellerProduct(id) {
  if (!confirm('Delete this product?')) return;
  try {
    await api.seller.delete(id);
    showToast('Product deleted.', 'info');
    await loadSellerDashboard();
    switchSellerTab('products');
  } catch (err) { showToast(err.message, 'error'); }
}

/* ========== CAROUSEL ========== */
let slideIndex = 0;
let slideInterval;

function showSlide(index) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  if (!slides.length) return;
  slideIndex = (index + slides.length) % slides.length;
  slides.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));
  slides[slideIndex].classList.add('active');
  dots[slideIndex].classList.add('active');
}

function nextSlide() { showSlide(slideIndex + 1); resetSlideInterval(); }
function prevSlide() { showSlide(slideIndex - 1); resetSlideInterval(); }
function goToSlide(i) { showSlide(i); resetSlideInterval(); }

function resetSlideInterval() {
  clearInterval(slideInterval);
  slideInterval = setInterval(() => showSlide(slideIndex + 1), 5000);
}

function initCarousel() {
  if (!document.getElementById('hero-carousel')) return;
  showSlide(0);
  slideInterval = setInterval(() => showSlide(slideIndex + 1), 5000);
}

async function loadHomePage() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
  try {
    const products = await api.products.list();
    renderProducts(products.slice(0, 8), 'featured-grid');
  } catch (err) { grid.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`; }
}

async function loadCategoryCounts() {
  try {
    const cats = await api.products.categories();
    const icons = { men: 'M', women: 'W', accessories: 'A', electronics: 'E', shoes: 'S', sports: 'F' };
    const names = { men: "Men", women: "Women", accessories: 'Accessories', electronics: 'Electronics', shoes: 'Shoes', sports: 'Sports' };
    const tiles = document.getElementById('category-tiles');
    if (!tiles) return;
    tiles.innerHTML = cats.map(c => `
      <div class="category-tile" onclick="window.location.href='/pages/products.html?category=${c.category}'">
        <div class="tile-icon">${icons[c.category] || '●'}</div>
        <h4>${names[c.category] || c.category}</h4>
        <p>${c.count} items</p>
      </div>`).join('');
  } catch {}
}

function setupSearch() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  if (!searchForm || !searchInput) return;
  let timeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const q = searchInput.value.trim();
      const cat = new URLSearchParams(window.location.search).get('category') || '';
      const url = new URL(window.location);
      if (q) url.searchParams.set('search', q); else url.searchParams.delete('search');
      window.history.replaceState({}, '', url);
      loadProducts(q, cat);
    }, 300);
  });
  searchForm.addEventListener('submit', (e) => { e.preventDefault(); loadProducts(searchInput.value.trim(), new URLSearchParams(window.location.search).get('category') || ''); });
}

function setupCategoryNav() {
  const catLinks = document.querySelectorAll('.cat-link');
  catLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = link.dataset.category;
      window.location.href = `/pages/products.html?category=${cat}`;
    });
  });
}

/* ========== ORDER TRACKING ========== */
async function loadTrackingPage() {
  if (!requireAuth()) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id || id === 'undefined' || id === 'null') { document.getElementById('tracking-container').innerHTML = '<div class="empty-state"><h3>Order not found</h3></div>'; return; }
  const container = document.getElementById('tracking-container');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
  try {
    const order = await api.orders.get(id);
    renderTrackingPage(order);
  } catch (err) { container.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`; }
}

function renderTrackingPage(order) {
  const container = document.getElementById('tracking-container');
  const updates = order.trackingUpdates || [];
  const subtotal = order.subtotal || order.products.reduce((s, p) => s + p.price * p.quantity, 0);
  const platformFee = order.platformFee || (subtotal * 0.05);

  container.innerHTML = `
    <div class="tracking-grid">
      <div class="tracking-main">
        <div class="tracking-card">
          <div class="tracking-header">
            <h2>Order #${order._id || order.id}</h2>
            <span class="order-status ${order.status}">${order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
          </div>
          <p style="color:var(--text-muted);font-size:0.85rem">Placed on ${new Date(order.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
        </div>

        <div class="tracking-card">
          <h3 style="margin-bottom:20px;font-weight:700">Tracking Timeline</h3>
          <div class="tracking-timeline">
            ${updates.length === 0 ? '<p style="color:var(--text-muted)">No tracking updates yet.</p>' :
              updates.map((u, i) => `
                <div class="timeline-item ${i === 0 ? 'latest' : ''}">
                  <div class="timeline-dot ${i === 0 ? 'active' : ''}"></div>
                  <div class="timeline-content">
                    <div class="timeline-status">${u.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                    <div class="timeline-note">${escapeHtml(u.note)}</div>
                    <div class="timeline-time">${new Date(u.timestamp).toLocaleString()}</div>
                  </div>
                </div>`).join('')}
          </div>
        </div>

        <div class="tracking-card">
          <h3 style="margin-bottom:16px;font-weight:700">Order Items</h3>
          ${order.products.map(p => `
            <div class="tracking-product">
              <span>${escapeHtml(p.name)} × ${p.quantity}</span>
              <span>₹${(p.price * p.quantity).toFixed(2)}</span>
            </div>`).join('')}
          <div class="tracking-fee-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
          <div class="tracking-fee-row"><span>Platform Fee (5%)</span><span>₹${platformFee.toFixed(2)}</span></div>
          <div class="tracking-total">Total: ₹${order.totalAmount.toFixed(2)}</div>
        </div>
      </div>

      <div class="tracking-sidebar">
        ${order.address ? `
          <div class="tracking-card">
            <h3 style="margin-bottom:12px;font-weight:700">Shipping Address</h3>
            <p style="font-size:0.9rem;line-height:1.6">${escapeHtml(order.address)}</p>
            <div id="tracking-map" class="tracking-map"></div>
          </div>` : ''}
        ${order.phone ? `
          <div class="tracking-card">
            <h3 style="margin-bottom:12px;font-weight:700">Contact</h3>
            <p style="font-size:0.9rem">${escapeHtml(order.phone)}</p>
          </div>` : ''}
        <div class="tracking-card">
          <a href="/pages/orders.html" class="btn btn-outline" style="width:100%">Back to Orders</a>
        </div>
      </div>
    </div>`;

  if (order.address) {
    setTimeout(() => initTrackingMap(order.address), 300);
  }
}

/* ========== GOOGLE MAPS ========== */
function initMapAutocomplete() {
  const input = document.getElementById('address');
  if (!input || typeof google === 'undefined' || !google.maps || !google.maps.places) return;
  new google.maps.places.Autocomplete(input, { types: ['address'] });
}

function initTrackingMap(address) {
  const mapEl = document.getElementById('tracking-map');
  if (!mapEl || typeof google === 'undefined' || !google.maps) return;
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address }, (results, status) => {
    if (status === 'OK' && results[0]) {
      const map = new google.maps.Map(mapEl, {
        center: results[0].geometry.location,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [{ featureType: 'all', stylers: [{ saturation: -100 }, { contrast: 50 }] }]
      });
      new google.maps.Marker({ map, position: results[0].geometry.location });
    } else {
      mapEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">Map unavailable for this address.</p>';
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  updateNavbar();
  await loadCartCount();
  const path = window.location.pathname;

  if (path === '/' || path === '/index.html') {
    initCarousel();
    loadHomePage();
    loadCategoryCounts();
  } else if (path.includes('products.html')) {
    setupSearch();
    const params = new URLSearchParams(window.location.search);
    loadProducts(params.get('search') || '', params.get('category') || '');
  } else if (path.includes('product-detail.html')) {
    loadProductDetail();
  } else if (path.includes('cart.html')) {
    loadCartPage();
  } else if (path.includes('checkout.html')) {
    loadCheckoutPage();
  } else if (path.includes('order-confirmation.html')) {
    loadOrderConfirmation();
  } else if (path.includes('order-tracking.html')) {
    loadTrackingPage();
  } else if (path.includes('orders.html')) {
    loadOrdersPage();
  } else if (path.includes('admin-dashboard.html')) {
    loadAdminDashboard();
  } else if (path.includes('seller-dashboard.html')) {
    loadSellerDashboard();
  } else if (path.includes('dashboard.html')) {
    loadDashboard();
  } else if (path.includes('login.html') || path.includes('register.html') || path.includes('admin-login.html') || path.includes('admin-register.html') || path.includes('seller-login.html') || path.includes('seller-register.html')) {
    if (isLoggedIn()) window.location.href = '/';
  }
  setupCategoryNav();
});
