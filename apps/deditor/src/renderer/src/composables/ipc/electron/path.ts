import type { PathMethods } from '@deditor-app/shared'

import { defineClientMethod } from '../define-client-method'

export const path = <TMethod extends keyof PathMethods>(method: TMethod) => defineClientMethod<PathMethods, TMethod>('path', method)
