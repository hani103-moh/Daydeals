
import pkg from 'pg';
const { Pool } = pkg;

const neonUrl = 'postgresql://neondb_owner:npg_v9xk7nlEJbjz@ep-weathered-dawn-apantfwu-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const envDbUrl = process.env.DATABASE_URL;
const connectionString = (envDbUrl && envDbUrl.startsWith('postgres')) ? envDbUrl : neonUrl;

const pool = new Pool({ connectionString });

async function findRecentUser() {
  const res = await pool.query("SELECT email FROM users ORDER BY created_at DESC LIMIT 1");
  return res.rows[0].email;
}

async function test() {
  const email = await findRecentUser();
  console.log(`Testing login for: ${email}`);
  const data = {
    email: email,
    password: 'password123'
  };

  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    console.log(`Status: ${res.status}`);
    console.log(await res.text());
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}
test();
