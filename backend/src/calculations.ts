type Item = { materialId: string; quantidade: number }
type Material = { id: string; pegada_carbono: number; unidade: string }

function findMaterial(materials: Material[], id: string) {
  return materials.find((m) => m.id === id)
}

export function calculateProjectImpact(items: Item[], materials: Material[]) {
  const totals = { pegada_carbono_kg: 0 }

  for (const it of items) {
    const mat = findMaterial(materials, it.materialId)
    if (!mat) continue
    const qty = Number(it.quantidade) || 0
    totals.pegada_carbono_kg += qty * (mat.pegada_carbono || 0)
  }

  return totals
}
