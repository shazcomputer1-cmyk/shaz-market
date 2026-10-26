const tabs = ['market', 'services', 'ads', 'request'];
const statusBox = document.getElementById('status-message');
let allProducts = [];

function showTab(tabName) {
  tabs.forEach(name => {
    const section = document.getElementById(`${name}-tab`);
    if (section) section.hidden = name !== tabName;
  });
  document.querySelectorAll('.nav-buttons [data-tab]').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });
  document.getElementById('admin-login').hidden = true;
}
document.querySelectorAll('.nav-buttons [data-tab]').forEach(button => {
  button.addEventListener('click', () => showTab(button.dataset.tab));
});
document.getElementById('admin-toggle').addEventListener('click', () => {
  const box = document.getElementById('admin-login');
  box.hidden = !box.hidden;
  tabs.forEach(name => { const el = document.getElementById(`${name}-tab`); if (el) el.hidden = true; });
  document.querySelectorAll('.nav-buttons [data-tab]').forEach(b => b.classList.remove('active'));
});
function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.style.color = isError ? '#fecaca' : '#86efac';
}
function addTextElement(parent, tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text ?? '';
  if (className) element.className = className;
  parent.appendChild(element);
  return element;
}
function makeCard(item) {
  const card = document.createElement('article');
  card.className = 'card';
  const title = item.name || item.title || 'بەرهەم';
  const description = item.description || '';
  const category = item.category || '';
  const condition = String(item.condition || item.status || '').toLowerCase();
  const conditionLabel = /used|second|بەکارهاتوو/.test(condition) ? 'بەکارهاتوو' : (/new|نوێ/.test(condition) ? 'نوێ' : '');
  addTextElement(card, 'span', '📦', 'product-icon');
  if (conditionLabel) addTextElement(card, 'span', conditionLabel, 'soft-tag');
  addTextElement(card, 'h3', title);
  if (category) addTextElement(card, 'p', `پۆل: ${category}`);
  if (description) addTextElement(card, 'p', description);
  const bottom = document.createElement('div'); bottom.className = 'card-bottom';
  const price = item.price == null ? 'نرخ بپرسە' : `${Number(item.price).toLocaleString('en-US')} دینار`;
  addTextElement(bottom, 'span', price, 'price');
  const link = addTextElement(bottom, 'a', 'پرسیار ↗');
  link.href = `https://wa.me/9647701959372?text=${encodeURIComponent('سڵاو، دەمەوێت زانیاری لەسەر ئەم کاڵایە بزانم: ' + title)}`;
  link.target = '_blank'; link.rel = 'noopener';
  card.appendChild(bottom);
  card.dataset.search = `${title} ${description} ${category}`.toLowerCase();
  card.dataset.category = category.toLowerCase();
  card.dataset.condition = /used|second|بەکارهاتوو/.test(condition) ? 'used' : (/new|نوێ/.test(condition) ? 'new' : '');
  return card;
}
async function getRows(tableName) {
  const config = window.SHAZ_CONFIG;
  if (!config?.supabaseUrl || !config?.supabasePublishableKey) throw new Error('Supabase config missing');
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${tableName}?select=*`, {
    headers: { apikey: config.supabasePublishableKey, Authorization: `Bearer ${config.supabasePublishableKey}` }
  });
  if (!response.ok) throw new Error(`${tableName}: HTTP ${response.status}`);
  return response.json();
}
function filterProducts() {
  const q = document.getElementById('product-search').value.trim().toLowerCase();
  const category = document.getElementById('category-filter').value.toLowerCase();
  const condition = document.getElementById('condition-filter').value;
  const cards = document.querySelectorAll('#product-list .card');
  let visible = 0;
  cards.forEach(card => {
    const matches = (!q || card.dataset.search.includes(q)) &&
      (!category || card.dataset.category.includes(category)) &&
      (!condition || card.dataset.condition === condition);
    card.hidden = !matches;
    if (matches) visible++;
  });
  document.getElementById('empty-products').hidden = visible !== 0;
}
['product-search','category-filter','condition-filter'].forEach(id => {
  document.getElementById(id).addEventListener(id === 'product-search' ? 'input' : 'change', filterProducts);
});
async function loadProducts() {
  try {
    const rows = await getRows('products');
    if (!rows.length) return;
    allProducts = rows;
    const list = document.getElementById('product-list');
    list.replaceChildren();
    rows.forEach(item => list.appendChild(makeCard(item)));
    filterProducts();
  } catch (error) {
    console.warn('Products are using display samples until read policies/schema are ready.', error);
    setStatus('کاڵا و نرخەکانی داتابەیس نەهاتنەوە؛ نموونەی دیزاین پیشان دەدرێت. RLS و ناوی ستوونەکان بپشکنە.', true);
  }
}
async function loadServices() {
  try {
    const rows = await getRows('services');
    if (!rows.length) return;
    const list = document.getElementById('service-list');
    list.replaceChildren();
    rows.forEach(item => {
      const card = document.createElement('article'); card.className = 'card';
      addTextElement(card, 'h3', item.name || item.title || 'خزمەتگوزاری');
      addTextElement(card, 'p', item.description || '');
      list.appendChild(card);
    });
  } catch (error) { console.warn('Services not loaded from database', error); }
}
async function loadAds() {
  try {
    const rows = await getRows('ads');
    if (!rows.length) return;
    const list = document.getElementById('ad-list'); list.replaceChildren();
    rows.forEach(item => {
      const banner = document.createElement('article'); banner.className = 'ad-banner';
      addTextElement(banner, 'span', '🔥');
      const content = document.createElement('div');
      addTextElement(content, 'h3', item.title || 'ئۆفەر');
      addTextElement(content, 'p', item.description || item.text || '');
      banner.appendChild(content); list.appendChild(banner);
    });
  } catch (error) { console.warn('Offers not loaded from database', error); }
}
document.getElementById('request-form').addEventListener('submit', event => {
  event.preventDefault();
  const type = document.getElementById('request-type').value;
  const name = document.getElementById('customer-name').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();
  const model = document.getElementById('device-model').value.trim();
  const details = document.getElementById('request-details').value.trim();
  const message = `سڵاو شاز، داواکارییەکی نوێم هەیە.\nجۆر: ${type}\nناو: ${name}\nژمارە: ${phone || 'نەنوسراوە'}\nکاڵا/مۆدێل: ${model}\nوردەکاری: ${details || 'نەنوسراوە'}`;
  window.open(`https://wa.me/9647701959372?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
});
Promise.all([loadProducts(), loadServices(), loadAds()]);

// Premium-header shortcuts and category selection.
const headerSearch = document.getElementById('header-search');
if (headerSearch) {
  headerSearch.addEventListener('input', () => {
    const mainSearch = document.getElementById('product-search');
    if (mainSearch) {
      mainSearch.value = headerSearch.value;
      showTab('market');
      filterProducts();
    }
  });
}
document.querySelectorAll('[data-category]').forEach(tile => {
  tile.addEventListener('click', () => {
    showTab('market');
    const select = document.getElementById('category-filter');
    if (select) {
      select.value = tile.dataset.category;
      filterProducts();
    }
    document.getElementById('market-tab').scrollIntoView({behavior:'smooth', block:'start'});
  });
});
document.querySelectorAll('[data-category-link]').forEach(link => {
  link.addEventListener('click', () => {
    showTab('market');
    const select = document.getElementById('category-filter');
    if (select) {
      select.value = link.dataset.category;
      filterProducts();
    }
  });
});
document.querySelectorAll('[data-tab-link]').forEach(tile => {
  tile.addEventListener('click', () => showTab(tile.dataset.tabLink));
});
document.getElementById('services-nav-link')?.addEventListener('click', () => showTab('services'));
document.getElementById('offers-nav-link')?.addEventListener('click', () => showTab('ads'));
