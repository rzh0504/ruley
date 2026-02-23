import { fetchAndParseSubscription, decodeBase64 } from './src/server/parser/index.js';
import express from 'express';

const app = express();
app.get('/test-base64.yaml', (req, res) => {
  res.type('text/plain');
  const yamlContent = `
proxies:
  - name: "ss1_base64"
    type: ss
    server: server
    port: 443
    cipher: auto
    password: password
    udp: true
`;
  res.send(Buffer.from(yamlContent).toString('base64'));
});

// What if the yaml format is just a list? (Rare but possible)
app.get('/test-list.yaml', (req, res) => {
  res.type('yaml');
  res.send(`
- name: "ss1_list"
  type: ss
  server: server
  port: 443
  cipher: auto
  password: password
  udp: true
`);
});

const server = app.listen(4001, async () => {
  try {
    const res1 = await fetchAndParseSubscription('http://localhost:4001/test-base64.yaml');
    console.log("Parsed result base64:", res1);
    
    const res2 = await fetchAndParseSubscription('http://localhost:4001/test-list.yaml');
    console.log("Parsed result list:", res2);
  } catch (e) {
    console.error(e);
  }
  server.close();
});
