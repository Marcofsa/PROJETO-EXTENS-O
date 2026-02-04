import fs from 'fs'
import path from 'path'
import { exec, query } from './db'

async function ensureMigrationsTable() {
  exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      run_on TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

async function getAppliedMigrations() {
  const res = await query('SELECT name FROM migrations')
  return new Set(res.rows.map((r: any) => r.name))
}

async function runMigration(name: string, sql: string) {
  console.log(`Running migration: ${name}`)
  exec(sql)
  await query('INSERT INTO migrations(name) VALUES(?)', [name])
  console.log(`Applied: ${name}`)
}

async function main() {
  try {
    await ensureMigrationsTable()
    const migrationsDir = path.resolve(__dirname, '..', 'db', 'migrations')
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
    const applied = await getAppliedMigrations()

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping already applied: ${file}`)
        continue
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      await runMigration(file, sql)
    }

    console.log('Migrations complete')
    process.exit(0)
  } catch (err) {
    console.error('Migration failed', err)
    process.exit(1)
  }
}

main()
