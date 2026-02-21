'use strict';

/* ═══════════════════════════════════════════════════════════════════
   QuickBite – app.js
   Cart state, drawer, form validation, API call, WhatsApp redirect.
═══════════════════════════════════════════════════════════════════ */

// ── Cart State ─────────────────────────────────────────────────────
let cart = [];  // [{ name, price, qty }]

// ── DOM: Cart ──────────────────────────────────────────────────────
const cartIconBtn  = document.getElementById('cartIconBtn');
const cartCountEl  = document.getElementById('cartCount');
const cartDrawer   = document.getElementById('cartDrawer');
const cartOverlay  = document.getElementById('cartOverlay');
const cartClose    = document.getElementById('cartClose');
const cartItemsEl  = document.getElementById('cartItems');
const cartEmptyEl  = document.getElementById('cartEmpty');
const cartFooterEl = document.getElementById('cartFooter');
const cartTotalEl  = document.getElementById('cartTotal');
const checkoutBtn  = document.getElementById('checkoutBtn');
const cartFab      = document.getElementById('cartFab');
const cartFabBtn   = document.getElementById('cartFabBtn');
const cartFabCount = document.getElementById('cartFabCount');
const cartFabTotal = document.getElementById('cartFabTotal');
const browseMenuBtn = document.getElementById('browseMenuBtn');

// ── DOM: Order modal ───────────────────────────────────────────────
const overlay      = document.getElementById('modalOverlay');
const modalClose   = document.getElementById('modalClose');
const orderForm    = document.getElementById('orderForm');
const submitBtn    = document.getElementById('submitBtn');
const submitLabel  = document.getElementById('submitLabel');
const formStatus   = document.getElementById('formStatus');
const modalSummary = document.getElementById('modalSummary');
const modalTotalEl = document.getElementById('modalTotal');

const custName    = document.getElementById('custName');
const custPhone   = document.getElementById('custPhone');
const custAddress = document.getElementById('custAddress');

const nameError    = document.getElementById('nameError');
const phoneError   = document.getElementById('phoneError');
const addressError = document.getElementById('addressError');

// ── Cart Logic ─────────────────────────────────────────────────────

function getTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getTotalQty() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price: Number(price), qty: 1 });
  }
  updateCartUI();
  pulseCardBtn(name);
}

function updateQty(name, delta) {
  const item = cart.find(i => i.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.name !== name);
  updateCartUI();
}

function removeItem(name) {
  cart = cart.filter(i => i.name !== name);
  updateCartUI();
}

/** Escape HTML entities to prevent XSS */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Render cart UI ─────────────────────────────────────────────────

function updateCartUI() {
  const totalQty = getTotalQty();
  const total    = getTotal();

  // Header badge
  cartCountEl.textContent = totalQty;
  cartCountEl.classList.toggle('has-items', totalQty > 0);

  // Floating cart bar
  if (totalQty > 0) {
    cartFab.classList.add('visible');
    cartFabCount.textContent = totalQty;
    cartFabTotal.textContent = `₹${total}`;
  } else {
    cartFab.classList.remove('visible');
  }

  renderCartDrawer(total);
  updateCardButtons();
}

function renderCartDrawer(total) {
  if (cart.length === 0) {
    cartEmptyEl.style.display  = 'flex';
    cartFooterEl.style.display = 'none';
    cartItemsEl.innerHTML = '';
    return;
  }

  cartEmptyEl.style.display  = 'none';
  cartFooterEl.style.display = 'block';
  cartTotalEl.textContent    = `₹${total}`;

  cartItemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-name">${esc(item.name)}</span>
        <span class="cart-item-unit">₹${item.price} each</span>
      </div>
      <div class="cart-item-row">
        <div class="qty-controls">
          <button class="qty-btn minus" data-name="${esc(item.name)}" aria-label="Decrease">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn plus"  data-name="${esc(item.name)}" aria-label="Increase">+</button>
        </div>
        <span class="cart-item-subtotal">₹${item.price * item.qty}</span>
        <button class="remove-btn" data-name="${esc(item.name)}" aria-label="Remove item">✕</button>
      </div>
    </div>
  `).join('');
}

/** Reflect added state on product cards */
function updateCardButtons() {
  document.querySelectorAll('.card').forEach(card => {
    const name   = card.dataset.name;
    const inCart = cart.find(i => i.name === name);
    const btn    = card.querySelector('.add-to-cart-btn');
    if (!btn) return;
    if (inCart) {
      btn.textContent = `✓ In Cart (${inCart.qty})`;
      btn.classList.add('in-cart');
    } else {
      btn.innerHTML = 'Add to Cart 🛒';
      btn.classList.remove('in-cart');
    }
  });
}

/** Brief scale pulse on the card button */
function pulseCardBtn(name) {
  const card = [...document.querySelectorAll('.card')].find(c => c.dataset.name === name);
  if (!card) return;
  const btn = card.querySelector('.add-to-cart-btn');
  if (!btn) return;
  btn.classList.remove('pulse');
  void btn.offsetWidth; // reflow to restart animation
  btn.classList.add('pulse');
  setTimeout(() => btn.classList.remove('pulse'), 400);
}

// ── Cart Drawer Open / Close ───────────────────────────────────────

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

cartIconBtn.addEventListener('click', openCart);
cartFabBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// Close cart + go to menu section on "Browse Menu"
browseMenuBtn.addEventListener('click', closeCart);

// ── Cart items: qty & remove ───────────────────────────────────────

cartItemsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const name = btn.dataset.name;
  if (btn.classList.contains('minus'))      updateQty(name, -1);
  else if (btn.classList.contains('plus'))  updateQty(name, +1);
  else if (btn.classList.contains('remove-btn')) removeItem(name);
});

// ── Product grid: Add to Cart ──────────────────────────────────────

document.getElementById('productGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('.add-to-cart-btn');
  if (!btn) return;
  const card = btn.closest('.card');
  addToCart(card.dataset.name, card.dataset.price);
});

// ── Checkout: open order modal ────────────────────────────────────

checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) return;
  closeCart();
  openOrderModal();
});

function openOrderModal() {
  // Populate cart summary inside modal
  const total = getTotal();
  modalSummary.innerHTML = cart.map(item => `
    <div class="modal-cart-row">
      <span class="mcr-name">${esc(item.name)}</span>
      <span class="mcr-qty">× ${item.qty}</span>
      <span class="mcr-price">₹${item.price * item.qty}</span>
    </div>
  `).join('');
  modalTotalEl.textContent = `₹${total}`;

  resetForm();
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => custName.focus(), 230);
}

// ── Order modal close ─────────────────────────────────────────────

function closeModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  resetForm();
}

modalClose.addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (overlay.classList.contains('open'))    closeModal();
    else if (cartDrawer.classList.contains('open')) closeCart();
  }
});

// ── Form helpers ──────────────────────────────────────────────────

function resetForm() {
  orderForm.reset();
  clearErrors();
  setStatus('', '');
  setLoading(false);
}

function setFieldError(input, msgEl, message) {
  msgEl.textContent = message;
  input.classList.toggle('error', !!message);
}

function clearErrors() {
  setFieldError(custName,    nameError,    '');
  setFieldError(custPhone,   phoneError,   '');
  setFieldError(custAddress, addressError, '');
}

function setStatus(message, type) {
  formStatus.textContent = message;
  formStatus.className   = `form-status${type ? ' ' + type : ''}`;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitLabel.innerHTML = isLoading
    ? '<span class="spinner"></span>Sending…'
    : 'Send Order via WhatsApp 💬';
}

function validateForm() {
  let valid = true;
  clearErrors();

  const nameVal    = custName.value.trim();
  const phoneVal   = custPhone.value.trim();
  const addressVal = custAddress.value.trim();

  if (!nameVal) {
    setFieldError(custName, nameError, 'Please enter your name.');
    valid = false;
  } else if (nameVal.length < 2) {
    setFieldError(custName, nameError, 'Name must be at least 2 characters.');
    valid = false;
  }

  if (!phoneVal) {
    setFieldError(custPhone, phoneError, 'Please enter your phone number.');
    valid = false;
  } else if (!/^[6-9]\d{9}$/.test(phoneVal)) {
    setFieldError(custPhone, phoneError, 'Enter a valid 10-digit Indian mobile number.');
    valid = false;
  }

  if (!addressVal) {
    setFieldError(custAddress, addressError, 'Please enter your delivery address.');
    valid = false;
  } else if (addressVal.length < 10) {
    setFieldError(custAddress, addressError, 'Address is too short. Please be more specific.');
    valid = false;
  }

  return valid;
}

// ── Form submit ───────────────────────────────────────────────────

orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const payload = {
    cartItems: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
    total:     getTotal(),
    name:      custName.value.trim(),
    phone:     custPhone.value.trim(),
    address:   custAddress.value.trim(),
  };

  setLoading(true);
  setStatus('', '');

  try {
    let res;
    try {
      res = await fetch('/api/order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
    } catch {
      throw new Error('Cannot reach server. Make sure the server is running on port 3000.');
    }

    const rawText = await res.text();
    let data;
    try { data = JSON.parse(rawText); }
    catch { throw new Error(`Unexpected server response (HTTP ${res.status}). Is the server running?`); }

    if (!res.ok || !data.success) throw new Error(data.message || 'Something went wrong. Try again.');

    setStatus('✅ Redirecting to WhatsApp…', 'success');

    setTimeout(() => {
      window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
      cart = [];
      updateCartUI();
      closeModal();
    }, 900);

  } catch (err) {
    setStatus(`❌ ${err.message}`, 'error');
    setLoading(false);
  }
});

// ── Live validation ───────────────────────────────────────────────
custName.addEventListener('input',    () => setFieldError(custName,    nameError,    ''));
custPhone.addEventListener('input',   () => setFieldError(custPhone,   phoneError,   ''));
custAddress.addEventListener('input', () => setFieldError(custAddress, addressError, ''));
