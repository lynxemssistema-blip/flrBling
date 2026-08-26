# 🚀 Guia de Deploy Rápido na Hostinger (Copiar e Colar)

Este projeto foi totalmente adaptado para rodar de forma nativa e automática na **Hostinger (Apache + PHP 8 + Supabase)**. 

> [!IMPORTANT]
> **Você NÃO precisa configurar nada no hPanel (nem Node.js, nem SSH, nem portas, nem PM2).**
> Basta enviar os arquivos para a pasta `public_html`.

---

## 📦 Método 1: Upload do ZIP pelo Gerenciador de Arquivos (Recomendado - 1 minuto)

1. No seu computador, gere o pacote atualizado executando no terminal:
   ```bash
   npm run build
   ```
   *(Isso criará o arquivo `public_html.zip` na raiz do projeto).*

2. Acesse o **Painel da Hostinger** -> **Gerenciador de Arquivos** (File Manager).
3. Abra a pasta **`public_html`** do seu domínio (ex: `flr.lynxems.com.br`).
4. Clique no botão de **Upload** no topo e selecione o arquivo **`public_html.zip`**.
5. Clique com o botão direito no arquivo `public_html.zip` enviado e escolha **Extrair (Extract)**.
   - *Selecione para extrair diretamente dentro da pasta `public_html`.*
6. **Pronto!** Acesse `https://flr.lynxems.com.br` no navegador.

---

## ⚡ Método 2: Deploy Automático via Terminal (FTP)

Se você preferir fazer o deploy com 1 único comando no terminal:

1. Abra o arquivo `.env` e preencha suas credenciais de FTP da Hostinger:
   ```env
   FTP_HOST=ftp.flr.lynxems.com.br
   FTP_USER=seu_usuario_ftp
   FTP_PASSWORD=sua_senha_ftp
   FTP_REMOTE_DIR=/public_html
   ```
2. Execute no terminal:
   ```bash
   npm run deploy
   ```
3. O script irá compilar e enviar todos os arquivos automaticamente.

---

## 📂 Estrutura de Arquivos no `public_html`

Após a extração, sua pasta `public_html` na Hostinger ficará assim:

```text
public_html/
├── .htaccess             <- Configuração de rotas Apache/SPA e API PHP
├── .env                  <- Credenciais do Bling e Supabase
├── index.html            <- Frontend da Aplicação FLR Bling ERP
├── css/
│   └── style.css         <- Estilos visuais e responsividade
├── js/
│   └── app.js            <- Lógica do Frontend e Multi-módulos
├── api/
│   ├── config.php        <- Helpers de JWT, Supabase e Bling OAuth
│   └── index.php         <- Roteador nativo de todas as chamadas /api/...
└── uploads/              <- Diretório de imagens salvas dos produtos
```

---

## 🔑 Acesso Padrão ao Sistema

- **Super Administrador:** `admin@flrinstalacoes.com.br`
- **Senha:** `AdminFLR@2026`
