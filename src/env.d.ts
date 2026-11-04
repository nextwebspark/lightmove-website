interface ImportMetaEnv {
  readonly PUBLIC_DEMO_AGENT_TOKEN?: string;
  readonly PUBLIC_APP_URL?: string;
  readonly PUBLIC_CONTACT_FORM_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
