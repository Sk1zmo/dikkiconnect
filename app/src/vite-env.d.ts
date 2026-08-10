/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'hash' for the single-file build, which runs from file:// with no server. */
  readonly VITE_ROUTER?: 'hash' | 'browser'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
