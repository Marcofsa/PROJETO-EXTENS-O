import path from 'path'
import express from 'express'
import cors from 'cors'
const bcrypt = require('bcryptjs')
import { query } from './db'
import materialsRouter from './routes/materials'
import projectsRouter from './routes/projects'
import authRouter from './routes/auth'

const app = express()

const allowedOrigin = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000'
  : (process.env.CORS_ORIGIN || '')

const corsOptions = allowedOrigin ? { origin: allowedOrigin, optionsSuccessStatus: 200 } : undefined
app.use(cors(corsOptions))
app.use(express.json())

app.use('/api', materialsRouter)
app.use('/api', projectsRouter)
app.use('/api', authRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const frontendPath = path.join(__dirname, '../../frontend/dist')
app.use(express.static(frontendPath))

app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'))
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000

const ADMIN_EMAIL = 'admin@calcadmin.br'
const ADMIN_PASSWORD = 'calcadmin'

async function ensureAdminUser() {
  try {
    const res = await query('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL])
    if (res.rowCount > 0) return
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10)
    await query('INSERT INTO users(email, password_hash, is_admin) VALUES(?, ?, 1)', [ADMIN_EMAIL, hash])
    console.log('Admin user created')
  } catch (err) {
    console.error('Failed to ensure admin user', err)
  }
}

ensureAdminUser().finally(() => {
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`)
  })
})
