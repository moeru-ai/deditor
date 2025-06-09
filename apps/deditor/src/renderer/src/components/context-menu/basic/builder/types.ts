import type { RenderFunction } from 'vue'

export type MenuItemType = 'item' | 'sub' | 'separator' | 'checkbox' | 'radio' | 'label'

export interface BaseMenuItem {
  type: MenuItemType
  value?: string
  label?: string
  renderLabel?: RenderFunction
  shortcut?: string
  disabled?: boolean
  icon?: string
}

export interface MenuItem<T> extends BaseMenuItem {
  type: 'item'
  onClick?: (context: { data?: T }) => void
}

export interface MenuSubItem extends BaseMenuItem {
  type: 'sub'
  children: MenuItemConfig[]
  sideOffset?: number
  alignOffset?: number
}

export interface MenuSeparatorItem extends BaseMenuItem {
  type: 'separator'
}

export interface MenuCheckboxItem extends BaseMenuItem {
  type: 'checkbox'
  modelValue: boolean
  onUpdate?: (value: boolean) => void
}

export interface MenuRadioItem extends BaseMenuItem {
  type: 'radio'
  modelValue: string
  options: { value: string, label: string }[]
  onUpdate?: (value: string) => void
}

export interface MenuLabelItem extends BaseMenuItem {
  type: 'label'
}

export type MenuItemConfig<T = any> =
  | MenuItem<T>
  | MenuSubItem
  | MenuSeparatorItem
  | MenuCheckboxItem
  | MenuRadioItem
  | MenuLabelItem
