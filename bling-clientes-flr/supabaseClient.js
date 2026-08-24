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
  USERS: 'flrBling_users',
  TOKENS: 'flrBling_tokens',
  COMPLEMENTS: 'flrBling_customer_complements',
  LOGS: 'flrBling_activity_logs'
};

// Fallback em memória para usuários (caso a tabela ainda não tenha sido criada no Supabase)
const memoryUsers = [];

// Helper: Garantir superadmin inicial
async function ensureSuperadmin() {
  const defaultAdminEmail = 'admin@flrinstalacoes.com.br';
  const defaultAdminPass = 'AdminFLR@2026';

  try {
    const existing = await findUserByEmail(defaultAdminEmail);
    if (!existing) {
      console.log('👑 Criando superadmin padrão: ' + defaultAdminEmail);
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(defaultAdminPass, salt);

      if (supabase) {
        const { error } = await supabase.from(TABLES.USERS).insert({
          name: 'Super Administrador FLR',
          email: defaultAdminEmail,
          password_hash: hash,
          role: 'superadmin',
          status: 'aprovado',
          phone: '(11) 99999-9999',
          created_at: new Date().toISOString()
        });

        if (error && error.code !== '42P01') { // 42P01 = table does not exist
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
        status: 'aprovado',
        phone: '(11) 99999-9999',
        created_at: new Date().toISOString()
      });
    }
  } catch (e) {
    console.warn('Aviso ensureSuperadmin:', e.message);
  }
}

// ==========================================================================
// OPERAÇÕES DE USUÁRIOS (flrBling_users)
// ==========================================================================

async function findUserByEmail(email) {
  const cleanEmail = email.trim().toLowerCase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (!error && data) return data;
    } catch (e) {
      // continua para fallback
    }
  }
  return memoryUsers.find(u => u.email.toLowerCase() === cleanEmail) || null;
}

async function findUserById(id) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('id, name, email, role, status, phone, created_at')
        .eq('id', id)
        .single();

      if (!error && data) return data;
    } catch (e) {
      // continua para fallback
    }
  }
  const mem = memoryUsers.find(u => u.id === id);
  if (mem) {
    const { password_hash, ...rest } = mem;
    return rest;
  }
  return null;
}

async function createUser({ name, email, password, phone }) {
  const cleanEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    throw new Error('Já existe um usuário cadastrado com este e-mail.');
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const newUser = {
    name: name.trim(),
    email: cleanEmail,
    password_hash,
    role: 'user',
    status: 'pendente', // Novos usuários iniciam pendentes de aprovação pelo superadmin
    phone: phone ? phone.trim() : null,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert(newUser)
        .select('id, name, email, role, status, phone, created_at')
        .single();

      if (!error && data) {
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
  return safeUser;
}

async function getAllUsers() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('id, name, email, role, status, phone, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) return data;
    } catch (e) {
      // fallback
    }
  }
  return memoryUsers.map(({ password_hash, ...u }) => u);
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
        .select('id, name, email, role, status, phone, created_at')
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
    return safe;
  }
  throw new Error('Usuário não encontrado.');
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
        .select('id, name, email, role, status, phone, created_at')
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
};
