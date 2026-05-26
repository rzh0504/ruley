/**
 * Parse a trojan:// link into a Mihomo proxy object.
 */
export const parseTrojan = (link: string): any => {
  try {
    const url = new URL(link);
    const proxy: any = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed trojan',
      type: 'trojan',
      server: url.hostname,
      port: Number(url.port || 443),
      password: decodeURIComponent(url.username),
      udp: true,
      sni: url.searchParams.get('sni') || url.hostname,
      'skip-cert-verify': url.searchParams.get('allowInsecure') === '1',
    };

    const alpn = url.searchParams.get('alpn');
    if (alpn) proxy.alpn = alpn.split(',');

    const type = url.searchParams.get('type') || 'tcp';
    if (type === 'ws') {
      proxy.network = 'ws';
      proxy['ws-opts'] = {
        path: url.searchParams.get('path') || '/',
        headers: {
          Host: url.searchParams.get('host') || url.hostname,
        },
      };
    } else if (type === 'grpc') {
      proxy.network = 'grpc';
      proxy['grpc-opts'] = {
        'grpc-service-name': url.searchParams.get('serviceName') || '',
      };
    }

    return proxy;
  } catch (e) {
    console.error('Failed to parse trojan:', e);
    return null;
  }
};
