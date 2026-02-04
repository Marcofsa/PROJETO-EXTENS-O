import { Router } from 'express'
const bcrypt = require('bcryptjs')
import { query } from '../db'

const router = Router()

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

router.post('/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body || {}
        if (!email || !password) return res.status(400).json({ error: 'missing_fields' })

        const normalizedEmail = normalizeEmail(String(email))
        if (normalizedEmail === 'admin@calcadmin.br') {
            return res.status(403).json({ error: 'reserved_email' })
        }
        if (!normalizedEmail.includes('@') || String(password).length < 6) {
            return res.status(400).json({ error: 'invalid_input' })
        }

        const hash = await bcrypt.hash(String(password), 10)
        const countRes = await query('SELECT COUNT(*) as total FROM users')
        const totalUsers = Number(countRes.rows[0]?.total || 0)
        const isAdmin = totalUsers === 0 ? 1 : 0
        await query('INSERT INTO users(email, password_hash, is_admin) VALUES(?, ?, ?)', [normalizedEmail, hash, isAdmin])
        const created = await query('SELECT id, email, is_admin, criado_em FROM users WHERE email = ?', [normalizedEmail])
        const row = created.rows[0]
        res.status(201).json({ id: row.id, email: row.email, is_admin: Boolean(row.is_admin) })
    } catch (err: any) {
        if (String(err?.message || '').includes('UNIQUE')) {
            return res.status(409).json({ error: 'email_exists' })
        }
        console.error(err)
        res.status(500).json({ error: 'db_insert_error' })
    }
})

router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body || {}
        if (!email || !password) return res.status(400).json({ error: 'missing_fields' })

        const normalizedEmail = normalizeEmail(String(email))
        const userRes = await query('SELECT id, email, password_hash, is_admin FROM users WHERE email = ?', [normalizedEmail])
        if (userRes.rowCount === 0) return res.status(401).json({ error: 'invalid_credentials' })

        const user = userRes.rows[0]
        const ok = await bcrypt.compare(String(password), String(user.password_hash))
        if (!ok) return res.status(401).json({ error: 'invalid_credentials' })

        res.json({ id: user.id, email: user.email, is_admin: Boolean(user.is_admin) })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'auth_error' })
    }
})

export default router
