import { Router } from 'express'
import { query } from '../db'

const router = Router()

// Create project
router.post('/projects', async (req, res) => {
  try {
    const p = req.body
    const result = await query('INSERT INTO projects(nome,tipo,area,localizacao,metas,criado_em) VALUES(?,?,?,?,?, datetime(\'now\'))', [p.nome, p.tipo || null, p.area || null, p.localizacao || null, p.metas || null])
    const created = await query('SELECT * FROM projects WHERE id = ?', [result.lastID])
    res.status(201).json(created.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'db_insert_error' })
  }
})

// Get project with items
router.get('/projects/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const p = await query('SELECT * FROM projects WHERE id=?', [id])
    if (p.rowCount === 0) return res.status(404).json({ error: 'not_found' })
    const items = await query('SELECT * FROM project_items WHERE project_id=?', [id])
    res.json({ project: p.rows[0], items: items.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'db_error' })
  }
})

// Add item to project
router.post('/projects/:id/items', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const it = req.body
    const result = await query('INSERT INTO project_items(project_id,material_id,quantidade,unidade,criado_em) VALUES(?,?,?,?, datetime(\'now\'))', [id, it.material_id, it.quantidade, it.unidade || null])
    const created = await query('SELECT * FROM project_items WHERE id = ?', [result.lastID])
    res.status(201).json(created.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'db_insert_error' })
  }
})

export default router
