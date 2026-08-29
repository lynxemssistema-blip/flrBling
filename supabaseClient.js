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
  QUOTES: 'flrBling_quotes'
};

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
  generateQuoteNumber
};

// ==========================================================================
// FUNÇÕES: GESTÃO DE KITS DE PRODUTOS
// ==========================================================================

async function getAllKits({ apenasAtivos = false } = {}) {
  if (!supabase) return [];
  try {
    let query = supabase
      .from(TABLES.KITS)
      .select(`*, itens:${TABLES.KIT_ITEMS}(*)`)
      .order('created_at', { ascending: false });
    if (apenasAtivos) query = query.eq('ativo', true);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar kits:', err.message);
    return [];
  }
}

async function getKitById(id) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLES.KITS)
      .select(`*, itens:${TABLES.KIT_ITEMS}(*)`)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Erro ao buscar kit:', err.message);
    return null;
  }
}

async function saveKit(kitData, userId = null) {
  if (!supabase) throw new Error('Supabase não disponível');
  const { id, itens = [], ...fields } = kitData;
  const now = new Date().toISOString();

  // Upsert no cabeçalho do kit
  const kitPayload = { ...fields, updated_at: now };
  if (!id) {
    kitPayload.created_by = userId;
    kitPayload.created_at = now;
  }

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

  // Substituir todos os itens (delete + insert)
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
    const { error: itemsErr } = await supabase.from(TABLES.KIT_ITEMS).insert(itemsToInsert);
    if (itemsErr) throw itemsErr;
  }

  return getKitById(kitId);
}

async function deleteKit(id) {
  if (!supabase) throw new Error('Supabase não disponível');
  const { error } = await supabase
    .from(TABLES.KITS)
    .update({ ativo: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  return true;
}

// ==========================================================================
// FUNÇÕES: GESTÃO DE ORÇAMENTOS
// ==========================================================================

async function generateQuoteNumber() {
  if (!supabase) return `ORC-${Date.now()}`;
  try {
    const year = new Date().getFullYear();
    const prefix = `ORC-${year}-`;
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
  } catch {
    return `ORC-${Date.now()}`;
  }
}

async function getAllQuotes({ status, contactId, limit = 100, offset = 0 } = {}) {
  if (!supabase) return [];
  try {
    let query = supabase
      .from(TABLES.QUOTES)
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (status) query = query.eq('status', status);
    if (contactId) query = query.eq('bling_contact_id', contactId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar orçamentos:', err.message);
    return [];
  }
}

async function getQuoteById(id) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLES.QUOTES)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Erro ao buscar orçamento:', err.message);
    return null;
  }
}

async function saveQuote(quoteData, userId = null) {
  if (!supabase) throw new Error('Supabase não disponível');
  const now = new Date().toISOString();
  const payload = { ...quoteData, updated_at: now };
  if (!payload.id) {
    payload.created_by = userId;
    payload.created_at = now;
    if (!payload.numero) payload.numero = await generateQuoteNumber();
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
}

async function updateQuote(id, fields) {
  if (!supabase) throw new Error('Supabase não disponível');
  const { data, error } = await supabase
    .from(TABLES.QUOTES)
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateQuoteBlingSync(id, { blingPedidoId, blingPropostaId, tipo }) {
  if (!supabase) throw new Error('Supabase não disponível');
  const update = {
    bling_exportado_em: new Date().toISOString(),
    bling_export_tipo: tipo,
    updated_at: new Date().toISOString()
  };
  if (blingPedidoId) update.bling_pedido_id = blingPedidoId;
  if (blingPropostaId) update.bling_proposta_id = blingPropostaId;
  const { data, error } = await supabase
    .from(TABLES.QUOTES)
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
