const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function setupDatabase() {
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const sql = `
CREATE TABLE IF NOT EXISTS "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"distance_from_center" double precision NOT NULL,
	"status" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"allowed_latitude" double precision NOT NULL,
	"allowed_longitude" double precision NOT NULL,
	"allowed_radius" double precision NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"face_encoding" json,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
  `;

    try {
        console.log('Connecting to database...');
        await pool.query(sql);
        console.log('✅ Tables created successfully!');
    } catch (err) {
        console.error('❌ Database setup failed:', err.message);
    } finally {
        await pool.end();
    }
}

setupDatabase();
