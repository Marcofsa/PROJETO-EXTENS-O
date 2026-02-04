import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

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
  const [result, setResult] = useState<{ apiTotal?: number; error?: string; calculatedAt?: string } | null>(null)
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
      if (!res.ok) throw new Error('calc_error')
      const data = await res.json()
      setResult({ apiTotal: data?.pegada_carbono_kg, calculatedAt: new Date().toISOString() })
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
  const numberFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
  const breakdown = items.map((it) => {
    const mat = materials.find((m) => m.id === it.materialId)
    const factor = mat?.pegada_carbono ? Number(mat.pegada_carbono) : 0
    const impact = Number(it.quantidade) * factor
    return {
      id: it.materialId,
      nome: mat?.nome || it.materialId,
      unidade: mat?.unidade || '',
      quantidade: Number(it.quantidade),
      fator: factor,
      impacto: impact
    }
  })
  const totalImpact = breakdown.reduce((acc, it) => acc + it.impacto, 0)
  const topBreakdown = [...breakdown].sort((a, b) => b.impacto - a.impacto).slice(0, 6)
  const chartColors = ['#0ea5e9', '#22c55e', '#f97316', '#e11d48', '#8b5cf6', '#14b8a6']
  const barData = {
    labels: breakdown.map((it) => it.nome),
    datasets: [
      {
        label: 'Impacto (kgCO₂eq)',
        data: breakdown.map((it) => it.impacto),
        backgroundColor: '#0ea5e9'
      }
    ]
  }
  const doughnutData = {
    labels: topBreakdown.map((it) => it.nome),
    datasets: [
      {
        data: topBreakdown.map((it) => it.impacto),
        backgroundColor: chartColors.slice(0, topBreakdown.length)
      }
    ]
  }

  function exportToExcel() {
    if (breakdown.length === 0) return
    const summaryRows = [
      {
        metric: 'Pegada total (kgCO2eq)',
        value: totalImpact,
        api_total: result?.apiTotal ?? ''
      }
    ]
    const itemRows = breakdown.map((it) => ({
      id: it.id,
      nome: it.nome,
      quantidade: it.quantidade,
      unidade: it.unidade,
      coeficiente: it.fator,
      impacto_kgco2eq: it.impacto
    }))
    const topRows = topBreakdown.map((it) => ({
      nome: it.nome,
      impacto_kgco2eq: it.impacto
    }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Resumo')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemRows), 'Itens')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topRows), 'TopCarbono')

    const fileName = `impacto_carbono_${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

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
        
        <div className="card shadow-sm mt-4 result-card">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h2 className="h5 mb-1">Resultado do cálculo</h2>
                <div className="text-muted">Detalhamento por item e total da pegada de carbono.</div>
              </div>
              <div className="d-flex align-items-center gap-2">
                {result?.calculatedAt && (
                  <span className="badge text-bg-light">Calculado agora</span>
                )}
                <button
                  className="btn btn-outline-dark btn-sm"
                  onClick={exportToExcel}
                  disabled={breakdown.length === 0}
                >
                  Exportar Excel
                </button>
              </div>
            </div>

            {!result ? (
              <div className="text-muted mt-3">Nenhum cálculo realizado.</div>
            ) : result.error ? (
              <div className="alert alert-danger mt-3" role="alert">Falha ao calcular impacto.</div>
            ) : (
              <>
                <div className="impact-total mt-3">
                  <div className="impact-total__label">Pegada total</div>
                  <div className="impact-total__value">{numberFmt.format(totalImpact)} kgCO₂eq</div>
                  {typeof result.apiTotal === 'number' && (
                    <div className="text-muted small">API: {numberFmt.format(result.apiTotal)} kgCO₂eq</div>
                  )}
                </div>

                {breakdown.length > 0 && (
                  <div className="chart-grid mt-4">
                    <div className="card shadow-sm chart-card">
                      <div className="card-body">
                        <h3 className="h6">Impacto por item</h3>
                        <div className="chart-box">
                          <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                        </div>
                      </div>
                    </div>
                    <div className="card shadow-sm chart-card">
                      <div className="card-body">
                        <h3 className="h6">Maiores emissores</h3>
                        <div className="chart-box">
                          <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="table-responsive mt-3">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="text-end">Quantidade</th>
                        <th className="text-end">Coeficiente</th>
                        <th className="text-end">Impacto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-muted">Nenhum item no projeto.</td>
                        </tr>
                      ) : (
                        breakdown.map((it) => (
                          <tr key={`${it.id}-${it.nome}`}>
                            <td>
                              <div className="fw-semibold">{it.nome}</div>
                              <div className="text-muted small">{it.id}</div>
                            </td>
                            <td className="text-end">{numberFmt.format(it.quantidade)} {it.unidade}</td>
                            <td className="text-end">{numberFmt.format(it.fator)} kgCO₂eq/{it.unidade || '-'}</td>
                            <td className="text-end fw-semibold">{numberFmt.format(it.impacto)} kgCO₂eq</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
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
      </div>
    </div>
  )
}
