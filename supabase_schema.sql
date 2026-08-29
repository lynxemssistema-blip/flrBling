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

-- ==========================================================================
-- MÓDULO: KITS DE PRODUTOS
-- ==========================================================================

-- 7. Tabela de Kits (Cabeçalho)
CREATE TABLE IF NOT EXISTS "flrBling_kits" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    codigo TEXT,
    descricao TEXT,
    imagem_url TEXT,
    preco_fixo NUMERIC(15,2) DEFAULT 0,
    usar_preco_fixo BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    created_by UUID REFERENCES "flrBling_users"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Itens do Kit (Composição)
CREATE TABLE IF NOT EXISTS "flrBling_kit_items" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kit_id UUID NOT NULL REFERENCES "flrBling_kits"(id) ON DELETE CASCADE,
    bling_product_id BIGINT,
    product_code TEXT,
    product_name TEXT NOT NULL,
    product_unit TEXT DEFAULT 'UN',
    quantity NUMERIC(10,3) DEFAULT 1,
    unit_price NUMERIC(15,2) DEFAULT 0,
    imagem_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabela de Orçamentos / Propostas Locais
CREATE TABLE IF NOT EXISTS "flrBling_quotes" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT UNIQUE,                          -- ex: ORC-2026-001
    titulo TEXT,
    status TEXT DEFAULT 'rascunho',              -- rascunho | apresentado | aprovado | cancelado
    bling_contact_id BIGINT,
    bling_contact_nome TEXT,
    itens JSONB DEFAULT '[]'::jsonb,             -- snapshot dos itens no momento da criação
    kits_snapshot JSONB DEFAULT '[]'::jsonb,     -- snapshot dos kits usados
    total_itens NUMERIC(15,2) DEFAULT 0,
    desconto_valor NUMERIC(15,2) DEFAULT 0,
    desconto_pct NUMERIC(5,2) DEFAULT 0,
    frete NUMERIC(15,2) DEFAULT 0,
    outras_despesas NUMERIC(15,2) DEFAULT 0,
    total_final NUMERIC(15,2) DEFAULT 0,
    validade_dias INTEGER DEFAULT 15,
    observacoes TEXT,
    obs_internas TEXT,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_validade DATE,
    -- Vínculo com Bling após exportação
    bling_pedido_id BIGINT,
    bling_proposta_id BIGINT,
    bling_exportado_em TIMESTAMPTZ,
    bling_export_tipo TEXT,                      -- 'pedido' | 'proposta'
    created_by UUID REFERENCES "flrBling_users"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de Alta Performance
CREATE INDEX IF NOT EXISTS "idx_flrBling_kits_ativo" ON "flrBling_kits" (ativo);
CREATE INDEX IF NOT EXISTS "idx_flrBling_kits_codigo" ON "flrBling_kits" (codigo);
CREATE INDEX IF NOT EXISTS "idx_flrBling_kit_items_kit_id" ON "flrBling_kit_items" (kit_id);
CREATE INDEX IF NOT EXISTS "idx_flrBling_kit_items_prod_id" ON "flrBling_kit_items" (bling_product_id);
CREATE INDEX IF NOT EXISTS "idx_flrBling_quotes_status" ON "flrBling_quotes" (status);
CREATE INDEX IF NOT EXISTS "idx_flrBling_quotes_contact" ON "flrBling_quotes" (bling_contact_id);
CREATE INDEX IF NOT EXISTS "idx_flrBling_quotes_numero" ON "flrBling_quotes" (numero);
CREATE INDEX IF NOT EXISTS "idx_flrBling_quotes_created_at" ON "flrBling_quotes" (created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE "flrBling_kits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "flrBling_kit_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "flrBling_quotes" ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "Permitir acesso total flrBling_kits" ON "flrBling_kits";
CREATE POLICY "Permitir acesso total flrBling_kits" ON "flrBling_kits" FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir acesso total flrBling_kit_items" ON "flrBling_kit_items";
CREATE POLICY "Permitir acesso total flrBling_kit_items" ON "flrBling_kit_items" FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir acesso total flrBling_quotes" ON "flrBling_quotes";
CREATE POLICY "Permitir acesso total flrBling_quotes" ON "flrBling_quotes" FOR ALL USING (true);

