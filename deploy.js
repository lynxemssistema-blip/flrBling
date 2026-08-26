/**
 * Script de Deploy Automático Simples via FTP/FTPS para a Hostinger
 * Envia todos os arquivos compilados diretamente para a pasta public_html.
 * Execute com: npm run deploy
 */

require('dotenv').config();
const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

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
    console.log('ℹ️ Para deploy direto via terminal, preencha o FTP no .env:');
    console.log('FTP_HOST=seu_ip_ou_host');
    console.log('FTP_USER=seu_usuario_ftp');
    console.log('FTP_PASSWORD=sua_senha_ftp');
    console.log('FTP_REMOTE_DIR=/public_html\n');
    console.log('💡 DICA: Você também pode simplesmente fazer upload do arquivo "public_html.zip" pelo Gerenciador de Arquivos da Hostinger!');
    return;
  }

  // Garante que o build esteja atualizado
  console.log('🔨 Compilando pacote mais recente...');
  execSync('node build_hostinger.js', { stdio: 'inherit' });

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    console.log(`\n🔌 Conectando ao servidor FTP: ${host}...`);
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

    const prontoDir = path.join(__dirname, 'HOSTINGER_PRONTO');
    console.log('📤 Enviando arquivos compilados da pasta HOSTINGER_PRONTO...');
    await client.uploadFromDir(prontoDir, remoteDir);

    console.log('\n======================================================');
    console.log('🎉 DEPLOY CONCLUÍDO COM SUCESSO!');
    console.log('🌐 Acesse seu app no navegador!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Erro durante o deploy FTP:', err.message);
  } finally {
    client.close();
  }
}

deploy();
