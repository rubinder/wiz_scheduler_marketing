interface ImportMetaEnv {
  readonly PUBLIC_APP_URL?: string;
  readonly PUBLIC_API_URL?: string;
  readonly PUBLIC_CHECKER_ENABLED?: string;
  readonly LEGAL_API_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
