import type { DialogMethods } from '@deditor-app/shared'

import { defineClientMethod } from '../define-client-method'

export const dialog = <TMethod extends keyof DialogMethods>(method: TMethod) => defineClientMethod<DialogMethods, TMethod>('electron/dialog', method)
