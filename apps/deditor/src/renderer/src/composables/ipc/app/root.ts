import type { AppMethods } from '@deditor-app/shared'
import type { MaybeRefOrGetter } from 'vue'

import { isRef, onMounted, ref, toValue, watch } from 'vue'

import { defineClientMethod } from '../define-client-method'

const methods = <TMethod extends keyof AppMethods>(method: TMethod) => defineClientMethod<AppMethods, TMethod>(method)

export type AppGetPathParameterName = Parameters<AppMethods['getPath']>[0]

export function useAppPath(name?: MaybeRefOrGetter<AppGetPathParameterName>) {
  const _name = ref<AppGetPathParameterName | undefined>()

  if (name == null) {
    _name.value = 'appData'
  }
  else {
    if (isRef(name))
      watch(name, v => _name.value = v, { immediate: true })
    else
      _name.value = toValue(name)
  }

  const path = ref<string>()

  async function update(name?: AppGetPathParameterName) {
    if (name)
      path.value = await methods('getPath').call(name)
  }

  watch(_name, async name => update(name), { immediate: true })
  onMounted(async () => update(_name.value))

  return path
}
