import { Router, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import { findOne, query, insert, log } from '../database.js'
import { JWT_SECRET } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    const user = findOne('users', (u: any) => u.username === username)
    if (!user) {
      res.status(401).json({ success: false, message: '用户不存在' })
      return
    }
    if (user.password !== password) {
      res.status(401).json({ success: false, message: '密码错误' })
      return
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    log(user.id, user.name, '用户登录', 'user', user.id, `${user.name}登录系统`)
    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role, department: user.department }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '登录失败' })
  }
})

router.get('/me', async (req: any, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: '未登录' })
      return
    }
    const token = authHeader.split(' ')[1]
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      res.status(401).json({ success: false, message: '登录状态已过期，请重新登录' })
      return
    }
    const dbUser = findOne('users', (u: any) => u.id === decoded.id)
    if (!dbUser) {
      res.status(401).json({ success: false, message: '用户不存在' })
      return
    }
    res.status(200).json({
      success: true,
      data: { id: dbUser.id, username: dbUser.username, name: dbUser.name, role: dbUser.role, department: dbUser.department }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取用户信息失败' })
  }
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ success: true, message: '退出成功' })
})

export default router
