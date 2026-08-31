require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase Client conectado com sucesso!');
  } catch (err) {
    console.error('⚠️ Erro ao inicializar Supabase:', err.message);
  }
} else {
  console.warn('⚠️ Credenciais do Supabase não encontradas no .env');
}

// Prefixo oficial para todas as tabelas
const TABLES = {
  PROFILES: 'flrBling_profiles',
  USERS: 'flrBling_users',
  TOKENS: 'flrBling_tokens',
  COMPLEMENTS: 'flrBling_customer_complements',
  PRODUCT_COMPLEMENTS: 'flrBling_product_complements',
  LOGS: 'flrBling_activity_logs',
  KITS: 'flrBling_kits',
  KIT_ITEMS: 'flrBling_kit_items',
  QUOTES: 'flrBling_quotes',
  PRODUCTS: 'flrBling_products',
  PROJECTS: 'flrBling_projects',
  NFE_ENTRIES: 'flrBling_nfe_entries',
  NFE_ITEMS: 'flrBling_nfe_items',
  DE_PARA_RULES: 'flrBling_de_para_rules',
  STOCK_MOVEMENTS: 'flrBling_stock_movements'
};

// Armazenamento em memória defensivo (caso o Supabase ainda esteja em migração)
const memoryKits = [];
const memoryQuotes = [];
const memoryProducts = [];
const memoryProjects = [];
const memoryNfeEntries = [];
const memoryNfeItems = [];
const memoryDeParaRules = [];
const memoryStockMovements = [];

// Permissões Padrão para os Perfis do Sistema
const DEFAULT_PERMISSIONS = {
  superadmin: {
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
  },
  admin: {
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
    users_admin: { manage_users: false, manage_profiles: false },
    bling_settings: { manage_connection: false }
  },
  sales: {
    dashboard: { view: true },
    clients: { view: true, create: true, edit: true, delete: false, complement: true },
    products: { view: true, create: false, edit: false, delete: false },
    services: { view: true, create: false, edit: false, delete: false },
    categories: { view: true, create: false, edit: false, delete: false },
    orders: { view: true, create: true, edit: true, delete: false },
    proposals: { view: true, create: true, edit: true, delete: false },
    sellers: { view: true, create: false, edit: false, delete: false },
    nfe: { view: false, create: false, import_xml: false, delete: false },
    serviceOrders: { view: true, create: false, edit: false, delete: false },
    receivables: { view: false, create: false, edit: false, delete: false },
    payables: { view: false, create: false, edit: false, delete: false },
    stock: { view: true, adjust: false },
    users_admin: { manage_users: false, manage_profiles: false },
    bling_settings: { manage_connection: false }
  },
  finance: {
    dashboard: { view: true },
    clients: { view: true, create: true, edit: true, delete: false, complement: false },
    products: { view: true, create: false, edit: false, delete: false },
    services: { view: true, create: false, edit: false, delete: false },
    categories: { view: false, create: false, edit: false, delete: false },
    orders: { view: true, create: false, edit: false, delete: false },
    proposals: { view: false, create: false, edit: false, delete: false },
    sellers: { view: true, create: false, edit: false, delete: false },
    nfe: { view: true, create: true, import_xml: true, delete: false },
    serviceOrders: { view: false, create: false, edit: false, delete: false },
    receivables: { view: true, create: true, edit: true, delete: true },
    payables: { view: true, create: true, edit: true, delete: true },
    stock: { view: false, adjust: false },
    users_admin: { manage_users: false, manage_profiles: false },
    bling_settings: { manage_connection: false }
  },
  operations: {
    dashboard: { view: true },
    clients: { view: true, create: false, edit: false, delete: false, complement: true },
    products: { view: true, create: true, edit: true, delete: false },
    services: { view: true, create: true, edit: true, delete: false },
    categories: { view: true, create: false, edit: false, delete: false },
    orders: { view: false, create: false, edit: false, delete: false },
    proposals: { view: false, create: false, edit: false, delete: false },
    sellers: { view: false, create: false, edit: false, delete: false },
    nfe: { view: false, create: false, import_xml: false, delete: false },
    serviceOrders: { view: true, create: true, edit: true, delete: false },
    receivables: { view: false, create: false, edit: false, delete: false },
    payables: { view: false, create: false, edit: false, delete: false },
    stock: { view: true, adjust: true },
    users_admin: { manage_users: false, manage_profiles: false },
    bling_settings: { manage_connection: false }
  },
  readonly: {
    dashboard: { view: true },
    clients: { view: true, create: false, edit: false, delete: false, complement: false },
    products: { view: true, create: false, edit: false, delete: false },
    services: { view: true, create: false, edit: false, delete: false },
    categories: { view: true, create: false, edit: false, delete: false },
    orders: { view: true, create: false, edit: false, delete: false },
    proposals: { view: true, create: false, edit: false, delete: false },
    sellers: { view: true, create: false, edit: false, delete: false },
    nfe: { view: true, create: false, import_xml: false, delete: false },
    serviceOrders: { view: true, create: false, edit: false, delete: false },
    receivables: { view: true, create: false, edit: false, delete: false },
    payables: { view: true, create: false, edit: false, delete: false },
    stock: { view: true, adjust: false },
    users_admin: { manage_users: false, manage_profiles: false },
    bling_settings: { manage_connection: false }
  }
};

// Fallback em memória inicial para Perfis
const memoryProfiles = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Super Administrador',
    description: 'Acesso total e irrestrito a todas as páginas, funções, usuários e integração Bling.',
    is_system: true,
    color: '#E11D48',
    permissions: DEFAULT_PERMISSIONS.superadmin,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Administrador Geral',
    description: 'Gestão completa operacional, vendas, fiscal e financeiro (sem configurações OAuth do Bling).',
    is_system: false,
    color: '#1665D8',
    permissions: DEFAULT_PERMISSIONS.admin,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Comercial & Vendas',
    description: 'Acesso a Clientes, Pedidos de Venda, Propostas Comerciais e Catálogo de Produtos/Serviços.',
    is_system: false,
    color: '#00A868',
    permissions: DEFAULT_PERMISSIONS.sales,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Financeiro & Fiscal',
    description: 'Acesso ao módulo financeiro (Contas a Pagar/Receber), Notas Fiscais e Clientes.',
    is_system: false,
    color: '#8B5CF6',
    permissions: DEFAULT_PERMISSIONS.finance,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Operacional & Serviços',
    description: 'Acesso a Ordens de Serviço (OS), Saldos de Estoque, Produtos e Serviços.',
    is_system: false,
    color: '#F59E0B',
    permissions: DEFAULT_PERMISSIONS.operations,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Consulta / Somente Leitura',
    description: 'Acesso apenas para visualização de relatórios e dados cadastrais de todos os módulos.',
    is_system: false,
    color: '#64748B',
    permissions: DEFAULT_PERMISSIONS.readonly,
    created_at: new Date().toISOString()
  }
];

// Fallback em memória para usuários
const memoryUsers = [];

// ==========================================================================
// OPERAÇÕES DE PERFIS DE ACESSO (flrBling_profiles)
// ==========================================================================

async function ensureDefaultProfiles() {
  if (!supabase) return;
  try {
    for (const prof of memoryProfiles) {
      const { data } = await supabase
        .from(TABLES.PROFILES)
        .select('id')
        .eq('name', prof.name)
        .single();

      if (!data) {
        await supabase.from(TABLES.PROFILES).insert(prof);
      }
    }
  } catch (e) {
    // Tabela pode ainda estar sendo criada
  }
}

async function getAllProfiles() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .order('is_system', { ascending: false })
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) return data;
    } catch (e) {
      // fallback
    }
  }
  return memoryProfiles;
}

async function getProfileById(id) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) return data;
    } catch (e) {
      // fallback
    }
  }
  return memoryProfiles.find(p => p.id === id) || null;
}

async function createProfile({ name, description, color, permissions }) {
  if (!name || !name.trim()) {
    throw new Error('O nome do perfil é obrigatório.');
  }

  const cleanName = name.trim();
  const existing = await getAllProfiles();
  if (existing.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
    throw new Error('Já existe um perfil de acesso com este nome.');
  }

  const newProfile = {
    name: cleanName,
    description: description ? description.trim() : '',
    color: color || '#1665D8',
    is_system: false,
    permissions: permissions || DEFAULT_PERMISSIONS.sales,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .insert(newProfile)
        .select('*')
        .single();

      if (!error && data) return data;
    } catch (e) {
      console.warn('Erro ao criar perfil no Supabase, usando memória:', e.message);
    }
  }

  const memProfile = {
    id: 'profile-' + Date.now(),
    ...newProfile
  };
  memoryProfiles.push(memProfile);
  return memProfile;
}

async function updateProfile(id, { name, description, color, permissions }) {
  const profile = await getProfileById(id);
  if (!profile) {
    throw new Error('Perfil de acesso não encontrado.');
  }

  const updates = {
    updated_at: new Date().toISOString()
  };
  if (name && name.trim()) updates.name = name.trim();
  if (description !== undefined) updates.description = description.trim();
  if (color) updates.color = color;
  if (permissions) updates.permissions = permissions;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) return data;
    } catch (e) {
      console.warn('Erro ao atualizar perfil no Supabase:', e.message);
    }
  }

  const idx = memoryProfiles.findIndex(p => p.id === id);
  if (idx !== -1) {
    memoryProfiles[idx] = { ...memoryProfiles[idx], ...updates };
    return memoryProfiles[idx];
  }
  throw new Error('Erro ao atualizar perfil.');
}

async function deleteProfile(id) {
  const profile = await getProfileById(id);
  if (!profile) {
    throw new Error('Perfil não encontrado.');
  }
  if (profile.is_system) {
    throw new Error('Perfis de sistema não podem ser excluídos.');
  }

  // Verifica se há usuários vinculados a este perfil
  const users = await getAllUsers();
  const linked = users.filter(u => u.profile_id === id);
  if (linked.length > 0) {
    throw new Error(`Não é possível excluir este perfil pois existem ${linked.length} usuário(s) vinculado(s) a ele. Reatribua os usuários primeiro.`);
  }

  if (supabase) {
    try {
      await supabase.from(TABLES.PROFILES).delete().eq('id', id);
    } catch (e) {}
  }

  const idx = memoryProfiles.findIndex(p => p.id === id);
  if (idx !== -1) memoryProfiles.splice(idx, 1);
  return { success: true };
}

// ==========================================================================
// OPERAÇÕES DE USUÁRIOS (flrBling_users)
// ==========================================================================

async function ensureSuperadmin() {
  const defaultAdminEmail = (process.env.SUPERADMIN_EMAIL || 'admin@flrinstalacoes.com.br').trim().toLowerCase();
  const defaultAdminPass = process.env.SUPERADMIN_PASSWORD || 'AdminFLR@2026';

  await ensureDefaultProfiles();

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(defaultAdminPass, salt);
    const superadminProfileId = '00000000-0000-0000-0000-000000000001';

    const existing = await findUserByEmail(defaultAdminEmail);
    if (!existing) {
      console.log('👑 Criando superadmin padrão: ' + defaultAdminEmail);

      if (supabase) {
        const { error } = await supabase.from(TABLES.USERS).insert({
          name: 'Super Administrador FLR',
          email: defaultAdminEmail,
          password_hash: hash,
          role: 'superadmin',
          profile_id: superadminProfileId,
          status: 'aprovado',
          phone: '(11) 99999-9999',
          created_at: new Date().toISOString()
        });

        if (error && error.code !== '42P01') {
          console.warn('Aviso ao criar superadmin no Supabase:', error.message);
        }
      }

      // Salva no fallback
      memoryUsers.push({
        id: 'superadmin-root-id',
        name: 'Super Administrador FLR',
        email: defaultAdminEmail,
        password_hash: hash,
        role: 'superadmin',
        profile_id: superadminProfileId,
        status: 'aprovado',
        phone: '(11) 99999-9999',
        created_at: new Date().toISOString()
      });
    } else {
      // Se já existe, atualiza a senha no Supabase para garantir login imediato
      if (supabase) {
        await supabase.from(TABLES.USERS).update({
          password_hash: hash,
          role: 'superadmin',
          profile_id: superadminProfileId,
          status: 'aprovado',
          updated_at: new Date().toISOString()
        }).eq('email', defaultAdminEmail);
      }
      existing.password_hash = hash;
      existing.role = 'superadmin';
      existing.status = 'aprovado';
      existing.profile_id = superadminProfileId;
    }
    console.log(`✅ Superadmin configurado: ${defaultAdminEmail}`);
  } catch (e) {
    console.warn('Aviso ensureSuperadmin:', e.message);
  }
}

async function findUserByEmail(email) {
  const cleanEmail = email.trim().toLowerCase();
  if (supabase) {
    try {
      let userRecord = null;
      try {
        const { data, error } = await supabase
          .from(TABLES.USERS)
          .select(`
            id, name, email, password_hash, role, profile_id, status, phone, avatar_url, created_at, updated_at,
            profile:flrBling_profiles (id, name, description, color, permissions)
          `)
          .eq('email', cleanEmail)
          .single();
        if (!error && data) userRecord = data;
      } catch (e) {}

      if (!userRecord) {
        const { data: rawUser, error: rawErr } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('email', cleanEmail)
          .single();
        if (!rawErr && rawUser) {
          userRecord = rawUser;
          if (rawUser.profile_id) {
            userRecord.profile = await getProfileById(rawUser.profile_id);
          }
        }
      }

      if (userRecord) {
        if (!userRecord.profile) {
          userRecord.profile = userRecord.role === 'superadmin' 
            ? memoryProfiles[0] 
            : (memoryProfiles.find(p => p.id === userRecord.profile_id) || memoryProfiles[2]);
        }
        return userRecord;
      }
    } catch (e) {
      // continua para fallback
    }
  }
  
  const mem = memoryUsers.find(u => u.email.toLowerCase() === cleanEmail);
  if (mem) {
    const prof = memoryProfiles.find(p => p.id === mem.profile_id) || (mem.role === 'superadmin' ? memoryProfiles[0] : memoryProfiles[2]);
    return { ...mem, profile: prof };
  }
  return null;
}

async function findUserById(id) {
  if (supabase) {
    try {
      let userRecord = null;
      try {
        const { data, error } = await supabase
          .from(TABLES.USERS)
          .select(`
            id, name, email, role, profile_id, status, phone, avatar_url, created_at, updated_at,
            profile:flrBling_profiles (id, name, description, color, permissions)
          `)
          .eq('id', id)
          .single();
        if (!error && data) userRecord = data;
      } catch (e) {}

      if (!userRecord) {
        const { data: rawUser, error: rawErr } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('id', id)
          .single();
        if (!rawErr && rawUser) {
          userRecord = rawUser;
          if (rawUser.profile_id) {
            userRecord.profile = await getProfileById(rawUser.profile_id);
          }
        }
      }

      if (userRecord) {
        if (!userRecord.profile) {
          userRecord.profile = userRecord.role === 'superadmin' 
            ? memoryProfiles[0] 
            : (memoryProfiles.find(p => p.id === userRecord.profile_id) || memoryProfiles[2]);
        }
        return userRecord;
      }
    } catch (e) {
      // continua para fallback
    }
  }
  const mem = memoryUsers.find(u => u.id === id);
  if (mem) {
    const { password_hash, ...rest } = mem;
    const prof = memoryProfiles.find(p => p.id === rest.profile_id) || (rest.role === 'superadmin' ? memoryProfiles[0] : memoryProfiles[2]);
    return { ...rest, profile: prof };
  }
  return null;
}

async function createUser({ name, email, password, phone, role = 'user', profile_id = null, status = 'pendente', avatar_url = null }) {
  const cleanEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    throw new Error('Já existe um usuário cadastrado com este e-mail.');
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // Se nenhum perfil foi selecionado, atribui perfil padrão de Vendas / Comercial
  let assignedProfileId = profile_id;
  if (!assignedProfileId) {
    const defaultProf = memoryProfiles.find(p => p.name === 'Comercial & Vendas') || memoryProfiles[2];
    assignedProfileId = defaultProf.id;
  }

  const newUser = {
    name: name.trim(),
    email: cleanEmail,
    password_hash,
    role: role || 'user',
    profile_id: assignedProfileId,
    status: status || 'pendente',
    phone: phone ? phone.trim() : null,
    avatar_url: avatar_url ? avatar_url.trim() : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert(newUser)
        .select('*')
        .single();

      if (!error && data) {
        data.profile = await getProfileById(assignedProfileId);
        return data;
      }
    } catch (e) {
      console.warn('Erro ao salvar no Supabase, usando memória:', e.message);
    }
  }

  const memoryCreated = {
    id: 'user-' + Date.now(),
    ...newUser
  };
  memoryUsers.push(memoryCreated);

  const { password_hash: _, ...safeUser } = memoryCreated;
  const prof = memoryProfiles.find(p => p.id === assignedProfileId) || memoryProfiles[2];
  return { ...safeUser, profile: prof };
}

async function getAllUsers() {
  if (supabase) {
    try {
      let list = null;
      try {
        const { data, error } = await supabase
          .from(TABLES.USERS)
          .select(`
            id, name, email, role, profile_id, status, phone, avatar_url, created_at, updated_at,
            profile:flrBling_profiles (id, name, description, color, permissions)
          `)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) list = data;
      } catch (e) {}

      if (!list) {
        const { data: rawList, error: rawErr } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .order('created_at', { ascending: false });
        if (!rawErr && rawList && rawList.length > 0) {
          list = rawList;
        }
      }

      if (list && list.length > 0) {
        return list.map(u => {
          if (!u.profile) {
            u.profile = u.role === 'superadmin' 
              ? memoryProfiles[0] 
              : (memoryProfiles.find(p => p.id === u.profile_id) || memoryProfiles[2]);
          }
          return u;
        });
      }
    } catch (e) {
      // fallback
    }
  }
  return memoryUsers.map(({ password_hash, ...u }) => {
    const prof = memoryProfiles.find(p => p.id === u.profile_id) || (u.role === 'superadmin' ? memoryProfiles[0] : memoryProfiles[2]);
    return { ...u, profile: prof };
  });
}

async function updateUserStatus(userId, status) {
  if (!['aprovado', 'pendente', 'bloqueado'].includes(status)) {
    throw new Error('Status inválido. Use aprovado, pendente ou bloqueado.');
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select(`
          id, name, email, role, profile_id, status, phone, created_at,
          profile:flrBling_profiles (id, name, description, color, permissions)
        `)
        .single();

      if (!error && data) return data;
    } catch (e) {
      // fallback
    }
  }

  const mem = memoryUsers.find(u => u.id === userId);
  if (mem) {
    mem.status = status;
    mem.updated_at = new Date().toISOString();
    const { password_hash, ...safe } = mem;
    const prof = memoryProfiles.find(p => p.id === safe.profile_id) || memoryProfiles[2];
    return { ...safe, profile: prof };
  }
  throw new Error('Usuário não encontrado.');
}

async function updateUserProfile(userId, profileId) {
  const profile = await getProfileById(profileId);
  if (!profile) {
    throw new Error('Perfil de acesso selecionado não existe.');
  }

  const isSuperadminProfile = profile.is_system && profile.name === 'Super Administrador';
  const newRole = isSuperadminProfile ? 'superadmin' : 'user';

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({ 
          profile_id: profileId,
          role: newRole,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select(`
          id, name, email, role, profile_id, status, phone, created_at,
          profile:flrBling_profiles (id, name, description, color, permissions)
        `)
        .single();

      if (!error && data) return data;
    } catch (e) {
      // fallback
    }
  }

  const mem = memoryUsers.find(u => u.id === userId);
  if (mem) {
    mem.profile_id = profileId;
    mem.role = newRole;
    mem.updated_at = new Date().toISOString();
    const { password_hash, ...safe } = mem;
    return { ...safe, profile };
  }
  throw new Error('Usuário não encontrado.');
}

async function updateUser(userId, { name, email, phone, profile_id, status, password, avatar_url }) {
  const user = await findUserById(userId);
  if (!user) throw new Error('Usuário não encontrado.');

  const updates = {
    updated_at: new Date().toISOString()
  };
  if (name && name.trim()) updates.name = name.trim();
  if (email && email.trim()) updates.email = email.trim().toLowerCase();
  if (phone !== undefined) updates.phone = phone ? phone.trim() : null;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url ? avatar_url.trim() : null;
  if (status) updates.status = status;
  if (profile_id) {
    updates.profile_id = profile_id;
    const prof = await getProfileById(profile_id);
    if (prof && prof.is_system && prof.name === 'Super Administrador') {
      updates.role = 'superadmin';
    } else {
      updates.role = 'user';
    }
  }
  if (password && password.trim().length >= 6) {
    const salt = await bcrypt.genSalt(10);
    updates.password_hash = await bcrypt.hash(password.trim(), salt);
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(updates)
        .eq('id', userId)
        .select(`
          id, name, email, role, profile_id, status, phone, avatar_url, created_at, updated_at,
          profile:flrBling_profiles (id, name, description, color, permissions)
        `)
        .single();

      if (!error && data) return data;
    } catch (e) {
      // fallback
    }
  }

  const memIdx = memoryUsers.findIndex(u => u.id === userId);
  if (memIdx !== -1) {
    memoryUsers[memIdx] = { ...memoryUsers[memIdx], ...updates };
    const { password_hash, ...safe } = memoryUsers[memIdx];
    const prof = memoryProfiles.find(p => p.id === safe.profile_id) || memoryProfiles[2];
    return { ...safe, profile: prof };
  }
  throw new Error('Erro ao atualizar usuário.');
}

async function updateUserRole(userId, role) {
  if (!['superadmin', 'admin', 'user'].includes(role)) {
    throw new Error('Perfil inválido. Use superadmin, admin ou user.');
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('id, name, email, role, profile_id, status, phone, created_at')
        .single();

      if (!error && data) return data;
    } catch (e) {
      // fallback
    }
  }

  const mem = memoryUsers.find(u => u.id === userId);
  if (mem) {
    mem.role = role;
    mem.updated_at = new Date().toISOString();
    const { password_hash, ...safe } = mem;
    return safe;
  }
  throw new Error('Usuário não encontrado.');
}

async function deleteUser(userId) {
  if (supabase) {
    try {
      await supabase.from(TABLES.USERS).delete().eq('id', userId);
    } catch (e) {}
  }
  const idx = memoryUsers.findIndex(u => u.id === userId);
  if (idx !== -1) memoryUsers.splice(idx, 1);
  return { success: true };
}

// ==========================================================================
// OPERAÇÕES DE TOKENS DO BLING (flrBling_tokens)
// ==========================================================================

async function getSupabaseTokens() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLES.TOKENS)
      .select('*')
      .eq('id', 'bling_primary')
      .single();

    if (error) return null;
    return data;
  } catch (e) {
    return null;
  }
}

async function saveSupabaseTokens(tokenData) {
  if (!supabase) return null;
  try {
    const payload = {
      id: 'bling_primary',
      provider: 'bling',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in || 21600,
      expires_at: tokenData.expires_at || (tokenData.expires_in ? new Date(Date.now() + (tokenData.expires_in - 60) * 1000).toISOString() : null),
      saved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(TABLES.TOKENS)
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Erro saveSupabaseTokens:', e.message);
    return null;
  }
}

// ==========================================================================
// COMPLEMENTOS & LOGS (flrBling_customer_complements / flrBling_activity_logs)
// ==========================================================================

async function getCustomerComplement(blingCustomerId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLES.COMPLEMENTS)
      .select('*')
      .eq('bling_customer_id', Number(blingCustomerId))
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Aviso getCustomerComplement:', error.message);
    }
    return data || null;
  } catch (e) {
    return null;
  }
}

async function saveCustomerComplement(complementData) {
  if (!supabase) return null;
  try {
    const payload = {
      bling_customer_id: Number(complementData.bling_customer_id),
      customer_code: complementData.customer_code || null,
      customer_name: complementData.customer_name || null,
      internal_notes: complementData.internal_notes || '',
      tags: complementData.tags || [],
      priority: complementData.priority || 'normal',
      internal_status: complementData.internal_status || 'ativo',
      responsible_manager: complementData.responsible_manager || null,
      custom_fields: complementData.custom_fields || {},
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(TABLES.COMPLEMENTS)
      .upsert(payload, { onConflict: 'bling_customer_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Erro saveCustomerComplement:', e.message);
    throw e;
  }
}

async function getProductComplement(blingProductId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCT_COMPLEMENTS)
      .select('*')
      .eq('bling_product_id', Number(blingProductId))
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Aviso getProductComplement:', error.message);
    }
    return data || null;
  } catch (e) {
    return null;
  }
}

async function getAllProductComplements() {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCT_COMPLEMENTS)
      .select('*');

    if (error) {
      console.warn('Aviso getAllProductComplements:', error.message);
      return {};
    }

    const map = {};
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.bling_product_id) {
          map[String(item.bling_product_id)] = item;
        }
      });
    }
    return map;
  } catch (e) {
    return {};
  }
}

async function saveProductComplement(complementData) {
  if (!supabase) return null;
  try {
    const payload = {
      bling_product_id: Number(complementData.bling_product_id),
      product_code: complementData.product_code || null,
      product_name: complementData.product_name || null,
      imagem_url: complementData.imagem_url || null,
      preco_custo: complementData.preco_custo ? parseFloat(complementData.preco_custo) : 0,
      categoria: complementData.categoria || null,
      estoque_minimo: complementData.estoque_minimo ? parseInt(complementData.estoque_minimo, 10) : 0,
      internal_notes: complementData.internal_notes || '',
      tags: complementData.tags || [],
      custom_fields: complementData.custom_fields || {},
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(TABLES.PRODUCT_COMPLEMENTS)
      .upsert(payload, { onConflict: 'bling_product_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Erro saveProductComplement:', e.message);
    return null;
  }
}

async function logActivity(actionType, blingCustomerId = null, description = '', metadata = {}, userId = null) {
  if (!supabase) return;
  try {
    await supabase.from(TABLES.LOGS).insert({
      action_type: actionType,
      bling_customer_id: blingCustomerId ? Number(blingCustomerId) : null,
      user_id: userId || null,
      description,
      metadata,
      created_at: new Date().toISOString()
    });
  } catch (e) {}
}

// ==========================================================================
// FUNÇÕES: GESTÃO DE KITS DE PRODUTOS
// ==========================================================================

async function getAllKits({ apenasAtivos = false } = {}) {
  if (supabase) {
    try {
      let query = supabase
        .from(TABLES.KITS)
        .select(`*, itens:${TABLES.KIT_ITEMS}(*)`)
        .order('created_at', { ascending: false });
      if (apenasAtivos) query = query.eq('ativo', true);
      const { data, error } = await query;
      if (!error && data) return data;
    } catch (err) {
      console.warn('Fallback memória ao buscar kits:', err.message);
    }
  }
  let list = memoryKits;
  if (apenasAtivos) list = list.filter(k => k.ativo !== false);
  return list;
}

async function getKitById(id) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.KITS)
        .select(`*, itens:${TABLES.KIT_ITEMS}(*)`)
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Fallback memória ao buscar kit:', err.message);
    }
  }
  return memoryKits.find(k => k.id === id) || null;
}

async function saveKit(kitData, userId = null) {
  const { id, itens = [], ...fields } = kitData;
  const now = new Date().toISOString();
  const kitPayload = { ...fields, updated_at: now };
  if (!id) {
    kitPayload.created_by = userId;
    kitPayload.created_at = now;
  }

  if (supabase) {
    try {
      let kitId = id;
      if (id) {
        const { data, error } = await supabase
          .from(TABLES.KITS)
          .update(kitPayload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        kitId = data.id;
      } else {
        const { data, error } = await supabase
          .from(TABLES.KITS)
          .insert(kitPayload)
          .select()
          .single();
        if (error) throw error;
        kitId = data.id;
      }

      await supabase.from(TABLES.KIT_ITEMS).delete().eq('kit_id', kitId);
      if (itens.length > 0) {
        const itemsToInsert = itens.map((it, idx) => ({
          kit_id: kitId,
          bling_product_id: it.bling_product_id || null,
          product_code: it.product_code || '',
          product_name: it.product_name || '',
          product_unit: it.product_unit || 'UN',
          quantity: parseFloat(it.quantity) || 1,
          unit_price: parseFloat(it.unit_price) || 0,
          imagem_url: it.imagem_url || null,
          sort_order: idx
        }));
        await supabase.from(TABLES.KIT_ITEMS).insert(itemsToInsert);
      }
      return getKitById(kitId);
    } catch (err) {
      console.warn('Fallback memória ao salvar kit:', err.message);
    }
  }

  // Fallback em memória
  const generatedId = id || `kit-${Date.now()}`;
  const savedKit = {
    id: generatedId,
    ...kitPayload,
    itens: itens.map((it, idx) => ({
      id: `ki-${Date.now()}-${idx}`,
      kit_id: generatedId,
      ...it
    }))
  };
  const idx = memoryKits.findIndex(k => k.id === generatedId);
  if (idx >= 0) memoryKits[idx] = savedKit;
  else memoryKits.unshift(savedKit);
  return savedKit;
}

async function deleteKit(id) {
  if (supabase) {
    try {
      await supabase
        .from(TABLES.KITS)
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (e) {}
  }
  const k = memoryKits.find(k => k.id === id);
  if (k) k.ativo = false;
  return true;
}

// ==========================================================================
// FUNÇÕES: GESTÃO DE ORÇAMENTOS
// ==========================================================================

async function generateQuoteNumber() {
  const year = new Date().getFullYear();
  const prefix = `ORC-${year}-`;
  if (supabase) {
    try {
      const { data } = await supabase
        .from(TABLES.QUOTES)
        .select('numero')
        .ilike('numero', `${prefix}%`)
        .order('numero', { ascending: false })
        .limit(1);
      let seq = 1;
      if (data && data.length > 0) {
        const lastNum = parseInt(data[0].numero.replace(prefix, ''), 10);
        if (!isNaN(lastNum)) seq = lastNum + 1;
      }
      return `${prefix}${String(seq).padStart(3, '0')}`;
    } catch {}
  }
  return `${prefix}${String(memoryQuotes.length + 1).padStart(3, '0')}`;
}

async function getAllQuotes({ status, contactId, limit = 100, offset = 0 } = {}) {
  if (supabase) {
    try {
      let query = supabase
        .from(TABLES.QUOTES)
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (status) query = query.eq('status', status);
      if (contactId) query = query.eq('bling_contact_id', contactId);
      const { data, error } = await query;
      if (!error && data) return data;
    } catch (err) {
      console.warn('Fallback memória ao buscar orçamentos:', err.message);
    }
  }
  let list = memoryQuotes;
  if (status) list = list.filter(q => q.status === status);
  if (contactId) list = list.filter(q => q.bling_contact_id === contactId);
  return list.slice(offset, offset + limit);
}

async function getQuoteById(id) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.QUOTES)
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Fallback memória ao buscar orçamento:', err.message);
    }
  }
  return memoryQuotes.find(q => q.id === id) || null;
}

async function saveQuote(quoteData, userId = null) {
  const now = new Date().toISOString();
  const payload = { ...quoteData, updated_at: now };
  if (!payload.id) {
    payload.created_by = userId;
    payload.created_at = now;
    if (!payload.numero) payload.numero = await generateQuoteNumber();
  }

  if (supabase) {
    try {
      if (!payload.id) {
        const { data, error } = await supabase
          .from(TABLES.QUOTES)
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { id, ...updateFields } = payload;
        const { data, error } = await supabase
          .from(TABLES.QUOTES)
          .update(updateFields)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (err) {
      console.warn('Fallback memória ao salvar orçamento:', err.message);
    }
  }

  const generatedId = payload.id || `quote-${Date.now()}`;
  const saved = { ...payload, id: generatedId };
  const idx = memoryQuotes.findIndex(q => q.id === generatedId);
  if (idx >= 0) memoryQuotes[idx] = saved;
  else memoryQuotes.unshift(saved);
  return saved;
}

async function updateQuote(id, fields) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.QUOTES)
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {}
  }
  const q = memoryQuotes.find(q => q.id === id);
  if (q) Object.assign(q, fields, { updated_at: new Date().toISOString() });
  return q;
}

async function updateQuoteBlingSync(id, { blingPedidoId, blingPropostaId, tipo }) {
  const update = {
    bling_exportado_em: new Date().toISOString(),
    bling_export_tipo: tipo,
    updated_at: new Date().toISOString()
  };
  if (blingPedidoId) update.bling_pedido_id = blingPedidoId;
  if (blingPropostaId) update.bling_proposta_id = blingPropostaId;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.QUOTES)
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {}
  }
  const q = memoryQuotes.find(q => q.id === id);
  if (q) Object.assign(q, update);
  return q;
}

// ==========================================================================
// FUNÇÕES: CATÁLOGO LOCAL DE PRODUTOS & MATERIAIS
// ==========================================================================

async function getAllProducts({ search, onlyLocal = false, onlyBling = false, limit = 100, offset = 0 } = {}) {
  if (supabase) {
    try {
      let query = supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true })
        .range(offset, offset + limit - 1);
      if (search) {
        query = query.or(`nome.ilike.%${search}%,codigo.ilike.%${search}%,ncm.ilike.%${search}%`);
      }
      if (onlyLocal) query = query.is('bling_id', null);
      if (onlyBling) query = query.not('bling_id', 'is', null);
      const { data, error } = await query;
      if (!error && data) return data;
    } catch (err) {
      console.warn('Fallback memória ao buscar produtos:', err.message);
    }
  }

  let list = memoryProducts.filter(p => p.ativo !== false);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(p => (p.nome || '').toLowerCase().includes(q) || (p.codigo || '').toLowerCase().includes(q));
  }
  if (onlyLocal) list = list.filter(p => !p.bling_id);
  if (onlyBling) list = list.filter(p => !!p.bling_id);
  return list.slice(offset, offset + limit);
}

async function getProductById(id) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch (e) {}
  }
  return memoryProducts.find(p => p.id === id || String(p.bling_id) === String(id)) || null;
}

async function findProductByCode(codigo) {
  if (!codigo) return null;
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('codigo', codigo.trim())
        .single();
      if (!error && data) return data;
    } catch (e) {}
  }
  return memoryProducts.find(p => (p.codigo || '').trim().toLowerCase() === codigo.trim().toLowerCase()) || null;
}

async function findProductByBlingId(blingId) {
  if (!blingId) return null;
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('bling_id', blingId)
        .single();
      if (!error && data) return data;
    } catch (e) {}
  }
  return memoryProducts.find(p => String(p.bling_id) === String(blingId)) || null;
}

async function saveProduct(productData, userId = null) {
  const now = new Date().toISOString();
  const payload = {
    ...productData,
    sincronizado_bling: productData.sincronizado_bling === true, // Default false conforme regra
    updated_at: now
  };
  if (!payload.id) {
    payload.created_by = userId;
    payload.created_at = now;
  }

  // Prevenção de duplicatas por código
  if (!payload.id && payload.codigo) {
    const existing = await findProductByCode(payload.codigo);
    if (existing) payload.id = existing.id;
  }

  if (supabase) {
    try {
      if (!payload.id) {
        const { data, error } = await supabase
          .from(TABLES.PRODUCTS)
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { id, ...updateFields } = payload;
        const { data, error } = await supabase
          .from(TABLES.PRODUCTS)
          .update(updateFields)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (err) {
      console.warn('Fallback memória ao salvar produto:', err.message);
    }
  }

  const generatedId = payload.id || `prod-${Date.now()}`;
  const saved = { ...payload, id: generatedId };
  const idx = memoryProducts.findIndex(p => p.id === generatedId);
  if (idx >= 0) memoryProducts[idx] = saved;
  else memoryProducts.unshift(saved);
  return saved;
}

// ==========================================================================
// FUNÇÕES: PROJETOS / OBRAS / CENTROS DE CUSTO & VERBA
// ==========================================================================

async function getAllProjects({ status } = {}) {
  if (supabase) {
    try {
      let query = supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (!error && data) return data;
    } catch (err) {
      console.warn('Fallback memória ao buscar projetos:', err.message);
    }
  }
  let list = memoryProjects;
  if (status) list = list.filter(p => p.status === status);
  return list;
}

async function getProjectById(id) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch (e) {}
  }
  return memoryProjects.find(p => p.id === id) || null;
}

async function saveProject(projectData, userId = null) {
  const now = new Date().toISOString();
  const payload = { ...projectData, updated_at: now };
  if (!payload.id) {
    payload.created_by = userId;
    payload.created_at = now;
    if (!payload.codigo) payload.codigo = `PRJ-${new Date().getFullYear()}-${String(memoryProjects.length + 1).padStart(3, '0')}`;
  }

  if (supabase) {
    try {
      if (!payload.id) {
        const { data, error } = await supabase
          .from(TABLES.PROJECTS)
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { id, ...updateFields } = payload;
        const { data, error } = await supabase
          .from(TABLES.PROJECTS)
          .update(updateFields)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (err) {
      console.warn('Fallback memória ao salvar projeto:', err.message);
    }
  }

  const generatedId = payload.id || `proj-${Date.now()}`;
  const saved = { ...payload, id: generatedId };
  const idx = memoryProjects.findIndex(p => p.id === generatedId);
  if (idx >= 0) memoryProjects[idx] = saved;
  else memoryProjects.unshift(saved);
  return saved;
}

// Extrato de Material e Verba por Projeto (Calculado APENAS pelos itens vinculados à obra)
async function getProjectMaterialExtract(projectId) {
  const project = await getProjectById(projectId);
  if (!project) throw new Error('Projeto não encontrado');

  let itemsLinked = [];
  let movements = [];

  if (supabase) {
    try {
      const { data: itData } = await supabase
        .from(TABLES.NFE_ITEMS)
        .select(`
          *,
          entry:flrBling_nfe_entries (numero_nota, serie, fornecedor_nome, fornecedor_cnpj, data_emissao, data_entrada)
        `)
        .eq('projeto_id', projectId);
      itemsLinked = itData || [];

      const { data: movData } = await supabase
        .from(TABLES.STOCK_MOVEMENTS)
        .select(`*, produto:flrBling_products(nome, codigo, unidade)`)
        .eq('projeto_id', projectId)
        .order('data_movimento', { ascending: false });
      movements = movData || [];
    } catch (e) {}
  } else {
    itemsLinked = memoryNfeItems.filter(i => i.projeto_id === projectId);
    movements = memoryStockMovements.filter(m => m.projeto_id === projectId);
  }

  // Soma APENAS os itens vinculados a este projeto específico
  const totalGastoMaterial = itemsLinked.reduce((s, it) => s + (parseFloat(it.valor_total) || 0), 0);
  const verbaOrcada = parseFloat(project.verba_material_orcada) || 0;
  const saldoVerbaRestante = verbaOrcada - totalGastoMaterial;
  const percentualConsumido = verbaOrcada > 0 ? (totalGastoMaterial / verbaOrcada) * 100 : 0;

  // Atualiza cache de verba_material_gasta no projeto
  if (parseFloat(project.verba_material_gasta) !== totalGastoMaterial) {
    await saveProject({ id: projectId, verba_material_gasta: totalGastoMaterial });
  }

  return {
    project,
    verbaOrcada,
    totalGastoMaterial,
    saldoVerbaRestante,
    percentualConsumido,
    itensComprados: itemsLinked,
    movimentacoesRetiradas: movements
  };
}

// ==========================================================================
// FUNÇÕES: ENTRADA DE NOTAS FISCAIS (NF-e) & DE-PARA
// ==========================================================================

async function findDeParaRule(fornecedorCnpj, codigoFornecedor) {
  if (!fornecedorCnpj || !codigoFornecedor) return null;
  const cleanCnpj = fornecedorCnpj.replace(/\D/g, '');
  const cleanCode = codigoFornecedor.trim();

  if (supabase) {
    try {
      const { data } = await supabase
        .from(TABLES.DE_PARA_RULES)
        .select(`*, produto:flrBling_products(*)`)
        .eq('fornecedor_cnpj', cleanCnpj)
        .eq('codigo_fornecedor', cleanCode)
        .single();
      if (data) return data;
    } catch (e) {}
  }

  return memoryDeParaRules.find(r => r.fornecedor_cnpj === cleanCnpj && r.codigo_fornecedor === cleanCode) || null;
}

async function saveDeParaRule(fornecedorCnpj, codigoFornecedor, produtoId) {
  if (!fornecedorCnpj || !codigoFornecedor || !produtoId) return null;
  const cleanCnpj = fornecedorCnpj.replace(/\D/g, '');
  const cleanCode = codigoFornecedor.trim();
  const payload = {
    fornecedor_cnpj: cleanCnpj,
    codigo_fornecedor: cleanCode,
    produto_id: produtoId,
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.DE_PARA_RULES)
        .upsert(payload, { onConflict: 'fornecedor_cnpj,codigo_fornecedor' })
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {}
  }

  const idx = memoryDeParaRules.findIndex(r => r.fornecedor_cnpj === cleanCnpj && r.codigo_fornecedor === cleanCode);
  if (idx >= 0) memoryDeParaRules[idx] = payload;
  else memoryDeParaRules.push(payload);
  return payload;
}

async function getAllNfeEntries({ status, projetoId, limit = 100, offset = 0 } = {}) {
  if (supabase) {
    try {
      let query = supabase
        .from(TABLES.NFE_ENTRIES)
        .select(`
          *,
          projeto:flrBling_projects (id, nome, codigo),
          itens:flrBling_nfe_items (*, produto:flrBling_products(id, nome, codigo, unidade))
        `)
        .order('data_emissao', { ascending: false })
        .range(offset, offset + limit - 1);
      if (status) query = query.eq('status', status);
      if (projetoId) query = query.eq('projeto_id', projetoId);
      const { data, error } = await query;
      if (!error && data) return data;
    } catch (err) {
      console.warn('Fallback memória ao buscar NF-e de entrada:', err.message);
    }
  }

  let list = memoryNfeEntries;
  if (status) list = list.filter(n => n.status === status);
  if (projetoId) list = list.filter(n => n.projeto_id === projetoId);
  return list.slice(offset, offset + limit);
}

async function getNfeEntryById(id) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.NFE_ENTRIES)
        .select(`
          *,
          projeto:flrBling_projects (id, nome, codigo),
          itens:flrBling_nfe_items (*, produto:flrBling_products(id, nome, codigo, unidade))
        `)
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch (e) {}
  }
  return memoryNfeEntries.find(n => n.id === id) || null;
}

// Salva a NF-e de entrada completa: cabeçalho + itens + movimentação de estoque + regras de De-Para
async function saveNfeEntryWithItems(entryData, items = [], userId = null) {
  const now = new Date().toISOString();
  const cleanCnpj = (entryData.fornecedor_cnpj || '').replace(/\D/g, '');

  const entryPayload = {
    ...entryData,
    fornecedor_cnpj: cleanCnpj,
    updated_at: now
  };
  if (!entryPayload.id) {
    entryPayload.created_by = userId;
    entryPayload.created_at = now;
  }

  let entryId = entryPayload.id;

  if (supabase) {
    try {
      if (!entryId) {
        const { data, error } = await supabase
          .from(TABLES.NFE_ENTRIES)
          .insert(entryPayload)
          .select()
          .single();
        if (error) throw error;
        entryId = data.id;
      } else {
        const { id, ...updateFields } = entryPayload;
        await supabase.from(TABLES.NFE_ENTRIES).update(updateFields).eq('id', entryId);
      }

      // Deletar itens anteriores se houver e reinserir
      await supabase.from(TABLES.NFE_ITEMS).delete().eq('nfe_entry_id', entryId);

      const itemsToInsert = [];
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        let produtoId = it.produto_id || null;

        // Se o usuário solicitou cadastrar como novo produto local
        if (!produtoId && it.criar_novo_produto) {
          const newProd = await saveProduct({
            codigo: it.codigo_fornecedor || `PRD-${Date.now()}-${idx}`,
            nome: it.descricao_fornecedor,
            unidade: it.unidade_fornecedor || 'UN',
            preco_custo: parseFloat(it.valor_unitario) || 0,
            preco_venda: (parseFloat(it.valor_unitario) || 0) * 1.4, // margem padrão
            ncm: it.ncm || null,
            sincronizado_bling: false // Default FALSE
          }, userId);
          produtoId = newProd.id;
        }

        // Salva regra de De-Para automaticamente se houver produto vinculado
        if (produtoId && it.codigo_fornecedor && cleanCnpj) {
          await saveDeParaRule(cleanCnpj, it.codigo_fornecedor, produtoId);
        }

        const itemObj = {
          nfe_entry_id: entryId,
          numero_item: idx + 1,
          codigo_fornecedor: it.codigo_fornecedor || '',
          descricao_fornecedor: it.descricao_fornecedor || '',
          ncm: it.ncm || '',
          cfop: it.cfop || '',
          unidade_fornecedor: it.unidade_fornecedor || 'UN',
          quantidade: parseFloat(it.quantidade) || 1,
          valor_unitario: parseFloat(it.valor_unitario) || 0,
          valor_total: parseFloat(it.valor_total) || (parseFloat(it.quantidade) * parseFloat(it.valor_unitario)),
          produto_id: produtoId,
          bling_product_id: it.bling_product_id || null,
          destino_estoque: it.destino_estoque || entryPayload.destino_estoque_padrao || 'flr',
          projeto_id: it.projeto_id || entryPayload.projeto_id || null
        };
        itemsToInsert.push(itemObj);

        // Movimentação de estoque da entrada da nota
        if (produtoId) {
          await registerStockMovement({
            produto_id: produtoId,
            tipo: 'entrada_nfe',
            quantidade: parseFloat(it.quantidade) || 1,
            destino: itemObj.destino_estoque,
            projeto_id: itemObj.projeto_id,
            nfe_entry_id: entryId,
            observacoes: `Entrada NF-e #${entryPayload.numero_nota} (${entryPayload.fornecedor_nome})`
          }, userId);
        }
      }

      if (itemsToInsert.length > 0) {
        await supabase.from(TABLES.NFE_ITEMS).insert(itemsToInsert);
      }

      // Recalcular verba gasta nos projetos afetados
      const distinctProjects = [...new Set(itemsToInsert.map(i => i.projeto_id).filter(Boolean))];
      for (const pId of distinctProjects) {
        await getProjectMaterialExtract(pId);
      }

      return getNfeEntryById(entryId);
    } catch (err) {
      console.warn('Fallback memória ao salvar NF-e:', err.message);
    }
  }

  // Memory fallback
  const generatedId = entryId || `nfe-${Date.now()}`;
  const savedEntry = {
    ...entryPayload,
    id: generatedId,
    itens: items.map((it, idx) => ({ ...it, id: `nfei-${Date.now()}-${idx}`, nfe_entry_id: generatedId }))
  };
  const idx = memoryNfeEntries.findIndex(n => n.id === generatedId);
  if (idx >= 0) memoryNfeEntries[idx] = savedEntry;
  else memoryNfeEntries.unshift(savedEntry);
  return savedEntry;
}

// ==========================================================================
// FUNÇÕES: MOVIMENTAÇÕES DE ESTOQUE & RASTREABILIDADE
// ==========================================================================

async function registerStockMovement(movementData, userId = null) {
  const now = new Date().toISOString();
  const payload = {
    ...movementData,
    quantidade: parseFloat(movementData.quantidade) || 0,
    created_by: userId,
    created_at: now
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.STOCK_MOVEMENTS)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      // Se for entrada ou saída do Almoxarifado FLR, atualiza o saldo físico do produto
      if (payload.destino === 'flr' || payload.destino === 'ambos') {
        const prod = await getProductById(payload.produto_id);
        if (prod) {
          const saldoAtual = parseFloat(prod.estoque_atual) || 0;
          let novoSaldo = saldoAtual;
          if (payload.tipo === 'entrada_nfe' || payload.tipo === 'devolucao') {
            novoSaldo += payload.quantidade;
          } else if (payload.tipo === 'saida_producao' || payload.tipo === 'ajuste_negativo') {
            novoSaldo = Math.max(0, saldoAtual - payload.quantidade);
          }
          await supabase.from(TABLES.PRODUCTS).update({ estoque_atual: novoSaldo, updated_at: now }).eq('id', prod.id);
        }
      }
      return data;
    } catch (e) {
      console.warn('Fallback memória ao registrar movimento estoque:', e.message);
    }
  }

  const generatedId = `mov-${Date.now()}`;
  const saved = { ...payload, id: generatedId };
  memoryStockMovements.unshift(saved);
  return saved;
}

async function getStockMovements({ produtoId, projetoId, destino, limit = 100 } = {}) {
  if (supabase) {
    try {
      let query = supabase
        .from(TABLES.STOCK_MOVEMENTS)
        .select(`
          *,
          produto:flrBling_products(id, nome, codigo, unidade),
          projeto:flrBling_projects(id, nome, codigo),
          nfe:flrBling_nfe_entries(id, numero_nota, fornecedor_nome)
        `)
        .order('data_movimento', { ascending: false })
        .limit(limit);
      if (produtoId) query = query.eq('produto_id', produtoId);
      if (projetoId) query = query.eq('projeto_id', projetoId);
      if (destino) query = query.eq('destino', destino);
      const { data, error } = await query;
      if (!error && data) return data;
    } catch (e) {}
  }

  let list = memoryStockMovements;
  if (produtoId) list = list.filter(m => m.produto_id === produtoId);
  if (projetoId) list = list.filter(m => m.projeto_id === projetoId);
  if (destino) list = list.filter(m => m.destino === destino);
  return list.slice(0, limit);
}

// ==========================================================================
// EXPORTS
// ==========================================================================

module.exports = {
  supabase,
  TABLES,
  DEFAULT_PERMISSIONS,
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
};
