import type { PresentationScene } from './presentation'

const PORTRAIT_ZOOM: Record<PresentationScene, number> = {
  emergency: 1, hugin: 1.8, munin: 1.85, iscat: 2.1, collective: 1.9, closing: 1,
}
const DESKTOP_ZOOM: Record<PresentationScene, number> = {
  emergency: 1, hugin: 1.26, munin: 1.16, iscat: 1.24, collective: 1.27, closing: .8,
}

// Orthographic zoom is pixels per world unit. Keep the established desktop
// framing; portrait shots can use the narrow canvas for detail instead.
export function cameraProfile(width: number, height: number) {
  const portrait = width <= 650 && width / height < .9
  // Allow a small lateral margin for the city and its outermost markers.
  const overviewZoom = portrait
    ? Math.min(30, width / 53, height / 40)
    : Math.min(30, width / 48, height / 36)
  return { overviewZoom, portrait }
}

export function presentationZoom(scene: PresentationScene, elapsed: number, width: number, height: number) {
  const { overviewZoom, portrait } = cameraProfile(width, height)
  if (scene === 'hugin' && elapsed < 3) return overviewZoom * (portrait ? 2.25 : 1.55)
  return overviewZoom * (portrait ? PORTRAIT_ZOOM[scene] : DESKTOP_ZOOM[scene])
}
