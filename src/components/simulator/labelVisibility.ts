import { createContext, useContext } from 'react'
import type { PresentationScene } from './presentation'

export type LabelVisibility = {
  presentationActive: boolean
  scene: PresentationScene
  sceneElapsed: number
  selectedLabels: (string | null)[]
}

export const LabelVisibilityContext = createContext<LabelVisibility | null>(null)

export function useLabelVisibility() { return useContext(LabelVisibilityContext) }

export function labelId(text: string) {
  if (text === 'LUMORA · BASE MÓVIL') return 'mobile-base'
  if (text === '+ HOSPITAL') return 'hospital'
  if (text === 'OPERACIONES') return 'operations'
  if (text.startsWith('SECTOR ')) return text.slice(7).toLowerCase()
  if (text.startsWith('MUNIN-')) return text === 'MUNIN-M1' ? 'messenger' : `munin-0${Number(text.slice(-1))}`
  return text
}

export function isPriorityLabel(text: string, state: LabelVisibility) {
  const id = labelId(text)
  if (!state.presentationActive) return state.selectedLabels.includes(id) || id === 'mobile-base' || id === 'hospital'
  const sceneLabel: Record<PresentationScene, string> = {
    emergency: 'center',
    hugin: 'mobile-base',
    munin: 'munin-05',
    iscat: state.sceneElapsed < 8 ? 'mobile-base' : 'ISCAT-02',
    collective: 'ISCAT-02',
    closing: 'west',
  }
  return id === sceneLabel[state.scene]
}
