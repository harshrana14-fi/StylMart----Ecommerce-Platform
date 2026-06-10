let cartCount = 0;

async function loadCartCount() {
  if (!isLoggedIn()) { document.querySelectorAll('.cart-badge').forEach(b => b.remove()); return; }
  try {
    const items = await api.cart.get();
    cartCount = items.reduce((s, i) => s + i.quantity, 0);
    updateCartBadge();
  } catch { document.querySelectorAll('.cart-badge').forEach(b => b.remove()); }
}

function updateCartBadge() {
  document.querySelectorAll('.cart-badge').forEach(b => b.remove());
  if (cartCount > 0) {
    document.querySelectorAll('.cart-link').forEach(link => {
      const badge = document.createElement('span');
      badge.className = 'cart-badge';
      badge.textContent = cartCount > 99 ? '99+' : cartCount;
      link.appendChild(badge);
    });
  }
}

async function addToCart(productId, quantity = 1) {
  if (!requireAuth()) return;
  try {
    const items = await api.cart.add(productId, quantity);
    cartCount = items.reduce((s, i) => s + i.quantity, 0);
    updateCartBadge();
    showToast('Added to cart!', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

async function loadCartPage() {
  if (!requireAuth()) return;
  const container = document.getElementById('cart-container');
  container.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
  try {
    const items = await api.cart.get();
    renderCart(items);
  } catch (err) { container.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`; }
}

function renderCart(items) {
  const container = document.getElementById('cart-container');
  const sidebar = document.getElementById('cart-sidebar');

  if (!items || items.length === 0) {
    container.innerHTML = `<div class="empty-state"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg><h3>Your cart is empty</h3><p>Start shopping to add items to your cart.</p><a href="/pages/products.html" class="btn btn-primary">Browse Products</a></div>`;
    sidebar.innerHTML = ''; return;
  }

  cartCount = items.reduce((s, i) => s + i.quantity, 0);
  updateCartBadge();

  container.innerHTML = `<div class="cart-items">${items.map(item => `
    <div class="cart-item" data-pid="${item.productId}">
      <img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
      <div class="cart-item-info">
        <h3>${escapeHtml(item.name)}</h3>
        <div class="item-price">₹${item.price.toFixed(2)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="updateCartQty('${escapeHtml(item.productId)}', -1)" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
        <span class="qty-display">${item.quantity}</span>
        <button class="qty-btn" onclick="updateCartQty('${escapeHtml(item.productId)}', 1)" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
      </div>
      <div class="cart-item-total">₹${(item.price * item.quantity).toFixed(2)}</div>
      <button class="cart-item-remove" onclick="removeFromCart('${escapeHtml(item.productId)}')"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
    </div>`).join('')}</div>`;

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  sidebar.innerHTML = `
    <div class="cart-summary-card">
      <h3>Order Summary</h3>
      <div class="summary-row"><span>Subtotal (${items.length} items)</span><span>₹${subtotal.toFixed(2)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>Free</span></div>
      <div class="summary-row total"><span>Total</span><span>₹${subtotal.toFixed(2)}</span></div>
      <button class="btn btn-primary btn-lg" style="width:100%;margin-top:20px" onclick="proceedToCheckout()">Proceed to Checkout</button>
    </div>`;
}

async function updateCartQty(pid, delta) {
  const itemEl = document.querySelector(`.cart-item[data-pid="${pid}"]`);
  const qtyEl = itemEl?.querySelector('.qty-display');
  if (!qtyEl) return;
  const newQty = Math.max(1, parseInt(qtyEl.textContent) + delta);
  try {
    const items = await api.cart.update(pid, newQty);
    renderCart(items);
  } catch (err) { showToast(err.message, 'error'); }
}

async function removeFromCart(pid) {
  try {
    const items = await api.cart.remove(pid);
    renderCart(items);
    showToast('Item removed.', 'info');
  } catch (err) { showToast(err.message, 'error'); }
}

function proceedToCheckout() { window.location.href = '/pages/checkout.html'; }
