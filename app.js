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

const featuredResearch = {
  'CIR-C-001': {
    short: 'Bloomberg / ASKB',
    why: '金融数据终端与带引用对话式研究的基准对象。',
    strength: '数据、新闻、终端工作流和机构覆盖形成综合壁垒。',
    overlap: '资料检索、金融分析和带引用研究输出。',
    gap: '公开材料尚不能确认其是否以显式Research Diff长期维护Claim、Assumption和模型变量。',
    decision: 'CIR不重复建设通用终端；将Bloomberg类数据入口作为可连接上游，聚焦事件到研究重审。',
    matrix: ['明确', '部分', '明确', '明确', '未确认', '明确', '明确', '未确认'],
  },
  'CIR-C-006': {
    short: 'AlphaSense',
    why: '内容、内部知识、监控、Deep Research和Workflow Agents覆盖最广，是最接近的直接竞品之一。',
    strength: '统一外部内容、内部知识、持续监控及模型/备忘录更新工作流。',
    overlap: '多来源研究、项目历史、引用审计和持续更新。',
    gap: '公开证据未说明其内部状态是否显式区分Claim、Assumption、Forecast及依赖关系。',
    decision: '把AlphaSense视为最高优先级对照；CIR必须用条件传播、Research Diff和人工签收证明差异。',
    matrix: ['明确', '明确', '明确', '明确', '部分', '部分', '明确', '未确认'],
  },
  'CIR-C-021': {
    short: 'Hebbia Matrix',
    why: '代表大规模文档矩阵、可追溯分析和金融知识工作区路线。',
    strength: '跨大量文档执行结构化、可追溯分析，适合复杂研究与尽调。',
    overlap: '证据化多文档研究、结构化结果和研究协作。',
    gap: '事件传播、产业条件、公司财务映射和既有研究状态更新的公开证据有限。',
    decision: '借鉴可追溯矩阵体验，但CIR不止做文档分析，而要连接事件、路径、公司和旧研究。',
    matrix: ['部分', '明确', '明确', '未确认', '未确认', '部分', '明确', '未确认'],
  },
  'CIR-C-065': {
    short: 'iFinD',
    why: '中国金融数据、事件图谱、知识图谱和研究管理的代表性综合平台。',
    strength: '本土金融数据与终端场景、事件和知识图谱结合紧密。',
    overlap: '事件监测、图谱、金融数据和机构研究工作流。',
    gap: '公开材料尚不能确认条件路径、Research Diff及逐版本人工签收的实现深度。',
    decision: '把iFinD作为本土数据和事件工作流基准；CIR突出证据边、条件传播和研究状态变化。',
    matrix: ['明确', '部分', '明确', '明确', '明确', '明确', '部分', '未确认'],
  },
  'CIR-C-077': {
    short: 'AIWork',
    why: '代表专家纪要、私域知识、多模态资料与Agent技能结合的中国机构投研路线。',
    strength: '机构私域材料、专家内容和投研技能整合。',
    overlap: '内部知识、文档研究、Agent及专业研究输出。',
    gap: '公开证据未确认其是否管理条件化产业传播和研究对象级Diff。',
    decision: 'CIR不与专家内容库正面竞争；重点证明事件影响链、公司暴露和可回放审核。',
    matrix: ['部分', '明确', '明确', '部分', '未确认', '部分', '部分', '未确认'],
  },
  'CIR-C-092': {
    short: 'Kimi Finance',
    why: '实时金融数据、专业Skills、财务建模、报告和定时任务构成快速演进的本土直接竞品。',
    strength: '模型体验、金融技能、数据连接和报告生产集成度高。',
    overlap: '端到端研究、计算、报告、定时任务和数据连接。',
    gap: '机构级证据审计、研究状态依赖、人工签收和私有部署边界仍需持续核验。',
    decision: '持续跟踪其迭代；CIR不能以“会研究/会报告”作为差异，必须证明治理与状态模型。',
    matrix: ['明确', '部分', '明确', '明确', '部分', '明确', '部分', '未确认'],
  },
  'CIR-C-188': {
    short: 'Google FRA',
    why: '以金融角色、50+ Skills、付费数据连接和审计快照执行端到端金融研究，是Agent架构的重要参照。',
    strength: '技能化金融任务、企业数据连接、角色工作流和运行审计。',
    overlap: '任务编排、工具调用、金融数据连接和可审计运行。',
    gap: '中国金融数据、本地部署、条件化产业链传播和Research Diff仍需验证。',
    decision: '作为Agent工程和审计基准；CIR的业务差异落在中国场景、产业传播与研究状态更新。',
    matrix: ['明确', '明确', '明确', '部分', '未确认', '明确', '明确', '未确认'],
  },
};

const comparisonDimensions = ['金融数据', '内部知识', '多步Agent', '事件监测', '产业图谱', '程序计算', '引用/审计', 'Research Diff'];

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

function appendFeaturedAnalysis(body, product, analysis) {
  const section = make('section', 'featured-analysis');
  section.append(make('div', 'analysis-kicker', 'TIER 1 DEEP DIVE'), make('h3', '', '竞争判断与产品取舍'));
  const grid = make('div', 'analysis-grid');
  for (const [label, value] of [['入选原因', analysis.why], ['公开强项', analysis.strength], ['与CIR重叠', analysis.overlap], ['CIR产品决策', analysis.decision]]) {
    const item = make('article', 'analysis-fact');
    item.append(make('span', '', label), make('p', '', value));
    grid.append(item);
  }
  const gap = make('div', 'analysis-gap');
  gap.append(make('strong', '', '尚未证实的关键缺口'), make('p', '', analysis.gap));
  section.append(grid, gap, make('p', 'analysis-note', `当前判断基于 ${(product.evidence || []).length} 条公开证据；不是实测结论或产品排名。`));
  body.append(section);
}

function openDetail(productId, featured = false) {
  const product = snapshot.details[productId];
  if (!product) return;
  const detail = $('#detail');
  detail.replaceChildren();
  const head = make('header', 'detail-head');
  const meta = make('div', 'row-meta');
  meta.append(make('span', 'mono', product.id), badge(product.priority, product.priority.toLowerCase().replace(' ', '-')), badge(product.competition_relation));
  if (featured) meta.append(badge('重点深研', 'featured-badge'));
  head.append(meta, make('h2', '', product.name), make('p', '', `${product.provider} · ${product.region} · ${product.current_status} · v${product.record_version}`));
  const body = make('div', 'detail-body');
  if (featured && featuredResearch[productId]) appendFeaturedAnalysis(body, product, featuredResearch[productId]);
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

function renderFeatured() {
  const container = $('#featured-list');
  for (const [id, analysis] of Object.entries(featuredResearch)) {
    const product = snapshot.details[id];
    if (!product) continue;
    const card = make('button', 'featured-card');
    card.type = 'button';
    card.addEventListener('click', () => openDetail(id, true));
    const top = make('div', 'featured-card-top');
    top.append(make('span', 'mono', id), badge(product.competition_relation));
    card.append(top, make('h3', '', analysis.short), make('p', '', analysis.why));
    const foot = make('div', 'featured-card-foot');
    foot.append(make('span', '', `${(product.evidence || []).length} 条公开证据`), make('span', '', '查看深研判断 →'));
    card.append(foot);
    container.append(card);
  }
}

function renderComparisonMatrix() {
  const wrap = $('#featured-matrix');
  const table = make('table', 'comparison-table');
  const head = make('thead');
  const headRow = make('tr');
  headRow.append(make('th', '', '能力维度'));
  for (const analysis of Object.values(featuredResearch)) headRow.append(make('th', '', analysis.short));
  head.append(headRow);
  const body = make('tbody');
  comparisonDimensions.forEach((dimension, index) => {
    const row = make('tr');
    row.append(make('th', '', dimension));
    for (const analysis of Object.values(featuredResearch)) {
      const value = analysis.matrix[index];
      row.append(make('td', `matrix-${value === '明确' ? 'strong' : value === '部分' ? 'partial' : 'unknown'}`, value));
    }
    body.append(row);
  });
  table.append(head, body);
  wrap.append(table, make('p', 'matrix-legend', '明确：公开材料直接支持 · 部分：存在相关能力但范围/深度未确认 · 未确认：需要试用、合同或客户材料验证'));
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
    renderFeatured();
    renderComparisonMatrix();
    bindControls();
    renderProducts();
  } catch (error) {
    $('#loading').textContent = `研究快照读取失败：${error.message}`;
  }
}

init();
