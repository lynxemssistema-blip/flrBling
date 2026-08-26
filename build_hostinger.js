const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const publicSrc = path.join(rootDir, 'public');
const publicHtmlDir = path.join(rootDir, 'public_html');
const hostingerProntoDir = path.join(rootDir, 'HOSTINGER_PRONTO');
const envSrc = path.join(rootDir, '.env');
const tokensSrc = path.join(rootDir, 'tokens.json');
const zipFile = path.join(rootDir, 'public_html.zip');

console.log('====================================================');
console.log('🚀 COMPILANDO E PREPARANDO PACOTE PARA PUBLICAÇÃO');
console.log('====================================================\n');

// 1. Sincroniza todas as 12 páginas HTML
console.log('1️⃣ Sincronizando páginas HTML...');
execSync('node generate_pages.js', { stdio: 'inherit' });

if (!fs.existsSync(publicHtmlDir)) {
  fs.mkdirSync(publicHtmlDir, { recursive: true });
}
if (!fs.existsSync(hostingerProntoDir)) {
  fs.mkdirSync(hostingerProntoDir, { recursive: true });
}

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
  const files = fs.readdirSync(source);
  files.forEach(file => {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);
    if (fs.lstatSync(curSource).isDirectory()) {
      copyFolderRecursiveSync(curSource, curTarget);
    } else {
      fs.copyFileSync(curSource, curTarget);
    }
  });
}

// 2. Copia todo o conteúdo da pasta public para public_html e HOSTINGER_PRONTO
console.log('\n2️⃣ Sincronizando arquivos estáticos e API PHP...');
copyFolderRecursiveSync(publicSrc, publicHtmlDir);
copyFolderRecursiveSync(publicSrc, hostingerProntoDir);
console.log('✓ Conteúdo de public/ sincronizado em public_html/ e HOSTINGER_PRONTO/');

// 3. Garante que .env e tokens.json estejam nos diretórios de deploy
if (fs.existsSync(envSrc)) {
  fs.copyFileSync(envSrc, path.join(publicHtmlDir, '.env'));
  fs.copyFileSync(envSrc, path.join(hostingerProntoDir, '.env'));
  console.log('✓ Copiado: .env');
}
if (fs.existsSync(tokensSrc)) {
  fs.copyFileSync(tokensSrc, path.join(publicHtmlDir, 'tokens.json'));
  fs.copyFileSync(tokensSrc, path.join(hostingerProntoDir, 'tokens.json'));
  console.log('✓ Copiado: tokens.json');
}

// 4. Cria o arquivo public_html.zip para upload direto
console.log('\n3️⃣ Gerando pacote ZIP para upload na Hostinger (public_html.zip)...');
try {
  if (fs.existsSync(zipFile)) {
    fs.unlinkSync(zipFile);
  }
  execSync(`powershell -Command "Compress-Archive -Path '${publicHtmlDir}\\*' -DestinationPath '${zipFile}' -Force"`, { stdio: 'ignore' });
  console.log(`✓ Arquivo ZIP gerado com sucesso: ${zipFile}`);
} catch (zipErr) {
  console.warn('⚠️ Aviso ao gerar ZIP:', zipErr.message);
}

console.log('\n====================================================');
console.log('🎉 COMPILAÇÃO CONCLUÍDA COM SUCESSO!');
console.log('====================================================');
console.log(`📁 Pasta pronta: ${publicHtmlDir}`);
console.log(`📦 Arquivo ZIP para upload: ${zipFile}\n`);
