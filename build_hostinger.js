const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const outputDir = path.join(rootDir, 'HOSTINGER_PRONTO');

console.log('🚀 Preparando pasta HOSTINGER_PRONTO...');

// Limpa/cria pasta de destino
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

// Copia arquivos raiz
const filesToCopy = [
  'server.js',
  'supabaseClient.js',
  'supabase_schema.sql',
  'package.json',
  'package-lock.json',
  'ecosystem.config.js',
  '.env',
  'DEPLOY_HOSTINGER.md'
];

filesToCopy.forEach(file => {
  const src = path.join(rootDir, file);
  const dest = path.join(outputDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copiado: ${file}`);
  }
});

// Copia pasta public completa
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

const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(outputDir, 'public');
copyFolderRecursiveSync(publicSrc, publicDest);
console.log('✓ Pasta public/ copiada com sucesso!');

// Cria também cópia de index.html, css e js na raiz de HOSTINGER_PRONTO
// Isso garante compatibilidade total caso você cole direto no public_html
fs.copyFileSync(path.join(publicSrc, 'index.html'), path.join(outputDir, 'index.html'));
copyFolderRecursiveSync(path.join(publicSrc, 'css'), path.join(outputDir, 'css'));
copyFolderRecursiveSync(path.join(publicSrc, 'js'), path.join(outputDir, 'js'));

// Cria um arquivo .htaccess para Node.js / Apache na Hostinger
const htaccessContent = `PassengerEnabled on
PassengerAppRoot /home/u123456789/public_html
PassengerAppType node
PassengerStartupFile server.js
`;
fs.writeFileSync(path.join(outputDir, '.htaccess'), htaccessContent);

console.log('\n🎉 Pasta HOSTINGER_PRONTO criada com sucesso!');
console.log(`📂 Caminho completo: ${outputDir}`);
