const ftp = require('basic-ftp');

async function test() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  try {
    console.log('Testing FTP connection with correct password...');
    await client.access({
      host: 'lynxems.com.br',
      user: 'u494795077',
      password: '10207597Rdv*',
      secure: false,
      port: 21
    });
    console.log('✅ Connection SUCCESSFUL!');
    console.log('Listing /public_html/flr:');
    await client.cd('/public_html/flr');
    const list = await client.list();
    console.log(list.map(f => f.name));
  } catch (e) {
    console.log(`❌ Failed: ${e.message}`);
  } finally {
    client.close();
  }
}

test();
