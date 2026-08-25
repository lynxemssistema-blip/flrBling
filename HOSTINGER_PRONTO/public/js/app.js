/**
 * FLR Bling ERP 2.0 - Complete Multi-Module Application Logic
 * Integrado à API v3 do Bling e Banco Supabase (flrBling_*)
 */

// Application State
const state = {
  currentUser: null,
  authToken: localStorage.getItem('flr_bling_token') || null,
  dataSource: 'live', // 'live' | 'demo'
  currentModule: 'dashboard', // 'dashboard' | 'clients' | 'products' | 'services' | 'orders' | 'proposals' | 'nfe' | 'receivables' | 'payables' | 'serviceOrders' | 'stock'
  allData: [],
  filteredData: [],
  selectedItem: null,
  isBlingAuthenticated: false,
  currentPage: 1,
  pageSize: 10,
  searchQuery: '',
  filterType: '',
  filterSituation: '',
  appConfig: null,
  allUsers: []
};

// Module Definitions Metadata
const MODULE_CONFIG = {
  dashboard: {
    title: 'Dashboard Geral',
    category: 'Visão Executiva',
    endpoint: 'dashboard-summary'
  },
  clients: {
    title: 'Clientes & Contatos',
    category: 'Cadastros',
    endpoint: 'contatos',
    demoKey: 'clientes',
    columns: ['Código', 'Nome / Razão Social', 'Tipo', 'CPF / CNPJ', 'E-mail', 'Telefone', 'Cidade / UF', 'Situação', 'Ações'],
    filterTypeLabel: 'Tipo de Pessoa',
    filterTypeOptions: [{ val: 'J', label: 'Pessoa Jurídica (PJ)' }, { val: 'F', label: 'Pessoa Física (PF)' }],
    filterSituationOptions: [{ val: 'A', label: 'Ativos' }, { val: 'I', label: 'Inativos' }]
  },
  products: {
    title: 'Produtos & Materiais',
    category: 'Cadastros',
    endpoint: 'produtos',
    demoKey: 'produtos',
    columns: ['Foto', 'Código', 'Descrição do Produto', 'Categoria', 'Preço Venda', 'Preço Custo', 'Estoque', 'Unidade', 'Situação', 'Ações'],
    filterTypeLabel: 'Tipo',
    filterTypeOptions: [{ val: 'P', label: 'Produto' }, { val: 'S', label: 'Serviço' }],
    filterSituationOptions: [{ val: 'A', label: 'Ativos' }, { val: 'I', label: 'Inativos' }]
  },
  services: {
    title: 'Catálogo de Serviços',
    category: 'Cadastros',
    endpoint: 'produtos?tipo=S',
    demoKey: 'produtos',
    columns: ['Foto', 'Código', 'Descrição do Serviço', 'Categoria', 'Valor Base', 'Custo Estimado', 'Unidade', 'Situação', 'Ações'],
    filterTypeLabel: 'Categoria',
    filterTypeOptions: [{ val: 'Serviços Técnicos', label: 'Serviços Técnicos' }],
    filterSituationOptions: [{ val: 'A', label: 'Ativos' }, { val: 'I', label: 'Inativos' }]
  },
  orders: {
    title: 'Pedidos de Venda',
    category: 'Vendas & Comercial',
    endpoint: 'pedidos-vendas',
    demoKey: 'pedidos',
    columns: ['Número', 'Cliente', 'Data', 'Vendedor', 'Itens', 'Valor Total', 'Situação', 'Ações'],
    filterTypeLabel: 'Vendedor',
    filterTypeOptions: [{ val: 'Roberto Andrade', label: 'Roberto Andrade' }, { val: 'Ana Paula Silva', label: 'Ana Paula Silva' }],
    filterSituationOptions: [{ val: 'Atendido', label: 'Atendido' }, { val: 'Em andamento', label: 'Em andamento' }, { val: 'Pendente', label: 'Pendente' }]
  },
  proposals: {
    title: 'Propostas Comerciais / Orçamentos',
    category: 'Vendas & Comercial',
    endpoint: 'propostas-comerciais',
    demoKey: 'propostas',
    columns: ['Número', 'Cliente', 'Data Emissão', 'Validade', 'Valor Total', 'Situação', 'Ações'],
    filterTypeLabel: 'Status Proposta',
    filterTypeOptions: [{ val: 'Aprovada', label: 'Aprovada' }, { val: 'Em Negociação', label: 'Em Negociação' }],
    filterSituationOptions: [{ val: 'Aprovada', label: 'Aprovada' }, { val: 'Em Negociação', label: 'Em Negociação' }]
  },
  nfe: {
    title: 'Notas Fiscais de Saída (NF-e)',
    category: 'Vendas & Comercial',
    endpoint: 'nfe',
    demoKey: 'pedidos',
    columns: ['Número', 'Cliente / Destinatário', 'Data Emissão', 'Valor Total', 'Chave de Acesso', 'Status SEFAZ', 'Ações'],
    filterTypeLabel: 'Tipo NF',
    filterTypeOptions: [{ val: 'NFe', label: 'NF-e 55' }],
    filterSituationOptions: [{ val: 'Autorizada', label: 'Autorizada' }]
  },
  receivables: {
    title: 'Contas a Receber',
    category: 'Financeiro',
    endpoint: 'contas-receber',
    demoKey: 'contasReceber',
    columns: ['Documento', 'Cliente', 'Vencimento', 'Valor', 'Saldo a Receber', 'Situação', 'Ações'],
    filterTypeLabel: 'Tipo',
    filterTypeOptions: [{ val: 'FAT', label: 'Faturas' }],
    filterSituationOptions: [{ val: 'Aberta', label: 'Abertas' }, { val: 'Liquidada', label: 'Liquidadas' }]
  },
  payables: {
    title: 'Contas a Pagar',
    category: 'Financeiro',
    endpoint: 'contas-pagar',
    demoKey: 'contasPagar',
    columns: ['ID / Doc', 'Fornecedor / Beneficiário', 'Categoria', 'Vencimento', 'Valor', 'Situação', 'Ações'],
    filterTypeLabel: 'Categoria',
    filterTypeOptions: [{ val: 'Matéria-Prima', label: 'Matéria-Prima' }, { val: 'Equipamentos HVAC', label: 'Equipamentos HVAC' }],
    filterSituationOptions: [{ val: 'Aberta', label: 'Abertas' }, { val: 'Paga', label: 'Pagas' }]
  },
  serviceOrders: {
    title: 'Ordens de Serviço (OS)',
    category: 'Serviços & Operacional',
    endpoint: 'ordens-servicos',
    demoKey: 'ordensServicos',
    columns: ['Número OS', 'Cliente', 'Descrição do Serviço', 'Responsável Técnico', 'Abertura', 'Previsão', 'Valor Total', 'Situação', 'Ações'],
    filterTypeLabel: 'Responsável',
    filterTypeOptions: [{ val: 'Equipe Alpha', label: 'Equipe Alpha' }, { val: 'Téc. Fernando', label: 'Téc. Fernando' }],
    filterSituationOptions: [{ val: 'Em Execução', label: 'Em Execução' }, { val: 'Concluído', label: 'Concluído' }, { val: 'Aguardando Peças', label: 'Aguardando Peças' }]
  },
  stock: {
    title: 'Saldos de Estoque',
    category: 'Serviços & Operacional',
    endpoint: 'estoques/saldos',
    demoKey: 'produtos',
    columns: ['Código', 'Descrição do Material', 'Depósito', 'Saldo Físico', 'Saldo Reservado', 'Saldo Disponível', 'Ações'],
    filterTypeLabel: 'Depósito',
    filterTypeOptions: [{ val: 'Geral', label: 'Depósito Central FLR' }],
    filterSituationOptions: [{ val: 'A', label: 'Com Saldo' }]
  }
};

// DOM Elements Map
const elements = {
  landingPageView: document.getElementById('landingPageView'),
  dashboardView: document.getElementById('dashboardView'),
  erpViewDashboard: document.getElementById('erpViewDashboard'),
  erpViewTable: document.getElementById('erpViewTable'),

  // Breadcrumb
  bcCategoryName: document.getElementById('bcCategoryName'),
  bcViewName: document.getElementById('bcViewName'),

  // Landing Action Buttons
  btnLandingLogin: document.getElementById('btnLandingLogin'),
  btnLandingRegister: document.getElementById('btnLandingRegister'),
  btnHeroEnter: document.getElementById('btnHeroEnter'),
  btnHeroDemo: document.getElementById('btnHeroDemo'),

  // Auth Modals
  loginModal: document.getElementById('loginModal'),
  btnCloseLoginModal: document.getElementById('btnCloseLoginModal'),
  loginForm: document.getElementById('loginForm'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  linkOpenRegister: document.getElementById('linkOpenRegister'),

  registerModal: document.getElementById('registerModal'),
  btnCloseRegisterModal: document.getElementById('btnCloseRegisterModal'),
  registerForm: document.getElementById('registerForm'),
  regName: document.getElementById('regName'),
  regEmail: document.getElementById('regEmail'),
  regPhone: document.getElementById('regPhone'),
  regPassword: document.getElementById('regPassword'),
  linkOpenLogin: document.getElementById('linkOpenLogin'),

  // Header User Meta
  userHeaderAvatar: document.getElementById('userHeaderAvatar'),
  userHeaderName: document.getElementById('userHeaderName'),
  userHeaderRole: document.getElementById('userHeaderRole'),
  btnAppLogout: document.getElementById('btnAppLogout'),

  // Superadmin Management
  superadminNavSection: document.getElementById('superadminNavSection'),
  navOpenUsersManager: document.getElementById('navOpenUsersManager'),
  navPendingUsersCount: document.getElementById('navPendingUsersCount'),
  usersManagerModal: document.getElementById('usersManagerModal'),
  btnCloseUsersModal: document.getElementById('btnCloseUsersModal'),
  btnCloseUsersModalFooter: document.getElementById('btnCloseUsersModalFooter'),
  usersTableBody: document.getElementById('usersTableBody'),

  // Bling OAuth Modal
  apiStatusBadge: document.getElementById('apiStatusBadge'),
  apiStatusText: document.getElementById('apiStatusText'),
  btnOpenAuthModal: document.getElementById('btnOpenAuthModal'),
  navOpenSettings: document.getElementById('navOpenSettings'),
  authModal: document.getElementById('authModal'),
  btnCloseAuthModal: document.getElementById('btnCloseAuthModal'),
  btnCloseAuthModalFooter: document.getElementById('btnCloseAuthModalFooter'),
  btnAuthorizeLink: document.getElementById('btnAuthorizeLink'),
  inputAuthCode: document.getElementById('inputAuthCode'),
  btnExchangeCode: document.getElementById('btnExchangeCode'),
  inputManualToken: document.getElementById('inputManualToken'),
  btnSaveManualToken: document.getElementById('btnSaveManualToken'),
  modalTokenStatusText: document.getElementById('modalTokenStatusText'),
  btnLogoutToken: document.getElementById('btnLogoutToken'),

  // Data Source & Actions
  btnSourceLive: document.getElementById('btnSourceLive'),
  btnSourceDemo: document.getElementById('btnSourceDemo'),
  btnRefreshData: document.getElementById('btnRefreshData'),

  // Dashboard Specific KPIs
  dashKpiClientes: document.getElementById('dashKpiClientes'),
  dashKpiFaturamento: document.getElementById('dashKpiFaturamento'),
  dashKpiProdutos: document.getElementById('dashKpiProdutos'),
  dashKpiOs: document.getElementById('dashKpiOs'),
  dashBlingStatusText: document.getElementById('dashBlingStatusText'),

  // Dynamic Module KPIs
  dynStatLabel1: document.getElementById('dynStatLabel1'),
  dynStatVal1: document.getElementById('dynStatVal1'),
  dynStatLabel2: document.getElementById('dynStatLabel2'),
  dynStatVal2: document.getElementById('dynStatVal2'),
  dynStatLabel3: document.getElementById('dynStatLabel3'),
  dynStatVal3: document.getElementById('dynStatVal3'),
  dynStatLabel4: document.getElementById('dynStatLabel4'),
  dynStatVal4: document.getElementById('dynStatVal4'),

  // Dynamic Table & Filters
  moduleTableTitle: document.getElementById('moduleTableTitle'),
  recordsBadge: document.getElementById('recordsBadge'),
  lastSyncText: document.getElementById('lastSyncText'),
  filterSearch: document.getElementById('filterSearch'),
  quickSearchInput: document.getElementById('quickSearchInput'),
  filterType: document.getElementById('filterType'),
  lblFilterType: document.getElementById('lblFilterType'),
  filterSituation: document.getElementById('filterSituation'),
  lblFilterSituation: document.getElementById('lblFilterSituation'),
  btnClearFilters: document.getElementById('btnClearFilters'),
  genericTableHead: document.getElementById('genericTableHead'),
  genericTableBody: document.getElementById('genericTableBody'),
  tableLoadingState: document.getElementById('tableLoadingState'),
  tableEmptyState: document.getElementById('tableEmptyState'),
  emptyStateMessage: document.getElementById('emptyStateMessage'),

  // Pagination
  paginationInfo: document.getElementById('paginationInfo'),
  currentPageNumber: document.getElementById('currentPageNumber'),
  btnPrevPage: document.getElementById('btnPrevPage'),
  btnNextPage: document.getElementById('btnNextPage'),

  // Sidebar Counters
  navClientsCount: document.getElementById('navClientsCount'),
  navProductsCount: document.getElementById('navProductsCount'),
  navOrdersCount: document.getElementById('navOrdersCount'),
  navOsCount: document.getElementById('navOsCount'),

  // Novo Produto / Modal
  btnOpenNewItemModal: document.getElementById('btnOpenNewItemModal'),
  lblNewItemBtn: document.getElementById('lblNewItemBtn'),
  modalNewProduct: document.getElementById('modalNewProduct'),
  btnCloseNewProductModal: document.getElementById('btnCloseNewProductModal'),
  btnCloseNewProductModalFooter: document.getElementById('btnCloseNewProductModalFooter'),
  formNewProduct: document.getElementById('formNewProduct'),
  btnSubmitNewProduct: document.getElementById('btnSubmitNewProduct'),

  // Drawer
  drawerOverlay: document.getElementById('drawerOverlay'),
  clientDrawer: document.getElementById('clientDrawer'),
  btnCloseDrawer: document.getElementById('btnCloseDrawer'),
  btnDrawerCloseFooter: document.getElementById('btnDrawerCloseFooter'),
  drawerAvatar: document.getElementById('drawerAvatar'),
  drawerClientName: document.getElementById('drawerClientName'),
  drawerClientCode: document.getElementById('drawerClientCode'),
  drawerStatusBadge: document.getElementById('drawerStatusBadge'),
  btnCopyJson: document.getElementById('btnCopyJson'),

  // Drawer Details Elements
  detNome: document.getElementById('detNome'),
  detFantasia: document.getElementById('detFantasia'),
  detTipo: document.getElementById('detTipo'),
  detDoc: document.getElementById('detDoc'),
  detIe: document.getElementById('detIe'),
  detRg: document.getElementById('detRg'),
  detOrgaoEmissor: document.getElementById('detOrgaoEmissor'),
  detDataNasc: document.getElementById('detDataNasc'),
  detIdBling: document.getElementById('detIdBling'),
  detCodigoInterno: document.getElementById('detCodigoInterno'),
  detSituacao: document.getElementById('detSituacao'),
  detIndicadorIe: document.getElementById('detIndicadorIe'),
  detEndRua: document.getElementById('detEndRua'),
  detEndNum: document.getElementById('detEndNum'),
  detEndComp: document.getElementById('detEndComp'),
  detEndBairro: document.getElementById('detEndBairro'),
  detEndCep: document.getElementById('detEndCep'),
  detEndCidade: document.getElementById('detEndCidade'),
  detEndUf: document.getElementById('detEndUf'),
  cardEndCobranca: document.getElementById('cardEndCobranca'),
  detCobRua: document.getElementById('detCobRua'),
  detCobNum: document.getElementById('detCobNum'),
  detCobBairro: document.getElementById('detCobBairro'),
  detCobCep: document.getElementById('detCobCep'),
  detCobCidade: document.getElementById('detCobCidade'),
  detEmail: document.getElementById('detEmail'),
  detEmailNfe: document.getElementById('detEmailNfe'),
  detTelefone: document.getElementById('detTelefone'),
  detCelular: document.getElementById('detCelular'),
  detLimiteCredito: document.getElementById('detLimiteCredito'),
  detCondicaoPagto: document.getElementById('detCondicaoPagto'),
  detCategoria: document.getElementById('detCategoria'),
  detVendedor: document.getElementById('detVendedor'),
  detObservacoes: document.getElementById('detObservacoes'),
  detRawJson: document.getElementById('detRawJson'),

  sidebar: document.getElementById('sidebar'),
  sidebarToggle: document.getElementById('sidebarToggle'),
  toastContainer: document.getElementById('toastContainer')
};

// ==========================================================================
// INICIALIZAÇÃO
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadAppConfig();

  // Salva o código de autorização caso venha na URL de retorno do Bling
  const urlParams = new URLSearchParams(window.location.search);
  const codeParam = urlParams.get('code');
  if (codeParam) {
    sessionStorage.setItem('pending_bling_code', codeParam);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Verifica se o usuário já possui token salvo no navegador
  if (state.authToken) {
    const isValid = await verifyAuthToken();
    if (isValid) {
      showDashboard();
      return;
    }
  }

  showLandingPage();
});

// ==========================================================================
// ROTEAMENTO DE VIEWS & MENUS
// ==========================================================================
function showLandingPage() {
  elements.landingPageView.style.display = 'flex';
  elements.dashboardView.style.display = 'none';
}

async function showDashboard() {
  elements.landingPageView.style.display = 'none';
  elements.dashboardView.style.display = 'flex';

  updateUserHeaderMeta();
  await checkBlingAuthStatus();

  const isSuperadmin = state.currentUser && state.currentUser.role === 'superadmin';

  if (elements.superadminNavSection) elements.superadminNavSection.style.display = isSuperadmin ? 'block' : 'none';
  if (elements.btnOpenAuthModal) elements.btnOpenAuthModal.style.display = isSuperadmin ? 'flex' : 'none';

  const navSettingsItem = document.getElementById('navOpenSettings');
  if (navSettingsItem) navSettingsItem.style.display = isSuperadmin ? 'flex' : 'none';

  if (isSuperadmin) {
    loadUsersList();
    const pendingCode = sessionStorage.getItem('pending_bling_code');
    if (pendingCode) {
      sessionStorage.removeItem('pending_bling_code');
      showNotification('Código do Bling detectado! Conectando com a conta...', 'info');
      await exchangeCodeDirect(pendingCode);
    }
  }

  // Inicia na visão de Dashboard Geral
  await switchERPView('dashboard');
}

window.switchERPView = async function(moduleKey) {
  state.currentModule = moduleKey;

  // Atualiza classes ativas na Sidebar
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => item.classList.remove('active'));
  const activeNavMap = {
    dashboard: 'navDashboard',
    clients: 'navClients',
    products: 'navProducts',
    services: 'navServices',
    orders: 'navOrders',
    proposals: 'navProposals',
    nfe: 'navNfe',
    receivables: 'navReceivables',
    payables: 'navPayables',
    serviceOrders: 'navServiceOrders',
    stock: 'navStock'
  };

  const currentNavElem = document.getElementById(activeNavMap[moduleKey]);
  if (currentNavElem) currentNavElem.classList.add('active');

  // Alterna entre a view de Dashboard Geral e a view de Tabela Multi-módulo
  if (moduleKey === 'dashboard') {
    elements.erpViewDashboard.classList.add('active');
    elements.erpViewTable.classList.remove('active');
    elements.bcCategoryName.textContent = 'Visão Geral';
    elements.bcViewName.textContent = 'Dashboard Executivo';
    await loadDashboardMetrics();
    return;
  }

  elements.erpViewDashboard.classList.remove('active');
  elements.erpViewTable.classList.add('active');

  const conf = MODULE_CONFIG[moduleKey] || MODULE_CONFIG.clients;
  elements.bcCategoryName.textContent = conf.category;
  elements.bcViewName.textContent = conf.title;
  elements.moduleTableTitle.textContent = conf.title;

  // Configura os cabeçalhos da tabela
  renderTableHeaders(conf.columns);

  // Configura os filtros
  setupModuleFilters(conf);

  // Carrega os dados do módulo
  await loadModuleData(moduleKey);
};

function renderTableHeaders(columns = []) {
  if (!elements.genericTableHead) return;
  elements.genericTableHead.innerHTML = `
    <tr>
      ${columns.map((col, idx) => {
        const isAction = col.toLowerCase().includes('ações') || col.toLowerCase().includes('acoes');
        const isRight = isAction || col.toLowerCase().includes('valor') || col.toLowerCase().includes('preço') || col.toLowerCase().includes('saldo');
        const align = isRight ? (isAction ? 'right' : 'right') : (col === 'Situação' || col === 'Status SEFAZ' ? 'center' : 'left');
        return `<th style="text-align: ${align};">${escapeHtml(col)}</th>`;
      }).join('')}
    </tr>
  `;
}

function setupModuleFilters(conf) {
  if (elements.filterType && conf.filterTypeOptions) {
    elements.lblFilterType.textContent = conf.filterTypeLabel || 'Filtro';
    elements.filterType.innerHTML = `<option value="">Todos</option>` +
      conf.filterTypeOptions.map(opt => `<option value="${opt.val}">${escapeHtml(opt.label)}</option>`).join('');
  }
  if (elements.filterSituation && conf.filterSituationOptions) {
    elements.lblFilterSituation.textContent = 'Situação / Status';
    elements.filterSituation.innerHTML = `<option value="">Todas</option>` +
      conf.filterSituationOptions.map(opt => `<option value="${opt.val}">${escapeHtml(opt.label)}</option>`).join('');
  }
  state.searchQuery = '';
  state.filterType = '';
  state.filterSituation = '';
  if (elements.filterSearch) elements.filterSearch.value = '';
}

// ==========================================================================
// CARREGAMENTO DE DADOS MULTI-MÓDULO
// ==========================================================================
async function loadDashboardMetrics() {
  try {
    const res = await fetch('/api/dashboard-summary', {
      headers: state.authToken ? { 'Authorization': `Bearer ${state.authToken}` } : {}
    });
    if (res.ok) {
      const json = await res.json();
      const d = json.data;
      if (elements.dashKpiClientes) elements.dashKpiClientes.textContent = d.clientesTotal;
      if (elements.dashKpiFaturamento) elements.dashKpiFaturamento.textContent = formatCurrency(d.faturamentoMes);
      if (elements.dashKpiProdutos) elements.dashKpiProdutos.textContent = d.produtosTotal;
      if (elements.dashKpiOs) elements.dashKpiOs.textContent = d.ordensServicosAtivas;
      if (elements.navClientsCount) elements.navClientsCount.textContent = d.clientesTotal;
      if (elements.navProductsCount) elements.navProductsCount.textContent = d.produtosTotal;
      if (elements.navOrdersCount) elements.navOrdersCount.textContent = d.pedidosTotal;
      if (elements.navOsCount) elements.navOsCount.textContent = d.ordensServicosAtivas;
    }
  } catch (e) {
    console.warn('Dashboard summary error:', e);
  }
}

async function loadModuleData(moduleKey) {
  showLoading(true);
  const conf = MODULE_CONFIG[moduleKey];

  try {
    let items = [];

    if (state.dataSource === 'live' && state.authToken) {
      const response = await fetch(`/api/${conf.endpoint}`, {
        headers: { 'Authorization': `Bearer ${state.authToken}` }
      });
      if (response.ok) {
        const result = await response.json();
        items = result.data || [];
      } else {
        // Fallback suave para dados de demonstração
        const demoRes = await fetch(`/api/demo-data?module=${conf.demoKey || 'clientes'}`);
        const demoJson = await demoRes.json();
        items = demoJson.data || [];
      }
    } else {
      const demoRes = await fetch(`/api/demo-data?module=${conf.demoKey || 'clientes'}`);
      const demoJson = await demoRes.json();
      items = demoJson.data || [];
    }

    state.allData = items;
    applyModuleFilters();
    updateModuleKPIs(moduleKey, items);
    elements.lastSyncText.textContent = `Última sincronização: ${new Date().toLocaleTimeString('pt-BR')}`;
  } catch (err) {
    console.error(`Erro ao buscar dados do módulo ${moduleKey}:`, err);
    elements.emptyStateMessage.textContent = err.message || 'Erro ao carregar dados do módulo.';
    showEmptyState(true);
  } finally {
    showLoading(false);
  }
}

function applyModuleFilters() {
  state.filteredData = state.allData.filter(item => {
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const str = JSON.stringify(item).toLowerCase();
      if (!str.includes(q)) return false;
    }

    if (state.filterType) {
      const val = item.tipo || item.vendedor || item.categoria || item.responsavel;
      if (val && String(val).toLowerCase() !== state.filterType.toLowerCase()) return false;
    }

    if (state.filterSituation) {
      const sit = item.situacao || item.status;
      if (sit && String(sit).toLowerCase() !== state.filterSituation.toLowerCase()) return false;
    }

    return true;
  });

  state.currentPage = 1;
  renderGenericTable();
}

function updateModuleKPIs(moduleKey, items) {
  const total = items.length;
  elements.dynStatLabel1.textContent = 'Total de Registros';
  elements.dynStatVal1.textContent = total;

  if (moduleKey === 'clients') {
    elements.dynStatLabel2.textContent = 'Clientes Ativos';
    elements.dynStatVal2.textContent = items.filter(i => i.situacao === 'A').length;
    elements.dynStatLabel3.textContent = 'Pessoas Jurídicas (PJ)';
    elements.dynStatVal3.textContent = items.filter(i => i.tipo === 'J').length;
    elements.dynStatLabel4.textContent = 'Pessoas Físicas (PF)';
    elements.dynStatVal4.textContent = items.filter(i => i.tipo === 'F').length;
  } else if (moduleKey === 'products' || moduleKey === 'services') {
    elements.dynStatLabel2.textContent = 'Itens Ativos';
    elements.dynStatVal2.textContent = items.filter(i => i.situacao === 'A').length;
    elements.dynStatLabel3.textContent = 'Média de Preço';
    const avg = items.length ? items.reduce((acc, p) => {
      const val = typeof p.preco === 'object' ? (p.preco?.preco || 0) : (p.preco || 0);
      return acc + val;
    }, 0) / items.length : 0;
    elements.dynStatVal3.textContent = formatCurrency(avg);
    elements.dynStatLabel4.textContent = 'Total em Estoque';
    elements.dynStatVal4.textContent = items.reduce((acc, p) => {
      let est = 0;
      if (typeof p.estoque === 'object' && p.estoque !== null) {
        est = p.estoque.saldoFisicoTotal || p.estoque.saldoVirtualTotal || 0;
      } else if (typeof p.estoque === 'number') {
        est = p.estoque;
      }
      return acc + est;
    }, 0);
  } else if (moduleKey === 'orders' || moduleKey === 'proposals') {
    elements.dynStatLabel2.textContent = 'Total Faturado';
    const sum = items.reduce((acc, o) => acc + (o.total || 0), 0);
    elements.dynStatVal2.textContent = formatCurrency(sum);
    elements.dynStatLabel3.textContent = 'Atendidos / Aprovados';
    elements.dynStatVal3.textContent = items.filter(i => i.situacao === 'Atendido' || i.situacao === 'Aprovada').length;
    elements.dynStatLabel4.textContent = 'Em Andamento';
    elements.dynStatVal4.textContent = items.filter(i => i.situacao === 'Em andamento' || i.situacao === 'Em Negociação').length;
  } else if (moduleKey === 'serviceOrders') {
    elements.dynStatLabel2.textContent = 'Em Execução';
    elements.dynStatVal2.textContent = items.filter(i => i.situacao === 'Em Execução').length;
    elements.dynStatLabel3.textContent = 'Concluídas';
    elements.dynStatVal3.textContent = items.filter(i => i.situacao === 'Concluído').length;
    elements.dynStatLabel4.textContent = 'Aguardando';
    elements.dynStatVal4.textContent = items.filter(i => i.situacao === 'Aguardando Peças').length;
  } else if (moduleKey === 'receivables' || moduleKey === 'payables') {
    elements.dynStatLabel2.textContent = 'Valor Total';
    const sum = items.reduce((acc, f) => acc + (f.valor || 0), 0);
    elements.dynStatVal2.textContent = formatCurrency(sum);
    elements.dynStatLabel3.textContent = 'Abertas';
    elements.dynStatVal3.textContent = items.filter(i => i.situacao === 'Aberta').length;
    elements.dynStatLabel4.textContent = 'Liquidadas / Pagas';
    elements.dynStatVal4.textContent = items.filter(i => i.situacao === 'Liquidada' || i.situacao === 'Paga').length;
  }
}

// ==========================================================================
// RENDERIZAÇÃO DA TABELA MULTI-MÓDULO
// ==========================================================================
function renderGenericTable() {
  const total = state.filteredData.length;
  elements.recordsBadge.textContent = `${total} registros`;

  if (total === 0) {
    elements.genericTableBody.innerHTML = '';
    elements.emptyStateMessage.textContent = 'Nenhum registro atende aos filtros aplicados.';
    showEmptyState(true);
    updatePagination(0);
    return;
  }

  showEmptyState(false);

  const startIdx = (state.currentPage - 1) * state.pageSize;
  const endIdx = Math.min(startIdx + state.pageSize, total);
  const pageItems = state.filteredData.slice(startIdx, endIdx);

  elements.genericTableBody.innerHTML = pageItems.map(item => {
    return generateRowHTML(state.currentModule, item);
  }).join('');

  updatePagination(total);
}

function generateRowHTML(mod, item) {
  if (mod === 'clients') {
    const isPj = item.tipo === 'J';
    const situacaoClass = item.situacao === 'A' ? 'active' : 'inactive';
    const situacaoLabel = item.situacao === 'A' ? 'Ativo' : 'Inativo';
    const contato = item.celular || item.telefone || '--';
    const cidadeUf = item.endereco?.geral?.municipio ? `${item.endereco.geral.municipio}/${item.endereco.geral.uf || ''}` : '--';

    return `
      <tr onclick="openClientDetails(${item.id})">
        <td><span class="text-mono font-bold" style="font-size: 11px;">${item.codigo || item.id}</span></td>
        <td>
          <div class="client-primary-name"><span>${escapeHtml(item.nome || 'Sem Nome')}</span></div>
          ${item.fantasia ? `<div class="client-fantasy-name">${escapeHtml(item.fantasia)}</div>` : ''}
        </td>
        <td><span class="badge-tipo ${isPj ? 'pj' : 'pf'}">${isPj ? 'PJ' : 'PF'}</span></td>
        <td><span class="text-mono">${formatDocument(item.numeroDocumento)}</span></td>
        <td>${item.email ? `<span>${escapeHtml(item.email)}</span>` : '<span class="text-muted">--</span>'}</td>
        <td><span class="text-mono">${contato}</span></td>
        <td>${cidadeUf}</td>
        <td style="text-align: center;"><span class="badge-status ${situacaoClass}">● ${situacaoLabel}</span></td>
        <td style="text-align: right;" onclick="event.stopPropagation();">
          <button class="btn-view-action" onclick="openClientDetails(${item.id})"><i class="fa-solid fa-eye"></i> Ver</button>
        </td>
      </tr>
    `;
  }

  if (mod === 'products' || mod === 'services') {
    const sitClass = item.situacao === 'A' ? 'active' : 'inactive';
    let estoqueDisplay = '--';
    if (typeof item.estoque === 'object' && item.estoque !== null) {
      estoqueDisplay = item.estoque.saldoFisicoTotal !== undefined ? item.estoque.saldoFisicoTotal : (item.estoque.saldoVirtualTotal !== undefined ? item.estoque.saldoVirtualTotal : '--');
    } else if (typeof item.estoque === 'number') {
      estoqueDisplay = item.estoque;
    }

    const precoVenda = typeof item.preco === 'object' ? (item.preco?.preco || 0) : (item.preco || 0);
    const precoCusto = typeof item.precoCusto === 'object' ? (item.precoCusto?.preco || 0) : (item.precoCusto || 0);
    const categoria = typeof item.categoria === 'object' ? (item.categoria?.descricao || 'Geral') : (item.categoria || 'Geral');

    const defaultImg = item.tipo === 'S' 
      ? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=120&auto=format&fit=crop&q=80' 
      : 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=120&auto=format&fit=crop&q=80';
    const imgUrl = item.imagemURL || item.midia?.imagens?.externas?.[0]?.link || item.anexos?.[0]?.url || item.imagens?.[0]?.link || defaultImg;

    return `
      <tr onclick="openClientDetails(${item.id})">
        <td style="width: 54px; text-align: center;">
          <div class="prod-thumb-wrapper" title="${escapeHtml(item.nome || 'Produto')}">
            <img src="${imgUrl}" class="prod-thumb-img" alt="Foto" loading="lazy" onerror="this.onerror=null; this.src='${defaultImg}';">
          </div>
        </td>
        <td><span class="text-mono font-bold" style="font-size: 11px;">${item.codigo || item.id}</span></td>
        <td><strong>${escapeHtml(item.nome || item.descricao || '--')}</strong></td>
        <td><span class="badge-tag-custom">${escapeHtml(categoria)}</span></td>
        <td style="text-align: right;"><span class="text-emerald font-bold">${formatCurrency(precoVenda)}</span></td>
        <td style="text-align: right;"><span class="text-muted">${formatCurrency(precoCusto)}</span></td>
        <td style="text-align: center;"><strong>${estoqueDisplay}</strong></td>
        <td style="text-align: center;"><span class="text-mono">${item.unidade || 'UN'}</span></td>
        <td style="text-align: center;"><span class="badge-status ${sitClass}">● ${item.situacao === 'A' ? 'Ativo' : 'Inativo'}</span></td>
        <td style="text-align: right;" onclick="event.stopPropagation();">
          <button class="btn-view-action" onclick="openClientDetails(${item.id})"><i class="fa-solid fa-eye"></i> Ver</button>
        </td>
      </tr>
    `;
  }

  if (mod === 'orders' || mod === 'proposals') {
    const sitClass = (item.situacao === 'Atendido' || item.situacao === 'Aprovada') ? 'active' : 'pending';
    const clientName = typeof item.cliente === 'object' ? item.cliente?.nome : (item.cliente || '--');
    return `
      <tr onclick="openClientDetails(${item.id})">
        <td><span class="text-mono font-bold" style="font-size: 12px; color: var(--bling-blue);">#${item.numero || item.id}</span></td>
        <td><strong>${escapeHtml(clientName)}</strong></td>
        <td><span class="text-mono">${formatDate(item.data || item.dataEmissao)}</span></td>
        <td>${item.vendedor || item.validade || '--'}</td>
        <td style="text-align: center;">${item.itensQtd || 1} un</td>
        <td style="text-align: right;"><span class="text-emerald font-bold">${formatCurrency(item.total)}</span></td>
        <td style="text-align: center;"><span class="badge-status ${sitClass}">● ${escapeHtml(item.situacao)}</span></td>
        <td style="text-align: right;" onclick="event.stopPropagation();">
          <button class="btn-view-action" onclick="openClientDetails(${item.id})"><i class="fa-solid fa-eye"></i> Ver</button>
        </td>
      </tr>
    `;
  }

  if (mod === 'serviceOrders') {
    const sitClass = item.situacao === 'Concluído' ? 'active' : (item.situacao === 'Em Execução' ? 'pending' : 'blocked');
    const clientName = typeof item.cliente === 'object' ? item.cliente?.nome : (item.cliente || '--');
    return `
      <tr onclick="openClientDetails(${item.id})">
        <td><span class="text-mono font-bold" style="font-size: 12px; color: var(--bling-orange);">OS #${item.numero || item.id}</span></td>
        <td><strong>${escapeHtml(clientName)}</strong></td>
        <td>${escapeHtml(item.descricao || '--')}</td>
        <td><span class="badge-tag-custom">${escapeHtml(item.responsavel || '--')}</span></td>
        <td><span class="text-mono">${formatDate(item.dataAbertura)}</span></td>
        <td><span class="text-mono">${formatDate(item.dataPrevisao)}</span></td>
        <td style="text-align: right;"><span class="text-emerald font-bold">${formatCurrency(item.valorTotal)}</span></td>
        <td style="text-align: center;"><span class="badge-status ${sitClass}">● ${escapeHtml(item.situacao)}</span></td>
        <td style="text-align: right;" onclick="event.stopPropagation();">
          <button class="btn-view-action" onclick="openClientDetails(${item.id})"><i class="fa-solid fa-eye"></i> Ver</button>
        </td>
      </tr>
    `;
  }

  if (mod === 'receivables' || mod === 'payables') {
    const isPaga = item.situacao === 'Liquidada' || item.situacao === 'Paga';
    const sitClass = isPaga ? 'active' : 'pending';
    const nome = item.cliente || item.fornecedor || '--';
    return `
      <tr onclick="openClientDetails(${item.id})">
        <td><span class="text-mono font-bold">${item.numeroDocumento || item.id}</span></td>
        <td><strong>${escapeHtml(nome)}</strong></td>
        <td><span class="text-mono font-bold" style="color: ${isPaga ? 'inherit' : 'var(--bling-red)'};">${formatDate(item.vencimento)}</span></td>
        <td style="text-align: right;"><span class="font-bold">${formatCurrency(item.valor)}</span></td>
        <td style="text-align: right;"><span class="text-emerald font-bold">${formatCurrency(item.saldo !== undefined ? item.saldo : 0)}</span></td>
        <td style="text-align: center;"><span class="badge-status ${sitClass}">● ${escapeHtml(item.situacao)}</span></td>
        <td style="text-align: right;" onclick="event.stopPropagation();">
          <button class="btn-view-action" onclick="openClientDetails(${item.id})"><i class="fa-solid fa-eye"></i> Ver</button>
        </td>
      </tr>
    `;
  }

  // Fallback genérico
  return `
    <tr onclick="openClientDetails(${item.id})">
      <td><span class="text-mono font-bold">${item.codigo || item.id}</span></td>
      <td colspan="5"><strong>${escapeHtml(item.nome || item.descricao || 'Item')}</strong></td>
      <td style="text-align: right;" onclick="event.stopPropagation();">
        <button class="btn-view-action" onclick="openClientDetails(${item.id})"><i class="fa-solid fa-eye"></i> Ver</button>
      </td>
    </tr>
  `;
}

function updatePagination(total) {
  if (total === 0) {
    elements.paginationInfo.textContent = 'Mostrando 0 de 0 registros';
    elements.currentPageNumber.textContent = 'Página 1';
    elements.btnPrevPage.disabled = true;
    elements.btnNextPage.disabled = true;
    return;
  }

  const start = (state.currentPage - 1) * state.pageSize + 1;
  const end = Math.min(state.currentPage * state.pageSize, total);
  const totalPages = Math.ceil(total / state.pageSize);

  elements.paginationInfo.textContent = `Mostrando ${start} a ${end} de ${total} registros`;
  elements.currentPageNumber.textContent = `Página ${state.currentPage} de ${totalPages}`;
  elements.btnPrevPage.disabled = state.currentPage <= 1;
  elements.btnNextPage.disabled = state.currentPage >= totalPages;
}

// ==========================================================================
// DRAWER DE DETALHES & SUPABASE COMPLEMENTS
// ==========================================================================
async function openClientDetails(itemId) {
  let item = state.allData.find(i => i.id === itemId) || {};
  state.selectedItem = item;

  const title = item.nome || item.descricao || (item.numero ? `Pedido #${item.numero}` : 'Detalhes do Registro');
  const code = item.codigo || item.numeroDocumento || (item.numero ? `Nº ${item.numero}` : `ID #${item.id}`);

  elements.drawerAvatar.textContent = (title || 'FL').substring(0, 2).toUpperCase();
  elements.drawerClientName.textContent = title;
  elements.drawerClientCode.textContent = code;
  elements.drawerStatusBadge.textContent = item.situacao || 'Ativo';

  // Popula campos comuns
  elements.detNome.textContent = item.nome || item.descricao || '--';
  elements.detFantasia.textContent = item.fantasia || item.categoria || '--';
  elements.detTipo.textContent = item.tipo === 'J' ? 'Pessoa Jurídica' : (item.tipo === 'F' ? 'Pessoa Física' : (item.tipo || 'Padrão'));
  elements.detDoc.textContent = formatDocument(item.numeroDocumento);
  elements.detIdBling.textContent = item.id || '--';
  elements.detCodigoInterno.textContent = item.codigo || item.numero || '--';
  elements.detSituacao.textContent = item.situacao || '--';

  // Endereço
  const end = item.endereco?.geral || {};
  elements.detEndRua.textContent = end.endereco || '--';
  elements.detEndNum.textContent = end.numero || '--';
  elements.detEndComp.textContent = end.complemento || '--';
  elements.detEndBairro.textContent = end.bairro || '--';
  elements.detEndCep.textContent = end.cep || '--';
  elements.detEndCidade.textContent = end.municipio || '--';
  elements.detEndUf.textContent = end.uf || '--';

  // Contatos & Financeiro
  elements.detEmail.textContent = item.email || '--';
  elements.detTelefone.textContent = item.telefone || '--';
  elements.detCelular.textContent = item.celular || '--';
  elements.detLimiteCredito.textContent = formatCurrency(item.total || item.preco || item.valor || item.financeiro?.limiteCredito || 0);

  // Raw JSON
  elements.detRawJson.textContent = JSON.stringify(item, null, 2);

  // Hero da Foto do Produto no Drawer
  const drawerProductHero = document.getElementById('drawerProductHero');
  const drawerProductImg = document.getElementById('drawerProductImg');
  const defaultImg = item.tipo === 'S' 
    ? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80' 
    : 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&auto=format&fit=crop&q=80';
  const imgUrl = item.imagemURL || item.midia?.imagens?.externas?.[0]?.link || item.anexos?.[0]?.url || item.imagens?.[0]?.link || (state.currentModule === 'products' || state.currentModule === 'services' ? defaultImg : null);

  if (imgUrl && drawerProductHero && drawerProductImg) {
    drawerProductImg.src = imgUrl;
    drawerProductHero.style.display = 'flex';
  } else if (drawerProductHero) {
    drawerProductHero.style.display = 'none';
  }

  // Supabase Complementos
  await loadClientComplements(item);

  elements.drawerOverlay.classList.add('active');
  elements.clientDrawer.classList.add('active');
}

function closeDrawer() {
  elements.drawerOverlay.classList.remove('active');
  elements.clientDrawer.classList.remove('active');
}

// Supabase Complements Logic
let currentClientTags = [];

async function loadClientComplements(item) {
  const sbStatus = document.getElementById('sbInternalStatus');
  const sbPriority = document.getElementById('sbPriority');
  const sbManager = document.getElementById('sbResponsibleManager');
  const sbNotes = document.getElementById('sbInternalNotes');
  const sbLastSaved = document.getElementById('sbLastSavedMeta');

  sbStatus.value = 'ativo';
  sbPriority.value = 'normal';
  sbManager.value = '';
  sbNotes.value = '';
  currentClientTags = [];
  renderTags();
  sbLastSaved.textContent = 'Carregando dados do Supabase...';

  if (!state.authToken) {
    sbLastSaved.textContent = 'Modo Demonstração ativo.';
    return;
  }

  try {
    const res = await fetch(`/api/complements/${item.id}`, {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        const comp = json.data;
        sbStatus.value = comp.internal_status || 'ativo';
        sbPriority.value = comp.priority || 'normal';
        sbManager.value = comp.responsible_manager || '';
        sbNotes.value = comp.internal_notes || '';
        currentClientTags = Array.isArray(comp.tags) ? comp.tags : [];
        renderTags();
        sbLastSaved.textContent = comp.updated_at ? `Última atualização: ${new Date(comp.updated_at).toLocaleString('pt-BR')}` : 'Sincronizado no Supabase';
        return;
      }
    }
    sbLastSaved.textContent = 'Nenhum complemento registrado ainda.';
  } catch (err) {
    sbLastSaved.textContent = 'Pronto para salvar no Supabase.';
  }
}

function renderTags() {
  const sbTagsContainer = document.getElementById('sbTagsContainer');
  if (!sbTagsContainer) return;
  if (currentClientTags.length === 0) {
    sbTagsContainer.innerHTML = '<span class="text-muted" style="font-size: 11px;">Nenhuma tag adicionada.</span>';
    return;
  }
  sbTagsContainer.innerHTML = currentClientTags.map((tag, idx) => `
    <span class="tag-chip">
      <span>${escapeHtml(tag)}</span>
      <i class="fa-solid fa-xmark remove-tag" onclick="removeTag(${idx})"></i>
    </span>
  `).join('');
}

window.removeTag = function(idx) {
  currentClientTags.splice(idx, 1);
  renderTags();
};

function setupSupabaseTagsInput() {
  const input = document.getElementById('sbTagsInput');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.trim().replace(/^,|,$/g, '');
      if (val && !currentClientTags.includes(val)) {
        currentClientTags.push(val);
        renderTags();
        input.value = '';
      }
    }
  });

  const btnSave = document.getElementById('btnSaveComplement');
  if (btnSave) btnSave.addEventListener('click', saveCurrentClientComplement);
}

async function saveCurrentClientComplement() {
  if (!state.selectedItem) return;

  const btnSave = document.getElementById('btnSaveComplement');
  const sbStatus = document.getElementById('sbInternalStatus').value;
  const sbPriority = document.getElementById('sbPriority').value;
  const sbManager = document.getElementById('sbResponsibleManager').value;
  const sbNotes = document.getElementById('sbInternalNotes').value;
  const sbLastSaved = document.getElementById('sbLastSavedMeta');

  btnSave.disabled = true;
  btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

  try {
    const payload = {
      bling_customer_id: state.selectedItem.id,
      customer_code: state.selectedItem.codigo || state.selectedItem.numero || null,
      customer_name: state.selectedItem.nome || state.selectedItem.descricao || null,
      internal_status: sbStatus,
      priority: sbPriority,
      responsible_manager: sbManager,
      internal_notes: sbNotes,
      tags: currentClientTags
    };

    const res = await fetch(`/api/complements/${state.selectedItem.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Erro ao salvar no Supabase');

    showNotification('Complemento salvo com sucesso no Supabase (flrBling_)!', 'success');
    sbLastSaved.textContent = `Salvo em: ${new Date().toLocaleTimeString('pt-BR')}`;
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    btnSave.disabled = false;
    btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar no Supabase';
  }
}

// ==========================================================================
// CONFIGURAÇÃO DOS EVENT LISTENERS GERAIS
// ==========================================================================
function setupEventListeners() {
  // Landing Actions
  elements.btnLandingLogin?.addEventListener('click', () => openModal(elements.loginModal));
  elements.btnHeroEnter?.addEventListener('click', () => openModal(elements.loginModal));
  elements.btnLandingRegister?.addEventListener('click', () => openModal(elements.registerModal));
  elements.btnHeroDemo?.addEventListener('click', () => {
    state.currentUser = { name: 'Visitante Demo', role: 'user', email: 'demo@flr.com.br' };
    state.dataSource = 'demo';
    showDashboard();
  });

  // Alternadores Login/Register
  elements.linkOpenRegister?.addEventListener('click', () => {
    closeModal(elements.loginModal);
    openModal(elements.registerModal);
  });
  elements.linkOpenLogin?.addEventListener('click', () => {
    closeModal(elements.registerModal);
    openModal(elements.loginModal);
  });

  // Modais Close
  elements.btnCloseLoginModal?.addEventListener('click', () => closeModal(elements.loginModal));
  elements.btnCloseRegisterModal?.addEventListener('click', () => closeModal(elements.registerModal));
  elements.btnCloseUsersModal?.addEventListener('click', () => closeModal(elements.usersManagerModal));
  elements.btnCloseUsersModalFooter?.addEventListener('click', () => closeModal(elements.usersManagerModal));

  elements.loginForm?.addEventListener('submit', handleLogin);
  elements.registerForm?.addEventListener('submit', handleRegister);
  elements.btnAppLogout?.addEventListener('click', handleAppLogout);

  // Gestão de Usuários
  elements.navOpenUsersManager?.addEventListener('click', () => {
    loadUsersList();
    openModal(elements.usersManagerModal);
  });

  elements.sidebarToggle?.addEventListener('click', () => {
    elements.sidebar?.classList.toggle('collapsed');
  });

  // Bling OAuth Modal
  elements.btnOpenAuthModal?.addEventListener('click', () => openModal(elements.authModal));
  elements.navOpenSettings?.addEventListener('click', () => openModal(elements.authModal));
  elements.btnCloseAuthModal?.addEventListener('click', () => closeModal(elements.authModal));
  elements.btnCloseAuthModalFooter?.addEventListener('click', () => closeModal(elements.authModal));
  elements.btnExchangeCode?.addEventListener('click', handleExchangeCode);
  elements.btnSaveManualToken?.addEventListener('click', handleSaveManualToken);
  elements.btnLogoutToken?.addEventListener('click', handleLogoutBling);

  // Novo Produto / Modal Listeners
  elements.btnOpenNewItemModal?.addEventListener('click', openNewProductModal);
  elements.btnCloseNewProductModal?.addEventListener('click', () => closeModal(elements.modalNewProduct));
  elements.btnCloseNewProductModalFooter?.addEventListener('click', () => closeModal(elements.modalNewProduct));
  elements.formNewProduct?.addEventListener('submit', handleCreateProduct);

  // Data Source & Refresh
  elements.btnSourceLive?.addEventListener('click', () => setDataSource('live'));
  elements.btnSourceDemo?.addEventListener('click', () => setDataSource('demo'));
  elements.btnRefreshData?.addEventListener('click', () => switchERPView(state.currentModule));

  // Search & Filters
  elements.filterSearch?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    applyModuleFilters();
  });
  elements.filterType?.addEventListener('change', (e) => {
    state.filterType = e.target.value;
    applyModuleFilters();
  });
  elements.filterSituation?.addEventListener('change', (e) => {
    state.filterSituation = e.target.value;
    applyModuleFilters();
  });
  elements.btnClearFilters?.addEventListener('click', () => {
    if (elements.filterSearch) elements.filterSearch.value = '';
    if (elements.filterType) elements.filterType.value = '';
    if (elements.filterSituation) elements.filterSituation.value = '';
    state.searchQuery = '';
    state.filterType = '';
    state.filterSituation = '';
    applyModuleFilters();
  });

  // Pagination
  elements.btnPrevPage?.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderGenericTable();
    }
  });
  elements.btnNextPage?.addEventListener('click', () => {
    const totalPages = Math.ceil(state.filteredData.length / state.pageSize);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderGenericTable();
    }
  });

  // Drawer
  elements.btnCloseDrawer?.addEventListener('click', closeDrawer);
  elements.btnDrawerCloseFooter?.addEventListener('click', closeDrawer);
  elements.drawerOverlay?.addEventListener('click', closeDrawer);

  const drawerTabs = document.querySelectorAll('.drawer-tab');
  drawerTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      drawerTabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  elements.btnCopyJson?.addEventListener('click', () => {
    const jsonText = elements.detRawJson?.textContent || '{}';
    navigator.clipboard.writeText(jsonText).then(() => {
      showNotification('JSON copiado com sucesso!', 'success');
    });
  });

  setupSupabaseTagsInput();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      if (elements.loginModal) closeModal(elements.loginModal);
      if (elements.registerModal) closeModal(elements.registerModal);
      if (elements.usersManagerModal) closeModal(elements.usersManagerModal);
      if (elements.authModal) closeModal(elements.authModal);
    }
  });
}

// ==========================================================================
// AUTENTICAÇÃO DO USUÁRIO (LOGIN, CADASTRO, LOGOUT)
// ==========================================================================
async function handleLogin(e) {
  e.preventDefault();
  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value;
  const btnSubmit = document.getElementById('btnLoginSubmit');

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Autenticando...';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erro no login');

    state.authToken = result.token;
    state.currentUser = result.user;
    localStorage.setItem('flr_bling_token', result.token);

    showNotification(`Bem-vindo, ${result.user.name}!`, 'success');
    closeModal(elements.loginModal);
    elements.loginForm.reset();
    showDashboard();
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Acessar Sistema';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = elements.regName.value.trim();
  const email = elements.regEmail.value.trim();
  const phone = elements.regPhone.value.trim();
  const password = elements.regPassword.value;
  const btnSubmit = document.getElementById('btnRegisterSubmit');

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erro no cadastro');

    showNotification(result.message, 'success');
    closeModal(elements.registerModal);
    elements.registerForm.reset();
    openModal(elements.loginModal);
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Solicitação';
  }
}

async function verifyAuthToken() {
  if (!state.authToken) return false;
  try {
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    if (response.ok) {
      const data = await response.json();
      state.currentUser = data.user;
      return true;
    }
  } catch (e) {}
  localStorage.removeItem('flr_bling_token');
  state.authToken = null;
  state.currentUser = null;
  return false;
}

function handleAppLogout() {
  const confirmed = window.confirm('Deseja sair do sistema?');
  if (confirmed) {
    localStorage.removeItem('flr_bling_token');
    state.authToken = null;
    state.currentUser = null;
    state.allData = [];
    state.filteredData = [];
    state.selectedItem = null;
    state.isBlingAuthenticated = false;
    state.allUsers = [];
    showNotification('Sessão encerrada com sucesso.', 'info');
    showLandingPage();
  }
}

function updateUserHeaderMeta() {
  if (!state.currentUser) return;
  const user = state.currentUser;
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  elements.userHeaderAvatar.textContent = initials || 'FL';
  elements.userHeaderName.textContent = user.name;
  elements.userHeaderRole.textContent = user.role === 'superadmin' ? 'Superadmin' : 'Usuário';
}

// ==========================================================================
// GESTÃO DE USUÁRIOS (SUPERADMIN ONLY)
// ==========================================================================
async function loadUsersList() {
  if (!state.authToken || !state.currentUser || state.currentUser.role !== 'superadmin') return;

  try {
    const response = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    if (!response.ok) return;

    const result = await response.json();
    state.allUsers = result.users || [];

    const pending = state.allUsers.filter(u => u.status === 'pendente').length;
    if (pending > 0) {
      elements.navPendingUsersCount.textContent = pending;
      elements.navPendingUsersCount.style.display = 'inline-block';
    } else {
      elements.navPendingUsersCount.style.display = 'none';
    }

    renderUsersTable();
  } catch (err) {
    console.error('Erro loadUsersList:', err);
  }
}

function renderUsersTable() {
  if (!elements.usersTableBody) return;
  if (state.allUsers.length === 0) {
    elements.usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum usuário cadastrado.</td></tr>';
    return;
  }

  elements.usersTableBody.innerHTML = state.allUsers.map(user => {
    const isSuper = user.role === 'superadmin';
    const statusClass = user.status === 'aprovado' ? 'active' : (user.status === 'pendente' ? 'pending' : 'blocked');
    const statusLabel = user.status === 'aprovado' ? 'Aprovado' : (user.status === 'pendente' ? 'Pendente' : 'Bloqueado');

    return `
      <tr>
        <td><strong>${escapeHtml(user.name)}</strong></td>
        <td>${escapeHtml(user.email)}</td>
        <td><span class="text-mono">${escapeHtml(user.phone || '--')}</span></td>
        <td><span class="badge-role ${user.role}">${user.role.toUpperCase()}</span></td>
        <td style="text-align: center;"><span class="badge-status ${statusClass}">● ${statusLabel}</span></td>
        <td style="text-align: right;">
          ${!isSuper ? `
            ${user.status !== 'aprovado' ? `
              <button class="btn btn-success btn-xs" onclick="changeUserStatus('${user.id}', 'aprovado')"><i class="fa-solid fa-check"></i> Aprovar</button>
            ` : `
              <button class="btn btn-secondary btn-xs" onclick="changeUserStatus('${user.id}', 'bloqueado')"><i class="fa-solid fa-ban"></i> Bloquear</button>
            `}
            <button class="btn btn-danger btn-xs" onclick="removeUser('${user.id}')"><i class="fa-solid fa-trash"></i></button>
          ` : '<span class="text-muted" style="font-size: 11px;">Superadmin</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

window.changeUserStatus = async function(userId, newStatus) {
  try {
    const response = await fetch(`/api/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.authToken}` },
      body: JSON.stringify({ status: newStatus })
    });
    if (!response.ok) throw new Error('Falha ao atualizar status');
    showNotification(`Status atualizado para: ${newStatus}`, 'success');
    await loadUsersList();
  } catch (err) {
    showNotification(err.message, 'error');
  }
};

window.removeUser = async function(userId) {
  if (!confirm('Deseja realmente excluir este usuário?')) return;
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    if (!response.ok) throw new Error('Falha ao excluir');
    showNotification('Usuário removido com sucesso!', 'info');
    await loadUsersList();
  } catch (err) {
    showNotification(err.message, 'error');
  }
};

// ==========================================================================
// CONFIGURAÇÕES & STATUS BLING OAUTH
// ==========================================================================
async function loadAppConfig() {
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      state.appConfig = await response.json();
      if (state.appConfig?.authorizeUrl && elements.btnAuthorizeLink) {
        elements.btnAuthorizeLink.href = state.appConfig.authorizeUrl;
      }
    }
  } catch (e) {}
}

async function checkBlingAuthStatus() {
  try {
    const response = await fetch('/api/auth/status');
    if (!response.ok) return;
    const data = await response.json();
    state.isBlingAuthenticated = data.authenticated && !data.isExpired;

    if (state.isBlingAuthenticated) {
      if (elements.apiStatusBadge) elements.apiStatusBadge.className = 'api-status-badge connected';
      if (elements.apiStatusText) elements.apiStatusText.textContent = 'Bling Conectado';
      if (elements.dashBlingStatusText) elements.dashBlingStatusText.textContent = 'Conectado (API v3)';
      if (elements.modalTokenStatusText) {
        elements.modalTokenStatusText.textContent = `Ativo (Expira em: ${formatDateTime(data.expires_at)})`;
        elements.modalTokenStatusText.style.color = 'var(--bling-green)';
      }
      if (elements.btnLogoutToken) elements.btnLogoutToken.style.display = 'inline-block';
    } else {
      if (elements.apiStatusBadge) elements.apiStatusBadge.className = 'api-status-badge';
      if (elements.apiStatusText) elements.apiStatusText.textContent = 'Bling Não Conectado';
      if (elements.dashBlingStatusText) elements.dashBlingStatusText.textContent = 'Não Conectado';
      if (elements.modalTokenStatusText) {
        elements.modalTokenStatusText.textContent = data.authenticated ? 'Token Expirado' : 'Não Conectado';
        elements.modalTokenStatusText.style.color = 'var(--bling-orange)';
      }
      if (elements.btnLogoutToken) elements.btnLogoutToken.style.display = 'none';
    }
  } catch (e) {}
}

async function setDataSource(source) {
  state.dataSource = source;
  if (source === 'live') {
    elements.btnSourceLive.classList.add('active');
    elements.btnSourceDemo.classList.remove('active');
  } else {
    elements.btnSourceLive.classList.remove('active');
    elements.btnSourceDemo.classList.add('active');
    showNotification('Visualizando dados em Modo Demonstração', 'info');
  }
  await switchERPView(state.currentModule);
}

async function handleExchangeCode() {
  if (!state.currentUser || state.currentUser.role !== 'superadmin') {
    showNotification('Ação restrita ao Super Administrador.', 'error');
    return;
  }
  const code = elements.inputAuthCode.value.trim();
  if (!code) {
    showNotification('Insira o código retornado ou a URL de redirecionamento', 'error');
    return;
  }

  elements.btnExchangeCode.disabled = true;
  elements.btnExchangeCode.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Autenticando...';

  try {
    await exchangeCodeDirect(code);
    elements.inputAuthCode.value = '';
    closeModal(elements.authModal);
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    elements.btnExchangeCode.disabled = false;
    elements.btnExchangeCode.innerHTML = '<i class="fa-solid fa-key"></i> Autenticar e Salvar no Supabase';
  }
}

async function exchangeCodeDirect(code) {
  const response = await fetch('/api/auth/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.authToken}` },
    body: JSON.stringify({ code })
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.details?.error_description || result.error || 'Falha ao autenticar com o Bling');

  showNotification('Autenticação com o Bling realizada e salva no Supabase!', 'success');
  await checkBlingAuthStatus();
  setDataSource('live');
}

async function handleSaveManualToken() {
  if (!state.currentUser || state.currentUser.role !== 'superadmin') {
    showNotification('Ação restrita ao Super Administrador.', 'error');
    return;
  }
  const access_token = elements.inputManualToken.value.trim();
  if (!access_token) {
    showNotification('Cole o token de acesso no campo', 'error');
    return;
  }

  try {
    const response = await fetch('/api/auth/set-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.authToken}` },
      body: JSON.stringify({ access_token })
    });

    if (response.ok) {
      showNotification('Token salvo no Supabase com sucesso!', 'success');
      elements.inputManualToken.value = '';
      closeModal(elements.authModal);
      await checkBlingAuthStatus();
      setDataSource('live');
    }
  } catch (err) {
    showNotification('Erro ao salvar token: ' + err.message, 'error');
  }
}

async function handleLogoutBling() {
  if (!confirm('Deseja realmente desconectar a integração com o Bling?')) return;
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    showNotification('Integração com o Bling desconectada.', 'info');
    await checkBlingAuthStatus();
    setDataSource('demo');
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

// ==========================================================================
// CADASTRO DE NOVO PRODUTO / SERVIÇO NO BLING (API v3)
// ==========================================================================
window.openNewProductModal = function() {
  if (elements.formNewProduct) elements.formNewProduct.reset();
  if (elements.modalNewProduct) openModal(elements.modalNewProduct);
};

async function handleCreateProduct(e) {
  e.preventDefault();

  const nome = document.getElementById('prodNome').value.trim();
  const codigo = document.getElementById('prodCodigo').value.trim();
  const tipo = document.getElementById('prodTipo').value;
  const categoria = document.getElementById('prodCategoria').value.trim();
  const unidade = document.getElementById('prodUnidade').value;
  const preco = parseFloat(document.getElementById('prodPreco').value) || 0;
  const precoCusto = parseFloat(document.getElementById('prodPrecoCusto').value) || 0;
  const estoque = parseInt(document.getElementById('prodEstoque').value, 10) || 0;
  const ncm = document.getElementById('prodNcm').value.trim();
  const imagemURL = document.getElementById('prodImagemURL')?.value?.trim() || '';
  const observacoes = document.getElementById('prodObservacoes').value.trim();

  if (!nome) {
    showNotification('O nome do produto é obrigatório.', 'error');
    return;
  }

  const btnSubmit = document.getElementById('btnSubmitNewProduct');
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando no Bling...';

  try {
    const payload = {
      nome,
      codigo,
      tipo,
      categoria,
      unidade,
      preco,
      precoCusto,
      estoque,
      ncm,
      imagemURL,
      observacoes
    };

    const response = await fetch('/api/produtos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || result.details?.error_description || 'Erro ao cadastrar produto');

    showNotification('Produto cadastrado com sucesso no Bling & Supabase!', 'success');
    closeModal(elements.modalNewProduct);
    elements.formNewProduct.reset();

    // Se estiver na tela de produtos ou serviços, recarrega a lista
    if (state.currentModule === 'products' || state.currentModule === 'services') {
      await loadModuleData(state.currentModule);
    } else {
      await switchERPView('products');
    }
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar no Bling & Supabase';
  }
}

// Helpers
function openModal(modal) { modal.classList.add('active'); }
function closeModal(modal) { modal.classList.remove('active'); }

function showNotification(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info');
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function showLoading(isLoading) {
  elements.tableLoadingState.style.display = isLoading ? 'flex' : 'none';
  if (isLoading) elements.tableEmptyState.style.display = 'none';
}

function showEmptyState(isEmpty) {
  elements.tableEmptyState.style.display = isEmpty ? 'flex' : 'none';
}

function formatDocument(doc) {
  if (!doc) return '--';
  const clean = String(doc).replace(/\D/g, '');
  if (clean.length === 11) return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (clean.length === 14) return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return doc;
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

function formatDateTime(isoStr) {
  if (!isoStr) return '--';
  return new Date(isoStr).toLocaleString('pt-BR');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
