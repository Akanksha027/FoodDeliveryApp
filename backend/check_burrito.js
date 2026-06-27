// backend/check_burrito.js
const { Client } = require('pg');

const connectionString = "postgresql://postgres.uelxwqpvjdrkxsgotoia:Akanksha2005@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    const res = await client.query("SELECT id, name, category, recommendations FROM menu_items WHERE name ILIKE '%burrito%' OR name ILIKE '%burger%';");
    console.log(`Found ${res.rows.length} matching items:`);
    res.rows.forEach(row => {
      console.log(`- ID: ${row.id}`);
      console.log(`  Name: ${row.name}`);
      console.log(`  Category: ${row.category}`);
      console.log(`  Recommendations:`, row.recommendations);
      console.log(`  Type: ${typeof row.recommendations}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
