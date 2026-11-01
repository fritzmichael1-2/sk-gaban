require("dotenv").config();
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/db");

(async () => {
  const schema = fs.readFileSync(path.join(__dirname, "../database/schema.sql"), "utf8");
  // The schema contains no procedural blocks, so semicolon-separated statements are safe.
  const statements = schema.split(/;\s*(?:\r?\n|$)/).map(s => s.trim()).filter(Boolean);
  for (const statement of statements) await pool.query(statement);

  const existing = await pool.query("SELECT id FROM admins WHERE username = $1 LIMIT 1", ["admin"]);
  if (existing.rowCount === 0) {
    const hash = await bcrypt.hash(process.env.INITIAL_ADMIN_PASSWORD || "ChangeMe123!", 12);
    await pool.query(
      "INSERT INTO admins (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4)",
      [process.env.INITIAL_ADMIN_USERNAME || "admin", hash, "SK Gaban Administrator", "super_admin"]
    );
    console.log("Initial admin account created. Change its password immediately.");
  } else {
    console.log("Admin account already exists; no default account was changed.");
  }
  await pool.end();
  console.log("Supabase PostgreSQL schema initialized successfully.");
})().catch(async error => {
  console.error("Database initialization failed:", error.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
