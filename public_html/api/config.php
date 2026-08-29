<?php
/**
 * FLR Bling ERP - Configuração & Utilitários PHP
 * Funciona nativamente no Apache / Hostinger sem Composer ou Node.js.
 */

// 1. Carregar variáveis do .env caso exista
$envFile = __DIR__ . '/../.env';
if (!file_exists($envFile)) {
    $envFile = __DIR__ . '/.env';
}

$ENV = [];
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            $ENV[trim($key)] = trim($val);
        }
    }
}

function env($key, $default = null) {
    global $ENV;
    if (isset($_ENV[$key])) return $_ENV[$key];
    if (isset($ENV[$key])) return $ENV[$key];
    $val = getenv($key);
    return ($val !== false) ? $val : $default;
}

// Configurações do Bling & Supabase
define('BLING_CLIENT_ID', env('BLING_CLIENT_ID', '70b28e5e2fde9f4958c6472106c2696987aad4ea'));
define('BLING_CLIENT_SECRET', env('BLING_CLIENT_SECRET', '12fe6c1a3a2f21d2a9b5a459ec92b535fd17b098c223d0378f45d3a83b5c'));
define('BLING_REDIRECT_URI', env('BLING_REDIRECT_URI', 'https://flr.lynxems.com.br/'));
define('BLING_STATE', env('BLING_STATE', 'f72b38f343ffbe449237c0577ef08a53'));

define('SUPABASE_URL', env('SUPABASE_URL', env('VITE_SUPABASE_URL', 'https://ohjuqcrpakswvnoqobiq.supabase.co')));
define('SUPABASE_ANON_KEY', env('SUPABASE_ANON_KEY', env('VITE_SUPABASE_ANON_KEY', 'sb_publishable_9_JvWbh17Zwmdnd38rHVcQ_4eLPLnkH')));
define('JWT_SECRET', env('JWT_SECRET', 'flr_bling_super_jwt_secret_2026'));

define('TOKENS_FILE', __DIR__ . '/../tokens.json');
define('UPLOADS_DIR', __DIR__ . '/../uploads');

// Utilitários de Resposta JSON
function json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function get_json_input() {
    $input = file_get_contents('php://input');
    return $input ? json_decode($input, true) : [];
}

// Utilitários JWT (Pure PHP HMAC-SHA256)
function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function generate_jwt($payload, $expiresInSeconds = 604800) { // 7 dias
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['iat'] = time();
    $payload['exp'] = time() + $expiresInSeconds;
    $payloadJson = json_encode($payload);

    $base64UrlHeader = base64UrlEncode($header);
    $base64UrlPayload = base64UrlEncode($payloadJson);
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = base64UrlEncode($signature);

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verify_jwt($jwt) {
    $tokenParts = explode('.', $jwt);
    if (count($tokenParts) !== 3) return false;

    $header = base64UrlDecode($tokenParts[0]);
    $payload = base64UrlDecode($tokenParts[1]);
    $signatureProvided = $tokenParts[2];

    $base64UrlHeader = base64UrlEncode($header);
    $base64UrlPayload = base64UrlEncode($payload);
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = base64UrlEncode($signature);

    if (hash_equals($base64UrlSignature, $signatureProvided)) {
        $decoded = json_decode($payload, true);
        if (isset($decoded['exp']) && $decoded['exp'] < time()) {
            return false; // Expirado
        }
        return $decoded;
    }
    return false;
}

// Autenticação de Usuário via Bearer Token
function authenticate_user() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : null);
    
    if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        json_response(['error' => 'Acesso negado. Faça login para continuar.'], 401);
    }

    $jwt = $matches[1];
    $decoded = verify_jwt($jwt);
    if (!$decoded) {
        json_response(['error' => 'Sessão inválida ou expirada. Faça login novamente.'], 401);
    }

    $user = supabase_find_user_by_id($decoded['id']);
    if (!$user) {
        json_response(['error' => 'Usuário não encontrado.'], 401);
    }

    if ($user['status'] !== 'aprovado') {
        json_response(['error' => 'Seu cadastro está pendente de aprovação ou bloqueado pelo administrador.'], 403);
    }

    return $user;
}

function require_superadmin($user) {
    if (!$user || $user['role'] !== 'superadmin') {
        json_response(['error' => 'Acesso restrito apenas para o Super Administrador.'], 403);
    }
}

// Supabase REST Helper
function supabase_fetch($path, $method = 'GET', $body = null, $extraHeaders = []) {
    $url = rtrim(SUPABASE_URL, '/') . '/rest/v1/' . ltrim($path, '/');
    
    $headers = array_merge([
        'apikey: ' . SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . SUPABASE_ANON_KEY,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ], $extraHeaders);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, is_string($body) ? $body : json_encode($body));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'code' => $httpCode,
        'data' => $response ? json_decode($response, true) : null,
        'raw' => $response
    ];
}

// Supabase Operações de Perfis (RBAC)
function supabase_get_profiles() {
    $res = supabase_fetch("flrBling_profiles?select=*&order=is_system.desc,created_at.asc");
    if ($res['code'] >= 200 && $res['code'] < 300 && !empty($res['data'])) {
        return $res['data'];
    }
    // Fallback padrão
    return [
        [
            'id' => '00000000-0000-0000-0000-000000000001',
            'name' => 'Super Administrador',
            'description' => 'Acesso total e irrestrito.',
            'is_system' => true,
            'color' => '#E11D48',
            'permissions' => [
                'dashboard' => ['view' => true],
                'clients' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true, 'complement' => true],
                'products' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'services' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'categories' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'orders' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'proposals' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'sellers' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'nfe' => ['view' => true, 'create' => true, 'import_xml' => true, 'delete' => true],
                'serviceOrders' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'receivables' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'payables' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'stock' => ['view' => true, 'adjust' => true],
                'users_admin' => ['manage_users' => true, 'manage_profiles' => true],
                'bling_settings' => ['manage_connection' => true]
            ]
        ],
        [
            'id' => '00000000-0000-0000-0000-000000000003',
            'name' => 'Comercial & Vendas',
            'description' => 'Acesso a Vendas, Pedidos e Clientes.',
            'is_system' => false,
            'color' => '#00A868',
            'permissions' => [
                'dashboard' => ['view' => true],
                'clients' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => false, 'complement' => true],
                'products' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'services' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'categories' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'orders' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => false],
                'proposals' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => false],
                'sellers' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'nfe' => ['view' => false, 'create' => false, 'import_xml' => false, 'delete' => false],
                'serviceOrders' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'receivables' => ['view' => false, 'create' => false, 'edit' => false, 'delete' => false],
                'payables' => ['view' => false, 'create' => false, 'edit' => false, 'delete' => false],
                'stock' => ['view' => true, 'adjust' => false],
                'users_admin' => ['manage_users' => false, 'manage_profiles' => false],
                'bling_settings' => ['manage_connection' => false]
            ]
        ]
    ];
}

function supabase_get_profile_by_id($id) {
    $res = supabase_fetch("flrBling_profiles?id=eq." . urlencode($id) . "&select=*");
    if ($res['code'] >= 200 && $res['code'] < 300 && !empty($res['data'])) {
        return $res['data'][0];
    }
    $profiles = supabase_get_profiles();
    foreach ($profiles as $p) {
        if ($p['id'] === $id) return $p;
    }
    return null;
}

// Supabase Operações de Usuários
function supabase_find_user_by_email($email) {
    $clean = strtolower(trim($email));
    $res = supabase_fetch("flrBling_users?email=eq." . urlencode($clean) . "&select=*,profile:flrBling_profiles(id,name,description,color,permissions)");
    if ($res['code'] >= 200 && $res['code'] < 300 && !empty($res['data'])) {
        $user = $res['data'][0];
        if (empty($user['profile']) && $user['role'] === 'superadmin') {
            $user['profile'] = [
                'id' => '00000000-0000-0000-0000-000000000001',
                'name' => 'Super Administrador',
                'color' => '#E11D48',
                'permissions' => ['dashboard' => ['view' => true], 'users_admin' => ['manage_users' => true, 'manage_profiles' => true]]
            ];
        }
        return $user;
    }
    // Fallback padrão para superadmin caso tabela vazia
    if ($clean === 'admin@flrinstalacoes.com.br') {
        return [
            'id' => 'superadmin-root-id',
            'name' => 'Super Administrador FLR',
            'email' => 'admin@flrinstalacoes.com.br',
            'password_hash' => password_hash('AdminFLR@2026', PASSWORD_BCRYPT),
            'role' => 'superadmin',
            'profile_id' => '00000000-0000-0000-0000-000000000001',
            'status' => 'aprovado',
            'phone' => '(11) 99999-9999',
            'profile' => [
                'id' => '00000000-0000-0000-0000-000000000001',
                'name' => 'Super Administrador',
                'color' => '#E11D48',
                'permissions' => [
                    'dashboard' => ['view' => true],
                    'clients' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true, 'complement' => true],
                    'products' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'services' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'categories' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'orders' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'proposals' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'sellers' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'nfe' => ['view' => true, 'create' => true, 'import_xml' => true, 'delete' => true],
                    'serviceOrders' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'receivables' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'payables' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'stock' => ['view' => true, 'adjust' => true],
                    'users_admin' => ['manage_users' => true, 'manage_profiles' => true],
                    'bling_settings' => ['manage_connection' => true]
                ]
            ]
        ];
    }
    return null;
}

function supabase_find_user_by_id($id) {
    if ($id === 'superadmin-root-id') {
        return [
            'id' => 'superadmin-root-id',
            'name' => 'Super Administrador FLR',
            'email' => 'admin@flrinstalacoes.com.br',
            'role' => 'superadmin',
            'profile_id' => '00000000-0000-0000-0000-000000000001',
            'status' => 'aprovado',
            'phone' => '(11) 99999-9999',
            'profile' => [
                'id' => '00000000-0000-0000-0000-000000000001',
                'name' => 'Super Administrador',
                'color' => '#E11D48',
                'permissions' => [
                    'dashboard' => ['view' => true],
                    'clients' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true, 'complement' => true],
                    'products' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'services' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'categories' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'orders' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'proposals' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'sellers' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'nfe' => ['view' => true, 'create' => true, 'import_xml' => true, 'delete' => true],
                    'serviceOrders' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'receivables' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'payables' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                    'stock' => ['view' => true, 'adjust' => true],
                    'users_admin' => ['manage_users' => true, 'manage_profiles' => true],
                    'bling_settings' => ['manage_connection' => true]
                ]
            ]
        ];
    }
    $res = supabase_fetch("flrBling_users?id=eq." . urlencode($id) . "&select=id,name,email,role,profile_id,status,phone,created_at,profile:flrBling_profiles(id,name,description,color,permissions)");
    if ($res['code'] >= 200 && $res['code'] < 300 && !empty($res['data'])) {
        $user = $res['data'][0];
        if (empty($user['profile']) && $user['role'] === 'superadmin') {
            $user['profile'] = [
                'id' => '00000000-0000-0000-0000-000000000001',
                'name' => 'Super Administrador',
                'color' => '#E11D48',
                'permissions' => ['dashboard' => ['view' => true], 'users_admin' => ['manage_users' => true, 'manage_profiles' => true]]
            ];
        }
        return $user;
    }
    return null;
}

// Tokens Bling
function get_saved_tokens() {
    $tokens = null;
    $tokensFile = TOKENS_FILE;
    if (file_exists($tokensFile)) {
        $content = file_get_contents($tokensFile);
        $tokens = json_decode($content, true);
    }
    if (!$tokens) {
        $res = supabase_fetch("flrBling_tokens?id=eq.bling_primary&select=*");
        if ($res['code'] >= 200 && $res['code'] < 300 && !empty($res['data'])) {
            $tokens = $res['data'][0];
            @file_put_contents($tokensFile, json_encode($tokens, JSON_PRETTY_PRINT));
        }
    }
    return $tokens;
}

function save_tokens_data($tokenData) {
    $expiresIn = isset($tokenData['expires_in']) ? intval($tokenData['expires_in']) : 21600;
    $expiresAt = isset($tokenData['expires_at']) ? $tokenData['expires_at'] : date('c', time() + ($expiresIn - 60));
    
    $payload = [
        'id' => 'bling_primary',
        'provider' => 'bling',
        'access_token' => $tokenData['access_token'],
        'refresh_token' => isset($tokenData['refresh_token']) ? $tokenData['refresh_token'] : null,
        'token_type' => isset($tokenData['token_type']) ? $tokenData['token_type'] : 'Bearer',
        'expires_in' => $expiresIn,
        'expires_at' => $expiresAt,
        'saved_at' => date('c'),
        'updated_at' => date('c')
    ];

    @file_put_contents(TOKENS_FILE, json_encode($payload, JSON_PRETTY_PRINT));
    supabase_fetch("flrBling_tokens?on_conflict=id", 'POST', [$payload], ['Prefer: resolution=merge-duplicates,return=representation']);
    return $payload;
}

function refresh_bling_token() {
    $tokens = get_saved_tokens();
    if (!$tokens || empty($tokens['refresh_token'])) {
        throw new Exception('Refresh token não encontrado. Faça a autorização novamente.');
    }

    $clientId = BLING_CLIENT_ID;
    $clientSecret = BLING_CLIENT_SECRET;
    $basicAuth = base64_encode("$clientId:$clientSecret");

    $postData = http_build_query([
        'grant_type' => 'refresh_token',
        'refresh_token' => $tokens['refresh_token']
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
        return save_tokens_data($json);
    }
    throw new Exception('Falha ao renovar token com o Bling: ' . ($response ?: "HTTP $httpCode"));
}

function get_valid_access_token() {
    $tokens = get_saved_tokens();
    if (!$tokens || empty($tokens['access_token'])) return null;

    if (!empty($tokens['expires_at']) && strtotime($tokens['expires_at']) <= time()) {
        try {
            $tokens = refresh_bling_token();
        } catch (Exception $e) {
            return null;
        }
    }
    return $tokens['access_token'];
}

function fetch_bling_api($endpoint, $params = [], $method = 'GET', $body = null) {
    $accessToken = get_valid_access_token();
    if (!$accessToken) {
        throw new Exception('Não autenticado no Bling.');
    }

    $queryString = !empty($params) ? '?' . http_build_query($params) : '';
    $url = "https://bling.com.br/Api/v3/" . ltrim($endpoint, '/') . $queryString;

    $makeRequest = function($token) use ($url, $method, $body) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $headers = [
            'Authorization: Bearer ' . $token,
            'Accept: application/json'
        ];
        if ($body !== null) {
            $headers[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_POSTFIELDS, is_string($body) ? $body : json_encode($body));
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ['code' => $code, 'data' => json_decode($res, true), 'raw' => $res];
    };

    $res = $makeRequest($accessToken);
    if ($res['code'] === 401) {
        $newTokens = refresh_bling_token();
        $res = $makeRequest($newTokens['access_token']);
    } elseif ($res['code'] === 429) {
        usleep(450000); // Aguarda 450ms em caso de limite de requisições do Bling (3 req/s)
        $res = $makeRequest($accessToken);
    }

    if ($res['code'] >= 200 && $res['code'] < 300) {
        return $res['data'];
    }
    throw new Exception(isset($res['data']['error']) ? json_encode($res['data']) : ($res['raw'] ?: "Erro HTTP " . $res['code']));
}

function log_activity($actionType, $blingCustomerId = null, $description = '', $metadata = [], $userId = null) {
    supabase_fetch("flrBling_activity_logs", 'POST', [[
        'action_type' => $actionType,
        'bling_customer_id' => $blingCustomerId ? intval($blingCustomerId) : null,
        'user_id' => $userId,
        'description' => $description,
        'metadata' => $metadata,
        'created_at' => date('c')
    ]]);
}
