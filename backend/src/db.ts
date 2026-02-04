const Database: any = require('better-sqlite3')
import path from 'path'

const dbFile = process.env.SQLITE_FILE || path.resolve(__dirname, '..', 'db', 'pe_db.sqlite')
const db = new Database(dbFile)
db.pragma('foreign_keys = ON')

function normalizeSql(text: string) {
  return text.replace(/\$\d+/g, '?')
}

function isSelectQuery(text: string) {
  const trimmed = text.trim().toLowerCase()
  return trimmed.startsWith('select') || trimmed.startsWith('with')
}

export async function query(text: string, params: any[] = []) {
  const sql = normalizeSql(text)
  if (isSelectQuery(sql)) {
    const rows = db.prepare(sql).all(params)
    return { rows, rowCount: rows.length }
  }

  const info = db.prepare(sql).run(params)
  return { rows: [], rowCount: info.changes, lastID: Number(info.lastInsertRowid || 0) }
}

export function exec(text: string) {
  db.exec(text)
}

export default db
