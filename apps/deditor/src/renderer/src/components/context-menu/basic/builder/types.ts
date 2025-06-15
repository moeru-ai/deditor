import type { RenderFunction } from 'vue'

export type MenuItemType = 'item' | 'sub' | 'separator' | 'checkbox' | 'radio' | 'label'

export interface BaseMenuItem<V = string> {
  type: MenuItemType
  value?: V
  label?: string
  renderLabel?: RenderFunction
  shortcut?: string
  disabled?: boolean
  icon?: string
}

export interface MenuItem<T = any, V = string> extends BaseMenuItem<V> {
  type: 'item'
  onClick?: (context: { data?: T }) => void
}

export interface MenuSubItem<V = string> extends BaseMenuItem<V> {
  type: 'sub'
  children: MenuItemConfig[]
  sideOffset?: number
  alignOffset?: number
}

export interface MenuSeparatorItem<V = string> extends BaseMenuItem<V> {
  type: 'separator'
}

export interface MenuCheckboxItem<V = string> extends BaseMenuItem<V> {
  type: 'checkbox'
  modelValue: boolean
  onUpdate?: (value: boolean) => void
}

export interface MenuRadioItem<V = string> extends BaseMenuItem<V> {
  type: 'radio'
  modelValue: string
  options: { value: string, label: string }[]
  onUpdate?: (value: string) => void
}

export interface MenuLabelItem<V = string> extends BaseMenuItem<V> {
  type: 'label'
}

export type MenuItemConfig<T = any, V = string>
  = | MenuItem<T>
    | MenuSubItem<V>
    | MenuSeparatorItem<V>
    | MenuCheckboxItem<V>
    | MenuRadioItem<V>
    | MenuLabelItem<V>
