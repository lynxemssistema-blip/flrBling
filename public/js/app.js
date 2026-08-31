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
  allUsers: [],
  allProfiles: [],
  adminUsersFilter: '',
  editingProfileId: null,
  editingUserId: null
};

// Definições de Permissões por Módulo do Sistema FLR Bling
const MODULE_PERMISSION_DEFINITIONS = [
  {
    key: 'dashboard',
    title: 'Dashboard Geral',
    category: 'Visão Executiva',
    icon: 'fa-gauge-high',
    actions: [
      { key: 'view', label: 'Visualizar Dashboard e Indicadores' }
    ]
  },
  {
    key: 'clients',
    title: 'Clientes & Contatos',
    category: 'Cadastros',
    icon: 'fa-users',
    actions: [
      { key: 'view', label: 'Visualizar Clientes' },
      { key: 'create', label: 'Cadastrar Novo Cliente' },
      { key: 'edit', label: 'Editar Dados do Cliente' },
      { key: 'delete', label: 'Excluir Cliente' },
      { key: 'complement', label: 'Salvar Complementos FLR' }
    ]
  },
  {
    key: 'products',
    title: 'Produtos & Materiais',
    category: 'Cadastros',
    icon: 'fa-boxes-stacked',
    actions: [
      { key: 'view', label: 'Visualizar Produtos' },
      { key: 'create', label: 'Cadastrar Produto' },
      { key: 'edit', label: 'Editar Produto' },
      { key: 'delete', label: 'Excluir Produto' }
    ]
  },
  {
    key: 'services',
    title: 'Catálogo de Serviços',
    category: 'Cadastros',
    icon: 'fa-screwdriver-wrench',
    actions: [
      { key: 'view', label: 'Visualizar Serviços' },
      { key: 'create', label: 'Cadastrar Serviço' },
      { key: 'edit', label: 'Editar Serviço' },
      { key: 'delete', label: 'Excluir Serviço' }
    ]
  },
  {
    key: 'categories',
    title: 'Categorias',
    category: 'Cadastros',
    icon: 'fa-tags',
    actions: [
      { key: 'view', label: 'Visualizar Categorias' },
      { key: 'create', label: 'Criar Categoria' },
      { key: 'edit', label: 'Editar Categoria' },
      { key: 'delete', label: 'Excluir Categoria' }
    ]
  },
  {
    key: 'orders',
    title: 'Pedidos de Venda',
    category: 'Vendas & Comercial',
    icon: 'fa-cart-shopping',
    actions: [
      { key: 'view', label: 'Visualizar Pedidos' },
      { key: 'create', label: 'Criar Novo Pedido' },
      { key: 'edit', label: 'Editar Pedido' },
      { key: 'delete', label: 'Excluir Pedido' }
    ]
  },
  {
    key: 'proposals',
    title: 'Propostas Comerciais',
    category: 'Vendas & Comercial',
    icon: 'fa-file-signature',
    actions: [
      { key: 'view', label: 'Visualizar Propostas' },
      { key: 'create', label: 'Criar Nova Proposta' },
      { key: 'edit', label: 'Editar Proposta' },
      { key: 'delete', label: 'Excluir Proposta' }
    ]
  },
  {
    key: 'sellers',
    title: 'Vendedores & Consultores',
    category: 'Vendas & Comercial',
    icon: 'fa-user-tie',
    actions: [
      { key: 'view', label: 'Visualizar Vendedores' },
      { key: 'create', label: 'Cadastrar Vendedor' },
      { key: 'edit', label: 'Editar Vendedor' },
      { key: 'delete', label: 'Excluir Vendedor' }
    ]
  },
  {
    key: 'nfe',
    title: 'Notas Fiscais (NF-e)',
    category: 'Fiscal & Documentos',
    icon: 'fa-file-invoice-dollar',
    actions: [
      { key: 'view', label: 'Visualizar Notas Fiscais' },
      { key: 'create', label: 'Digitar Nota Manual' },
      { key: 'import_xml', label: 'Importar Arquivo XML' },
      { key: 'delete', label: 'Excluir Nota Fiscal' }
    ]
  },
  {
    key: 'serviceOrders',
    title: 'Ordens de Serviço (OS)',
    category: 'Serviços & Operacional',
    icon: 'fa-helmet-safety',
    actions: [
      { key: 'view', label: 'Visualizar Ordens de Serviço' },
      { key: 'create', label: 'Criar Nova OS' },
      { key: 'edit', label: 'Editar OS' },
      { key: 'delete', label: 'Excluir OS' }
    ]
  },
  {
    key: 'stock',
    title: 'Saldos de Estoque',
    category: 'Serviços & Operacional',
    icon: 'fa-warehouse',
    actions: [
      { key: 'view', label: 'Visualizar Saldos de Estoque' },
      { key: 'adjust', label: 'Lançar Acerto de Estoque' }
    ]
  },
  {
    key: 'receivables',
    title: 'Contas a Receber',
    category: 'Financeiro',
    icon: 'fa-hand-holding-dollar',
    actions: [
      { key: 'view', label: 'Visualizar Contas a Receber' },
      { key: 'create', label: 'Lançar Conta a Receber' },
      { key: 'edit', label: 'Editar Lançamento' },
      { key: 'delete', label: 'Excluir Lançamento' }
    ]
  },
  {
    key: 'payables',
    title: 'Contas a Pagar',
    category: 'Financeiro',
    icon: 'fa-money-bill-wave',
    actions: [
      { key: 'view', label: 'Visualizar Contas a Pagar' },
      { key: 'create', label: 'Lançar Conta a Pagar' },
      { key: 'edit', label: 'Editar Lançamento' },
      { key: 'delete', label: 'Excluir Lançamento' }
    ]
  },
  {
    key: 'users_admin',
    title: 'Gestão de Usuários & Perfis',
    category: 'Administração do Sistema',
    icon: 'fa-users-gear',
    actions: [
      { key: 'manage_users', label: 'Gerenciar Usuários e Status' },
      { key: 'manage_profiles', label: 'Criar e Editar Perfis de Acesso' }
    ]
  },
  {
    key: 'bling_settings',
    title: 'Integração Bling API v3',
    category: 'Administração do Sistema',
    icon: 'fa-plug-circle-bolt',
    actions: [
      { key: 'manage_connection', label: 'Conectar / Desconectar e Renovar OAuth' }
    ]
  },
  {
    key: 'projects',
    title: 'Projetos & Obras',
    category: 'Operação FLR',
    icon: 'fa-helmet-safety',
    actions: [
      { key: 'view', label: 'Visualizar Projetos' },
      { key: 'create', label: 'Criar Projeto' },
      { key: 'edit', label: 'Editar Projeto' },
      { key: 'delete', label: 'Excluir Projeto' }
    ]
  },
  {
    key: 'kits',
    title: 'Kits de Produtos',
    category: 'Operação FLR',
    icon: 'fa-layer-group',
    actions: [
      { key: 'view', label: 'Visualizar Kits' },
      { key: 'create', label: 'Criar Kit' },
      { key: 'edit', label: 'Editar Kit' },
      { key: 'delete', label: 'Excluir Kit' }
    ]
  },
  {
    key: 'quotes',
    title: 'Construtor de Orçamentos',
    category: 'Operação FLR',
    icon: 'fa-file-invoice-dollar',
    actions: [
      { key: 'view', label: 'Visualizar Orçamentos' },
      { key: 'create', label: 'Criar Orçamento' },
      { key: 'edit', label: 'Editar Orçamento' },
      { key: 'delete', label: 'Excluir Orçamento' }
    ]
  }
];

// Helper: Checagem Central de Permissões
window.hasPermission = function(moduleKey, action = 'view') {
  if (!state.currentUser) return false;
  if (state.currentUser.role === 'superadmin') return true;

  const permissions = state.currentUser.profile?.permissions;
  if (!permissions) {
    // Se não tiver perfil definido mas tiver role de admin
    if (state.currentUser.role === 'admin') {
      return moduleKey !== 'bling_settings' && moduleKey !== 'users_admin';
    }
    return action === 'view';
  }

  const mod = permissions[moduleKey];
  if (!mod) return false;
  return mod[action] === true;
};

// Module Definitions Metadata
const MODULE_CONFIG = {
  dashboard: {
    title: 'Dashboard Geral',
    category: 'Visão Executiva',
    endpoint: 'dashboard-summary'
  },
  projects: {
    title: 'Projetos & Obras (Verbas de Material)',
    category: 'Operação FLR',
    endpoint: 'projetos',
    demoKey: 'projetos',
    columns: ['Código', 'Nome da Obra / Projeto', 'Cliente', 'Verba Total', 'Verba Material', 'Gasto em NF-e', 'Saldo Verba', 'Status', 'Ações'],
    filterTypeLabel: 'Status da Obra',
    filterTypeOptions: [
      { val: 'em_andamento', label: 'Em Andamento' },
      { val: 'planejamento', label: 'Planejamento' },
      { val: 'concluido', label: 'Concluído' }
    ],
    filterSituationOptions: []
  },
  quotes: {
    title: 'Construtor de Orçamentos',
    category: 'Operação FLR',
    endpoint: 'orcamentos',
    demoKey: 'pedidos',
    columns: ['Número', 'Cliente', 'Título', 'Data', 'Validade', 'Total', 'Status', 'Origem / Bling', 'Ações'],
    filterTypeLabel: 'Status',
    filterTypeOptions: [
      { val: 'rascunho', label: 'Rascunho' },
      { val: 'apresentado', label: 'Apresentado' },
      { val: 'aprovado', label: 'Aprovado' },
      { val: 'cancelado', label: 'Cancelado' }
    ],
    filterSituationOptions: []
  },
  kits: {
    title: 'Kits de Produtos',
    category: 'Operação FLR',
    endpoint: 'kits',
    demoKey: 'produtos',
    columns: ['Código', 'Nome do Kit', 'Itens', 'Preço Total', 'Preço Fixo?', 'Ativo', 'Ações'],
    filterTypeLabel: 'Status',
    filterTypeOptions: [{ val: 'true', label: 'Ativos' }, { val: 'false', label: 'Inativos' }],
    filterSituationOptions: []
  },
  serviceOrders: {
    title: 'Ordens de Serviço (OS)',
    category: 'Operação FLR',
    endpoint: 'ordens-servicos',
    demoKey: 'ordensServicos',
    columns: ['Número OS', 'Cliente', 'Descrição do Serviço', 'Responsável Técnico', 'Abertura', 'Previsão', 'Valor Total', 'Situação', 'Ações'],
    filterTypeLabel: 'Responsável',
    filterTypeOptions: [{ val: 'Equipe Alpha', label: 'Equipe Alpha' }, { val: 'Téc. Fernando', label: 'Téc. Fernando' }],
    filterSituationOptions: [{ val: 'Em Execução', label: 'Em Execução' }, { val: 'Concluído', label: 'Concluído' }, { val: 'Aguardando Peças', label: 'Aguardando Peças' }]
  },
  nfe: {
    title: 'Entrada de Notas Fiscais (NF-e com De-Para)',
    category: 'Compras & Estoque',
    endpoint: 'nfe-entradas',
    demoKey: 'nfe',
    columns: ['Número / Série', 'Fornecedor', 'Data Emissão', 'Destino Estoque', 'Projeto / Obra', 'Valor Total', 'De-Para Status', 'Ações'],
    filterTypeLabel: 'Destino',
    filterTypeOptions: [{ val: 'flr', label: 'Almoxarifado FLR' }, { val: 'projeto', label: 'Obra / Projeto' }, { val: 'ambos', label: 'Ambos' }],
    filterSituationOptions: [{ val: 'concluido', label: 'Concluídas' }, { val: 'rascunho', label: 'Rascunhos' }]
  },
  stock: {
    title: 'Almoxarifado & Saldos de Estoque',
    category: 'Compras & Estoque',
    endpoint: 'estoques/saldos',
    demoKey: 'produtos',
    columns: ['Código', 'Descrição do Material', 'Origem', 'Saldo Almoxarifado', 'Saldo Reservado', 'Disponível', 'Ações'],
    filterTypeLabel: 'Depósito',
    filterTypeOptions: [{ val: 'Geral', label: 'Depósito Central FLR' }],
    filterSituationOptions: [{ val: 'A', label: 'Com Saldo' }]
  },
  clients: {
    title: 'Clientes & Contatos',
    category: 'Cadastros',
    endpoint: 'contatos',
    demoKey: 'clientes',
    columns: ['Código', 'Nome / Razão Social', 'Tipo', 'CPF / CNPJ', 'E-mail', 'Telefone', 'Origem', 'Situação', 'Ações'],
    filterTypeLabel: 'Tipo de Pessoa',
    filterTypeOptions: [{ val: 'J', label: 'Pessoa Jurídica (PJ)' }, { val: 'F', label: 'Pessoa Física (PF)' }],
    filterSituationOptions: [{ val: 'A', label: 'Ativos' }, { val: 'I', label: 'Inativos' }]
  },
  products: {
    title: 'Produtos & Materiais',
    category: 'Cadastros',
    endpoint: 'produtos',
    demoKey: 'produtos',
    columns: ['Foto', 'Código', 'Descrição do Produto', 'Categoria', 'Preço Venda', 'Preço Custo', 'Estoque', 'Origem', 'Situação', 'Ações'],
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
  categories: {
    title: 'Categorias de Produtos & Serviços',
    category: 'Cadastros',
    endpoint: 'categorias/produtos',
    demoKey: 'produtos',
    columns: ['ID', 'Descrição da Categoria', 'Situação', 'Ações'],
    filterTypeLabel: 'Tipo',
    filterTypeOptions: [{ val: 'Geral', label: 'Geral' }],
    filterSituationOptions: [{ val: 'A', label: 'Ativas' }]
  },
  orders: {
    title: 'Pedidos de Venda',
    category: 'Comercial Bling',
    endpoint: 'pedidos-vendas',
    demoKey: 'pedidos',
    columns: ['Número', 'Cliente', 'Data', 'Vendedor', 'Itens', 'Valor Total', 'Situação', 'Ações'],
    filterTypeLabel: 'Vendedor',
    filterTypeOptions: [{ val: 'Roberto Andrade', label: 'Roberto Andrade' }, { val: 'Ana Paula Silva', label: 'Ana Paula Silva' }],
    filterSituationOptions: [{ val: 'Atendido', label: 'Atendido' }, { val: 'Em andamento', label: 'Em andamento' }, { val: 'Pendente', label: 'Pendente' }]
  },
  proposals: {
    title: 'Propostas no Bling',
    category: 'Comercial Bling',
    endpoint: 'propostas-comerciais',
    demoKey: 'propostas',
    columns: ['Número', 'Cliente', 'Data Emissão', 'Validade', 'Valor Total', 'Situação', 'Ações'],
    filterTypeLabel: 'Status Proposta',
    filterTypeOptions: [{ val: 'Aprovada', label: 'Aprovada' }, { val: 'Em Negociação', label: 'Em Negociação' }],
    filterSituationOptions: [{ val: 'Aprovada', label: 'Aprovada' }, { val: 'Em Negociação', label: 'Em Negociação' }]
  },
  sellers: {
    title: 'Vendedores & Consultores Comerciais',
    category: 'Comercial Bling',
    endpoint: 'vendedores',
    demoKey: 'pedidos',
    columns: ['ID', 'Nome do Vendedor / Consultor', 'Comissão (%)', 'Situação', 'Ações'],
    filterTypeLabel: 'Tipo',
    filterTypeOptions: [{ val: 'interno', label: 'Vendedor Interno' }],
    filterSituationOptions: [{ val: 'A', label: 'Ativos' }]
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

  // Nova Nota Fiscal (NF-e) Modal
  modalNewNfe: document.getElementById('modalNewNfe'),
  btnCloseNewNfeModal: document.getElementById('btnCloseNewNfeModal'),
  btnCloseNewNfeModalFooter: document.getElementById('btnCloseNewNfeModalFooter'),
  tabBtnNfeXml: document.getElementById('tabBtnNfeXml'),
  tabBtnNfeManual: document.getElementById('tabBtnNfeManual'),
  nfePaneXml: document.getElementById('nfePaneXml'),
  nfePaneManual: document.getElementById('nfePaneManual'),
  nfeXmlDropZone: document.getElementById('nfeXmlDropZone'),
  nfeXmlFileInput: document.getElementById('nfeXmlFileInput'),
  xmlParsedPreview: document.getElementById('xmlParsedPreview'),
  xmlItemsTableBody: document.getElementById('xmlItemsTableBody'),
  manualNfeItemsBody: document.getElementById('manualNfeItemsBody'),

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
  if (codeParam && elements.loginModal) {
    openModal(elements.loginModal);
    showNotification('Código de autorização do Bling detectado! Faça login para ativar.', 'info');
  }
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
  applyUIPermissions();
  await checkBlingAuthStatus();

  // Se o Bling já estiver autenticado, ativa automaticamente os dados reais (live)
  if (state.isBlingAuthenticated) {
    state.dataSource = 'live';
    if (elements.btnSourceLive) elements.btnSourceLive.classList.add('active');
    if (elements.btnSourceDemo) elements.btnSourceDemo.classList.remove('active');
  }

  const isSuperadmin = state.currentUser && state.currentUser.role === 'superadmin';
  const canManageUsers = hasPermission('users_admin', 'manage_users') || hasPermission('users_admin', 'manage_profiles');
  const canManageBling = hasPermission('bling_settings', 'manage_connection');

  if (elements.superadminNavSection) elements.superadminNavSection.style.display = canManageUsers ? 'block' : 'none';
  if (elements.btnOpenAuthModal) elements.btnOpenAuthModal.style.display = canManageBling ? 'flex' : 'none';

  const navSettingsItem = document.getElementById('navOpenSettings');
  if (navSettingsItem) navSettingsItem.style.display = canManageBling ? 'flex' : 'none';

  if (canManageUsers) {
    loadProfilesList();
    loadUsersList();
  }

  if (isSuperadmin) {
    const pendingCode = sessionStorage.getItem('pending_bling_code');
    if (pendingCode) {
      sessionStorage.removeItem('pending_bling_code');
      showNotification('Código do Bling detectado! Conectando com a conta...', 'info');
      try {
        await exchangeCodeDirect(pendingCode);
        showNotification('🎉 Integração com o Bling autorizada e conectada com sucesso!', 'success');
      } catch (err) {
        showNotification('Aviso ao autorizar com o Bling: ' + err.message, 'error');
      }
    }
  }

  // Inicia na visão correspondente à página atual (ou Dashboard)
  let initialModule = document.body.dataset.page;
  if (!initialModule) {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('clientes')) initialModule = 'clients';
    else if (path.includes('produtos')) initialModule = 'products';
    else if (path.includes('servicos')) initialModule = 'services';
    else if (path.includes('pedidos')) initialModule = 'orders';
    else if (path.includes('propostas')) initialModule = 'proposals';
    else if (path.includes('nfe')) initialModule = 'nfe';
    else if (path.includes('ordens-servico') || path.includes('os')) initialModule = 'serviceOrders';
    else if (path.includes('contas-receber')) initialModule = 'receivables';
    else if (path.includes('contas-pagar')) initialModule = 'payables';
    else if (path.includes('estoque')) initialModule = 'stock';
    else if (path.includes('kits')) initialModule = 'kits';
    else if (path.includes('orcamentos') || path.includes('quotes')) initialModule = 'quotes';
    else initialModule = 'dashboard';
  }

  await switchERPView(initialModule);
}

// Aplica visualmente as permissões do perfil do usuário em toda a interface
window.applyUIPermissions = function() {
  if (!state.currentUser) return;

  const navPermissionMap = {
    navDashboard: 'dashboard',
    navClients: 'clients',
    navProducts: 'products',
    navServices: 'services',
    navCategories: 'categories',
    navOrders: 'orders',
    navProposals: 'proposals',
    navSellers: 'sellers',
    navNfe: 'nfe',
    navServiceOrders: 'serviceOrders',
    navReceivables: 'receivables',
    navPayables: 'payables',
    navStock: 'stock',
    navKits: 'kits',
    navQuotes: 'quotes'
  };

  Object.entries(navPermissionMap).forEach(([elemId, modKey]) => {
    const elem = document.getElementById(elemId);
    if (elem) {
      const isAllowed = hasPermission(modKey, 'view');
      elem.style.display = isAllowed ? 'flex' : 'none';
    }
  });

  const canUsers = hasPermission('users_admin', 'manage_users') || hasPermission('users_admin', 'manage_profiles');
  if (elements.superadminNavSection) {
    elements.superadminNavSection.style.display = canUsers ? 'block' : 'none';
  }
};

window.switchERPView = async function(moduleKey) {
  state.currentModule = moduleKey;

  // Garante que nenhum modal anterior permaneça aberto ao navegar entre menus
  document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));

  const unauthPane = document.getElementById('erpViewUnauthorized');

  // Verifica se o usuário tem permissão de visualização para este módulo
  if (!hasPermission(moduleKey, 'view')) {
    elements.erpViewDashboard.classList.remove('active');
    elements.erpViewTable.classList.remove('active');
    if (unauthPane) {
      unauthPane.classList.add('active');
      unauthPane.style.display = 'block';
    }
    const conf = MODULE_CONFIG[moduleKey] || { title: moduleKey };
    elements.bcCategoryName.textContent = 'Acesso Restrito';
    elements.bcViewName.textContent = conf.title || moduleKey;
    const msg = document.getElementById('unauthorizedMessage');
    if (msg) {
      msg.innerHTML = `Seu perfil atual (<strong>${escapeHtml(state.currentUser?.profile?.name || 'Usuário')}</strong>) não tem permissão para acessar a página <strong>${escapeHtml(conf.title || moduleKey)}</strong>. Contate o Super Administrador caso necessite desta liberação.`;
    }
    return;
  }

  if (unauthPane) {
    unauthPane.classList.remove('active');
    unauthPane.style.display = 'none';
  }

  // Atualiza classes ativas na Sidebar
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => item.classList.remove('active'));
  const activeNavMap = {
    dashboard: 'navDashboard',
    projects: 'navProjects',
    clients: 'navClients',
    products: 'navProducts',
    services: 'navServices',
    orders: 'navOrders',
    proposals: 'navProposals',
    nfe: 'navNfe',
    receivables: 'navReceivables',
    payables: 'navPayables',
    serviceOrders: 'navServiceOrders',
    stock: 'navStock',
    categories: 'navCategories',
    sellers: 'navSellers',
    kits: 'navKits',
    quotes: 'navQuotes'
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

  // Configura botão dinâmico de Ação Superior respeitando permissão de "create"
  const canCreate = hasPermission(moduleKey, 'create');

  if (elements.btnOpenNewItemModal) {
    if (!canCreate) {
      elements.btnOpenNewItemModal.style.display = 'none';
    } else {
      elements.btnOpenNewItemModal.style.display = 'inline-flex';
      if (moduleKey === 'projects') {
        if (elements.lblNewItemBtn) elements.lblNewItemBtn.innerHTML = '<i class="fa-solid fa-helmet-safety"></i> Novo Projeto / Obra';
        elements.btnOpenNewItemModal.onclick = () => openProjectModal();
        elements.btnOpenNewItemModal.title = 'Cadastrar Novo Projeto / Obra';
      } else if (moduleKey === 'clients') {
        if (elements.lblNewItemBtn) elements.lblNewItemBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Novo Cliente';
        elements.btnOpenNewItemModal.onclick = openNewClientModal;
        elements.btnOpenNewItemModal.title = 'Cadastrar Novo Cliente / Contato';
      } else if (moduleKey === 'products') {
        if (elements.lblNewItemBtn) elements.lblNewItemBtn.innerHTML = '<i class="fa-solid fa-boxes-stacked"></i> Novo Produto';
        elements.btnOpenNewItemModal.onclick = () => openNewProductModal('P');
        elements.btnOpenNewItemModal.title = 'Cadastrar Novo Produto ou Material';
      } else if (moduleKey === 'services') {
        if (elements.lblNewItemBtn) elements.lblNewItemBtn.innerHTML = '<i class="fa-solid fa-screwdriver-wrench"></i> Novo Serviço';
        elements.btnOpenNewItemModal.onclick = () => openNewProductModal('S');
        elements.btnOpenNewItemModal.title = 'Cadastrar Novo Serviço Técnico';
      } else if (moduleKey === 'orders') {
        if (elements.lblNewItemBtn) elements.lblNewItemBtn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Novo Pedido';
        elements.btnOpenNewItemModal.onclick = openNewOrderModal;
        elements.btnOpenNewItemModal.title = 'Criar Novo Pedido de Venda';
      } else if (moduleKey === 'proposals') {
        if (elements.lblNewItemBtn) elements.lblNewItemBtn.innerHTML = '<i class="fa-solid fa-file-signature"></i> Nova Proposta';
        elements.btnOpenNewItemModal.onclick = openNewOrderModal;
        elements.btnOpenNewItemModal.title = 'Criar Nova Proposta / Orçamento';
      } else if (moduleKey === 'nfe') {
        if (elements.lblNewItemBtn) elements.lblNewItemBtn.innerHTML = '<i class="fa-solid fa-receipt"></i> Nova Entrada / Importar XML';
        elements.btnOpenNewItemModal.onclick = () => openNfeEntryModal();
        elements.btnOpenNewItemModal.title = 'Entrada de Nota Fiscal com De-Para';
      } else if (moduleKey === 'serviceOrders') {
        if (elements.lblNewItemBtn) elements.lblNewItemBtn.innerHTML = '<i class="fa-solid fa-helmet-safety"></i> Nova Ordem de Serviço';
        elements.btnOpenNewItemModal.onclick = openNewServiceOrderModal;
        elements.btnOpenNewItemModal.title = 'Criar Nova Ordem de Serviço (OS)';
      } else if (moduleKey === 'receivables') {
        if (elements.lblNewItemBtn) elements.lblNewItemBtn.innerHTML = '<i class="fa-solid fa-hand-holding-dollar"></i> Nova Conta a Receber';
        elements.btnOpenNewItemModal.onclick = () => openNewFinanceModal('R');
        elements.btnOpenNewItemModal.title = 'Lançar Conta a Receber / Fatura';
      } else if (moduleKey === 'payables') {
        if (elements.lblNewItemBtn) elements.lblNewItemBtn.innerHTML = '<i class="fa-solid fa-money-bill-wave"></i> Nova Conta a Pagar';
        elements.btnOpenNewItemModal.onclick = () => openNewFinanceModal('P');
        elements.btnOpenNewItemModal.title = 'Lançar Conta a Pagar / Despesa';
      } else if (moduleKey === 'kits') {
        if (elements.lblNewItemBtn) elements.lblNewItemBtn.innerHTML = '<i class="fa-solid fa-layer-group"></i> Novo Kit';
        elements.btnOpenNewItemModal.onclick = () => openKitBuilder();
        elements.btnOpenNewItemModal.title = 'Criar Novo Kit de Produtos';
      } else if (moduleKey === 'quotes') {
        if (elements.lblNewItemBtn) elements.lblNewItemBtn.innerHTML = '<i class="fa-solid fa-file-invoice-dollar"></i> Novo Orçamento';
        elements.btnOpenNewItemModal.onclick = () => openQuoteBuilder();
        elements.btnOpenNewItemModal.title = 'Criar Novo Orçamento';
      } else {
        elements.btnOpenNewItemModal.style.display = 'none';
      }
    }
  }

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

    // Carrega últimos pedidos para o painel executivo
    const ordersRes = await fetch('/api/pedidos-vendas', {
      headers: state.authToken ? { 'Authorization': `Bearer ${state.authToken}` } : {}
    });
    if (ordersRes.ok) {
      const ordersData = await ordersRes.json();
      const recentOrders = (ordersData.data || []).slice(0, 4);
      const ordersBody = document.getElementById('dashRecentOrdersBody');
      if (ordersBody && recentOrders.length > 0) {
        ordersBody.innerHTML = recentOrders.map(ord => {
          const clientName = typeof ord.cliente === 'object' ? ord.cliente?.nome : (ord.cliente || '--');
          const sitClass = (ord.situacao === 'Atendido' || ord.situacao === 'Aprovada') ? 'active' : 'pending';
          return `
            <tr>
              <td><span class="text-mono font-bold" style="color: var(--bling-blue);">#${ord.numero || ord.id}</span></td>
              <td><strong>${escapeHtml(clientName)}</strong></td>
              <td><span class="text-mono">${formatDate(ord.data || ord.dataEmissao)}</span></td>
              <td style="text-align: right;"><span class="text-emerald font-bold">${formatCurrency(ord.total)}</span></td>
              <td style="text-align: center;"><span class="badge-status ${sitClass}">● ${escapeHtml(ord.situacao || 'Aberto')}</span></td>
            </tr>
          `;
        }).join('');
      }
    }

    // Carrega últimas Ordens de Serviço para o painel executivo
    const osRes = await fetch('/api/ordens-servicos', {
      headers: state.authToken ? { 'Authorization': `Bearer ${state.authToken}` } : {}
    });
    if (osRes.ok) {
      const osData = await osRes.json();
      const recentOs = (osData.data || []).slice(0, 4);
      const osBody = document.getElementById('dashRecentOsBody');
      if (osBody && recentOs.length > 0) {
        osBody.innerHTML = recentOs.map(os => {
          const clientName = typeof os.cliente === 'object' ? os.cliente?.nome : (os.cliente || '--');
          const sitClass = os.situacao === 'Concluído' ? 'active' : 'pending';
          return `
            <tr>
              <td><span class="text-mono font-bold" style="color: var(--bling-orange);">OS #${os.numero || os.id}</span></td>
              <td><strong>${escapeHtml(clientName)}</strong></td>
              <td><span class="badge-tag-custom">${escapeHtml(os.responsavel || '--')}</span></td>
              <td><span class="text-mono">${formatDate(os.dataPrevisao || os.dataAbertura)}</span></td>
              <td style="text-align: center;"><span class="badge-status ${sitClass}">● ${escapeHtml(os.situacao || 'Em Execução')}</span></td>
            </tr>
          `;
        }).join('');
      }
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
  if (elements.dynStatLabel1) elements.dynStatLabel1.textContent = 'Total de Registros';
  if (elements.dynStatVal1) elements.dynStatVal1.textContent = total;

  if (moduleKey === 'clients') {
    if (elements.dynStatLabel2) elements.dynStatLabel2.textContent = 'Clientes Ativos';
    if (elements.dynStatVal2) elements.dynStatVal2.textContent = items.filter(i => i.situacao === 'A').length;
    if (elements.dynStatLabel3) elements.dynStatLabel3.textContent = 'Pessoas Jurídicas (PJ)';
    if (elements.dynStatVal3) elements.dynStatVal3.textContent = items.filter(i => i.tipo === 'J').length;
    if (elements.dynStatLabel4) elements.dynStatLabel4.textContent = 'Pessoas Físicas (PF)';
    if (elements.dynStatVal4) elements.dynStatVal4.textContent = items.filter(i => i.tipo === 'F').length;
  } else if (moduleKey === 'products' || moduleKey === 'services') {
    if (elements.dynStatLabel2) elements.dynStatLabel2.textContent = 'Itens Ativos';
    if (elements.dynStatVal2) elements.dynStatVal2.textContent = items.filter(i => i.situacao === 'A').length;
    if (elements.dynStatLabel3) elements.dynStatLabel3.textContent = 'Média de Preço';
    const avg = items.length ? items.reduce((acc, p) => {
      const val = typeof p.preco === 'object' ? (p.preco?.preco || 0) : (p.preco || 0);
      return acc + val;
    }, 0) / items.length : 0;
    if (elements.dynStatVal3) elements.dynStatVal3.textContent = formatCurrency(avg);
    if (elements.dynStatLabel4) elements.dynStatLabel4.textContent = 'Total em Estoque';
    const totalEst = items.reduce((acc, p) => {
      let est = 0;
      if (typeof p.estoque === 'object' && p.estoque !== null) {
        est = p.estoque.saldoFisicoTotal || p.estoque.saldoVirtualTotal || 0;
      } else if (typeof p.estoque === 'number') {
        est = p.estoque;
      }
      return acc + est;
    }, 0);
    if (elements.dynStatVal4) elements.dynStatVal4.textContent = totalEst;
  } else if (moduleKey === 'orders' || moduleKey === 'proposals') {
    if (elements.dynStatLabel2) elements.dynStatLabel2.textContent = 'Total Faturado';
    const sum = items.reduce((acc, o) => acc + (o.total || 0), 0);
    if (elements.dynStatVal2) elements.dynStatVal2.textContent = formatCurrency(sum);
    if (elements.dynStatLabel3) elements.dynStatLabel3.textContent = 'Atendidos / Aprovados';
    if (elements.dynStatVal3) elements.dynStatVal3.textContent = items.filter(i => i.situacao === 'Atendido' || i.situacao === 'Aprovada').length;
    if (elements.dynStatLabel4) elements.dynStatLabel4.textContent = 'Em Andamento';
    if (elements.dynStatVal4) elements.dynStatVal4.textContent = items.filter(i => i.situacao === 'Em andamento' || i.situacao === 'Em Negociação').length;
  } else if (moduleKey === 'serviceOrders') {
    if (elements.dynStatLabel2) elements.dynStatLabel2.textContent = 'Em Execução';
    if (elements.dynStatVal2) elements.dynStatVal2.textContent = items.filter(i => i.situacao === 'Em Execução').length;
    if (elements.dynStatLabel3) elements.dynStatLabel3.textContent = 'Concluídas';
    if (elements.dynStatVal3) elements.dynStatVal3.textContent = items.filter(i => i.situacao === 'Concluído').length;
    if (elements.dynStatLabel4) elements.dynStatLabel4.textContent = 'Aguardando';
    if (elements.dynStatVal4) elements.dynStatVal4.textContent = items.filter(i => i.situacao === 'Aguardando Peças').length;
  } else if (moduleKey === 'receivables' || moduleKey === 'payables') {
    if (elements.dynStatLabel2) elements.dynStatLabel2.textContent = 'Valor Total';
    const sum = items.reduce((acc, f) => acc + (f.valor || 0), 0);
    if (elements.dynStatVal2) elements.dynStatVal2.textContent = formatCurrency(sum);
    if (elements.dynStatLabel3) elements.dynStatLabel3.textContent = 'Abertas';
    if (elements.dynStatVal3) elements.dynStatVal3.textContent = items.filter(i => i.situacao === 'Aberta').length;
    if (elements.dynStatLabel4) elements.dynStatLabel4.textContent = 'Liquidadas / Pagas';
    if (elements.dynStatVal4) elements.dynStatVal4.textContent = items.filter(i => i.situacao === 'Liquidada' || i.situacao === 'Paga').length;
  } else if (moduleKey === 'nfe') {
    if (elements.dynStatLabel1) elements.dynStatLabel1.textContent = 'Total de Notas';
    if (elements.dynStatVal1) elements.dynStatVal1.textContent = total;
    if (elements.dynStatLabel2) elements.dynStatLabel2.textContent = 'Entradas (Compras)';
    if (elements.dynStatVal2) elements.dynStatVal2.textContent = items.filter(i => i.tipo === 0 || i.tipo === 'E' || i.tipoOperacao === 'E' || i.tipo === '0').length;
    if (elements.dynStatLabel3) elements.dynStatLabel3.textContent = 'Saídas (Vendas)';
    if (elements.dynStatVal3) elements.dynStatVal3.textContent = items.filter(i => i.tipo === 1 || i.tipo === 'S' || i.tipoOperacao === 'S' || i.tipo === '1').length;
    if (elements.dynStatLabel4) elements.dynStatLabel4.textContent = 'Total em Notas (R$)';
    const sum = items.reduce((acc, n) => acc + (n.valorNota || n.valorTotal || n.total || 0), 0);
    if (elements.dynStatVal4) elements.dynStatVal4.textContent = formatCurrency(sum);
  } else if (moduleKey === 'kits') {
    if (elements.dynStatLabel2) elements.dynStatLabel2.textContent = 'Kits Ativos';
    if (elements.dynStatVal2) elements.dynStatVal2.textContent = items.filter(i => i.ativo !== false).length;
    if (elements.dynStatLabel3) elements.dynStatLabel3.textContent = 'Com Preço Fixo';
    if (elements.dynStatVal3) elements.dynStatVal3.textContent = items.filter(i => i.usar_preco_fixo).length;
    if (elements.dynStatLabel4) elements.dynStatLabel4.textContent = 'Total de Produtos em Kits';
    if (elements.dynStatVal4) elements.dynStatVal4.textContent = items.reduce((s, k) => s + (k.itens || []).length, 0);
  } else if (moduleKey === 'quotes') {
    if (elements.dynStatLabel2) elements.dynStatLabel2.textContent = 'Aprovados';
    if (elements.dynStatVal2) elements.dynStatVal2.textContent = items.filter(i => i.status === 'aprovado').length;
    if (elements.dynStatLabel3) elements.dynStatLabel3.textContent = 'Total Orçado';
    const sumOrc = items.reduce((acc, q) => acc + (q.total_final || 0), 0);
    if (elements.dynStatVal3) elements.dynStatVal3.textContent = formatCurrency(sumOrc);
    if (elements.dynStatLabel4) elements.dynStatLabel4.textContent = 'Exportados ao Bling';
    if (elements.dynStatVal4) elements.dynStatVal4.textContent = items.filter(i => i.bling_pedido_id || i.bling_proposta_id).length;
  }
}

// ==========================================================================
// RENDERIZAÇÃO DA TABELA MULTI-MÓDULO
// ==========================================================================
function renderGenericTable() {
  const total = state.filteredData.length;
  if (elements.recordsBadge) elements.recordsBadge.textContent = `${total} registros`;

  if (total === 0) {
    if (elements.genericTableBody) elements.genericTableBody.innerHTML = '';
    if (elements.emptyStateMessage) elements.emptyStateMessage.textContent = 'Nenhum registro atende aos filtros aplicados.';
    showEmptyState(true);
    updatePagination(0);
    return;
  }

  showEmptyState(false);

  const startIdx = (state.currentPage - 1) * state.pageSize;
  const endIdx = Math.min(startIdx + state.pageSize, total);
  const pageItems = state.filteredData.slice(startIdx, endIdx);

  if (elements.genericTableBody) {
    elements.genericTableBody.innerHTML = pageItems.map(item => {
      return generateRowHTML(state.currentModule, item);
    }).join('');
  }

  updatePagination(total);
}

function updatePagination(total) {
  if (total === 0) {
    if (elements.paginationInfo) elements.paginationInfo.textContent = 'Mostrando 0 de 0 registros';
    if (elements.currentPageNumber) elements.currentPageNumber.textContent = 'Página 1';
    if (elements.btnPrevPage) elements.btnPrevPage.disabled = true;
    if (elements.btnNextPage) elements.btnNextPage.disabled = true;
    return;
  }

  const start = (state.currentPage - 1) * state.pageSize + 1;
  const end = Math.min(state.currentPage * state.pageSize, total);
  const totalPages = Math.ceil(total / state.pageSize) || 1;

  if (elements.paginationInfo) elements.paginationInfo.textContent = `Mostrando ${start} a ${end} de ${total} registros`;
  if (elements.currentPageNumber) elements.currentPageNumber.textContent = `Página ${state.currentPage} de ${totalPages}`;
  if (elements.btnPrevPage) elements.btnPrevPage.disabled = state.currentPage <= 1;
  if (elements.btnNextPage) elements.btnNextPage.disabled = state.currentPage >= totalPages;
}

function generateRowHTML(mod, item) {
  const canEdit = hasPermission(mod, 'edit');

  if (mod === 'clients') {
    const isPj = item.tipo === 'J';
    const situacaoClass = item.situacao === 'A' ? 'active' : 'inactive';
    const situacaoLabel = item.situacao === 'A' ? 'Ativo' : 'Inativo';
  if (mod === 'clients') {
    const isPj = item.tipo === 'J' || item.tipoPessoa === 'J';
    const situacaoLabel = item.situacao === 'A' ? 'Ativo' : 'Inativo';
    const situacaoClass = item.situacao === 'A' ? 'active' : 'inactive';
    const contato = item.celular || item.telefone || '--';
    const cidadeUf = item.endereco?.geral?.municipio ? `${item.endereco.geral.municipio}/${item.endereco.geral.uf || ''}` : '--';
    const isBling = !(item.id && String(item.id).includes('-'));
    const originBadge = isBling
      ? '<span class="origin-tag origin-bling"><i class="fa-solid fa-cloud"></i> Bling</span>'
      : '<span class="origin-tag origin-app"><i class="fa-solid fa-cube"></i> App FLR</span>';

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
        <td style="text-align:center;">${originBadge}</td>
        <td style="text-align: center;"><span class="badge-status ${situacaoClass}">● ${situacaoLabel}</span></td>
        <td style="text-align: right;" onclick="event.stopPropagation();">
          <button class="btn-view-action" onclick="openClientDetails(${item.id})"><i class="fa-solid fa-eye"></i> Ver</button>
          ${canEdit ? `<button class="btn-view-action" style="color: var(--bling-blue); border-color: rgba(22, 101, 216, 0.25); margin-left: 4px;" onclick="openEditModal('clients', ${item.id})"><i class="fa-solid fa-pen"></i> Editar</button>` : ''}
        </td>
      </tr>
    `;
  }

  // Projetos & Obras (Verbas de Material)
  if (mod === 'projects') {
    const verbaOrcada = parseFloat(item.verba_material_orcada) || 0;
    const verbaGasta = parseFloat(item.verba_material_gasta) || 0;
    const saldoRestante = verbaOrcada - verbaGasta;
    const pct = verbaOrcada > 0 ? Math.min(100, Math.round((verbaGasta / verbaOrcada) * 100)) : 0;
    let progressColor = '#10B981';
    if (pct >= 90) progressColor = '#EF4444';
    else if (pct >= 70) progressColor = '#F59E0B';

    const statusLabels = { planejamento: 'Planejamento', em_andamento: 'Em Andamento', pausado: 'Pausado', concluido: 'Concluído', cancelado: 'Cancelado' };
    const statusClasses = { planejamento: 'pending', em_andamento: 'active', pausado: 'pending', concluido: 'active', cancelado: 'inactive' };

    return `
      <tr>
        <td><span class="text-mono font-bold" style="color:var(--bling-blue);">${escapeHtml(item.codigo || '—')}</span></td>
        <td>
          <strong>${escapeHtml(item.nome || '—')}</strong>
          ${item.responsavel_obra ? `<div style="font-size:11px;color:var(--text-muted);"><i class="fa-solid fa-helmet-safety"></i> ${escapeHtml(item.responsavel_obra)}</div>` : ''}
        </td>
        <td>${escapeHtml(item.cliente_nome || '—')}</td>
        <td style="text-align:right;">${formatCurrency(item.verba_total_orcamento || 0)}</td>
        <td style="text-align:right;"><strong class="text-blue">${formatCurrency(verbaOrcada)}</strong></td>
        <td style="text-align:right;"><strong style="color:${progressColor};">${formatCurrency(verbaGasta)}</strong></td>
        <td style="text-align:right;"><strong class="${saldoRestante >= 0 ? 'text-emerald' : 'text-red'}">${formatCurrency(saldoRestante)}</strong></td>
        <td style="text-align:center;">
          <span class="badge-status ${statusClasses[item.status] || 'pending'}">● ${statusLabels[item.status] || item.status}</span>
        </td>
        <td style="text-align:right;" onclick="event.stopPropagation();">
          <button class="btn-view-action" onclick="openProjectExtract('${item.id}')" title="Ver Extrato de Materiais & Baixas">
            <i class="fa-solid fa-list-check"></i> Extrato
          </button>
          <button class="btn-view-action" style="margin-left:4px;" onclick="openProjectModal(${JSON.stringify(item).replace(/"/g,'&quot;')})">
            <i class="fa-solid fa-pen"></i>
          </button>
        </td>
      </tr>
    `;
  }

  if (mod === 'products' || mod === 'services') {
    const sitClass = item.situacao === 'A' || item.ativo !== false ? 'active' : 'inactive';
    let estoqueDisplay = '--';
    if (typeof item.estoque === 'object' && item.estoque !== null) {
      estoqueDisplay = item.estoque.saldoFisicoTotal !== undefined ? item.estoque.saldoFisicoTotal : (item.estoque.saldoVirtualTotal !== undefined ? item.estoque.saldoVirtualTotal : '--');
    } else if (typeof item.estoque === 'number') {
      estoqueDisplay = item.estoque;
    } else if (item.estoque_atual !== undefined) {
      estoqueDisplay = item.estoque_atual;
    }

    const precoVenda = typeof item.preco === 'object' ? (item.preco?.preco || 0) : (item.preco || item.preco_venda || 0);
    const precoCusto = typeof item.precoCusto === 'object' ? (item.precoCusto?.preco || 0) : (item.precoCusto || item.preco_custo || 0);
    const categoria = typeof item.categoria === 'object' ? (item.categoria?.descricao || 'Geral') : (item.categoria || item.categoria_nome || 'Geral');

    const isBling = !!(item.bling_id || (item.id && !String(item.id).includes('-') && !String(item.id).startsWith('prod-')));
    const originBadge = isBling 
      ? '<span class="origin-tag origin-bling"><i class="fa-solid fa-cloud"></i> Bling</span>' 
      : '<span class="origin-tag origin-app"><i class="fa-solid fa-cube"></i> App FLR</span>';

    const defaultImg = item.tipo === 'S' 
      ? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=120&auto=format&fit=crop&q=80' 
      : 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=120&auto=format&fit=crop&q=80';
    const imgUrl = item.imagemURL || item.imagem_url || item.midia?.imagens?.externas?.[0]?.link || item.anexos?.[0]?.url || item.imagens?.[0]?.link || defaultImg;

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
        <td style="text-align: center;">${originBadge}</td>
        <td style="text-align: center;"><span class="badge-status ${sitClass}">● ${item.situacao === 'A' || item.ativo !== false ? 'Ativo' : 'Inativo'}</span></td>
        <td style="text-align: right;" onclick="event.stopPropagation();">
          <button class="btn-view-action" onclick="openClientDetails(${item.id})"><i class="fa-solid fa-eye"></i> Ver</button>
          ${canEdit ? `<button class="btn-view-action" style="color: var(--bling-blue); border-color: rgba(22, 101, 216, 0.25); margin-left: 4px;" onclick="openEditModal('products', ${item.id})"><i class="fa-solid fa-pen"></i> Editar</button>` : ''}
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
          ${canEdit ? `<button class="btn-view-action" style="color: var(--bling-blue); border-color: rgba(22, 101, 216, 0.25); margin-left: 4px;" onclick="openEditModal('orders', ${item.id})"><i class="fa-solid fa-pen"></i> Editar</button>` : ''}
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
          ${canEdit ? `<button class="btn-view-action" style="color: var(--bling-blue); border-color: rgba(22, 101, 216, 0.25); margin-left: 4px;" onclick="openEditModal('serviceOrders', ${item.id})"><i class="fa-solid fa-pen"></i> Editar</button>` : ''}
        </td>
      </tr>
    `;
  }

  if (mod === 'receivables' || mod === 'payables') {
    const isPaga = item.situacao === 'Liquidada' || item.situacao === 'Paga';
    const sitClass = isPaga ? 'active' : 'pending';
    const nome = item.cliente || item.fornecedor || '--';
    const isRec = (mod === 'receivables');
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
          ${canEdit ? `<button class="btn-view-action" style="color: var(--bling-blue); border-color: rgba(22, 101, 216, 0.25); margin-left: 4px;" onclick="openEditModal('${isRec ? 'receivables' : 'payables'}', ${item.id})"><i class="fa-solid fa-pen"></i> Editar</button>` : ''}
        </td>
      </tr>
    `;
  }

  if (mod === 'nfe') {
    const numNfe = item.numero_nota || item.numero || item.id || '--';
    const serieNfe = item.serie ? `/${item.serie}` : '';
    const fornecedorNome = item.fornecedor_nome || (typeof item.fornecedor === 'object' ? item.fornecedor?.nome : item.fornecedor) || item.cliente || '--';
    const dataEmissao = item.data_emissao || item.dataEmissao || item.data;
    const valorTotal = item.valor_total || item.valorNota || item.total || 0;
    const destinoBadge = item.destino_estoque_padrao === 'projeto'
      ? '<span class="origin-tag origin-app"><i class="fa-solid fa-helmet-safety"></i> Obra</span>'
      : (item.destino_estoque_padrao === 'ambos'
        ? '<span class="origin-tag origin-both"><i class="fa-solid fa-arrows-rotate"></i> Ambos</span>'
        : '<span class="origin-tag origin-bling"><i class="fa-solid fa-warehouse"></i> Almoxarifado</span>');
    const projetoNome = item.projeto?.nome || (item.projeto_id ? 'Vinculado' : '<span class="text-muted">—</span>');
    const deParaStatus = (item.itens && item.itens.length > 0)
      ? '<span style="color:#059669;font-size:11px;font-weight:700;"><i class="fa-solid fa-circle-check"></i> De-Para OK</span>'
      : '<span style="color:var(--text-muted);font-size:11px;">Manual</span>';

    return `
      <tr>
        <td><span class="text-mono font-bold" style="font-size: 12px; color: var(--bling-blue);">NF-e #${escapeHtml(numNfe)}${serieNfe}</span></td>
        <td><strong>${escapeHtml(fornecedorNome)}</strong></td>
        <td><span class="text-mono">${formatDate(dataEmissao)}</span></td>
        <td style="text-align:center;">${destinoBadge}</td>
        <td><span style="font-size:12px;color:var(--text-secondary);">${escapeHtml(projetoNome)}</span></td>
        <td style="text-align:right;"><strong class="text-emerald">${formatCurrency(valorTotal)}</strong></td>
        <td style="text-align:center;">${deParaStatus}</td>
        <td style="text-align:right;" onclick="event.stopPropagation();">
          <button class="btn-view-action" onclick="openNfeDetails(${JSON.stringify(item).replace(/"/g,'&quot;')})">
            <i class="fa-solid fa-eye"></i> Detalhes
          </button>
        </td>
      </tr>
    `;
  }

  // Kits de Produtos (App FLR)
  if (mod === 'kits') {
    const totalItens = (item.itens || []).length;
    const totalCalc = (item.itens || []).reduce((s, it) => s + (it.quantity * it.unit_price), 0);
    const precoFinal = item.usar_preco_fixo ? parseFloat(item.preco_fixo || 0) : totalCalc;
    const ativoClass = item.ativo !== false ? 'active' : 'inactive';
    const ativoLabel = item.ativo !== false ? 'Ativo' : 'Inativo';
    return `
      <tr>
        <td><span class="text-mono" style="font-size:11px;">${escapeHtml(item.codigo || '—')}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            ${item.imagem_url ? `<img src="${item.imagem_url}" style="width:32px;height:32px;border-radius:4px;object-fit:cover;" onerror="this.style.display='none'">` : '<i class="fa-solid fa-layer-group" style="color:#F59E0B;font-size:18px;width:32px;text-align:center;"></i>'}
            <strong>${escapeHtml(item.nome || '—')}</strong>
          </div>
          ${item.descricao ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${escapeHtml(item.descricao.substring(0,60))}...</div>` : ''}
        </td>
        <td style="text-align:center;"><span class="badge-tag-custom">${totalItens} produto(s)</span></td>
        <td style="text-align:right;"><strong class="text-emerald">${formatCurrency(precoFinal)}</strong></td>
        <td style="text-align:center;">${item.usar_preco_fixo ? '<span style="color:#6366F1;font-size:11px;font-weight:700;">✓ Fixo</span>' : '<span style="color:var(--text-muted);font-size:11px;">Calculado</span>'}</td>
        <td style="text-align:center;"><span class="badge-status ${ativoClass}">● ${ativoLabel}</span></td>
        <td style="text-align:right;" onclick="event.stopPropagation();">
          <button class="btn-view-action" onclick="openKitBuilder(${JSON.stringify(item).replace(/"/g,'&quot;')})">
            <i class="fa-solid fa-pen"></i> Editar
          </button>
        </td>
      </tr>
    `;
  }

  // Orçamentos (Fast Quote Builder - App FLR)
  if (mod === 'quotes') {
    const statusLabels = { rascunho: 'Rascunho', apresentado: 'Apresentado', aprovado: 'Aprovado', cancelado: 'Cancelado' };
    const statusColors = { rascunho: 'pending', apresentado: 'pending', aprovado: 'active', cancelado: 'inactive' };
    const statusClass = statusColors[item.status] || 'pending';
    const statusLabel = statusLabels[item.status] || item.status;
    const dataValidade = item.data_validade ? formatDate(item.data_validade) : '—';
    const isBlingExported = !!(item.bling_pedido_id || item.bling_proposta_id);
    const originBadge = isBlingExported
      ? `<span class="origin-tag origin-bling"><i class="fa-solid fa-cloud-arrow-up"></i> Bling #${item.bling_pedido_id || item.bling_proposta_id}</span>`
      : `<span class="origin-tag origin-app"><i class="fa-solid fa-cube"></i> App Local</span>`;
    return `
      <tr onclick="openQuoteBuilder(${JSON.stringify(item).replace(/"/g,'&quot;')})">
        <td><span class="text-mono font-bold" style="color:var(--bling-green-dark);">${escapeHtml(item.numero || '—')}</span></td>
        <td><strong>${escapeHtml(item.bling_contact_nome || '—')}</strong></td>
        <td style="font-size:12px;color:var(--text-secondary);">${escapeHtml(item.titulo || '—')}</td>
        <td><span class="text-mono">${formatDate(item.data_emissao)}</span></td>
        <td><span class="text-mono">${dataValidade}</span></td>
        <td style="text-align:right;"><strong class="text-emerald">${formatCurrency(item.total_final || 0)}</strong></td>
        <td style="text-align:center;"><span class="badge-status ${statusClass}">● ${statusLabel}</span></td>
        <td style="text-align:center;">${originBadge}</td>
        <td style="text-align:right;" onclick="event.stopPropagation();">
          <button class="btn-view-action" onclick="openQuoteBuilder(${JSON.stringify(item).replace(/"/g,'&quot;')})">
            <i class="fa-solid fa-pen"></i> Editar
          </button>
          ${item.status === 'aprovado' && !isBlingExported ? `
            <button class="btn-view-action" style="color:var(--bling-green-dark);border-color:rgba(0,168,104,.25);margin-left:4px;"
              onclick="event.stopPropagation(); document.getElementById('quoteId').value='${item.id}'; document.getElementById('quoteStatus').value='aprovado'; openExportBlingModal();">
              <i class="fa-solid fa-upload"></i> Bling
            </button>` : ''}
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
  } finally {
    const canComplement = hasPermission('clients', 'complement');
    const btnSaveComp = document.getElementById('btnSaveComplements');
    if (btnSaveComp) btnSaveComp.style.display = canComplement ? 'inline-flex' : 'none';
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
  // SPA Seamless Navigation (Troca instantânea de módulo sem recarregar a página e sem flash)
  const navLinksMap = {
    'navDashboard': 'dashboard',
    'navProjects': 'projects',
    'navQuotes': 'quotes',
    'navKits': 'kits',
    'navServiceOrders': 'serviceOrders',
    'navNfe': 'nfe',
    'navStock': 'stock',
    'navClients': 'clients',
    'navProducts': 'products',
    'navServices': 'services',
    'navCategories': 'categories',
    'navOrders': 'orders',
    'navProposals': 'proposals',
    'navSellers': 'sellers',
    'navReceivables': 'receivables',
    'navPayables': 'payables'
  };

  Object.entries(navLinksMap).forEach(([navId, modKey]) => {
    const el = document.getElementById(navId);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const href = el.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          window.history.pushState({ module: modKey }, '', href);
        }
        window.switchERPView(modKey);
      });
    }
  });

  // Suporte aos botões voltar/avançar do navegador (History API)
  window.addEventListener('popstate', (e) => {
    const path = window.location.pathname.replace(/^\//, '') || 'index.html';
    const pageToMod = {
      'projetos.html': 'projects',
      'orcamentos.html': 'quotes',
      'kits.html': 'kits',
      'ordens-servico.html': 'serviceOrders',
      'nfe.html': 'nfe',
      'estoque.html': 'stock',
      'clientes.html': 'clients',
      'produtos.html': 'products',
      'servicos.html': 'services',
      'categorias.html': 'categories',
      'pedidos.html': 'orders',
      'propostas.html': 'proposals',
      'vendedores.html': 'sellers',
      'contas-receber.html': 'receivables',
      'contas-pagar.html': 'payables',
      'index.html': 'dashboard'
    };
    const mod = pageToMod[path] || (e.state && e.state.module) || 'dashboard';
    window.switchERPView(mod);
  });

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
  setupImageUploadHandlers();
  setupNfeXmlHandlers();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      if (elements.loginModal) closeModal(elements.loginModal);
      if (elements.registerModal) closeModal(elements.registerModal);
      if (elements.usersManagerModal) closeModal(elements.usersManagerModal);
      if (elements.authModal) closeModal(elements.authModal);
      if (elements.modalNewProduct) closeModal(elements.modalNewProduct);
      if (elements.modalNewNfe) closeModal(elements.modalNewNfe);
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
  if (elements.userHeaderAvatar) elements.userHeaderAvatar.textContent = initials || 'FL';
  if (elements.userHeaderName) elements.userHeaderName.textContent = user.name;
  
  if (elements.userHeaderRole) {
    const profName = user.profile?.name || (user.role === 'superadmin' ? 'Superadmin' : 'Usuário');
    const profColor = user.profile?.color || '#1665D8';
    elements.userHeaderRole.innerHTML = `
      <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${profColor}; margin-right: 4px;"></span>
      ${escapeHtml(profName)}
    `;
  }
}

// ==========================================================================
// GESTÃO DE ABAS DO PAINEL DE CONTROLE (SUPERADMIN)
// ==========================================================================
window.switchAdminTab = function(tabName) {
  const tabBtnUsers = document.getElementById('tabBtnUsers');
  const tabBtnProfiles = document.getElementById('tabBtnProfiles');
  const paneUsers = document.getElementById('adminPaneUsers');
  const paneProfiles = document.getElementById('adminPaneProfiles');

  if (tabName === 'users') {
    if (tabBtnUsers) {
      tabBtnUsers.classList.add('active');
      tabBtnUsers.style.borderBottom = '3px solid var(--bling-blue)';
      tabBtnUsers.style.color = 'var(--bling-blue)';
    }
    if (tabBtnProfiles) {
      tabBtnProfiles.classList.remove('active');
      tabBtnProfiles.style.borderBottom = '3px solid transparent';
      tabBtnProfiles.style.color = 'var(--text-secondary)';
    }
    if (paneUsers) paneUsers.style.display = 'block';
    if (paneProfiles) paneProfiles.style.display = 'none';
    loadUsersList();
  } else {
    if (tabBtnProfiles) {
      tabBtnProfiles.classList.add('active');
      tabBtnProfiles.style.borderBottom = '3px solid var(--bling-purple)';
      tabBtnProfiles.style.color = 'var(--bling-purple)';
    }
    if (tabBtnUsers) {
      tabBtnUsers.classList.remove('active');
      tabBtnUsers.style.borderBottom = '3px solid transparent';
      tabBtnUsers.style.color = 'var(--text-secondary)';
    }
    if (paneUsers) paneUsers.style.display = 'none';
    if (paneProfiles) paneProfiles.style.display = 'block';
    loadProfilesList();
  }
};

// ==========================================================================
// GESTÃO DE PERFIS DE ACESSO & PERMISSÕES (RBAC)
// ==========================================================================
async function loadProfilesList() {
  if (!state.authToken) return;

  try {
    const response = await fetch('/api/profiles', {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    if (!response.ok) return;

    const result = await response.json();
    state.allProfiles = result.profiles || [];

    const badgeCount = document.getElementById('countProfilesBadge');
    if (badgeCount) badgeCount.textContent = state.allProfiles.length;

    renderProfilesTable();
  } catch (err) {
    console.error('Erro loadProfilesList:', err);
  }
}

function renderProfilesTable() {
  const tbody = document.getElementById('profilesTableBody');
  if (!tbody) return;

  if (state.allProfiles.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">Nenhum perfil de acesso cadastrado.</td></tr>';
    return;
  }

  tbody.innerHTML = state.allProfiles.map(prof => {
    const isSys = prof.is_system === true;
    const color = prof.color || '#1665D8';
    
    // Contagem de usuários vinculados
    const linkedCount = state.allUsers.filter(u => u.profile_id === prof.id || (isSys && prof.name === 'Super Administrador' && u.role === 'superadmin')).length;

    return `
      <tr>
        <td>
          <span class="badge-profile" style="background: ${color}15; color: ${color}; border: 1px solid ${color}40;">
            <i class="fa-solid fa-shield"></i> ${escapeHtml(prof.name)}
          </span>
        </td>
        <td><span style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(prof.description || '--')}</span></td>
        <td style="text-align: center;">
          <span class="badge-tag-custom">${linkedCount} usuário(s)</span>
        </td>
        <td style="text-align: center;">
          ${isSys ? '<span class="badge-status active">Sistema</span>' : '<span class="badge-status pending">Customizado</span>'}
        </td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-xs" onclick="openProfileModal('${prof.id}')" title="Editar permissões deste perfil">
            <i class="fa-solid fa-pen-to-square"></i> Editar Permissões
          </button>
          ${!isSys ? `
            <button class="btn btn-danger btn-xs" style="margin-left: 4px;" onclick="deleteProfile('${prof.id}')" title="Excluir este perfil">
              <i class="fa-solid fa-trash"></i>
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

window.openProfileModal = function(profileId = null) {
  state.editingProfileId = profileId;
  const modal = document.getElementById('modalProfileForm');
  const title = document.getElementById('modalProfileFormTitle');
  const inpId = document.getElementById('adminProfileId');
  const inpName = document.getElementById('admProfName');
  const inpDesc = document.getElementById('admProfDesc');
  const inpColor = document.getElementById('admProfColor');
  const inpColorHex = document.getElementById('admProfColorHex');
  const container = document.getElementById('permissionsMatrixContainer');

  let currentPerms = {};
  let currentProf = null;

  if (profileId) {
    currentProf = state.allProfiles.find(p => p.id === profileId);
    if (currentProf) {
      if (title) title.innerHTML = `<i class="fa-solid fa-shield-halved text-purple"></i> Editar Perfil: ${escapeHtml(currentProf.name)}`;
      if (inpId) inpId.value = currentProf.id;
      if (inpName) inpName.value = currentProf.name;
      if (inpDesc) inpDesc.value = currentProf.description || '';
      if (inpColor) inpColor.value = currentProf.color || '#1665D8';
      if (inpColorHex) inpColorHex.value = currentProf.color || '#1665D8';
      currentPerms = currentProf.permissions || {};
    }
  } else {
    if (title) title.innerHTML = `<i class="fa-solid fa-shield-plus text-purple"></i> Novo Perfil de Acesso`;
    if (inpId) inpId.value = '';
    if (inpName) inpName.value = '';
    if (inpDesc) inpDesc.value = '';
    if (inpColor) inpColor.value = '#1665D8';
    if (inpColorHex) inpColorHex.value = '#1665D8';
    currentPerms = {};
  }

  // Constrói a Matriz Visual de Permissões
  if (container) {
    container.innerHTML = MODULE_PERMISSION_DEFINITIONS.map(mod => {
      const modPerms = currentPerms[mod.key] || {};
      return `
        <div class="perm-module-card">
          <div class="perm-module-header">
            <div class="perm-module-title">
              <i class="fa-solid ${mod.icon} text-blue"></i>
              <span>${escapeHtml(mod.title)}</span>
            </div>
            <span class="text-muted" style="font-size: 10px; text-transform: uppercase;">${escapeHtml(mod.category)}</span>
          </div>
          <div class="perm-options-list">
            ${mod.actions.map(act => {
              const isChecked = modPerms[act.key] === true;
              const inputId = `perm_${mod.key}_${act.key}`;
              return `
                <label class="perm-checkbox-item" for="${inputId}">
                  <input type="checkbox" id="${inputId}" data-module="${mod.key}" data-action="${act.key}" ${isChecked ? 'checked' : ''}>
                  <span>${escapeHtml(act.label)}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  if (modal) openModal(modal);
};

window.setPermissionsPreset = function(preset) {
  const checkboxes = document.querySelectorAll('#permissionsMatrixContainer input[type="checkbox"]');
  checkboxes.forEach(cb => {
    if (preset === 'all') {
      cb.checked = true;
    } else if (preset === 'none') {
      cb.checked = false;
    } else if (preset === 'readonly') {
      const act = cb.getAttribute('data-action');
      cb.checked = (act === 'view');
    }
  });
};

window.handleSaveProfile = async function() {
  const btn = document.getElementById('btnSubmitAdminProfile');
  const name = document.getElementById('admProfName').value.trim();
  const description = document.getElementById('admProfDesc').value.trim();
  const color = document.getElementById('admProfColorHex').value.trim() || document.getElementById('admProfColor').value;

  if (!name) {
    showNotification('O nome do perfil é obrigatório.', 'error');
    return;
  }

  // Coleta as permissões dos checkboxes
  const permissions = {};
  const checkboxes = document.querySelectorAll('#permissionsMatrixContainer input[type="checkbox"]');
  checkboxes.forEach(cb => {
    const mod = cb.getAttribute('data-module');
    const act = cb.getAttribute('data-action');
    if (!permissions[mod]) permissions[mod] = {};
    permissions[mod][act] = cb.checked;
  });

  const isEditing = !!state.editingProfileId;
  const endpoint = isEditing ? `/api/profiles/${state.editingProfileId}` : '/api/profiles';
  const method = isEditing ? 'PUT' : 'POST';

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${isEditing ? 'Atualizando' : 'Salvando'} Perfil...`;

  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({ name, description, color, permissions })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar perfil de acesso');

    showNotification(`Perfil de acesso "${name}" ${isEditing ? 'atualizado' : 'criado'} com sucesso!`, 'success');
    closeModal(document.getElementById('modalProfileForm'));
    state.editingProfileId = null;
    await loadProfilesList();
    await loadUsersList();
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Perfil de Acesso';
  }
};

window.deleteProfile = async function(profileId) {
  const prof = state.allProfiles.find(p => p.id === profileId);
  const name = prof ? prof.name : 'este perfil';
  if (!confirm(`Deseja realmente excluir o perfil de acesso "${name}"?`)) return;

  try {
    const res = await fetch(`/api/profiles/${profileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir perfil');

    showNotification('Perfil de acesso excluído com sucesso!', 'success');
    await loadProfilesList();
  } catch (err) {
    showNotification(err.message, 'error');
  }
};

// ==========================================================================
// GESTÃO DE USUÁRIOS (SUPERADMIN ONLY)
// ==========================================================================
async function loadUsersList() {
  if (!state.authToken) return;

  try {
    const response = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    if (!response.ok) return;

    const result = await response.json();
    state.allUsers = result.users || [];

    const badgeCount = document.getElementById('countUsersBadge');
    if (badgeCount) badgeCount.textContent = state.allUsers.length;

    const pending = state.allUsers.filter(u => u.status === 'pendente').length;
    if (elements.navPendingUsersCount) {
      if (pending > 0) {
        elements.navPendingUsersCount.textContent = pending;
        elements.navPendingUsersCount.style.display = 'inline-block';
      } else {
        elements.navPendingUsersCount.style.display = 'none';
      }
    }

    renderUsersTable();
  } catch (err) {
    console.error('Erro loadUsersList:', err);
  }
}

window.filterAdminUsersTable = function(query) {
  state.adminUsersFilter = query.trim().toLowerCase();
  renderUsersTable();
};

function updateUserHeaderMeta() {
  if (!state.currentUser) return;
  const user = state.currentUser;
  const elName = document.getElementById('userHeaderName');
  const elRole = document.getElementById('userHeaderRole');
  const elAvatar = document.getElementById('userHeaderAvatar');

  if (elName) elName.textContent = user.name || 'Usuário';
  if (elRole) {
    const profName = user.profile?.name || (user.role === 'superadmin' ? 'Super Administrador' : 'Operador');
    elRole.textContent = profName;
  }
  if (elAvatar) {
    if (user.avatar_url) {
      elAvatar.innerHTML = `<img src="${escapeHtml(user.avatar_url)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else {
      const initials = (user.name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
      elAvatar.textContent = initials;
    }
  }
}

// Handlers de Upload de Foto do Usuário
window.handleUserAvatarFileSelected = function(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showNotification('A foto deve ter no máximo 5MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    const preview = document.getElementById('admUserAvatarPreview');
    const placeholder = document.getElementById('admUserAvatarPlaceholder');
    const btnRemove = document.getElementById('btnRemoveUserAvatar');
    const inpUrl = document.getElementById('admUserAvatarUrl');

    if (preview) {
      preview.src = base64;
      preview.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
    if (btnRemove) btnRemove.style.display = 'inline-flex';
    if (inpUrl) inpUrl.value = base64;
  };
  reader.readAsDataURL(file);
};

window.removeUserAvatarPhoto = function() {
  const preview = document.getElementById('admUserAvatarPreview');
  const placeholder = document.getElementById('admUserAvatarPlaceholder');
  const btnRemove = document.getElementById('btnRemoveUserAvatar');
  const inpUrl = document.getElementById('admUserAvatarUrl');
  const fileInput = document.getElementById('admUserAvatarFile');

  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  if (placeholder) placeholder.style.display = 'flex';
  if (btnRemove) btnRemove.style.display = 'none';
  if (inpUrl) inpUrl.value = '';
  if (fileInput) fileInput.value = '';
};

function renderUsersTable() {
  if (!elements.usersTableBody) return;

  let users = state.allUsers;
  if (state.adminUsersFilter) {
    users = users.filter(u => 
      (u.name && u.name.toLowerCase().includes(state.adminUsersFilter)) ||
      (u.email && u.email.toLowerCase().includes(state.adminUsersFilter)) ||
      (u.phone && u.phone.includes(state.adminUsersFilter))
    );
  }

  if (users.length === 0) {
    elements.usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">Nenhum usuário encontrado.</td></tr>';
    return;
  }

  elements.usersTableBody.innerHTML = users.map(user => {
    const isSuper = user.role === 'superadmin';
    const statusClass = user.status === 'aprovado' ? 'active' : (user.status === 'pendente' ? 'pending' : 'blocked');
    const statusLabel = user.status === 'aprovado' ? 'Aprovado' : (user.status === 'pendente' ? 'Pendente' : 'Bloqueado');

    const prof = user.profile || state.allProfiles.find(p => p.id === user.profile_id) || { name: (isSuper ? 'Super Administrador' : 'Padrão'), color: (isSuper ? '#E11D48' : '#1665D8') };
    const color = prof.color || '#1665D8';
    const initials = (user.name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    const avatarHtml = user.avatar_url 
      ? `<img src="${escapeHtml(user.avatar_url)}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--border-color); flex-shrink: 0;">`
      : `<div style="width: 36px; height: 36px; border-radius: 50%; background: ${color}20; color: ${color}; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; border: 1px solid ${color}40;">${initials}</div>`;

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${avatarHtml}
            <div>
              <strong>${escapeHtml(user.name)}</strong>
              ${isSuper ? '<span style="display: block; font-size: 10px; color: #E11D48; font-weight: 700;">★ Mestre</span>' : ''}
            </div>
          </div>
        </td>
        <td>${escapeHtml(user.email)}</td>
        <td><span class="text-mono">${escapeHtml(user.phone || '--')}</span></td>
        <td>
          <span class="badge-profile" style="background: ${color}15; color: ${color}; border: 1px solid ${color}40;">
            <i class="fa-solid fa-id-badge"></i> ${escapeHtml(prof.name)}
          </span>
        </td>
        <td style="text-align: center;"><span class="badge-status ${statusClass}">● ${statusLabel}</span></td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-xs" onclick="openUserModal('${user.id}')" title="Editar dados e foto do usuário">
            <i class="fa-solid fa-user-pen"></i> Editar
          </button>
          ${!isSuper ? `
            ${user.status !== 'aprovado' ? `
              <button class="btn btn-success btn-xs" onclick="changeUserStatus('${user.id}', 'aprovado')" title="Aprovar acesso"><i class="fa-solid fa-check"></i> Aprovar</button>
            ` : `
              <button class="btn btn-secondary btn-xs" onclick="changeUserStatus('${user.id}', 'bloqueado')" title="Bloquear acesso"><i class="fa-solid fa-ban"></i> Bloquear</button>
            `}
            <button class="btn btn-danger btn-xs" onclick="removeUser('${user.id}')" title="Excluir usuário"><i class="fa-solid fa-trash"></i></button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

window.openUserModal = function(userId = null) {
  state.editingUserId = userId;
  const modal = document.getElementById('modalUserForm');
  const title = document.getElementById('modalUserFormTitle');
  const inpId = document.getElementById('adminUserId');
  const inpName = document.getElementById('admUserName');
  const inpEmail = document.getElementById('admUserEmail');
  const inpPhone = document.getElementById('admUserPhone');
  const inpStatus = document.getElementById('admUserStatus');
  const selectProfile = document.getElementById('admUserProfile');
  const inpPass = document.getElementById('admUserPassword');
  const helpPass = document.getElementById('helpAdmUserPassword');
  const lblPass = document.getElementById('lblAdmUserPassword');

  const preview = document.getElementById('admUserAvatarPreview');
  const placeholder = document.getElementById('admUserAvatarPlaceholder');
  const btnRemove = document.getElementById('btnRemoveUserAvatar');
  const inpUrl = document.getElementById('admUserAvatarUrl');

  // Popula o select de perfis
  if (selectProfile) {
    selectProfile.innerHTML = state.allProfiles.map(p => `
      <option value="${p.id}">${escapeHtml(p.name)} ${p.is_system ? '(Sistema)' : ''}</option>
    `).join('');
  }

  if (userId) {
    const user = state.allUsers.find(u => u.id === userId);
    if (user) {
      if (title) title.innerHTML = `<i class="fa-solid fa-user-pen text-blue"></i> Editar Usuário: ${escapeHtml(user.name)}`;
      if (inpId) inpId.value = user.id;
      if (inpName) inpName.value = user.name;
      if (inpEmail) inpEmail.value = user.email;
      if (inpPhone) inpPhone.value = user.phone || '';
      if (inpStatus) inpStatus.value = user.status || 'aprovado';
      if (selectProfile && user.profile_id) selectProfile.value = user.profile_id;
      if (inpPass) {
        inpPass.value = '';
        inpPass.required = false;
      }
      if (lblPass) lblPass.textContent = 'Nova Senha (Opcional)';
      if (helpPass) helpPass.style.display = 'block';

      // Foto / Avatar
      if (user.avatar_url) {
        if (preview) {
          preview.src = user.avatar_url;
          preview.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        if (btnRemove) btnRemove.style.display = 'inline-flex';
        if (inpUrl) inpUrl.value = user.avatar_url;
      } else {
        removeUserAvatarPhoto();
      }
    }
  } else {
    if (title) title.innerHTML = `<i class="fa-solid fa-user-plus text-blue"></i> Cadastrar Novo Usuário`;
    if (inpId) inpId.value = '';
    if (inpName) inpName.value = '';
    if (inpEmail) inpEmail.value = '';
    if (inpPhone) inpPhone.value = '';
    if (inpStatus) inpStatus.value = 'aprovado';
    if (inpPass) {
      inpPass.value = '';
      inpPass.required = true;
    }
    if (lblPass) lblPass.textContent = 'Senha de Acesso *';
    if (helpPass) helpPass.style.display = 'none';
    removeUserAvatarPhoto();
  }

  if (modal) openModal(modal);
};

window.handleSaveUser = async function() {
  const btn = document.getElementById('btnSubmitAdminUser');
  const name = document.getElementById('admUserName').value.trim();
  const email = document.getElementById('admUserEmail').value.trim();
  const phone = document.getElementById('admUserPhone').value.trim();
  const status = document.getElementById('admUserStatus').value;
  const profile_id = document.getElementById('admUserProfile').value;
  const password = document.getElementById('admUserPassword').value;
  const avatar_url = document.getElementById('admUserAvatarUrl')?.value || null;

  if (!name || !email) {
    showNotification('Nome e e-mail são obrigatórios.', 'error');
    return;
  }

  const isEditing = !!state.editingUserId;
  if (!isEditing && (!password || password.length < 6)) {
    showNotification('A senha inicial deve conter pelo menos 6 caracteres.', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${isEditing ? 'Atualizando' : 'Salvando'} Usuário...`;

  try {
    const endpoint = isEditing ? `/api/users/${state.editingUserId}` : '/api/users';
    const method = isEditing ? 'PUT' : 'POST';

    const payload = { name, email, phone, status, profile_id, avatar_url };
    if (password && password.trim()) payload.password = password.trim();

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar usuário');

    showNotification(`Usuário "${name}" ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`, 'success');
    closeModal(document.getElementById('modalUserForm'));
    state.editingUserId = null;
    await loadUsersList();
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Usuário';
  }
};

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
// CADASTRO E EDIÇÃO DE PRODUTO / SERVIÇO NO BLING (API v3)
// ==========================================================================
window.openNewProductModal = function(defaultTipo = 'P') {
  state.editingId = null;
  if (elements.formNewProduct) elements.formNewProduct.reset();
  const tipoSelect = document.getElementById('prodTipo');
  if (tipoSelect) tipoSelect.value = defaultTipo;

  // Resetar preview de imagem
  const previewBox = document.getElementById('uploadPreviewBox');
  const previewImg = document.getElementById('uploadPreviewImg');
  const zoneContent = document.getElementById('uploadZoneContent');
  const fileInput = document.getElementById('prodImageFileInput');
  const urlInput = document.getElementById('prodImagemURL');
  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
  if (previewImg) previewImg.src = '';
  if (previewBox) previewBox.style.display = 'none';
  if (zoneContent) zoneContent.style.display = 'flex';

  const btn = document.getElementById('btnSubmitNewProduct');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar no Bling & Supabase';
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
  let imagemURL = document.getElementById('prodImagemURL')?.value?.trim() || '';
  const observacoes = document.getElementById('prodObservacoes').value.trim();
  const fileInput = document.getElementById('prodImageFileInput');

  if (!nome) {
    showNotification('O nome do produto é obrigatório.', 'error');
    return;
  }

  const isEditing = !!state.editingId;
  const btnSubmit = document.getElementById('btnSubmitNewProduct');
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${isEditing ? 'Atualizando' : 'Salvando'} no Bling...`;

  try {
    // Se o usuário selecionou um arquivo local no input que ainda não foi enviado
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      try {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const uploadRes = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.authToken}`
          },
          body: JSON.stringify({ imageBase64: base64Data, fileName: file.name })
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            imagemURL = uploadData.url;
          }
        }
      } catch (uploadErr) {
        console.warn('Aviso no upload direto de arquivo:', uploadErr);
      }
    }

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

    const endpoint = isEditing ? `/api/produtos/${state.editingId}` : '/api/produtos';
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || result.details?.error_description || 'Erro ao salvar produto no Bling');

    showNotification(`Produto/Serviço ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso no Bling!`, 'success');
    closeModal(elements.modalNewProduct);
    elements.formNewProduct.reset();

    const targetModule = (tipo === 'S') ? 'services' : 'products';
    const savedItem = Object.assign({}, payload, result.data || {});
    
    if (isEditing) {
      const idx = state.allData.findIndex(i => String(i.id) === String(state.editingId));
      if (idx !== -1) {
        state.allData[idx] = Object.assign({}, state.allData[idx], savedItem);
      }
      if (state.selectedItem && String(state.selectedItem.id) === String(state.editingId)) {
        state.selectedItem = Object.assign({}, state.selectedItem, savedItem);
        // Atualizar foto do drawer se estiver aberto
        const drawerImg = document.getElementById('drawerProductImg');
        const drawerHero = document.getElementById('drawerProductHero');
        if (savedItem.imagemURL && drawerImg && drawerHero) {
          drawerImg.src = savedItem.imagemURL;
          drawerHero.style.display = 'flex';
        }
      }
    } else {
      state.allData.unshift(result.data || savedItem);
    }

    state.editingId = null;
    applyModuleFilters();
    updateModuleKPIs(targetModule, state.allData);
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar no Bling & Supabase';
  }
}

// ==========================================================================
// UPLOAD DE IMAGENS (DRAG & DROP + ALTERAR FOTO EXISTENTE)
// ==========================================================================
function setupImageUploadHandlers() {
  const dropZone = document.getElementById('prodDropZone');
  const fileInput = document.getElementById('prodImageFileInput');
  const zoneContent = document.getElementById('uploadZoneContent');
  const previewBox = document.getElementById('uploadPreviewBox');
  const previewImg = document.getElementById('uploadPreviewImg');
  const btnRemove = document.getElementById('btnRemovePreview');
  const urlInput = document.getElementById('prodImagemURL');

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', (e) => {
      if (e.target !== btnRemove && !btnRemove?.contains(e.target)) {
        fileInput.click();
      }
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processUploadedImage(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processUploadedImage(e.target.files[0]);
      }
    });

    btnRemove?.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.value = '';
      if (previewImg) previewImg.src = '';
      if (previewBox) previewBox.style.display = 'none';
      if (zoneContent) zoneContent.style.display = 'flex';
      if (urlInput) urlInput.value = '';
    });
  }

  async function processUploadedImage(file) {
    if (!file.type.startsWith('image/')) {
      showNotification('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      if (previewImg) previewImg.src = base64Data;
      if (previewBox) previewBox.style.display = 'inline-block';
      if (zoneContent) zoneContent.style.display = 'none';

      // Envia para o backend salvar
      try {
        showNotification('Enviando imagem do produto...', 'info');
        const res = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.authToken}`
          },
          body: JSON.stringify({ imageBase64: base64Data, fileName: file.name })
        });

        if (res.ok) {
          const json = await res.json();
          if (urlInput && json.url) {
            urlInput.value = json.url;
            showNotification('Imagem carregada com sucesso!', 'success');
          }
        }
      } catch (err) {
        console.warn('Erro ao salvar upload no servidor:', err);
      }
    };
    reader.readAsDataURL(file);
  }

  // Alterar foto diretamente no Drawer de Detalhes
  const btnDrawerPhoto = document.getElementById('btnDrawerChangePhoto');
  const drawerFileInput = document.getElementById('drawerPhotoFileInput');
  const drawerImg = document.getElementById('drawerProductImg');
  const drawerHero = document.getElementById('drawerProductHero');

  if (btnDrawerPhoto && drawerFileInput) {
    btnDrawerPhoto.addEventListener('click', () => {
      drawerFileInput.click();
    });

    drawerFileInput.addEventListener('change', async (e) => {
      if (!e.target.files || !e.target.files[0] || !state.selectedItem) return;
      const file = e.target.files[0];

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result;
        btnDrawerPhoto.disabled = true;
        btnDrawerPhoto.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando foto...';

        try {
          // 1. Faz upload do arquivo
          const uploadRes = await fetch('/api/upload/image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.authToken}`
            },
            body: JSON.stringify({ imageBase64: base64Data, fileName: file.name })
          });

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error || 'Erro ao enviar foto');

          const finalImgUrl = uploadData.url;

          // 2. Atualiza o produto com a nova imagem
          const patchRes = await fetch(`/api/produtos/${state.selectedItem.id}/imagem`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.authToken}`
            },
            body: JSON.stringify({ imagemURL: finalImgUrl })
          });

          if (!patchRes.ok) throw new Error('Falha ao atualizar foto no produto');

          // 3. Atualiza estado local e tela
          state.selectedItem.imagemURL = finalImgUrl;
          if (drawerImg) drawerImg.src = finalImgUrl;
          if (drawerHero) drawerHero.style.display = 'flex';

          const prodInList = state.allData.find(p => p.id === state.selectedItem.id);
          if (prodInList) prodInList.imagemURL = finalImgUrl;

          renderGenericTable();
          showNotification('Foto do produto atualizada com sucesso no Bling!', 'success');
        } catch (err) {
          showNotification(err.message, 'error');
        } finally {
          btnDrawerPhoto.disabled = false;
          btnDrawerPhoto.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Alterar Imagem';
          drawerFileInput.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
  }
}

// Helpers
function openModal(modal) { modal.classList.add('active'); }
function closeModal(modal) { modal.classList.remove('active'); }

function showNotification(message, type = 'info') {
  const container = document.getElementById('toastContainer') || elements.toastContainer || document.body;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : (type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'));
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
const showToast = showNotification;
window.showToast = showNotification;
window.showNotification = showNotification;

async function apiRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (state.authToken) {
    headers['Authorization'] = `Bearer ${state.authToken}`;
  }
  const response = await fetch(url, {
    ...options,
    headers
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Erro HTTP ${response.status}`);
  }
  return data;
}
window.apiRequest = apiRequest;

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

// ==========================================================================
// MÓDULO DE NOTA FISCAL (NF-e): IMPORTAÇÃO XML E DIGITAÇÃO MANUAL ITEM A ITEM
// ==========================================================================

let currentNfeTab = 'xml';
let pendingParsedXmlNfe = null;

window.openNewNfeModal = function() {
  currentNfeTab = 'xml';
  pendingParsedXmlNfe = null;
  switchNfeTab('xml');

  // Reset XML preview
  const preview = document.getElementById('xmlParsedPreview');
  if (preview) preview.style.display = 'none';
  const fileInput = document.getElementById('nfeXmlFileInput');
  if (fileInput) fileInput.value = '';

  // Reset Manual Form
  const formManual = document.getElementById('formManualNfe');
  if (formManual) formManual.reset();
  const manualDataInput = document.getElementById('manNfeData');
  if (manualDataInput) manualDataInput.value = new Date().toISOString().split('T')[0];

  // Limpa e inicializa itens manuais com 1 linha vazia
  const itemsBody = document.getElementById('manualNfeItemsBody');
  if (itemsBody) {
    itemsBody.innerHTML = '';
    addManualNfeItemRow();
  }

  const modal = document.getElementById('modalNewNfe');
  if (modal) openModal(modal);
};

window.switchNfeTab = function(tab) {
  currentNfeTab = tab;
  const tabXml = document.getElementById('tabBtnNfeXml');
  const tabManual = document.getElementById('tabBtnNfeManual');
  const paneXml = document.getElementById('nfePaneXml');
  const paneManual = document.getElementById('nfePaneManual');

  if (tab === 'xml') {
    if (tabXml) {
      tabXml.classList.add('active');
      tabXml.style.borderBottom = '3px solid var(--bling-green)';
      tabXml.style.color = 'var(--bling-green)';
    }
    if (tabManual) {
      tabManual.classList.remove('active');
      tabManual.style.borderBottom = '3px solid transparent';
      tabManual.style.color = 'var(--text-secondary)';
    }
    if (paneXml) paneXml.style.display = 'block';
    if (paneManual) paneManual.style.display = 'none';
  } else {
    if (tabManual) {
      tabManual.classList.add('active');
      tabManual.style.borderBottom = '3px solid var(--bling-green)';
      tabManual.style.color = 'var(--bling-green)';
    }
    if (tabXml) {
      tabXml.classList.remove('active');
      tabXml.style.borderBottom = '3px solid transparent';
      tabXml.style.color = 'var(--text-secondary)';
    }
    if (paneXml) paneXml.style.display = 'none';
    if (paneManual) paneManual.style.display = 'block';
  }
};

function setupNfeXmlHandlers() {
  const dropZone = document.getElementById('nfeXmlDropZone');
  const fileInput = document.getElementById('nfeXmlFileInput');

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#008a54';
      dropZone.style.background = '#E6F7F0';
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = '#00A868';
      dropZone.style.background = '#F0FDF4';
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#00A868';
      dropZone.style.background = '#F0FDF4';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processNfeXmlFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processNfeXmlFile(e.target.files[0]);
      }
    });
  }

  // Close modal listeners
  const btnClose = document.getElementById('btnCloseNewNfeModal');
  const btnCloseFooter = document.getElementById('btnCloseNewNfeModalFooter');
  const modal = document.getElementById('modalNewNfe');
  if (btnClose && modal) btnClose.addEventListener('click', () => closeModal(modal));
  if (btnCloseFooter && modal) btnCloseFooter.addEventListener('click', () => closeModal(modal));
}

function processNfeXmlFile(file) {
  if (!file.name.toLowerCase().endsWith('.xml')) {
    showNotification('Por favor, selecione um arquivo XML válido (.xml)', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const xmlString = e.target.result;
      const parsed = parseNfeXml(xmlString);
      pendingParsedXmlNfe = parsed;
      renderParsedXmlPreview(parsed);
      showNotification(`XML da NF-e nº ${parsed.numero} importado com sucesso!`, 'success');
    } catch (err) {
      console.error('Erro ao processar XML:', err);
      showNotification('Erro ao processar XML da NF-e: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

function parseNfeXml(xmlStr) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, 'text/xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Arquivo XML corrompido ou mal formatado.');
  }

  const getText = (selector, parent = doc) => {
    const el = parent.querySelector(selector);
    return el ? el.textContent.trim() : '';
  };

  // infNFe & Chave de Acesso
  const infNFe = doc.querySelector('infNFe');
  let chaveAcesso = '';
  if (infNFe && infNFe.getAttribute('Id')) {
    chaveAcesso = infNFe.getAttribute('Id').replace(/\D/g, '');
  }
  if (!chaveAcesso) chaveAcesso = getText('chNFe');

  // Identificação da Nota
  const ide = doc.querySelector('ide');
  const numero = ide ? (getText('nNF', ide) || getText('numero', ide)) : '';
  const serie = ide ? (getText('serie', ide) || '1') : '1';
  const dataEmissaoRaw = ide ? (getText('dhEmi', ide) || getText('dEmi', ide)) : '';
  const dataEmissao = dataEmissaoRaw ? dataEmissaoRaw.split('T')[0] : new Date().toISOString().split('T')[0];
  const tpNF = ide ? getText('tpNF', ide) : '0';
  const tipoOperacao = (tpNF === '0') ? 'E' : 'S';
  const natOp = ide ? getText('natOp', ide) : 'Venda / Compra de Mercadoria';

  // Emitente
  const emit = doc.querySelector('emit');
  const emitNome = emit ? getText('xNome', emit) : '';
  const emitCnpj = emit ? (getText('CNPJ', emit) || getText('CPF', emit)) : '';
  const emitIe = emit ? getText('IE', emit) : '';
  const emitMun = emit ? getText('xMun', emit) : '';
  const emitUf = emit ? getText('UF', emit) : '';

  // Destinatário
  const dest = doc.querySelector('dest');
  const destNome = dest ? getText('xNome', dest) : '';
  const destCnpj = dest ? (getText('CNPJ', dest) || getText('CPF', dest)) : '';
  const destIe = dest ? getText('IE', dest) : '';
  const destMun = dest ? getText('xMun', dest) : '';
  const destUf = dest ? getText('UF', dest) : '';

  // Totais
  const total = doc.querySelector('total');
  const valorTotalNota = total ? (parseFloat(getText('vNF', total)) || 0) : 0;
  const valorTotalProdutos = total ? (parseFloat(getText('vProd', total)) || valorTotalNota) : valorTotalNota;

  // Itens da Nota (<det>)
  const itens = [];
  const detElements = doc.querySelectorAll('det');
  detElements.forEach((det, idx) => {
    const prod = det.querySelector('prod');
    if (prod) {
      const cProd = getText('cProd', prod) || `ITM-${idx + 1}`;
      const xProd = getText('xProd', prod) || 'Produto sem descrição';
      const ncm = getText('NCM', prod) || '';
      const cfop = getText('CFOP', prod) || '';
      const uCom = getText('uCom', prod) || 'UN';
      const qCom = parseFloat(getText('qCom', prod)) || 1;
      const vUnCom = parseFloat(getText('vUnCom', prod)) || 0;
      const vProd = parseFloat(getText('vProd', prod)) || (qCom * vUnCom);

      itens.push({
        numeroItem: idx + 1,
        codigo: cProd,
        descricao: xProd,
        ncm,
        cfop,
        unidade: uCom,
        quantidade: qCom,
        valorUnitario: vUnCom,
        subtotal: vProd
      });
    }
  });

  return {
    id: Date.now(),
    numero: parseInt(numero, 10) || Date.now().toString().slice(-5),
    serie,
    tipo: tipoOperacao,
    tipoOperacao,
    dataEmissao,
    naturezaOperacao: natOp,
    chaveAcesso,
    situacao: 'Autorizada',
    valorTotal: valorTotalNota || valorTotalProdutos,
    valorNota: valorTotalNota || valorTotalProdutos,
    emitente: { nome: emitNome, cnpj: emitCnpj, ie: emitIe, municipio: emitMun, uf: emitUf },
    destinatario: { nome: destNome, cnpj: destCnpj, ie: destIe, municipio: destMun, uf: destUf },
    contato: (tipoOperacao === 'E') 
      ? { nome: emitNome, numeroDocumento: emitCnpj } 
      : { nome: destNome, numeroDocumento: destCnpj },
    itens
  };
}

function renderParsedXmlPreview(nfe) {
  const preview = document.getElementById('xmlParsedPreview');
  if (!preview) return;

  preview.style.display = 'block';
  const titleEl = document.getElementById('xmlNfeTitle');
  if (titleEl) titleEl.textContent = `NF-e nº ${nfe.numero} - Série ${nfe.serie}`;
  const natOpEl = document.getElementById('xmlNfeNatOp');
  if (natOpEl) natOpEl.textContent = `Natureza da Operação: ${nfe.naturezaOperacao || 'Geral'}`;
  
  const badge = document.getElementById('xmlNfeTipoBadge');
  if (badge) {
    const isEntrada = nfe.tipo === 'E' || nfe.tipo === 0;
    badge.className = isEntrada ? 'badge-tipo pj' : 'badge-tipo pf';
    badge.textContent = isEntrada ? 'Entrada (Compra)' : 'Saída (Venda)';
  }

  const emitNome = document.getElementById('xmlEmitNome');
  if (emitNome) emitNome.textContent = nfe.emitente?.nome || '--';
  const emitDoc = document.getElementById('xmlEmitDoc');
  if (emitDoc) emitDoc.textContent = `CNPJ/CPF: ${formatDocument(nfe.emitente?.cnpj) || '--'}`;
  const emitEnd = document.getElementById('xmlEmitEnd');
  if (emitEnd) emitEnd.textContent = `${nfe.emitente?.municipio || ''} / ${nfe.emitente?.uf || ''}`;

  const destNome = document.getElementById('xmlDestNome');
  if (destNome) destNome.textContent = nfe.destinatario?.nome || '--';
  const destDoc = document.getElementById('xmlDestDoc');
  if (destDoc) destDoc.textContent = `CNPJ/CPF: ${formatDocument(nfe.destinatario?.cnpj) || '--'}`;
  const destEnd = document.getElementById('xmlDestEnd');
  if (destEnd) destEnd.textContent = `${nfe.destinatario?.municipio || ''} / ${nfe.destinatario?.uf || ''}`;

  const chaveEl = document.getElementById('xmlNfeChave');
  if (chaveEl) chaveEl.textContent = nfe.chaveAcesso || 'Gerada pelo Emissor';
  const itemCountEl = document.getElementById('xmlItemCount');
  if (itemCountEl) itemCountEl.textContent = nfe.itens?.length || 0;
  const totalNotaEl = document.getElementById('xmlTotalNotaPreview');
  if (totalNotaEl) totalNotaEl.textContent = `Total: ${formatCurrency(nfe.valorTotal)}`;

  const tbody = document.getElementById('xmlItemsTableBody');
  if (tbody && nfe.itens) {
    tbody.innerHTML = nfe.itens.map(item => `
      <tr>
        <td class="text-mono" style="text-align: center;">${item.numeroItem}</td>
        <td class="text-mono font-bold">${escapeHtml(item.codigo)}</td>
        <td><strong>${escapeHtml(item.descricao)}</strong></td>
        <td class="text-mono">${escapeHtml(item.ncm || '--')}</td>
        <td class="text-mono">${escapeHtml(item.cfop || '--')}</td>
        <td style="text-align: center;">${item.quantidade} ${escapeHtml(item.unidade)}</td>
        <td style="text-align: right;">${formatCurrency(item.valorUnitario)}</td>
        <td style="text-align: right;"><span class="text-emerald font-bold">${formatCurrency(item.subtotal)}</span></td>
      </tr>
    `).join('');
  }
}

// --------------------------------------------------------------------------
// Funções da Aba Manual Item a Item
// --------------------------------------------------------------------------

window.addManualNfeItemRow = function(item = {}) {
  const tbody = document.getElementById('manualNfeItemsBody');
  if (!tbody) return;

  const row = document.createElement('tr');
  row.className = 'manual-nfe-item-row';
  row.innerHTML = `
    <td>
      <input type="text" class="form-control text-mono item-cod" placeholder="PRD-01" value="${item.codigo || ''}" style="font-size: 11px; padding: 4px 6px;">
    </td>
    <td>
      <input type="text" class="form-control item-desc" placeholder="Nome do item..." value="${item.descricao || ''}" required style="font-size: 11px; padding: 4px 6px;">
    </td>
    <td>
      <input type="text" class="form-control text-mono item-ncm" placeholder="8415.10" value="${item.ncm || ''}" style="font-size: 11px; padding: 4px 6px;">
    </td>
    <td>
      <select class="form-control item-un" style="font-size: 11px; padding: 4px 2px;">
        <option value="UN" ${item.unidade === 'UN' ? 'selected' : ''}>UN</option>
        <option value="PC" ${item.unidade === 'PC' ? 'selected' : ''}>PC</option>
        <option value="RL" ${item.unidade === 'RL' ? 'selected' : ''}>RL</option>
        <option value="M" ${item.unidade === 'M' ? 'selected' : ''}>M</option>
        <option value="SV" ${item.unidade === 'SV' ? 'selected' : ''}>SV</option>
        <option value="KG" ${item.unidade === 'KG' ? 'selected' : ''}>KG</option>
      </select>
    </td>
    <td>
      <input type="number" step="0.01" class="form-control text-center item-qtd" placeholder="1" value="${item.quantidade || 1}" oninput="recalculateManualNfeTotals()" style="font-size: 11px; padding: 4px 4px;">
    </td>
    <td>
      <input type="number" step="0.01" class="form-control text-right item-vlr" placeholder="0.00" value="${item.valorUnitario || ''}" oninput="recalculateManualNfeTotals()" required style="font-size: 11px; padding: 4px 6px;">
    </td>
    <td style="text-align: right; vertical-align: middle;">
      <span class="text-emerald font-bold item-subtotal" style="font-size: 11px;">R$ 0,00</span>
    </td>
    <td style="text-align: center; vertical-align: middle;">
      <button type="button" class="btn btn-danger btn-xs" onclick="removeManualNfeItemRow(this)" title="Remover item">
        <i class="fa-solid fa-trash"></i>
      </button>
    </td>
  `;

  tbody.appendChild(row);
  recalculateManualNfeTotals();
};

window.removeManualNfeItemRow = function(btn) {
  const row = btn.closest('tr');
  if (row) {
    row.remove();
    recalculateManualNfeTotals();
  }
};

window.recalculateManualNfeTotals = function() {
  const rows = document.querySelectorAll('.manual-nfe-item-row');
  let totalItens = 0;
  let totalValor = 0;

  rows.forEach(row => {
    const qtd = parseFloat(row.querySelector('.item-qtd')?.value) || 0;
    const vlr = parseFloat(row.querySelector('.item-vlr')?.value) || 0;
    const subtotal = qtd * vlr;

    totalItens += qtd;
    totalValor += subtotal;

    const subtotalEl = row.querySelector('.item-subtotal');
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  });

  const lblQtd = document.getElementById('manNfeTotalItensQtd');
  if (lblQtd) lblQtd.textContent = totalItens;

  const lblTotal = document.getElementById('manNfeTotalValor');
  if (lblTotal) lblTotal.textContent = formatCurrency(totalValor);
};

window.handleSaveNfe = async function() {
  const btnSubmit = document.getElementById('btnSubmitNfe');
  let nfePayload = null;

  if (currentNfeTab === 'xml') {
    if (!pendingParsedXmlNfe) {
      showNotification('Por favor, selecione ou arraste um arquivo XML da NF-e antes de salvar.', 'error');
      return;
    }
    nfePayload = pendingParsedXmlNfe;
  } else {
    // Aba Manual
    const tipo = document.getElementById('manNfeTipo').value;
    const numero = document.getElementById('manNfeNumero').value.trim();
    const serie = document.getElementById('manNfeSerie').value.trim() || '1';
    const dataEmissao = document.getElementById('manNfeData').value;
    const contatoNome = document.getElementById('manNfeContatoNome').value.trim();
    const contatoDoc = document.getElementById('manNfeContatoDoc').value.trim();
    const natOp = document.getElementById('manNfeNatOp').value.trim();
    let chave = document.getElementById('manNfeChave').value.trim();

    if (!numero || !dataEmissao || !contatoNome) {
      showNotification('Preencha os campos obrigatórios: Número, Data e Nome do Contato.', 'error');
      return;
    }

    // Coleta itens manuais
    const rows = document.querySelectorAll('.manual-nfe-item-row');
    const itens = [];
    let totalValor = 0;

    rows.forEach((row, idx) => {
      const desc = row.querySelector('.item-desc')?.value.trim();
      const cod = row.querySelector('.item-cod')?.value.trim() || `ITM-${idx + 1}`;
      const ncm = row.querySelector('.item-ncm')?.value.trim() || '';
      const un = row.querySelector('.item-un')?.value || 'UN';
      const qtd = parseFloat(row.querySelector('.item-qtd')?.value) || 1;
      const vlr = parseFloat(row.querySelector('.item-vlr')?.value) || 0;
      const subtotal = qtd * vlr;

      if (desc) {
        itens.push({
          numeroItem: idx + 1,
          codigo: cod,
          descricao: desc,
          ncm,
          unidade: un,
          quantidade: qtd,
          valorUnitario: vlr,
          subtotal
        });
        totalValor += subtotal;
      }
    });

    if (itens.length === 0) {
      showNotification('Adicione pelo menos 1 item na nota fiscal.', 'error');
      return;
    }

    if (!chave) {
      chave = '352603' + Math.random().toString().slice(2, 16) + '55001' + String(numero).padStart(9, '0') + '1008451239';
      if (chave.length > 44) chave = chave.substring(0, 44);
    }

    nfePayload = {
      id: Date.now(),
      numero: parseInt(numero, 10) || numero,
      serie,
      tipo,
      tipoOperacao: tipo,
      dataEmissao,
      naturezaOperacao: natOp || 'Operação Fiscal Padrão',
      chaveAcesso: chave,
      situacao: 'Autorizada',
      valorTotal,
      valorNota: totalValor,
      contato: { nome: contatoNome, numeroDocumento: contatoDoc },
      itens
    };
  }

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando Nota Fiscal...';

  try {
    const response = await fetch('/api/nfe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify(nfePayload)
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erro ao salvar nota fiscal');

    showNotification(`Nota Fiscal nº ${nfePayload.numero} salva com sucesso!`, 'success');
    closeModal(document.getElementById('modalNewNfe'));

    // Se estiver na tela de NF-e recarrega, senão navega até ela
    if (state.currentModule === 'nfe') {
      state.allData.unshift(nfePayload);
      applyModuleFilters();
      updateModuleKPIs('nfe', state.allData);
    } else {
      await switchERPView('nfe');
    }
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Nota Fiscal no Bling & Supabase';
  }
};

// ==========================================================================
// CADASTRO E EDIÇÃO DE CLIENTES & CONTATOS (BLING & SUPABASE)
// ==========================================================================

window.openNewClientModal = function() {
  state.editingId = null;
  const form = document.getElementById('formNewClient');
  if (form) form.reset();
  const btn = document.getElementById('btnSubmitClient');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Cliente no Bling & Supabase';
  const modal = document.getElementById('modalNewClient');
  if (modal) openModal(modal);
};

window.handleSaveClient = async function() {
  const btn = document.getElementById('btnSubmitClient');
  const nome = document.getElementById('cliNome').value.trim();
  const fantasia = document.getElementById('cliFantasia').value.trim();
  const tipo = document.getElementById('cliTipo').value;
  const doc = document.getElementById('cliDoc').value.trim();
  const ie = document.getElementById('cliIe').value.trim();
  const email = document.getElementById('cliEmail').value.trim();
  const telefone = document.getElementById('cliTelefone').value.trim();
  const cep = document.getElementById('cliCep').value.trim();
  const endereco = document.getElementById('cliEndereco').value.trim();
  const bairro = document.getElementById('cliBairro').value.trim();
  const cidade = document.getElementById('cliCidade').value.trim();
  const uf = document.getElementById('cliUf').value.trim();
  const obs = document.getElementById('cliObs').value.trim();

  if (!nome || !doc) {
    showNotification('Preencha os campos obrigatórios: Nome/Razão Social e CPF/CNPJ.', 'error');
    return;
  }

  const isEditing = !!state.editingId;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${isEditing ? 'Atualizando' : 'Salvando'} Cliente...`;

  try {
    const payload = {
      nome, fantasia, tipo, numeroDocumento: doc, ie, email, telefone,
      cep, endereco, bairro, cidade, uf, observacoes: obs
    };

    const endpoint = isEditing ? `/api/contatos/${state.editingId}` : '/api/contatos';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.authToken}` },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar cliente');

    showNotification(`Cliente "${nome}" ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`, 'success');
    closeModal(document.getElementById('modalNewClient'));

    if (isEditing) {
      const idx = state.allData.findIndex(i => String(i.id) === String(state.editingId));
      if (idx !== -1) state.allData[idx] = Object.assign(state.allData[idx], payload);
    } else {
      state.allData.unshift(data.data || payload);
    }

    state.editingId = null;
    applyModuleFilters();
    updateModuleKPIs('clients', state.allData);
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Cliente no Bling & Supabase';
  }
};

// ==========================================================================
// CADASTRO E EDIÇÃO DE PEDIDOS DE VENDA
// ==========================================================================

// ==========================================================================
// AUTOCOMPLETE DE CLIENTE DO BLING — Busca em /api/contatos
// ==========================================================================

let _clientSearchTimer = null;
let _clientAutocompleteData = [];
let _clientHighlightIndex = -1;

async function searchBlingClientsAPI(term) {
  // Se estiver em Modo Demo, busca da base de demonstração
  if (state.dataSource === 'demo') {
    try {
      const res = await fetch('/api/demo-data');
      if (res.ok) {
        const json = await res.json();
        const clients = json.clientes || [];
        const lower = term.toLowerCase();
        return clients.filter(c =>
          (c.nome && c.nome.toLowerCase().includes(lower)) ||
          (c.fantasia && c.fantasia.toLowerCase().includes(lower)) ||
          (c.numeroDocumento && c.numeroDocumento.includes(lower))
        ).slice(0, 10);
      }
    } catch {
      return [];
    }
  }

  try {
    const res = await fetch(`/api/contatos?pesquisa=${encodeURIComponent(term)}&limite=10&criterio=1`, {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { isError: true, unauth: res.status === 401 || err.error?.includes('autenticado'), message: err.error || err.message };
    }
    const json = await res.json();
    return json?.data || [];
  } catch (err) {
    return { isError: true, message: err.message };
  }
}

function renderClientDropdown(items, dropdown) {
  if (!dropdown) return;
  if (items && items.isError) {
    if (items.unauth || !state.isBlingAuthenticated) {
      dropdown.innerHTML = `<div class="client-autocomplete-item" style="cursor:default;padding:12px;">
        <span class="ac-name" style="color:var(--bling-orange);font-size:12px;"><i class="fa-solid fa-triangle-exclamation"></i> Integração Bling desconectada</span>
        <span class="ac-doc" style="margin-top:4px;color:var(--text-secondary);">Faça login no Bling pelo ícone <i class="fa-solid fa-key"></i> no cabeçalho ou alterne para o <b>Modo Demo</b> no topo.</span>
      </div>`;
    } else {
      dropdown.innerHTML = `<div class="client-autocomplete-item"><span class="ac-name" style="color:var(--text-muted);font-weight:400;">Erro ao consultar clientes no Bling.</span></div>`;
    }
    dropdown.classList.add('open');
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    dropdown.innerHTML = `<div class="client-autocomplete-item"><span class="ac-name" style="color:var(--text-muted);font-weight:400;">Nenhum cliente encontrado no Bling.</span></div>`;
  } else {
    dropdown.innerHTML = items.map((c, i) => {
      const nome = c.nome || c.fantasia || '—';
      const doc = c.numeroDocumento ? `CPF/CNPJ: ${c.numeroDocumento}` : '';
      return `<div class="client-autocomplete-item" data-idx="${i}"
                   onmousedown="selectOrderClient(${i})"
                   onmouseover="highlightClientItem(${i})">
        <span class="ac-name">${nome}</span>
        ${doc ? `<span class="ac-doc">${doc}</span>` : ''}
      </div>`;
    }).join('');
  }
  dropdown.classList.add('open');
}

window.onOrderClientSearch = function(value) {
  const dropdown = document.getElementById('clientAutocompleteDropdown');
  clearTimeout(_clientSearchTimer);
  _clientHighlightIndex = -1;
  // Mantém o texto atual digitado
  document.getElementById('ordClienteId').value = '';
  document.getElementById('ordCliente').value = value.trim();
  if (value.length < 2) {
    if (dropdown) dropdown.classList.remove('open');
    return;
  }
  if (dropdown) {
    dropdown.innerHTML = `<div class="client-autocomplete-loading"><i class="fa-solid fa-spinner fa-spin"></i> Buscando clientes...</div>`;
    dropdown.classList.add('open');
  }
  _clientSearchTimer = setTimeout(async () => {
    _clientAutocompleteData = await searchBlingClientsAPI(value);
    renderClientDropdown(_clientAutocompleteData, dropdown);
  }, 320);
};

window.selectOrderClient = function(idx) {
  const client = _clientAutocompleteData[idx];
  if (!client) return;
  const nome = client.nome || client.fantasia || '';
  const searchInput = document.getElementById('ordClienteSearch');
  if (searchInput) searchInput.value = nome;
  document.getElementById('ordClienteId').value = client.id || '';
  document.getElementById('ordCliente').value = nome;
  const dropdown = document.getElementById('clientAutocompleteDropdown');
  if (dropdown) dropdown.classList.remove('open');
  _clientHighlightIndex = -1;
};

window.highlightClientItem = function(idx) {
  _clientHighlightIndex = idx;
  document.querySelectorAll('#clientAutocompleteDropdown .client-autocomplete-item')
    .forEach((el, i) => el.classList.toggle('highlighted', i === idx));
};

function initOrderClientKeyNav() {
  const input = document.getElementById('ordClienteSearch');
  const dropdown = document.getElementById('clientAutocompleteDropdown');
  if (!input || !dropdown) return;
  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.client-autocomplete-item');
    if (!dropdown.classList.contains('open') || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _clientHighlightIndex = Math.min(_clientHighlightIndex + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('highlighted', i === _clientHighlightIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _clientHighlightIndex = Math.max(_clientHighlightIndex - 1, 0);
      items.forEach((el, i) => el.classList.toggle('highlighted', i === _clientHighlightIndex));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (_clientHighlightIndex >= 0) selectOrderClient(_clientHighlightIndex);
    } else if (e.key === 'Escape') {
      dropdown.classList.remove('open');
    }
  });
  input.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.remove('open'), 200);
  });
}

// ==========================================================================
// ITENS DO PEDIDO — Tabela Dinâmica
// ==========================================================================

function _makeOrderItemRow(num) {
  return `
    <tr class="order-item-row">
      <td class="item-num">${num}</td>
      <td><input type="text" class="order-item-input item-desc" placeholder="Pesquise por código, descrição ou GTIN" oninput="recalcOrderTotals()"></td>
      <td><input type="text" class="order-item-input item-code"></td>
      <td><input type="text" class="order-item-input item-un" value="UN"></td>
      <td><input type="number" class="order-item-input item-qty" value="1" min="0" step="0.001" oninput="recalcOrderTotals()"></td>
      <td><input type="number" class="order-item-input item-preco-lista" value="0.00" step="0.01" oninput="recalcOrderTotals()"></td>
      <td><input type="number" class="order-item-input item-desc-pct" value="0" min="0" max="100" step="0.01" oninput="recalcOrderTotals()"></td>
      <td><input type="number" class="order-item-input item-preco-un" value="0.00" step="0.01" oninput="recalcOrderTotals()"></td>
      <td><input type="number" class="order-item-input item-total" value="0.00" step="0.01" readonly></td>
      <td><button type="button" class="order-item-del-btn" onclick="removeOrderItem(this)" title="Remover"><i class="fa-solid fa-trash-can"></i></button></td>
    </tr>`;
}

window.addOrderItem = function() {
  const tbody = document.getElementById('orderItemsBody');
  if (!tbody) return;
  const count = tbody.querySelectorAll('.order-item-row').length + 1;
  tbody.insertAdjacentHTML('beforeend', _makeOrderItemRow(count));
};

window.removeOrderItem = function(btn) {
  const tbody = document.getElementById('orderItemsBody');
  if (!tbody) return;
  if (tbody.querySelectorAll('.order-item-row').length <= 1) return;
  btn.closest('.order-item-row').remove();
  // Renumerar
  tbody.querySelectorAll('.order-item-row').forEach((row, i) => {
    const numCell = row.querySelector('.item-num');
    if (numCell) numCell.textContent = i + 1;
  });
  recalcOrderTotals();
};

window.recalcOrderTotals = function() {
  const rows = document.querySelectorAll('#orderItemsBody .order-item-row');
  let nItens = 0, somaQtd = 0, totalItens = 0, totalDescItens = 0;

  rows.forEach(row => {
    const qty        = parseFloat(row.querySelector('.item-qty')?.value)          || 0;
    const precoLista = parseFloat(row.querySelector('.item-preco-lista')?.value)  || 0;
    const descPct    = parseFloat(row.querySelector('.item-desc-pct')?.value)     || 0;
    let   precoUn    = parseFloat(row.querySelector('.item-preco-un')?.value)     || 0;

    // Se lista definida, recalcular preço unitário automaticamente
    if (precoLista > 0) {
      precoUn = precoLista * (1 - descPct / 100);
      const puInput = row.querySelector('.item-preco-un');
      if (puInput && document.activeElement !== puInput) puInput.value = precoUn.toFixed(2);
    }

    const rowTotal    = qty * precoUn;
    const rowDescVal  = qty * Math.max(0, precoLista - precoUn);
    const totInput    = row.querySelector('.item-total');
    if (totInput) totInput.value = rowTotal.toFixed(2);

    if (qty > 0 || precoUn > 0) nItens++;
    somaQtd     += qty;
    totalItens  += rowTotal;
    totalDescItens += rowDescVal;
  });

  const descVenda      = parseFloat(document.getElementById('totDesconto')?.value)      || 0;
  const outrasDespesas = parseFloat(document.getElementById('totOutrasDespesas')?.value) || 0;
  const frete          = parseFloat(document.getElementById('ordFrete')?.value)          || 0;
  const totalVenda     = Math.max(0, totalItens - descVenda + outrasDespesas + frete);

  const fmt = n => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };

  set('totNItens',    nItens);
  set('totSomaQtd',   fmt(somaQtd));
  set('totDescItens', fmt(totalDescItens));
  set('totDescTotal', fmt(descVenda));
  set('totTotalItens', fmt(totalItens));
  set('totValorTotal', fmt(totalVenda));
};

window.switchOrderTab = function(tab) {
  const isItens = tab === 'itens';
  const tabItens = document.getElementById('tabItens');
  const tabComissoes = document.getElementById('tabComissoes');
  if (tabItens)     tabItens.style.display     = isItens ? '' : 'none';
  if (tabComissoes) tabComissoes.style.display  = isItens ? 'none' : '';
  document.getElementById('tabBtnItens')?.classList.toggle('active', isItens);
  document.getElementById('tabBtnComissoes')?.classList.toggle('active', !isItens);
};

// ==========================================================================
// ABRIR MODAL DE PEDIDO DE VENDA
// ==========================================================================

window.openNewOrderModal = function() {
  state.editingId = null;
  _clientAutocompleteData = [];
  _clientHighlightIndex = -1;

  // Reset form
  const form = document.getElementById('formNewOrder');
  if (form) form.reset();

  // Reset tabela de itens (1 linha limpa)
  const tbody = document.getElementById('orderItemsBody');
  if (tbody) tbody.innerHTML = _makeOrderItemRow(1);

  // Reset totais
  const totIds = ['totNItens','totSomaQtd','totDescTotal','totComissoes','totDescItens','totTotalItens','totValorTotal'];
  totIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'totNItens' ? '0' : (id === 'totComissoes' ? '-0,00' : '0,00');
  });

  // Data de hoje
  const hoje = new Date().toISOString().split('T')[0];
  const dataInput = document.getElementById('ordData');
  if (dataInput) dataInput.value = hoje;

  // Restaurar banner
  const banner = document.getElementById('orderInfoBanner');
  if (banner) banner.style.display = '';

  // Tab inicial
  switchOrderTab('itens');

  // Título padrão
  const titleEl = document.getElementById('orderModalTitle');
  if (titleEl) titleEl.textContent = 'Pedido de venda';

  // Botão salvar
  const btn = document.getElementById('btnSubmitOrder');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar';

  // Abrir modal
  const modal = document.getElementById('modalNewOrder');
  if (modal) openModal(modal);

  // Focar campo cliente
  setTimeout(() => {
    const clientInput = document.getElementById('ordClienteSearch');
    if (clientInput) clientInput.focus();
  }, 120);
};

// ==========================================================================
// SALVAR PEDIDO DE VENDA
// ==========================================================================

window.handleSaveOrder = async function() {
  const btn = document.getElementById('btnSubmitOrder');
  const clienteNome = (document.getElementById('ordCliente')?.value?.trim()) ||
                      (document.getElementById('ordClienteSearch')?.value?.trim());
  const clienteId   = document.getElementById('ordClienteId')?.value?.trim();

  if (!clienteNome) {
    showNotification('Selecione um Cliente para continuar.', 'error');
    document.getElementById('ordClienteSearch')?.focus();
    return;
  }

  const isEditing = !!state.editingId;
  if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${isEditing ? 'Atualizando' : 'Salvando'}...`; }

  // Coletar itens da tabela dinâmica
  const itemRows = document.querySelectorAll('#orderItemsBody .order-item-row');
  const itens = Array.from(itemRows).map(row => ({
    descricao:      row.querySelector('.item-desc')?.value?.trim() || '',
    codigo:         row.querySelector('.item-code')?.value?.trim() || '',
    unidade:        row.querySelector('.item-un')?.value?.trim()   || 'UN',
    quantidade:     parseFloat(row.querySelector('.item-qty')?.value)        || 0,
    precoUnitario:  parseFloat(row.querySelector('.item-preco-un')?.value)   || 0,
    desconto:       parseFloat(row.querySelector('.item-desc-pct')?.value)   || 0,
    precoTotal:     parseFloat(row.querySelector('.item-total')?.value)      || 0,
  })).filter(it => it.descricao || it.quantidade > 0);

  // Total da venda (do campo calculado)
  const totalStr = document.getElementById('totValorTotal')?.value?.replace(/\./g, '').replace(',', '.') || '0';
  const total = parseFloat(totalStr) || 0;

  try {
    const payload = {
      numero:           document.getElementById('ordNumero')?.value ? parseInt(document.getElementById('ordNumero').value) : undefined,
      data:             document.getElementById('ordData')?.value,
      cliente:          clienteId ? { id: parseInt(clienteId), nome: clienteNome } : { nome: clienteNome },
      vendedor:         document.getElementById('ordVendedor')?.value?.trim()       || undefined,
      situacao:         document.getElementById('ordSituacao')?.value               || 'Em andamento',
      itens:            itens.length > 0 ? itens : [{ descricao: 'Item do Pedido', quantidade: 1, precoUnitario: total }],
      total,
      desconto:         parseFloat(document.getElementById('totDesconto')?.value)   || 0,
      outrasDespesas:   parseFloat(document.getElementById('totOutrasDespesas')?.value) || 0,
      frete:            parseFloat(document.getElementById('ordFrete')?.value)      || 0,
      condPagamento:    document.getElementById('ordCondPagamento')?.value?.trim()  || undefined,
      observacoes:      document.getElementById('ordObservacoes')?.value?.trim()    || undefined,
      observacoesInternas: document.getElementById('ordObsInternas')?.value?.trim() || undefined,
      dataSaida:        document.getElementById('ordDataSaida')?.value              || undefined,
      dataPrevista:     document.getElementById('ordDataPrevista')?.value           || undefined,
      pedidoCompra:     document.getElementById('ordPedidoCompra')?.value?.trim()   || undefined,
      // Campos de compatibilidade para exibição na tabela local
      itemDescricao:    itens[0]?.descricao || 'Item do Pedido',
      itensQtd:         itens.reduce((s, i) => s + i.quantidade, 0) || 1,
    };

    const endpoint = isEditing ? `/api/pedidos-vendas/${state.editingId}` : '/api/pedidos-vendas';
    const method   = isEditing ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.authToken}` },
      body: JSON.stringify(payload)
    });

    const dataRes = await res.json();
    if (!res.ok) throw new Error(dataRes.error || 'Erro ao salvar pedido');

    showNotification(`Pedido de Venda ${isEditing ? 'atualizado' : 'criado'} com sucesso!`, 'success');
    closeModal(document.getElementById('modalNewOrder'));

    if (isEditing) {
      const idx = state.allData.findIndex(i => String(i.id) === String(state.editingId));
      if (idx !== -1) state.allData[idx] = Object.assign(state.allData[idx], payload);
    } else {
      state.allData.unshift(dataRes.data || payload);
    }

    state.editingId = null;
    applyModuleFilters();
    updateModuleKPIs('orders', state.allData);
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar'; }
  }
};

// ==========================================================================
// CADASTRO E EDIÇÃO DE ORDENS DE SERVIÇO (OS)
// ==========================================================================

window.openNewServiceOrderModal = function() {
  state.editingId = null;
  const form = document.getElementById('formNewOs');
  if (form) form.reset();
  const dtAbertura = document.getElementById('osDataAbertura');
  if (dtAbertura) dtAbertura.value = new Date().toISOString().split('T')[0];
  const dtPrev = document.getElementById('osDataPrevisao');
  if (dtPrev) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    dtPrev.value = nextWeek.toISOString().split('T')[0];
  }
  const btn = document.getElementById('btnSubmitOs');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Ordem de Serviço';
  const modal = document.getElementById('modalNewServiceOrder');
  if (modal) openModal(modal);
};

window.handleSaveServiceOrder = async function() {
  const btn = document.getElementById('btnSubmitOs');
  const numero = document.getElementById('osNumero').value.trim();
  const cliente = document.getElementById('osCliente').value.trim();
  const descricao = document.getElementById('osDescricao').value.trim();
  const responsavel = document.getElementById('osResponsavel').value.trim();
  const situacao = document.getElementById('osSituacao').value;
  const dataAbertura = document.getElementById('osDataAbertura').value;
  const dataPrevisao = document.getElementById('osDataPrevisao').value;
  const valorTotal = parseFloat(document.getElementById('osValorTotal').value) || 0;

  if (!cliente || !descricao || !responsavel || !valorTotal) {
    showNotification('Preencha os campos obrigatórios da OS.', 'error');
    return;
  }

  const isEditing = !!state.editingId;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${isEditing ? 'Atualizando' : 'Salvando'} OS...`;

  try {
    const payload = {
      numero: numero ? parseInt(numero, 10) : Math.floor(1000 + Math.random() * 9000),
      cliente: { nome: cliente },
      descricao,
      responsavel,
      situacao,
      dataAbertura,
      dataPrevisao,
      valorTotal
    };

    const endpoint = isEditing ? `/api/ordens-servicos/${state.editingId}` : '/api/ordens-servicos';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.authToken}` },
      body: JSON.stringify(payload)
    });

    const dataRes = await res.json();
    if (!res.ok) throw new Error(dataRes.error || 'Erro ao salvar Ordem de Serviço');

    showNotification(`Ordem de Serviço ${isEditing ? 'atualizada' : 'criada'} com sucesso!`, 'success');
    closeModal(document.getElementById('modalNewServiceOrder'));

    if (isEditing) {
      const idx = state.allData.findIndex(i => String(i.id) === String(state.editingId));
      if (idx !== -1) state.allData[idx] = Object.assign(state.allData[idx], payload);
    } else {
      state.allData.unshift(dataRes.data || payload);
    }

    state.editingId = null;
    applyModuleFilters();
    updateModuleKPIs('serviceOrders', state.allData);
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Ordem de Serviço';
  }
};

// ==========================================================================
// CADASTRO E EDIÇÃO FINANCEIRA (CONTAS A RECEBER / A PAGAR)
// ==========================================================================

window.openNewFinanceModal = function(type = 'R') {
  state.editingId = null;
  const form = document.getElementById('formNewFinance');
  if (form) form.reset();
  const tipoSelect = document.getElementById('finTipo');
  if (tipoSelect) tipoSelect.value = type;
  updateFinanceModalType(type);
  const venc = document.getElementById('finVencimento');
  if (venc) venc.value = new Date().toISOString().split('T')[0];
  const btn = document.getElementById('btnSubmitFinance');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Lançamento';
  const modal = document.getElementById('modalNewFinance');
  if (modal) openModal(modal);
};

window.updateFinanceModalType = function(type) {
  const lbl = document.getElementById('lblFinContato');
  const title = document.getElementById('financeModalTitle');
  if (type === 'P') {
    if (lbl) lbl.textContent = 'Fornecedor / Favorecido *';
    if (title) title.innerHTML = '<i class="fa-solid fa-money-bill-wave text-red"></i> <h3>Conta a Pagar (Despesa)</h3>';
  } else {
    if (lbl) lbl.textContent = 'Cliente / Pagador *';
    if (title) title.innerHTML = '<i class="fa-solid fa-hand-holding-dollar text-emerald"></i> <h3>Conta a Receber (Receita)</h3>';
  }
};

window.handleSaveFinance = async function() {
  const btn = document.getElementById('btnSubmitFinance');
  const tipo = document.getElementById('finTipo').value;
  const doc = document.getElementById('finDoc').value.trim();
  const cat = document.getElementById('finCategoria').value.trim();
  const contato = document.getElementById('finContato').value.trim();
  const venc = document.getElementById('finVencimento').value;
  const valor = parseFloat(document.getElementById('finValor').value) || 0;
  const situacao = document.getElementById('finSituacao').value;

  if (!contato || !venc || !valor) {
    showNotification('Preencha os campos obrigatórios: Contato, Vencimento e Valor.', 'error');
    return;
  }

  const isEditing = !!state.editingId;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${isEditing ? 'Atualizando' : 'Salvando'} Lançamento...`;

  try {
    const isReceber = (tipo === 'R');
    const baseEndpoint = isReceber ? '/api/contas-receber' : '/api/contas-pagar';
    const endpoint = isEditing ? `${baseEndpoint}/${state.editingId}` : baseEndpoint;
    const method = isEditing ? 'PUT' : 'POST';

    const payload = isReceber ? {
      numeroDocumento: doc || `FAT-${Math.floor(1000 + Math.random() * 9000)}`,
      cliente: contato,
      vencimento: venc,
      valor,
      saldo: (situacao === 'Liquidada') ? 0 : valor,
      situacao
    } : {
      numeroDocumento: doc || `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      fornecedor: contato,
      vencimento: venc,
      valor,
      situacao: (situacao === 'Liquidada') ? 'Paga' : 'Aberta',
      categoria: cat || 'Geral'
    };

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.authToken}` },
      body: JSON.stringify(payload)
    });

    const dataRes = await res.json();
    if (!res.ok) throw new Error(dataRes.error || 'Erro ao salvar financeiro');

    showNotification(`Lançamento financeiro ${isEditing ? 'atualizado' : 'salvo'} com sucesso!`, 'success');
    closeModal(document.getElementById('modalNewFinance'));

    const targetModule = isReceber ? 'receivables' : 'payables';
    if (isEditing) {
      const idx = state.allData.findIndex(i => String(i.id) === String(state.editingId));
      if (idx !== -1) state.allData[idx] = Object.assign(state.allData[idx], payload);
    } else {
      state.allData.unshift(dataRes.data || payload);
    }

    state.editingId = null;
    applyModuleFilters();
    updateModuleKPIs(targetModule, state.allData);
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Lançamento';
  }
};

// ==========================================================================
// FUNÇÕES UNIFICADAS DE EDIÇÃO E EXCLUSÃO (BLING API v3)
// ==========================================================================

window.openEditModal = function(moduleKey, itemId) {
  const item = state.allData.find(i => String(i.id) === String(itemId));
  if (!item) {
    showNotification('Registro não encontrado para edição.', 'error');
    return;
  }

  state.editingId = item.id;

  if (moduleKey === 'clients') {
    openNewClientModal();
    state.editingId = item.id;
    document.getElementById('cliNome').value = item.nome || item.descricao || '';
    document.getElementById('cliFantasia').value = item.fantasia || '';
    document.getElementById('cliTipo').value = item.tipo || 'J';
    document.getElementById('cliDoc').value = item.numeroDocumento || '';
    document.getElementById('cliIe').value = item.ie || item.rg || '';
    document.getElementById('cliEmail').value = item.email || '';
    document.getElementById('cliTelefone').value = item.telefone || item.celular || '';
    const end = item.endereco?.geral || item.endereco || {};
    document.getElementById('cliCep').value = end.cep || '';
    document.getElementById('cliEndereco').value = end.endereco || '';
    document.getElementById('cliBairro').value = end.bairro || '';
    document.getElementById('cliCidade').value = end.municipio || end.cidade || '';
    document.getElementById('cliUf').value = end.uf || '';
    document.getElementById('cliObs').value = item.observacoes || '';
    const btn = document.getElementById('btnSubmitClient');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar Cliente no Bling';
  } else if (moduleKey === 'products' || moduleKey === 'services') {
    openNewProductModal(item.tipo || 'P');
    state.editingId = item.id;
    document.getElementById('prodNome').value = item.nome || item.descricao || '';
    document.getElementById('prodCodigo').value = item.codigo || '';
    document.getElementById('prodTipo').value = item.tipo || 'P';
    const cat = typeof item.categoria === 'object' ? (item.categoria?.descricao || '') : (item.categoria || '');
    document.getElementById('prodCategoria').value = cat;
    document.getElementById('prodUnidade').value = item.unidade || 'UN';
    const pVenda = typeof item.preco === 'object' ? (item.preco?.preco || 0) : (item.preco || 0);
    const pCusto = typeof item.precoCusto === 'object' ? (item.precoCusto?.preco || 0) : (item.precoCusto || 0);
    document.getElementById('prodPreco').value = pVenda;
    document.getElementById('prodPrecoCusto').value = pCusto;
    const est = typeof item.estoque === 'object' ? (item.estoque?.saldoFisicoTotal || 0) : (item.estoque || 0);
    document.getElementById('prodEstoque').value = est;
    document.getElementById('prodNcm').value = item.tributacao?.ncm || item.ncm || '';
    
    const existingImg = item.imagemURL || item.midia?.imagens?.externas?.[0]?.link || item.anexos?.[0]?.url || item.imagens?.[0]?.link || '';
    document.getElementById('prodImagemURL').value = existingImg;
    
    // Atualizar preview visual de imagem no modal
    const previewBox = document.getElementById('uploadPreviewBox');
    const previewImg = document.getElementById('uploadPreviewImg');
    const zoneContent = document.getElementById('uploadZoneContent');
    if (existingImg && previewBox && previewImg) {
      previewImg.src = existingImg;
      previewBox.style.display = 'inline-block';
      if (zoneContent) zoneContent.style.display = 'none';
    } else {
      if (previewBox) previewBox.style.display = 'none';
      if (zoneContent) zoneContent.style.display = 'flex';
    }

    document.getElementById('prodObservacoes').value = item.observacoes || item.descricaoCurta || '';
    const btn = document.getElementById('btnSubmitNewProduct');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar Produto no Bling';
  } else if (moduleKey === 'orders' || moduleKey === 'proposals') {
    openNewOrderModal();
    state.editingId = item.id;
    // Número e datas
    const numEl = document.getElementById('ordNumero');
    if (numEl) numEl.value = item.numero || '';
    const dataEl = document.getElementById('ordData');
    if (dataEl) dataEl.value = item.data || item.dataEmissao || new Date().toISOString().split('T')[0];
    const dataSaidaEl = document.getElementById('ordDataSaida');
    if (dataSaidaEl) dataSaidaEl.value = item.dataSaida || '';
    const dataPrevEl = document.getElementById('ordDataPrevista');
    if (dataPrevEl) dataPrevEl.value = item.dataPrevista || '';
    // Cliente
    const clientName = typeof item.cliente === 'object' ? (item.cliente?.nome || '') : (item.cliente || '');
    const clientId   = typeof item.cliente === 'object' ? (item.cliente?.id   || '') : '';
    const searchEl = document.getElementById('ordClienteSearch');
    if (searchEl) searchEl.value = clientName;
    const hiddenNome = document.getElementById('ordCliente');
    if (hiddenNome) hiddenNome.value = clientName;
    const hiddenId = document.getElementById('ordClienteId');
    if (hiddenId) hiddenId.value = clientId;
    // Outros campos
    const vendEl = document.getElementById('ordVendedor');
    if (vendEl) vendEl.value = item.vendedor || '';
    const sitEl = document.getElementById('ordSituacao');
    if (sitEl) sitEl.value = item.situacao || 'Em andamento';
    const obsEl = document.getElementById('ordObservacoes');
    if (obsEl) obsEl.value = item.observacoes || '';
    const obsIntEl = document.getElementById('ordObsInternas');
    if (obsIntEl) obsIntEl.value = item.observacoesInternas || '';
    // Preencher itens na tabela
    if (item.itens && item.itens.length > 0) {
      const tbody = document.getElementById('orderItemsBody');
      if (tbody) {
        tbody.innerHTML = '';
        item.itens.forEach((it, idx) => {
          tbody.insertAdjacentHTML('beforeend', _makeOrderItemRow(idx + 1));
          const rows = tbody.querySelectorAll('.order-item-row');
          const row  = rows[idx];
          if (row) {
            row.querySelector('.item-desc').value       = it.descricao      || '';
            row.querySelector('.item-code').value       = it.codigo         || '';
            row.querySelector('.item-un').value         = it.unidade        || 'UN';
            row.querySelector('.item-qty').value        = it.quantidade     || 1;
            row.querySelector('.item-preco-lista').value = it.precoLista    || 0;
            row.querySelector('.item-desc-pct').value   = it.desconto       || 0;
            row.querySelector('.item-preco-un').value   = it.precoUnitario  || 0;
          }
        });
      }
    } else {
      // Compatibilidade: preencher 1ª linha com dados antigos
      const firstRow = document.querySelector('#orderItemsBody .order-item-row');
      if (firstRow) {
        firstRow.querySelector('.item-desc').value    = item.itemDescricao || 'Item do Pedido';
        firstRow.querySelector('.item-qty').value     = item.itensQtd     || 1;
        firstRow.querySelector('.item-preco-un').value = item.total       || 0;
      }
    }
    recalcOrderTotals();
    // Título e botão
    const titleEl = document.getElementById('orderModalTitle');
    if (titleEl) titleEl.textContent = `Pedido de venda - ${item.numero || item.id}`;
    const btn = document.getElementById('btnSubmitOrder');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar Pedido';
  } else if (moduleKey === 'serviceOrders') {
    openNewServiceOrderModal();
    state.editingId = item.id;
    document.getElementById('osNumero').value = item.numero || item.id;
    const clientName = typeof item.cliente === 'object' ? item.cliente?.nome : (item.cliente || '');
    document.getElementById('osCliente').value = clientName;
    document.getElementById('osDescricao').value = item.descricao || '';
    document.getElementById('osResponsavel').value = item.responsavel || '';
    document.getElementById('osSituacao').value = item.situacao || 'Em Execução';
    document.getElementById('osDataAbertura').value = item.dataAbertura || new Date().toISOString().split('T')[0];
    document.getElementById('osDataPrevisao').value = item.dataPrevisao || new Date().toISOString().split('T')[0];
    document.getElementById('osValorTotal').value = item.valorTotal || 0;
    const btn = document.getElementById('btnSubmitOs');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar OS no Bling';
  } else if (moduleKey === 'receivables' || moduleKey === 'payables') {
    const isRec = (moduleKey === 'receivables');
    openNewFinanceModal(isRec ? 'R' : 'P');
    state.editingId = item.id;
    document.getElementById('finDoc').value = item.numeroDocumento || '';
    document.getElementById('finCategoria').value = item.categoria || '';
    document.getElementById('finContato').value = isRec ? (item.cliente || '') : (item.fornecedor || '');
    document.getElementById('finVencimento').value = item.vencimento || new Date().toISOString().split('T')[0];
    document.getElementById('finValor').value = item.valor || 0;
    document.getElementById('finSituacao').value = item.situacao || 'Aberta';
    const btn = document.getElementById('btnSubmitFinance');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar Lançamento no Bling';
  }
};

window.editCurrentSelectedItem = function() {
  if (!state.selectedItem) return;
  const mod = state.currentModule || 'clients';
  closeDrawer();
  openEditModal(mod, state.selectedItem.id);
};

window.deleteCurrentSelectedItem = async function() {
  if (!state.selectedItem) return;
  const itemTitle = state.selectedItem.nome || state.selectedItem.descricao || state.selectedItem.numeroDocumento || state.selectedItem.id;
  if (!confirm(`Deseja realmente excluir este registro (${itemTitle}) no Bling?`)) {
    return;
  }

  const mod = state.currentModule;
  const id = state.selectedItem.id;
  const endpointMap = {
    clients: `/api/contatos/${id}`,
    products: `/api/produtos/${id}`,
    services: `/api/produtos/${id}`,
    orders: `/api/pedidos-vendas/${id}`,
    serviceOrders: `/api/ordens-servicos/${id}`,
    receivables: `/api/contas-receber/${id}`,
    payables: `/api/contas-pagar/${id}`
  };

  const endpoint = endpointMap[mod];
  if (!endpoint) {
    showNotification('A exclusão direta não está disponível para este módulo.', 'info');
    return;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    if (!res.ok) throw new Error('Falha ao excluir registro no servidor.');

    showNotification('Registro excluído com sucesso!', 'success');
    closeDrawer();

    state.allData = state.allData.filter(i => String(i.id) !== String(id));
    applyModuleFilters();
    updateModuleKPIs(mod, state.allData);
  } catch (err) {
    showNotification(err.message, 'error');
  }
};

// Close Handlers Helper para todos os novos modais
document.addEventListener('DOMContentLoaded', () => {
  const bindClose = (btnId, modalId) => {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    if (btn && modal) btn.addEventListener('click', () => {
      state.editingId = null;
      closeModal(modal);
    });
  };

  bindClose('btnCloseNewClientModal', 'modalNewClient');
  bindClose('btnCloseNewClientModalFooter', 'modalNewClient');
  bindClose('btnCloseNewOrderModal', 'modalNewOrder');
  bindClose('btnCloseNewOrderModalFooter', 'modalNewOrder'); // mantido por compatibilidade
  // Inicializar navegação por teclado do autocomplete de cliente
  initOrderClientKeyNav();
  bindClose('btnCloseNewOsModal', 'modalNewServiceOrder');
  bindClose('btnCloseNewOsModalFooter', 'modalNewServiceOrder');
  bindClose('btnCloseNewFinanceModal', 'modalNewFinance');
  bindClose('btnCloseNewFinanceModalFooter', 'modalNewFinance');

  // ---- Kits & Quotes Modals ----
  bindClose('btnCloseKitModal', 'modalKitBuilder');
  bindClose('btnCloseQuoteModal', 'modalQuoteBuilder');
  bindClose('btnCloseKitPicker', 'modalKitPicker');
  bindClose('btnCloseKitProductPicker', 'modalKitProductPicker');
  bindClose('btnCloseExportModal', 'modalExportBling');
  bindClose('btnCloseQuotePrint', 'modalQuotePrint');
});

// ==========================================================================
// MÓDULO: GESTÃO DE KITS DE PRODUTOS
// ==========================================================================

let kitItemCounter = 0;
let kitProductSearchTimers = {};

function openKitBuilder(kitData = null) {
  const modal = document.getElementById('modalKitBuilder');
  if (!modal) return;

  // Limpar formulário
  document.getElementById('kitId').value = '';
  document.getElementById('kitNome').value = '';
  document.getElementById('kitCodigo').value = '';
  document.getElementById('kitDescricao').value = '';
  document.getElementById('kitImagemUrl').value = '';
  document.getElementById('kitUsarPrecoFixo').checked = false;
  document.getElementById('kitPrecoFixo').value = '0';
  document.getElementById('kitPrecoFixoWrapper').style.display = 'none';
  document.getElementById('kitItemsBody').innerHTML = '';
  document.getElementById('kitTotalCalculado').textContent = 'R$ 0,00';
  document.getElementById('kitBuilderTitle').textContent = kitData ? 'Editar Kit' : 'Novo Kit de Produtos';
  kitItemCounter = 0;

  if (kitData) {
    document.getElementById('kitId').value = kitData.id || '';
    document.getElementById('kitNome').value = kitData.nome || '';
    document.getElementById('kitCodigo').value = kitData.codigo || '';
    document.getElementById('kitDescricao').value = kitData.descricao || '';
    document.getElementById('kitImagemUrl').value = kitData.imagem_url || '';
    if (kitData.usar_preco_fixo) {
      document.getElementById('kitUsarPrecoFixo').checked = true;
      document.getElementById('kitPrecoFixoWrapper').style.display = 'flex';
      document.getElementById('kitPrecoFixo').value = kitData.preco_fixo || 0;
    }
    (kitData.itens || []).forEach(it => addKitItemRow(it));
  } else {
    addKitItemRow();
  }

  modal.classList.add('active');
  recalcKitTotal();
}

function toggleKitPrecoFixo(checked) {
  document.getElementById('kitPrecoFixoWrapper').style.display = checked ? 'flex' : 'none';
}

function addKitItemRow(item = null) {
  // Usado ao CARREGAR kit existente (com dados já preenchidos)
  if (item) {
    addKitItemRowFromProduct({
      id: item.bling_product_id || null,
      nome: item.product_name || '',
      codigo: item.product_code || '',
      unidade: item.product_unit || 'UN',
      preco: item.unit_price || 0
    }, item.quantity || 1);
  }
  // Se chamado sem item, redireciona para o picker
}

// Linha manual (sem produto do Bling)
function addKitManualRow() {
  const idx = ++kitItemCounter;
  const tbody = document.getElementById('kitItemsBody');
  if (!tbody) return;
  const row = document.createElement('tr');
  row.id = `kitRow${idx}`;
  row.innerHTML = `
    <td style="text-align:center;color:var(--text-muted);font-size:11px;">${idx}</td>
    <td>
      <input type="text" class="kit-item-input" id="kitProdName${idx}" placeholder="Descrição do item..." style="font-weight:600;">
      <input type="hidden" id="kitProdId${idx}" value="">
    </td>
    <td><input type="text" class="kit-item-input" id="kitProdCode${idx}" placeholder="-"></td>
    <td><input type="text" class="kit-item-input" id="kitProdUnit${idx}" value="UN" style="max-width:40px;"></td>
    <td><input type="number" class="kit-item-input" id="kitProdQty${idx}" value="1" min="0.001" step="0.001" style="text-align:right;" oninput="recalcKitTotal()"></td>
    <td><input type="number" class="kit-item-input" id="kitProdPrice${idx}" value="0" min="0" step="0.01" style="text-align:right;" oninput="recalcKitTotal()"></td>
    <td style="font-weight:600;text-align:right;padding-right:8px;" id="kitRowTotal${idx}">R$ 0,00</td>
    <td>
      <button type="button" onclick="removeKitItemRow(${idx})" style="background:none;border:none;cursor:pointer;color:#EF4444;padding:4px 6px;">
        <i class="fa-solid fa-times"></i>
      </button>
    </td>
  `;
  tbody.appendChild(row);
  document.getElementById(`kitProdName${idx}`)?.focus();
  recalcKitTotal();
}

// Adiciona linha com produto já selecionado do Bling
function addKitItemRowFromProduct(prod, qty = 1) {
  const idx = ++kitItemCounter;
  const tbody = document.getElementById('kitItemsBody');
  if (!tbody) return;

  const nomeProd = prod.nome || prod.descricao || '';
  const codigo = prod.codigo || '';
  const unidade = prod.unidade || 'UN';
  const preco = parseFloat(prod.preco) || 0;

  const row = document.createElement('tr');
  row.id = `kitRow${idx}`;
  row.innerHTML = `
    <td style="text-align:center;color:var(--text-muted);font-size:11px;">${idx}</td>
    <td>
      <div style="display:flex;align-items:center;gap:6px;">
        ${prod.imagemURL ? `<img src="${prod.imagemURL}" style="width:28px;height:28px;border-radius:4px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">` : '<i class="fa-solid fa-box" style="color:#6366F1;width:28px;text-align:center;"></i>'}
        <div>
          <input type="text" class="kit-item-input" id="kitProdName${idx}" value="${escapeAttr(nomeProd)}" style="font-weight:600;" placeholder="Nome do produto">
          <input type="hidden" id="kitProdId${idx}" value="${prod.id || ''}">
        </div>
      </div>
    </td>
    <td><input type="text" class="kit-item-input" id="kitProdCode${idx}" value="${escapeAttr(codigo)}" placeholder="-" style="font-size:11px;"></td>
    <td><input type="text" class="kit-item-input" id="kitProdUnit${idx}" value="${escapeAttr(unidade)}" style="max-width:40px;"></td>
    <td><input type="number" class="kit-item-input" id="kitProdQty${idx}" value="${qty}" min="0.001" step="0.001" style="text-align:right;" oninput="recalcKitTotal()"></td>
    <td><input type="number" class="kit-item-input" id="kitProdPrice${idx}" value="${preco}" min="0" step="0.01" style="text-align:right;" oninput="recalcKitTotal()"></td>
    <td style="font-weight:600;text-align:right;padding-right:8px;" id="kitRowTotal${idx}">R$ 0,00</td>
    <td>
      <button type="button" onclick="removeKitItemRow(${idx})" style="background:none;border:none;cursor:pointer;color:#EF4444;padding:4px 6px;">
        <i class="fa-solid fa-times"></i>
      </button>
    </td>
  `;
  tbody.appendChild(row);
  recalcKitTotal();
}

function escapeAttr(str) {
  return String(str || '').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ---- Modal de Seletor de Produto do Bling para Kit ----
let kitProdPickerTimer = null;

function openKitProductPickerModal() {
  const modal = document.getElementById('modalKitProductPicker');
  if (!modal) return;
  // Reset
  const searchInput = document.getElementById('kitProdPickerSearch');
  if (searchInput) { searchInput.value = ''; searchInput.focus(); }
  const results = document.getElementById('kitProdPickerResults');
  if (results) results.innerHTML = `
    <div style="text-align:center;color:var(--text-muted);padding:40px 20px;">
      <i class="fa-solid fa-magnifying-glass" style="font-size:28px;margin-bottom:8px;display:block;"></i>
      Digite pelo menos 2 caracteres para buscar produtos
    </div>`;
  modal.classList.add('active');
  setTimeout(() => searchInput?.focus(), 100);
}

async function onKitProdPickerSearch(query) {
  if (kitProdPickerTimer) clearTimeout(kitProdPickerTimer);
  const resultsEl = document.getElementById('kitProdPickerResults');
  if (!resultsEl) return;

  if (!query || query.trim().length < 2) {
    resultsEl.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:40px 20px;">
      <i class="fa-solid fa-magnifying-glass" style="font-size:28px;margin-bottom:8px;display:block;"></i>
      Digite pelo menos 2 caracteres para buscar produtos</div>`;
    return;
  }

  resultsEl.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);">
    <i class="fa-solid fa-spinner fa-spin" style="font-size:22px;"></i><br><br>Buscando no catálogo Bling...</div>`;

  kitProdPickerTimer = setTimeout(async () => {
    try {
      const res = await apiRequest(`/api/produtos?pesquisa=${encodeURIComponent(query.trim())}&limite=30`);
      const prods = res?.data || [];
      renderKitProdResults(prods, query);
    } catch(e) {
      resultsEl.innerHTML = `<div style="text-align:center;padding:30px;color:#EF4444;"><i class="fa-solid fa-triangle-exclamation" style="font-size:22px;"></i><br><br>Erro ao buscar: ${e.message}</div>`;
    }
  }, 380);
}

function renderKitProdResults(prods, query) {
  const resultsEl = document.getElementById('kitProdPickerResults');
  if (!resultsEl) return;

  if (!prods.length) {
    resultsEl.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);">
      <i class="fa-solid fa-box-open" style="font-size:28px;margin-bottom:8px;display:block;"></i>
      Nenhum produto encontrado para "${escapeHtml(query)}"<br>
      <small style="font-size:11px;">Tente um termo diferente ou use "Adicionar item manual"</small>
    </div>`;
    return;
  }

  resultsEl.innerHTML = `
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;padding:0 2px;">${prods.length} produto(s) encontrado(s). Clique para adicionar ao kit.</div>
    <div style="display:flex;flex-direction:column;gap:4px;">
    ${prods.map(p => {
      const preco = typeof p.preco === 'object' ? (p.preco?.preco || 0) : parseFloat(p.preco || 0);
      const estoque = typeof p.estoque === 'object' ? (p.estoque?.saldoFisicoTotal ?? '—') : (p.estoque ?? '—');
      const imgUrl = p.imagemURL || (p.imagens && p.imagens[0]?.link) || '';
      const unidade = p.unidade || 'UN';
      const categoria = typeof p.categoria === 'object' ? (p.categoria?.descricao || '') : (p.categoria || '');

      return `
        <div onclick="addKitItemRowFromProduct(${JSON.stringify({id:p.id,nome:p.nome||p.descricao||'',codigo:p.codigo||'',unidade,preco,imagemURL:imgUrl}).replace(/"/g,'&quot;')}); document.getElementById('modalKitProductPicker').classList.remove('active');"
          style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer;transition:background .12s,border-color .12s;"
          onmouseover="this.style.background='var(--bling-blue-light)';this.style.borderColor='var(--bling-blue)';"
          onmouseout="this.style.background='';this.style.borderColor='var(--border-color)';">
          <div style="width:44px;height:44px;flex-shrink:0;">
            ${imgUrl
              ? `<img src="${imgUrl}" style="width:44px;height:44px;border-radius:6px;object-fit:cover;" onerror="this.outerHTML='<div style=\'width:44px;height:44px;border-radius:6px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;\'><i class=\'fa-solid fa-box\' style=\'color:#6366F1;\'></i></div>'">`
              : `<div style="width:44px;height:44px;border-radius:6px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-box" style="color:#6366F1;"></i></div>`
            }
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.nome || p.descricao || '—')}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
              <span class="text-mono">${escapeHtml(p.codigo || '—')}</span>
              ${categoria ? `· <span>${escapeHtml(categoria)}</span>` : ''}
              · Estoque: <strong>${estoque} ${unidade}</strong>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:15px;font-weight:800;color:var(--bling-green-dark);">R$ ${preco.toFixed(2).replace('.',',')}</div>
            <div style="font-size:10px;color:var(--text-muted);">${unidade}</div>
          </div>
          <div style="flex-shrink:0;">
            <span style="background:var(--bling-green);color:#fff;border-radius:6px;padding:5px 10px;font-size:12px;font-weight:700;">
              <i class="fa-solid fa-plus"></i> Adicionar
            </span>
          </div>
        </div>
      `;
    }).join('')}
    </div>
  `;
}

function removeKitItemRow(idx) {
  const row = document.getElementById(`kitRow${idx}`);
  if (row) { row.remove(); recalcKitTotal(); }
}

function recalcKitTotal() {
  let total = 0;
  const rows = document.querySelectorAll('#kitItemsBody tr');
  rows.forEach(row => {
    const idMatch = row.id.match(/kitRow(\d+)/);
    if (!idMatch) return;
    const idx = idMatch[1];
    const qty = parseFloat(document.getElementById(`kitProdQty${idx}`)?.value) || 0;
    const price = parseFloat(document.getElementById(`kitProdPrice${idx}`)?.value) || 0;
    const sub = qty * price;
    total += sub;
    const totalEl = document.getElementById(`kitRowTotal${idx}`);
    if (totalEl) totalEl.textContent = 'R$ ' + sub.toFixed(2).replace('.', ',');
  });
  const el = document.getElementById('kitTotalCalculado');
  if (el) el.textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
}

// closeKitProdDropdown - stub for compatibility
function closeKitProdDropdown(idx) {}
async function onKitProductSearch(idx, query) {}
function selectKitProduct(idx, id, nome, codigo, unidade, preco) {}

function getKitItemsFromForm() {
  const items = [];
  const rows = document.querySelectorAll('#kitItemsBody tr');
  rows.forEach(row => {
    const idMatch = row.id?.match(/kitRow(\d+)/);
    if (!idMatch) return;
    const idx = idMatch[1];
    // Suporta tanto kitProdName (novo) quanto kitProdSearch (legado)
    const nomeEl = document.getElementById(`kitProdName${idx}`) || document.getElementById(`kitProdSearch${idx}`);
    const nome = nomeEl?.value?.trim();
    if (!nome) return;
    items.push({
      bling_product_id: document.getElementById(`kitProdId${idx}`)?.value || null,
      product_code: document.getElementById(`kitProdCode${idx}`)?.value || '',
      product_name: nome,
      product_unit: document.getElementById(`kitProdUnit${idx}`)?.value || 'UN',
      quantity: parseFloat(document.getElementById(`kitProdQty${idx}`)?.value) || 1,
      unit_price: parseFloat(document.getElementById(`kitProdPrice${idx}`)?.value) || 0,
    });
  });
  return items;
}

async function handleSaveKit() {
  const nome = document.getElementById('kitNome').value.trim();
  if (!nome) { showToast('O nome do kit é obrigatório.', 'warning'); return; }

  const itens = getKitItemsFromForm();
  if (!itens.length) { showToast('Adicione pelo menos um produto ao kit.', 'warning'); return; }

  const payload = {
    id: document.getElementById('kitId').value || undefined,
    nome,
    codigo: document.getElementById('kitCodigo').value.trim() || null,
    descricao: document.getElementById('kitDescricao').value.trim() || null,
    imagem_url: document.getElementById('kitImagemUrl').value.trim() || null,
    usar_preco_fixo: document.getElementById('kitUsarPrecoFixo').checked,
    preco_fixo: parseFloat(document.getElementById('kitPrecoFixo').value) || 0,
    ativo: true,
    itens
  };
  if (!payload.id) delete payload.id;

  try {
    const method = payload.id ? 'PUT' : 'POST';
    const url = payload.id ? `/api/kits/${payload.id}` : '/api/kits';
    const result = await apiRequest(url, { method, body: JSON.stringify(payload) });
    showToast(payload.id ? 'Kit atualizado com sucesso!' : 'Kit criado com sucesso!', 'success');
    document.getElementById('modalKitBuilder').classList.remove('active');
    // Se estiver na página de kits, recarregar
    if (state.currentModule === 'kits') loadModuleData('kits');
  } catch(e) {
    showToast('Erro ao salvar kit: ' + (e.message || ''), 'error');
  }
}

// ==========================================================================
// MÓDULO: FAST QUOTE BUILDER — CONSTRUTOR ÁGIL DE ORÇAMENTOS
// ==========================================================================

let quoteItems = []; // array de itens do orçamento em memória
let quoteItemIdCounter = 0;
let quoteClientSearchTimer = null;

function openQuoteBuilder(quoteData = null) {
  const modal = document.getElementById('modalQuoteBuilder');
  if (!modal) return;

  // Reset
  quoteItems = [];
  quoteItemIdCounter = 0;
  document.getElementById('quoteId').value = '';
  document.getElementById('quoteClienteSearch').value = '';
  document.getElementById('quoteClienteId').value = '';
  document.getElementById('quoteClienteNome').value = '';
  document.getElementById('quoteTitulo').value = '';
  document.getElementById('quoteStatus').value = 'rascunho';
  document.getElementById('quoteDataEmissao').value = new Date().toISOString().split('T')[0];
  document.getElementById('quoteValidadeDias').value = '15';
  document.getElementById('quoteObservacoes').value = '';
  document.getElementById('quoteObsInternas').value = '';
  document.getElementById('qtDescontoPct').value = '0';
  document.getElementById('qtFrete').value = '0';
  document.getElementById('qtOutrasDespesas').value = '0';
  document.getElementById('quoteBlingBadge').style.display = 'none';
  document.getElementById('quoteBuilderTitle').textContent = quoteData ? `Orçamento ${quoteData.numero || ''}` : 'Novo Orçamento';

  if (quoteData) {
    document.getElementById('quoteId').value = quoteData.id || '';
    document.getElementById('quoteClienteSearch').value = quoteData.bling_contact_nome || '';
    document.getElementById('quoteClienteId').value = quoteData.bling_contact_id || '';
    document.getElementById('quoteClienteNome').value = quoteData.bling_contact_nome || '';
    document.getElementById('quoteTitulo').value = quoteData.titulo || '';
    document.getElementById('quoteStatus').value = quoteData.status || 'rascunho';
    document.getElementById('quoteDataEmissao').value = quoteData.data_emissao || new Date().toISOString().split('T')[0];
    document.getElementById('quoteValidadeDias').value = quoteData.validade_dias || '15';
    document.getElementById('quoteObservacoes').value = quoteData.observacoes || '';
    document.getElementById('quoteObsInternas').value = quoteData.obs_internas || '';
    document.getElementById('qtDescontoPct').value = quoteData.desconto_pct || '0';
    document.getElementById('qtFrete').value = quoteData.frete || '0';
    document.getElementById('qtOutrasDespesas').value = quoteData.outras_despesas || '0';
    if (quoteData.bling_pedido_id || quoteData.bling_proposta_id) {
      document.getElementById('quoteBlingBadge').style.display = 'block';
    }
    quoteItems = JSON.parse(JSON.stringify(quoteData.itens || []));
    quoteItems.forEach(it => { it._uid = ++quoteItemIdCounter; });
  }

  renderQuoteItems();
  recalcQuoteTotals();
  updateQuoteStatusBadge();
  modal.classList.add('active');
}

function updateQuoteStatusBadge() {
  const status = document.getElementById('quoteStatus')?.value || 'rascunho';
  const wrapper = document.getElementById('quoteStatusBadgeWrapper');
  if (!wrapper) return;
  const labels = { rascunho: 'Rascunho', apresentado: 'Apresentado', aprovado: 'Aprovado ✓', cancelado: 'Cancelado' };
  wrapper.innerHTML = `<span class="quote-status-badge qstatus-${status}">${labels[status] || status}</span>`;
  // Habilitar/desabilitar botão de exportar
  const btn = document.getElementById('btnExportarBling');
  if (btn) {
    btn.disabled = status !== 'aprovado';
    btn.style.opacity = status === 'aprovado' ? '1' : '0.5';
    btn.title = status === 'aprovado' ? 'Exportar para o Bling' : 'Mude o status para "Aprovado" para exportar';
  }
}

function renderQuoteItems() {
  const tbody = document.getElementById('quoteItemsBody');
  if (!tbody) return;

  if (!quoteItems.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">
      <i class="fa-solid fa-layer-group"></i> Adicione Kits ou Produtos usando os botões acima</td></tr>`;
    return;
  }

  tbody.innerHTML = quoteItems.map((item, idx) => {
    const uid = item._uid;
    if (item.tipo === 'kit') {
      const kitTotal = calcItemTotal(item);
      return `
        <tr class="quote-item-row quote-kit-header">
          <td style="padding:6px 8px;"><i class="fa-solid fa-layer-group" style="color:#F59E0B;"></i></td>
          <td style="padding:6px 8px;font-weight:700;" colspan="3">🧰 ${escapeHtml(item.nome || item.descricao || 'Kit')}</td>
          <td style="text-align:right;padding:6px;"><input type="number" class="qi-input" value="${item.quantidade || 1}" min="1" step="1"
              onchange="updateQuoteItemField(${uid}, 'quantidade', parseFloat(this.value)||1)" style="width:60px;text-align:right;"></td>
          <td style="padding:6px 8px;text-align:right;font-size:12px;color:var(--text-muted);">Preço do kit</td>
          <td></td>
          <td style="padding:6px 8px;text-align:right;font-weight:800;color:var(--bling-green-dark);">R$ ${kitTotal.toFixed(2).replace('.',',')}</td>
          <td style="padding:4px;">
            <button onclick="removeQuoteItem(${uid})" style="background:none;border:none;cursor:pointer;color:#EF4444;padding:2px 5px;"><i class="fa-solid fa-times"></i></button>
          </td>
        </tr>
        ${(item.itens_kit || []).map(ki => `
          <tr class="quote-item-row quote-kit-sub">
            <td style="padding:4px 8px;"><span style="font-size:10px;color:var(--text-muted);padding-left:12px;">└</span></td>
            <td style="padding:4px 8px;font-size:12px;color:var(--text-secondary);">${escapeHtml(ki.product_name || '')}</td>
            <td style="padding:4px 8px;font-size:11px;color:var(--text-muted);">${escapeHtml(ki.product_code || '')}</td>
            <td style="padding:4px 8px;font-size:11px;">${escapeHtml(ki.product_unit || 'UN')}</td>
            <td style="padding:4px 8px;text-align:right;font-size:12px;">${parseFloat(ki.quantity||1)} × ${parseFloat(item.quantidade||1)}</td>
            <td style="padding:4px 8px;text-align:right;font-size:12px;">R$ ${parseFloat(ki.unit_price||0).toFixed(2).replace('.',',')}</td>
            <td></td>
            <td style="padding:4px 8px;text-align:right;font-size:12px;">R$ ${(ki.quantity * item.quantidade * ki.unit_price).toFixed(2).replace('.',',')}</td>
            <td></td>
          </tr>
        `).join('')}
      `;
    } else {
      const total = calcItemTotal(item);
      return `
        <tr class="quote-item-row">
          <td style="padding:6px 4px;text-align:center;color:var(--text-muted);font-size:11px;">${idx + 1}</td>
          <td style="padding:4px 6px;"><input type="text" class="qi-input" value="${escapeHtml(item.descricao||item.nome||'')}"
              onchange="updateQuoteItemField(${uid}, 'descricao', this.value)"></td>
          <td style="padding:4px 6px;"><input type="text" class="qi-input" value="${escapeHtml(item.codigo||'')}"
              onchange="updateQuoteItemField(${uid}, 'codigo', this.value)" style="width:80px;"></td>
          <td style="padding:4px 6px;"><input type="text" class="qi-input" value="${escapeHtml(item.unidade||'UN')}"
              onchange="updateQuoteItemField(${uid}, 'unidade', this.value)" style="width:40px;"></td>
          <td style="padding:4px 6px;"><input type="number" class="qi-input" value="${item.quantidade||1}" min="0.001" step="0.001"
              onchange="updateQuoteItemField(${uid}, 'quantidade', parseFloat(this.value)||1)" style="width:70px;text-align:right;"></td>
          <td style="padding:4px 6px;"><input type="number" class="qi-input" value="${item.preco_unitario||0}" min="0" step="0.01"
              onchange="updateQuoteItemField(${uid}, 'preco_unitario', parseFloat(this.value)||0)" style="width:100px;text-align:right;"></td>
          <td style="padding:4px 6px;"><input type="number" class="qi-input" value="${item.desconto_item_pct||0}" min="0" max="100" step="0.1"
              onchange="updateQuoteItemField(${uid}, 'desconto_item_pct', parseFloat(this.value)||0)" style="width:55px;text-align:right;"></td>
          <td style="padding:4px 8px;text-align:right;font-weight:700;">R$ ${total.toFixed(2).replace('.',',')}</td>
          <td style="padding:4px;">
            <button onclick="removeQuoteItem(${uid})" style="background:none;border:none;cursor:pointer;color:#EF4444;padding:2px 5px;"><i class="fa-solid fa-times"></i></button>
          </td>
        </tr>
      `;
    }
  }).join('');
}

function calcItemTotal(item) {
  if (item.tipo === 'kit') {
    const qtd = parseFloat(item.quantidade) || 1;
    if (item.usar_preco_fixo && item.preco_fixo) return parseFloat(item.preco_fixo) * qtd;
    return (item.itens_kit || []).reduce((s, ki) => s + (ki.quantity * ki.unit_price * qtd), 0);
  }
  const qty = parseFloat(item.quantidade) || 1;
  const price = parseFloat(item.preco_unitario) || 0;
  const disc = parseFloat(item.desconto_item_pct) || 0;
  return qty * price * (1 - disc / 100);
}

function updateQuoteItemField(uid, field, value) {
  const item = quoteItems.find(i => i._uid === uid);
  if (!item) return;
  item[field] = value;
  recalcQuoteTotals();
  renderQuoteItems();
}

function removeQuoteItem(uid) {
  quoteItems = quoteItems.filter(i => i._uid !== uid);
  renderQuoteItems();
  recalcQuoteTotals();
}

function recalcQuoteTotals() {
  const subtotal = quoteItems.reduce((s, item) => s + calcItemTotal(item), 0);
  const discPct = parseFloat(document.getElementById('qtDescontoPct')?.value) || 0;
  const frete = parseFloat(document.getElementById('qtFrete')?.value) || 0;
  const outras = parseFloat(document.getElementById('qtOutrasDespesas')?.value) || 0;
  const discVal = subtotal * (discPct / 100);
  const total = subtotal - discVal + frete + outras;

  const fmt = v => 'R$ ' + v.toFixed(2).replace('.', ',');
  const el1 = document.getElementById('qtSubtotal');
  const el2 = document.getElementById('qtTotalFinal');
  if (el1) el1.textContent = fmt(subtotal);
  if (el2) el2.textContent = fmt(total);
}

// ---- Autocomplete de Cliente no Orçamento ----
function onQuoteClientSearch(query) {
  if (quoteClientSearchTimer) clearTimeout(quoteClientSearchTimer);
  const drop = document.getElementById('quoteClienteDropdown');
  if (!drop) return;

  document.getElementById('quoteClienteId').value = '';
  document.getElementById('quoteClienteNome').value = '';

  if (!query || query.length < 2) { drop.style.display = 'none'; drop.innerHTML = ''; return; }

  drop.innerHTML = '<div class="autocomplete-item"><i class="fa-solid fa-spinner fa-spin"></i> Buscando...</div>';
  drop.style.display = 'block';

  quoteClientSearchTimer = setTimeout(async () => {
    try {
      const res = await apiRequest(`/api/contatos?pesquisa=${encodeURIComponent(query)}&limite=12`);
      const clients = res?.data || [];
      if (!clients.length) {
        drop.innerHTML = '<div class="autocomplete-item" style="color:var(--text-muted);">Nenhum cliente encontrado.</div>';
        return;
      }
      drop.innerHTML = clients.map(c => {
        const nome = c.nome || c.fantasia || 'Sem nome';
        const doc = c.cpfCnpj || '';
        return `<div class="autocomplete-item" onclick="selectQuoteClient(${c.id}, '${nome.replace(/'/g,"\\'")}')">
          <strong>${nome}</strong> ${doc ? `<small style="color:var(--text-muted);">· ${doc}</small>` : ''}
        </div>`;
      }).join('');
    } catch(e) {
      drop.innerHTML = '<div class="autocomplete-item" style="color:#EF4444;">Erro ao buscar clientes.</div>';
    }
  }, 380);
}

function selectQuoteClient(id, nome) {
  document.getElementById('quoteClienteSearch').value = nome;
  document.getElementById('quoteClienteId').value = id;
  document.getElementById('quoteClienteNome').value = nome;
  const drop = document.getElementById('quoteClienteDropdown');
  if (drop) { drop.style.display = 'none'; drop.innerHTML = ''; }
}

// ---- Kit Picker (abrir modal de seleção de kit) ----
async function openKitPickerModal() {
  const modal = document.getElementById('modalKitPicker');
  if (!modal) return;
  modal.classList.add('active');

  const grid = document.getElementById('kitPickerGrid');
  grid.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:24px;grid-column:1/-1;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando kits...</div>';

  try {
    const res = await apiRequest('/api/kits?apenasAtivos=true');
    const kits = res?.data || [];
    if (!kits.length) {
      grid.innerHTML = '<div style="text-align:center;padding:24px;grid-column:1/-1;color:var(--text-muted);"><i class="fa-solid fa-box-open" style="font-size:32px;"></i><p style="margin-top:8px;">Nenhum kit cadastrado ainda.<br><a href="kits.html" style="color:var(--bling-green);">Clique aqui para criar kits</a></p></div>';
      return;
    }
    grid.innerHTML = kits.map(kit => {
      const totalKit = (kit.itens || []).reduce((s, it) => s + (it.quantity * it.unit_price), 0);
      const preco = kit.usar_preco_fixo ? parseFloat(kit.preco_fixo || 0) : totalKit;
      const img = kit.imagem_url
        ? `<img src="${kit.imagem_url}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;margin-bottom:8px;" onerror="this.style.display='none'">`
        : `<i class="fa-solid fa-layer-group" style="font-size:32px;color:#F59E0B;margin-bottom:8px;"></i>`;
      return `
        <div class="kit-picker-card" onclick="addKitToQuote(${JSON.stringify(kit).replace(/'/g,"&apos;")})">
          ${img}
          <div class="kpc-name">${escapeHtml(kit.nome)}</div>
          <div class="kpc-count">${(kit.itens||[]).length} produto(s)</div>
          <div class="kpc-price">R$ ${preco.toFixed(2).replace('.',',')}</div>
        </div>
      `;
    }).join('');
  } catch(e) {
    grid.innerHTML = `<div style="color:#EF4444;padding:16px;grid-column:1/-1;">Erro ao carregar kits: ${e.message}</div>`;
  }
}

function addKitToQuote(kit) {
  const uid = ++quoteItemIdCounter;
  const totalKit = (kit.itens || []).reduce((s, it) => s + (it.quantity * it.unit_price), 0);
  quoteItems.push({
    _uid: uid,
    tipo: 'kit',
    kit_id: kit.id,
    nome: kit.nome,
    descricao: kit.descricao || kit.nome,
    quantidade: 1,
    usar_preco_fixo: kit.usar_preco_fixo,
    preco_fixo: kit.preco_fixo,
    preco_total: kit.usar_preco_fixo ? kit.preco_fixo : totalKit,
    itens_kit: kit.itens || []
  });
  document.getElementById('modalKitPicker')?.classList.remove('active');
  renderQuoteItems();
  recalcQuoteTotals();
  showToast(`Kit "${kit.nome}" adicionado!`, 'success');
}

// ---- Product Picker para orçamento (produto avulso) ----
function openProductPickerForQuote() {
  const nome = prompt('Nome ou código do produto (busca no Bling):');
  if (!nome || nome.trim().length < 2) return;

  apiRequest(`/api/produtos?pesquisa=${encodeURIComponent(nome.trim())}&limite=10`)
    .then(res => {
      const prods = res?.data || [];
      if (!prods.length) { showToast('Nenhum produto encontrado.', 'warning'); return; }
      if (prods.length === 1) {
        addProductToQuote(prods[0]);
        return;
      }
      // Múltiplos resultados: mostrar lista simples
      const opts = prods.map((p, i) => `${i+1}. ${p.nome} (${p.codigo || 'sem código'}) - R$ ${parseFloat(p.preco||0).toFixed(2)}`).join('\n');
      const choice = prompt(`Selecione o produto (1-${prods.length}):\n\n${opts}`);
      const idx = parseInt(choice) - 1;
      if (!isNaN(idx) && prods[idx]) addProductToQuote(prods[idx]);
    })
    .catch(e => showToast('Erro ao buscar produto: ' + e.message, 'error'));
}

function addProductToQuote(prod) {
  const uid = ++quoteItemIdCounter;
  quoteItems.push({
    _uid: uid,
    tipo: 'produto',
    bling_product_id: prod.id,
    descricao: prod.nome || '',
    nome: prod.nome || '',
    codigo: prod.codigo || '',
    unidade: prod.unidade || 'UN',
    quantidade: 1,
    preco_unitario: parseFloat(prod.preco) || 0,
    desconto_item_pct: 0
  });
  renderQuoteItems();
  recalcQuoteTotals();
  showToast(`Produto "${prod.nome}" adicionado!`, 'success');
}

// ---- Salvar Orçamento ----
async function handleSaveQuote() {
  const clienteId = document.getElementById('quoteClienteId')?.value;
  const clienteNome = document.getElementById('quoteClienteNome')?.value || document.getElementById('quoteClienteSearch')?.value;

  if (!clienteNome) { showToast('Informe o cliente do orçamento.', 'warning'); return; }
  if (!quoteItems.length) { showToast('Adicione pelo menos um item ao orçamento.', 'warning'); return; }

  const subtotal = quoteItems.reduce((s, item) => s + calcItemTotal(item), 0);
  const discPct = parseFloat(document.getElementById('qtDescontoPct')?.value) || 0;
  const frete = parseFloat(document.getElementById('qtFrete')?.value) || 0;
  const outras = parseFloat(document.getElementById('qtOutrasDespesas')?.value) || 0;
  const discVal = subtotal * (discPct / 100);
  const totalFinal = subtotal - discVal + frete + outras;

  const validadeDias = parseInt(document.getElementById('quoteValidadeDias')?.value) || 15;
  const dataEmissao = document.getElementById('quoteDataEmissao')?.value || new Date().toISOString().split('T')[0];
  const dataValidade = new Date(dataEmissao);
  dataValidade.setDate(dataValidade.getDate() + validadeDias);

  const payload = {
    id: document.getElementById('quoteId')?.value || undefined,
    titulo: document.getElementById('quoteTitulo')?.value || '',
    status: document.getElementById('quoteStatus')?.value || 'rascunho',
    bling_contact_id: clienteId ? parseInt(clienteId) : null,
    bling_contact_nome: clienteNome,
    itens: quoteItems.map(({ _uid, ...rest }) => rest),
    total_itens: subtotal,
    desconto_pct: discPct,
    desconto_valor: discVal,
    frete,
    outras_despesas: outras,
    total_final: totalFinal,
    validade_dias: validadeDias,
    data_emissao: dataEmissao,
    data_validade: dataValidade.toISOString().split('T')[0],
    observacoes: document.getElementById('quoteObservacoes')?.value || '',
    obs_internas: document.getElementById('quoteObsInternas')?.value || ''
  };
  if (!payload.id) delete payload.id;

  try {
    const method = payload.id ? 'PUT' : 'POST';
    const url = payload.id ? `/api/orcamentos/${payload.id}` : '/api/orcamentos';
    const result = await apiRequest(url, { method, body: JSON.stringify(payload) });
    const savedQuote = result?.data;
    if (savedQuote?.id) document.getElementById('quoteId').value = savedQuote.id;
    document.getElementById('quoteBuilderTitle').textContent = `Orçamento ${savedQuote?.numero || ''}`;
    showToast('Orçamento salvo com sucesso!', 'success');
    if (state.currentModule === 'quotes') loadModuleData('quotes');
  } catch(e) {
    showToast('Erro ao salvar orçamento: ' + (e.message || ''), 'error');
  }
}

// ---- Exportar para o Bling ----
function openExportBlingModal() {
  const quoteId = document.getElementById('quoteId')?.value;
  if (!quoteId) { showToast('Salve o orçamento antes de exportar.', 'warning'); return; }
  const status = document.getElementById('quoteStatus')?.value;
  if (status !== 'aprovado') { showToast('Mude o status para "Aprovado" para exportar.', 'warning'); return; }
  document.getElementById('exportBlingLoading').style.display = 'none';
  document.getElementById('modalExportBling').classList.add('active');
}

async function confirmarExportBling(destino) {
  const quoteId = document.getElementById('quoteId')?.value;
  if (!quoteId) return;

  const loading = document.getElementById('exportBlingLoading');
  const btns = document.querySelectorAll('#modalExportBling .btn:not(#exportBlingLoading .btn)');

  if (loading) loading.style.display = 'block';
  btns.forEach(b => b.disabled = true);

  try {
    // Salvar primeiro para garantir dados atualizados
    await handleSaveQuote();

    const res = await apiRequest(`/api/orcamentos/${quoteId}/exportar-bling`, {
      method: 'POST',
      body: JSON.stringify({ destino })
    });

    document.getElementById('modalExportBling').classList.remove('active');
    document.getElementById('quoteBlingBadge').style.display = 'block';
    showToast(res?.message || 'Exportado com sucesso para o Bling!', 'success');

    // Log com ID do Bling
    if (res?.bling_id) {
      console.log(`✅ Bling ${destino} criado com ID: ${res.bling_id}`);
    }
  } catch(e) {
    const msg = e.message || 'Erro ao exportar para o Bling.';
    showToast(msg, 'error');
  } finally {
    if (loading) loading.style.display = 'none';
    btns.forEach(b => b.disabled = false);
  }
}

// ---- Preview / Impressão ----
function openQuotePrintPreview() {
  const modal = document.getElementById('modalQuotePrint');
  const area = document.getElementById('quotePrintArea');
  if (!modal || !area) return;

  const clienteNome = document.getElementById('quoteClienteNome')?.value || document.getElementById('quoteClienteSearch')?.value || '—';
  const titulo = document.getElementById('quoteTitulo')?.value || 'Orçamento';
  const dataEmissao = document.getElementById('quoteDataEmissao')?.value || '';
  const validadeDias = document.getElementById('quoteValidadeDias')?.value || 15;
  const obs = document.getElementById('quoteObservacoes')?.value || '';
  const subtotal = quoteItems.reduce((s, item) => s + calcItemTotal(item), 0);
  const discPct = parseFloat(document.getElementById('qtDescontoPct')?.value) || 0;
  const frete = parseFloat(document.getElementById('qtFrete')?.value) || 0;
  const outras = parseFloat(document.getElementById('qtOutrasDespesas')?.value) || 0;
  const discVal = subtotal * (discPct / 100);
  const totalFinal = subtotal - discVal + frete + outras;
  const fmt = v => 'R$ ' + v.toFixed(2).replace('.', ',');

  area.innerHTML = `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;color:#1a1a1a;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #00A868;padding-bottom:16px;margin-bottom:20px;">
        <div>
          <h1 style="font-size:22px;font-weight:900;color:#00A868;margin:0;">ORÇAMENTO</h1>
          <p style="margin:4px 0 0;font-size:12px;color:#666;">FLR Instalações · flr.lynxems.com.br</p>
        </div>
        <div style="text-align:right;font-size:12px;color:#555;">
          <div><strong>Data:</strong> ${dataEmissao || '—'}</div>
          <div><strong>Validade:</strong> ${validadeDias} dias</div>
        </div>
      </div>

      <div style="background:#F8FAF9;border-radius:6px;padding:12px 16px;margin-bottom:16px;">
        <strong>Cliente:</strong> ${escapeHtml(clienteNome)}<br>
        ${titulo ? `<strong>Ref.:</strong> ${escapeHtml(titulo)}` : ''}
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
        <thead>
          <tr style="background:#00A868;color:#fff;">
            <th style="padding:8px;text-align:left;">Descrição</th>
            <th style="padding:8px;text-align:center;width:50px;">Qtd</th>
            <th style="padding:8px;text-align:right;width:120px;">Preço Unit.</th>
            <th style="padding:8px;text-align:right;width:120px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${quoteItems.map((item, i) => {
            const total = calcItemTotal(item);
            if (item.tipo === 'kit') {
              return `
                <tr style="background:#FFFBEB;font-weight:700;">
                  <td style="padding:7px 8px;" colspan="2">🧰 ${escapeHtml(item.nome || item.descricao || 'Kit')} (kit)</td>
                  <td></td>
                  <td style="padding:7px 8px;text-align:right;font-weight:800;">${fmt(total)}</td>
                </tr>
                ${(item.itens_kit||[]).map(ki => `
                  <tr style="background:#FFFBF5;">
                    <td style="padding:4px 8px;font-size:12px;padding-left:24px;">└ ${escapeHtml(ki.product_name||'')}</td>
                    <td style="padding:4px 8px;text-align:center;font-size:12px;">${ki.quantity * (item.quantidade||1)} ${ki.product_unit||'UN'}</td>
                    <td style="padding:4px 8px;text-align:right;font-size:12px;">${fmt(ki.unit_price||0)}</td>
                    <td style="padding:4px 8px;text-align:right;font-size:12px;">${fmt(ki.quantity*(item.quantidade||1)*(ki.unit_price||0))}</td>
                  </tr>
                `).join('')}
              `;
            }
            return `
              <tr style="${i%2===0?'background:#fff':'background:#F9FAFB'}">
                <td style="padding:7px 8px;">${escapeHtml(item.descricao||item.nome||'')}</td>
                <td style="padding:7px 8px;text-align:center;">${item.quantidade||1} ${item.unidade||'UN'}</td>
                <td style="padding:7px 8px;text-align:right;">${fmt(item.preco_unitario||0)}</td>
                <td style="padding:7px 8px;text-align:right;font-weight:700;">${fmt(total)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
        <table style="font-size:13px;width:280px;">
          <tr><td style="padding:3px 8px;color:#555;">Subtotal</td><td style="text-align:right;padding:3px 8px;">${fmt(subtotal)}</td></tr>
          ${discPct > 0 ? `<tr><td style="padding:3px 8px;color:#555;">Desconto (${discPct}%)</td><td style="text-align:right;padding:3px 8px;color:#EF4444;">- ${fmt(discVal)}</td></tr>` : ''}
          ${frete > 0 ? `<tr><td style="padding:3px 8px;color:#555;">Frete</td><td style="text-align:right;padding:3px 8px;">${fmt(frete)}</td></tr>` : ''}
          ${outras > 0 ? `<tr><td style="padding:3px 8px;color:#555;">Outras despesas</td><td style="text-align:right;padding:3px 8px;">${fmt(outras)}</td></tr>` : ''}
          <tr style="border-top:2px solid #00A868;">
            <td style="padding:8px 8px;font-weight:900;font-size:15px;">TOTAL</td>
            <td style="text-align:right;padding:8px 8px;font-weight:900;font-size:15px;color:#00A868;">${fmt(totalFinal)}</td>
          </tr>
        </table>
      </div>

      ${obs ? `<div style="border-top:1px solid #ddd;padding-top:12px;font-size:12px;color:#555;"><strong>Observações:</strong><p style="margin:6px 0 0;">${escapeHtml(obs)}</p></div>` : ''}
      <div style="text-align:center;margin-top:20px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:10px;">
        Orçamento gerado pelo FLR Bling ERP · Válido por ${validadeDias} dias a partir de ${dataEmissao}
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ==========================================================================
// MÓDULO: PROJETOS / OBRAS & VERBAS DE MATERIAL
// ==========================================================================

let activeExtractProjectId = null;

async function openProjectModal(item = null) {
  const modal = document.getElementById('modalProject');
  if (!modal) return;

  document.getElementById('projectId').value = item?.id || '';
  document.getElementById('projectNome').value = item?.nome || '';
  document.getElementById('projectCodigo').value = item?.codigo || '';
  document.getElementById('projectStatus').value = item?.status || 'em_andamento';
  document.getElementById('projectClienteNome').value = item?.cliente_nome || '';
  document.getElementById('projectResponsavel').value = item?.responsavel_obra || '';
  document.getElementById('projectVerbaTotal').value = item?.verba_total_orcamento || 0;
  document.getElementById('projectVerbaMaterial').value = item?.verba_material_orcada || 0;
  document.getElementById('projectObservacoes').value = item?.observacoes || '';

  document.getElementById('projectModalTitle').textContent = item ? 'Editar Projeto / Obra' : 'Novo Projeto / Obra';
  modal.classList.add('active');
}

async function handleSaveProject() {
  const id = document.getElementById('projectId')?.value || null;
  const nome = document.getElementById('projectNome')?.value?.trim();
  if (!nome) return showToast('Preencha o nome do projeto/obra.', 'error');

  const payload = {
    nome,
    codigo: document.getElementById('projectCodigo')?.value?.trim() || undefined,
    status: document.getElementById('projectStatus')?.value || 'em_andamento',
    cliente_nome: document.getElementById('projectClienteNome')?.value?.trim() || null,
    responsavel_obra: document.getElementById('projectResponsavel')?.value?.trim() || null,
    verba_total_orcamento: parseFloat(document.getElementById('projectVerbaTotal')?.value) || 0,
    verba_material_orcada: parseFloat(document.getElementById('projectVerbaMaterial')?.value) || 0,
    observacoes: document.getElementById('projectObservacoes')?.value?.trim() || null
  };
  if (id) payload.id = id;

  try {
    const res = await apiRequest('/api/projetos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    document.getElementById('modalProject').classList.remove('active');
    showToast('Projeto salvo com sucesso!', 'success');
    if (state.currentModule === 'projects') await loadModuleData('projects');
  } catch (err) {
    showToast('Erro ao salvar projeto: ' + err.message, 'error');
  }
}

async function openProjectExtract(projectId) {
  activeExtractProjectId = projectId;
  const modal = document.getElementById('modalProjectExtract');
  if (!modal) return;

  modal.classList.add('active');
  const cardsContainer = document.getElementById('extractBudgetCards');
  const nfeItemsBody = document.getElementById('extractNfeItemsBody');
  const withdrawalsBody = document.getElementById('extractWithdrawalsBody');

  if (cardsContainer) cardsContainer.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando extrato...</div>';
  if (nfeItemsBody) nfeItemsBody.innerHTML = '';
  if (withdrawalsBody) withdrawalsBody.innerHTML = '';

  try {
    const res = await apiRequest(`/api/projetos/${projectId}/extrato-material`);
    const data = res?.data;
    if (!data) throw new Error('Não foi possível carregar os dados.');

    const { project, verbaOrcada, totalGastoMaterial, saldoVerbaRestante, percentualConsumido, itensComprados = [], movimentacoesRetiradas = [] } = data;
    document.getElementById('extractProjectTitle').textContent = `Extrato: ${project.nome} (${project.codigo || '—'})`;

    let colorStatus = '#10B981';
    if (percentualConsumido >= 90) colorStatus = '#EF4444';
    else if (percentualConsumido >= 70) colorStatus = '#F59E0B';

    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div style="background:#F8FAFC;border:1px solid var(--border-color);border-radius:8px;padding:12px;">
          <div style="font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Valor Contrato</div>
          <div style="font-size:18px;font-weight:800;color:var(--text-primary);margin-top:4px;">${formatCurrency(project.verba_total_orcamento || 0)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Cobrado do Cliente</div>
        </div>
        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:12px;">
          <div style="font-size:11px;color:#1D4ED8;font-weight:700;text-transform:uppercase;">Verba Material Orçada</div>
          <div style="font-size:18px;font-weight:800;color:#1E40AF;margin-top:4px;">${formatCurrency(verbaOrcada)}</div>
          <div style="font-size:11px;color:#3B82F6;margin-top:2px;">Teto Estipulado</div>
        </div>
        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px;">
          <div style="font-size:11px;color:#B45309;font-weight:700;text-transform:uppercase;">Total Faturado em NF-e</div>
          <div style="font-size:18px;font-weight:800;color:#D97706;margin-top:4px;">${formatCurrency(totalGastoMaterial)}</div>
          <div style="font-size:11px;color:#D97706;margin-top:2px;">${Math.round(percentualConsumido)}% consumido</div>
        </div>
        <div style="background:${saldoVerbaRestante >= 0 ? '#ECFDF5' : '#FEF2F2'};border:1px solid ${saldoVerbaRestante >= 0 ? '#A7F3D0' : '#FECACA'};border-radius:8px;padding:12px;">
          <div style="font-size:11px;color:${saldoVerbaRestante >= 0 ? '#047857' : '#B91C1C'};font-weight:700;text-transform:uppercase;">Saldo Restante Verba</div>
          <div style="font-size:18px;font-weight:800;color:${saldoVerbaRestante >= 0 ? '#059669' : '#DC2626'};margin-top:4px;">${formatCurrency(saldoVerbaRestante)}</div>
          <div style="font-size:11px;color:${saldoVerbaRestante >= 0 ? '#059669' : '#DC2626'};margin-top:2px;">${saldoVerbaRestante >= 0 ? '✓ Dentro da verba' : '⚠️ Verba estourada'}</div>
        </div>
      `;
    }

    if (nfeItemsBody) {
      if (itensComprados.length === 0) {
        nfeItemsBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">Nenhuma nota fiscal ou item vinculado a esta obra até o momento.</td></tr>';
      } else {
        nfeItemsBody.innerHTML = itensComprados.map(it => `
          <tr>
            <td>
              <strong>NF-e #${escapeHtml(it.entry?.numero_nota || '—')}</strong>
              <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(it.entry?.fornecedor_nome || '—')}</div>
            </td>
            <td><span class="text-mono" style="font-size:11px;">${formatDate(it.entry?.data_emissao)}</span></td>
            <td>
              <strong>${escapeHtml(it.descricao_fornecedor || '—')}</strong>
              ${it.codigo_fornecedor ? `<div style="font-size:10px;color:var(--text-muted);">Cód: ${escapeHtml(it.codigo_fornecedor)}</div>` : ''}
            </td>
            <td style="text-align:center;">${it.quantidade} ${it.unidade_fornecedor || 'UN'}</td>
            <td style="text-align:right;">${formatCurrency(it.valor_unitario)}</td>
            <td style="text-align:right;"><strong class="text-emerald">${formatCurrency(it.valor_total)}</strong></td>
            <td style="text-align:center;">
              <span class="origin-tag ${it.destino_estoque === 'ambos' ? 'origin-both' : (it.destino_estoque === 'projeto' ? 'origin-app' : 'origin-bling')}">
                ${it.destino_estoque === 'ambos' ? 'Ambos' : (it.destino_estoque === 'projeto' ? 'Obra' : 'Almoxarifado')}
              </span>
            </td>
          </tr>
        `).join('');
      }
    }

    if (withdrawalsBody) {
      if (movimentacoesRetiradas.length === 0) {
        withdrawalsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);">Nenhuma retirada do almoxarifado registrada para esta obra.</td></tr>';
      } else {
        withdrawalsBody.innerHTML = movimentacoesRetiradas.map(m => `
          <tr>
            <td><span class="text-mono" style="font-size:11px;">${new Date(m.data_movimento).toLocaleString('pt-BR')}</span></td>
            <td><strong>${escapeHtml(m.produto?.nome || 'Material')}</strong> <small class="text-muted">(${m.produto?.codigo || '—'})</small></td>
            <td style="text-align:center;"><strong class="text-blue">${m.quantidade} ${m.produto?.unidade || 'UN'}</strong></td>
            <td><span class="badge-tag-custom"><i class="fa-solid fa-hard-hat"></i> ${escapeHtml(m.responsavel_retirada || '—')}</span></td>
            <td style="font-size:12px;color:var(--text-secondary);">${escapeHtml(m.observacoes || '—')}</td>
          </tr>
        `).join('');
      }
    }

  } catch (err) {
    showToast('Erro ao carregar extrato: ' + err.message, 'error');
  }
}

async function openStockWithdrawalModal() {
  const modal = document.getElementById('modalStockWithdrawal');
  if (!modal) return;

  document.getElementById('withdrawalProjectId').value = activeExtractProjectId || '';
  document.getElementById('withdrawalQuantidade').value = '1';
  document.getElementById('withdrawalResponsavel').value = '';
  document.getElementById('withdrawalObservacoes').value = '';

  // Popula produtos locais no select
  const select = document.getElementById('withdrawalProdutoId');
  if (select) {
    select.innerHTML = '<option value="">Carregando produtos...</option>';
    try {
      const res = await apiRequest('/api/produtos-locais?limite=200');
      const prods = res?.data || [];
      select.innerHTML = '<option value="">Selecione o produto do almoxarifado...</option>' +
        prods.map(p => `<option value="${p.id}">${escapeHtml(p.nome)} (${p.codigo || 'S/ Cód'}) — Saldo: ${p.estoque_atual || 0} ${p.unidade || 'UN'}</option>`).join('');
    } catch {
      select.innerHTML = '<option value="">Erro ao carregar produtos</option>';
    }
  }

  modal.classList.add('active');
}

async function handleSaveWithdrawal() {
  const produtoId = document.getElementById('withdrawalProdutoId')?.value;
  const quantidade = parseFloat(document.getElementById('withdrawalQuantidade')?.value) || 0;
  const responsavel = document.getElementById('withdrawalResponsavel')?.value?.trim();
  const observacoes = document.getElementById('withdrawalObservacoes')?.value?.trim();
  const projetoId = document.getElementById('withdrawalProjectId')?.value || null;

  if (!produtoId) return showToast('Selecione o produto do almoxarifado.', 'error');
  if (quantidade <= 0) return showToast('Informe uma quantidade válida.', 'error');
  if (!responsavel) return showToast('Informe o responsável pela retirada.', 'error');

  try {
    await apiRequest('/api/estoque/movimentacoes', {
      method: 'POST',
      body: JSON.stringify({
        produto_id: produtoId,
        tipo: 'saida_producao',
        quantidade,
        destino: 'projeto',
        projeto_id: projetoId,
        responsavel_retirada: responsavel,
        observacoes
      })
    });

    document.getElementById('modalStockWithdrawal').classList.remove('active');
    showToast('Retirada registrada e estoque atualizado com sucesso!', 'success');
    if (activeExtractProjectId) await openProjectExtract(activeExtractProjectId);
  } catch (err) {
    showToast('Erro ao registrar retirada: ' + err.message, 'error');
  }
}

// ==========================================================================
// MÓDULO: ENTRADA DE NOTAS FISCAIS (NF-e) & DE-PARA
// ==========================================================================

let nfeEntryItems = [];
let localProductsCache = [];
let projectsListCache = [];

async function openNfeEntryModal(item = null) {
  const modal = document.getElementById('modalNfeEntry');
  if (!modal) return;

  document.getElementById('nfeEntryId').value = item?.id || '';
  document.getElementById('nfeNumero').value = item?.numero_nota || '';
  document.getElementById('nfeSerie').value = item?.serie || '1';
  document.getElementById('nfeFornecedorNome').value = item?.fornecedor_nome || '';
  document.getElementById('nfeFornecedorCnpj').value = item?.fornecedor_cnpj || '';
  document.getElementById('nfeDataEmissao').value = item?.data_emissao || new Date().toISOString().split('T')[0];
  document.getElementById('nfeValorTotal').value = item?.valor_total || 0;
  document.getElementById('nfeDestinoPadrao').value = item?.destino_estoque_padrao || 'flr';
  document.getElementById('nfeChaveAcesso').value = item?.chave_acesso || '';

  // Carregar produtos e projetos em background para De-Para
  try {
    const [pRes, prjRes] = await Promise.all([
      apiRequest('/api/produtos-locais?limite=300'),
      apiRequest('/api/projetos')
    ]);
    localProductsCache = pRes?.data || [];
    projectsListCache = prjRes?.data || [];

    const projSelect = document.getElementById('nfeProjetoId');
    if (projSelect) {
      projSelect.innerHTML = '<option value="">Nenhum (Uso Geral)</option>' +
        projectsListCache.map(p => `<option value="${p.id}" ${item?.projeto_id === p.id ? 'selected' : ''}>${escapeHtml(p.nome)} (${p.codigo || '—'})</option>`).join('');
    }
  } catch (e) {}

  nfeEntryItems = item?.itens ? JSON.parse(JSON.stringify(item.itens)) : [];
  renderNfeItemsTable();

  document.getElementById('nfeEntryModalTitle').textContent = item ? 'Editar Entrada de NF-e' : 'Entrada de Nota Fiscal (NF-e com De-Para)';
  modal.classList.add('active');
}

function renderNfeItemsTable() {
  const tbody = document.getElementById('nfeItemsTableBody');
  if (!tbody) return;

  if (nfeEntryItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;padding:32px;color:var(--text-muted);">
          <i class="fa-solid fa-file-code" style="font-size:28px;margin-bottom:8px;display:block;color:var(--bling-blue);"></i>
          Clique em <strong>"Importar Arquivo XML"</strong> para carregar os itens automaticamente ou adicione manualmente.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = nfeEntryItems.map((it, idx) => {
    const prodOptions = localProductsCache.map(p => `
      <option value="${p.id}" ${it.produto_id === p.id ? 'selected' : ''}>
        ${escapeHtml(p.nome)} (${p.codigo || 'S/Cód'}) — R$ ${parseFloat(p.preco_venda||0).toFixed(2)}
      </option>
    `).join('');

    return `
      <tr>
        <td style="text-align:center;font-size:11px;color:var(--text-muted);">${idx + 1}</td>
        <td>
          <input type="text" class="form-control form-control-sm text-mono" value="${escapeHtml(it.codigo_fornecedor || '')}"
                 onchange="updateNfeItem(${idx}, 'codigo_fornecedor', this.value)" placeholder="Cód Forn">
        </td>
        <td>
          <input type="text" class="form-control form-control-sm" value="${escapeHtml(it.descricao_fornecedor || '')}"
                 onchange="updateNfeItem(${idx}, 'descricao_fornecedor', this.value)" placeholder="Descrição na Nota" required>
        </td>
        <td>
          <input type="number" class="form-control form-control-sm text-center" step="0.001" value="${it.quantidade || 1}"
                 onchange="updateNfeItem(${idx}, 'quantidade', parseFloat(this.value)||1)">
        </td>
        <td>
          <input type="number" class="form-control form-control-sm text-right" step="0.01" value="${it.valor_unitario || 0}"
                 onchange="updateNfeItem(${idx}, 'valor_unitario', parseFloat(this.value)||0)">
        </td>
        <td style="text-align:right;font-weight:700;" class="text-emerald">
          ${formatCurrency((parseFloat(it.quantidade)||1) * (parseFloat(it.valor_unitario)||0))}
        </td>
        <td>
          <select class="form-control form-control-sm" onchange="updateNfeItem(${idx}, 'produto_id', this.value)" style="font-size:11px;">
            <option value="">➕ Criar Novo Produto Localmente</option>
            ${prodOptions}
          </select>
        </td>
        <td>
          <select class="form-control form-control-sm" onchange="updateNfeItem(${idx}, 'destino_estoque', this.value)" style="font-size:11px;">
            <option value="flr" ${it.destino_estoque === 'flr' ? 'selected' : ''}>🏢 Almoxarifado</option>
            <option value="projeto" ${it.destino_estoque === 'projeto' ? 'selected' : ''}>🏗️ Obra</option>
            <option value="ambos" ${it.destino_estoque === 'ambos' ? 'selected' : ''}>🔄 Ambos</option>
          </select>
        </td>
        <td style="text-align:center;">
          <button type="button" onclick="removeNfeRow(${idx})" style="background:none;border:none;color:#EF4444;cursor:pointer;font-size:14px;">&times;</button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateNfeItem(idx, field, value) {
  if (!nfeEntryItems[idx]) return;
  nfeEntryItems[idx][field] = value;
  if (field === 'quantidade' || field === 'valor_unitario') {
    nfeEntryItems[idx].valor_total = (parseFloat(nfeEntryItems[idx].quantidade) || 1) * (parseFloat(nfeEntryItems[idx].valor_unitario) || 0);
  }
}

function addNfeManualRow() {
  const padraoDestino = document.getElementById('nfeDestinoPadrao')?.value || 'flr';
  const padraoProjeto = document.getElementById('nfeProjetoId')?.value || null;
  nfeEntryItems.push({
    codigo_fornecedor: '',
    descricao_fornecedor: '',
    quantidade: 1,
    unidade_fornecedor: 'UN',
    valor_unitario: 0,
    valor_total: 0,
    produto_id: '',
    destino_estoque: padraoDestino,
    projeto_id: padraoProjeto
  });
  renderNfeItemsTable();
}

function removeNfeRow(idx) {
  nfeEntryItems.splice(idx, 1);
  renderNfeItemsTable();
}

function applyDestinoToAllItems(destino) {
  nfeEntryItems.forEach(it => it.destino_estoque = destino);
  renderNfeItemsTable();
}

function applyProjetoToAllItems(projetoId) {
  nfeEntryItems.forEach(it => it.projeto_id = projetoId);
}

// Leitor Inteligente de XML de NF-e no Navegador
async function handleNfeXmlUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    // Chave de Acesso
    const infNFe = xmlDoc.querySelector('infNFe');
    const chave = infNFe?.getAttribute('Id')?.replace(/\D/g, '') || '';
    if (chave) document.getElementById('nfeChaveAcesso').value = chave;

    // Cabeçalho da Nota
    const ide = xmlDoc.querySelector('ide');
    const nNF = ide?.querySelector('nNF')?.textContent || '';
    const serie = ide?.querySelector('serie')?.textContent || '1';
    const dhEmi = ide?.querySelector('dhEmi')?.textContent || ide?.querySelector('dEmi')?.textContent || '';

    if (nNF) document.getElementById('nfeNumero').value = nNF;
    if (serie) document.getElementById('nfeSerie').value = serie;
    if (dhEmi) document.getElementById('nfeDataEmissao').value = dhEmi.split('T')[0];

    // Emitente / Fornecedor
    const emit = xmlDoc.querySelector('emit');
    const xNome = emit?.querySelector('xNome')?.textContent || '';
    const cnpj = emit?.querySelector('CNPJ')?.textContent || emit?.querySelector('CPF')?.textContent || '';

    if (xNome) document.getElementById('nfeFornecedorNome').value = xNome;
    if (cnpj) document.getElementById('nfeFornecedorCnpj').value = cnpj;

    // Total da Nota
    const vNF = xmlDoc.querySelector('total > ICMSTot > vNF')?.textContent || '0';
    document.getElementById('nfeValorTotal').value = parseFloat(vNF) || 0;

    // Itens da Nota
    const dets = xmlDoc.querySelectorAll('det');
    const padraoDestino = document.getElementById('nfeDestinoPadrao')?.value || 'flr';
    const padraoProjeto = document.getElementById('nfeProjetoId')?.value || null;

    nfeEntryItems = [];
    for (let i = 0; i < dets.length; i++) {
      const prod = dets[i].querySelector('prod');
      const cProd = prod?.querySelector('cProd')?.textContent || '';
      const xProd = prod?.querySelector('xProd')?.textContent || '';
      const ncm = prod?.querySelector('NCM')?.textContent || '';
      const cfop = prod?.querySelector('CFOP')?.textContent || '';
      const uCom = prod?.querySelector('uCom')?.textContent || 'UN';
      const qCom = parseFloat(prod?.querySelector('qCom')?.textContent) || 1;
      const vUnCom = parseFloat(prod?.querySelector('vUnCom')?.textContent) || 0;
      const vProd = parseFloat(prod?.querySelector('vProd')?.textContent) || (qCom * vUnCom);

      // Consulta automática de De-Para no backend
      let matchedProdutoId = '';
      if (cnpj && cProd) {
        try {
          const lookup = await apiRequest('/api/nfe-entradas/de-para-lookup', {
            method: 'POST',
            body: JSON.stringify({ fornecedor_cnpj: cnpj, codigo_fornecedor: cProd })
          });
          if (lookup?.data?.produto_id) {
            matchedProdutoId = lookup.data.produto_id;
          }
        } catch (e) {}
      }

      // Se não encontrou por regra, tenta match local por código SKU
      if (!matchedProdutoId && cProd) {
        const found = localProductsCache.find(p => (p.codigo || '').toLowerCase() === cProd.toLowerCase());
        if (found) matchedProdutoId = found.id;
      }

      nfeEntryItems.push({
        codigo_fornecedor: cProd,
        descricao_fornecedor: xProd,
        ncm,
        cfop,
        unidade_fornecedor: uCom,
        quantidade: qCom,
        valor_unitario: vUnCom,
        valor_total: vProd,
        produto_id: matchedProdutoId,
        destino_estoque: padraoDestino,
        projeto_id: padraoProjeto
      });
    }

    renderNfeItemsTable();
    showToast(`XML importado com sucesso! ${nfeEntryItems.length} itens extraídos.`, 'success');
  } catch (err) {
    showToast('Erro ao processar arquivo XML: ' + err.message, 'error');
  }
}

async function handleSaveNfeEntry() {
  const id = document.getElementById('nfeEntryId')?.value || null;
  const numero_nota = document.getElementById('nfeNumero')?.value?.trim();
  const fornecedor_nome = document.getElementById('nfeFornecedorNome')?.value?.trim();
  if (!numero_nota || !fornecedor_nome) return showToast('Preencha o número da nota e o fornecedor.', 'error');

  const entry = {
    numero_nota,
    serie: document.getElementById('nfeSerie')?.value?.trim() || '1',
    fornecedor_nome,
    fornecedor_cnpj: document.getElementById('nfeFornecedorCnpj')?.value?.trim() || null,
    data_emissao: document.getElementById('nfeDataEmissao')?.value || new Date().toISOString().split('T')[0],
    valor_total: parseFloat(document.getElementById('nfeValorTotal')?.value) || 0,
    destino_estoque_padrao: document.getElementById('nfeDestinoPadrao')?.value || 'flr',
    projeto_id: document.getElementById('nfeProjetoId')?.value || null,
    chave_acesso: document.getElementById('nfeChaveAcesso')?.value?.trim() || null
  };
  if (id) entry.id = id;

  const items = nfeEntryItems.map(it => ({
    ...it,
    criar_novo_produto: !it.produto_id // Flag para criar novo se não estiver mapeado
  }));

  try {
    await apiRequest('/api/nfe-entradas', {
      method: 'POST',
      body: JSON.stringify({ entry, items })
    });

    document.getElementById('modalNfeEntry').classList.remove('active');
    showToast('Entrada de NF-e salva e estoque atualizado com sucesso!', 'success');
    if (state.currentModule === 'nfe') await loadModuleData('nfe');
  } catch (err) {
    showToast('Erro ao salvar entrada de NF-e: ' + err.message, 'error');
  }
}

function openNfeDetails(item) {
  const modal = document.getElementById('modalNfeDetails');
  const body = document.getElementById('nfeDetailsBody');
  if (!modal || !body) return;

  document.getElementById('nfeDetailsTitle').textContent = `NF-e #${item.numero_nota || item.numero || '—'} · ${escapeHtml(item.fornecedor_nome || item.cliente || '—')}`;

  const itens = item.itens || [];
  body.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;background:#F8FAFC;padding:12px;border-radius:8px;">
      <div><strong>Data de Emissão:</strong> ${formatDate(item.data_emissao || item.data)}</div>
      <div><strong>Valor Total:</strong> <span class="text-emerald font-bold">${formatCurrency(item.valor_total || item.total || 0)}</span></div>
      <div><strong>Destino Estoque:</strong> ${item.destino_estoque_padrao === 'projeto' ? '🏗️ Obra' : (item.destino_estoque_padrao === 'ambos' ? '🔄 Ambos' : '🏢 Almoxarifado')}</div>
    </div>
    ${item.chave_acesso ? `<div style="margin-bottom:16px;font-size:12px;color:var(--text-secondary);"><strong>Chave SEFAZ:</strong> <span class="text-mono">${escapeHtml(item.chave_acesso)}</span></div>` : ''}
    <div class="order-section">
      <div class="order-section-title">Itens Faturados e Amarração (De-Para)</div>
      <table class="kit-items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cód. Forn.</th>
            <th>Descrição na Nota</th>
            <th style="width:60px;text-align:center;">Qtd</th>
            <th style="width:100px;text-align:right;">Valor Unit.</th>
            <th style="width:100px;text-align:right;">Total</th>
            <th>Produto Interno Mapeado</th>
          </tr>
        </thead>
        <tbody>
          ${itens.map((it, idx) => `
            <tr>
              <td style="text-align:center;font-size:11px;color:var(--text-muted);">${idx + 1}</td>
              <td><span class="text-mono" style="font-size:11px;">${escapeHtml(it.codigo_fornecedor || '—')}</span></td>
              <td><strong>${escapeHtml(it.descricao_fornecedor || '—')}</strong></td>
              <td style="text-align:center;">${it.quantidade} ${it.unidade_fornecedor || 'UN'}</td>
              <td style="text-align:right;">${formatCurrency(it.valor_unitario)}</td>
              <td style="text-align:right;"><strong class="text-emerald">${formatCurrency(it.valor_total)}</strong></td>
              <td>
                ${it.produto ? `<span class="origin-tag origin-app"><i class="fa-solid fa-cube"></i> ${escapeHtml(it.produto.nome)} (${it.produto.codigo || '—'})</span>` : '<span class="text-muted">Item Avulso</span>'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  modal.classList.add('active');
}

// Fechamento de Modais
document.getElementById('btnCloseProjectModal')?.addEventListener('click', () => document.getElementById('modalProject').classList.remove('active'));
document.getElementById('btnCancelProjectModal')?.addEventListener('click', () => document.getElementById('modalProject').classList.remove('active'));
document.getElementById('btnCloseExtractModal')?.addEventListener('click', () => document.getElementById('modalProjectExtract').classList.remove('active'));
document.getElementById('btnCloseWithdrawalModal')?.addEventListener('click', () => document.getElementById('modalStockWithdrawal').classList.remove('active'));
document.getElementById('btnCancelWithdrawalModal')?.addEventListener('click', () => document.getElementById('modalStockWithdrawal').classList.remove('active'));
document.getElementById('btnCloseNfeEntryModal')?.addEventListener('click', () => document.getElementById('modalNfeEntry').classList.remove('active'));
document.getElementById('btnCancelNfeModal')?.addEventListener('click', () => document.getElementById('modalNfeEntry').classList.remove('active'));
document.getElementById('btnCloseNfeDetails')?.addEventListener('click', () => document.getElementById('modalNfeDetails').classList.remove('active'));

// Expor funções globais
window.openProjectModal = openProjectModal;
window.handleSaveProject = handleSaveProject;
window.openProjectExtract = openProjectExtract;
window.openStockWithdrawalModal = openStockWithdrawalModal;
window.handleSaveWithdrawal = handleSaveWithdrawal;
window.openNfeEntryModal = openNfeEntryModal;
window.handleNfeXmlUpload = handleNfeXmlUpload;
window.addNfeManualRow = addNfeManualRow;
window.removeNfeRow = removeNfeRow;
window.updateNfeItem = updateNfeItem;
window.applyDestinoToAllItems = applyDestinoToAllItems;
window.applyProjetoToAllItems = applyProjetoToAllItems;
window.handleSaveNfeEntry = handleSaveNfeEntry;
window.openNfeDetails = openNfeDetails;

// Expor funções globais para kits e orçamentos
window.openKitBuilder = openKitBuilder;
window.handleSaveKit = handleSaveKit;
window.openKitProductPickerModal = openKitProductPickerModal;
window.onKitProdPickerSearch = onKitProdPickerSearch;
window.addKitManualRow = addKitManualRow;
window.addKitItemRow = addKitItemRow;
window.removeKitItemRow = removeKitItemRow;
window.recalcKitTotal = recalcKitTotal;
window.toggleKitPrecoFixo = toggleKitPrecoFixo;

window.openQuoteBuilder = openQuoteBuilder;
window.handleSaveQuote = handleSaveQuote;
window.openKitPickerModal = openKitPickerModal;
window.openProductPickerForQuote = openProductPickerForQuote;
window.openExportBlingModal = openExportBlingModal;
window.confirmarExportBling = confirmarExportBling;
window.openQuotePrintPreview = openQuotePrintPreview;
window.onQuoteClientSearch = onQuoteClientSearch;
window.selectQuoteClient = selectQuoteClient;
window.addKitToQuote = addKitToQuote;
window.addProductToQuote = addProductToQuote;
window.removeQuoteItem = removeQuoteItem;
window.updateQuoteItemField = updateQuoteItemField;
window.recalcQuoteTotals = recalcQuoteTotals;
window.updateQuoteStatusBadge = updateQuoteStatusBadge;

