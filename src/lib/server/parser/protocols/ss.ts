import { decodeBase64, decodeUrlSafeBase64 } from '../base64';

/**
 * Parse a ss:// link (SIP002 and legacy) into a Mihomo proxy object.
 */
export const parseShadowsocks = (link: string): any => {
  try {
    const raw = link.replace('ss://', '');
    let namePart = '';
    let mainPart = raw;

    if (raw.includes('#')) {
      const hashIndex = raw.lastIndexOf('#');
      namePart = decodeURIComponent(raw.substring(hashIndex + 1));
      mainPart = raw.substring(0, hashIndex);
    }

    let queryPart = '';
    if (mainPart.includes('?')) {
      const qIndex = mainPart.indexOf('?');
      queryPart = mainPart.substring(qIndex + 1);
      mainPart = mainPart.substring(0, qIndex);
    }

    let userInfoAndHost: string;
    if (!mainPart.includes('@')) {
      userInfoAndHost = decodeBase64(mainPart);
    } else {
      const atIndex = mainPart.indexOf('@');
      const b64UserInfo = mainPart.substring(0, atIndex);
      const hostPort = mainPart.substring(atIndex + 1);
      const decodedUserInfo = decodeBase64(b64UserInfo);
      if (decodedUserInfo && decodedUserInfo.includes(':')) {
        userInfoAndHost = `${decodedUserInfo}@${hostPort}`;
      } else {
        userInfoAndHost = `${b64UserInfo}@${hostPort}`;
      }
    }

    const url = new URL(`http://${userInfoAndHost}`);

    const proxy: any = {
      name: namePart || 'Unnamed ss',
      type: 'ss',
      server: url.hostname,
      port: Number(url.port),
      cipher: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      udp: true,
    };

    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      const plugin = params.get('plugin');
      if (plugin) {
        const pluginParts = plugin.split(';');
        const pluginName = pluginParts[0];
        if (pluginName === 'obfs-local' || pluginName === 'simple-obfs') {
          proxy.plugin = 'obfs';
          proxy['plugin-opts'] = {};
          for (const part of pluginParts.slice(1)) {
            const [k, v] = part.split('=');
            if (k === 'obfs') proxy['plugin-opts'].mode = v;
            if (k === 'obfs-host') proxy['plugin-opts'].host = v;
          }
        } else if (pluginName === 'v2ray-plugin') {
          proxy.plugin = 'v2ray-plugin';
          proxy['plugin-opts'] = {};
          for (const part of pluginParts.slice(1)) {
            const [k, v] = part.split('=');
            if (k === 'mode') proxy['plugin-opts'].mode = v;
            if (k === 'host') proxy['plugin-opts'].host = v;
            if (k === 'path') proxy['plugin-opts'].path = v;
            if (k === 'tls') proxy['plugin-opts'].tls = true;
          }
        }
      }
    }

    return proxy;
  } catch (e) {
    console.error('Failed to parse shadowsocks:', e);
    return null;
  }
};

/**
 * Parse a ssr:// link into a Mihomo proxy object.
 */
export const parseShadowsocksR = (link: string): any => {
  try {
    const encoded = link.replace('ssr://', '');
    const decoded = decodeUrlSafeBase64(encoded);

    const mainAndParams = decoded.split('/?');
    const mainPart = mainAndParams[0];
    const paramStr = mainAndParams[1] || '';

    const parts = mainPart.split(':');
    if (parts.length < 6) {
      console.error('Invalid SSR format, not enough parts:', parts.length);
      return null;
    }

    const password_b64 = parts.pop()!;
    const obfs = parts.pop()!;
    const method = parts.pop()!;
    const protocol = parts.pop()!;
    const port = parts.pop()!;
    const host = parts.join(':');

    const password = decodeUrlSafeBase64(password_b64);

    const params = new URLSearchParams(paramStr);
    const obfsParam = params.get('obfsparam') ? decodeUrlSafeBase64(params.get('obfsparam')!) : '';
    const protoParam = params.get('protoparam') ? decodeUrlSafeBase64(params.get('protoparam')!) : '';
    const remarks = params.get('remarks') ? decodeUrlSafeBase64(params.get('remarks')!) : '';
    const group = params.get('group') ? decodeUrlSafeBase64(params.get('group')!) : '';

    const proxy: any = {
      name: remarks || `${host}:${port}`,
      type: 'ssr',
      server: host,
      port: Number(port),
      cipher: method,
      password: password,
      protocol: protocol,
      'protocol-param': protoParam,
      obfs: obfs,
      'obfs-param': obfsParam,
      udp: true,
    };

    if (group) proxy.group = group;

    return proxy;
  } catch (e) {
    console.error('Failed to parse SSR:', e);
    return null;
  }
};
