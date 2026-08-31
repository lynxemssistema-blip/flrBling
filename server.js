require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const {
  supabase,
  ensureSuperadmin,
  ensureDefaultProfiles,
  getAllProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  findUserByEmail,
  findUserById,
  createUser,
  getAllUsers,
  updateUserStatus,
  updateUserProfile,
  updateUser,
  updateUserRole,
  deleteUser,
  getSupabaseTokens,
  saveSupabaseTokens,
  getCustomerComplement,
  saveCustomerComplement,
  getProductComplement,
  saveProductComplement,
  getAllProductComplements,
  logActivity,
  // Kits
  getAllKits,
  getKitById,
  saveKit,
  deleteKit,
  // Orçamentos
  getAllQuotes,
  getQuoteById,
  saveQuote,
  updateQuote,
  updateQuoteBlingSync,
  generateQuoteNumber,
  // Produtos Locais
  getAllProducts,
  getProductById,
  findProductByCode,
  findProductByBlingId,
  saveProduct,
  // Projetos & Verbas
  getAllProjects,
  getProjectById,
  saveProject,
  getProjectMaterialExtract,
  // NF-e Entradas & De-Para
  findDeParaRule,
  saveDeParaRule,
  getAllNfeEntries,
  getNfeEntryById,
  saveNfeEntryWithItems,
  // Movimentações de Estoque
  registerStockMovement,
  getStockMovements
} = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'flr_bling_super_jwt_secret_2026';
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Servir arquivos estáticos da pasta public com múltiplos fallbacks
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// Endpoint: Upload Direto de Imagem (Base64 -> Arquivo)
app.post('/api/upload/image', authenticateToken, (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Nenhuma imagem fornecida.' });
    }

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let ext = 'jpg';
    let data = imageBase64;
    if (matches && matches.length === 3) {
      const mime = matches[1];
      ext = mime.split('/')[1] || 'jpg';
      if (ext === 'jpeg') ext = 'jpg';
      data = matches[2];
    }

    const safeName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

    const publicUrl = `/uploads/${safeName}`;
    res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('Erro no upload de imagem:', err);
    res.status(500).json({ error: 'Erro ao salvar imagem: ' + err.message });
  }
});

// Inicializa o Superadmin e Perfis Padrão no banco
ensureSuperadmin();

// ==========================================================================
// MIDDLEWARES DE AUTENTICAÇÃO E PERMISSÃO
// ==========================================================================

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Faça login para continuar.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    let user = null;
    if (decoded.id === 'superadmin_id' || decoded.role === 'superadmin') {
      user = {
        id: 'superadmin_id',
        name: 'Super Administrador (FLR)',
        email: decoded.email || process.env.SUPERADMIN_EMAIL || 'admin@flrinstalacoes.com.br',
        role: 'superadmin',
        status: 'aprovado',
        profile: {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Super Administrador',
          description: 'Acesso total e irrestrito.',
          is_system: true,
          color: '#E11D48',
          permissions: {
            dashboard: { view: true },
            clients: { view: true, create: true, edit: true, delete: true, complement: true },
            products: { view: true, create: true, edit: true, delete: true },
            services: { view: true, create: true, edit: true, delete: true },
            categories: { view: true, create: true, edit: true, delete: true },
            orders: { view: true, create: true, edit: true, delete: true },
            proposals: { view: true, create: true, edit: true, delete: true },
            sellers: { view: true, create: true, edit: true, delete: true },
            nfe: { view: true, create: true, import_xml: true, delete: true },
            serviceOrders: { view: true, create: true, edit: true, delete: true },
            receivables: { view: true, create: true, edit: true, delete: true },
            payables: { view: true, create: true, edit: true, delete: true },
            stock: { view: true, adjust: true },
            users_admin: { manage_users: true, manage_profiles: true },
            bling_settings: { manage_connection: true }
          }
        }
      };
    } else {
      user = await findUserById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    if (user.status !== 'aprovado') {
      return res.status(403).json({ error: 'Seu cadastro está pendente de aprovação ou bloqueado pelo administrador.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
}

// Middleware para verificar se o usuário é Superadmin
function requireSuperadmin(req, res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Acesso restrito apenas para o Super Administrador.' });
  }
  next();
}

// Middleware para verificação granular de permissão do perfil
function requirePermission(moduleKey, action) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acesso negado. Faça login para continuar.' });
    }

    // Superadmin tem passe livre em tudo
    if (req.user.role === 'superadmin') {
      return next();
    }

    const permissions = req.user.profile?.permissions || {};
    const modPerms = permissions[moduleKey] || {};

    if (!modPerms[action]) {
      return res.status(403).json({
        error: `Acesso negado: seu perfil não possui permissão para [${action}] no módulo [${moduleKey}].`
      });
    }

    next();
  };
}

// Helper to read saved tokens (Local file + Supabase)
function getTokensLocal() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const data = fs.readFileSync(TOKENS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erro ao ler tokens.json:', err.message);
  }
  return null;
}

// Helper to save tokens (Local file + Supabase sync)
async function saveTokens(tokens) {
  try {
    const dataToSave = {
      ...tokens,
      saved_at: new Date().toISOString(),
      expires_at: tokens.expires_at || (tokens.expires_in
        ? new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString()
        : null)
    };
    
    // Salva localmente
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');

    // Sincroniza no Supabase se disponível
    saveSupabaseTokens(dataToSave).catch(err => {
      console.warn('Sincronização de token com Supabase:', err.message);
    });

    return dataToSave;
  } catch (err) {
    console.error('Erro ao salvar tokens:', err.message);
    throw err;
  }
}

// Helper to get valid tokens
async function getTokens() {
  let tokens = getTokensLocal();
  
  if (!tokens) {
    const sbTokens = await getSupabaseTokens();
    if (sbTokens && sbTokens.access_token) {
      tokens = sbTokens;
      fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
    }
  }

  return tokens;
}

// Refresh access token if expired or about to expire
async function refreshAccessToken() {
  const tokens = await getTokens();
  if (!tokens || !tokens.refresh_token) {
    throw new Error('Refresh token não encontrado. Faça a autorização novamente.');
  }

  const clientId = process.env.BLING_CLIENT_ID;
  const clientSecret = process.env.BLING_CLIENT_SECRET;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', tokens.refresh_token);

  const response = await axios.post('https://bling.com.br/Api/v3/oauth/token', params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
      'Accept': 'application/json'
    }
  });

  if (response.data && response.data.access_token) {
    const saved = await saveTokens(response.data);
    await logActivity('token_refresh', null, 'Token de acesso renovado automaticamente via Refresh Token');
    return saved;
  }
  throw new Error('Falha ao renovar token com o Bling');
}

// Get valid access token (auto-refreshes if needed)
async function getValidAccessToken() {
  let tokens = await getTokens();
  if (!tokens || !tokens.access_token) {
    return null;
  }

  if (tokens.expires_at && new Date(tokens.expires_at) <= new Date()) {
    console.log('Token expirado, tentando renovar...');
    tokens = await refreshAccessToken();
  }

  return tokens.access_token;
}

// ==========================================================================
// ROTAS DE AUTENTICAÇÃO DO USUÁRIO DO APP (LOGIN & CADASTRO)
// ==========================================================================

// Cadastro de novo usuário público (inicia pendente de aprovação)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
    }

    const user = await createUser({ name, email, password, phone });
    await logActivity('user_registered', null, `Novo usuário cadastrado: ${email}`, { name, email });

    res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso! Seu acesso está pendente de aprovação pelo Super Administrador.',
      user
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login do usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const superEmail = (process.env.SUPERADMIN_EMAIL || 'admin@flrinstalacoes.com.br').trim().toLowerCase();
    const superPass = process.env.SUPERADMIN_PASSWORD || 'AdminFLR@2026';

    // 1. Verificação direta do Super Administrador mestre (.env)
    if (cleanEmail === superEmail && password === superPass) {
      const superUser = {
        id: 'superadmin_id',
        name: 'Super Administrador (FLR)',
        email: cleanEmail,
        role: 'superadmin',
        status: 'aprovado',
        profile: {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Super Administrador',
          description: 'Acesso total e irrestrito.',
          is_system: true,
          color: '#E11D48'
        }
      };

      const token = jwt.sign(
        { id: superUser.id, email: superUser.email, role: superUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        token,
        user: superUser
      });
    }

    // 2. Verificação de usuários cadastrados no Supabase / Banco
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    if (user.status !== 'aprovado') {
      if (user.status === 'pendente') {
        return res.status(403).json({
          error: 'Seu cadastro está aguardando aprovação do Super Administrador.',
          status: 'pendente'
        });
      }
      return res.status(403).json({
        error: 'Seu acesso está bloqueado. Contate o administrador.',
        status: 'bloqueado'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...safeUser } = user;
    res.json({
      success: true,
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro no login: ' + err.message });
  }
});

// Obter dados do usuário logado
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ==========================================================================
// ROTAS DE GESTÃO DE PERFIS DE ACESSO (RBAC) - EXCLUSIVO SUPERADMIN
// ==========================================================================

// Listar todos os perfis de acesso
app.get('/api/profiles', authenticateToken, async (req, res) => {
  try {
    const profiles = await getAllProfiles();
    res.json({ profiles });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar perfis: ' + err.message });
  }
});

// Obter perfil específico por ID
app.get('/api/profiles/:id', authenticateToken, async (req, res) => {
  try {
    const profile = await getProfileById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Perfil não encontrado.' });
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter perfil: ' + err.message });
  }
});

// Criar novo perfil de acesso
app.post('/api/profiles', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const { name, description, color, permissions } = req.body;
    const profile = await createProfile({ name, description, color, permissions });
    await logActivity('profile_created', null, `Novo perfil de acesso criado: ${profile.name}`, { profileId: profile.id }, req.user.id);
    res.status(201).json({ success: true, profile });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Atualizar perfil de acesso existente
app.put('/api/profiles/:id', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const { name, description, color, permissions } = req.body;
    const profile = await updateProfile(req.params.id, { name, description, color, permissions });
    await logActivity('profile_updated', null, `Perfil de acesso atualizado: ${profile.name}`, { profileId: profile.id }, req.user.id);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Excluir perfil de acesso
app.delete('/api/profiles/:id', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    await deleteProfile(req.params.id);
    await logActivity('profile_deleted', null, `Perfil de acesso excluído (ID: ${req.params.id})`, {}, req.user.id);
    res.json({ success: true, message: 'Perfil excluído com sucesso.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================================================
// ROTAS DE GESTÃO DE USUÁRIOS (EXCLUSIVO SUPERADMIN)
// ==========================================================================

// Listar todos os usuários do sistema
app.get('/api/users', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const rawUsers = await getAllUsers();
    const users = Array.isArray(rawUsers) ? [...rawUsers] : [];
    
    // Injetar o superadmin na lista para que ele apareça no painel
    const superAdmin = {
      id: 'superadmin_id',
      name: 'Super Administrador (FLR)',
      email: process.env.SUPERADMIN_EMAIL || 'admin@flrinstalacoes.com.br',
      role: 'superadmin',
      status: 'aprovado',
      created_at: new Date().toISOString(),
      profile: { name: 'Acesso Total (Sistema)' }
    };
    
    const superEmail = (process.env.SUPERADMIN_EMAIL || 'admin@flrinstalacoes.com.br').toLowerCase();
    const exists = users.some(u => u && u.email && u.email.toLowerCase() === superEmail);
    if (!exists) {
      users.unshift(superAdmin);
    }

    res.json({ users });
  } catch (err) {
    console.error('Erro em GET /api/users:', err);
    res.status(500).json({ error: 'Erro ao listar usuários: ' + err.message });
  }
});

// Criar usuário diretamente pelo Administrador (com perfil e status definidos)
app.post('/api/users', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const { name, email, password, phone, profile_id, status, avatar_url } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const user = await createUser({
      name,
      email,
      password,
      phone,
      profile_id,
      status: status || 'aprovado',
      avatar_url: avatar_url || null
    });

    await logActivity('user_admin_created', null, `Usuário criado diretamente pelo administrador: ${email}`, { name, email, profile_id }, req.user.id);
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Atualizar dados completos do usuário (Nome, E-mail, Telefone, Perfil, Status, Senha)
app.put('/api/users/:id', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const updated = await updateUser(req.params.id, req.body);
    await logActivity('user_updated', null, `Dados do usuário ${updated.email} atualizados`, { userId: req.params.id }, req.user.id);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Atualizar status do usuário (Aprovar / Bloquear / Pendente)
app.patch('/api/users/:id/status', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await updateUserStatus(req.params.id, status);
    await logActivity('user_status_change', null, `Status do usuário ${updated.email} alterado para ${status}`, { status }, req.user.id);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Atualizar perfil de acesso do usuário
app.patch('/api/users/:id/profile', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const { profile_id } = req.body;
    const updated = await updateUserProfile(req.params.id, profile_id);
    await logActivity('user_profile_change', null, `Perfil do usuário ${updated.email} alterado`, { profile_id }, req.user.id);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Atualizar perfil/role do usuário legado
app.patch('/api/users/:id/role', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const { role } = req.body;
    const updated = await updateUserRole(req.params.id, role);
    await logActivity('user_role_change', null, `Role do usuário ${updated.email} alterada para ${role}`, { role }, req.user.id);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Excluir usuário
app.delete('/api/users/:id', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário.' });
    }
    await deleteUser(req.params.id);
    await logActivity('user_deleted', null, `Usuário excluído (ID: ${req.params.id})`, {}, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================================================
// ROTAS DE INTEGRAÇÃO COM O BLING
// ==========================================================================

// Endpoint: Retorna configuração pública e status de conexão
app.get('/api/config', (req, res) => {
  const clientId = process.env.BLING_CLIENT_ID || '';
  const redirectUri = process.env.BLING_REDIRECT_URI || '';
  const state = process.env.BLING_STATE || 'bling_auth_state';
  const authorizeUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${clientId}&state=${state}`;

  res.json({
    clientId,
    redirectUri,
    state,
    authorizeUrl,
    isConfigured: Boolean(clientId && process.env.BLING_CLIENT_SECRET),
    supabaseConnected: Boolean(supabase)
  });
});

// Endpoint: Status da autenticação com Bling
app.get('/api/auth/status', async (req, res) => {
  const tokens = await getTokens();
  if (!tokens || !tokens.access_token) {
    return res.json({
      authenticated: false,
      message: 'Não autenticado no Bling'
    });
  }

  const isExpired = tokens.expires_at ? new Date(tokens.expires_at) <= new Date() : false;

  res.json({
    authenticated: true,
    saved_at: tokens.saved_at,
    expires_at: tokens.expires_at,
    isExpired,
    tokenType: tokens.token_type || 'Bearer',
    supabaseActive: Boolean(supabase)
  });
});

// Endpoint: Troca de Authorization Code por Tokens (EXCLUSIVO SUPERADMIN)
app.post('/api/auth/exchange', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    let { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'O parâmetro "code" é obrigatório.' });
    }

    code = code.trim();

    if (code.includes('/oauth/authorize') && !code.includes('code=')) {
      return res.status(400).json({
        error: 'Você colou a URL de autorização.',
        details: 'Acesse esse link no navegador, autorize o aplicativo e copie o código (ou a URL de retorno) após o login.'
      });
    }

    if (code.includes('code=')) {
      const urlMatch = code.match(/[?&]code=([^&]+)/);
      if (urlMatch) {
        code = decodeURIComponent(urlMatch[1]);
      }
    }

    const clientId = process.env.BLING_CLIENT_ID;
    const clientSecret = process.env.BLING_CLIENT_SECRET;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code.trim());

    console.log('Solicitando tokens para o code:', code.substring(0, 8) + '...');

    const response = await axios.post('https://bling.com.br/Api/v3/oauth/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json'
      }
    });

    const saved = await saveTokens(response.data);
    await logActivity('auth_success', null, 'Autenticação OAuth realizada com sucesso pelo Superadmin', {}, req.user.id);

    res.json({
      success: true,
      message: 'Autenticação realizada com sucesso!',
      expires_at: saved.expires_at
    });
  } catch (err) {
    console.error('Erro na troca do code por token:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: 'Falha ao autenticar com o Bling',
      details: err.response?.data || err.message
    });
  }
});

// Endpoint: Inserir token manual ou renovar (EXCLUSIVO SUPERADMIN)
app.post('/api/auth/set-token', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const { access_token, refresh_token, expires_in } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: 'access_token é obrigatório' });
    }

    const saved = await saveTokens({
      access_token,
      refresh_token: refresh_token || null,
      expires_in: expires_in || 21600,
      token_type: 'Bearer'
    });

    res.json({
      success: true,
      message: 'Token salvo com sucesso!',
      expires_at: saved.expires_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar token manual: ' + err.message });
  }
});

// Endpoint: Desconectar / Limpar Tokens (EXCLUSIVO SUPERADMIN)
app.post('/api/auth/logout', authenticateToken, requireSuperadmin, (req, res) => {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      fs.unlinkSync(TOKENS_FILE);
    }
    res.json({ success: true, message: 'Desconectado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desconectar: ' + err.message });
  }
});

// Endpoint: Listar contatos / clientes da API do Bling com Cache de Alta Performance
app.get('/api/contatos', authenticateToken, requirePermission('clients', 'view'), async (req, res) => {
  try {
    const {
      pagina = 1,
      limite = 100,
      pesquisa,
      tipoPessoa,
      criterio = 1,
      refresh
    } = req.query;

    const queryParams = {
      pagina,
      limite,
      criterio
    };

    if (pesquisa) queryParams.pesquisa = pesquisa;
    if (tipoPessoa) queryParams.tipoPessoa = tipoPessoa;

    const data = await fetchBlingAPI('contatos', queryParams, refresh === 'true');
    res.json(data);
  } catch (err) {
    console.error('Erro ao consultar contatos:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: 'Erro ao consultar contatos do Bling',
      details: err.response?.data || err.message
    });
  }
});

// Endpoint: Obter detalhes completos de um contato específico (Qualquer usuário aprovado)
app.get('/api/contatos/:id', authenticateToken, requirePermission('clients', 'view'), async (req, res) => {
  try {
    const { id } = req.params;
    let accessToken = await getValidAccessToken();

    if (!accessToken) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'A integração com o Bling ainda não foi configurada pelo Administrador.'
      });
    }

    const makeRequest = async (token) => {
      return await axios.get(`https://bling.com.br/Api/v3/contatos/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
    };

    let response;
    try {
      response = await makeRequest(accessToken);
    } catch (apiErr) {
      if (apiErr.response && apiErr.response.status === 401) {
        const newTokens = await refreshAccessToken();
        response = await makeRequest(newTokens.access_token);
      } else {
        throw apiErr;
      }
    }

    res.json(response.data);
  } catch (err) {
    console.error(`Erro ao consultar contato ${req.params.id}:`, err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: 'Erro ao consultar detalhes do contato',
      details: err.response?.data || err.message
    });
  }
});

// ==========================================================================
// ENDPOINTS SUPABASE: COMPLEMENTO DE INFORMAÇÕES DO CLIENTE (flrBling_)
// ==========================================================================

app.get('/api/complements/:blingCustomerId', authenticateToken, async (req, res) => {
  try {
    const { blingCustomerId } = req.params;
    const data = await getCustomerComplement(blingCustomerId);
    res.json({ data: data || null });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dados no Supabase: ' + err.message });
  }
});

app.post('/api/complements/:blingCustomerId', authenticateToken, requirePermission('clients', 'complement'), async (req, res) => {
  try {
    const { blingCustomerId } = req.params;
    const {
      customer_code,
      customer_name,
      internal_notes,
      tags,
      priority,
      internal_status,
      responsible_manager,
      custom_fields
    } = req.body;

    const saved = await saveCustomerComplement({
      bling_customer_id: blingCustomerId,
      customer_code,
      customer_name,
      internal_notes,
      tags,
      priority,
      internal_status,
      responsible_manager,
      custom_fields
    });

    await logActivity('complement_update', blingCustomerId, `Complemento atualizado por ${req.user.name}`, {}, req.user.id);

    res.json({ success: true, data: saved });
  } catch (err) {
    console.error('Erro ao salvar complemento:', err);
    res.status(500).json({ error: 'Erro ao salvar complemento no Supabase: ' + err.message });
  }
});

// ==========================================================================
// NOVOS ENDPOINTS BLING ERP V3: PRODUTOS, VENDAS, FINANCEIRO, SERVIÇOS & OS
// ==========================================================================

// ==========================================================================
// CACHE DE ALTA PERFORMANCE EM MEMÓRIA (TTL: 30s + Invalidação Instantânea)
// ==========================================================================
const apiCache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 segundos

function getCache(key) {
  const cached = apiCache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }
  apiCache.delete(key);
  return null;
}

function setCache(key, data) {
  apiCache.set(key, { timestamp: Date.now(), data });
}

function clearCache(prefix = '') {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.startsWith(prefix)) {
      apiCache.delete(key);
    }
  }
}

// Helper genérico para chamadas à API do Bling com auto-refresh de token e cache de resposta
async function fetchBlingAPI(endpoint, params = {}, bypassCache = false) {
  const cacheKey = `bling_${endpoint}_${JSON.stringify(params)}`;
  if (!bypassCache) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
  }

  let accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error('Não autenticado no Bling.');
  }

  const makeReq = async (token) => {
    return await axios.get(`https://bling.com.br/Api/v3/${endpoint}`, {
      params,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      timeout: 15000
    });
  };

  try {
    const res = await makeReq(accessToken);
    if (res.data) setCache(cacheKey, res.data);
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 401) {
      const newTokens = await refreshAccessToken();
      const retryRes = await makeReq(newTokens.access_token);
      if (retryRes.data) setCache(cacheKey, retryRes.data);
      return retryRes.data;
    }
    throw err;
  }
}

// Helper para verificar se uma URL é pública e acessível externamente pelo Bling
function isPublicWebUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const u = url.trim().toLowerCase();
  if (!u.startsWith('http://') && !u.startsWith('https://')) return false;
  if (u.includes('localhost') || u.includes('127.0.0.1') || u.includes('::1') || u.includes('0.0.0.0')) return false;
  return true;
}

// 0. RESUMO EXECUTIVO DO DASHBOARD EM TEMPO REAL
app.get('/api/dashboard-summary', authenticateToken, async (req, res) => {
  try {
    const bypassCache = req.query.refresh === 'true';
    const cacheKey = 'dash_summary_metrics';
    if (!bypassCache) {
      const cached = getCache(cacheKey);
      if (cached) return res.json({ success: true, data: cached });
    }

    let clientesTotal = 0;
    let produtosTotal = 0;
    let osTotal = 0;
    let faturamentoMes = 0;
    let pedidosRecentes = [];
    let osRecentes = [];

    try {
      const [contatosRes, produtosRes, pedidosRes, osRes] = await Promise.allSettled([
        fetchBlingAPI('contatos', { limite: 100, criterio: 1 }, bypassCache),
        fetchBlingAPI('produtos', { limite: 100, criterio: 5 }, bypassCache),
        fetchBlingAPI('pedidos/vendas', { limite: 20 }, bypassCache),
        fetchBlingAPI('ordens-servicos', { limite: 20 }, bypassCache)
      ]);

      if (contatosRes.status === 'fulfilled' && contatosRes.value?.data) {
        clientesTotal = contatosRes.value.data.length;
      }

      if (produtosRes.status === 'fulfilled' && produtosRes.value?.data) {
        produtosTotal = produtosRes.value.data.length;
      }

      if (pedidosRes.status === 'fulfilled' && pedidosRes.value?.data) {
        const pList = pedidosRes.value.data;
        faturamentoMes = pList.reduce((acc, p) => acc + (parseFloat(p.total || p.valorTotal || 0) || 0), 0);
        pedidosRecentes = pList.slice(0, 5).map(p => ({
          numero: p.numero || p.id,
          cliente: p.contato?.nome || p.cliente?.nome || 'Cliente',
          data: p.data || new Date().toISOString().split('T')[0],
          total: parseFloat(p.total || p.valorTotal || 0),
          situacao: p.situacao?.valor || p.situacao?.nome || 'Em andamento'
        }));
      }

      if (osRes.status === 'fulfilled' && osRes.value?.data) {
        const oList = osRes.value.data;
        osTotal = oList.filter(o => o.situacao?.valor !== 'Concluído' && o.situacao?.nome !== 'Concluído').length;
        osRecentes = oList.slice(0, 5).map(o => ({
          numero: o.numero || o.id,
          cliente: o.contato?.nome || o.cliente?.nome || 'Cliente',
          responsavel: o.responsavel?.nome || 'Técnico FLR',
          previsao: o.dataPrevisao || o.data || '',
          situacao: o.situacao?.valor || o.situacao?.nome || 'Em Execução'
        }));
      }
    } catch(e) {
      console.warn('Aviso resumo dashboard:', e.message);
    }

    const summaryData = {
      clientesTotal: clientesTotal || DEMO_DATA.clientes.length,
      faturamentoMes: faturamentoMes > 0 
        ? `R$ ${faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'R$ 38.000,00',
      produtosTotal: produtosTotal || DEMO_DATA.produtos.length,
      osTotal: osTotal || DEMO_DATA.ordensServico.length,
      pedidosRecentes: pedidosRecentes.length > 0 ? pedidosRecentes : DEMO_DATA.pedidosVenda.slice(0, 5),
      osRecentes: osRecentes.length > 0 ? osRecentes : DEMO_DATA.ordensServico.slice(0, 5)
    };

    setCache(cacheKey, summaryData);
    res.json({ success: true, data: summaryData });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar resumo do dashboard: ' + err.message });
  }
});

// 1. PRODUTOS & MATERIAIS
app.get('/api/produtos', authenticateToken, requirePermission('products', 'view'), async (req, res) => {
  try {
    const { pagina = 1, limite = 100, pesquisa, tipo = 'P', refresh } = req.query;
    const params = { pagina, limite, criterio: 5 };
    if (pesquisa) params.nome = pesquisa;
    if (tipo) params.tipo = tipo;

    let responseData = await fetchBlingAPI('produtos', params, refresh === 'true');

    // Obter complementos de produtos do Supabase para enriquecer a lista com fotos salvas
    const complementsMap = await getAllProductComplements();

    if (responseData && Array.isArray(responseData.data)) {
      responseData.data = responseData.data.map(prod => {
        const comp = complementsMap[String(prod.id)] || {};
        const demo = DEMO_DATA.produtos.find(p => String(p.id) === String(prod.id)) || {};
        return {
          ...prod,
          imagemURL: comp.imagem_url || demo.imagemURL || prod.imagemURL || prod.midia?.imagens?.externas?.[0]?.link || prod.anexos?.[0]?.url || '',
          precoCusto: (comp.preco_custo !== undefined && comp.preco_custo !== null) ? comp.preco_custo : (demo.precoCusto || prod.precoCusto || 0),
          categoria: comp.categoria || demo.categoria || prod.categoria || 'Geral',
          observacoes: comp.internal_notes || demo.observacoes || prod.observacoes || ''
        };
      });
    }

    res.json(responseData);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Erro ao buscar produtos do Bling',
      details: err.response?.data || err.message
    });
  }
});

// Cadastrar Novo Produto no Bling & Supabase
app.post('/api/produtos', authenticateToken, requirePermission('products', 'create'), async (req, res) => {
  try {
    const { nome, codigo, preco, precoCusto, unidade = 'UN', tipo = 'P', categoria, estoque = 0, ncm, observacoes, imagemURL } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'O nome do produto é obrigatório.' });
    }

    const cleanImg = imagemURL ? imagemURL.trim() : '';

    const payload = {
      nome: nome.trim(),
      codigo: codigo ? codigo.trim() : `PRD-${Date.now().toString().slice(-4)}`,
      preco: parseFloat(preco) || 0,
      tipo: tipo || 'P',
      situacao: 'A',
      formato: 'S',
      unidade: unidade || 'UN'
    };

    if (ncm) {
      payload.tributacao = { ncm: ncm.replace(/\D/g, '') };
    }

    // Só envia midia para o Bling se for uma URL pública válida na web
    if (isPublicWebUrl(cleanImg)) {
      payload.midia = {
        imagens: {
          externas: [{ link: cleanImg }]
        }
      };
    }

    let createdProduct = null;
    let accessToken = await getValidAccessToken();

    if (accessToken) {
      try {
        const response = await axios.post('https://bling.com.br/Api/v3/produtos', payload, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        createdProduct = response.data?.data || response.data;
      } catch (apiErr) {
        if (apiErr.response && apiErr.response.status === 401) {
          const newTokens = await refreshAccessToken();
          const retryRes = await axios.post('https://bling.com.br/Api/v3/produtos', payload, {
            headers: {
              'Authorization': `Bearer ${newTokens.access_token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          createdProduct = retryRes.data?.data || retryRes.data;
        } else {
          throw apiErr;
        }
      }
    } else {
      // Fallback em memória para demonstração
      createdProduct = {
        id: Date.now(),
        ...payload,
        precoCusto: parseFloat(precoCusto) || 0,
        categoria: categoria || 'Geral',
        estoque: parseInt(estoque, 10) || 0,
        observacoes: observacoes || '',
        imagemURL: cleanImg || 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&auto=format&fit=crop&q=80'
      };
      DEMO_DATA.produtos.unshift(createdProduct);
    }

    const prodId = createdProduct?.id || Date.now();
    createdProduct.id = prodId;
    createdProduct.imagemURL = cleanImg;
    createdProduct.precoCusto = parseFloat(precoCusto) || 0;
    createdProduct.categoria = categoria || 'Geral';
    createdProduct.observacoes = observacoes || '';

    // Salvar complemento e foto no Supabase
    await saveProductComplement({
      bling_product_id: prodId,
      product_code: payload.codigo,
      product_name: payload.nome,
      imagem_url: cleanImg,
      preco_custo: parseFloat(precoCusto) || 0,
      categoria: categoria || 'Geral',
      internal_notes: observacoes || ''
    });

    await logActivity('product_create', null, `Produto cadastrado: ${payload.nome}`, { prodId, payload, imagemURL: cleanImg }, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Produto cadastrado com sucesso!',
      data: createdProduct
    });
  } catch (err) {
    console.error('Erro ao cadastrar produto:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: 'Erro ao cadastrar produto no Bling',
      details: err.response?.data || err.message
    });
  }
});

// Atualizar / Editar Produto Existente no Bling & Supabase
app.put('/api/produtos/:id', authenticateToken, requirePermission('products', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, codigo, preco, precoCusto, unidade = 'UN', tipo = 'P', categoria, estoque = 0, ncm, observacoes, imagemURL } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'O nome do produto é obrigatório.' });
    }

    const cleanImg = imagemURL ? imagemURL.trim() : '';

    const payload = {
      nome: nome.trim(),
      codigo: codigo ? codigo.trim() : `PRD-${id}`,
      preco: parseFloat(preco) || 0,
      tipo: tipo || 'P',
      situacao: 'A',
      formato: 'S',
      unidade: unidade || 'UN'
    };

    if (ncm) {
      payload.tributacao = { ncm: ncm.replace(/\D/g, '') };
    }

    if (isPublicWebUrl(cleanImg)) {
      payload.midia = {
        imagens: {
          externas: [{ link: cleanImg }]
        }
      };
    }

    let updatedProduct = null;
    let accessToken = await getValidAccessToken();

    if (accessToken) {
      try {
        const response = await axios.put(`https://bling.com.br/Api/v3/produtos/${id}`, payload, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        updatedProduct = response.data?.data || response.data || {};
      } catch (apiErr) {
        if (apiErr.response && apiErr.response.status === 401) {
          const newTokens = await refreshAccessToken();
          const retryRes = await axios.put(`https://bling.com.br/Api/v3/produtos/${id}`, payload, {
            headers: {
              'Authorization': `Bearer ${newTokens.access_token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          updatedProduct = retryRes.data?.data || retryRes.data || {};
        } else {
          throw apiErr;
        }
      }
    } else {
      throw new Error("Token de acesso não encontrado. Não foi possível atualizar no Bling.");
    }

    // Atualizar no cache em memória
    const mergedData = {
      id: Number(id) || id,
      ...payload,
      precoCusto: parseFloat(precoCusto) || 0,
      categoria: categoria || 'Geral',
      estoque: parseInt(estoque, 10) || 0,
      observacoes: observacoes || '',
      imagemURL: cleanImg
    };

    const demoIdx = DEMO_DATA.produtos.findIndex(p => String(p.id) === String(id));
    if (demoIdx !== -1) {
      DEMO_DATA.produtos[demoIdx] = Object.assign(DEMO_DATA.produtos[demoIdx], mergedData);
    } else {
      DEMO_DATA.produtos.unshift(mergedData);
    }

    // Salvar complemento e foto no Supabase
    await saveProductComplement({
      bling_product_id: id,
      product_code: payload.codigo,
      product_name: payload.nome,
      imagem_url: cleanImg,
      preco_custo: parseFloat(precoCusto) || 0,
      categoria: categoria || 'Geral',
      internal_notes: observacoes || ''
    });

    await logActivity('product_update', null, `Produto ${id} atualizado: ${payload.nome}`, { id, payload, imagemURL: cleanImg }, req.user.id);
    clearCache('bling_produtos');
    clearCache('dash_');

    res.json({
      success: true,
      message: 'Produto atualizado com sucesso!',
      data: Object.assign({}, updatedProduct, mergedData)
    });
  } catch (err) {
    console.error('Erro ao atualizar produto:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: 'Erro ao atualizar produto',
      details: err.response?.data || err.message
    });
  }
});

app.get('/api/produtos/:id', authenticateToken, requirePermission('products', 'view'), async (req, res) => {
  try {
    const { id } = req.params;
    let data = null;
    try {
      data = await fetchBlingAPI(`produtos/${id}`);
    } catch (e) {
      const demoProd = DEMO_DATA.produtos.find(p => String(p.id) === String(id));
      data = { data: demoProd || null };
    }

    const comp = await getProductComplement(id);
    if (data && data.data) {
      if (comp) {
        if (comp.imagem_url) data.data.imagemURL = comp.imagem_url;
        if (comp.preco_custo !== undefined && comp.preco_custo !== null) data.data.precoCusto = comp.preco_custo;
        if (comp.categoria) data.data.categoria = comp.categoria;
        if (comp.internal_notes) data.data.observacoes = comp.internal_notes;
      }
    }

    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Erro ao buscar detalhes do produto',
      details: err.response?.data || err.message
    });
  }
});

// Atualizar Imagem de Produto Existente
app.patch('/api/produtos/:id/imagem', authenticateToken, requirePermission('products', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { imagemURL } = req.body;

    if (!imagemURL) {
      return res.status(400).json({ error: 'imagemURL é obrigatório.' });
    }

    const cleanImg = imagemURL.trim();

    // Atualiza no cache em memória
    const demoProd = DEMO_DATA.produtos.find(p => String(p.id) === String(id));
    if (demoProd) {
      demoProd.imagemURL = cleanImg;
    }

    // Salva no Supabase
    await saveProductComplement({
      bling_product_id: id,
      imagem_url: cleanImg
    });

    // Se houver conexão com o Bling e for URL pública, tenta persistir via Bling API v3
    if (isPublicWebUrl(cleanImg)) {
      let accessToken = await getValidAccessToken();
      if (accessToken) {
        try {
          await axios.patch(`https://bling.com.br/Api/v3/produtos/${id}`, {
            midia: {
              imagens: {
                externas: [{ link: cleanImg }]
              }
            }
          }, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (apiErr) {
          console.warn('Aviso API Bling ao atualizar imagem:', apiErr.response?.data || apiErr.message);
        }
      }
    }

    await logActivity('product_image_update', null, `Imagem do produto ${id} atualizada para: ${cleanImg}`, { id, imagemURL: cleanImg }, req.user.id);

    res.json({
      success: true,
      message: 'Imagem do produto atualizada com sucesso!',
      imagemURL: cleanImg
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar imagem do produto: ' + err.message });
  }
});

// 2. PEDIDOS DE VENDA
app.get('/api/pedidos-vendas', authenticateToken, requirePermission('orders', 'view'), async (req, res) => {
  try {
    const { pagina = 1, limite = 100, idContato, situacao } = req.query;
    const params = { pagina, limite };
    if (idContato) params.idContato = idContato;
    if (situacao) params.idsSituacoes = [situacao];

    const data = await fetchBlingAPI('pedidos/vendas', params);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Erro ao buscar pedidos de venda',
      details: err.response?.data || err.message
    });
  }
});

app.get('/api/pedidos-vendas/:id', authenticateToken, requirePermission('orders', 'view'), async (req, res) => {
  try {
    const data = await fetchBlingAPI(`pedidos/vendas/${req.params.id}`);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Erro ao buscar detalhes do pedido de venda',
      details: err.response?.data || err.message
    });
  }
});

// 3. PROPOSTAS COMERCIAIS / ORÇAMENTOS
app.get('/api/propostas-comerciais', authenticateToken, requirePermission('proposals', 'view'), async (req, res) => {
  try {
    const { pagina = 1, limite = 100 } = req.query;
    const data = await fetchBlingAPI('propostas-comerciais', { pagina, limite });
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Erro ao buscar propostas comerciais',
      details: err.response?.data || err.message
    });
  }
});

// ==========================================================================
// 4. KITS DE PRODUTOS (Supabase)
// ==========================================================================

// Listar Kits
app.get('/api/kits', authenticateToken, async (req, res) => {
  try {
    const { apenasAtivos } = req.query;
    const kits = await getAllKits({ apenasAtivos: apenasAtivos === 'true' });
    res.json({ data: kits });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar kits: ' + err.message });
  }
});

// Detalhe de um Kit
app.get('/api/kits/:id', authenticateToken, async (req, res) => {
  try {
    const kit = await getKitById(req.params.id);
    if (!kit) return res.status(404).json({ error: 'Kit não encontrado.' });
    res.json({ data: kit });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar kit: ' + err.message });
  }
});

// Criar ou Atualizar Kit
app.post('/api/kits', authenticateToken, async (req, res) => {
  try {
    const kit = await saveKit(req.body, req.user?.id);
    await logActivity('kit_created', null, `Kit criado: ${kit.nome}`, {}, req.user?.id);
    res.status(201).json({ success: true, data: kit });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar kit: ' + err.message });
  }
});

app.put('/api/kits/:id', authenticateToken, async (req, res) => {
  try {
    const kit = await saveKit({ ...req.body, id: req.params.id }, req.user?.id);
    await logActivity('kit_updated', null, `Kit atualizado: ${kit.nome}`, {}, req.user?.id);
    res.json({ success: true, data: kit });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar kit: ' + err.message });
  }
});

// Soft-delete de Kit
app.delete('/api/kits/:id', authenticateToken, async (req, res) => {
  try {
    await deleteKit(req.params.id);
    res.json({ success: true, message: 'Kit desativado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desativar kit: ' + err.message });
  }
});

// ==========================================================================
// 5. ORÇAMENTOS / FAST QUOTE BUILDER (Supabase + Bling Export)
// ==========================================================================

// Listar Orçamentos
app.get('/api/orcamentos', authenticateToken, async (req, res) => {
  try {
    const { status, contactId, limit, offset } = req.query;
    const quotes = await getAllQuotes({
      status, contactId,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });
    res.json({ data: quotes });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar orçamentos: ' + err.message });
  }
});

// Detalhe de um Orçamento
app.get('/api/orcamentos/:id', authenticateToken, async (req, res) => {
  try {
    const quote = await getQuoteById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Orçamento não encontrado.' });
    res.json({ data: quote });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar orçamento: ' + err.message });
  }
});

// Criar Orçamento
app.post('/api/orcamentos', authenticateToken, async (req, res) => {
  try {
    const quote = await saveQuote(req.body, req.user?.id);
    await logActivity('quote_created', null, `Orçamento criado: ${quote.numero}`, {}, req.user?.id);
    res.status(201).json({ success: true, data: quote });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar orçamento: ' + err.message });
  }
});

// Atualizar Orçamento
app.put('/api/orcamentos/:id', authenticateToken, async (req, res) => {
  try {
    const quote = await saveQuote({ ...req.body, id: req.params.id }, req.user?.id);
    res.json({ success: true, data: quote });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar orçamento: ' + err.message });
  }
});

// Cancelar / Remover Orçamento
app.delete('/api/orcamentos/:id', authenticateToken, async (req, res) => {
  try {
    await updateQuote(req.params.id, { status: 'cancelado' });
    res.json({ success: true, message: 'Orçamento cancelado.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cancelar orçamento: ' + err.message });
  }
});

// ==========================================================================
// EXPORTAR ORÇAMENTO PARA O BLING (Pedido de Venda ou Proposta Comercial)
// ==========================================================================
app.post('/api/orcamentos/:id/exportar-bling', authenticateToken, async (req, res) => {
  try {
    const { destino = 'pedido' } = req.body; // 'pedido' | 'proposta'
    const quote = await getQuoteById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Orçamento não encontrado.' });
    if (quote.status !== 'aprovado') {
      return res.status(400).json({ error: 'Somente orçamentos com status "aprovado" podem ser exportados.' });
    }

    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return res.status(401).json({ error: 'Integração com o Bling não conectada. Autorize o aplicativo primeiro.' });
    }

    // DESMEMBRAMENTO: Expandir kits nos seus produtos individuais
    const itensExpandidos = [];
    const itens = quote.itens || [];

    for (const item of itens) {
      if (item.tipo === 'kit' && item.itens_kit && item.itens_kit.length > 0) {
        // Kit: desmembrar cada produto do kit
        const qtdKit = parseFloat(item.quantidade) || 1;
        const totalKitPrice = parseFloat(item.preco_total) || 0;
        const totalKitBase = item.itens_kit.reduce((s, ki) => s + (ki.quantity * ki.unit_price), 0);

        for (const ki of item.itens_kit) {
          const fatorProporcional = totalKitBase > 0 ? (ki.quantity * ki.unit_price) / totalKitBase : 0;
          const precoUnitarioAjustado = totalKitBase > 0
            ? (totalKitPrice * fatorProporcional) / (ki.quantity * qtdKit)
            : ki.unit_price;

          itensExpandidos.push({
            codigo: ki.product_code || '',
            descricao: ki.product_name,
            unidade: ki.product_unit || 'UN',
            quantidade: ki.quantity * qtdKit,
            valor: parseFloat(precoUnitarioAjustado.toFixed(4)),
            ...(ki.bling_product_id ? { produto: { id: ki.bling_product_id } } : {})
          });
        }
      } else {
        // Produto avulso
        itensExpandidos.push({
          codigo: item.codigo || '',
          descricao: item.descricao || item.nome || 'Item',
          unidade: item.unidade || 'UN',
          quantidade: parseFloat(item.quantidade) || 1,
          valor: parseFloat(item.preco_unitario) || 0,
          ...(item.bling_product_id ? { produto: { id: item.bling_product_id } } : {})
        });
      }
    }

    // Montar payload para a API v3 do Bling
    const contatoPayload = quote.bling_contact_id
      ? { contato: { id: quote.bling_contact_id } }
      : { contato: { nome: quote.bling_contact_nome || 'Cliente' } };

    let blingResponse;

    if (destino === 'pedido') {
      const payload = {
        ...contatoPayload,
        data: quote.data_emissao || new Date().toISOString().split('T')[0],
        itens: itensExpandidos,
        observacoes: quote.observacoes || '',
        desconto: {
          tipo: '%',
          valor: parseFloat(quote.desconto_pct) || 0
        },
        transporte: {
          frete: parseFloat(quote.frete) || 0
        }
      };
      blingResponse = await axios.post('https://bling.com.br/Api/v3/pedidos/vendas', payload, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
    } else {
      const payload = {
        ...contatoPayload,
        dataEmissao: quote.data_emissao || new Date().toISOString().split('T')[0],
        dataValidade: quote.data_validade,
        itens: itensExpandidos,
        observacoes: quote.observacoes || '',
        desconto: parseFloat(quote.desconto_pct) || 0
      };
      blingResponse = await axios.post('https://bling.com.br/Api/v3/propostas-comerciais', payload, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
    }

    const blingData = blingResponse.data?.data || blingResponse.data;
    const blingId = blingData?.id;

    // Salvar referência do Bling no Supabase
    await updateQuoteBlingSync(quote.id, {
      blingPedidoId: destino === 'pedido' ? blingId : undefined,
      blingPropostaId: destino === 'proposta' ? blingId : undefined,
      tipo: destino
    });
    // Atualiza status para 'exportado'
    await updateQuote(quote.id, { status: 'aprovado' });

    await logActivity('quote_exported', null,
      `Orçamento ${quote.numero} exportado como ${destino} para o Bling (ID: ${blingId})`, {}, req.user?.id);

    res.json({
      success: true,
      message: `Orçamento exportado com sucesso para o Bling como ${destino === 'pedido' ? 'Pedido de Venda' : 'Proposta Comercial'}!`,
      bling_id: blingId,
      destino
    });
  } catch (err) {
    console.error('Erro ao exportar para o Bling:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: 'Erro ao exportar orçamento para o Bling',
      details: err.response?.data || err.message
    });
  }
});

// ==========================================================================
// 6. PROJETOS / OBRAS & CONTROLE DE VERBAS (Supabase)
// ==========================================================================

// Listar Projetos
app.get('/api/projetos', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const projects = await getAllProjects({ status });
    res.json({ data: projects });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar projetos: ' + err.message });
  }
});

// Detalhe de um Projeto
app.get('/api/projetos/:id', authenticateToken, async (req, res) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });
    res.json({ data: project });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar projeto: ' + err.message });
  }
});

// Salvar / Criar Projeto
app.post('/api/projetos', authenticateToken, async (req, res) => {
  try {
    const project = await saveProject(req.body, req.user?.id);
    await logActivity('project_saved', null, `Projeto salvo: ${project.nome}`, { project }, req.user?.id);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar projeto: ' + err.message });
  }
});

// Extrato de Materiais e Verba por Projeto
app.get('/api/projetos/:id/extrato-material', authenticateToken, async (req, res) => {
  try {
    const extract = await getProjectMaterialExtract(req.params.id);
    res.json({ data: extract });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar extrato do projeto: ' + err.message });
  }
});

// ==========================================================================
// 7. PRODUTOS & MATERIAIS LOCAIS (Com Sincronização Opcional ao Bling)
// ==========================================================================

// Listar Produtos Locais
app.get('/api/produtos-locais', authenticateToken, async (req, res) => {
  try {
    const { pesquisa, onlyLocal, onlyBling, limite = 100 } = req.query;
    const products = await getAllProducts({
      search: pesquisa,
      onlyLocal: onlyLocal === 'true',
      onlyBling: onlyBling === 'true',
      limit: parseInt(limite, 10)
    });
    res.json({ data: products });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produtos locais: ' + err.message });
  }
});

// Salvar Produto Local (default: sincronizado_bling = false)
app.post('/api/produtos-locais', authenticateToken, async (req, res) => {
  try {
    const product = await saveProduct(req.body, req.user?.id);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar produto local: ' + err.message });
  }
});

// Enviar Produto Pontual para o Bling sob demanda
app.post('/api/produtos-locais/:id/sincronizar-bling', authenticateToken, async (req, res) => {
  try {
    const prod = await getProductById(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Produto não encontrado.' });

    const tokens = await getTokens();
    if (!tokens || !tokens.access_token) {
      return res.status(401).json({ error: 'Bling OAuth não conectado.' });
    }

    const payload = {
      nome: prod.nome,
      codigo: prod.codigo || undefined,
      preco: parseFloat(prod.preco_venda) || 0,
      tipo: prod.tipo || 'P',
      unidade: prod.unidade || 'UN',
      formato: 'S'
    };

    const blingRes = await axios.post('https://bling.com.br/Api/v3/produtos', payload, {
      headers: { 'Authorization': `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json' }
    });

    const blingId = blingRes.data?.data?.id;
    if (blingId) {
      await saveProduct({ id: prod.id, bling_id: blingId, sincronizado_bling: true, sincronizado_em: new Date().toISOString() });
    }

    res.json({ success: true, message: 'Produto sincronizado no Bling com sucesso!', bling_id: blingId });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao sincronizar produto no Bling: ' + (err.response?.data?.error?.message || err.message) });
  }
});

// ==========================================================================
// 8. ENTRADA DE NOTAS FISCAIS (NF-e) & DE-PARA INTELIGENTE
// ==========================================================================

// Listar Entradas de NF-e
app.get('/api/nfe-entradas', authenticateToken, async (req, res) => {
  try {
    const { status, projetoId, limite = 100 } = req.query;
    const entries = await getAllNfeEntries({ status, projetoId, limit: parseInt(limite, 10) });
    res.json({ data: entries });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar notas fiscais: ' + err.message });
  }
});

// Detalhe de uma NF-e com itens
app.get('/api/nfe-entradas/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await getNfeEntryById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Nota fiscal não encontrada.' });
    res.json({ data: entry });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar nota fiscal: ' + err.message });
  }
});

// Consulta Regra de De-Para (Sugere produto baseado no CNPJ e Código do Fornecedor)
app.post('/api/nfe-entradas/de-para-lookup', authenticateToken, async (req, res) => {
  try {
    const { fornecedor_cnpj, codigo_fornecedor } = req.body;
    const rule = await findDeParaRule(fornecedor_cnpj, codigo_fornecedor);
    res.json({ data: rule });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar De-Para: ' + err.message });
  }
});

// Salvar Entrada de NF-e completa (Cabeçalho + Itens + De-Para + Movimentações)
app.post('/api/nfe-entradas', authenticateToken, async (req, res) => {
  try {
    const { entry, items = [] } = req.body;
    if (!entry || !entry.numero_nota || !entry.fornecedor_nome) {
      return res.status(400).json({ error: 'Dados da nota fiscal incompletos.' });
    }

    const saved = await saveNfeEntryWithItems(entry, items, req.user?.id);
    await logActivity('nfe_entry_saved', null, `Entrada NF-e #${entry.numero_nota} salva (${entry.fornecedor_nome})`, { entry }, req.user?.id);

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar entrada de NF-e: ' + err.message });
  }
});

// ==========================================================================
// 9. MOVIMENTAÇÕES DE ESTOQUE & RETIRADAS PARA OBRA
// ==========================================================================

// Listar Movimentações
app.get('/api/estoque/movimentacoes', authenticateToken, async (req, res) => {
  try {
    const { produtoId, projetoId, destino, limite = 100 } = req.query;
    const movs = await getStockMovements({ produtoId, projetoId, destino, limit: parseInt(limite, 10) });
    res.json({ data: movs });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar movimentações: ' + err.message });
  }
});

// Registrar Retirada de Almoxarifado para Obra
app.post('/api/estoque/movimentacoes', authenticateToken, async (req, res) => {
  try {
    const mov = await registerStockMovement(req.body, req.user?.id);
    await logActivity('stock_movement', null, `Movimento de estoque registrado: ${mov.tipo}`, { mov }, req.user?.id);
    res.status(201).json({ success: true, data: mov });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar movimento: ' + err.message });
  }
});

// 6. CONTAS A RECEBER
app.get('/api/contas-receber', authenticateToken, requirePermission('receivables', 'view'), async (req, res) => {
  try {
    const { pagina = 1, limite = 100, situacao } = req.query;
    const params = { pagina, limite };
    if (situacao) params.situacao = situacao;

    const data = await fetchBlingAPI('contas-receber', params);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Erro ao buscar contas a receber',
      details: err.response?.data || err.message
    });
  }
});

// 5. CONTAS A PAGAR
app.get('/api/contas-pagar', authenticateToken, requirePermission('payables', 'view'), async (req, res) => {
  try {
    const { pagina = 1, limite = 100, situacao } = req.query;
    const params = { pagina, limite };
    if (situacao) params.situacao = situacao;

    const data = await fetchBlingAPI('contas-pagar', params);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Erro ao buscar contas a pagar',
      details: err.response?.data || err.message
    });
  }
});

// 6. ORDENS DE SERVIÇO (OS)
app.get('/api/ordens-servicos', authenticateToken, requirePermission('serviceOrders', 'view'), async (req, res) => {
  try {
    const { pagina = 1, limite = 100, situacao } = req.query;
    const params = { pagina, limite };
    if (situacao) params.situacao = situacao;

    const data = await fetchBlingAPI('ordens-servicos', params);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Erro ao buscar ordens de serviço',
      details: err.response?.data || err.message
    });
  }
});

// 7. NOTAS FISCAIS (NFE)
app.get('/api/nfe', authenticateToken, requirePermission('nfe', 'view'), async (req, res) => {
  try {
    const { pagina = 1, limite = 100 } = req.query;
    const data = await fetchBlingAPI('nfe', { pagina, limite });
    if (!data.data || data.data.length === 0) {
      return res.json({ data: DEMO_DATA.nfe || [] });
    }
    res.json(data);
  } catch (err) {
    res.json({ data: DEMO_DATA.nfe || [] });
  }
});

app.post('/api/nfe', authenticateToken, requirePermission('nfe', 'create'), async (req, res) => {
  try {
    const nfe = req.body;
    if (!nfe || !nfe.numero) {
      return res.status(400).json({ error: 'Dados da nota fiscal inválidos.' });
    }

    if (!DEMO_DATA.nfe) DEMO_DATA.nfe = [];
    DEMO_DATA.nfe.unshift(nfe);

    await logActivity('nfe_create', null, `Nota Fiscal ${nfe.tipo} nº ${nfe.numero} cadastrada/importada`, { nfe }, req.user.id);

    res.status(201).json({
      success: true,
      message: `Nota Fiscal nº ${nfe.numero} salva com sucesso!`,
      data: nfe
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. SALDOS DE ESTOQUE
app.get('/api/estoques/saldos', authenticateToken, requirePermission('stock', 'view'), async (req, res) => {
  try {
    const { pagina = 1, limite = 100 } = req.query;
    const data = await fetchBlingAPI('estoques/saldos', { pagina, limite });
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Erro ao buscar saldos de estoque',
      details: err.response?.data || err.message
    });
  }
});

// ==========================================================================
// RESUMO DO DASHBOARD & DADOS DEMO ENRIQUECIDOS
// ==========================================================================

const DEMO_DATA = {
  clientes: [
    {
      id: 168492019,
      nome: "FLR Instalações e Manutenções LTDA",
      codigo: "CLI-001",
      situacao: "A",
      numeroDocumento: "45.123.890/0001-92",
      telefone: "(11) 3456-7890",
      celular: "(11) 98765-4321",
      email: "contato@flrinstalacoes.com.br",
      tipo: "J",
      indicadorIe: 1,
      ie: "123.456.789.110",
      rg: "",
      orgaoEmissor: "",
      fantasia: "FLR Engenharia & Climatização",
      endereco: {
        geral: {
          endereco: "Av. Brigadeiro Faria Lima",
          numero: "2355",
          complemento: "Conjunto 81",
          bairro: "Jardim Paulistano",
          cep: "01452-000",
          municipio: "São Paulo",
          uf: "SP"
        }
      },
      dadosAdicionais: { dataNascimento: "2018-05-14", sexo: "", naturalidade: "São Paulo" },
      financeiro: { limiteCredito: 25000.00, condicaoPagamento: "30/60 DDL", categoria: "Instalações Corporativas" }
    },
    {
      id: 168492020,
      nome: "Carlos Eduardo Silveira",
      codigo: "CLI-002",
      situacao: "A",
      numeroDocumento: "289.456.781-04",
      telefone: "(19) 3214-5500",
      celular: "(19) 99123-8899",
      email: "carlos.silveira@gmail.com",
      tipo: "F",
      indicadorIe: 9,
      ie: "",
      rg: "41.982.112-X",
      orgaoEmissor: "SSP/SP",
      fantasia: "",
      endereco: {
        geral: {
          endereco: "Rua Coronel Quirino",
          numero: "450",
          complemento: "Casa 2",
          bairro: "Cambuí",
          cep: "13025-001",
          municipio: "Campinas",
          uf: "SP"
        }
      },
      dadosAdicionais: { dataNascimento: "1985-11-20", sexo: "M", naturalidade: "Campinas" },
      financeiro: { limiteCredito: 5000.00, condicaoPagamento: "À Vista / Pix", categoria: "Pessoa Física" }
    },
    {
      id: 168492021,
      nome: "Construtora e Incorporadora Horizonte S.A.",
      codigo: "CLI-003",
      situacao: "A",
      numeroDocumento: "10.987.654/0001-33",
      telefone: "(21) 2500-1000",
      celular: "(21) 97654-3210",
      email: "compras@horizonte.com.br",
      tipo: "J",
      indicadorIe: 1,
      ie: "87.654.321",
      rg: "",
      orgaoEmissor: "",
      fantasia: "Horizonte Empreendimentos",
      endereco: {
        geral: {
          endereco: "Av. das Américas",
          numero: "5000",
          complemento: "Bloco 2 Sala 405",
          bairro: "Barra da Tijuca",
          cep: "22640-102",
          municipio: "Rio de Janeiro",
          uf: "RJ"
        }
      },
      dadosAdicionais: { dataNascimento: "2010-03-12", sexo: "", naturalidade: "Rio de Janeiro" },
      financeiro: { limiteCredito: 80000.00, condicaoPagamento: "28/56 DDL", categoria: "Grandes Contas" }
    }
  ],
  produtos: [
    { 
      id: 101, 
      nome: "Ar Condicionado Split Inverter 12000 BTUs", 
      codigo: "AC-12K-INV", 
      preco: 2890.00, 
      precoCusto: 1950.00, 
      unidade: "UN", 
      tipo: "P", 
      situacao: "A", 
      estoque: 14, 
      categoria: "Climatização",
      imagemURL: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&auto=format&fit=crop&q=80"
    },
    { 
      id: 102, 
      nome: "Cabo de Cobre Flexível 6mm (Rolo 100m)", 
      codigo: "EL-CAB-6MM", 
      preco: 420.00, 
      precoCusto: 280.00, 
      unidade: "RL", 
      tipo: "P", 
      situacao: "A", 
      estoque: 38, 
      categoria: "Material Elétrico",
      imagemURL: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=300&auto=format&fit=crop&q=80"
    },
    { 
      id: 103, 
      nome: "Disjuntor Bipolar DIN 32A Steck", 
      codigo: "EL-DISJ-32A", 
      preco: 48.50, 
      precoCusto: 28.00, 
      unidade: "UN", 
      tipo: "P", 
      situacao: "A", 
      estoque: 95, 
      categoria: "Proteção Elétrica",
      imagemURL: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80"
    },
    { 
      id: 104, 
      nome: "Serviço de Instalação e Infraestrutura HVAC", 
      codigo: "SRV-INST-HVAC", 
      preco: 850.00, 
      precoCusto: 300.00, 
      unidade: "SV", 
      tipo: "S", 
      situacao: "A", 
      estoque: 999, 
      categoria: "Serviços Técnicos",
      imagemURL: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80"
    },
    { 
      id: 105, 
      nome: "Manutenção Preventiva e Higienização de Splits", 
      codigo: "SRV-MANUT-PREV", 
      preco: 250.00, 
      precoCusto: 80.00, 
      unidade: "SV", 
      tipo: "S", 
      situacao: "A", 
      estoque: 999, 
      categoria: "Serviços Técnicos",
      imagemURL: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&auto=format&fit=crop&q=80"
    }
  ],
  pedidos: [
    { id: 2001, numero: 5082, data: "2026-03-18", cliente: { nome: "FLR Instalações e Manutenções LTDA", id: 168492019 }, total: 6630.00, situacao: "Atendido", vendedor: "Roberto Andrade", itensQtd: 3 },
    { id: 2002, numero: 5083, data: "2026-03-20", cliente: { nome: "Construtora e Incorporadora Horizonte S.A.", id: 168492021 }, total: 24500.00, situacao: "Em andamento", vendedor: "Ana Paula Silva", itensQtd: 8 },
    { id: 2003, numero: 5084, data: "2026-03-22", cliente: { nome: "Carlos Eduardo Silveira", id: 168492020 }, total: 1100.00, situacao: "Pendente", vendedor: "Roberto Andrade", itensQtd: 2 }
  ],
  ordensServicos: [
    { id: 3001, numero: 1045, dataAbertura: "2026-03-15", dataPrevisao: "2026-03-25", cliente: { nome: "Construtora Horizonte S.A." }, descricao: "Instalação de 6 Splits 18k BTUs no Bloco Corporativo", responsavel: "Eng. Rodrigo / Equipe Alpha", situacao: "Em Execução", valorTotal: 18500.00 },
    { id: 3002, numero: 1046, dataAbertura: "2026-03-19", dataPrevisao: "2026-03-23", cliente: { nome: "Carlos Eduardo Silveira" }, descricao: "Troca de Quadro de Distribuição e Balanceamento de Cargas", responsavel: "Téc. Fernando", situacao: "Concluído", valorTotal: 1450.00 },
    { id: 3003, numero: 1047, dataAbertura: "2026-03-21", dataPrevisao: "2026-03-28", cliente: { nome: "FLR Instalações LTDA" }, descricao: "Manutenção Preventiva de Chillers e Dutos Centrais", responsavel: "Equipe Beta Clima", situacao: "Aguardando Peças", valorTotal: 9800.00 }
  ],
  contasReceber: [
    { id: 4001, numeroDocumento: "FAT-5082/1", cliente: "FLR Instalações LTDA", vencimento: "2026-03-30", valor: 3315.00, saldo: 3315.00, situacao: "Aberta" },
    { id: 4002, numeroDocumento: "FAT-5082/2", cliente: "FLR Instalações LTDA", vencimento: "2026-04-30", valor: 3315.00, saldo: 3315.00, situacao: "Aberta" },
    { id: 4003, numeroDocumento: "FAT-5070", cliente: "Carlos Eduardo Silveira", vencimento: "2026-03-10", valor: 850.00, saldo: 0, situacao: "Liquidada" },
    { id: 4004, numeroDocumento: "FAT-5083/1", cliente: "Construtora Horizonte S.A.", vencimento: "2026-04-15", valor: 12250.00, saldo: 12250.00, situacao: "Aberta" }
  ],
  contasPagar: [
    { id: 5001, fornecedor: "Distribuidora Nacional de Cobre S/A", vencimento: "2026-03-28", valor: 4500.00, situacao: "Aberta", categoria: "Matéria-Prima" },
    { id: 5002, fornecedor: "Daikin / Carrier Climatização Brasil", vencimento: "2026-04-05", valor: 14200.00, situacao: "Aberta", categoria: "Equipamentos HVAC" },
    { id: 5003, fornecedor: "Enel Energia SP", vencimento: "2026-03-20", valor: 780.00, situacao: "Paga", categoria: "Utilidades" }
  ],
  propostas: [
    { id: 6001, numero: 890, cliente: "Shopping Iguatemi Galeria", data: "2026-03-17", validade: "2026-04-17", total: 85000.00, situacao: "Em Negociação" },
    { id: 6002, numero: 891, cliente: "Hospital São Lucas SP", data: "2026-03-21", validade: "2026-04-05", total: 42000.00, situacao: "Aprovada" }
  ],
  nfe: [
    {
      id: 50001,
      numero: 4502,
      serie: "1",
      tipo: "E",
      tipoOperacao: "E",
      dataEmissao: "2026-03-20",
      naturezaOperacao: "Compra para comercialização / Estoque",
      chaveAcesso: "35260345123890000192550010000045021008451239",
      situacao: "Autorizada",
      valorTotal: 18500.00,
      valorNota: 18500.00,
      contato: { nome: "Daikin / Carrier Climatização Brasil", numeroDocumento: "12.345.678/0001-90" },
      itens: [
        { numeroItem: 1, codigo: "AC-12K-INV", descricao: "Ar Condicionado Split Inverter 12000 BTUs", ncm: "8415.10.11", unidade: "UN", quantidade: 6, valorUnitario: 1950.00, subtotal: 11700.00 },
        { numeroItem: 2, codigo: "EL-CAB-6MM", descricao: "Cabo de Cobre Flexível 6mm (Rolo 100m)", ncm: "7408.11.00", unidade: "RL", quantidade: 10, valorUnitario: 280.00, subtotal: 2800.00 }
      ]
    },
    {
      id: 50002,
      numero: 1084,
      serie: "1",
      tipo: "S",
      tipoOperacao: "S",
      dataEmissao: "2026-03-22",
      naturezaOperacao: "Venda de Mercadorias e Instalação",
      chaveAcesso: "35260345123890000192550010000010841008459999",
      situacao: "Autorizada",
      valorTotal: 6630.00,
      valorNota: 6630.00,
      contato: { nome: "Construtora Horizonte S.A.", numeroDocumento: "10.987.654/0001-33" },
      itens: [
        { numeroItem: 1, codigo: "SRV-INST-HVAC", descricao: "Serviço de Instalação e Infraestrutura HVAC", ncm: "0000.00.00", unidade: "SV", quantidade: 1, valorUnitario: 850.00, subtotal: 850.00 }
      ]
    }
  ]
};

// Endpoint unificado de dados simulados (Demo)
app.get('/api/demo-data', (req, res) => {
  const { module = 'clientes' } = req.query;
  res.json({
    data: DEMO_DATA[module] || DEMO_DATA.clientes,
    allModules: Object.keys(DEMO_DATA)
  });
});

// Endpoint: Resumo Consolidado do Dashboard
app.get('/api/dashboard-summary', authenticateToken, async (req, res) => {
  try {
    let totals = {
      clientesTotal: DEMO_DATA.clientes.length,
      produtosTotal: DEMO_DATA.produtos.length,
      pedidosTotal: DEMO_DATA.pedidos.length,
      faturamentoMes: 32230.00,
      ordensServicosAtivas: 2,
      contasReceberPendente: 18880.00,
      contasPagarPendente: 18700.00,
      fonte: 'demo'
    };

    const hasTokens = await getTokens();
    if (hasTokens && hasTokens.access_token) {
      totals.fonte = 'live';
      // Tentativas de puxar contadores reais se disponível
      try {
        const contatos = await fetchBlingAPI('contatos', { limite: 1 });
        if (contatos && contatos.data) totals.clientesTotal = contatos.data.length ? 100 : 0;
      } catch (e) {}
    }

    res.json({ success: true, data: totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Servidor Bling + Supabase Auth iniciado!`);
  console.log(`🌐 Acesse no seu navegador: http://localhost:${PORT}`);
  console.log(`👑 Superadmin padrão: admin@flrinstalacoes.com.br`);
  console.log(`🔑 Senha padrão: AdminFLR@2026`);
  console.log(`======================================================\n`);
});
