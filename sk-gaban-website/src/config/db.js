const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add your Supabase PostgreSQL connection string to the hosting environment.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase requires TLS for hosted database connections.
  ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
  max: Number(process.env.DB_POOL_MAX || 5),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  keepAlive: true
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

// Convert the project's existing positional ? placeholders to PostgreSQL $1, $2, ...
// This keeps route changes small while using parameterized queries.
function toPostgresPlaceholders(sql) {
  let index = 0;
  let output = "";
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    if (char === "'" && !inDouble && sql[i - 1] !== "\\") inSingle = !inSingle;
    else if (char === '"' && !inSingle && sql[i - 1] !== "\\") inDouble = !inDouble;
    if (char === "?" && !inSingle && !inDouble) {
      index += 1;
      output += `$${index}`;
    } else {
      output += char;
    }
  }
  return output;
}

async function query(sql, params = []) {
  const result = await pool.query(toPostgresPlaceholders(sql), params);
  return result.rows;
}

module.exports = { pool, query };
