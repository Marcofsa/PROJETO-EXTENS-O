import { Router } from 'express'
import { calculateProjectImpact } from '../calculations'
import { query } from '../db'

const router = Router()

router.get('/materials', async (req, res) => {
  try {
    const { categoria, q, userId, isAdmin } = req.query
    if (!userId) return res.status(400).json({ error: 'missing_user' })
    const userIdNum = Number(userId)
    const admin = String(isAdmin) === 'true'

    let sql = 'SELECT id, nome, unidade, pegada_carbono, custo_unitario, categoria, user_id FROM materials'
    const params: any[] = []
    const cond: string[] = []
    if (admin) {
      cond.push('(user_id IS NULL OR user_id = ?)')
      params.push(userIdNum)
    } else {
      cond.push('user_id = ?')
      params.push(userIdNum)
    }
    if (categoria) { params.push(String(categoria)); cond.push('categoria = ?') }
    if (q) { params.push(`%${String(q)}%`); cond.push('LOWER(nome) LIKE LOWER(?)') }
    sql += ' WHERE ' + cond.join(' AND ')

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'db_error' })
  }
})

router.post('/materials', async (req, res) => {
  try {
    const m = req.body
    if (!m.user_id) return res.status(400).json({ error: 'missing_user' })
    const sql = 'INSERT INTO materials(id,nome,categoria,subcategoria,unidade,pegada_carbono,custo_unitario,user_id,criado_em) VALUES(?,?,?,?,?,?,?,?, datetime(\'now\'))'
    const params = [m.id, m.nome, m.categoria || null, m.subcategoria || null, m.unidade || null, m.pegada_carbono || null, m.custo_unitario || null, m.user_id]
    await query(sql, params)
    const created = await query('SELECT * FROM materials WHERE id = ? AND user_id = ?', [m.id, m.user_id])
    res.status(201).json(created.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'db_insert_error' })
  }
})

router.get('/materials/:id', async (req, res) => {
  try {
    const id = req.params.id
    const { userId, isAdmin } = req.query
    if (!userId) return res.status(400).json({ error: 'missing_user' })
    const userIdNum = Number(userId)
    const admin = String(isAdmin) === 'true'
    const sql = admin
      ? 'SELECT * FROM materials WHERE id = ? AND (user_id IS NULL OR user_id = ?)'
      : 'SELECT * FROM materials WHERE id = ? AND user_id = ?'
    const result = await query(sql, [id, userIdNum])
    if (result.rowCount === 0) return res.status(404).json({ error: 'not_found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'db_error' })
  }
})

router.put('/materials/:id', async (req, res) => {
  try {
    const id = req.params.id
    const m = req.body
    if (!m.user_id) return res.status(400).json({ error: 'missing_user' })
    const admin = Boolean(m.is_admin)
    const sql = admin
      ? 'UPDATE materials SET nome=?,categoria=?,subcategoria=?,unidade=?,pegada_carbono=?,custo_unitario=?,atualizado_em=datetime(\'now\') WHERE id=? AND (user_id IS NULL OR user_id = ?)'
      : 'UPDATE materials SET nome=?,categoria=?,subcategoria=?,unidade=?,pegada_carbono=?,custo_unitario=?,atualizado_em=datetime(\'now\') WHERE id=? AND user_id = ?'
    const params = admin
      ? [m.nome, m.categoria || null, m.subcategoria || null, m.unidade || null, m.pegada_carbono || null, m.custo_unitario || null, id, m.user_id]
      : [m.nome, m.categoria || null, m.subcategoria || null, m.unidade || null, m.pegada_carbono || null, m.custo_unitario || null, id, m.user_id]
    const result = await query(sql, params)
    if (result.rowCount === 0) return res.status(404).json({ error: 'not_found' })
    const updated = await query('SELECT * FROM materials WHERE id = ? AND (user_id IS NULL OR user_id = ?)', [id, m.user_id])
    res.json(updated.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'db_update_error' })
  }
})

router.delete('/materials/:id', async (req, res) => {
  try {
    const id = req.params.id
    const { userId, isAdmin } = req.query
    if (!userId) return res.status(400).json({ error: 'missing_user' })
    const userIdNum = Number(userId)
    const admin = String(isAdmin) === 'true'
    const sql = admin
      ? 'DELETE FROM materials WHERE id=? AND (user_id IS NULL OR user_id = ?)'
      : 'DELETE FROM materials WHERE id=? AND user_id = ?'
    await query(sql, [id, userIdNum])
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'db_delete_error' })
  }
})

router.post('/calculate', async (req, res) => {
  try {
    const { items } = req.body
    const ids = (items || [])
      .map((i: any) => i.material_id || i.materialId)
      .filter(Boolean)
    let materialsList: any[] = []
    if (ids.length) {
      const placeholders = ids.map(() => '?').join(',')
      const result = await query(`SELECT id, pegada_carbono, unidade FROM materials WHERE id IN (${placeholders})`, ids)
      materialsList = result.rows
    }
    const impact = calculateProjectImpact(
      (items || []).map((it: any) => ({ materialId: it.material_id || it.materialId, quantidade: it.quantidade })),
      materialsList
    )
    res.json(impact)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'calculation_error' })
  }
})

export default router
