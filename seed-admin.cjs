const pg = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

async function seedAdmin() {
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const adminEmail = 'admin@attendance.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    try {
        console.log('Checking for existing admin...');
        const existing = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);

        if (existing.rows.length > 0) {
            console.log('Admin user already exists.');
        } else {
            console.log('Inserting admin user...');
            await pool.query(
                'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                ['System Admin', adminEmail, hashedPassword, 'admin']
            );
            console.log('✅ Admin user created successfully!');
            console.log('Admin Email: ' + adminEmail);
            console.log('Admin Password: ' + adminPassword);
        }
    } catch (err) {
        console.error('❌ Error seeding admin:', err.message);
    } finally {
        await pool.end();
    }
}

seedAdmin();
