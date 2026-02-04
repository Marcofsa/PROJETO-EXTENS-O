import express from 'express'
import cors from 'cors'
import materialsRouter from './routes/materials'
import projectsRouter from './routes/projects'

const app = express()

const allowedOrigin = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000'
  : (process.env.CORS_ORIGIN || '')

const corsOptions = allowedOrigin ? { origin: allowedOrigin, optionsSuccessStatus: 200 } : undefined
app.use(cors(corsOptions))
app.use(express.json())

app.use('/api', materialsRouter)
app.use('/api', projectsRouter)

app.get('/', (_req, res) => {
  res.send('Backend is running. Use /api for API endpoints.')
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
