/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_JSON_FEED_URL: string;
  readonly VITE_MAKE_WEBHOOK_URL: string;
  readonly VITE_AIRTABLE_FORM_URL: string;
  readonly VITE_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
