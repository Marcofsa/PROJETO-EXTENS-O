-- Schema inicial para Calculadora de Sustentabilidade
-- Crie um banco e execute este arquivo para criar tabelas

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  contato TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT,
  subcategoria TEXT,
  fornecedor_id INTEGER REFERENCES suppliers(id),
  user_id INTEGER REFERENCES users(id),
  unidade TEXT,
  pegada_carbono REAL,
  energia_incorporada REAL,
  consumo_agua REAL,
  recursos_nao_renovaveis REAL,
  potencial_reciclagem REAL,
  vida_util INTEGER,
  resistencia REAL,
  densidade REAL,
  condutividade_termica REAL,
  custo_unitario REAL,
  custo_manutencao_anual REAL,
  vida_util_economica INTEGER,
  selos_verdes INTEGER,
  distancia_media_transporte REAL,
  transporte_tipo TEXT,
  score_sustentabilidade REAL,
  nivel_sustentabilidade TEXT,
  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS material_certifications (
  material_id TEXT REFERENCES materials(id) ON DELETE CASCADE,
  certification_id INTEGER REFERENCES certifications(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, certification_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  tipo TEXT,
  area REAL,
  localizacao TEXT,
  metas TEXT,
  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  material_id TEXT REFERENCES materials(id),
  quantidade REAL,
  unidade TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_material_categoria ON materials(categoria);
CREATE INDEX IF NOT EXISTS idx_project_items_project ON project_items(project_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON materials(user_id);
