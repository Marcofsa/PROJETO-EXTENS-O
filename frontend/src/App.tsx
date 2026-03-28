import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

type Material = {
  id: string;
  nome: string;
  unidade: string;
  pegada_carbono: number;
  categoria?: string;
  custo_unitario?: number;
};

type User = {
  id: number;
  email: string;
  is_admin?: boolean;
};

type ProjectItem = {
  materialId: string;
  quantidade: number;
};

type ResultState = {
  apiTotal?: number;
  error?: string;
  calculatedAt?: string;
} | null;

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "accent" | "success";
}) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
    </div>
  );
}

function AppSection({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-panel">
      <div className="section-head">
        <div>
          <span className="section-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {actions && <div className="section-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const apiBase = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
  const apiUrl = (path: string) => `${apiBase}${path}`;
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [crudError, setCrudError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [qty, setQty] = useState<number>(0);
  const [result, setResult] = useState<ResultState>(null);
  const [search, setSearch] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState<boolean>(false);
  const [materialsModalOpen, setMaterialsModalOpen] = useState<boolean>(false);
  const [addItemModalOpen, setAddItemModalOpen] = useState<boolean>(false);
  const [materialSearch, setMaterialSearch] = useState<string>("");
  const [materialForm, setMaterialForm] = useState({
    id: "",
    nome: "",
    categoria: "",
    unidade: "",
    pegada_carbono: "",
    custo_unitario: "",
  });

  async function loadMaterials() {
    setLoading(true);
    try {
      if (!user) return;
      const qs = new URLSearchParams({
        userId: String(user.id),
        isAdmin: String(Boolean(user.is_admin)),
      });
      const response = await fetch(apiUrl(`/api/materials?${qs.toString()}`));
      if (!response.ok) throw new Error("fetch_error");
      const data = await response.json();
      setMaterials(data);
      setError(null);
    } catch (loadError) {
      console.error(loadError);
      setMaterials([]);
      setError("Falha ao carregar materiais.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadMaterials();
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const anyModalOpen = catalogOpen || materialsModalOpen || addItemModalOpen;
    document.body.style.overflow = anyModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [catalogOpen, materialsModalOpen, addItemModalOpen]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    if (!authEmail || !authPassword) {
      setAuthError("Preencha email e senha.");
      return;
    }

    if (authPassword.length < 6) {
      setAuthError("A senha deve ter ao menos 6 caracteres.");
      return;
    }

    setAuthLoading(true);
    try {
      const endpoint =
        authMode === "register" ? "/api/auth/register" : "/api/auth/login";
      const response = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      if (!response.ok) {
        if (response.status === 409) throw new Error("email_exists");
        if (response.status === 401) throw new Error("invalid_credentials");
        throw new Error("auth_error");
      }

      const data = await response.json();
      setUser(data);
      setAuthEmail("");
      setAuthPassword("");
    } catch (submitError: any) {
      const code = String(submitError?.message || "");
      if (code === "email_exists") setAuthError("Email já cadastrado.");
      else if (code === "invalid_credentials")
        setAuthError("Email ou senha inválidos.");
      else setAuthError("Falha ao autenticar. Tente novamente.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    setUser(null);
    setItems([]);
    setResult(null);
  }

  function addItem() {
    if (!selected || !qty || qty <= 0) {
      setFormError("Selecione um material e informe uma quantidade válida.");
      return false;
    }

    setItems((state) => [...state, { materialId: selected, quantidade: qty }]);
    setQty(0);
    setSelected("");
    setMaterialSearch("");
    setFormError(null);
    return true;
  }

  async function calculate() {
    try {
      const response = await fetch(apiUrl("/api/calculate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) throw new Error("calc_error");
      const data = await response.json();
      setResult({
        apiTotal: data?.pegada_carbono_kg,
        calculatedAt: new Date().toISOString(),
      });
    } catch (calcError) {
      console.error(calcError);
      setResult({ error: "network_error" });
    }
  }

  function removeItem(index: number) {
    setItems((state) => state.filter((_, itemIndex) => itemIndex !== index));
  }

  function resetForm() {
    setMaterialForm({
      id: "",
      nome: "",
      categoria: "",
      unidade: "",
      pegada_carbono: "",
      custo_unitario: "",
    });
    setEditingId(null);
    setCrudError(null);
  }

  function startEdit(material: Material) {
    setMaterialForm({
      id: material.id,
      nome: material.nome || "",
      categoria: material.categoria || "",
      unidade: material.unidade || "",
      pegada_carbono: material.pegada_carbono?.toString() || "",
      custo_unitario: material.custo_unitario?.toString() || "",
    });
    setEditingId(material.id);
    setCrudError(null);
    setCatalogOpen(false);
    setMaterialsModalOpen(false);
    window.setTimeout(() => setMaterialsModalOpen(true), 0);
  }

  async function saveMaterial() {
    if (
      !materialForm.id ||
      !materialForm.nome ||
      !materialForm.unidade ||
      !materialForm.pegada_carbono
    ) {
      setCrudError("Preencha ID, nome, unidade e coeficiente de carbono.");
      return;
    }

    const payload = {
      id: materialForm.id,
      nome: materialForm.nome,
      categoria: materialForm.categoria || null,
      unidade: materialForm.unidade,
      pegada_carbono: Number(materialForm.pegada_carbono),
      custo_unitario: materialForm.custo_unitario
        ? Number(materialForm.custo_unitario)
        : null,
      user_id: user?.id,
      is_admin: Boolean(user?.is_admin),
    };

    setSaving(true);
    try {
      if (editingId) {
        const response = await fetch(apiUrl(`/api/materials/${editingId}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("update_error");
      } else {
        const response = await fetch(apiUrl("/api/materials"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("create_error");
      }

      await loadMaterials();
      resetForm();
      setMaterialsModalOpen(false);
    } catch (saveError) {
      console.error(saveError);
      setCrudError("Falha ao salvar material.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMaterial(id: string) {
    if (!window.confirm("Remover este material?")) return;
    try {
      if (!user) return;
      const qs = new URLSearchParams({
        userId: String(user.id),
        isAdmin: String(Boolean(user.is_admin)),
      });
      const response = await fetch(
        apiUrl(`/api/materials/${id}?${qs.toString()}`),
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("delete_error");
      await loadMaterials();
    } catch (deleteError) {
      console.error(deleteError);
      setCrudError("Falha ao remover material.");
    }
  }

  const categories = Array.from(
    new Set(materials.map((material) => material.categoria).filter(Boolean)),
  ) as string[];

  const filteredMaterials = materials.filter((material) => {
    const byCategory = categoria ? material.categoria === categoria : true;
    const bySearch = search
      ? material.nome.toLowerCase().includes(search.toLowerCase())
      : true;
    return byCategory && bySearch;
  });

  const selectedMaterial = materials.find((material) => material.id === selected);

  const filteredMaterialOptions = materialSearch
    ? materials.filter((material) =>
        `${material.nome} ${material.id}`
          .toLowerCase()
          .includes(materialSearch.toLowerCase()),
      )
    : materials;

  const totalItems = items.reduce((acc, item) => acc + item.quantidade, 0);
  const totalMaterials = materials.length;
  const totalCategories = categories.length;
  const numberFmt = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  });

  const breakdown = items.map((item) => {
    const material = materials.find((entry) => entry.id === item.materialId);
    const factor = material?.pegada_carbono ? Number(material.pegada_carbono) : 0;
    const impact = Number(item.quantidade) * factor;

    return {
      id: item.materialId,
      nome: material?.nome || item.materialId,
      unidade: material?.unidade || "",
      quantidade: Number(item.quantidade),
      fator: factor,
      impacto: impact,
    };
  });

  const totalImpact = breakdown.reduce((acc, item) => acc + item.impacto, 0);
  const topBreakdown = [...breakdown]
    .sort((a, b) => b.impacto - a.impacto)
    .slice(0, 6);

  const chartColors = [
    "#0f766e",
    "#c2410c",
    "#2563eb",
    "#be123c",
    "#7c3aed",
    "#0891b2",
  ];

  const chartTextColor = theme === "dark" ? "#dbe5f4" : "#29404f";
  const chartGridColor =
    theme === "dark"
      ? "rgba(148, 163, 184, 0.16)"
      : "rgba(37, 99, 235, 0.12)";

  const barData = {
    labels: breakdown.map((item) => item.nome),
    datasets: [
      {
        label: "Impacto (kgCO2eq)",
        data: breakdown.map((item) => item.impacto),
        backgroundColor: [
          "rgba(15, 118, 110, 0.85)",
          "rgba(194, 65, 12, 0.82)",
          "rgba(37, 99, 235, 0.82)",
          "rgba(190, 24, 93, 0.82)",
          "rgba(124, 58, 237, 0.82)",
          "rgba(8, 145, 178, 0.82)",
        ],
        borderRadius: 14,
      },
    ],
  };

  const doughnutData = {
    labels: topBreakdown.map((item) => item.nome),
    datasets: [
      {
        data: topBreakdown.map((item) => item.impacto),
        backgroundColor: chartColors.slice(0, topBreakdown.length),
        borderWidth: 0,
      },
    ],
  };

  function exportToExcel() {
    if (breakdown.length === 0) return;

    const summaryRows = [
      {
        metric: "Pegada total (kgCO2eq)",
        value: totalImpact,
        api_total: result?.apiTotal ?? "",
      },
    ];

    const itemRows = breakdown.map((item) => ({
      id: item.id,
      nome: item.nome,
      quantidade: item.quantidade,
      unidade: item.unidade,
      coeficiente: item.fator,
      impacto_kgco2eq: item.impacto,
    }));

    const topRows = topBreakdown.map((item) => ({
      nome: item.nome,
      impacto_kgco2eq: item.impacto,
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(summaryRows),
      "Resumo",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(itemRows),
      "Itens",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(topRows),
      "TopCarbono",
    );

    const fileName = `impacto_carbono_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  return (
    <div className="app-shell">
      {!user ? (
        <div className="auth-layout">
          <section className="auth-brand-panel">
            <div>
              <span className="hero-chip">Plataforma de impacto</span>
              <h1>Carbono com leitura clara para projeto e catalogo.</h1>
              <p className="mb-0">
                Centralize materiais, monte composicoes e acompanhe a pegada de
                carbono com uma interface mais limpa e pronta para uso diario.
              </p>
            </div>

            <div className="hero-metrics">
              <div className="hero-note">
                <span>Catalogo</span>
                <strong>Cadastre materiais e padronize coeficientes.</strong>
              </div>
              <div className="hero-note">
                <span>Projeto</span>
                <strong>Adicione itens e compare impacto por material.</strong>
              </div>
              <div className="hero-note">
                <span>Relatorio</span>
                <strong>Exporte planilhas e acompanhe os maiores emissores.</strong>
              </div>
            </div>

            <div className="hero-note-grid">
              <div className="hero-note">
                <span>Operacao</span>
                <strong>{isOnline ? "Sistema online" : "Sistema offline"}</strong>
              </div>
              <div className="hero-note">
                <span>Uso</span>
                <strong>Login rapido para equipes e projetos recorrentes.</strong>
              </div>
            </div>
          </section>

          <div className="auth-form-panel">
            <section className="auth-panel-card">
              <span className="panel-pill">
                {authMode === "login" ? "Acesso seguro" : "Criar conta"}
              </span>
              <h2>{authMode === "login" ? "Entrar" : "Cadastro"}</h2>
              <p className="mb-0">
                Use seu email e senha para acessar os materiais e os calculos.
              </p>

              <form onSubmit={handleAuthSubmit} className="auth-form">
                <div className="field-stack">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    required
                  />
                </div>
                <div className="field-stack">
                  <label className="form-label">Senha</label>
                  <input
                    type="password"
                    className="form-control"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="minimo 6 caracteres"
                    required
                  />
                </div>

                {authError && (
                  <div className="alert alert-warning app-alert py-2" role="alert">
                    {authError}
                  </div>
                )}

                <button
                  className="btn btn-primary w-100"
                  type="submit"
                  disabled={authLoading}
                >
                  {authLoading
                    ? "Aguarde..."
                    : authMode === "register"
                      ? "Criar conta"
                      : "Entrar"}
                </button>
              </form>

              <button
                className="btn btn-link auth-switch"
                type="button"
                onClick={() =>
                  setAuthMode(authMode === "login" ? "register" : "login")
                }
              >
                {authMode === "login"
                  ? "Ainda nao tem conta? Cadastre-se"
                  : "Ja tem conta? Entrar"}
              </button>
            </section>
          </div>
        </div>
      ) : (
        <div className="dashboard-shell">
          <section className="hero-banner">
            <div className="hero-banner__content">
              <span className="hero-chip">Painel do projeto</span>
              <h1>Calculadora de carbono para materiais de construcao.</h1>
              <p className="mb-0">
                Combine catalogo, composicao do projeto e leitura visual do
                impacto em uma unica tela.
              </p>

              <div className="hero-badges mt-4 justify-content-start">
                <span
                  className={`connection-badge ${isOnline ? "is-online" : "is-offline"}`}
                >
                  <span className="connection-dot" />
                  {isOnline ? "Online" : "Offline"}
                </span>
                <span className="badge rounded-pill text-bg-light">
                  {totalMaterials} materiais
                </span>
                <span className="badge rounded-pill text-bg-light">
                  {items.length} itens no projeto
                </span>
              </div>
            </div>

            <div className="hero-banner__aside">
              <div className="user-badge">
                <span>Usuario conectado</span>
                <strong>{user.email}</strong>
              </div>
              <div className="action-row">
                <button
                  className="btn btn-light"
                  onClick={() => setAddItemModalOpen(true)}
                >
                  Novo item
                </button>
                <button
                  className="btn btn-outline-light hero-logout"
                  onClick={handleLogout}
                >
                  Sair
                </button>
              </div>
            </div>
          </section>

          <div className="dashboard-metrics">
            <StatCard label="Materiais ativos" value={String(totalMaterials)} />
            <StatCard
              label="Categorias"
              value={String(totalCategories)}
              tone="accent"
            />
            <StatCard
              label="Quantidade total"
              value={numberFmt.format(totalItems)}
            />
            <StatCard
              label="Pegada estimada"
              value={`${numberFmt.format(totalImpact)} kgCO2eq`}
              tone="success"
            />
          </div>

          {error && (
            <div className="alert alert-danger app-alert mb-0" role="alert">
              {error}
            </div>
          )}

          <div className="dashboard-grid">
            <div className="dashboard-grid__main">
              <AppSection
                eyebrow="Resultado"
                title="Resumo do impacto"
                description="Veja a consolidacao do calculo, o ranking dos emissores e a tabela detalhada."
                actions={
                  <button
                    className="btn btn-outline-dark btn-sm"
                    onClick={exportToExcel}
                    disabled={breakdown.length === 0}
                  >
                    Exportar Excel
                  </button>
                }
              >
                {!result ? (
                  <div className="empty-state">
                    <strong>Nenhum calculo realizado.</strong>
                    <p className="mb-0">
                      Monte seu projeto e execute o calculo para liberar os
                      graficos e a exportacao.
                    </p>
                  </div>
                ) : result.error ? (
                  <div className="alert alert-danger app-alert mb-0" role="alert">
                    Falha ao calcular impacto.
                  </div>
                ) : (
                  <>
                    <div className="impact-hero">
                      <div>
                        <span className="impact-hero__label">Pegada total</span>
                        <strong className="impact-hero__value">
                          {numberFmt.format(totalImpact)} kgCO2eq
                        </strong>
                      </div>
                      <div className="impact-hero__meta">
                        <span>Leitura da API</span>
                        <strong>
                          {typeof result.apiTotal === "number"
                            ? `${numberFmt.format(result.apiTotal)} kgCO2eq`
                            : "Aguardando valor"}
                        </strong>
                      </div>
                    </div>

                    <div className="mini-highlight-grid">
                      <div className="mini-highlight">
                        <span>Itens avaliados</span>
                        <strong>{breakdown.length}</strong>
                      </div>
                      <div className="mini-highlight">
                        <span>Maior emissor</span>
                        <strong>{topBreakdown[0]?.nome || "Sem dados"}</strong>
                      </div>
                    </div>

                    {breakdown.length > 0 && (
                      <div className="chart-grid">
                        <div className="chart-panel">
                          <h3>Impacto por item</h3>
                          <div className="chart-box">
                            <Bar
                              data={barData}
                              options={{
                                responsive: true,
                                scales: {
                                  x: {
                                    ticks: { color: chartTextColor },
                                    grid: { display: false },
                                  },
                                  y: {
                                    ticks: { color: chartTextColor },
                                    grid: { color: chartGridColor },
                                  },
                                },
                                plugins: { legend: { display: false } },
                              }}
                            />
                          </div>
                        </div>
                        <div className="chart-panel">
                          <h3>Maiores emissores</h3>
                          <div className="chart-box">
                            <Doughnut
                              data={doughnutData}
                              options={{
                                responsive: true,
                                plugins: {
                                  legend: {
                                    position: "bottom",
                                    labels: { color: chartTextColor },
                                  },
                                },
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th className="text-end">Quantidade</th>
                            <th className="text-end">Coeficiente</th>
                            <th className="text-end">Impacto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {breakdown.map((item) => (
                            <tr key={`${item.id}-${item.nome}`}>
                              <td data-label="Item">
                                <div className="fw-semibold">{item.nome}</div>
                                <div className="text-muted small">{item.id}</div>
                              </td>
                              <td className="text-end" data-label="Quantidade">
                                {numberFmt.format(item.quantidade)} {item.unidade}
                              </td>
                              <td className="text-end" data-label="Coeficiente">
                                {numberFmt.format(item.fator)} kgCO2eq/
                                {item.unidade || "-"}
                              </td>
                              <td className="text-end fw-semibold" data-label="Impacto">
                                {numberFmt.format(item.impacto)} kgCO2eq
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </AppSection>

              <AppSection
                eyebrow="Catalogo"
                title="Materiais cadastrados"
                description="Gerencie o acervo de materiais e mantenha o catalogo pronto para novos projetos."
                actions={
                  <div className="action-row">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setMaterialsModalOpen(true)}
                    >
                      Novo material
                    </button>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => setCatalogOpen(true)}
                    >
                      Abrir catalogo
                    </button>
                  </div>
                }
              >
                <div className="project-summary-strip">
                  <div>
                    <span>Total de materiais</span>
                    <strong>{totalMaterials}</strong>
                  </div>
                  <div>
                    <span>Categorias ativas</span>
                    <strong>{totalCategories}</strong>
                  </div>
                  <div>
                    <span>Busca atual</span>
                    <strong>{search || "Sem filtro"}</strong>
                  </div>
                </div>

                {materials.length === 0 ? (
                  <div className="empty-state empty-state--soft">
                    <strong>Nenhum material cadastrado.</strong>
                    <p className="mb-0">
                      Adicione materiais para liberar o fluxo de calculo do
                      projeto.
                    </p>
                  </div>
                ) : (
                  <div className="catalog-preview">
                    {materials.slice(0, 4).map((material) => (
                      <div key={material.id} className="catalog-preview__item">
                        <div>
                          <span>{material.nome}</span>
                          <p>
                            {material.categoria || "Sem categoria"} •{" "}
                            {material.unidade}
                          </p>
                        </div>
                        <span>{numberFmt.format(material.pegada_carbono)} kg</span>
                      </div>
                    ))}
                  </div>
                )}
              </AppSection>
            </div>

            <div className="dashboard-grid__side">
              <AppSection
                eyebrow="Projeto"
                title="Composicao atual"
                description="Adicione itens, acompanhe o volume total e rode o calculo quando estiver pronto."
                actions={
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setAddItemModalOpen(true)}
                  >
                    Adicionar item
                  </button>
                }
              >
                <div className="project-summary-strip">
                  <div>
                    <span>Itens</span>
                    <strong>{items.length}</strong>
                  </div>
                  <div>
                    <span>Quantidade</span>
                    <strong>{numberFmt.format(totalItems)}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{items.length > 0 ? "Pronto" : "Vazio"}</strong>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="empty-state">
                    <strong>Seu projeto ainda esta vazio.</strong>
                    <p className="mb-0">
                      Adicione um item para iniciar a composicao do calculo.
                    </p>
                  </div>
                ) : (
                  <div className="item-stack">
                    {items.map((item, index) => {
                      const material = materials.find(
                        (entry) => entry.id === item.materialId,
                      );
                      return (
                        <div key={index} className="project-item-card">
                          <div>
                            <span className="project-item-card__eyebrow">
                              Item {index + 1}
                            </span>
                            <h3>{material ? material.nome : item.materialId}</h3>
                            <p>
                              {numberFmt.format(item.quantidade)}{" "}
                              {material?.unidade || "un"}
                            </p>
                          </div>
                          <div className="project-item-card__meta">
                            <span className="badge rounded-pill text-bg-light">
                              {material?.categoria || "Sem categoria"}
                            </span>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removeItem(index)}
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="action-row mt-3">
                  <button
                    className="btn btn-success flex-fill"
                    onClick={calculate}
                    disabled={items.length === 0}
                  >
                    Calcular impacto
                  </button>
                  <button
                    className="btn btn-outline-secondary flex-fill"
                    onClick={() => setItems([])}
                    disabled={items.length === 0}
                  >
                    Limpar
                  </button>
                </div>
              </AppSection>

              <AppSection
                eyebrow="Visao rapida"
                title="Panorama"
                description="Indicadores compactos para acompanhar o que esta mais pesado no projeto."
              >
                <div className="mini-overview">
                  <div className="mini-overview__row">
                    <span>Ultimo calculo</span>
                    <strong>
                      {result?.calculatedAt
                        ? new Date(result.calculatedAt).toLocaleString("pt-BR")
                        : "Nao realizado"}
                    </strong>
                  </div>
                  <div className="mini-overview__row">
                    <span>Maior emissor</span>
                    <strong>{topBreakdown[0]?.nome || "Sem dados"}</strong>
                  </div>
                  <div className="mini-overview__row">
                    <span>Busca no catalogo</span>
                    <strong>{materialSearch || "Sem busca"}</strong>
                  </div>
                </div>
              </AppSection>
            </div>
          </div>
        </div>
      )}

      {catalogOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Catalogo de materiais"
          onClick={() => setCatalogOpen(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div>
                <h2 className="h5 mb-1">Catalogo de Materiais</h2>
                <div className="text-muted">
                  Consulte, edite ou remova materiais cadastrados.
                </div>
              </div>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setCatalogOpen(false)}
              >
                Fechar
              </button>
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
                <select
                  className="form-select"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-sm align-middle catalog-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Categoria</th>
                    <th className="text-end">Pegada</th>
                    <th className="text-end">Unidade</th>
                    <th className="text-end">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="text-muted">
                        Nenhum material encontrado.
                      </td>
                    </tr>
                  )}
                  {filteredMaterials.map((material) => (
                    <tr key={material.id}>
                      <td data-label="Material">{material.nome}</td>
                      <td className="text-muted" data-label="Categoria">
                        {material.categoria || "-"}
                      </td>
                      <td className="text-end" data-label="Pegada">
                        {material.pegada_carbono}
                      </td>
                      <td className="text-end" data-label="Unidade">
                        {material.unidade}
                      </td>
                      <td className="text-end" data-label="Acoes">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => startEdit(material)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => deleteMaterial(material.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {materialsModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Gerenciar materiais"
          onClick={() => setMaterialsModalOpen(false)}
        >
          <div
            className="modal-card modal-card--form"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <div>
                <h2 className="h5 mb-1">Gerenciar Materiais</h2>
                <div className="text-muted">
                  Cadastre o coeficiente de carbono para usar nos calculos.
                </div>
              </div>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setMaterialsModalOpen(false)}
              >
                Fechar
              </button>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label">ID (Nome unico)</label>
                <input
                  className="form-control"
                  value={materialForm.id}
                  onChange={(e) =>
                    setMaterialForm((state) => ({ ...state, id: e.target.value }))
                  }
                  placeholder="ex: madeira_certificada"
                  disabled={!!editingId}
                />
              </div>
              <div className="col-12 col-md-8">
                <label className="form-label">Nome</label>
                <input
                  className="form-control"
                  value={materialForm.nome}
                  onChange={(e) =>
                    setMaterialForm((state) => ({
                      ...state,
                      nome: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label">Categoria</label>
                <input
                  className="form-control"
                  value={materialForm.categoria}
                  onChange={(e) =>
                    setMaterialForm((state) => ({
                      ...state,
                      categoria: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label">Unidade</label>
                <input
                  className="form-control"
                  value={materialForm.unidade}
                  onChange={(e) =>
                    setMaterialForm((state) => ({
                      ...state,
                      unidade: e.target.value,
                    }))
                  }
                  placeholder="m2, kg, m3..."
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label">Coef. carbono</label>
                <input
                  type="number"
                  className="form-control"
                  value={materialForm.pegada_carbono}
                  onChange={(e) =>
                    setMaterialForm((state) => ({
                      ...state,
                      pegada_carbono: e.target.value,
                    }))
                  }
                  placeholder="kgCO2eq / unidade"
                  min={0}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label">Custo unitario</label>
                <input
                  type="number"
                  className="form-control"
                  value={materialForm.custo_unitario}
                  onChange={(e) =>
                    setMaterialForm((state) => ({
                      ...state,
                      custo_unitario: e.target.value,
                    }))
                  }
                  placeholder="opcional"
                  min={0}
                />
              </div>
            </div>

            {crudError && (
              <div className="alert alert-warning mt-3" role="alert">
                {crudError}
              </div>
            )}

            <div className="d-flex gap-2 mt-3">
              <button
                className="btn btn-primary"
                onClick={saveMaterial}
                disabled={saving}
              >
                {editingId ? "Atualizar material" : "Salvar material"}
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      {addItemModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Adicionar item ao projeto"
          onClick={() => setAddItemModalOpen(false)}
        >
          <div
            className="modal-card modal-card--form"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <div>
                <h2 className="h5 mb-1">Adicionar item</h2>
                <div className="text-muted">
                  Selecione o material e informe a quantidade.
                </div>
              </div>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setAddItemModalOpen(false)}
              >
                Fechar
              </button>
            </div>

            <div className="mb-3">
              <label className="form-label">Buscar material</label>
              <input
                className="form-control"
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                placeholder="Digite para buscar..."
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Selecionar no dropdown</label>
              <select
                className="form-select"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Selecione um material</option>
                {filteredMaterialOptions.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.nome} ({material.unidade})
                  </option>
                ))}
              </select>
              {selectedMaterial && (
                <div className="form-text">
                  Pegada: {selectedMaterial.pegada_carbono} kgCO2eq /{" "}
                  {selectedMaterial.unidade}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Quantidade</label>
              <input
                type="number"
                className="form-control"
                value={qty || ""}
                onChange={(e) => setQty(Number(e.target.value))}
                placeholder="0"
                min={0}
              />
            </div>

            {formError && (
              <div className="alert alert-warning py-2" role="alert">
                {formError}
              </div>
            )}

            <button
              className="btn btn-primary w-100"
              onClick={() => {
                const added = addItem();
                if (added) setAddItemModalOpen(false);
              }}
            >
              Adicionar ao projeto
            </button>
          </div>
        </div>
      )}

      <button
        className="btn floating-theme-toggle"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label={
          theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
        }
        title={theme === "dark" ? "Tema claro" : "Tema escuro"}
      >
        {theme === "dark" ? "Light" : "Dark"}
      </button>
    </div>
  );
}
