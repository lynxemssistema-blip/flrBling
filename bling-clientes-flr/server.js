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
  findUserByEmail,
  findUserById,
  createUser,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getSupabaseTokens,
  saveSupabaseTokens,
  getCustomerComplement,
  saveCustomerComplement,
  logActivity
} = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'flr_bling_super_jwt_secret_2026';
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Inicializa o Superadmin no banco
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
    const user = await findUserById(decoded.id);

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

// Cadastro de novo usuário (inicia pendente de aprovação)
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

    const user = await findUserByEmail(email);
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
    res.status(500).json({ error: 'Erro no login: ' + err.message });
  }
});

// Obter dados do usuário logado
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ==========================================================================
// ROTAS DE GESTÃO DE USUÁRIOS (EXCLUSIVO SUPERADMIN)
// ==========================================================================

// Listar todos os usuários do sistema
app.get('/api/users', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar usuários: ' + err.message });
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

// Atualizar perfil/role do usuário (superadmin, admin, user)
app.patch('/api/users/:id/role', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const { role } = req.body;
    const updated = await updateUserRole(req.params.id, role);
    await logActivity('user_role_change', null, `Perfil do usuário ${updated.email} alterado para ${role}`, { role }, req.user.id);
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

// Endpoint: Listar contatos / clientes da API do Bling (Qualquer usuário aprovado)
app.get('/api/contatos', authenticateToken, async (req, res) => {
  try {
    let accessToken = await getValidAccessToken();

    if (!accessToken) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'A integração com o Bling ainda não foi configurada pelo Administrador.'
      });
    }

    const {
      pagina = 1,
      limite = 100,
      pesquisa,
      tipoPessoa,
      criterio = 1
    } = req.query;

    const queryParams = {
      pagina,
      limite,
      criterio
    };

    if (pesquisa) queryParams.pesquisa = pesquisa;
    if (tipoPessoa) queryParams.tipoPessoa = tipoPessoa;

    const makeRequest = async (token) => {
      return await axios.get('https://bling.com.br/Api/v3/contatos', {
        params: queryParams,
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
        console.log('Recebido 401 da API do Bling, renovando token...');
        const newTokens = await refreshAccessToken();
        response = await makeRequest(newTokens.access_token);
      } else {
        throw apiErr;
      }
    }

    res.json(response.data);
  } catch (err) {
    console.error('Erro ao consultar contatos:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: 'Erro ao consultar contatos do Bling',
      details: err.response?.data || err.message
    });
  }
});

// Endpoint: Obter detalhes completos de um contato específico (Qualquer usuário aprovado)
app.get('/api/contatos/:id', authenticateToken, async (req, res) => {
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

app.post('/api/complements/:blingCustomerId', authenticateToken, async (req, res) => {
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

// Endpoint: Dados de demonstração
app.get('/api/demo-data', (req, res) => {
  res.json({
    data: [
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
        dadosAdicionais: {
          dataNascimento: "2018-05-14",
          sexo: "",
          naturalidade: "São Paulo"
        },
        financeiro: {
          limiteCredito: 25000.00,
          condicaoPagamento: "30/60 DDL",
          categoria: "Instalações Corporativas"
        }
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
        dadosAdicionais: {
          dataNascimento: "1985-11-20",
          sexo: "M",
          naturalidade: "Campinas"
        },
        financeiro: {
          limiteCredito: 5000.00,
          condicaoPagamento: "À Vista / Pix",
          categoria: "Pessoa Física"
        }
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
        dadosAdicionais: {
          dataNascimento: "2010-03-12",
          sexo: "",
          naturalidade: "Rio de Janeiro"
        },
        financeiro: {
          limiteCredito: 80000.00,
          condicaoPagamento: "28/56 DDL",
          categoria: "Grandes Contas"
        }
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Servidor Bling + Supabase Auth iniciado!`);
  console.log(`🌐 Acesse no seu navegador: http://localhost:${PORT}`);
  console.log(`👑 Superadmin padrão: admin@flrinstalacoes.com.br`);
  console.log(`🔑 Senha padrão: AdminFLR@2026`);
  console.log(`======================================================\n`);
});
