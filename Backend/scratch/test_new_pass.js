const mongoose = require('mongoose');

const URI1 = 'mongodb+srv://sujal99ds_db_user:DvEHC8z9ApZteyDI@clustercanx.bcazxvt.mongodb.net/Canx_international?retryWrites=true&w=majority&appName=ClusterCanx';
const URI2 = 'mongodb+srv://sujal99ds_db_user:65MPJxARvf5ieXSS@clustercanx.bcazxvt.mongodb.net/Canx_international?retryWrites=true&w=majority&appName=ClusterCanx';

async function test(name, url) {
    console.log(`Testing ${name}...`);
    try {
        const conn = await mongoose.createConnection(url).asPromise();
        console.log(`✅ ${name} SUCCESS!`);
        await conn.close();
    } catch (e) {
        console.log(`❌ ${name} FAILED: ${e.message}`);
    }
}

async function run() {
    await test('URI with DvEHC8z9ApZteyDI', URI1);
    await test('URI with 65MPJxARvf5ieXSS', URI2);
    process.exit(0);
}

run();
