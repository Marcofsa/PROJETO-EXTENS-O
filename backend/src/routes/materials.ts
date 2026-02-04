import { Router } from 'express'
import { calculateProjectImpact } from '../calculations'
import { query } from '../db'

const router = Router()

router.get('/materials', async (req, res) => {
  try {
    const { categoria, q } = req.query
    let sql = 'SELECT id, nome, unidade, pegada_carbono, custo_unitario FROM materials'
    const params: any[] = []
    if (categoria || q) {
      const cond: string[] = []
      if (categoria) { params.push(String(categoria)); cond.push('categoria = ?') }
      if (q) { params.push(`%${String(q)}%`); cond.push('LOWER(nome) LIKE LOWER(?)') }
      sql += ' WHERE ' + cond.join(' AND ')
    }
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
    const sql = 'INSERT INTO materials(id,nome,categoria,subcategoria,unidade,pegada_carbono,custo_unitario,criado_em) VALUES(?,?,?,?,?,?,?, datetime(\'now\'))'
    const params = [m.id, m.nome, m.categoria || null, m.subcategoria || null, m.unidade || null, m.pegada_carbono || null, m.custo_unitario || null]
    await query(sql, params)
    const created = await query('SELECT * FROM materials WHERE id = ?', [m.id])
    res.status(201).json(created.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'db_insert_error' })
  }
})

router.get('/materials/:id', async (req, res) => {
  try {
    const id = req.params.id
    const result = await query('SELECT * FROM materials WHERE id = ?', [id])
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
    const sql = 'UPDATE materials SET nome=?,categoria=?,subcategoria=?,unidade=?,pegada_carbono=?,custo_unitario=?,atualizado_em=datetime(\'now\') WHERE id=?'
    const params = [m.nome, m.categoria || null, m.subcategoria || null, m.unidade || null, m.pegada_carbono || null, m.custo_unitario || null, id]
    const result = await query(sql, params)
    if (result.rowCount === 0) return res.status(404).json({ error: 'not_found' })
    const updated = await query('SELECT * FROM materials WHERE id = ?', [id])
    res.json(updated.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'db_update_error' })
  }
})

router.delete('/materials/:id', async (req, res) => {
  try {
    const id = req.params.id
    await query('DELETE FROM materials WHERE id=?', [id])
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'db_delete_error' })
  }
})

router.post('/calculate', async (req, res) => {
  try {
    const { items } = req.body
    const ids = (items || []).map((i: any) => i.material_id).filter(Boolean)
    let materialsList: any[] = []
    if (ids.length) {
      const placeholders = ids.map(() => '?').join(',')
      const result = await query(`SELECT id, pegada_carbono, unidade FROM materials WHERE id IN (${placeholders})`, ids)
      materialsList = result.rows
    }
    const impact = calculateProjectImpact((items || []).map((it: any) => ({ materialId: it.material_id, quantidade: it.quantidade })), materialsList)
    res.json(impact)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'calculation_error' })
  }
})

export default router
