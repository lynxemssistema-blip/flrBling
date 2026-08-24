const ftp = require('basic-ftp');

async function test() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  // Lista de possíveis hosts e usuários para testar
  const tests = [
    { host: 'flr.lynxems.com.br', user: 'u494795077', pass: '1207597Rdv*' },
    { host: 'lynxems.com.br', user: 'u494795077', pass: '1207597Rdv*' },
    { host: 'srv1311.hstgr.io', user: 'u494795077', pass: '1207597Rdv*' },
    { host: 'flr.lynxems.com.br', user: 'lynxemssistema@gmail.com.br', pass: '1207597Rdv*' }
  ];

  for (const t of tests) {
    try {
      console.log(`\nTesting connection to ${t.host} with user ${t.user}...`);
      await client.access({
        host: t.host,
        user: t.user,
        password: t.pass,
        secure: false,
        port: 21
      });
      console.log('✅ Connection SUCCESSFUL!');
      console.log('Listing directory:');
      const list = await client.list();
      console.log(list.map(f => f.name));
      client.close();
      return { success: true, host: t.host, user: t.user };
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
    }
  }
  console.log('\n❌ All combinations failed.');
  return { success: false };
}

test();
