const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres.exeqhdoavbohalkrkibh',
    password: 'kalaiyarasan123',
    host: 'aws-1-ap-northeast-2.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
});

(async () => {
    console.log('Testing connection...');
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT current_user');
        console.log('✅ Connected! User:', res.rows[0].current_user);
        client.release();
    } catch (err) {
        console.log('❌ Failed:', err.code, '|', err.message);
    } finally {
        await pool.end();
    }
})();
