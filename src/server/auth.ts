import { Request, Response, NextFunction } from 'express';
import jsonwebtoken from 'jsonwebtoken';
import dotenv from 'dotenv';

const jwt = (jsonwebtoken as any).default || jsonwebtoken;

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TOKEN_EXPIRY = '7d';

if (!JWT_SECRET || !ADMIN_PASSWORD) {
  throw new Error('JWT_SECRET and ADMIN_PASSWORD must be configured.');
}

// --- Middleware ---

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ruley',
      audience: 'ruley-admin',
    });
    if (!decoded || typeof decoded !== 'object' || decoded.role !== 'admin') {
      return res.status(401).json({ success: false, error: '令牌无效或已过期' });
    }
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: '令牌无效或已过期' });
  }
}

// --- Handlers ---

export function handleLogin(req: Request, res: Response) {
  try {
    const { password } = req.body;

    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: '密码错误' });
    }

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
      issuer: 'ruley',
      audience: 'ruley-admin',
    });
    res.json({ success: true, token, expiresIn: TOKEN_EXPIRY });
  } catch (err: any) {
    console.error('[AUTH] Login error:', err);
    res.status(500).json({ success: false, error: '登录失败' });
  }
}

export function handleMe(req: Request, res: Response) {
  res.json({ success: true, user: (req as any).user });
}
