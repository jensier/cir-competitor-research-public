const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
};

let snapshot;
let state = { query: '', priority: '', region: '', openSource: '', route: '' };

function metric(icon, label, value) {
  const node = make('div', 'metric');
  node.append(make('div', 'metric-icon', icon));
  const copy = make('div');
  copy.append(make('strong', '', value), make('span', '', label));
  node.append(copy);
  return node;
}

function badge(text, extra = '') {
  return make('span', `badge ${extra}`.trim(), text);
}

function populateSelect(selector, items, valueKey = 'value') {
  const select = $(selector);
  for (const item of items) {
    const option = make('option');
    option.value = item[valueKey];
    option.textContent = `${item[valueKey]} · ${item.count}`;
    select.append(option);
  }
}

function filteredProducts() {
  const query = state.query.trim().toLowerCase();
  return snapshot.products.filter((product) => {
    if (query && !product.search_text.includes(query)) return false;
    if (state.priority && product.priority !== state.priority) return false;
    if (state.region && product.region !== state.region) return false;
    if (state.openSource && product.open_source_status !== state.openSource) return false;
    if (state.route && !String(product.routes).split('、').includes(state.route)) return false;
    return true;
  });
}

function renderProducts() {
  const items = filteredProducts();
  const list = $('#product-list');
  list.replaceChildren();
  $('#result-count').textContent = items.length;
  $('#empty').hidden = items.length > 0;
  const active = [state.priority, state.region, state.openSource, state.route].filter(Boolean).length;
  $('#filter-count').hidden = active === 0;
  $('#filter-count').textContent = active;
  for (const product of items) {
    const row = make('button', 'product-row');
    row.type = 'button';
    row.addEventListener('click', () => openDetail(product.id));
    const main = make('div');
    const meta = make('div', 'row-meta');
    meta.append(make('span', 'mono', product.id), badge(product.priority, product.priority.toLowerCase().replace(' ', '-')), badge(product.competition_relation));
    const title = make('div', 'row-title');
    title.append(make('strong', '', product.name), make('span', '', product.provider));
    main.append(meta, title, make('p', 'summary', product.relevance_summary));
    const side = make('div', 'row-side');
    side.append(make('div', '', product.routes), make('div', '', `${product.region} · ${product.open_source_status}`));
    row.append(main, side, make('span', 'chevron', '›'));
    list.append(row);
  }
}

function appendFact(container, label, value) {
  const node = make('div', 'fact');
  node.append(make('span', '', label), make('strong', '', value || '—'));
  container.append(node);
}

function openDetail(productId) {
  const product = snapshot.details[productId];
  if (!product) return;
  const detail = $('#detail');
  detail.replaceChildren();
  const head = make('header', 'detail-head');
  const meta = make('div', 'row-meta');
  meta.append(make('span', 'mono', product.id), badge(product.priority, product.priority.toLowerCase().replace(' ', '-')), badge(product.competition_relation));
  head.append(meta, make('h2', '', product.name), make('p', '', `${product.provider} · ${product.region} · ${product.current_status} · v${product.record_version}`));
  const body = make('div', 'detail-body');
  const overview = make('section');
  const routes = make('div', 'route-list');
  for (const route of product.routes || []) routes.append(badge(route.name));
  const facts = make('div', 'facts');
  appendFact(facts, '开源状态', product.open_source_status);
  appendFact(facts, '访问状态', product.access_status);
  appendFact(facts, '服务对象', (product.audiences || []).map((x) => x.name).join('、'));
  appendFact(facts, '核心链路', (product.chain_stages || []).map((x) => x.name).join('、'));
  overview.append(routes, make('p', 'lead', product.relevance_summary), facts);
  body.append(overview);
  const question = make('section');
  question.append(make('h3', '', '待验证问题'), make('div', 'question', product.open_question));
  body.append(question);
  const links = make('section');
  links.append(make('h3', '', '产品与代码入口'));
  const linkList = make('div', 'card-list');
  if (/^https?:\/\//.test(product.project_url || '')) {
    const productLink = make('a', 'repo');
    productLink.href = product.project_url;
    productLink.target = '_blank';
    productLink.rel = 'noreferrer';
    productLink.append(make('span', '', '产品页'), make('span', '', '↗'));
    linkList.append(productLink);
  }
  for (const repo of product.repositories || []) {
    const link = make('a', 'repo');
    link.href = repo.url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.append(make('span', '', repo.host), make('span', 'mono', `${repo.relation_type} ↗`));
    linkList.append(link);
  }
  links.append(linkList);
  body.append(links);
  const evidenceSection = make('section');
  evidenceSection.append(make('h3', '', `证据记录 · ${(product.evidence || []).length}`));
  const evidenceList = make('div', 'card-list');
  for (const evidence of product.evidence || []) {
    const card = make('article', 'evidence');
    card.append(make('div', 'mono', `${evidence.id} · ${evidence.evidence_type}`), make('h4', '', evidence.source_title), make('p', '', evidence.supports_judgment));
    if (/^https?:\/\//.test(evidence.url_or_path || '')) {
      const source = make('a', 'source-link', '打开来源 ↗');
      source.href = evidence.url_or_path;
      source.target = '_blank';
      source.rel = 'noreferrer';
      card.append(source);
    }
    evidenceList.append(card);
  }
  evidenceSection.append(evidenceList);
  body.append(evidenceSection);
  const batches = snapshot.histories[productId]?.batches || [];
  if (batches.length) {
    const historySection = make('section');
    historySection.append(make('h3', '', '维护历史'));
    const historyList = make('div', 'card-list');
    for (const batch of batches) {
      const card = make('div', 'history');
      card.append(make('div', 'mono', batch.created_at), make('p', '', batch.reason));
      historyList.append(card);
    }
    historySection.append(historyList);
    body.append(historySection);
  }
  detail.append(head, body);
  $('#detail-dialog').showModal();
}

function clearFilters() {
  state = { query: '', priority: '', region: '', openSource: '', route: '' };
  $('#search').value = '';
  for (const selector of ['#priority', '#region', '#open-source', '#route']) $(selector).value = '';
}

function focusCatalog(query = '') {
  clearFilters();
  state.query = query;
  $('#search').value = query;
  renderProducts();
  $('#catalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function bindControls() {
  const bindings = [
    ['#priority', 'priority'],
    ['#region', 'region'],
    ['#open-source', 'openSource'],
    ['#route', 'route'],
  ];
  for (const [selector, key] of bindings) {
    $(selector).addEventListener('change', (event) => { state[key] = event.target.value; renderProducts(); });
  }
  let timer;
  $('#search').addEventListener('input', (event) => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.query = event.target.value; renderProducts(); }, 120);
  });
  $('#clear').addEventListener('click', () => { clearFilters(); renderProducts(); });
  $('#browse-catalog').addEventListener('click', () => focusCatalog());
  for (const chip of $$('.featured-chip')) chip.addEventListener('click', () => focusCatalog(chip.dataset.query));
  $('#dialog-close').addEventListener('click', () => $('#detail-dialog').close());
  $('#detail-dialog').addEventListener('click', (event) => {
    if (event.target === $('#detail-dialog')) $('#detail-dialog').close();
  });
}

async function init() {
  try {
    const response = await fetch('./data/public-catalog.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    snapshot = await response.json();
    $('#metrics').append(
      metric('◇', '产品对象', snapshot.stats.products),
      metric('✓', '证据记录', snapshot.stats.evidence),
      metric('◎', '提供者', snapshot.stats.providers),
      metric('⌘', '仓库关联', snapshot.stats.repositories),
      metric('▤', 'Tier 1 深研', snapshot.stats.tier1),
    );
    populateSelect('#priority', snapshot.meta.priorities);
    populateSelect('#region', snapshot.meta.regions);
    populateSelect('#open-source', snapshot.meta.open_source_statuses);
    populateSelect('#route', snapshot.meta.routes, 'name');
    $('#snapshot-time').textContent = `快照生成 ${new Date(snapshot.generated_at).toLocaleString('zh-CN')}`;
    $('#loading').remove();
    bindControls();
    renderProducts();
  } catch (error) {
    $('#loading').textContent = `研究快照读取失败：${error.message}`;
  }
}

init();
