/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  // You can add any other environment variables you use here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}