/**
 * Script de Deploy Automático Simples via FTP/FTPS para a Hostinger
 * Execute com: npm run deploy
 */

require('dotenv').config();
const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

async function deploy() {
  const host = process.env.FTP_HOST;
  const user = process.env.FTP_USER;
  const password = process.env.FTP_PASSWORD;
  const remoteDir = process.env.FTP_REMOTE_DIR || '/public_html';
  const secure = process.env.FTP_SECURE === 'true' || false;

  console.log('\n======================================================');
  console.log('🚀 INICIANDO DEPLOY AUTOMÁTICO PARA A HOSTINGER');
  console.log('======================================================\n');

  if (!host || !user || !password) {
    console.error('❌ Configurações de FTP não encontradas no arquivo .env!\n');
    console.log('Por favor, adicione as seguintes linhas ao seu arquivo .env:');
    console.log('------------------------------------------------------');
    console.log('FTP_HOST=ftp.flr.lynxems.com.br (ou IP da Hostinger)');
    console.log('FTP_USER=seu_usuario_ftp');
    console.log('FTP_PASSWORD=sua_senha_ftp');
    console.log('FTP_REMOTE_DIR=/public_html (ou pasta do seu domínio)');
    console.log('FTP_SECURE=false');
    console.log('------------------------------------------------------\n');
    process.exit(1);
  }

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    console.log(`🔌 Conectando ao servidor FTP: ${host}...`);
    await client.access({
      host: host,
      user: user,
      password: password,
      secure: secure,
      port: 21
    });

    console.log('✅ Conexão estabelecida com sucesso!\n');
    console.log(`📁 Navegando para o diretório remoto: ${remoteDir}...`);
    await client.ensureDir(remoteDir);

    const filesToUpload = [
      'server.js',
      'supabaseClient.js',
      'supabase_schema.sql',
      'package.json',
      'package-lock.json',
      'ecosystem.config.js',
      '.env'
    ];

    console.log('📤 Enviando arquivos principais do backend...');
    for (const file of filesToUpload) {
      const localFilePath = path.join(__dirname, file);
      if (fs.existsSync(localFilePath)) {
        await client.uploadFrom(localFilePath, file);
        console.log(`  ✓ ${file}`);
      }
    }

    console.log('\n📤 Enviando pasta do frontend (public/)...');
    const localPublicDir = path.join(__dirname, 'public');
    if (fs.existsSync(localPublicDir)) {
      await client.uploadFromDir(localPublicDir, 'public');
      console.log('  ✓ Pasta public/ (HTML, CSS, JS) enviada com sucesso!');
    }

    console.log('\n======================================================');
    console.log('🎉 DEPLOY CONCLUÍDO COM SUCESSO!');
    console.log('🌐 Acesse seu app em: https://flr.lynxems.com.br/');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Erro durante o deploy:', err.message);
  } finally {
    client.close();
  }
}

deploy();
