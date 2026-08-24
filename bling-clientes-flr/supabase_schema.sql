-- ==========================================================================
-- SUPABASE SCHEMA - FLR BLING ERP
-- Todas as tabelas utilizam o prefixo obrigatório: flrBling_
-- ==========================================================================

-- 1. Tabela de Usuários do Aplicativo (Controle Próprio de Acesso)
CREATE TABLE IF NOT EXISTS "flrBling_users" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user', -- 'superadmin', 'admin', 'user'
    status TEXT DEFAULT 'pendente', -- 'aprovado', 'pendente', 'bloqueado'
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Tokens OAuth do Bling (Centralizada no Banco de Dados)
CREATE TABLE IF NOT EXISTS "flrBling_tokens" (
    id TEXT PRIMARY KEY DEFAULT 'bling_primary',
    provider TEXT DEFAULT 'bling',
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type TEXT DEFAULT 'Bearer',
    expires_in INTEGER,
    expires_at TIMESTAMPTZ,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Complemento de Dados do Cliente
CREATE TABLE IF NOT EXISTS "flrBling_customer_complements" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bling_customer_id BIGINT UNIQUE NOT NULL,
    customer_code TEXT,
    customer_name TEXT,
    internal_notes TEXT,
    tags TEXT[] DEFAULT '{}',
    priority TEXT DEFAULT 'normal', -- 'baixa', 'normal', 'alta', 'urgente'
    internal_status TEXT DEFAULT 'ativo', -- 'ativo', 'em_obras', 'em_manutencao', 'bloqueado', 'vip'
    responsible_manager TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Histórico / Logs de Atividades
CREATE TABLE IF NOT EXISTS "flrBling_activity_logs" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL, -- 'auth_success', 'token_refresh', 'customer_view', 'complement_update', 'user_registered', 'user_approved'
    bling_customer_id BIGINT,
    user_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de Alta Performance
CREATE INDEX IF NOT EXISTS "idx_flrBling_users_email" ON "flrBling_users" (email);
CREATE INDEX IF NOT EXISTS "idx_flrBling_users_status" ON "flrBling_users" (status);
CREATE INDEX IF NOT EXISTS "idx_flrBling_complements_cust_id" ON "flrBling_customer_complements" (bling_customer_id);
CREATE INDEX IF NOT EXISTS "idx_flrBling_logs_action" ON "flrBling_activity_logs" (action_type);
CREATE INDEX IF NOT EXISTS "idx_flrBling_logs_created_at" ON "flrBling_activity_logs" (created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE "flrBling_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "flrBling_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "flrBling_customer_complements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "flrBling_activity_logs" ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir acesso total flrBling_users" ON "flrBling_users" FOR ALL USING (true);
CREATE POLICY "Permitir acesso total flrBling_tokens" ON "flrBling_tokens" FOR ALL USING (true);
CREATE POLICY "Permitir acesso total flrBling_customer_complements" ON "flrBling_customer_complements" FOR ALL USING (true);
CREATE POLICY "Permitir acesso total flrBling_activity_logs" ON "flrBling_activity_logs" FOR ALL USING (true);
