/**
 * Parse a hysteria2:// or hy2:// link into a Mihomo proxy object.
 */
export const parseHysteria2 = (link: string): any => {
  try {
    const parseableLink = link.replace(/^(hysteria2|hy2):\/\//, 'http://');
    const url = new URL(parseableLink);
    const proxy: any = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed Hysteria2',
      type: 'hysteria2',
      server: url.hostname,
      port: Number(url.port || 443),
      password: decodeURIComponent(url.username),
    };

    const sni = url.searchParams.get('sni');
    if (sni) proxy.sni = sni;

    const insecure = url.searchParams.get('insecure');
    if (insecure === '1') proxy['skip-cert-verify'] = true;

    const obfs = url.searchParams.get('obfs');
    if (obfs) {
      proxy.obfs = obfs;
      const obfsPassword = url.searchParams.get('obfs-password');
      if (obfsPassword) proxy['obfs-password'] = obfsPassword;
    }

    return proxy;
  } catch (e) {
    console.error('Failed to parse hysteria2:', e);
    return null;
  }
};

/**
 * Parse a hysteria:// (v1) link into a Mihomo proxy object.
 */
export const parseHysteria = (link: string): any => {
  try {
    const parseableLink = link.replace('hysteria://', 'http://');
    const url = new URL(parseableLink);
    const proxy: any = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed Hysteria',
      type: 'hysteria',
      server: url.hostname,
      port: Number(url.port || 443),
      'auth-str': url.searchParams.get('auth') || decodeURIComponent(url.username) || '',
      up: url.searchParams.get('upmbps') || url.searchParams.get('up') || '100',
      down: url.searchParams.get('downmbps') || url.searchParams.get('down') || '100',
      protocol: url.searchParams.get('protocol') || 'udp',
    };

    const sni = url.searchParams.get('peer') || url.searchParams.get('sni');
    if (sni) proxy.sni = sni;

    const insecure = url.searchParams.get('insecure');
    if (insecure === '1') proxy['skip-cert-verify'] = true;

    const alpn = url.searchParams.get('alpn');
    if (alpn) proxy.alpn = alpn.split(',');

    const obfs = url.searchParams.get('obfs');
    if (obfs) proxy.obfs = obfs;

    return proxy;
  } catch (e) {
    console.error('Failed to parse hysteria:', e);
    return null;
  }
};

/**
 * Parse a tuic:// link into a Mihomo proxy object.
 */
export const parseTuic = (link: string): any => {
  try {
    const parseableLink = link.replace('tuic://', 'http://');
    const url = new URL(parseableLink);
    const proxy: any = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed TUIC',
      type: 'tuic',
      server: url.hostname,
      port: Number(url.port || 443),
      uuid: url.username,
      password: decodeURIComponent(url.password),
      udp: true,
    };

    const sni = url.searchParams.get('sni');
    if (sni) proxy.sni = sni;

    const alpn = url.searchParams.get('alpn');
    if (alpn) proxy.alpn = alpn.split(',');

    const congestion = url.searchParams.get('congestion_control');
    if (congestion) proxy['congestion-controller'] = congestion;

    const udpRelayMode = url.searchParams.get('udp_relay_mode');
    if (udpRelayMode) proxy['udp-relay-mode'] = udpRelayMode;

    const insecure = url.searchParams.get('allow_insecure');
    if (insecure === '1') proxy['skip-cert-verify'] = true;

    return proxy;
  } catch (e) {
    console.error('Failed to parse TUIC:', e);
    return null;
  }
};

/**
 * Parse a wireguard:// or wg:// link into a Mihomo proxy object.
 */
export const parseWireGuard = (link: string): any => {
  try {
    const parseableLink = link.replace(/^(wireguard|wg):\/\//, 'http://');
    const url = new URL(parseableLink);
    const proxy: any = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed WireGuard',
      type: 'wireguard',
      server: url.hostname,
      port: Number(url.port || 51820),
      'private-key': decodeURIComponent(url.username) || url.searchParams.get('privatekey') || '',
      'public-key': url.searchParams.get('publickey') || '',
      udp: true,
    };

    const ip = url.searchParams.get('address') || url.searchParams.get('ip');
    if (ip) proxy.ip = ip;

    const ipv6 = url.searchParams.get('ipv6');
    if (ipv6) proxy.ipv6 = ipv6;

    const psk = url.searchParams.get('presharedkey');
    if (psk) proxy['preshared-key'] = psk;

    const reserved = url.searchParams.get('reserved');
    if (reserved) {
      proxy.reserved = reserved.split(',').map(Number);
    }

    const mtu = url.searchParams.get('mtu');
    if (mtu) proxy.mtu = Number(mtu);

    return proxy;
  } catch (e) {
    console.error('Failed to parse WireGuard:', e);
    return null;
  }
};

/**
 * Parse a snell:// link into a Mihomo proxy object.
 */
export const parseSnell = (link: string): any => {
  try {
    const parseableLink = link.replace('snell://', 'http://');
    const url = new URL(parseableLink);
    const proxy: any = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed Snell',
      type: 'snell',
      server: url.hostname,
      port: Number(url.port || 443),
      psk: decodeURIComponent(url.username) || url.searchParams.get('psk') || '',
      version: Number(url.searchParams.get('version') || 3),
    };

    const obfs = url.searchParams.get('obfs');
    if (obfs) {
      proxy['obfs-opts'] = {
        mode: obfs,
      };
      const obfsHost = url.searchParams.get('obfs-host');
      if (obfsHost) proxy['obfs-opts'].host = obfsHost;
    }

    return proxy;
  } catch (e) {
    console.error('Failed to parse Snell:', e);
    return null;
  }
};
