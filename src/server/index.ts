import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';
import db, { initDb } from './db/index.js';
import { parseInput } from './parser/index.js';
import { generateConfig } from './generator/index.js';
import { authMiddleware, handleLogin, handleMe } from './auth.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';
const publicBaseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, '');
const tokenBytes = 32;

const getSubscriptionName = (value?: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : 'ruley';

const buildSubUrl = (token: string, name?: unknown) =>
  `/api/sub/${token}/${encodeURIComponent(getSubscriptionName(name))}`;

const buildAbsoluteUrl = (req: express.Request, subUrl: string) => {
  if (publicBaseUrl) return `${publicBaseUrl}${subUrl}`;
  return `${req.protocol}://${req.get('host')}${subUrl}`;
};

const createCloudToken = () => crypto.randomBytes(tokenBytes).toString('hex');

const getSafeFilename = (value?: unknown) =>
  getSubscriptionName(value).replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-');

// Middleware
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!isProduction || !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin denied'));
  },
}));
app.use(express.json({ limit: '5mb' }));
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError) {
    return res.status(400).json({ success: false, error: '请求 JSON 格式无效' });
  }
  next(err);
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: '请求过于频繁，请稍后再试' },
});

const heavyApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: '请求过于频繁，请稍后再试' },
});

const subLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests.',
});

// Initialize Database
try {
  initDb();
  console.log('[DB] Database initialized successfully.');
} catch (err) {
  console.error('[DB] Failed to initialize database:', err);
  process.exit(1);
}

// ============================================================================
// Auth Routes (public)
// ============================================================================

app.post('/api/auth/login', authLimiter, handleLogin);

// ============================================================================
// Public Routes (no auth needed)
// ============================================================================

// Subscription delivery endpoint (called by Clash clients)
app.get(['/api/sub/:token', '/api/sub/:token/:name'], subLimiter, async (req, res) => {
  const token = req.params.token;
  try {
    const row = db.prepare('SELECT * FROM configs WHERE cloud_token = ?').get(token) as any;
    if (!row) {
      return res.status(404).send('Config not found.');
    }

    let yamlStr = row.generated_config;
    if (!yamlStr) {
      const { proxies } = await parseInput(row.urls);
      yamlStr = generateConfig({
        proxies,
        proxyGroups: JSON.parse(row.proxy_groups),
        rules: JSON.parse(row.rules),
        platform: row.platform as 'clash' | 'mihomo',
        settings: { advancedDns: row.advanced_dns === 1 }
      });
    }

    res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`${getSafeFilename(row.name)}.yaml`)}`);
    res.send(yamlStr);
  } catch (err: any) {
    console.error('[SUB] Generation error:', err);
    res.status(500).send('Error generating config.');
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, timestamp: new Date().toISOString() });
});

// ============================================================================
// Protected Routes (auth required)
// ============================================================================

app.use('/api/auth/me', authMiddleware, handleMe);

// Parser & Generator (used by dashboard)
app.post('/api/parse', heavyApiLimiter, authMiddleware, async (req, res) => {
  const { urls } = req.body;
  if (!urls || typeof urls !== 'string') {
    return res.status(400).json({ success: false, error: '"urls" string is required.' });
  }

  try {
    const result = await parseInput(urls);
    res.json({
      success: true,
      nodesCount: result.proxies.length,
      proxies: result.proxies,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err: any) {
    console.error('[PARSE] Error:', err);
    res.status(500).json({ success: false, error: '解析失败' });
  }
});

app.post('/api/generate', heavyApiLimiter, authMiddleware, (req, res) => {
  const { proxies, proxyGroups, rules, settings, platform } = req.body;
  if (!proxies || !Array.isArray(proxies)) {
    return res.status(400).json({ success: false, error: 'proxies array is required.' });
  }

  try {
    const yamlStr = generateConfig({ proxies, proxyGroups: proxyGroups || [], rules: rules || [], settings: settings || {}, platform });
    res.json({ success: true, config: yamlStr });
  } catch (err: any) {
    console.error('[GEN] Error:', err);
    res.status(500).json({ success: false, error: '生成失败' });
  }
});

// ============================================================================
// Configs CRUD
// ============================================================================

// List all configs
app.get('/api/configs', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT id, name, urls, platform, advanced_dns, node_count, cloud_token, cloud_url, parent_id, created_at, updated_at FROM configs ORDER BY parent_id ASC, updated_at DESC'
    ).all();
    res.json({ success: true, configs: rows });
  } catch (err: any) {
    console.error('[CONFIGS] List error:', err);
    res.status(500).json({ success: false, error: '配置列表加载失败' });
  }
});

// Create config
app.post('/api/configs', authMiddleware, (req, res) => {
  const { name, urls, platform, advancedDns, proxyGroups, rules, nodeCount, parsedNodes, generatedConfig } = req.body;
  if (!name || !urls) {
    return res.status(400).json({ success: false, error: 'name and urls are required.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO configs (name, urls, platform, advanced_dns, proxy_groups, rules, node_count, parsed_nodes, generated_config)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      urls,
      platform || 'clash',
      advancedDns ? 1 : 0,
      JSON.stringify(proxyGroups || []),
      JSON.stringify(rules || []),
      nodeCount || 0,
      parsedNodes ? JSON.stringify(parsedNodes) : null,
      generatedConfig || null
    );

    res.json({ 
      success: true, 
      id: result.lastInsertRowid,
      message: '配置已保存' 
    });
  } catch (err: any) {
    console.error('[CONFIGS] Create error:', err);
    res.status(500).json({ success: false, error: '配置保存失败' });
  }
});

// Get single config
app.get('/api/configs/:id', authMiddleware, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM configs WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, error: '配置不存在' });
    }
    res.json({ success: true, config: row });
  } catch (err: any) {
    console.error('[CONFIGS] Get error:', err);
    res.status(500).json({ success: false, error: '配置加载失败' });
  }
});

// Update config
app.put('/api/configs/:id', authMiddleware, (req, res) => {
  const { name, urls, platform, advancedDns, proxyGroups, rules, nodeCount, parsedNodes, generatedConfig } = req.body;

  try {
    const existing = db.prepare('SELECT id FROM configs WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: '配置不存在' });
    }

    db.prepare(`
      UPDATE configs SET 
        name = COALESCE(?, name),
        urls = COALESCE(?, urls),
        platform = COALESCE(?, platform),
        advanced_dns = COALESCE(?, advanced_dns),
        proxy_groups = COALESCE(?, proxy_groups),
        rules = COALESCE(?, rules),
        node_count = COALESCE(?, node_count),
        parsed_nodes = COALESCE(?, parsed_nodes),
        generated_config = COALESCE(?, generated_config),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || null,
      urls || null,
      platform || null,
      advancedDns !== undefined ? (advancedDns ? 1 : 0) : null,
      proxyGroups ? JSON.stringify(proxyGroups) : null,
      rules ? JSON.stringify(rules) : null,
      nodeCount !== undefined ? nodeCount : null,
      parsedNodes ? JSON.stringify(parsedNodes) : null,
      generatedConfig !== undefined ? generatedConfig : null,
      req.params.id
    );

    res.json({ success: true, message: '配置已更新' });
  } catch (err: any) {
    console.error('[CONFIGS] Update error:', err);
    res.status(500).json({ success: false, error: '配置更新失败' });
  }
});

// Delete config
app.delete('/api/configs/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM configs WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '配置不存在' });
    }
    res.json({ success: true, message: '配置已删除' });
  } catch (err: any) {
    console.error('[CONFIGS] Delete error:', err);
    res.status(500).json({ success: false, error: '配置删除失败' });
  }
});

// Generate/update cloud link for a config
app.post('/api/configs/:id/cloud', authMiddleware, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM configs WHERE id = ?').get(req.params.id) as any;
    if (!row) {
      return res.status(404).json({ success: false, error: '配置不存在' });
    }

    let token = row.cloud_token;
    if (!token) {
      // Generate new token
      token = createCloudToken();
      db.prepare('UPDATE configs SET cloud_token = ?, cloud_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(token, buildSubUrl(token, row.name), req.params.id);
    }

    const subUrl = buildSubUrl(token, row.name);
    const cloudUrl = buildAbsoluteUrl(req, subUrl);
    res.json({ success: true, token, cloudUrl, subUrl });
  } catch (err: any) {
    console.error('[CLOUD] Generate error:', err);
    res.status(500).json({ success: false, error: '云端链接生成失败' });
  }
});

// ============================================================================
// Legacy cloud-save (backwards compatibility, now creates a config record)
// ============================================================================

app.post('/api/cloud-save', authMiddleware, (req, res) => {
  const { urls, proxyGroups, rules, platform, advancedDns, parsedNodes, generatedConfig, nodeCount, configId, name, parentId } = req.body;
  if (!urls) return res.status(400).json({ success: false, error: 'urls is required' });
  const configName = getSubscriptionName(name);

  try {
    // Upsert: if configId is provided, update existing record
    if (configId) {
      const existing = db.prepare('SELECT * FROM configs WHERE id = ?').get(configId) as any;
      if (existing) {
        db.prepare(`
          UPDATE configs SET
            name = COALESCE(?, name),
            urls = ?, platform = ?, advanced_dns = ?,
            proxy_groups = ?, rules = ?,
            node_count = ?, parsed_nodes = ?, generated_config = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          configName,
          urls, platform || 'clash', advancedDns ? 1 : 0,
          JSON.stringify(proxyGroups || []), JSON.stringify(rules || []),
          nodeCount || 0,
          parsedNodes ? JSON.stringify(parsedNodes) : null,
          generatedConfig || null,
          configId
        );

        // Generate cloud token if missing
        let token = existing.cloud_token;
        if (!token) {
          token = createCloudToken();
          db.prepare('UPDATE configs SET cloud_token = ?, cloud_url = ? WHERE id = ?')
            .run(token, buildSubUrl(token, configName), configId);
        }

        db.prepare('UPDATE configs SET cloud_url = ? WHERE id = ?')
          .run(buildSubUrl(token, configName), configId);

        return res.json({ success: true, token, subUrl: buildSubUrl(token, configName), configId });
      }
    }

    // Create new record
    const token = createCloudToken();
    const result = db.prepare(`
      INSERT INTO configs (name, urls, platform, advanced_dns, proxy_groups, rules, node_count, parsed_nodes, generated_config, cloud_token, cloud_url, parent_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      configName, urls, platform || 'clash', advancedDns ? 1 : 0,
      JSON.stringify(proxyGroups || []), JSON.stringify(rules || []),
      nodeCount || 0,
      parsedNodes ? JSON.stringify(parsedNodes) : null,
      generatedConfig || null,
      token, buildSubUrl(token, configName),
      parentId || null
    );

    res.json({ success: true, token, subUrl: buildSubUrl(token, configName), configId: result.lastInsertRowid });
  } catch (err: any) {
    console.error('[CLOUD] Save error:', err);
    res.status(500).json({ success: false, error: '云端配置保存失败' });
  }
});

// ============================================================================
// Production: serve frontend static files
// ============================================================================

if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: 'API 不存在' });
  });
  // SPA fallback: any non-API route serves index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ============================================================================
// Global error handler
// ============================================================================

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

// ============================================================================

app.listen(port, () => {
  console.log(`Ruley Backend running at http://localhost:${port}`);
});
