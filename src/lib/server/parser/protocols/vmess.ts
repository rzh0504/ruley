import { decodeBase64 } from '../base64';

/**
 * Parse a vmess:// link into a Mihomo proxy object.
 */
export const parseVmess = (link: string): any => {
  try {
    const base64Str = link.replace('vmess://', '');
    const decoded = decodeBase64(base64Str);
    const config = JSON.parse(decoded);

    const proxy: any = {
      name: config.ps || 'Unnamed vmess',
      type: 'vmess',
      server: config.add,
      port: Number(config.port),
      uuid: config.id,
      alterId: Number(config.aid || 0),
      cipher: config.scy || 'auto',
    };

    if (config.tls === 'tls') {
      proxy.tls = true;
      if (config.sni) proxy['servername'] = config.sni;
      if (config.alpn) proxy.alpn = config.alpn.split(',');
    }

    const net = config.net;
    if (net === 'ws') {
      proxy.network = 'ws';
      proxy['ws-opts'] = {
        path: config.path || '/',
        headers: {
          Host: config.host || config.add,
        },
      };
    } else if (net === 'grpc') {
      proxy.network = 'grpc';
      proxy['grpc-opts'] = {
        'grpc-service-name': config.path || '',
      };
    } else if (net === 'h2') {
      proxy.network = 'h2';
      proxy['h2-opts'] = {
        host: config.host ? [config.host] : [config.add],
        path: config.path || '/',
      };
    } else if (net === 'tcp' && config.type === 'http') {
      proxy.network = 'http';
      proxy['http-opts'] = {
        path: config.path ? [config.path] : ['/'],
        headers: config.host ? { Host: [config.host] } : {},
      };
    }

    return proxy;
  } catch (e) {
    console.error('Failed to parse vmess:', e);
    return null;
  }
};
