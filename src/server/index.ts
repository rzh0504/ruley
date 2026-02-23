import express from 'express';
import cors from 'cors';
import { initDb } from './db/index.js';
import { parseInput } from './parser/index.js';
import { generateConfig } from './generator/index.js';

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Initialize Database
try {
  initDb();
  console.log('Database initialized successfully.');
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

// Routes - Settings
app.get('/api/settings', (req, res) => {
  res.json({ message: 'Settings API - pending implementation' });
});

// Routes - Subscriptions
app.get('/api/subscriptions', (req, res) => {
  res.json({ message: 'Subscriptions API - pending implementation' });
});

// Routes - Parser/Generator (Core)
app.post('/api/parse', async (req, res) => {
  const { urls } = req.body;

  if (!urls || typeof urls !== 'string') {
    return res.status(400).json({ error: 'Valid "urls" string is required in the request body.' });
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
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate', (req, res) => {
  const { proxies, proxyGroups, rules, settings } = req.body;

  if (!proxies || !Array.isArray(proxies)) {
    return res.status(400).json({ error: 'proxies array is required.' });
  }

  try {
    const yamlStr = generateConfig({
      proxies,
      proxyGroups: proxyGroups || [],
      rules: rules || [],
      settings: settings || {},
    });
    res.json({ success: true, config: yamlStr });
  } catch (err: any) {
    console.error('Config generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`SubBoost Pro Backend running at http://localhost:${port}`);
});
