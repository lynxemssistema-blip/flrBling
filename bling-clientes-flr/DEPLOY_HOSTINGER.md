# Guia de Instalação e Deploy na Hostinger

Este guia orienta o processo de implantação da aplicação **Visualizador de Clientes Bling** no seu domínio `https://flr.lynxems.com.br/` na **Hostinger**.

---

## 🌟 Vantagem da Configuração Atual
Como a URL de redirecionamento do seu aplicativo no Bling está cadastrada exatamente como:
```text
https://flr.lynxems.com.br/
```
Assim que a aplicação for instalada na Hostinger, o fluxo OAuth funcionará de forma **100% transparente**:
1. O usuário clica em **"Conexão API > Autorizar Aplicativo no Bling"**.
2. Ao autorizar, o Bling redireciona diretamente para `https://flr.lynxems.com.br/?code=...`.
3. A aplicação detecta o código automaticamente, efetua a troca pelo token e carrega os clientes imediatamente, sem que você precise copiar e colar códigos manualmente!

---

## 📁 Opção 1: Deploy na Hospedagem Compartilhada / Cloud (hPanel)

A Hostinger possui suporte nativo para aplicações Node.js no **hPanel**:

### Passo 1: Enviar os arquivos para a Hostinger
1. Acesse o **hPanel** da Hostinger > **Gerenciador de Arquivos** (ou conecte via FTP).
2. Na pasta do seu domínio (ex: `public_html` ou uma pasta dedicada da aplicação), envie todos os arquivos do projeto:
   * `server.js`
   * `package.json`
   * Pasta `public/` (com `index.html`, `css/` e `js/`)
   * Arquivo `.env` *(certifique-se de preencher as variáveis do .env)*
   * *(Não precisa enviar a pasta `node_modules`, pois ela será instalada no servidor)*.

### Passo 2: Configurar o Node.js no hPanel
1. No menu do hPanel, acesse **Avançado > Node.js** (ou pesquise por "Node.js").
2. Clique em **Criar Aplicação Node.js**:
   * **Versão do Node.js**: Selecione `Node.js 18.x`, `20.x` ou `22.x`.
   * **Modo da Aplicação**: `Production`.
   * **Raiz da Aplicação (Application Root)**: O caminho onde os arquivos estão (ex: `/public_html` ou `/app`).
   * **Arquivo de Inicialização (Application Startup File)**: `server.js`.
3. Clique em **Criar** / **Salvar**.

### Passo 3: Instalar as Dependências
1. Na mesma tela do Node.js no hPanel, clique no botão **"NPM Install"** (ou execute via Terminal SSH `npm install --production`).
2. Clique em **"Reiniciar Aplicação"**.

### Passo 4: Ativar o Certificado SSL (HTTPS)
1. No hPanel, vá em **Segurança > SSL** e garanta que o SSL gratuito Let's Encrypt está ativo para `flr.lynxems.com.br`.

---

## 🐧 Opção 2: Deploy em Servidor VPS Hostinger (Ubuntu / Debian com PM2)

Se estiver utilizando um servidor VPS na Hostinger com acesso SSH:

### 1. Conectar ao Servidor via SSH:
```bash
ssh root@SEU_IP_DO_VPS
```

### 2. Instalar Node.js e PM2 (caso ainda não tenha):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git
npm install -g pm2
```

### 3. Clonar ou Enviar os Arquivos:
```bash
mkdir -p /var/www/flr-bling
cd /var/www/flr-bling
# Envie seus arquivos via SCP, Git ou SFTP
```

### 4. Instalar Dependências e Iniciar com PM2:
```bash
npm install --production
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Configurar o Proxy Reverso Nginx:
Adicione ao seu arquivo de configuração do Nginx (`/etc/nginx/sites-available/flr.lynxems.com.br`):
```nginx
server {
    server_name flr.lynxems.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Em seguida, instale o SSL com o Certbot:
```bash
certbot --nginx -d flr.lynxems.com.br
systemctl restart nginx
```

---

## 🔐 Verificação das Variáveis de Ambiente no Servidor
Garanta que o arquivo `.env` no servidor contenha:
```env
PORT=3000
BLING_CLIENT_ID=70b28e5e2fde9f4958c6472106c2696987aad4ea
BLING_CLIENT_SECRET=12fe6c1a3a2f21d2a9b5a459ec92b535fd17b098c223d0378f45d3a83b5c
BLING_REDIRECT_URI=https://flrinstalacoes.lynxems.com.br/
BLING_STATE=f72b38f343ffbe449237c0577ef08a53
```
Pronto! Sua aplicação estará no ar funcionando diretamente no seu domínio.
