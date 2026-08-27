-- ==========================================================================
-- SUPABASE SCHEMA - FLR BLING ERP
-- Todas as tabelas utilizam o prefixo obrigatório: flrBling_
-- ==========================================================================

-- 1. Tabela de Perfis de Acesso (RBAC - Role-Based Access Control)
CREATE TABLE IF NOT EXISTS "flrBling_profiles" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    color TEXT DEFAULT '#1665D8',
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Usuários do Aplicativo (Controle Próprio de Acesso)
CREATE TABLE IF NOT EXISTS "flrBling_users" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user', -- 'superadmin', 'admin', 'user'
    profile_id UUID REFERENCES "flrBling_profiles"(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pendente', -- 'aprovado', 'pendente', 'bloqueado'
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Tokens OAuth do Bling (Centralizada no Banco de Dados)
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

-- 4. Tabela de Complemento de Dados do Cliente
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

-- 5. Tabela de Complemento de Dados do Produto (Fotos, Custos e Metadados)
CREATE TABLE IF NOT EXISTS "flrBling_product_complements" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bling_product_id BIGINT UNIQUE NOT NULL,
    product_code TEXT,
    product_name TEXT,
    imagem_url TEXT,
    preco_custo NUMERIC(15,2) DEFAULT 0,
    categoria TEXT,
    estoque_minimo INTEGER DEFAULT 0,
    internal_notes TEXT,
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Histórico / Logs de Atividades
CREATE TABLE IF NOT EXISTS "flrBling_activity_logs" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL, -- 'auth_success', 'token_refresh', 'customer_view', 'complement_update', 'product_create', 'product_update', 'product_image_update', 'user_registered', 'user_approved', 'profile_created', 'profile_updated'
    bling_customer_id BIGINT,
    user_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- MIGRAÇÃO AUTOMÁTICA: Adiciona colunas faltantes caso as tabelas já existam
-- ==========================================================================
ALTER TABLE IF EXISTS "flrBling_users" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';
ALTER TABLE IF EXISTS "flrBling_users" ADD COLUMN IF NOT EXISTS "profile_id" UUID REFERENCES "flrBling_profiles"(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS "flrBling_users" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pendente';
ALTER TABLE IF EXISTS "flrBling_users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE IF EXISTS "flrBling_users" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;

ALTER TABLE IF EXISTS "flrBling_product_complements" ADD COLUMN IF NOT EXISTS "preco_custo" NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS "flrBling_product_complements" ADD COLUMN IF NOT EXISTS "categoria" TEXT;
ALTER TABLE IF EXISTS "flrBling_product_complements" ADD COLUMN IF NOT EXISTS "imagem_url" TEXT;

-- Índices de Alta Performance
CREATE INDEX IF NOT EXISTS "idx_flrBling_profiles_name" ON "flrBling_profiles" (name);
CREATE INDEX IF NOT EXISTS "idx_flrBling_users_email" ON "flrBling_users" (email);
CREATE INDEX IF NOT EXISTS "idx_flrBling_users_status" ON "flrBling_users" (status);
CREATE INDEX IF NOT EXISTS "idx_flrBling_users_profile" ON "flrBling_users" (profile_id);
CREATE INDEX IF NOT EXISTS "idx_flrBling_complements_cust_id" ON "flrBling_customer_complements" (bling_customer_id);
CREATE INDEX IF NOT EXISTS "idx_flrBling_complements_prod_id" ON "flrBling_product_complements" (bling_product_id);
CREATE INDEX IF NOT EXISTS "idx_flrBling_logs_action" ON "flrBling_activity_logs" (action_type);
CREATE INDEX IF NOT EXISTS "idx_flrBling_logs_created_at" ON "flrBling_activity_logs" (created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE "flrBling_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "flrBling_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "flrBling_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "flrBling_customer_complements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "flrBling_product_complements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "flrBling_activity_logs" ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Idempotentes
DROP POLICY IF EXISTS "Permitir acesso total flrBling_profiles" ON "flrBling_profiles";
CREATE POLICY "Permitir acesso total flrBling_profiles" ON "flrBling_profiles" FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir acesso total flrBling_users" ON "flrBling_users";
CREATE POLICY "Permitir acesso total flrBling_users" ON "flrBling_users" FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir acesso total flrBling_tokens" ON "flrBling_tokens";
CREATE POLICY "Permitir acesso total flrBling_tokens" ON "flrBling_tokens" FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir acesso total flrBling_customer_complements" ON "flrBling_customer_complements";
CREATE POLICY "Permitir acesso total flrBling_customer_complements" ON "flrBling_customer_complements" FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir acesso total flrBling_product_complements" ON "flrBling_product_complements";
CREATE POLICY "Permitir acesso total flrBling_product_complements" ON "flrBling_product_complements" FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir acesso total flrBling_activity_logs" ON "flrBling_activity_logs";
CREATE POLICY "Permitir acesso total flrBling_activity_logs" ON "flrBling_activity_logs" FOR ALL USING (true);

-- ==========================================================================
-- SEED DE PERFIS DE ACESSO INICIAIS
-- ==========================================================================
INSERT INTO "flrBling_profiles" (id, name, description, is_system, color, permissions)
VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'Super Administrador',
    'Acesso total e irrestrito a todas as páginas, funções, usuários e integração Bling.',
    true,
    '#E11D48',
    '{
        "dashboard": { "view": true },
        "clients": { "view": true, "create": true, "edit": true, "delete": true, "complement": true },
        "products": { "view": true, "create": true, "edit": true, "delete": true },
        "services": { "view": true, "create": true, "edit": true, "delete": true },
        "categories": { "view": true, "create": true, "edit": true, "delete": true },
        "orders": { "view": true, "create": true, "edit": true, "delete": true },
        "proposals": { "view": true, "create": true, "edit": true, "delete": true },
        "sellers": { "view": true, "create": true, "edit": true, "delete": true },
        "nfe": { "view": true, "create": true, "import_xml": true, "delete": true },
        "serviceOrders": { "view": true, "create": true, "edit": true, "delete": true },
        "receivables": { "view": true, "create": true, "edit": true, "delete": true },
        "payables": { "view": true, "create": true, "edit": true, "delete": true },
        "stock": { "view": true, "adjust": true },
        "users_admin": { "manage_users": true, "manage_profiles": true },
        "bling_settings": { "manage_connection": true }
    }'::jsonb
),
(
    '00000000-0000-0000-0000-000000000002',
    'Administrador Geral',
    'Gestão completa operacional, vendas, fiscal e financeiro (sem configurações OAuth do Bling).',
    false,
    '#1665D8',
    '{
        "dashboard": { "view": true },
        "clients": { "view": true, "create": true, "edit": true, "delete": true, "complement": true },
        "products": { "view": true, "create": true, "edit": true, "delete": true },
        "services": { "view": true, "create": true, "edit": true, "delete": true },
        "categories": { "view": true, "create": true, "edit": true, "delete": true },
        "orders": { "view": true, "create": true, "edit": true, "delete": true },
        "proposals": { "view": true, "create": true, "edit": true, "delete": true },
        "sellers": { "view": true, "create": true, "edit": true, "delete": true },
        "nfe": { "view": true, "create": true, "import_xml": true, "delete": true },
        "serviceOrders": { "view": true, "create": true, "edit": true, "delete": true },
        "receivables": { "view": true, "create": true, "edit": true, "delete": true },
        "payables": { "view": true, "create": true, "edit": true, "delete": true },
        "stock": { "view": true, "adjust": true },
        "users_admin": { "manage_users": false, "manage_profiles": false },
        "bling_settings": { "manage_connection": false }
    }'::jsonb
),
(
    '00000000-0000-0000-0000-000000000003',
    'Comercial & Vendas',
    'Acesso a Clientes, Pedidos de Venda, Propostas Comerciais e Catálogo de Produtos/Serviços.',
    false,
    '#00A868',
    '{
        "dashboard": { "view": true },
        "clients": { "view": true, "create": true, "edit": true, "delete": false, "complement": true },
        "products": { "view": true, "create": false, "edit": false, "delete": false },
        "services": { "view": true, "create": false, "edit": false, "delete": false },
        "categories": { "view": true, "create": false, "edit": false, "delete": false },
        "orders": { "view": true, "create": true, "edit": true, "delete": false },
        "proposals": { "view": true, "create": true, "edit": true, "delete": false },
        "sellers": { "view": true, "create": false, "edit": false, "delete": false },
        "nfe": { "view": false, "create": false, "import_xml": false, "delete": false },
        "serviceOrders": { "view": true, "create": false, "edit": false, "delete": false },
        "receivables": { "view": false, "create": false, "edit": false, "delete": false },
        "payables": { "view": false, "create": false, "edit": false, "delete": false },
        "stock": { "view": true, "adjust": false },
        "users_admin": { "manage_users": false, "manage_profiles": false },
        "bling_settings": { "manage_connection": false }
    }'::jsonb
),
(
    '00000000-0000-0000-0000-000000000004',
    'Financeiro & Fiscal',
    'Acesso ao módulo financeiro (Contas a Pagar/Receber), Notas Fiscais e Clientes.',
    false,
    '#8B5CF6',
    '{
        "dashboard": { "view": true },
        "clients": { "view": true, "create": true, "edit": true, "delete": false, "complement": false },
        "products": { "view": true, "create": false, "edit": false, "delete": false },
        "services": { "view": true, "create": false, "edit": false, "delete": false },
        "categories": { "view": false, "create": false, "edit": false, "delete": false },
        "orders": { "view": true, "create": false, "edit": false, "delete": false },
        "proposals": { "view": false, "create": false, "edit": false, "delete": false },
        "sellers": { "view": true, "create": false, "edit": false, "delete": false },
        "nfe": { "view": true, "create": true, "import_xml": true, "delete": false },
        "serviceOrders": { "view": false, "create": false, "edit": false, "delete": false },
        "receivables": { "view": true, "create": true, "edit": true, "delete": true },
        "payables": { "view": true, "create": true, "edit": true, "delete": true },
        "stock": { "view": false, "adjust": false },
        "users_admin": { "manage_users": false, "manage_profiles": false },
        "bling_settings": { "manage_connection": false }
    }'::jsonb
),
(
    '00000000-0000-0000-0000-000000000005',
    'Operacional & Serviços',
    'Acesso a Ordens de Serviço (OS), Saldos de Estoque, Produtos e Serviços.',
    false,
    '#F59E0B',
    '{
        "dashboard": { "view": true },
        "clients": { "view": true, "create": false, "edit": false, "delete": false, "complement": true },
        "products": { "view": true, "create": true, "edit": true, "delete": false },
        "services": { "view": true, "create": true, "edit": true, "delete": false },
        "categories": { "view": true, "create": false, "edit": false, "delete": false },
        "orders": { "view": false, "create": false, "edit": false, "delete": false },
        "proposals": { "view": false, "create": false, "edit": false, "delete": false },
        "sellers": { "view": false, "create": false, "edit": false, "delete": false },
        "nfe": { "view": false, "create": false, "import_xml": false, "delete": false },
        "serviceOrders": { "view": true, "create": true, "edit": true, "delete": false },
        "receivables": { "view": false, "create": false, "edit": false, "delete": false },
        "payables": { "view": false, "create": false, "edit": false, "delete": false },
        "stock": { "view": true, "adjust": true },
        "users_admin": { "manage_users": false, "manage_profiles": false },
        "bling_settings": { "manage_connection": false }
    }'::jsonb
),
(
    '00000000-0000-0000-0000-000000000006',
    'Consulta / Somente Leitura',
    'Acesso apenas para visualização de relatórios e dados cadastrais de todos os módulos.',
    false,
    '#64748B',
    '{
        "dashboard": { "view": true },
        "clients": { "view": true, "create": false, "edit": false, "delete": false, "complement": false },
        "products": { "view": true, "create": false, "edit": false, "delete": false },
        "services": { "view": true, "create": false, "edit": false, "delete": false },
        "categories": { "view": true, "create": false, "edit": false, "delete": false },
        "orders": { "view": true, "create": false, "edit": false, "delete": false },
        "proposals": { "view": true, "create": false, "edit": false, "delete": false },
        "sellers": { "view": true, "create": false, "edit": false, "delete": false },
        "nfe": { "view": true, "create": false, "import_xml": false, "delete": false },
        "serviceOrders": { "view": true, "create": false, "edit": false, "delete": false },
        "receivables": { "view": true, "create": false, "edit": false, "delete": false },
        "payables": { "view": true, "create": false, "edit": false, "delete": false },
        "stock": { "view": true, "adjust": false },
        "users_admin": { "manage_users": false, "manage_profiles": false },
        "bling_settings": { "manage_connection": false }
    }'::jsonb
)
ON CONFLICT (name) DO NOTHING;
