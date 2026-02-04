import React, { useEffect, useState } from 'react'

type Material = {
  id: string
  nome: string
  unidade: string
  pegada_carbono: number
  categoria?: string
  custo_unitario?: number
}

export default function App() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [crudError, setCrudError] = useState<string | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [items, setItems] = useState<{ materialId: string; quantidade: number }[]>([])
  const [selected, setSelected] = useState<string>('')
  const [qty, setQty] = useState<number>(0)
  const [result, setResult] = useState<any>(null)
  const [search, setSearch] = useState<string>('')
  const [categoria, setCategoria] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [materialForm, setMaterialForm] = useState({
    id: '',
    nome: '',
    categoria: '',
    unidade: '',
    pegada_carbono: '',
    custo_unitario: ''
  })

  async function loadMaterials() {
    setLoading(true)
    try {
      const r = await fetch('/api/materials')
      if (!r.ok) throw new Error('fetch_error')
      const data = await r.json()
      setMaterials(data)
      setError(null)
    } catch (e) {
      console.error(e)
      setMaterials([])
      setError('Falha ao carregar materiais')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMaterials()
  }, [])

  function addItem() {
    if (!selected || !qty || qty <= 0) {
      setFormError('Selecione um material e informe uma quantidade válida.')
      return
    }
    setItems((s) => [...s, { materialId: selected, quantidade: qty }])
    setQty(0)
    setFormError(null)
  }

  async function calculate() {
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ error: 'network_error' })
    }
  }

  function removeItem(index: number) {
    setItems((s) => s.filter((_, i) => i !== index))
  }

  function resetForm() {
    setMaterialForm({ id: '', nome: '', categoria: '', unidade: '', pegada_carbono: '', custo_unitario: '' })
    setEditingId(null)
    setCrudError(null)
  }

  function startEdit(m: Material) {
    setMaterialForm({
      id: m.id,
      nome: m.nome || '',
      categoria: m.categoria || '',
      unidade: m.unidade || '',
      pegada_carbono: m.pegada_carbono?.toString() || '',
      custo_unitario: m.custo_unitario?.toString() || ''
    })
    setEditingId(m.id)
    setCrudError(null)
  }

  async function saveMaterial() {
    if (!materialForm.id || !materialForm.nome || !materialForm.unidade || !materialForm.pegada_carbono) {
      setCrudError('Preencha id, nome, unidade e coeficiente de carbono.')
      return
    }

    const payload = {
      id: materialForm.id,
      nome: materialForm.nome,
      categoria: materialForm.categoria || null,
      unidade: materialForm.unidade,
      pegada_carbono: Number(materialForm.pegada_carbono),
      custo_unitario: materialForm.custo_unitario ? Number(materialForm.custo_unitario) : null
    }

    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/materials/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('update_error')
      } else {
        const res = await fetch('/api/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('create_error')
      }

      await loadMaterials()
      resetForm()
    } catch (e) {
      console.error(e)
      setCrudError('Falha ao salvar material.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMaterial(id: string) {
    if (!window.confirm('Remover este material?')) return
    try {
      const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete_error')
      await loadMaterials()
    } catch (e) {
      console.error(e)
      setCrudError('Falha ao remover material.')
    }
  }

  const categories = Array.from(new Set(materials.map((m) => m.categoria).filter(Boolean))) as string[]
  const filteredMaterials = materials.filter((m) => {
    const byCategory = categoria ? m.categoria === categoria : true
    const bySearch = search ? m.nome.toLowerCase().includes(search.toLowerCase()) : true
    return byCategory && bySearch
  })
  const selectedMaterial = materials.find((m) => m.id === selected)
  const totalItems = items.reduce((acc, it) => acc + it.quantidade, 0)

  return (
    <div className="app-bg">
      <div className="container py-4">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="mb-1">Calculadora de Sustentabilidade</h1>
            <div className="text-muted">Monte um projeto e estime impactos ambientais por material.</div>
          </div>
          <span className="badge text-bg-success">SQLite + API local</span>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h2 className="h5">Gerenciar materiais (CRUD)</h2>
                <div className="text-muted mb-3">Cadastre o coeficiente de carbono para usar nos cálculos.</div>

                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label">ID</label>
                    <input
                      className="form-control"
                      value={materialForm.id}
                      onChange={(e) => setMaterialForm((s) => ({ ...s, id: e.target.value }))}
                      placeholder="ex: madeira_certificada"
                      disabled={!!editingId}
                    />
                  </div>
                  <div className="col-12 col-md-8">
                    <label className="form-label">Nome</label>
                    <input
                      className="form-control"
                      value={materialForm.nome}
                      onChange={(e) => setMaterialForm((s) => ({ ...s, nome: e.target.value }))}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label">Categoria</label>
                    <input
                      className="form-control"
                      value={materialForm.categoria}
                      onChange={(e) => setMaterialForm((s) => ({ ...s, categoria: e.target.value }))}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label">Unidade</label>
                    <input
                      className="form-control"
                      value={materialForm.unidade}
                      onChange={(e) => setMaterialForm((s) => ({ ...s, unidade: e.target.value }))}
                      placeholder="m², kg, m³..."
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label">Coef. carbono</label>
                    <input
                      type="number"
                      className="form-control"
                      value={materialForm.pegada_carbono}
                      onChange={(e) => setMaterialForm((s) => ({ ...s, pegada_carbono: e.target.value }))}
                      placeholder="kgCO₂eq / unidade"
                      min={0}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label">Custo unitário</label>
                    <input
                      type="number"
                      className="form-control"
                      value={materialForm.custo_unitario}
                      onChange={(e) => setMaterialForm((s) => ({ ...s, custo_unitario: e.target.value }))}
                      placeholder="opcional"
                      min={0}
                    />
                  </div>
                </div>

                {crudError && <div className="alert alert-warning mt-3" role="alert">{crudError}</div>}

                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-primary" onClick={saveMaterial} disabled={saving}>
                    {editingId ? 'Atualizar material' : 'Salvar material'}
                  </button>
                  <button className="btn btn-outline-secondary" onClick={resetForm} disabled={saving}>Limpar</button>
                </div>
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <h2 className="h5 mb-0">Catálogo de Materiais</h2>
                  {loading && <span className="spinner-border spinner-border-sm text-secondary" aria-hidden="true" />}
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-12 col-md-7">
                    <input
                      className="form-control"
                      placeholder="Buscar material..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-5">
                    <select className="form-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                      <option value="">Todas as categorias</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th>Categoria</th>
                        <th className="text-end">Pegada</th>
                        <th className="text-end">Unidade</th>
                        <th className="text-end">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMaterials.length === 0 && !loading && (
                        <tr>
                          <td colSpan={5} className="text-muted">Nenhum material encontrado.</td>
                        </tr>
                      )}
                      {filteredMaterials.map((m) => (
                        <tr key={m.id}>
                          <td>{m.nome}</td>
                          <td className="text-muted">{m.categoria || '-'}</td>
                          <td className="text-end">{m.pegada_carbono}</td>
                          <td className="text-end">{m.unidade}</td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm" role="group">
                              <button className="btn btn-outline-primary" onClick={() => startEdit(m)}>Editar</button>
                              <button className="btn btn-outline-danger" onClick={() => deleteMaterial(m.id)}>Excluir</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h2 className="h5">Adicionar item</h2>
                <div className="mb-2 text-muted">Selecione o material e informe a quantidade.</div>

                <div className="mb-3">
                  <label className="form-label">Material</label>
                  <select
                    className="form-select"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    <option value="">Selecione um material</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>{m.nome} ({m.unidade})</option>
                    ))}
                  </select>
                  {selectedMaterial && (
                    <div className="form-text">
                      Pegada: {selectedMaterial.pegada_carbono} kgCO₂eq / {selectedMaterial.unidade}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Quantidade</label>
                  <input
                    type="number"
                    className="form-control"
                    value={qty || ''}
                    onChange={(e) => setQty(Number(e.target.value))}
                    placeholder="0"
                    min={0}
                  />
                </div>

                {formError && <div className="alert alert-warning py-2" role="alert">{formError}</div>}

                <button className="btn btn-primary w-100" onClick={addItem}>Adicionar ao projeto</button>
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <h2 className="h5 mb-0">Itens do projeto</h2>
                  <span className="badge text-bg-light">{items.length} itens</span>
                </div>
                <div className="text-muted mb-3">Total de quantidades: {totalItems}</div>

                {items.length === 0 ? (
                  <div className="text-muted">Adicione itens para calcular o impacto.</div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {items.map((it, i) => {
                      const mat = materials.find((m) => m.id === it.materialId)
                      return (
                        <li key={i} className="list-group-item d-flex align-items-center justify-content-between">
                          <div>
                            <div className="fw-semibold">{mat ? mat.nome : it.materialId}</div>
                            <div className="text-muted small">{it.quantidade} {mat?.unidade}</div>
                          </div>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => removeItem(i)}>Remover</button>
                        </li>
                      )
                    })}
                  </ul>
                )}

                <div className="d-grid gap-2 mt-3">
                  <button className="btn btn-success" onClick={calculate} disabled={items.length === 0}>Calcular Impacto</button>
                  <button className="btn btn-outline-secondary" onClick={() => setItems([])} disabled={items.length === 0}>Limpar itens</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm mt-4">
          <div className="card-body">
            <h2 className="h5">Resultado</h2>
            {!result ? (
              <div className="text-muted">Nenhum cálculo realizado.</div>
            ) : result.error ? (
              <div className="alert alert-danger" role="alert">Falha ao calcular impacto.</div>
            ) : (
              <pre className="result-box">{JSON.stringify(result, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
