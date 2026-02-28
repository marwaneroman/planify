/**
 * Creates the PostgreSQL user and database from your DATABASE_URL.
 * Run once: npm run db:setup (from backend folder).
 *
 * Requires an admin connection. Set POSTGRES_ADMIN_URL in .env, or the script
 * will use postgresql://postgres:postgres@localhost:5432/postgres
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env"), override: true });

const adminUrl =
  process.env.POSTGRES_ADMIN_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";

function parseDbUrl(urlString) {
  const u = new URL(urlString);
  return {
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1).replace(/\/$/, ""),
    host: u.hostname,
    port: u.port || "5432",
  };
}

async function main() {
  const target = parseDbUrl(process.env.DATABASE_URL);
  if (!target.database) {
    console.error("DATABASE_URL has no database name.");
    process.exit(1);
  }

  console.log(
    `Creating user "${target.user}" and database "${target.database}" if they don't exist...`
  );

  const admin = parseDbUrl(adminUrl);
  const client = new pg.Client({
    host: admin.host,
    port: parseInt(admin.port, 10),
    user: admin.user,
    password: admin.password,
    database: "postgres",
  });

  try {
    await client.connect();
  } catch (err) {
    console.error(
      "Could not connect as admin. Set POSTGRES_ADMIN_URL in .env (e.g. postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres) and ensure PostgreSQL is running."
    );
    console.error(err.message);
    process.exit(1);
  }

  try {
    const safeUser = target.user.replace(/"/g, '""');
    const roleCheck = await client.query(
      `SELECT 1 FROM pg_roles WHERE rolname = $1`,
      [target.user]
    );
    if (roleCheck.rows.length === 0) {
      await client.query(
        `CREATE ROLE "${safeUser}" WITH LOGIN PASSWORD $1`,
        [target.password]
      );
      console.log(`User "${target.user}" created.`);
    } else {
      console.log(`User "${target.user}" already exists.`);
    }

    // Create database - ignore if exists
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [target.database]
    );
    if (dbCheck.rows.length === 0) {
      await client.query(`CREATE DATABASE "${target.database}" OWNER "${safeUser}"`);
      console.log(`Database "${target.database}" created.`);
    } else {
      console.log(`Database "${target.database}" already exists.`);
    }

    // Grant privileges so the user can use the DB
    await client.query(
      `GRANT ALL PRIVILEGES ON DATABASE "${target.database}" TO "${safeUser}"`
    );
    await client.query(`GRANT ALL ON SCHEMA public TO "${safeUser}"`);

    console.log("Setup done. Run: npm run db:push");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
