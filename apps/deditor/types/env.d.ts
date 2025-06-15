declare namespace NodeJS {
  interface ProcessEnv {
    readonly DEDITOR_REMOTE_DEBUG?: string
    readonly DEDITOR_REMOTE_DEBUG_PORT?: string
  }
}
