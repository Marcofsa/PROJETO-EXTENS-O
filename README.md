# PROJETO EXTENSÃO — Calculadora de Sustentabilidade

Scaffold inicial com frontend React + TypeScript (Vite) e backend Node.js + TypeScript (Express) usando SQLite.

Documentação:
- Usabilidade: [docs/USABILIDADE.md](docs/USABILIDADE.md)

Run (development):

1) Frontend

```powershell
cd "c:\Projects\PROJETO EXTENSÃO\frontend"
npm install
npm run dev
```

2) Backend

```powershell
cd "c:\Projects\PROJETO EXTENSÃO\backend"
npm install
npm run dev
```

O backend roda em `http://localhost:4000` por padrão e fornece endpoints em `/api/*`.
O frontend assume que a API esteja acessível em `http://localhost:4000`.

SQLite:
- O arquivo padrão do banco é `backend/db/pe_db.sqlite` (pode ser sobrescrito com `SQLITE_FILE`).
- Rode as migrations com `npm run db:migrate` dentro de `backend`.
