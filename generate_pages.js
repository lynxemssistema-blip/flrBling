const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const indexHtmlPath = path.join(publicDir, 'index.html');
const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');

const pages = [
  {
    fileName: 'projetos.html',
    dataPage: 'projects',
    navId: 'navProjects',
    title: 'Projetos & Obras (Verbas de Material) | Bling ERP FLR',
    category: 'Operação FLR',
    viewName: 'Projetos & Obras',
    btnLabel: 'Novo Projeto / Obra'
  },
  {
    fileName: 'orcamentos.html',
    dataPage: 'quotes',
    navId: 'navQuotes',
    title: 'Construtor de Orçamentos | Bling ERP FLR',
    category: 'Operação FLR',
    viewName: 'Construtor de Orçamentos',
    btnLabel: 'Novo Orçamento'
  },
  {
    fileName: 'kits.html',
    dataPage: 'kits',
    navId: 'navKits',
    title: 'Kits de Produtos | Bling ERP FLR',
    category: 'Operação FLR',
    viewName: 'Kits de Produtos',
    btnLabel: 'Novo Kit'
  },
  {
    fileName: 'ordens-servico.html',
    dataPage: 'serviceOrders',
    navId: 'navServiceOrders',
    title: 'Ordens de Serviço (OS) | Bling ERP FLR',
    category: 'Operação FLR',
    viewName: 'Ordens de Serviço (OS)',
    btnLabel: 'Nova Ordem de Serviço'
  },
  {
    fileName: 'nfe.html',
    dataPage: 'nfe',
    navId: 'navNfe',
    title: 'Entrada de Notas Fiscais (NF-e) | Bling ERP FLR',
    category: 'Compras & Estoque',
    viewName: 'Entrada NF-e (De-Para)',
    btnLabel: 'Nova Entrada / Importar XML'
  },
  {
    fileName: 'estoque.html',
    dataPage: 'stock',
    navId: 'navStock',
    title: 'Almoxarifado & Saldos de Estoque | Bling ERP FLR',
    category: 'Compras & Estoque',
    viewName: 'Almoxarifado & Saldos',
    btnLabel: 'Acerto / Retirada'
  },
  {
    fileName: 'clientes.html',
    dataPage: 'clients',
    navId: 'navClients',
    title: 'Clientes & Contatos | Bling ERP FLR',
    category: 'Cadastros',
    viewName: 'Clientes & Contatos',
    btnLabel: 'Novo Cliente'
  },
  {
    fileName: 'produtos.html',
    dataPage: 'products',
    navId: 'navProducts',
    title: 'Produtos & Materiais | Bling ERP FLR',
    category: 'Cadastros',
    viewName: 'Produtos & Materiais',
    btnLabel: 'Novo Produto'
  },
  {
    fileName: 'servicos.html',
    dataPage: 'services',
    navId: 'navServices',
    title: 'Catálogo de Serviços | Bling ERP FLR',
    category: 'Cadastros',
    viewName: 'Catálogo de Serviços',
    btnLabel: 'Novo Serviço'
  },
  {
    fileName: 'categorias.html',
    dataPage: 'categories',
    navId: 'navCategories',
    title: 'Categorias de Produtos & Serviços | Bling ERP FLR',
    category: 'Cadastros',
    viewName: 'Categorias',
    btnLabel: 'Nova Categoria'
  },
  {
    fileName: 'pedidos.html',
    dataPage: 'orders',
    navId: 'navOrders',
    title: 'Pedidos de Venda | Bling ERP FLR',
    category: 'Comercial Bling',
    viewName: 'Pedidos de Venda',
    btnLabel: 'Novo Pedido'
  },
  {
    fileName: 'propostas.html',
    dataPage: 'proposals',
    navId: 'navProposals',
    title: 'Propostas no Bling | Bling ERP FLR',
    category: 'Comercial Bling',
    viewName: 'Propostas Comerciais',
    btnLabel: 'Nova Proposta'
  },
  {
    fileName: 'vendedores.html',
    dataPage: 'sellers',
    navId: 'navSellers',
    title: 'Vendedores & Consultores Comerciais | Bling ERP FLR',
    category: 'Comercial Bling',
    viewName: 'Vendedores & Comissões',
    btnLabel: 'Novo Vendedor'
  },
  {
    fileName: 'contas-receber.html',
    dataPage: 'receivables',
    navId: 'navReceivables',
    title: 'Contas a Receber | Bling ERP FLR',
    category: 'Financeiro',
    viewName: 'Contas a Receber',
    btnLabel: 'Nova Conta a Receber'
  },
  {
    fileName: 'contas-pagar.html',
    dataPage: 'payables',
    navId: 'navPayables',
    title: 'Contas a Pagar | Bling ERP FLR',
    category: 'Financeiro',
    viewName: 'Contas a Pagar',
    btnLabel: 'Nova Conta a Pagar'
  }
];

pages.forEach(p => {
  let content = indexContent;

  // 1. Atualiza o title
  content = content.replace(/<title>.*?<\/title>/, `<title>${p.title}</title>`);

  // 2. Atualiza o data-page do body
  content = content.replace(/<body data-page=".*?">/, `<body data-page="${p.dataPage}">`);

  // 3. Atualiza os links ativos na sidebar
  content = content.replace(/class="nav-item active"/g, 'class="nav-item"');
  content = content.replace(new RegExp(`id="${p.navId}"`), `id="${p.navId}" class="nav-item active"`);

  // 4. Na página de módulo, ativa diretamente a visão de tabela (erpViewTable)
  content = content.replace('id="erpViewDashboard" class="erp-view-pane active"', 'id="erpViewDashboard" class="erp-view-pane"');
  content = content.replace('id="erpViewTable" class="erp-view-pane"', 'id="erpViewTable" class="erp-view-pane active"');

  // 5. Atualiza o breadcrumb estático
  content = content.replace(/<span class="bc-item" id="bcCategoryName">.*?<\/span>/, `<span class="bc-item" id="bcCategoryName">${p.category}</span>`);
  content = content.replace(/<span class="bc-item active" id="bcViewName">.*?<\/span>/, `<span class="bc-item active" id="bcViewName">${p.viewName}</span>`);
  content = content.replace(/<span id="lblNewItemBtn">.*?<\/span>/, `<span id="lblNewItemBtn">${p.btnLabel}</span>`);

  const destPath = path.join(publicDir, p.fileName);
  fs.writeFileSync(destPath, content, 'utf8');
  console.log(`✓ Página gerada com tabela ativa: ${p.fileName} (Módulo: ${p.dataPage})`);
});

console.log('\n🎉 Todas as 14 páginas de módulos sincronizadas com visão de dados ativa!');
