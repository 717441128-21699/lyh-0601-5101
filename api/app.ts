import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { getDB, DATA_DIR } from './database.js'
import { authMiddleware } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import requirementRoutes from './routes/requirements.js'
import inquiryRoutes from './routes/inquiries.js'
import approvalRoutes from './routes/approvals.js'
import contractRoutes from './routes/contracts.js'
import acceptanceRoutes from './routes/acceptances.js'
import paymentRoutes from './routes/payments.js'
import supplierRoutes from './routes/suppliers.js'
import reportRoutes from './routes/reports.js'
import logRoutes from './routes/logs.js'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}
const uploadsDir = path.join(DATA_DIR, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

getDB()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use(authMiddleware)

app.use('/api/requirements', requirementRoutes)
app.use('/api/inquiries', inquiryRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/contracts', contractRoutes)
app.use('/api/acceptances', acceptanceRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api', logRoutes)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    message: error.message || '服务器内部错误',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API接口不存在',
  })
})

export default app
