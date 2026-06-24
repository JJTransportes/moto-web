declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

declare module '*.css' {
  const content: string
  export default content
}

declare module '*.png' {
  const url: string
  export default url
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_MAPS_API_KEY?: string
  [key: string]: string | undefined
}
