import type { Mode, OpenMode, PathLike } from 'node:fs'

export interface FsMethods {
  exists: (params: { path: PathLike }) => boolean
  readFile: (params: { path: PathLike, options?: ({ encoding?: null | undefined, flag?: OpenMode | undefined }) }) => ArrayBufferLike
  writeFile: (params: { path: PathLike, data: ArrayBufferLike, options?: ({ encoding?: null | undefined, mode?: number | undefined, flag?: OpenMode | undefined }) }) => void
  mkdir: (params: {
    path: PathLike
    /**
     * Indicates whether parent folders should be created.
     * If a folder was created, the path to the first created folder will be returned.
     * @default false
     */
    recursive?: boolean | undefined
    /**
     * A file mode. If a string is passed, it is parsed as an octal integer. If not specified
     * @default 0o777
     */
    mode?: Mode | undefined
  }) => void
}
