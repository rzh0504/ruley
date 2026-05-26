import { decodeBase64 } from '../base64';
import type { MihomoProxy } from '../types';

type VmessConfig = Partial<Record<'ps' | 'add' | 'port' | 'id' | 'aid' | 'scy' | 'tls' | 'sni' | 'alpn' | 'net' | 'path' | 'host' | 'type', string | number>>;

/**
 * Parse a vmess:// link into a Mihomo proxy object.
 */
export const parseVmess = (link: string): MihomoProxy | null => {
  try {
    const base64Str = link.replace('vmess://', '');
    const decoded = decodeBase64(base64Str);
    const config = JSON.parse(decoded) as VmessConfig;

    const proxy: MihomoProxy = {
      name: String(config.ps || 'Unnamed vmess'),
      type: 'vmess',
      server: String(config.add || ''),
      port: Number(config.port),
      uuid: String(config.id || ''),
      alterId: Number(config.aid || 0),
      cipher: String(config.scy || 'auto'),
    };

    if (config.tls === 'tls') {
      proxy.tls = true;
      if (config.sni) proxy['servername'] = String(config.sni);
      if (config.alpn) proxy.alpn = String(config.alpn).split(',');
    }

    const net = config.net;
    if (net === 'ws') {
      proxy.network = 'ws';
      proxy['ws-opts'] = {
        path: String(config.path || '/'),
        headers: {
          Host: String(config.host || config.add || ''),
        },
      };
    } else if (net === 'grpc') {
      proxy.network = 'grpc';
      proxy['grpc-opts'] = {
        'grpc-service-name': String(config.path || ''),
      };
    } else if (net === 'h2') {
      proxy.network = 'h2';
      proxy['h2-opts'] = {
        host: config.host ? [String(config.host)] : [String(config.add || '')],
        path: String(config.path || '/'),
      };
    } else if (net === 'tcp' && config.type === 'http') {
      proxy.network = 'http';
      proxy['http-opts'] = {
        path: config.path ? [String(config.path)] : ['/'],
        headers: config.host ? { Host: [String(config.host)] } : {},
      };
    }

    return proxy;
  } catch (e) {
    console.error('Failed to parse vmess:', e);
    return null;
  }
};
