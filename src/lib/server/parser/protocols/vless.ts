import type { MihomoProxy } from '../types';

/**
 * Parse a vless:// link into a Mihomo proxy object.
 */
export const parseVless = (link: string): MihomoProxy | null => {
  try {
    const url = new URL(link);
    const proxy: MihomoProxy = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed vless',
      type: 'vless',
      server: url.hostname,
      port: Number(url.port || 443),
      uuid: url.username,
      udp: true,
      'skip-cert-verify': true,
    };

    const security = url.searchParams.get('security') || '';

    if (security === 'tls' || security === 'reality') {
      proxy.tls = true;
      proxy.servername = url.searchParams.get('sni') || url.hostname;
    }

    if (security === 'reality') {
      proxy['client-fingerprint'] = url.searchParams.get('fp') || 'chrome';
      proxy['reality-opts'] = {
        'public-key': url.searchParams.get('pbk') || '',
        'short-id': url.searchParams.get('sid') || '',
      };
    }

    const alpn = url.searchParams.get('alpn');
    if (alpn) proxy.alpn = alpn.split(',');

    const type = url.searchParams.get('type') || 'tcp';
    if (type === 'tcp') {
      proxy.network = 'tcp';
      const flow = url.searchParams.get('flow');
      if (flow) proxy.flow = flow;
    } else if (type === 'ws') {
      proxy.network = 'ws';
      proxy['ws-opts'] = {
        path: url.searchParams.get('path') || '/',
        headers: {
          Host: url.searchParams.get('host') || url.searchParams.get('sni') || url.hostname,
        },
      };
    } else if (type === 'grpc') {
      proxy.network = 'grpc';
      proxy['grpc-opts'] = {
        'grpc-service-name': url.searchParams.get('serviceName') || '',
      };
    } else if (type === 'h2') {
      proxy.network = 'h2';
      proxy['h2-opts'] = {
        host: [url.searchParams.get('host') || url.hostname],
        path: url.searchParams.get('path') || '/',
      };
    }

    return proxy;
  } catch (e) {
    console.error('Failed to parse vless:', e);
    return null;
  }
};
