import type { FsMethods } from '@deditor-app/shared'

import { defineClientMethod } from '../define-client-method'

export const fs = <TMethod extends keyof FsMethods>(method: TMethod) => defineClientMethod<FsMethods, TMethod>(method)
