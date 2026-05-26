import axios from 'axios';
import dns from 'dns/promises';
import net from 'net';
import type { ParseErrorCode, ParseErrorKind } from './types';

const MAX_SUBSCRIPTION_BYTES = Number(process.env.MAX_SUBSCRIPTION_BYTES || 5 * 1024 * 1024);
const SUBSCRIPTION_TIMEOUT_MS = Number(process.env.SUBSCRIPTION_TIMEOUT_MS || 15000);
const ALLOW_HTTP_SUBSCRIPTIONS = process.env.ALLOW_HTTP_SUBSCRIPTIONS === 'true';

export class SubscriptionParseError extends Error {
  code: ParseErrorCode;
  kind: ParseErrorKind;

  constructor(code: ParseErrorCode, kind: ParseErrorKind, message: string) {
    super(message);
    this.name = 'SubscriptionParseError';
    this.code = code;
    this.kind = kind;
  }
}

const isBlockedIp = (address: string): boolean => {
  if (address === '169.254.169.254') return true;

  if (net.isIPv4(address)) {
    const parts = address.split('.').map(Number);
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }

  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:') ||
      normalized === '::' ||
      normalized.startsWith('::ffff:127.') ||
      normalized.startsWith('::ffff:10.') ||
      normalized.startsWith('::ffff:192.168.')
    );
  }

  return true;
};

const assertSafeSubscriptionUrl = async (rawUrl: string) => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SubscriptionParseError('subscription_url_invalid', 'subscription', '订阅链接格式无效');
  }

  if (parsed.protocol !== 'https:' && !(ALLOW_HTTP_SUBSCRIPTIONS && parsed.protocol === 'http:')) {
    throw new SubscriptionParseError('subscription_url_insecure', 'subscription', '订阅链接仅允许 HTTPS');
  }

  if (!parsed.hostname || parsed.username || parsed.password) {
    throw new SubscriptionParseError('subscription_url_unsafe', 'subscription', '订阅链接格式不安全');
  }

  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) {
    throw new SubscriptionParseError('subscription_url_private_address', 'subscription', '订阅链接不能指向本机地址');
  }

  const literalIpType = net.isIP(host);
  const addresses = literalIpType
    ? [{ address: host }]
    : await dns.lookup(host, { all: true, verbatim: false });

  if (addresses.length === 0 || addresses.some(record => isBlockedIp(record.address))) {
    throw new SubscriptionParseError('subscription_url_private_address', 'subscription', '订阅链接不能指向内网或保留地址');
  }
};

/**
 * Fetch a subscription URL and parse its contents into a list of Mihomo proxies.
 */
export const fetchAndParseSubscription = async (url: string, parseRawContent: (rawData: string) => any[]): Promise<any[]> => {
  await assertSafeSubscriptionUrl(url);

  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mihomo/1.18.0',
    },
    timeout: SUBSCRIPTION_TIMEOUT_MS,
    responseType: 'arraybuffer',
    maxContentLength: MAX_SUBSCRIPTION_BYTES,
    maxBodyLength: MAX_SUBSCRIPTION_BYTES,
    maxRedirects: 0,
  });

  const rawData: string = Buffer.from(response.data).toString('utf-8');

  return parseRawContent(rawData);
};
