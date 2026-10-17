import type { ReactNode } from 'react'
import { LabelVisibilityContext, type LabelVisibility } from './labelVisibility'

export default function LabelVisibilityProvider({ children, ...value }: LabelVisibility & { children: ReactNode }) {
  return <LabelVisibilityContext.Provider value={value}>{children}</LabelVisibilityContext.Provider>
}
