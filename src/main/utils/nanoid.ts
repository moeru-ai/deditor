import { customAlphabet } from 'nanoid'

export function nanoid() {
  const generator = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
  return generator(32)
}
