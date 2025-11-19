// EcoShop demo frontend-only: registro, login, productos, recomendaciones y carrito.

const PRODUCTS = [
  { id: 1, name: 'Botella reutilizable de acero', category: 'movilidad', price: 39.9, ecoScore: 'A', tag: 'Sin plástico' },
  { id: 2, name: 'Cepillo de bambú', category: 'baño', price: 9.5, ecoScore: 'A', tag: 'Biodegradable' },
  { id: 3, name: 'Bolsas reutilizables de tela', category: 'hogar', price: 25.0, ecoScore: 'B', tag: 'Reutilizable' },
  { id: 4, name: 'Detergente ecológico concentrado', category: 'hogar', price: 29.9, ecoScore: 'A', tag: 'Libre de tóxicos' },
  { id: 5, name: 'Set de cubiertos de bambú', category: 'cocina', price: 19.9, ecoScore: 'A', tag: 'Ideal para llevar' },
  { id: 6, name: 'Shampoo sólido natural', category: 'baño', price: 21.9, ecoScore: 'B', tag: 'Sin envase plástico' },
  { id: 7, name: 'Sorbetes de acero inoxidable', category: 'cocina', price: 14.5, ecoScore: 'A', tag: 'Reutilizable' },
  { id: 8, name: 'Funda ecológica para laptop', category: 'hogar', price: 59.9, ecoScore: 'B', tag: 'Material reciclado' },
];

let currentUser = null;
let cart = [];

const STORAGE_USERS = 'ecoshop_users';
const STORAGE_CURRENT = 'ecoshop_current_user';

function loadUsers() {
  const raw = localStorage.getItem(STORAGE_USERS);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem(STORAGE_CURRENT, user.email);
  } else {
    localStorage.removeItem(STORAGE_CURRENT);
  }
}

function restoreSession() {
  const email = localStorage.getItem(STORAGE_CURRENT);
  if (!email) return;
  const users = loadUsers();
  const found = users.find(u => u.email === email);
  if (found) {
    setCurrentUser(found);
    showMainApp();
  }
}

// DOM
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const registerSection = document.getElementById('register-section');
const navLogged = document.getElementById('nav-logged');
const welcomeUser = document.getElementById('welcome-user');
const productsList = document.getElementById('products-list');
const recommendationsContainer = document.getElementById('recommendations');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartHintEl = document.getElementById('cart-hint');
const checkoutBtn = document.getElementById('btn-checkout');
const checkoutModal = document.getElementById('checkout-modal');
const checkoutAmount = document.getElementById('checkout-amount');
const paymentResult = document.getElementById('payment-result');

// Toggles
document.getElementById('show-register').addEventListener('click', () => {
  document.querySelector('.auth-card').classList.add('hidden');
  registerSection.classList.remove('hidden');
});

document.getElementById('show-login').addEventListener('click', () => {
  document.querySelector('.auth-card').classList.remove('hidden');
  registerSection.classList.add('hidden');
});

// Registro
document.getElementById('register-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;
  const interests = Array.from(registerSection.querySelectorAll('input[type=checkbox]:checked')).map(c => c.value);

  const users = loadUsers();
  if (users.some(u => u.email === email)) {
    alert('Ya existe una cuenta con ese correo.');
    return;
  }
  const user = { name, email, password, interests };
  users.push(user);
  saveUsers(users);
  setCurrentUser(user);
  showMainApp();
});

// Login
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const users = loadUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    alert('Correo o contraseña incorrectos.');
    return;
  }
  setCurrentUser(user);
  showMainApp();
});

// Logout
document.getElementById('btn-logout').addEventListener('click', () => {
  setCurrentUser(null);
  cart = [];
  renderCart();
  navLogged.classList.add('hidden');
  appContainer.classList.add('hidden');
  authContainer.classList.remove('hidden');
});

function showMainApp() {
  authContainer.classList.add('hidden');
  appContainer.classList.remove('hidden');
  navLogged.classList.remove('hidden');
  welcomeUser.textContent = `Hola, ${currentUser.name}`;
  renderProducts();
  renderRecommendations();
  renderCart();
}

// Render productos
function renderProducts() {
  productsList.innerHTML = '';
  PRODUCTS.forEach(p => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div>
        <span class="badge">${p.category}</span>
        <h3>${p.name}</h3>
        <p class="product-meta">${p.tag}</p>
        <p class="price">S/ ${p.price.toFixed(2)}</p>
        <p class="product-meta">EcoScore: ${p.ecoScore}</p>
      </div>
      <button class="btn-primary full-width" data-id="${p.id}">Agregar al carrito</button>
    `;
    card.querySelector('button').addEventListener('click', () => addToCart(p.id));
    productsList.appendChild(card);
  });
}

// Recomendaciones simples basadas en intereses
function computeRecommendations() {
  if (!currentUser) return [];
  const interests = currentUser.interests || [];
  let rec;
  if (interests.length === 0) {
    rec = PRODUCTS.filter(p => p.ecoScore === 'A').slice(0, 3);
  } else {
    rec = PRODUCTS.filter(p => interests.includes(p.category));
    if (rec.length === 0) rec = PRODUCTS.slice(0, 3);
    if (rec.length > 3) rec = rec.slice(0, 3);
  }
  return rec;
}

function renderRecommendations() {
  recommendationsContainer.innerHTML = '';
  const recs = computeRecommendations();
  if (recs.length === 0) {
    recommendationsContainer.textContent = 'Sin recomendaciones por ahora.';
    return;
  }
  recs.forEach(p => {
    const row = document.createElement('div');
    row.className = 'recommendation-item';
    row.innerHTML = `
      <span>${p.name}</span>
      <span class="price">S/ ${p.price.toFixed(2)}</span>
      <button class="btn-secondary">+</button>
    `;
    row.querySelector('button').addEventListener('click', () => addToCart(p.id));
    recommendationsContainer.appendChild(row);
  });
}

// Carrito
function addToCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id: p.id, name: p.name, price: p.price, category: p.category, qty: 1 });
  renderCart();
  renderRecommendations();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.id !== id);
  }
  renderCart();
  renderRecommendations();
}

function renderCart() {
  cartItemsEl.innerHTML = '';
  if (cart.length === 0) {
    cartItemsEl.textContent = 'Tu carrito está vacío.';
    cartTotalEl.textContent = 'S/ 0.00';
    cartHintEl.textContent = '';
    checkoutBtn.disabled = true;
    return;
  }

  let total = 0;
  cart.forEach(item => {
    total += item.price * item.qty;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <span>${item.name} x ${item.qty}</span>
      <span>S/ ${(item.price * item.qty).toFixed(2)}</span>
      <div>
        <button class="btn-secondary" data-delta="-1">-</button>
        <button class="btn-secondary" data-delta="1">+</button>
      </div>
    `;
    const [btnMinus, btnPlus] = row.querySelectorAll('button');
    btnMinus.addEventListener('click', () => changeQty(item.id, -1));
    btnPlus.addEventListener('click', () => changeQty(item.id, 1));
    cartItemsEl.appendChild(row);
  });

  const threshold = 120;
  cartTotalEl.textContent = `S/ ${total.toFixed(2)}`;
  checkoutBtn.disabled = false;

  if (total < threshold) {
    const missing = threshold - total;
    cartHintEl.textContent = `Si agregas S/ ${missing.toFixed(2)} más, accedes a envío gratis (simulado).`;
  } else {
    cartHintEl.textContent = '¡Tu pedido califica para envío gratuito (simulado)!';
  }
}

// Pago simulado
checkoutBtn.addEventListener('click', () => {
  const total = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  checkoutAmount.textContent = `S/ ${total.toFixed(2)}`;
  paymentResult.textContent = '';
  checkoutModal.classList.remove('hidden');
});

document.getElementById('btn-cancel-payment').addEventListener('click', () => {
  checkoutModal.classList.add('hidden');
});

document.getElementById('btn-confirm-payment').addEventListener('click', () => {
  const total = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  if (total <= 0) {
    paymentResult.textContent = 'No hay nada que cobrar.';
    return;
  }
  const tx = 'TX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  paymentResult.textContent = `Pago simulado exitoso. Código de transacción: ${tx}. El carrito se vaciará.`;
  cart = [];
  renderCart();
});

// Inicio
restoreSession();
