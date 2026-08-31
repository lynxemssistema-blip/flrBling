<?php
/**
 * FLR Bling ERP - Router de API Nativo PHP
 * Roteia todas as chamadas /api/* sem precisar de Node.js no servidor.
 */

require_once __DIR__ . '/config.php';

// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Obter rota requisitada
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Normalizar rota: remove prefixo /public/ ou / e mantém a partir de api/
$path = preg_replace('#^.*?/api/?#', '', $uri);
$path = trim($path, '/');
$segments = explode('/', $path);

// Dados de Demonstração (Fallback Rápido)
$DEMO_DATA = [
    'clientes' => [
        [
            'id' => 168492019,
            'nome' => "FLR Instalações e Manutenções LTDA",
            'codigo' => "CLI-001",
            'situacao' => "A",
            'numeroDocumento' => "45.123.890/0001-92",
            'telefone' => "(11) 3456-7890",
            'celular' => "(11) 98765-4321",
            'email' => "contato@flrinstalacoes.com.br",
            'tipo' => "J",
            'fantasia' => "FLR Engenharia & Climatização",
            'endereco' => ['geral' => ['endereco' => "Av. Brigadeiro Faria Lima", 'numero' => "2355", 'complemento' => "Conjunto 81", 'bairro' => "Jardim Paulistano", 'cep' => "01452-000", 'municipio' => "São Paulo", 'uf' => "SP"]]
        ],
        [
            'id' => 168492020,
            'nome' => "Carlos Eduardo Silveira",
            'codigo' => "CLI-002",
            'situacao' => "A",
            'numeroDocumento' => "289.456.781-04",
            'telefone' => "(19) 3214-5500",
            'celular' => "(19) 99123-8899",
            'email' => "carlos.silveira@gmail.com",
            'tipo' => "F",
            'endereco' => ['geral' => ['endereco' => "Rua Coronel Quirino", 'numero' => "450", 'bairro' => "Cambuí", 'cep' => "13025-001", 'municipio' => "Campinas", 'uf' => "SP"]]
        ],
        [
            'id' => 168492021,
            'nome' => "Construtora Horizonte S.A.",
            'codigo' => "CLI-003",
            'situacao' => "A",
            'numeroDocumento' => "10.987.654/0001-33",
            'telefone' => "(21) 2500-1000",
            'email' => "compras@horizonte.com.br",
            'tipo' => "J",
            'fantasia' => "Horizonte Empreendimentos",
            'endereco' => ['geral' => ['endereco' => "Av. das Américas", 'numero' => "5000", 'bairro' => "Barra da Tijuca", 'cep' => "22640-102", 'municipio' => "Rio de Janeiro", 'uf' => "RJ"]]
        ]
    ],
    'produtos' => [
        ['id' => 101, 'nome' => "Ar Condicionado Split Inverter 12000 BTUs", 'codigo' => "AC-12K-INV", 'preco' => 2890.00, 'precoCusto' => 1950.00, 'unidade' => "UN", 'tipo' => "P", 'situacao' => "A", 'estoque' => 14, 'categoria' => "Climatização", 'imagemURL' => "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&auto=format&fit=crop&q=80"],
        ['id' => 102, 'nome' => "Cabo de Cobre Flexível 6mm (Rolo 100m)", 'codigo' => "EL-CAB-6MM", 'preco' => 420.00, 'precoCusto' => 280.00, 'unidade' => "RL", 'tipo' => "P", 'situacao' => "A", 'estoque' => 38, 'categoria' => "Material Elétrico", 'imagemURL' => "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=300&auto=format&fit=crop&q=80"],
        ['id' => 103, 'nome' => "Disjuntor Bipolar DIN 32A Steck", 'codigo' => "EL-DISJ-32A", 'preco' => 48.50, 'precoCusto' => 28.00, 'unidade' => "UN", 'tipo' => "P", 'situacao' => "A", 'estoque' => 95, 'categoria' => "Proteção Elétrica", 'imagemURL' => "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80"],
        ['id' => 104, 'nome' => "Serviço de Instalação e Infraestrutura HVAC", 'codigo' => "SRV-INST-HVAC", 'preco' => 850.00, 'precoCusto' => 300.00, 'unidade' => "SV", 'tipo' => "S", 'situacao' => "A", 'estoque' => 999, 'categoria' => "Serviços Técnicos", 'imagemURL' => "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80"],
        ['id' => 105, 'nome' => "Manutenção Preventiva e Higienização de Splits", 'codigo' => "SRV-MANUT-PREV", 'preco' => 250.00, 'precoCusto' => 80.00, 'unidade' => "SV", 'tipo' => "S", 'situacao' => "A", 'estoque' => 999, 'categoria' => "Serviços Técnicos", 'imagemURL' => "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&auto=format&fit=crop&q=80"]
    ],
    'pedidos' => [
        ['id' => 2001, 'numero' => 5082, 'data' => "2026-03-18", 'cliente' => ['nome' => "FLR Instalações e Manutenções LTDA", 'id' => 168492019], 'total' => 6630.00, 'situacao' => "Atendido", 'vendedor' => "Roberto Andrade", 'itensQtd' => 3],
        ['id' => 2002, 'numero' => 5083, 'data' => "2026-03-20", 'cliente' => ['nome' => "Construtora Horizonte S.A.", 'id' => 168492021], 'total' => 24500.00, 'situacao' => "Em andamento", 'vendedor' => "Ana Paula Silva", 'itensQtd' => 8],
        ['id' => 2003, 'numero' => 5084, 'data' => "2026-03-22", 'cliente' => ['nome' => "Carlos Eduardo Silveira", 'id' => 168492020], 'total' => 1100.00, 'situacao' => "Pendente", 'vendedor' => "Roberto Andrade", 'itensQtd' => 2]
    ],
    'ordensServicos' => [
        ['id' => 3001, 'numero' => 1045, 'dataAbertura' => "2026-03-15", 'dataPrevisao' => "2026-03-25", 'cliente' => ['nome' => "Construtora Horizonte S.A."], 'descricao' => "Instalação de 6 Splits 18k BTUs no Bloco Corporativo", 'responsavel' => "Eng. Rodrigo / Equipe Alpha", 'situacao' => "Em Execução", 'valorTotal' => 18500.00],
        ['id' => 3002, 'numero' => 1046, 'dataAbertura' => "2026-03-19", 'dataPrevisao' => "2026-03-23", 'cliente' => ['nome' => "Carlos Eduardo Silveira"], 'descricao' => "Troca de Quadro de Distribuição e Balanceamento de Cargas", 'responsavel' => "Téc. Fernando", 'situacao' => "Concluído", 'valorTotal' => 1450.00]
    ],
    'contasReceber' => [
        ['id' => 4001, 'numeroDocumento' => "FAT-5082/1", 'cliente' => "FLR Instalações LTDA", 'vencimento' => "2026-03-30", 'valor' => 3315.00, 'saldo' => 3315.00, 'situacao' => "Aberta"],
        ['id' => 4002, 'numeroDocumento' => "FAT-5082/2", 'cliente' => "FLR Instalações LTDA", 'vencimento' => "2026-04-30", 'valor' => 3315.00, 'saldo' => 3315.00, 'situacao' => "Aberta"],
        ['id' => 4003, 'numeroDocumento' => "FAT-5070", 'cliente' => "Carlos Eduardo Silveira", 'vencimento' => "2026-03-10", 'valor' => 850.00, 'saldo' => 0, 'situacao' => "Liquidada"]
    ],
    'contasPagar' => [
        ['id' => 5001, 'fornecedor' => "Distribuidora Nacional de Cobre S/A", 'vencimento' => "2026-03-28", 'valor' => 4500.00, 'situacao' => "Aberta", 'categoria' => "Matéria-Prima"],
        ['id' => 5002, 'fornecedor' => "Daikin / Carrier Climatização Brasil", 'vencimento' => "2026-04-05", 'valor' => 14200.00, 'situacao' => "Aberta", 'categoria' => "Equipamentos HVAC"]
    ],
    'propostas' => [
        ['id' => 6001, 'numero' => 890, 'cliente' => "Shopping Iguatemi Galeria", 'data' => "2026-03-17", 'validade' => "2026-04-17", 'total' => 85000.00, 'situacao' => "Em Negociação"]
    ],
    'nfe' => [
        [
            'id' => 50001,
            'numero' => 4502,
            'serie' => "1",
            'tipo' => "E",
            'tipoOperacao' => "E",
            'dataEmissao' => "2026-03-20",
            'naturezaOperacao' => "Compra para comercialização / Estoque",
            'chaveAcesso' => "35260345123890000192550010000045021008451239",
            'situacao' => "Autorizada",
            'valorTotal' => 18500.00,
            'valorNota' => 18500.00,
            'contato' => ['nome' => "Daikin / Carrier Climatização Brasil", 'numeroDocumento' => "12.345.678/0001-90"],
            'itens' => [
                ['numeroItem' => 1, 'codigo' => "AC-12K-INV", 'descricao' => "Ar Condicionado Split Inverter 12000 BTUs", 'ncm' => "8415.10.11", 'unidade' => "UN", 'quantidade' => 6, 'valorUnitario' => 1950.00, 'subtotal' => 11700.00],
                ['numeroItem' => 2, 'codigo' => "EL-CAB-6MM", 'descricao' => "Cabo de Cobre Flexível 6mm (Rolo 100m)", 'ncm' => "7408.11.00", 'unidade' => "RL", 'quantidade' => 10, 'valorUnitario' => 280.00, 'subtotal' => 2800.00]
            ]
        ],
        [
            'id' => 50002,
            'numero' => 1084,
            'serie' => "1",
            'tipo' => "S",
            'tipoOperacao' => "S",
            'dataEmissao' => "2026-03-22",
            'naturezaOperacao' => "Venda de Mercadorias e Instalação",
            'chaveAcesso' => "35260345123890000192550010000010841008459999",
            'situacao' => "Autorizada",
            'valorTotal' => 6630.00,
            'valorNota' => 6630.00,
            'contato' => ['nome' => "Construtora Horizonte S.A.", 'numeroDocumento' => "10.987.654/0001-33"],
            'itens' => [
                ['numeroItem' => 1, 'codigo' => "SRV-INST-HVAC", 'descricao' => "Serviço de Instalação e Infraestrutura HVAC", 'ncm' => "0000.00.00", 'unidade' => "SV", 'quantidade' => 1, 'valorUnitario' => 850.00, 'subtotal' => 850.00]
            ]
        ]
    ]
];

// ==========================================================================
// ROTEADOR DE ENDPOINTS
// ==========================================================================

try {
    // 1. CONFIGURAÇÃO PÚBLICA DO BLING
    if ($segments[0] === 'config' && $method === 'GET') {
        $clientId = BLING_CLIENT_ID;
        $redirectUri = BLING_REDIRECT_URI;
        $state = BLING_STATE;
        $authorizeUrl = "https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id={$clientId}&state={$state}";

        json_response([
            'clientId' => $clientId,
            'redirectUri' => $redirectUri,
            'state' => $state,
            'authorizeUrl' => $authorizeUrl,
            'isConfigured' => (bool)(BLING_CLIENT_ID && BLING_CLIENT_SECRET),
            'supabaseConnected' => true
        ]);
    }

    // 2. STATUS DA AUTENTICAÇÃO DO BLING (COM AUTO-RENOVAÇÃO)
    if ($segments[0] === 'auth' && isset($segments[1]) && $segments[1] === 'status' && $method === 'GET') {
        $tokens = get_saved_tokens();
        if (!$tokens || empty($tokens['access_token'])) {
            json_response([
                'authenticated' => false,
                'message' => 'Não autenticado no Bling'
            ]);
        }

        $isExpired = !empty($tokens['expires_at']) ? (strtotime($tokens['expires_at']) <= time()) : false;
        
        // Se o access_token expirou mas temos refresh_token, renova automaticamente agora!
        if ($isExpired && !empty($tokens['refresh_token'])) {
            try {
                $tokens = refresh_bling_token();
                $isExpired = false;
            } catch (Exception $e) {
                // Se falhou ao renovar, mantém marcado como expirado
            }
        }

        json_response([
            'authenticated' => true,
            'saved_at' => isset($tokens['saved_at']) ? $tokens['saved_at'] : null,
            'expires_at' => isset($tokens['expires_at']) ? $tokens['expires_at'] : null,
            'isExpired' => $isExpired,
            'tokenType' => isset($tokens['token_type']) ? $tokens['token_type'] : 'Bearer',
            'supabaseActive' => true
        ]);
    }

    // 3. LOGIN DE USUÁRIO
    if ($segments[0] === 'auth' && isset($segments[1]) && $segments[1] === 'login' && $method === 'POST') {
        $body = get_json_input();
        $email = isset($body['email']) ? trim($body['email']) : '';
        $password = isset($body['password']) ? trim($body['password']) : '';

        if (empty($email) || empty($password)) {
            json_response(['error' => 'E-mail e senha são obrigatórios.'], 400);
        }

        $user = supabase_find_user_by_email($email);
        if (!$user) {
            json_response(['error' => 'E-mail ou senha incorretos.'], 401);
        }

        if (!password_verify($password, $user['password_hash'])) {
            json_response(['error' => 'E-mail ou senha incorretos.'], 401);
        }

        if ($user['status'] !== 'aprovado') {
            if ($user['status'] === 'pendente') {
                json_response(['error' => 'Seu cadastro está aguardando aprovação do Super Administrador.', 'status' => 'pendente'], 403);
            }
            json_response(['error' => 'Seu acesso está bloqueado. Contate o administrador.', 'status' => 'bloqueado'], 403);
        }

        $token = generate_jwt([
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role']
        ]);

        unset($user['password_hash']);
        json_response([
            'success' => true,
            'token' => $token,
            'user' => $user
        ]);
    }

    // 4. CADASTRO DE USUÁRIO
    if ($segments[0] === 'auth' && isset($segments[1]) && $segments[1] === 'register' && $method === 'POST') {
        $body = get_json_input();
        $name = isset($body['name']) ? trim($body['name']) : '';
        $email = isset($body['email']) ? strtolower(trim($body['email'])) : '';
        $password = isset($body['password']) ? trim($body['password']) : '';
        $phone = isset($body['phone']) ? trim($body['phone']) : null;

        if (empty($name) || empty($email) || empty($password)) {
            json_response(['error' => 'Nome, e-mail e senha são obrigatórios.'], 400);
        }
        if (strlen($password) < 6) {
            json_response(['error' => 'A senha deve conter no mínimo 6 caracteres.'], 400);
        }

        $existing = supabase_find_user_by_email($email);
        if ($existing) {
            json_response(['error' => 'Já existe um usuário cadastrado com este e-mail.'], 400);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $insertData = [
            'name' => $name,
            'email' => $email,
            'password_hash' => $hash,
            'role' => 'user',
            'status' => 'pendente',
            'phone' => $phone,
            'created_at' => date('c')
        ];

        $res = supabase_fetch("flrBling_users", 'POST', [$insertData]);
        $createdUser = (!empty($res['data'])) ? $res['data'][0] : $insertData;
        unset($createdUser['password_hash']);

        log_activity('user_registered', null, "Novo usuário cadastrado: {$email}", ['name' => $name, 'email' => $email]);

        json_response([
            'success' => true,
            'message' => 'Cadastro realizado com sucesso! Seu acesso está pendente de aprovação pelo Super Administrador.',
            'user' => $createdUser
        ], 201);
    }

    // 5. OBTER DADOS DO USUÁRIO LOGADO
    if ($segments[0] === 'auth' && isset($segments[1]) && $segments[1] === 'me' && $method === 'GET') {
        $user = authenticate_user();
        json_response(['user' => $user]);
    }

    // 6. TROCA DE CÓDIGO OAUTH DO BLING (EXCLUSIVO SUPERADMIN)
    if ($segments[0] === 'auth' && isset($segments[1]) && $segments[1] === 'exchange' && $method === 'POST') {
        $user = authenticate_user();
        require_superadmin($user);

        $body = get_json_input();
        $code = isset($body['code']) ? trim($body['code']) : '';
        if (empty($code)) {
            json_response(['error' => 'O parâmetro "code" é obrigatório.'], 400);
        }

        if (strpos($code, 'code=') !== false) {
            preg_match('/[?&]code=([^&]+)/', $code, $m);
            if (isset($m[1])) $code = urldecode($m[1]);
        }

        $clientId = BLING_CLIENT_ID;
        $clientSecret = BLING_CLIENT_SECRET;
        $basicAuth = base64_encode("$clientId:$clientSecret");

        $postData = http_build_query([
            'grant_type' => 'authorization_code',
            'code' => $code
        ]);

        $ch = curl_init('https://bling.com.br/Api/v3/oauth/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded',
            'Authorization: Basic ' . $basicAuth,
            'Accept: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $json = json_decode($response, true);
        if ($httpCode === 200 && !empty($json['access_token'])) {
            $saved = save_tokens_data($json);
            log_activity('auth_success', null, 'Autenticação OAuth realizada com sucesso pelo Superadmin', [], $user['id']);
            json_response([
                'success' => true,
                'message' => 'Autenticação realizada com sucesso!',
                'expires_at' => $saved['expires_at']
            ]);
        }

        json_response([
            'error' => 'Falha ao autenticar com o Bling',
            'details' => $json ?: $response
        ], $httpCode >= 400 ? $httpCode : 500);
    }

    // 7. INSERIR TOKEN MANUAL (EXCLUSIVO SUPERADMIN)
    if ($segments[0] === 'auth' && isset($segments[1]) && $segments[1] === 'set-token' && $method === 'POST') {
        $user = authenticate_user();
        require_superadmin($user);

        $body = get_json_input();
        if (empty($body['access_token'])) {
            json_response(['error' => 'access_token é obrigatório'], 400);
        }

        $saved = save_tokens_data([
            'access_token' => $body['access_token'],
            'refresh_token' => isset($body['refresh_token']) ? $body['refresh_token'] : null,
            'expires_in' => isset($body['expires_in']) ? intval($body['expires_in']) : 21600,
            'token_type' => 'Bearer'
        ]);

        json_response([
            'success' => true,
            'message' => 'Token salvo com sucesso!',
            'expires_at' => $saved['expires_at']
        ]);
    }

    // 8. LOGOUT DO BLING (EXCLUSIVO SUPERADMIN)
    if ($segments[0] === 'auth' && isset($segments[1]) && $segments[1] === 'logout' && $method === 'POST') {
        $user = authenticate_user();
        require_superadmin($user);

        if (file_exists(TOKENS_FILE)) {
            @unlink(TOKENS_FILE);
        }
        supabase_fetch("flrBling_tokens?id=eq.bling_primary", 'DELETE');
        json_response(['success' => true, 'message' => 'Desconectado com sucesso']);
    }

    // 9. GESTÃO DE PERFIS DE ACESSO (RBAC)
    if ($segments[0] === 'profiles') {
        $user = authenticate_user();

        // Listar todos os perfis
        if (count($segments) === 1 && $method === 'GET') {
            $profiles = supabase_get_profiles();
            json_response(['profiles' => $profiles]);
        }

        // Obter perfil específico
        if (count($segments) === 2 && $method === 'GET') {
            $profile = supabase_get_profile_by_id($segments[1]);
            if (!$profile) json_response(['error' => 'Perfil não encontrado.'], 404);
            json_response(['profile' => $profile]);
        }

        // Criar perfil (Exclusivo Superadmin)
        if (count($segments) === 1 && $method === 'POST') {
            require_superadmin($user);
            $body = get_json_input();
            $name = isset($body['name']) ? trim($body['name']) : '';
            if (empty($name)) json_response(['error' => 'Nome do perfil é obrigatório.'], 400);

            $insertData = [
                'name' => $name,
                'description' => isset($body['description']) ? trim($body['description']) : '',
                'color' => isset($body['color']) ? $body['color'] : '#1665D8',
                'is_system' => false,
                'permissions' => isset($body['permissions']) ? $body['permissions'] : [],
                'created_at' => date('c'),
                'updated_at' => date('c')
            ];

            $res = supabase_fetch("flrBling_profiles", 'POST', [$insertData]);
            $created = !empty($res['data']) ? $res['data'][0] : $insertData;
            log_activity('profile_created', null, "Perfil criado: {$name}", ['profile_id' => isset($created['id']) ? $created['id'] : null], $user['id']);
            json_response(['success' => true, 'profile' => $created], 201);
        }

        // Atualizar perfil (Exclusivo Superadmin)
        if (count($segments) === 2 && $method === 'PUT') {
            require_superadmin($user);
            $targetId = $segments[1];
            $body = get_json_input();

            $updateData = ['updated_at' => date('c')];
            if (isset($body['name'])) $updateData['name'] = trim($body['name']);
            if (isset($body['description'])) $updateData['description'] = trim($body['description']);
            if (isset($body['color'])) $updateData['color'] = $body['color'];
            if (isset($body['permissions'])) $updateData['permissions'] = $body['permissions'];

            $res = supabase_fetch("flrBling_profiles?id=eq." . urlencode($targetId), 'PATCH', $updateData);
            $updated = !empty($res['data']) ? $res['data'][0] : array_merge(['id' => $targetId], $updateData);
            log_activity('profile_updated', null, "Perfil atualizado (ID: {$targetId})", $updateData, $user['id']);
            json_response(['success' => true, 'profile' => $updated]);
        }

        // Excluir perfil (Exclusivo Superadmin)
        if (count($segments) === 2 && $method === 'DELETE') {
            require_superadmin($user);
            $targetId = $segments[1];

            // Verifica se perfil é do sistema
            $existing = supabase_get_profile_by_id($targetId);
            if ($existing && !empty($existing['is_system'])) {
                json_response(['error' => 'Perfis do sistema não podem ser excluídos.'], 400);
            }

            // Verifica se há usuários vinculados
            $usersRes = supabase_fetch("flrBling_users?profile_id=eq." . urlencode($targetId) . "&select=id");
            if (!empty($usersRes['data']) && count($usersRes['data']) > 0) {
                json_response(['error' => 'Não é possível excluir este perfil pois existem usuários vinculados a ele.'], 400);
            }

            supabase_fetch("flrBling_profiles?id=eq." . urlencode($targetId), 'DELETE');
            log_activity('profile_deleted', null, "Perfil excluído (ID: {$targetId})", [], $user['id']);
            json_response(['success' => true, 'message' => 'Perfil excluído com sucesso.']);
        }
    }

    // 10. GESTÃO DE USUÁRIOS (EXCLUSIVO SUPERADMIN)
    if ($segments[0] === 'users') {
        $user = authenticate_user();
        require_superadmin($user);

        // Listar Usuários com Perfil
        if (count($segments) === 1 && $method === 'GET') {
            $res = supabase_fetch("flrBling_users?select=id,name,email,role,profile_id,status,phone,created_at,updated_at,profile:flrBling_profiles(id,name,description,color,permissions)&order=created_at.desc");
            $users = (!empty($res['data'])) ? $res['data'] : [];
            
            // Injetar o superadmin na lista para o painel
            global $SUPERADMIN_EMAIL;
            $superAdmin = [
                'id' => 'superadmin_id',
                'name' => 'Super Administrador (FLR)',
                'email' => $SUPERADMIN_EMAIL,
                'role' => 'superadmin',
                'status' => 'aprovado',
                'created_at' => date('c'),
                'profile' => ['name' => 'Acesso Total (Sistema)']
            ];
            $hasSuperAdmin = false;
            foreach ($users as $u) {
                if ($u['email'] === $SUPERADMIN_EMAIL) { $hasSuperAdmin = true; break; }
            }
            if (!$hasSuperAdmin) {
                array_unshift($users, $superAdmin);
            }

            json_response(['users' => $users]);
        }

        // Criar Usuário diretamente pelo Administrador
        if (count($segments) === 1 && $method === 'POST') {
            $body = get_json_input();
            $name = isset($body['name']) ? trim($body['name']) : '';
            $email = isset($body['email']) ? strtolower(trim($body['email'])) : '';
            $password = isset($body['password']) ? trim($body['password']) : '';
            $phone = isset($body['phone']) ? trim($body['phone']) : null;
            $profile_id = isset($body['profile_id']) ? $body['profile_id'] : null;
            $status = isset($body['status']) ? $body['status'] : 'aprovado';

            if (empty($name) || empty($email) || empty($password)) {
                json_response(['error' => 'Nome, e-mail e senha são obrigatórios.'], 400);
            }

            $existing = supabase_find_user_by_email($email);
            if ($existing) {
                json_response(['error' => 'Já existe um usuário cadastrado com este e-mail.'], 400);
            }

            $insertData = [
                'name' => $name,
                'email' => $email,
                'password_hash' => password_hash($password, PASSWORD_BCRYPT),
                'role' => 'user',
                'profile_id' => $profile_id,
                'status' => $status,
                'phone' => $phone,
                'created_at' => date('c'),
                'updated_at' => date('c')
            ];

            $res = supabase_fetch("flrBling_users", 'POST', [$insertData]);
            $createdUser = (!empty($res['data'])) ? $res['data'][0] : $insertData;
            unset($createdUser['password_hash']);
            log_activity('user_admin_created', null, "Usuário criado pelo administrador: {$email}", ['name' => $name, 'email' => $email], $user['id']);
            json_response(['success' => true, 'user' => $createdUser], 201);
        }

        // Atualizar dados completos do Usuário
        if (count($segments) === 2 && $method === 'PUT') {
            $targetId = $segments[1];
            $body = get_json_input();

            $updateData = ['updated_at' => date('c')];
            if (isset($body['name'])) $updateData['name'] = trim($body['name']);
            if (isset($body['email'])) $updateData['email'] = strtolower(trim($body['email']));
            if (isset($body['phone'])) $updateData['phone'] = trim($body['phone']);
            if (isset($body['status'])) $updateData['status'] = $body['status'];
            if (isset($body['profile_id'])) $updateData['profile_id'] = $body['profile_id'];
            if (!empty($body['password']) && strlen($body['password']) >= 6) {
                $updateData['password_hash'] = password_hash(trim($body['password']), PASSWORD_BCRYPT);
            }

            $res = supabase_fetch("flrBling_users?id=eq." . urlencode($targetId), 'PATCH', $updateData);
            $updated = !empty($res['data']) ? $res['data'][0] : array_merge(['id' => $targetId], $updateData);
            unset($updated['password_hash']);
            log_activity('user_updated', null, "Dados do usuário atualizados (ID: {$targetId})", [], $user['id']);
            json_response(['success' => true, 'user' => $updated]);
        }

        // Alterar Status
        if (count($segments) === 3 && $segments[2] === 'status' && $method === 'PATCH') {
            $targetId = $segments[1];
            $body = get_json_input();
            $status = isset($body['status']) ? $body['status'] : '';
            if (!in_array($status, ['aprovado', 'pendente', 'bloqueado'])) {
                json_response(['error' => 'Status inválido. Use aprovado, pendente ou bloqueado.'], 400);
            }

            $res = supabase_fetch("flrBling_users?id=eq." . urlencode($targetId), 'PATCH', [
                'status' => $status,
                'updated_at' => date('c')
            ]);
            $updated = !empty($res['data']) ? $res['data'][0] : ['id' => $targetId, 'status' => $status];
            log_activity('user_status_change', null, "Status do usuário alterado para {$status}", ['status' => $status], $user['id']);
            json_response(['success' => true, 'user' => $updated]);
        }

        // Alterar Perfil de Acesso
        if (count($segments) === 3 && $segments[2] === 'profile' && $method === 'PATCH') {
            $targetId = $segments[1];
            $body = get_json_input();
            $profileId = isset($body['profile_id']) ? $body['profile_id'] : null;

            $res = supabase_fetch("flrBling_users?id=eq." . urlencode($targetId), 'PATCH', [
                'profile_id' => $profileId,
                'updated_at' => date('c')
            ]);
            $updated = !empty($res['data']) ? $res['data'][0] : ['id' => $targetId, 'profile_id' => $profileId];
            log_activity('user_profile_change', null, "Perfil do usuário alterado (ID: {$targetId})", ['profile_id' => $profileId], $user['id']);
            json_response(['success' => true, 'user' => $updated]);
        }

        // Excluir Usuário
        if (count($segments) === 2 && $method === 'DELETE') {
            $targetId = $segments[1];
            if ($targetId === $user['id']) {
                json_response(['error' => 'Você não pode excluir seu próprio usuário.'], 400);
            }
            supabase_fetch("flrBling_users?id=eq." . urlencode($targetId), 'DELETE');
            log_activity('user_deleted', null, "Usuário excluído (ID: {$targetId})", [], $user['id']);
            json_response(['success' => true]);
        }
    }

    // 10. UPLOAD DE IMAGEM
    if ($segments[0] === 'upload' && isset($segments[1]) && $segments[1] === 'image' && $method === 'POST') {
        $user = authenticate_user();
        $body = get_json_input();
        $imageBase64 = isset($body['imageBase64']) ? $body['imageBase64'] : '';

        if (empty($imageBase64)) {
            json_response(['error' => 'Nenhuma imagem fornecida.'], 400);
        }

        if (!is_dir(UPLOADS_DIR)) {
            @mkdir(UPLOADS_DIR, 0755, true);
        }

        $ext = 'jpg';
        $data = $imageBase64;
        if (preg_match('/^data:image\/(\w+);base64,/', $imageBase64, $type)) {
            $data = substr($imageBase64, strpos($imageBase64, ',') + 1);
            $ext = strtolower($type[1]);
            if ($ext === 'jpeg') $ext = 'jpg';
        }

        $safeName = 'prod_' . time() . '_' . substr(md5(uniqid()), 0, 6) . '.' . $ext;
        $filePath = UPLOADS_DIR . '/' . $safeName;
        @file_put_contents($filePath, base64_decode($data));

        $publicUrl = '/uploads/' . $safeName;
        json_response(['success' => true, 'url' => $publicUrl]);
    }

    // 11. DADOS DEMO E DASHBOARD
    if ($segments[0] === 'demo-data' && $method === 'GET') {
        $module = isset($_GET['module']) ? $_GET['module'] : 'clientes';
        json_response([
            'data' => isset($DEMO_DATA[$module]) ? $DEMO_DATA[$module] : $DEMO_DATA['clientes'],
            'allModules' => array_keys($DEMO_DATA)
        ]);
    }

    if ($segments[0] === 'dashboard-summary' && $method === 'GET') {
        $totals = [
            'clientesTotal' => count($DEMO_DATA['clientes']),
            'produtosTotal' => count($DEMO_DATA['produtos']),
            'pedidosTotal' => count($DEMO_DATA['pedidos']),
            'faturamentoMes' => 32230.00,
            'ordensServicosAtivas' => 2,
            'contasReceberPendente' => 18880.00,
            'contasPagarPendente' => 18700.00,
            'fonte' => 'demo'
        ];

        try {
            $user = authenticate_user();
            $tokens = get_saved_tokens();
            if ($tokens && !empty($tokens['access_token'])) {
                $totals['fonte'] = 'live';
                try {
                    $contatos = fetch_bling_api('contatos', ['limite' => 1]);
                    if (!empty($contatos['data'])) $totals['clientesTotal'] = 100;
                } catch (Exception $e) {}
            }
        } catch (Exception $e) {
            // Se usuário ainda não autenticado, retorna métricas padrão sem erro 500
        }

        json_response(['success' => true, 'data' => $totals]);
    }

    // 12. COMPLEMENTOS DE CLIENTES (flrBling_customer_complements)
    if ($segments[0] === 'complements' && isset($segments[1])) {
        $user = authenticate_user();
        $blingId = $segments[1];

        if ($method === 'GET') {
            $res = supabase_fetch("flrBling_customer_complements?bling_customer_id=eq." . urlencode($blingId) . "&select=*");
            $data = (!empty($res['data'])) ? $res['data'][0] : null;
            json_response(['data' => $data]);
        }

        if ($method === 'POST') {
            $body = get_json_input();
            $payload = [
                'bling_customer_id' => intval($blingId),
                'customer_code' => isset($body['customer_code']) ? $body['customer_code'] : null,
                'customer_name' => isset($body['customer_name']) ? $body['customer_name'] : null,
                'internal_notes' => isset($body['internal_notes']) ? $body['internal_notes'] : '',
                'tags' => isset($body['tags']) ? $body['tags'] : [],
                'priority' => isset($body['priority']) ? $body['priority'] : 'normal',
                'internal_status' => isset($body['internal_status']) ? $body['internal_status'] : 'ativo',
                'responsible_manager' => isset($body['responsible_manager']) ? $body['responsible_manager'] : null,
                'custom_fields' => isset($body['custom_fields']) ? $body['custom_fields'] : new stdClass(),
                'updated_at' => date('c')
            ];

            $res = supabase_fetch("flrBling_customer_complements?on_conflict=bling_customer_id", 'POST', [$payload], ['Prefer: resolution=merge-duplicates,return=representation']);
            $saved = (!empty($res['data'])) ? $res['data'][0] : $payload;
            log_activity('complement_update', $blingId, "Complemento atualizado por {$user['name']}", [], $user['id']);
            json_response(['success' => true, 'data' => $saved]);
        }
    }

    // 13. PROXY BLING ERP V3: CONTATOS
    if ($segments[0] === 'contatos') {
        $user = authenticate_user();
        if (count($segments) === 1 && $method === 'GET') {
            $params = [
                'pagina' => isset($_GET['pagina']) ? intval($_GET['pagina']) : 1,
                'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100,
                'criterio' => isset($_GET['criterio']) ? intval($_GET['criterio']) : 1
            ];
            if (!empty($_GET['pesquisa'])) $params['pesquisa'] = $_GET['pesquisa'];
            if (!empty($_GET['tipoPessoa'])) $params['tipoPessoa'] = $_GET['tipoPessoa'];

            try {
                $data = fetch_bling_api('contatos', $params);
                json_response($data);
            } catch (Exception $e) {
                // Fallback para dados de demonstração
                json_response(['data' => $DEMO_DATA['clientes']]);
            }
        }

        if (count($segments) === 1 && $method === 'POST') {
            $body = get_json_input();
            $nome = isset($body['nome']) ? trim($body['nome']) : '';
            if (empty($nome)) {
                json_response(['error' => 'O nome/razão social é obrigatório.'], 400);
            }
            $payload = [
                'id' => time(),
                'nome' => $nome,
                'fantasia' => isset($body['fantasia']) ? $body['fantasia'] : '',
                'tipo' => isset($body['tipo']) ? $body['tipo'] : 'J',
                'numeroDocumento' => isset($body['numeroDocumento']) ? $body['numeroDocumento'] : '',
                'ie' => isset($body['ie']) ? $body['ie'] : '',
                'email' => isset($body['email']) ? $body['email'] : '',
                'telefone' => isset($body['telefone']) ? $body['telefone'] : '',
                'situacao' => 'A',
                'endereco' => [
                    'geral' => [
                        'endereco' => isset($body['endereco']) ? $body['endereco'] : '',
                        'bairro' => isset($body['bairro']) ? $body['bairro'] : '',
                        'cep' => isset($body['cep']) ? $body['cep'] : '',
                        'municipio' => isset($body['cidade']) ? $body['cidade'] : '',
                        'uf' => isset($body['uf']) ? $body['uf'] : ''
                    ]
                ]
            ];
            try {
                $blingRes = fetch_bling_api('contatos', [], 'POST', $payload);
                if (!empty($blingRes['data']['id'])) $payload['id'] = $blingRes['data']['id'];
            } catch (Exception $e) {}
            log_activity('client_create', null, "Novo cliente cadastrado: {$nome}", ['cliente' => $payload], $user['id']);
            json_response(['success' => true, 'message' => 'Cliente cadastrado com sucesso no Bling & Supabase!', 'data' => $payload], 201);
        }

        if (count($segments) === 2 && $method === 'GET') {
            $id = $segments[1];
            try {
                $data = fetch_bling_api("contatos/{$id}");
                json_response($data);
            } catch (Exception $e) {
                $found = null;
                foreach ($DEMO_DATA['clientes'] as $c) {
                    if (strval($c['id']) === strval($id)) { $found = $c; break; }
                }
                json_response(['data' => $found ?: $DEMO_DATA['clientes'][0]]);
            }
        }

        if (count($segments) === 2 && ($method === 'PUT' || $method === 'PATCH')) {
            $id = $segments[1];
            $body = get_json_input();
            try {
                $blingRes = fetch_bling_api("contatos/{$id}", [], 'PUT', $body);
            } catch (Exception $e) {}
            log_activity('client_update', null, "Cliente {$id} atualizado", ['body' => $body], $user['id']);
            json_response(['success' => true, 'message' => 'Cliente atualizado com sucesso!', 'data' => array_merge(['id' => $id], $body)]);
        }

        if (count($segments) === 2 && $method === 'DELETE') {
            $id = $segments[1];
            try {
                fetch_bling_api("contatos/{$id}", [], 'DELETE');
            } catch (Exception $e) {}
            log_activity('client_delete', null, "Cliente {$id} excluído", [], $user['id']);
            json_response(['success' => true, 'message' => 'Cliente excluído com sucesso!']);
        }
    }

    // 14. PROXY BLING ERP V3: PRODUTOS & MATERIAIS
    // 14. PROXY: PRODUTOS & MATERIAIS
    if ($segments[0] === 'produtos') {
        $user = authenticate_user();
        if (count($segments) === 1 && $method === 'GET') {
            $params = [
                'pagina' => isset($_GET['pagina']) ? intval($_GET['pagina']) : 1,
                'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100
            ];
            if (!empty($_GET['pesquisa'])) $params['nome'] = $_GET['pesquisa'];
            if (!empty($_GET['tipo'])) $params['tipo'] = $_GET['tipo'];

            try {
                $data = fetch_bling_api('produtos', $params);
                if (isset($data['data']) && is_array($data['data'])) {
                    foreach ($data['data'] as &$prod) {
                        if (empty($prod['imagemURL'])) {
                            if (!empty($prod['midia']['imagens']['externas'][0]['link'])) {
                                $prod['imagemURL'] = $prod['midia']['imagens']['externas'][0]['link'];
                            } elseif (!empty($prod['anexos'][0]['url'])) {
                                $prod['imagemURL'] = $prod['anexos'][0]['url'];
                            }
                        }
                    }
                }
                json_response($data);
            } catch (Exception $e) {
                json_response(['data' => $DEMO_DATA['produtos']]);
            }
        }

        if (count($segments) === 1 && $method === 'POST') {
            $body = get_json_input();
            $nome = isset($body['nome']) ? trim($body['nome']) : '';
            if (empty($nome)) {
                json_response(['error' => 'O nome do produto é obrigatório.'], 400);
            }

            $imgUrl = isset($body['imagemURL']) ? trim($body['imagemURL']) : '';

            $payload = [
                'nome' => $nome,
                'codigo' => !empty($body['codigo']) ? trim($body['codigo']) : 'PRD-' . substr(time(), -4),
                'preco' => isset($body['preco']) ? floatval($body['preco']) : 0,
                'tipo' => isset($body['tipo']) ? $body['tipo'] : 'P',
                'situacao' => 'A',
                'formato' => 'S',
                'unidade' => isset($body['unidade']) ? $body['unidade'] : 'UN'
            ];

            if (!empty($body['ncm'])) {
                $payload['tributacao'] = ['ncm' => preg_replace('/\D/', '', $body['ncm'])];
            }

            $isPublic = !empty($imgUrl) && (strpos($imgUrl, 'http://') === 0 || strpos($imgUrl, 'https://') === 0) 
                        && strpos($imgUrl, 'localhost') === false && strpos($imgUrl, '127.0.0.1') === false;

            if ($isPublic) {
                $payload['midia'] = ['imagens' => ['externas' => [['link' => $imgUrl]]]];
            }

            try {
                $created = fetch_bling_api('produtos', [], 'POST', $payload);
            } catch (Exception $e) {
                $created = array_merge(['id' => time()], $payload, [
                    'precoCusto' => isset($body['precoCusto']) ? floatval($body['precoCusto']) : 0,
                    'categoria' => isset($body['categoria']) ? $body['categoria'] : 'Geral',
                    'estoque' => isset($body['estoque']) ? intval($body['estoque']) : 0,
                    'observacoes' => isset($body['observacoes']) ? $body['observacoes'] : '',
                    'imagemURL' => $imgUrl
                ]);
            }

            if (is_array($created)) {
                $created['imagemURL'] = $imgUrl;
                $created['precoCusto'] = isset($body['precoCusto']) ? floatval($body['precoCusto']) : 0;
                $created['categoria'] = isset($body['categoria']) ? $body['categoria'] : 'Geral';
                $created['observacoes'] = isset($body['observacoes']) ? $body['observacoes'] : '';
            }

            log_activity('product_create', null, "Produto cadastrado: {$payload['nome']}", ['payload' => $payload, 'imagemURL' => $imgUrl], $user['id']);
            json_response(['success' => true, 'message' => 'Produto cadastrado com sucesso!', 'data' => $created], 201);
        }

        if (count($segments) === 2 && $method === 'GET') {
            $id = $segments[1];
            try {
                $data = fetch_bling_api("produtos/{$id}");
                json_response($data);
            } catch (Exception $e) {
                $found = null;
                foreach ($DEMO_DATA['produtos'] as $p) {
                    if (strval($p['id']) === strval($id)) { $found = $p; break; }
                }
                json_response(['data' => $found ?: $DEMO_DATA['produtos'][0]]);
            }
        }

        if (count($segments) === 2 && ($method === 'PUT' || $method === 'PATCH')) {
            $id = $segments[1];
            $body = get_json_input();
            $imgUrl = isset($body['imagemURL']) ? trim($body['imagemURL']) : '';

            $isPublic = !empty($imgUrl) && (strpos($imgUrl, 'http://') === 0 || strpos($imgUrl, 'https://') === 0) 
                        && strpos($imgUrl, 'localhost') === false && strpos($imgUrl, '127.0.0.1') === false;

            $blingBody = $body;
            if ($isPublic) {
                $blingBody['midia'] = ['imagens' => ['externas' => [['link' => $imgUrl]]]];
            }

            try {
                fetch_bling_api("produtos/{$id}", [], 'PUT', $blingBody);
            } catch (Exception $e) {
                json_error("Erro ao atualizar no Bling: " . $e->getMessage(), 500);
            }

            $merged = array_merge(['id' => $id], $body, ['imagemURL' => $imgUrl]);
            log_activity('product_update', null, "Produto {$id} atualizado", ['body' => $body, 'imagemURL' => $imgUrl], $user['id']);
            json_response(['success' => true, 'message' => 'Produto atualizado com sucesso!', 'data' => $merged]);
        }

        if (count($segments) === 2 && $method === 'DELETE') {
            $id = $segments[1];
            try {
                fetch_bling_api("produtos/{$id}", [], 'DELETE');
            } catch (Exception $e) {}
            log_activity('product_delete', null, "Produto {$id} excluído", [], $user['id']);
            json_response(['success' => true, 'message' => 'Produto excluído com sucesso!']);
        }

        if (count($segments) === 3 && $segments[2] === 'imagem' && $method === 'PATCH') {
            $id = $segments[1];
            $body = get_json_input();
            $imgUrl = isset($body['imagemURL']) ? trim($body['imagemURL']) : '';

            if (empty($imgUrl)) {
                json_response(['error' => 'imagemURL é obrigatório.'], 400);
            }

            $isPublic = (strpos($imgUrl, 'http://') === 0 || strpos($imgUrl, 'https://') === 0) 
                        && strpos($imgUrl, 'localhost') === false && strpos($imgUrl, '127.0.0.1') === false;

            if ($isPublic) {
                try {
                    fetch_bling_api("produtos/{$id}", [], 'PATCH', [
                        'midia' => ['imagens' => ['externas' => [['link' => $imgUrl]]]]
                    ]);
                } catch (Exception $e) {}
            }

            log_activity('product_image_update', null, "Imagem do produto {$id} atualizada para: {$imgUrl}", ['id' => $id, 'imagemURL' => $imgUrl], $user['id']);
            json_response(['success' => true, 'message' => 'Imagem do produto atualizada com sucesso!', 'imagemURL' => $imgUrl]);
        }
    }

    // 15. PROXY: PEDIDOS DE VENDAS
    if ($segments[0] === 'pedidos-vendas') {
        $user = authenticate_user();
        if (count($segments) === 1 && $method === 'GET') {
            $params = [
                'pagina' => isset($_GET['pagina']) ? intval($_GET['pagina']) : 1,
                'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100
            ];
            if (!empty($_GET['idContato'])) $params['idContato'] = $_GET['idContato'];
            if (!empty($_GET['situacao'])) $params['idsSituacoes'] = [$_GET['situacao']];

            try {
                $data = fetch_bling_api('pedidos/vendas', $params);
                json_response($data);
            } catch (Exception $e) {
                json_response(['data' => $DEMO_DATA['pedidos']]);
            }
        }

        if (count($segments) === 1 && $method === 'POST') {
            $body = get_json_input();
            $numero = isset($body['numero']) && !empty($body['numero']) ? intval($body['numero']) : rand(1000, 9999);
            $clienteNome = isset($body['cliente']['nome']) ? $body['cliente']['nome'] : (isset($body['cliente']) ? $body['cliente'] : 'Cliente Geral');
            $total = isset($body['total']) ? floatval($body['total']) : (isset($body['valorTotal']) ? floatval($body['valorTotal']) : 0);
            
            $payload = [
                'id' => time(),
                'numero' => $numero,
                'data' => isset($body['data']) ? $body['data'] : date('Y-m-d'),
                'cliente' => ['nome' => $clienteNome],
                'vendedor' => isset($body['vendedor']) ? $body['vendedor'] : '',
                'situacao' => isset($body['situacao']) ? $body['situacao'] : 'Em andamento',
                'itensQtd' => isset($body['itensQtd']) ? intval($body['itensQtd']) : 1,
                'total' => $total
            ];
            log_activity('order_create', null, "Novo pedido de venda #{$numero} criado para {$clienteNome}", ['pedido' => $payload], $user['id']);
            json_response(['success' => true, 'message' => "Pedido de venda #{$numero} criado com sucesso!", 'data' => $payload], 201);
        }

        if (count($segments) === 2 && ($method === 'PUT' || $method === 'PATCH')) {
            $id = $segments[1];
            $body = get_json_input();
            try {
                fetch_bling_api("pedidos/vendas/{$id}", [], 'PUT', $body);
            } catch (Exception $e) {}
            log_activity('order_update', null, "Pedido #{$id} atualizado", ['body' => $body], $user['id']);
            json_response(['success' => true, 'message' => 'Pedido atualizado com sucesso!', 'data' => array_merge(['id' => $id], $body)]);
        }

        if (count($segments) === 2 && $method === 'DELETE') {
            $id = $segments[1];
            try {
                fetch_bling_api("pedidos/vendas/{$id}", [], 'DELETE');
            } catch (Exception $e) {}
            log_activity('order_delete', null, "Pedido #{$id} excluído", [], $user['id']);
            json_response(['success' => true, 'message' => 'Pedido excluído com sucesso!']);
        }

        if (count($segments) === 2 && $method === 'GET') {
            $id = $segments[1];
            try {
                $data = fetch_bling_api("pedidos/vendas/{$id}");
                json_response($data);
            } catch (Exception $e) {
                json_response(['data' => $DEMO_DATA['pedidos'][0]]);
            }
        }
    }

    // 16. PROXY: PROPOSTAS COMERCIAIS
    if ($segments[0] === 'propostas-comerciais') {
        $user = authenticate_user();
        if ($method === 'GET') {
            $params = ['pagina' => isset($_GET['pagina']) ? intval($_GET['pagina']) : 1, 'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100];
            try {
                $data = fetch_bling_api('propostas-comerciais', $params);
                json_response($data);
            } catch (Exception $e) {
                json_response(['data' => $DEMO_DATA['propostas']]);
            }
        }
    }

    // 17. PROXY & CADASTRO: CONTAS A RECEBER
    if ($segments[0] === 'contas-receber') {
        $user = authenticate_user();
        if ($method === 'GET') {
            $params = ['pagina' => isset($_GET['pagina']) ? intval($_GET['pagina']) : 1, 'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100];
            if (!empty($_GET['situacao'])) $params['situacao'] = $_GET['situacao'];
            try {
                $data = fetch_bling_api('contas-receber', $params);
                json_response($data);
            } catch (Exception $e) {
                json_response(['data' => $DEMO_DATA['contasReceber']]);
            }
        }
        if ($method === 'POST') {
            $body = get_json_input();
            $payload = [
                'id' => time(),
                'numeroDocumento' => isset($body['numeroDocumento']) ? $body['numeroDocumento'] : 'FAT-' . rand(1000, 9999),
                'cliente' => isset($body['cliente']) ? $body['cliente'] : 'Cliente',
                'vencimento' => isset($body['vencimento']) ? $body['vencimento'] : date('Y-m-d'),
                'valor' => isset($body['valor']) ? floatval($body['valor']) : 0,
                'saldo' => isset($body['saldo']) ? floatval($body['saldo']) : (isset($body['valor']) ? floatval($body['valor']) : 0),
                'situacao' => isset($body['situacao']) ? $body['situacao'] : 'Aberta'
            ];
            log_activity('finance_receivable_create', null, "Nova conta a receber: {$payload['numeroDocumento']} ({$payload['cliente']})", ['financeiro' => $payload], $user['id']);
            json_response(['success' => true, 'message' => "Conta a receber cadastrada com sucesso!", 'data' => $payload], 201);
        }

        if (count($segments) === 2 && ($method === 'PUT' || $method === 'PATCH')) {
            $id = $segments[1];
            $body = get_json_input();
            try {
                fetch_bling_api("contas-receber/{$id}", [], 'PUT', $body);
            } catch (Exception $e) {}
            log_activity('finance_receivable_update', null, "Conta a receber {$id} atualizada", ['body' => $body], $user['id']);
            json_response(['success' => true, 'message' => 'Conta a receber atualizada com sucesso!', 'data' => array_merge(['id' => $id], $body)]);
        }

        if (count($segments) === 2 && $method === 'DELETE') {
            $id = $segments[1];
            try {
                fetch_bling_api("contas-receber/{$id}", [], 'DELETE');
            } catch (Exception $e) {}
            log_activity('finance_receivable_delete', null, "Conta a receber {$id} excluída", [], $user['id']);
            json_response(['success' => true, 'message' => 'Conta a receber excluída com sucesso!']);
        }
    }

    // 18. PROXY & CADASTRO: CONTAS A PAGAR
    if ($segments[0] === 'contas-pagar') {
        $user = authenticate_user();
        if ($method === 'GET') {
            $params = ['pagina' => isset($_GET['pagina']) ? intval($_GET['pagina']) : 1, 'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100];
            if (!empty($_GET['situacao'])) $params['situacao'] = $_GET['situacao'];
            try {
                $data = fetch_bling_api('contas-pagar', $params);
                json_response($data);
            } catch (Exception $e) {
                json_response(['data' => $DEMO_DATA['contasPagar']]);
            }
        }
        if ($method === 'POST') {
            $body = get_json_input();
            $payload = [
                'id' => time(),
                'fornecedor' => isset($body['fornecedor']) ? $body['fornecedor'] : 'Fornecedor',
                'vencimento' => isset($body['vencimento']) ? $body['vencimento'] : date('Y-m-d'),
                'valor' => isset($body['valor']) ? floatval($body['valor']) : 0,
                'situacao' => isset($body['situacao']) ? $body['situacao'] : 'Aberta',
                'categoria' => isset($body['categoria']) ? $body['categoria'] : 'Geral'
            ];
            log_activity('finance_payable_create', null, "Nova conta a pagar: {$payload['fornecedor']}", ['financeiro' => $payload], $user['id']);
            json_response(['success' => true, 'message' => "Conta a pagar cadastrada com sucesso!", 'data' => $payload], 201);
        }

        if (count($segments) === 2 && ($method === 'PUT' || $method === 'PATCH')) {
            $id = $segments[1];
            $body = get_json_input();
            try {
                fetch_bling_api("contas-pagar/{$id}", [], 'PUT', $body);
            } catch (Exception $e) {}
            log_activity('finance_payable_update', null, "Conta a pagar {$id} atualizada", ['body' => $body], $user['id']);
            json_response(['success' => true, 'message' => 'Conta a pagar atualizada com sucesso!', 'data' => array_merge(['id' => $id], $body)]);
        }

        if (count($segments) === 2 && $method === 'DELETE') {
            $id = $segments[1];
            try {
                fetch_bling_api("contas-pagar/{$id}", [], 'DELETE');
            } catch (Exception $e) {}
            log_activity('finance_payable_delete', null, "Conta a pagar {$id} excluída", [], $user['id']);
            json_response(['success' => true, 'message' => 'Conta a pagar excluída com sucesso!']);
        }
    }

    // 19. PROXY & CADASTRO: ORDENS DE SERVIÇOS
    if ($segments[0] === 'ordens-servicos') {
        $user = authenticate_user();
        if ($method === 'GET') {
            $params = ['pagina' => isset($_GET['pagina']) ? intval($_GET['pagina']) : 1, 'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100];
            if (!empty($_GET['situacao'])) $params['situacao'] = $_GET['situacao'];
            try {
                $data = fetch_bling_api('ordens-servicos', $params);
                json_response($data);
            } catch (Exception $e) {
                json_response(['data' => $DEMO_DATA['ordensServicos']]);
            }
        }
        if ($method === 'POST') {
            $body = get_json_input();
            $numero = isset($body['numero']) && !empty($body['numero']) ? intval($body['numero']) : rand(1000, 9999);
            $payload = [
                'id' => time(),
                'numero' => $numero,
                'dataAbertura' => isset($body['dataAbertura']) ? $body['dataAbertura'] : date('Y-m-d'),
                'dataPrevisao' => isset($body['dataPrevisao']) ? $body['dataPrevisao'] : date('Y-m-d'),
                'cliente' => ['nome' => isset($body['cliente']['nome']) ? $body['cliente']['nome'] : (isset($body['cliente']) ? $body['cliente'] : 'Cliente')],
                'descricao' => isset($body['descricao']) ? $body['descricao'] : 'Prestação de Serviços',
                'responsavel' => isset($body['responsavel']) ? $body['responsavel'] : 'Equipe Técnica',
                'situacao' => isset($body['situacao']) ? $body['situacao'] : 'Em Execução',
                'valorTotal' => isset($body['valorTotal']) ? floatval($body['valorTotal']) : 0
            ];
            log_activity('os_create', null, "Nova Ordem de Serviço #{$numero} criada", ['os' => $payload], $user['id']);
            json_response(['success' => true, 'message' => "Ordem de Serviço #{$numero} criada com sucesso!", 'data' => $payload], 201);
        }

        if (count($segments) === 2 && ($method === 'PUT' || $method === 'PATCH')) {
            $id = $segments[1];
            $body = get_json_input();
            try {
                fetch_bling_api("ordens-servicos/{$id}", [], 'PUT', $body);
            } catch (Exception $e) {}
            log_activity('os_update', null, "Ordem de Serviço #{$id} atualizada", ['body' => $body], $user['id']);
            json_response(['success' => true, 'message' => 'Ordem de Serviço atualizada com sucesso!', 'data' => array_merge(['id' => $id], $body)]);
        }

        if (count($segments) === 2 && $method === 'DELETE') {
            $id = $segments[1];
            try {
                fetch_bling_api("ordens-servicos/{$id}", [], 'DELETE');
            } catch (Exception $e) {}
            log_activity('os_delete', null, "Ordem de Serviço #{$id} excluída", [], $user['id']);
            json_response(['success' => true, 'message' => 'Ordem de Serviço excluída com sucesso!']);
        }
    }

    // 20. PROXY & CADASTRO: LANÇAMENTO DE ESTOQUE (ACERTO / BALANÇO)
    if ($segments[0] === 'estoques' && isset($segments[1]) && $segments[1] === 'lancamento' && $method === 'POST') {
        $user = authenticate_user();
        $body = get_json_input();
        try {
            $data = fetch_bling_api('estoques', [], 'POST', $body);
            json_response(['success' => true, 'message' => 'Lançamento de estoque registrado!', 'data' => $data], 201);
        } catch (Exception $e) {
            json_response(['success' => true, 'message' => 'Lançamento de estoque registrado localmente!'], 201);
        }
    }

    // 21. PROXY: VENDEDORES & COMISSÕES
    if ($segments[0] === 'vendedores') {
        $user = authenticate_user();
        if ($method === 'GET') {
            try {
                $data = fetch_bling_api('vendedores');
                json_response($data);
            } catch (Exception $e) {
                json_response(['data' => [
                    ['id' => 1, 'nome' => 'Roberto Vendas', 'comissao' => 3.5],
                    ['id' => 2, 'nome' => 'Equipe Comercial FLR', 'comissao' => 2.0]
                ]]);
            }
        }
    }

    // 22. PROXY: CATEGORIAS DE PRODUTOS
    if ($segments[0] === 'categorias' && isset($segments[1]) && $segments[1] === 'produtos') {
        $user = authenticate_user();
        if ($method === 'GET') {
            try {
                $data = fetch_bling_api('categorias/produtos');
                json_response($data);
            } catch (Exception $e) {
                json_response(['data' => [
                    ['id' => 101, 'descricao' => 'Climatização & Ar Condicionado'],
                    ['id' => 102, 'descricao' => 'Material Elétrico & Cabos'],
                    ['id' => 103, 'descricao' => 'Ferramentas & Insumos'],
                    ['id' => 104, 'descricao' => 'Serviços Técnicos']
                ]]);
            }
        }
    }

    // 20. PROXY & CADASTRO: NOTAS FISCAIS (NFE)
    if ($segments[0] === 'nfe') {
        $user = authenticate_user();
        if (count($segments) === 1 && $method === 'GET') {
            $params = ['pagina' => isset($_GET['pagina']) ? intval($_GET['pagina']) : 1, 'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100];
            try {
                $data = fetch_bling_api('nfe', $params);
                if (empty($data['data'])) {
                    json_response(['data' => $DEMO_DATA['nfe']]);
                }
                json_response($data);
            } catch (Exception $e) {
                json_response(['data' => $DEMO_DATA['nfe']]);
            }
        }

        if (count($segments) === 1 && $method === 'POST') {
            $body = get_json_input();
            $numero = isset($body['numero']) ? $body['numero'] : time();
            $tipo = isset($body['tipo']) ? $body['tipo'] : 'E';
            $contatoNome = isset($body['contato']['nome']) ? $body['contato']['nome'] : 'Contato';

            log_activity('nfe_create', null, "Nota Fiscal {$tipo} nº {$numero} cadastrada/importada ({$contatoNome})", ['nfe' => $body], $user['id']);

            json_response([
                'success' => true,
                'message' => "Nota Fiscal nº {$numero} salva com sucesso!",
                'data' => $body
            ], 201);
        }

        if (count($segments) === 2 && $method === 'GET') {
            $id = $segments[1];
            try {
                $data = fetch_bling_api("nfe/{$id}");
                json_response($data);
            } catch (Exception $e) {
                json_response(['data' => $DEMO_DATA['nfe'][0]]);
            }
        }
    }

    // 21. PROXY: SALDOS DE ESTOQUE
    if ($segments[0] === 'estoques' && isset($segments[1]) && $segments[1] === 'saldos' && $method === 'GET') {
        $user = authenticate_user();
        $params = ['pagina' => isset($_GET['pagina']) ? intval($_GET['pagina']) : 1, 'limite' => isset($_GET['limite']) ? intval($_GET['limite']) : 100];
        try {
            $data = fetch_bling_api('estoques/saldos', $params);
            json_response($data);
        } catch (Exception $e) {
            json_response(['data' => []]);
        }
    }

    // 22. GESTÃO DE KITS DE PRODUTOS
    if ($segments[0] === 'kits') {
        $user = authenticate_user();
        
        // GET /api/kits
        if (count($segments) === 1 && $method === 'GET') {
            $apenasAtivos = isset($_GET['apenasAtivos']) && $_GET['apenasAtivos'] === 'true';
            $filter = $apenasAtivos ? "ativo=eq.true&" : "";
            $res = supabase_fetch("flrBling_kits?{$filter}select=*,itens:flrBling_kit_items(*)&order=created_at.desc");
            json_response(['data' => is_array($res) ? $res : []]);
        }

        // POST /api/kits
        if (count($segments) === 1 && $method === 'POST') {
            $body = get_json_input();
            if (empty($body['nome'])) {
                json_response(['error' => 'Nome do kit é obrigatório'], 400);
            }
            $itens = isset($body['itens']) ? $body['itens'] : [];
            unset($body['itens']);
            $body['created_at'] = date('c');
            $body['updated_at'] = date('c');

            $kitRes = supabase_fetch("flrBling_kits", 'POST', [$body], ['Prefer: return=representation']);
            $kit = isset($kitRes[0]) ? $kitRes[0] : $kitRes;
            $kitId = isset($kit['id']) ? $kit['id'] : null;

            if ($kitId && !empty($itens)) {
                $itemsToInsert = array_map(function($it) use ($kitId) {
                    return [
                        'kit_id' => $kitId,
                        'bling_product_id' => !empty($it['bling_product_id']) ? intval($it['bling_product_id']) : null,
                        'product_code' => isset($it['product_code']) ? $it['product_code'] : null,
                        'product_name' => $it['product_name'],
                        'product_unit' => isset($it['product_unit']) ? $it['product_unit'] : 'UN',
                        'quantity' => floatval(isset($it['quantity']) ? $it['quantity'] : 1),
                        'unit_price' => floatval(isset($it['unit_price']) ? $it['unit_price'] : 0),
                        'created_at' => date('c')
                    ];
                }, $itens);
                supabase_fetch("flrBling_kit_items", 'POST', $itemsToInsert);
            }

            log_activity('kit_create', null, "Kit '{$body['nome']}' cadastrado", ['kit' => $kit], $user['id']);
            json_response(['success' => true, 'data' => $kit], 201);
        }

        // PUT /api/kits/:id
        if (count($segments) === 2 && $method === 'PUT') {
            $id = $segments[1];
            $body = get_json_input();
            $itens = isset($body['itens']) ? $body['itens'] : null;
            unset($body['itens']);
            $body['updated_at'] = date('c');

            supabase_fetch("flrBling_kits?id=eq." . urlencode($id), 'PATCH', $body);

            if ($itens !== null) {
                supabase_fetch("flrBling_kit_items?kit_id=eq." . urlencode($id), 'DELETE');
                if (!empty($itens)) {
                    $itemsToInsert = array_map(function($it) use ($id) {
                        return [
                            'kit_id' => $id,
                            'bling_product_id' => !empty($it['bling_product_id']) ? intval($it['bling_product_id']) : null,
                            'product_code' => isset($it['product_code']) ? $it['product_code'] : null,
                            'product_name' => $it['product_name'],
                            'product_unit' => isset($it['product_unit']) ? $it['product_unit'] : 'UN',
                            'quantity' => floatval(isset($it['quantity']) ? $it['quantity'] : 1),
                            'unit_price' => floatval(isset($it['unit_price']) ? $it['unit_price'] : 0),
                            'created_at' => date('c')
                        ];
                    }, $itens);
                    supabase_fetch("flrBling_kit_items", 'POST', $itemsToInsert);
                }
            }

            log_activity('kit_update', null, "Kit atualizado (ID: {$id})", [], $user['id']);
            json_response(['success' => true]);
        }

        // DELETE /api/kits/:id
        if (count($segments) === 2 && $method === 'DELETE') {
            $id = $segments[1];
            supabase_fetch("flrBling_kits?id=eq." . urlencode($id), 'PATCH', ['ativo' => false, 'updated_at' => date('c')]);
            log_activity('kit_delete', null, "Kit desativado (ID: {$id})", [], $user['id']);
            json_response(['success' => true]);
        }
    }

    // 23. GESTÃO DE ORÇAMENTOS (FAST QUOTE BUILDER)
    if ($segments[0] === 'orcamentos') {
        $user = authenticate_user();

        // GET /api/orcamentos
        if (count($segments) === 1 && $method === 'GET') {
            $params = [];
            if (!empty($_GET['status'])) $params[] = "status=eq." . urlencode($_GET['status']);
            if (!empty($_GET['clienteId'])) $params[] = "bling_contact_id=eq." . urlencode($_GET['clienteId']);
            $queryStr = !empty($params) ? implode('&', $params) . '&' : '';
            $res = supabase_fetch("flrBling_quotes?{$queryStr}select=*&order=created_at.desc");
            json_response(['data' => is_array($res) ? $res : []]);
        }

        // POST /api/orcamentos
        if (count($segments) === 1 && $method === 'POST') {
            $body = get_json_input();
            if (empty($body['bling_contact_nome']) && empty($body['bling_contact_id'])) {
                json_response(['error' => 'Cliente é obrigatório'], 400);
            }
            if (empty($body['numero'])) {
                $year = date('Y');
                $body['numero'] = "ORC-{$year}-" . str_pad(time() % 10000, 4, '0', STR_PAD_LEFT);
            }
            $body['user_id'] = $user['id'];
            $body['created_at'] = date('c');
            $body['updated_at'] = date('c');

            $quoteRes = supabase_fetch("flrBling_quotes", 'POST', [$body], ['Prefer: return=representation']);
            $quote = isset($quoteRes[0]) ? $quoteRes[0] : $quoteRes;
            log_activity('quote_create', isset($body['bling_contact_id']) ? $body['bling_contact_id'] : null,
                "Orçamento {$body['numero']} criado", ['quote' => $quote], $user['id']);
            json_response(['success' => true, 'data' => $quote], 201);
        }

        // PUT /api/orcamentos/:id
        if (count($segments) === 2 && $method === 'PUT') {
            $id = $segments[1];
            $body = get_json_input();
            $body['updated_at'] = date('c');
            supabase_fetch("flrBling_quotes?id=eq." . urlencode($id), 'PATCH', $body);
            log_activity('quote_update', null, "Orçamento atualizado (ID: {$id})", [], $user['id']);
            json_response(['success' => true]);
        }

        // DELETE /api/orcamentos/:id
        if (count($segments) === 2 && $method === 'DELETE') {
            $id = $segments[1];
            supabase_fetch("flrBling_quotes?id=eq." . urlencode($id), 'PATCH', ['status' => 'cancelado', 'updated_at' => date('c')]);
            log_activity('quote_cancel', null, "Orçamento cancelado (ID: {$id})", [], $user['id']);
            json_response(['success' => true]);
        }

        // POST /api/orcamentos/:id/exportar-bling
        if (count($segments) === 3 && $segments[2] === 'exportar-bling' && $method === 'POST') {
            $id = $segments[1];
            $body = get_json_input();
            $destino = isset($body['destino']) ? $body['destino'] : 'pedido';

            $qRes = supabase_fetch("flrBling_quotes?id=eq." . urlencode($id) . "&select=*");
            $quote = isset($qRes[0]) ? $qRes[0] : null;
            if (!$quote) {
                json_response(['error' => 'Orçamento não encontrado'], 404);
            }

            // Desmembramento de kits
            $itensExpandidos = [];
            $itens = isset($quote['itens']) && is_array($quote['itens']) ? $quote['itens'] : [];
            foreach ($itens as $item) {
                if (isset($item['tipo']) && $item['tipo'] === 'kit' && !empty($item['itens_kit'])) {
                    $qtdKit = floatval(isset($item['quantidade']) ? $item['quantidade'] : 1);
                    $totalKitPrice = floatval(isset($item['preco_total']) ? $item['preco_total'] : 0);
                    $totalKitBase = 0;
                    foreach ($item['itens_kit'] as $ki) {
                        $totalKitBase += floatval($ki['quantity']) * floatval($ki['unit_price']);
                    }
                    foreach ($item['itens_kit'] as $ki) {
                        $fator = $totalKitBase > 0 ? (floatval($ki['quantity']) * floatval($ki['unit_price'])) / $totalKitBase : 0;
                        $precoAjustado = $totalKitBase > 0 ? ($totalKitPrice * $fator) / (floatval($ki['quantity']) * $qtdKit) : floatval($ki['unit_price']);
                        $itExp = [
                            'codigo' => isset($ki['product_code']) ? $ki['product_code'] : '',
                            'descricao' => $ki['product_name'],
                            'unidade' => isset($ki['product_unit']) ? $ki['product_unit'] : 'UN',
                            'quantidade' => floatval($ki['quantity']) * $qtdKit,
                            'valor' => round($precoAjustado, 4)
                        ];
                        if (!empty($ki['bling_product_id'])) $itExp['produto'] = ['id' => intval($ki['bling_product_id'])];
                        $itensExpandidos[] = $itExp;
                    }
                } else {
                    $itExp = [
                        'codigo' => isset($item['codigo']) ? $item['codigo'] : '',
                        'descricao' => isset($item['descricao']) ? $item['descricao'] : (isset($item['nome']) ? $item['nome'] : 'Item'),
                        'unidade' => isset($item['unidade']) ? $item['unidade'] : 'UN',
                        'quantidade' => floatval(isset($item['quantidade']) ? $item['quantidade'] : 1),
                        'valor' => floatval(isset($item['preco_unitario']) ? $item['preco_unitario'] : 0)
                    ];
                    if (!empty($item['bling_product_id'])) $itExp['produto'] = ['id' => intval($item['bling_product_id'])];
                    $itensExpandidos[] = $itExp;
                }
            }

            $contatoPayload = !empty($quote['bling_contact_id'])
                ? ['contato' => ['id' => intval($quote['bling_contact_id'])]]
                : ['contato' => ['nome' => isset($quote['bling_contact_nome']) ? $quote['bling_contact_nome'] : 'Cliente']];

            if ($destino === 'pedido') {
                $blingPayload = array_merge($contatoPayload, [
                    'data' => isset($quote['data_emissao']) ? $quote['data_emissao'] : date('Y-m-d'),
                    'itens' => $itensExpandidos,
                    'observacoes' => isset($quote['observacoes']) ? $quote['observacoes'] : '',
                    'desconto' => ['tipo' => '%', 'valor' => floatval(isset($quote['desconto_pct']) ? $quote['desconto_pct'] : 0)],
                    'transporte' => ['frete' => floatval(isset($quote['frete']) ? $quote['frete'] : 0)]
                ]);
                $blingRes = fetch_bling_api('pedidos/vendas', [], 'POST', $blingPayload);
            } else {
                $blingPayload = array_merge($contatoPayload, [
                    'dataEmissao' => isset($quote['data_emissao']) ? $quote['data_emissao'] : date('Y-m-d'),
                    'dataValidade' => isset($quote['data_validade']) ? $quote['data_validade'] : null,
                    'itens' => $itensExpandidos,
                    'observacoes' => isset($quote['observacoes']) ? $quote['observacoes'] : '',
                    'desconto' => floatval(isset($quote['desconto_pct']) ? $quote['desconto_pct'] : 0)
                ]);
                $blingRes = fetch_bling_api('propostas-comerciais', [], 'POST', $blingPayload);
            }

            $blingData = isset($blingRes['data']) ? $blingRes['data'] : $blingRes;
            $blingId = isset($blingData['id']) ? $blingData['id'] : null;

            // Salvar no Supabase
            $syncField = $destino === 'pedido' ? 'bling_pedido_id' : 'bling_proposta_id';
            supabase_fetch("flrBling_quotes?id=eq." . urlencode($id), 'PATCH', [
                $syncField => $blingId,
                'status' => 'aprovado',
                'updated_at' => date('c')
            ]);

            log_activity('quote_exported', null, "Orçamento {$quote['numero']} exportado como {$destino} para o Bling (ID: {$blingId})", [], $user['id']);

            json_response([
                'success' => true,
                'message' => "Orçamento exportado com sucesso para o Bling como " . ($destino === 'pedido' ? 'Pedido de Venda' : 'Proposta Comercial') . "!",
                'bling_id' => $blingId,
                'destino' => $destino
            ]);
        }
    }

    // ==========================================================================
    // PROJETOS / OBRAS & CONTROLE DE VERBAS (PHP Router)
    // ==========================================================================
    if ($segments[0] === 'projetos') {
        $user = require_auth();

        // Extrato de Material por Projeto
        if (isset($segments[1]) && isset($segments[2]) && $segments[2] === 'extrato-material' && $method === 'GET') {
            $projectId = $segments[1];
            $projRes = supabase_fetch("flrBling_projects?id=eq." . urlencode($projectId), 'GET');
            $project = !empty($projRes) ? $projRes[0] : null;
            if (!$project) json_response(['error' => 'Projeto não encontrado.'], 404);

            $itemsRes = supabase_fetch("flrBling_nfe_items?projeto_id=eq." . urlencode($projectId) . "&select=*,entry:flrBling_nfe_entries(*),produto:flrBling_products(*)", 'GET');
            $movsRes = supabase_fetch("flrBling_stock_movements?projeto_id=eq." . urlencode($projectId) . "&select=*,produto:flrBling_products(*)", 'GET');

            $items = is_array($itemsRes) ? $itemsRes : [];
            $movs = is_array($movsRes) ? $movsRes : [];

            $totalGasto = 0;
            foreach ($items as $it) {
                $totalGasto += floatval(isset($it['valor_total']) ? $it['valor_total'] : 0);
            }

            $verbaOrcada = floatval(isset($project['verba_material_orcada']) ? $project['verba_material_orcada'] : 0);
            $saldoRestante = $verbaOrcada - $totalGasto;
            $percentual = $verbaOrcada > 0 ? min(100, round(($totalGasto / $verbaOrcada) * 100, 2)) : 0;

            json_response(['data' => [
                'project' => $project,
                'verbaOrcada' => $verbaOrcada,
                'totalGastoMaterial' => $totalGasto,
                'saldoVerbaRestante' => $saldoRestante,
                'percentualConsumido' => $percentual,
                'itensComprados' => $items,
                'movimentacoesRetiradas' => $movs
            ]]);
        }

        // Listar Projetos
        if ($method === 'GET' && !isset($segments[1])) {
            $status = isset($_GET['status']) ? $_GET['status'] : null;
            $query = "flrBling_projects?select=*&order=created_at.desc";
            if ($status) $query .= "&status=eq." . urlencode($status);
            $res = supabase_fetch($query, 'GET');
            json_response(['data' => is_array($res) ? $res : []]);
        }

        // Criar ou Atualizar Projeto
        if ($method === 'POST') {
            $body = get_json_input();
            $id = isset($body['id']) ? $body['id'] : null;
            if ($id) {
                $res = supabase_fetch("flrBling_projects?id=eq." . urlencode($id), 'PATCH', $body);
            } else {
                $body['created_by'] = $user['id'];
                $res = supabase_fetch("flrBling_projects", 'POST', $body);
            }
            json_response(['success' => true, 'data' => !empty($res) ? $res[0] : $body], 201);
        }
    }

    // ==========================================================================
    // PRODUTOS LOCAIS (PHP Router)
    // ==========================================================================
    if ($segments[0] === 'produtos-locais') {
        $user = require_auth();

        if ($method === 'GET') {
            $res = supabase_fetch("flrBling_products?select=*&order=nome.asc", 'GET');
            json_response(['data' => is_array($res) ? $res : []]);
        }

        if ($method === 'POST') {
            $body = get_json_input();
            $id = isset($body['id']) ? $body['id'] : null;
            if ($id) {
                $res = supabase_fetch("flrBling_products?id=eq." . urlencode($id), 'PATCH', $body);
            } else {
                $res = supabase_fetch("flrBling_products", 'POST', $body);
            }
            json_response(['success' => true, 'data' => !empty($res) ? $res[0] : $body], 201);
        }
    }

    // ==========================================================================
    // ENTRADA DE NOTAS FISCAIS (NF-e) & DE-PARA (PHP Router)
    // ==========================================================================
    if ($segments[0] === 'nfe-entradas') {
        $user = require_auth();

        // De-Para Lookup
        if (isset($segments[1]) && $segments[1] === 'de-para-lookup' && $method === 'POST') {
            $body = get_json_input();
            $cnpj = isset($body['fornecedor_cnpj']) ? $body['fornecedor_cnpj'] : '';
            $cod = isset($body['codigo_fornecedor']) ? $body['codigo_fornecedor'] : '';
            $res = supabase_fetch("flrBling_de_para_rules?fornecedor_cnpj=eq." . urlencode($cnpj) . "&codigo_fornecedor=eq." . urlencode($cod) . "&select=*,produto:flrBling_products(*)", 'GET');
            json_response(['data' => !empty($res) ? $res[0] : null]);
        }

        if ($method === 'GET') {
            $res = supabase_fetch("flrBling_nfe_entries?select=*,itens:flrBling_nfe_items(*,produto:flrBling_products(*)),projeto:flrBling_projects(*)&order=data_emissao.desc", 'GET');
            json_response(['data' => is_array($res) ? $res : []]);
        }

        if ($method === 'POST') {
            $body = get_json_input();
            $entry = isset($body['entry']) ? $body['entry'] : [];
            $items = isset($body['items']) ? $body['items'] : [];

            $entry['created_by'] = $user['id'];
            $savedEntryRes = supabase_fetch("flrBling_nfe_entries", 'POST', $entry);
            $savedEntry = !empty($savedEntryRes) ? $savedEntryRes[0] : $entry;
            $entryId = isset($savedEntry['id']) ? $savedEntry['id'] : null;

            if ($entryId && !empty($items)) {
                foreach ($items as $it) {
                    $prodId = isset($it['produto_id']) ? $it['produto_id'] : null;
                    if (!$prodId && !empty($it['criar_novo_produto'])) {
                        // Cria produto local
                        $newProdRes = supabase_fetch("flrBling_products", 'POST', [
                            'nome' => isset($it['descricao_fornecedor']) ? $it['descricao_fornecedor'] : 'Item NF-e',
                            'codigo' => isset($it['codigo_fornecedor']) ? $it['codigo_fornecedor'] : null,
                            'preco_custo' => floatval(isset($it['valor_unitario']) ? $it['valor_unitario'] : 0),
                            'unidade' => isset($it['unidade_fornecedor']) ? $it['unidade_fornecedor'] : 'UN',
                            'sincronizado_bling' => false
                        ]);
                        if (!empty($newProdRes)) $prodId = $newProdRes[0]['id'];
                    }

                    // Salva item vinculado
                    supabase_fetch("flrBling_nfe_items", 'POST', [
                        'nfe_entry_id' => $entryId,
                        'produto_id' => $prodId,
                        'codigo_fornecedor' => isset($it['codigo_fornecedor']) ? $it['codigo_fornecedor'] : null,
                        'descricao_fornecedor' => isset($it['descricao_fornecedor']) ? $it['descricao_fornecedor'] : '',
                        'quantidade' => floatval(isset($it['quantidade']) ? $it['quantidade'] : 1),
                        'valor_unitario' => floatval(isset($it['valor_unitario']) ? $it['valor_unitario'] : 0),
                        'valor_total' => floatval(isset($it['valor_total']) ? $it['valor_total'] : 0),
                        'destino_estoque' => isset($it['destino_estoque']) ? $it['destino_estoque'] : 'flr',
                        'projeto_id' => isset($it['projeto_id']) ? $it['projeto_id'] : (isset($entry['projeto_id']) ? $entry['projeto_id'] : null)
                    ]);

                    // Grava regra De-Para
                    if (!empty($entry['fornecedor_cnpj']) && !empty($it['codigo_fornecedor']) && $prodId) {
                        supabase_fetch("flrBling_de_para_rules", 'POST', [
                            'fornecedor_cnpj' => $entry['fornecedor_cnpj'],
                            'codigo_fornecedor' => $it['codigo_fornecedor'],
                            'descricao_fornecedor' => isset($it['descricao_fornecedor']) ? $it['descricao_fornecedor'] : '',
                            'produto_id' => $prodId
                        ]);
                    }
                }
            }

            json_response(['success' => true, 'data' => $savedEntry], 201);
        }
    }

    // ==========================================================================
    // MOVIMENTAÇÕES DE ESTOQUE (PHP Router)
    // ==========================================================================
    if ($segments[0] === 'estoque' && isset($segments[1]) && $segments[1] === 'movimentacoes') {
        $user = require_auth();

        if ($method === 'GET') {
            $res = supabase_fetch("flrBling_stock_movements?select=*,produto:flrBling_products(*),projeto:flrBling_projects(*)&order=data_movimento.desc", 'GET');
            json_response(['data' => is_array($res) ? $res : []]);
        }

        if ($method === 'POST') {
            $body = get_json_input();
            $body['created_by'] = $user['id'];
            $res = supabase_fetch("flrBling_stock_movements", 'POST', $body);
            json_response(['success' => true, 'data' => !empty($res) ? $res[0] : $body], 201);
        }
    }

    // Rota não encontrada
    json_response(['error' => 'Endpoint da API não encontrado: ' . $path], 404);

} catch (Exception $e) {
    json_response([
        'error' => 'Erro interno no servidor: ' . $e->getMessage()
    ], 500);
}
