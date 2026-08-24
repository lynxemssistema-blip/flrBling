/**
 * Bling ERP + Supabase Auth - Complete Application Logic
 */

// Application State
const state = {
  currentUser: null,
  authToken: localStorage.getItem('flr_bling_token') || null,
  dataSource: 'live', // 'live' | 'demo'
  allClients: [],
  filteredClients: [],
  selectedClient: null,
  isBlingAuthenticated: false,
  currentPage: 1,
  pageSize: 10,
  searchQuery: '',
  filterType: '',
  filterSituation: '',
  appConfig: null,
  allUsers: []
};

// DOM Elements Map
const elements = {
  // Views
  landingPageView: document.getElementById('landingPageView'),
  dashboardView: document.getElementById('dashboardView'),

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

  // KPI Stats
  statTotalCount: document.getElementById('statTotalCount'),
  statActiveCount: document.getElementById('statActiveCount'),
  statPjCount: document.getElementById('statPjCount'),
  statPfCount: document.getElementById('statPfCount'),
  navClientsCount: document.getElementById('navClientsCount'),
  recordsBadge: document.getElementById('recordsBadge'),
  lastSyncText: document.getElementById('lastSyncText'),

  // Filters
  filterSearch: document.getElementById('filterSearch'),
  quickSearchInput: document.getElementById('quickSearchInput'),
  filterType: document.getElementById('filterType'),
  filterSituation: document.getElementById('filterSituation'),
  btnClearFilters: document.getElementById('btnClearFilters'),

  // Table & States
  clientsTableBody: document.getElementById('clientsTableBody'),
  tableLoadingState: document.getElementById('tableLoadingState'),
  tableEmptyState: document.getElementById('tableEmptyState'),
  emptyStateMessage: document.getElementById('emptyStateMessage'),

  // Pagination
  paginationInfo: document.getElementById('paginationInfo'),
  currentPageNumber: document.getElementById('currentPageNumber'),
  btnPrevPage: document.getElementById('btnPrevPage'),
  btnNextPage: document.getElementById('btnNextPage'),

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

  // Sidebar & Layout
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

  // Se não estiver logado, exibe a Landing Page
  showLandingPage();
});

// ==========================================================================
// CONTROLE DE TELAS (ROUTING LANDING VS DASHBOARD)
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

  // Seção de administração: visível apenas para superadmin
  if (elements.superadminNavSection) {
    elements.superadminNavSection.style.display = isSuperadmin ? 'block' : 'none';
  }

  // Botão "Conexão Bling" no header: apenas superadmin
  if (elements.btnOpenAuthModal) {
    elements.btnOpenAuthModal.style.display = isSuperadmin ? 'flex' : 'none';
  }

  // Item "Conexão Bling OAuth" na sidebar: apenas superadmin
  const navSettingsItem = document.getElementById('navOpenSettings');
  const navSettingsSection = navSettingsItem ? navSettingsItem.closest('.nav-section-wrapper') || navSettingsItem.parentElement : null;
  if (navSettingsItem) {
    navSettingsItem.style.display = isSuperadmin ? 'flex' : 'none';
  }
  // Esconde o título "CONFIGURAÇÕES" da sidebar se não for superadmin
  const configSectionTitle = document.querySelector('.nav-section-title:last-of-type');
  const allNavSectionTitles = document.querySelectorAll('.nav-section-title');
  allNavSectionTitles.forEach(title => {
    if (title.textContent.trim() === 'CONFIGURAÇÕES') {
      title.style.display = isSuperadmin ? 'block' : 'none';
    }
  });

  if (isSuperadmin) {
    loadUsersList();

    // Troca automática de código pendente no sessionStorage
    const pendingCode = sessionStorage.getItem('pending_bling_code');
    if (pendingCode) {
      sessionStorage.removeItem('pending_bling_code');
      showNotification('Código do Bling detectado! Conectando com a conta...', 'info');
      await exchangeCodeDirect(pendingCode);
    }
  }

  await loadClients();
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
// CONFIGURAÇÃO DOS EVENT LISTENERS
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

  // Alternadores entre Login e Cadastro
  elements.linkOpenRegister?.addEventListener('click', () => {
    closeModal(elements.loginModal);
    openModal(elements.registerModal);
  });

  elements.linkOpenLogin?.addEventListener('click', () => {
    closeModal(elements.registerModal);
    openModal(elements.loginModal);
  });

  // Fechar Modais
  elements.btnCloseLoginModal?.addEventListener('click', () => closeModal(elements.loginModal));
  elements.btnCloseRegisterModal?.addEventListener('click', () => closeModal(elements.registerModal));
  elements.btnCloseUsersModal?.addEventListener('click', () => closeModal(elements.usersManagerModal));
  elements.btnCloseUsersModalFooter?.addEventListener('click', () => closeModal(elements.usersManagerModal));

  // Submissão de Formulários de Auth
  elements.loginForm?.addEventListener('submit', handleLogin);
  elements.registerForm?.addEventListener('submit', handleRegister);
  elements.btnAppLogout?.addEventListener('click', handleAppLogout);

  // Gestão de Usuários (Superadmin)
  elements.navOpenUsersManager?.addEventListener('click', () => {
    loadUsersList();
    openModal(elements.usersManagerModal);
  });

  // Sidebar Toggle
  elements.sidebarToggle?.addEventListener('click', () => {
    elements.sidebar?.classList.toggle('collapsed');
  });

  // Modal Auth Bling
  elements.btnOpenAuthModal?.addEventListener('click', () => openModal(elements.authModal));
  elements.navOpenSettings?.addEventListener('click', () => openModal(elements.authModal));
  elements.btnCloseAuthModal?.addEventListener('click', () => closeModal(elements.authModal));
  elements.btnCloseAuthModalFooter?.addEventListener('click', () => closeModal(elements.authModal));

  elements.btnExchangeCode?.addEventListener('click', handleExchangeCode);
  elements.btnSaveManualToken?.addEventListener('click', handleSaveManualToken);
  elements.btnLogoutToken?.addEventListener('click', handleLogoutBling);

  // Data source toggle
  elements.btnSourceLive?.addEventListener('click', () => setDataSource('live'));
  elements.btnSourceDemo?.addEventListener('click', () => setDataSource('demo'));
  elements.btnRefreshData?.addEventListener('click', () => loadClients());

  // Search and Filters
  elements.filterSearch?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    if (elements.quickSearchInput) elements.quickSearchInput.value = e.target.value;
    applyFilters();
  });

  elements.quickSearchInput?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    if (elements.filterSearch) elements.filterSearch.value = e.target.value;
    applyFilters();
  });

  elements.filterType?.addEventListener('change', (e) => {
    state.filterType = e.target.value;
    applyFilters();
  });

  elements.filterSituation?.addEventListener('change', (e) => {
    state.filterSituation = e.target.value;
    applyFilters();
  });

  elements.btnClearFilters?.addEventListener('click', () => {
    if (elements.filterSearch) elements.filterSearch.value = '';
    if (elements.quickSearchInput) elements.quickSearchInput.value = '';
    if (elements.filterType) elements.filterType.value = '';
    if (elements.filterSituation) elements.filterSituation.value = '';
    state.searchQuery = '';
    state.filterType = '';
    state.filterSituation = '';
    applyFilters();
  });

  // Pagination
  elements.btnPrevPage?.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderTable();
    }
  });

  elements.btnNextPage?.addEventListener('click', () => {
    const totalPages = Math.ceil(state.filteredClients.length / state.pageSize);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderTable();
    }
  });

  // Drawer
  elements.btnCloseDrawer?.addEventListener('click', closeDrawer);
  elements.btnDrawerCloseFooter?.addEventListener('click', closeDrawer);
  elements.drawerOverlay?.addEventListener('click', closeDrawer);

  // Drawer Tabs
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

  // Copy JSON
  elements.btnCopyJson?.addEventListener('click', () => {
    const jsonText = elements.detRawJson?.textContent || '{}';
    navigator.clipboard.writeText(jsonText).then(() => {
      showNotification('JSON copiado para a área de transferência!', 'success');
    });
  });

  // Supabase Tags & Complement Save
  setupSupabaseTagsInput();

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      if (elements.loginModal) closeModal(elements.loginModal);
      if (elements.registerModal) closeModal(elements.registerModal);
      if (elements.usersManagerModal) closeModal(elements.usersManagerModal);
      if (elements.authModal) closeModal(elements.authModal);
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      elements.quickSearchInput?.focus();
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

    if (!response.ok) {
      throw new Error(result.error || 'Erro no login');
    }

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
    state.allClients = [];
    state.filteredClients = [];
    state.selectedClient = null;
    state.isBlingAuthenticated = false;
    state.allUsers = [];
    showNotification('Sessão encerrada com sucesso.', 'info');
    showLandingPage();
  }
}

// ==========================================================================
// GESTÃO DE USUÁRIOS (EXCLUSIVO SUPERADMIN)
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
    console.error('Erro ao carregar lista de usuários:', err);
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
        <td>
          <span class="badge-role ${user.role}">${user.role.toUpperCase()}</span>
        </td>
        <td style="text-align: center;">
          <span class="badge-status ${statusClass}">
            ● ${statusLabel}
          </span>
        </td>
        <td style="text-align: right;">
          ${!isSuper ? `
            ${user.status !== 'aprovado' ? `
              <button class="btn btn-success btn-xs" onclick="changeUserStatus('${user.id}', 'aprovado')" title="Aprovar Usuário">
                <i class="fa-solid fa-check"></i> Aprovar
              </button>
            ` : `
              <button class="btn btn-secondary btn-xs" onclick="changeUserStatus('${user.id}', 'bloqueado')" title="Bloquear Acesso">
                <i class="fa-solid fa-ban"></i> Bloquear
              </button>
            `}
            <button class="btn btn-danger btn-xs" onclick="removeUser('${user.id}')" title="Excluir">
              <i class="fa-solid fa-trash"></i>
            </button>
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
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
// CONFIGURAÇÕES & STATUS DA CONEXÃO COM BLING
// ==========================================================================

async function loadAppConfig() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      console.warn(`[Aviso Backend] /api/config retornou status ${response.status}. Certifique-se de que o Node.js (server.js) está em execução na Hostinger.`);
      return;
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      state.appConfig = await response.json();
      if (state.appConfig && state.appConfig.authorizeUrl && elements.btnAuthorizeLink) {
        elements.btnAuthorizeLink.href = state.appConfig.authorizeUrl;
      }
    }
  } catch (err) {
    console.warn('Aviso ao carregar configurações do backend:', err.message);
  }
}

async function checkBlingAuthStatus() {
  try {
    const response = await fetch('/api/auth/status');
    if (!response.ok) {
      if (elements.apiStatusText) elements.apiStatusText.textContent = 'Backend Offline';
      return;
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) return;

    const data = await response.json();
    state.isBlingAuthenticated = data.authenticated && !data.isExpired;

    if (state.isBlingAuthenticated) {
      if (elements.apiStatusBadge) elements.apiStatusBadge.className = 'api-status-badge connected';
      if (elements.apiStatusText) elements.apiStatusText.textContent = 'Bling Conectado';
      if (elements.modalTokenStatusText) {
        elements.modalTokenStatusText.textContent = `Ativo (Expira em: ${formatDateTime(data.expires_at)})`;
        elements.modalTokenStatusText.style.color = 'var(--bling-green)';
      }
      if (elements.btnLogoutToken) elements.btnLogoutToken.style.display = 'inline-block';
    } else {
      if (elements.apiStatusBadge) elements.apiStatusBadge.className = 'api-status-badge';
      if (elements.apiStatusText) elements.apiStatusText.textContent = 'Bling Não Conectado';
      if (elements.modalTokenStatusText) {
        elements.modalTokenStatusText.textContent = data.authenticated ? 'Token Expirado' : 'Não Conectado';
        elements.modalTokenStatusText.style.color = 'var(--bling-orange)';
      }
      if (elements.btnLogoutToken) elements.btnLogoutToken.style.display = 'none';
    }
  } catch (err) {
    if (elements.apiStatusBadge) elements.apiStatusBadge.className = 'api-status-badge error';
    if (elements.apiStatusText) elements.apiStatusText.textContent = 'Erro Backend';
  }
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
  await loadClients();
}

// ==========================================================================
// CONSULTA E GESTÃO DE CLIENTES
// ==========================================================================

async function loadClients() {
  showLoading(true);

  try {
    let clients = [];

    if (state.dataSource === 'live') {
      if (!state.authToken) {
        showLoading(false);
        elements.emptyStateMessage.textContent = 'Faça login para consultar a API do Bling.';
        showEmptyState(true);
        updateStats([]);
        return;
      }

      const response = await fetch('/api/contatos?limite=100', {
        headers: { 'Authorization': `Bearer ${state.authToken}` }
      });

      if (!response.ok) {
        throw new Error('A API do Bling ainda não foi autorizada pelo Superadmin.');
      }

      const result = await response.json();
      clients = result.data || [];
    } else {
      const response = await fetch('/api/demo-data');
      const result = await response.json();
      clients = result.data || [];
    }

    state.allClients = clients;
    applyFilters();
    updateStats(clients);
    elements.lastSyncText.textContent = `Última sincronização: ${new Date().toLocaleTimeString('pt-BR')}`;
  } catch (err) {
    console.error('Erro ao buscar clientes:', err);
    elements.emptyStateMessage.textContent = err.message || 'Ocorreu um erro ao carregar os clientes.';
    showEmptyState(true);
  } finally {
    showLoading(false);
  }
}

function applyFilters() {
  state.filteredClients = state.allClients.filter(client => {
    if (state.searchQuery) {
      const q = state.searchQuery;
      const nome = (client.nome || '').toLowerCase();
      const fantasia = (client.fantasia || '').toLowerCase();
      const doc = (client.numeroDocumento || '').replace(/\D/g, '');
      const docRaw = (client.numeroDocumento || '').toLowerCase();
      const codigo = (client.codigo || '').toLowerCase();
      const email = (client.email || '').toLowerCase();
      const cidade = (client.endereco?.geral?.municipio || '').toLowerCase();

      const matchesSearch = nome.includes(q) ||
        fantasia.includes(q) ||
        doc.includes(q.replace(/\D/g, '')) ||
        docRaw.includes(q) ||
        codigo.includes(q) ||
        email.includes(q) ||
        cidade.includes(q);

      if (!matchesSearch) return false;
    }

    if (state.filterType && client.tipo !== state.filterType) return false;
    if (state.filterSituation && client.situacao !== state.filterSituation) return false;

    return true;
  });

  state.currentPage = 1;
  renderTable();
}

function renderTable() {
  const total = state.filteredClients.length;
  elements.recordsBadge.textContent = `${total} registros`;

  if (total === 0) {
    elements.clientsTableBody.innerHTML = '';
    elements.emptyStateMessage.textContent = 'Nenhum cliente atende aos critérios selecionados.';
    showEmptyState(true);
    updatePagination(0);
    return;
  }

  showEmptyState(false);

  const startIdx = (state.currentPage - 1) * state.pageSize;
  const endIdx = Math.min(startIdx + state.pageSize, total);
  const pageItems = state.filteredClients.slice(startIdx, endIdx);

  elements.clientsTableBody.innerHTML = pageItems.map(client => {
    const isPj = client.tipo === 'J';
    const tipoLabel = isPj ? 'PJ' : 'PF';
    const tipoClass = isPj ? 'pj' : 'pf';
    const situacaoClass = client.situacao === 'A' ? 'active' : 'inactive';
    const situacaoLabel = client.situacao === 'A' ? 'Ativo' : 'Inativo';
    const cidadeUf = client.endereco?.geral?.municipio
      ? `${client.endereco.geral.municipio} / ${client.endereco.geral.uf || ''}`
      : '--';
    const contato = client.celular || client.telefone || '--';

    return `
      <tr onclick="openClientDetails(${client.id})">
        <td><span class="text-mono font-bold" style="font-size: 11px;">${client.codigo || client.id}</span></td>
        <td>
          <div class="client-primary-name">
            <span>${escapeHtml(client.nome || 'Sem Nome')}</span>
          </div>
          ${client.fantasia ? `<div class="client-fantasy-name">${escapeHtml(client.fantasia)}</div>` : ''}
        </td>
        <td>
          <span class="badge-tipo ${tipoClass}">${tipoLabel}</span>
        </td>
        <td><span class="text-mono">${formatDocument(client.numeroDocumento)}</span></td>
        <td>${client.email ? `<span title="${escapeHtml(client.email)}">${escapeHtml(client.email)}</span>` : '<span class="text-muted">--</span>'}</td>
        <td><span class="text-mono">${contato}</span></td>
        <td>${cidadeUf}</td>
        <td style="text-align: center;">
          <span class="badge-status ${situacaoClass}">
            <i class="fa-solid fa-circle" style="font-size: 6px;"></i> ${situacaoLabel}
          </span>
        </td>
        <td style="text-align: right;" onclick="event.stopPropagation();">
          <button class="btn-view-action" onclick="openClientDetails(${client.id})">
            <i class="fa-solid fa-eye"></i> Ver
          </button>
        </td>
      </tr>
    `;
  }).join('');

  updatePagination(total);
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
// DRAWER DE DETALHES DO CLIENTE & SUPABASE COMPLEMENTS
// ==========================================================================

async function openClientDetails(clientId) {
  let client = state.allClients.find(c => c.id === clientId);

  if (state.dataSource === 'live' && state.authToken) {
    try {
      const res = await fetch(`/api/contatos/${clientId}`, {
        headers: { 'Authorization': `Bearer ${state.authToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) client = json.data;
      }
    } catch (e) {}
  }

  if (!client) return;
  state.selectedClient = client;

  const initials = (client.nome || 'FL').substring(0, 2).toUpperCase();
  elements.drawerAvatar.textContent = initials;
  elements.drawerClientName.textContent = client.nome || 'Cliente sem nome';
  elements.drawerClientCode.textContent = client.codigo || `ID #${client.id}`;
  elements.drawerStatusBadge.textContent = client.situacao === 'A' ? 'Ativo' : 'Inativo';
  elements.drawerStatusBadge.className = `drawer-badge ${client.situacao === 'A' ? '' : 'inactive'}`;

  // Tab Geral
  elements.detNome.textContent = client.nome || '--';
  elements.detFantasia.textContent = client.fantasia || '--';
  elements.detTipo.textContent = client.tipo === 'J' ? 'Pessoa Jurídica' : (client.tipo === 'F' ? 'Pessoa Física' : 'Estrangeiro');
  elements.detDoc.textContent = formatDocument(client.numeroDocumento);
  elements.detIe.textContent = client.ie || '--';
  elements.detRg.textContent = client.rg || '--';
  elements.detOrgaoEmissor.textContent = client.orgaoEmissor || '--';
  elements.detDataNasc.textContent = formatDate(client.dadosAdicionais?.dataNascimento);
  elements.detIdBling.textContent = client.id || '--';
  elements.detCodigoInterno.textContent = client.codigo || '--';
  elements.detSituacao.textContent = client.situacao === 'A' ? 'Ativo' : 'Inativo';
  elements.detIndicadorIe.textContent = formatIndicadorIe(client.indicadorIe);

  // Tab Endereços
  const endGeral = client.endereco?.geral || {};
  elements.detEndRua.textContent = endGeral.endereco || '--';
  elements.detEndNum.textContent = endGeral.numero || '--';
  elements.detEndComp.textContent = endGeral.complemento || '--';
  elements.detEndBairro.textContent = endGeral.bairro || '--';
  elements.detEndCep.textContent = endGeral.cep || '--';
  elements.detEndCidade.textContent = endGeral.municipio || '--';
  elements.detEndUf.textContent = endGeral.uf || '--';

  const endCob = client.endereco?.cobranca;
  if (endCob && (endCob.endereco || endCob.cep)) {
    elements.cardEndCobranca.style.display = 'block';
    elements.detCobRua.textContent = endCob.endereco || '--';
    elements.detCobNum.textContent = endCob.numero || '--';
    elements.detCobBairro.textContent = endCob.bairro || '--';
    elements.detCobCep.textContent = endCob.cep || '--';
    elements.detCobCidade.textContent = `${endCob.municipio || '--'} / ${endCob.uf || '--'}`;
  } else {
    elements.cardEndCobranca.style.display = 'none';
  }

  // Tab Contatos
  elements.detEmail.textContent = client.email || '--';
  elements.detEmailNfe.textContent = client.emailNotaFiscal || '--';
  elements.detTelefone.textContent = client.telefone || '--';
  elements.detCelular.textContent = client.celular || '--';

  // Tab Financeiro
  const fin = client.financeiro || {};
  elements.detLimiteCredito.textContent = fin.limiteCredito ? formatCurrency(fin.limiteCredito) : 'R$ 0,00';
  elements.detCondicaoPagto.textContent = fin.condicaoPagamento || '--';
  elements.detCategoria.textContent = fin.categoria || client.categoria?.descricao || '--';
  elements.detVendedor.textContent = client.vendedor?.nome || '--';
  elements.detObservacoes.textContent = client.observacoes || 'Nenhuma observação cadastrada para este cliente.';

  // Tab Raw JSON
  elements.detRawJson.textContent = JSON.stringify(client, null, 2);

  // Tab Supabase Complementos
  await loadClientComplements(client);

  elements.drawerOverlay.classList.add('active');
  elements.clientDrawer.classList.add('active');
}

function closeDrawer() {
  elements.drawerOverlay.classList.remove('active');
  elements.clientDrawer.classList.remove('active');
}

// Supabase Complements Logic
let currentClientTags = [];

async function loadClientComplements(client) {
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
    const res = await fetch(`/api/complements/${client.id}`, {
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
        sbLastSaved.textContent = comp.updated_at
          ? `Última atualização: ${new Date(comp.updated_at).toLocaleString('pt-BR')}`
          : 'Sincronizado no Supabase';
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
  if (btnSave) {
    btnSave.addEventListener('click', saveCurrentClientComplement);
  }
}

async function saveCurrentClientComplement() {
  if (!state.selectedClient) return;

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
      bling_customer_id: state.selectedClient.id,
      customer_code: state.selectedClient.codigo || null,
      customer_name: state.selectedClient.nome || null,
      internal_status: sbStatus,
      priority: sbPriority,
      responsible_manager: sbManager,
      internal_notes: sbNotes,
      tags: currentClientTags
    };

    const res = await fetch(`/api/complements/${state.selectedClient.id}`, {
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
// AUTENTICAÇÃO BLING OAUTH (SUPERADMIN)
// ==========================================================================

async function handleExchangeCode() {
  // Bloqueia ação para não-superadmin (segurança frontend)
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
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.authToken}`
    },
    body: JSON.stringify({ code })
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.details?.error_description || result.error || 'Falha ao autenticar com o Bling');
  }

  showNotification('Autenticação com o Bling realizada e salva no Supabase!', 'success');
  await checkBlingAuthStatus();
  setDataSource('live');
}

async function handleSaveManualToken() {
  // Bloqueia ação para não-superadmin (segurança frontend)
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
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

// Helpers
function updateStats(clients) {
  const total = clients.length;
  const active = clients.filter(c => c.situacao === 'A').length;
  const pj = clients.filter(c => c.tipo === 'J').length;
  const pf = clients.filter(c => c.tipo === 'F').length;

  elements.statTotalCount.textContent = total;
  elements.statActiveCount.textContent = active;
  elements.statPjCount.textContent = pj;
  elements.statPfCount.textContent = pf;
  elements.navClientsCount.textContent = total;
}

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
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 11) return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (clean.length === 14) return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return doc;
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

function formatDateTime(isoStr) {
  if (!isoStr) return '--';
  return new Date(isoStr).toLocaleString('pt-BR');
}

function formatIndicadorIe(ind) {
  const map = { 1: '1 - Contribuinte ICMS', 2: '2 - Contribuinte Isento', 9: '9 - Não Contribuinte' };
  return map[ind] || (ind ? String(ind) : '--');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
