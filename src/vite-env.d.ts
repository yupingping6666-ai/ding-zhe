/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_KIMI_API_KEY?: string
  readonly VITE_KIMI_MODEL?: string
  readonly VITE_KIMI_BASE_URL?: string
  // Legacy fallback
  readonly VITE_DASHSCOPE_API_KEY?: string
  readonly VITE_DASHSCOPE_VL_MODEL?: string
  readonly VITE_DASHSCOPE_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}