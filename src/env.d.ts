interface ImportMetaEnv {
  readonly PUBLIC_DEMO_AGENT_TOKEN?: string;
  readonly PUBLIC_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
