import { fetchAndParseSubscription } from './src/server/parser/index.js';
import express from 'express';

const app = express();
app.get('/test.yaml', (req, res) => {
  res.type('yaml');
  res.send(`
proxies:
  - name: "ss1"
    type: ss
    server: server
    port: 443
    cipher: auto
    password: password
    udp: true
  - name: "vmess1"
    type: vmess
    server: server
    port: 443
    uuid: uuid
    alterId: 0
    cipher: auto
`);
});

const server = app.listen(4001, async () => {
  try {
    const res = await fetchAndParseSubscription('http://localhost:4001/test.yaml');
    console.log("Parsed result:", res);
  } catch (e) {
    console.error(e);
  }
  server.close();
});
