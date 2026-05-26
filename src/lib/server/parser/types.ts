export type ParseDiagnostic = {
  type: 'duplicate' | 'renamed' | 'skipped';
  message: string;
  name?: string;
  from?: string;
  to?: string;
};

export type ParseErrorCode =
  | 'subscription_url_limit_exceeded'
  | 'subscription_url_invalid'
  | 'subscription_url_insecure'
  | 'subscription_url_unsafe'
  | 'subscription_url_private_address'
  | 'proxy_uri_parse_failed'
  | 'subscription_empty'
  | 'subscription_fetch_failed';

export type ParseErrorKind = 'input' | 'subscription' | 'limit' | 'network';

export type ParseErrorSeverity = 'error' | 'warning';

export type ParseError = {
  code: ParseErrorCode;
  kind: ParseErrorKind;
  severity: ParseErrorSeverity;
  message: string;
  error: string;
  source?: 'direct' | 'subscription';
  input?: string;
  url?: string;
  limit?: number;
  cause?: string;
};

export const createParseError = (error: Omit<ParseError, 'error'>): ParseError => ({
  ...error,
  error: error.message,
});

export type ParseInputResult = {
  proxies: any[];
  errors: ParseError[];
  diagnostics: ParseDiagnostic[];
};
