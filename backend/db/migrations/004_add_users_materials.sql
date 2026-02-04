-- 004_add_users_materials.sql
-- Adiciona admin e relacionamento de usuário nos materiais

ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
ALTER TABLE materials ADD COLUMN user_id INTEGER REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_materials_user_id ON materials(user_id);
