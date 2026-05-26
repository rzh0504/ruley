export type ParseDiagnostic = {
  type: 'duplicate' | 'renamed' | 'skipped';
  message: string;
  name?: string;
  from?: string;
  to?: string;
};

export type ParseInputResult = {
  proxies: any[];
  errors: any[];
  diagnostics: ParseDiagnostic[];
};
