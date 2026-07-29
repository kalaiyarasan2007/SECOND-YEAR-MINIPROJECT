const { Pool } = require('pg');
require('dotenv').config();

async function test(label, connectionString) {
    console.log(`--- Testing: ${label} ---`);
    const pool = new Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        const client = await pool.connect();
        console.log('✅ Success!');
        client.release();
        return true;
    } catch (err) {
        console.log('❌ Failed:', err.message);
        return false;
    } finally {
        await pool.end();
    }
}

async function runAll() {
    const password = 'kalaiyarsan123';
    const encodedPassword = encodeURIComponent(password);
    const projectRef = 'exeqhdoavbohalkrkibh';
    const host = 'aws-1-ap-northeast-2.pooler.supabase.com';
    const port = '6543';

    // Variation 1: Suffix username, encoded password (current)
    await test('Suffix + Encoded', `postgresql://postgres.${projectRef}:${encodedPassword}@${host}:${port}/postgres`);

    // Variation 2: Suffix username, plain password
    await test('Suffix + Plain', `postgresql://postgres.${projectRef}:${password}@${host}:${port}/postgres`);

    // Variation 3: Just postgres, encoded password
    await test('Just postgres + Encoded', `postgresql://postgres:${encodedPassword}@${host}:${port}/postgres`);

    // Variation 4: Direct connection (might fail on IPv4)
    await test('Direct + Plain', `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`);
}

runAll();
