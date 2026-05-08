
import pkg from 'pg';
const { Pool } = pkg;

const neonUrl = 'postgresql://neondb_owner:npg_v9xk7nlEJbjz@ep-weathered-dawn-apantfwu-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const envDbUrl = process.env.DATABASE_URL;
const connectionString = (envDbUrl && envDbUrl.startsWith('postgres')) ? envDbUrl : neonUrl;

const pool = new Pool({ connectionString });

async function check() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables:", res.rows.map(r => r.table_name));
    
    const users = await pool.query("SELECT id, email, role FROM users");
    console.log("Users:", users.rows);
  } catch (err) {
    console.error("DB Check Error:", err);
  } finally {
    await pool.end();
  }
}

check();
