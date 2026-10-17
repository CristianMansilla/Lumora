import type { MissionSnapshot, MissionStore } from './mission'

export type PresentationScene = 'emergency' | 'hugin' | 'munin' | 'iscat' | 'collective' | 'closing'
export type PresentationStatus = 'idle' | 'running' | 'paused' | 'blocked' | 'finished'
export type PresentationSnapshot = {
  status: PresentationStatus
  scene: PresentationScene
  elapsed: number
  sceneElapsed: number
  progress: number
  blockedReason: string | null
  isolatedReportId: string | null
  baselineUrgency: string | null
}
export type PresentationStore = ReturnType<typeof createPresentationController>

const SCENE_LIMITS: Record<PresentationScene, number> = {
  emergency: 12, hugin: 40, munin: 95, iscat: 55, collective: 65, closing: 14,
}

// This controller only issues public mission-store actions. Its transitions depend
// on the same snapshots shown by the interactive simulator; it never creates data.
export function createPresentationController(store: MissionStore) {
  let snapshot: PresentationSnapshot = {
    status: 'idle', scene: 'emergency', elapsed: 0, sceneElapsed: 0,
    progress: 0, blockedReason: null, isolatedReportId: null, baselineUrgency: null,
  }
  const listeners = new Set<() => void>()
  let lastPublishedAt = 0
  const publish = () => listeners.forEach((listener) => listener())
  const set = (change: Partial<PresentationSnapshot>) => { snapshot = { ...snapshot, ...change }; publish() }
  const scene = (next: PresentationScene) => {
    const state = store.getSnapshot()
    set({ scene: next, sceneElapsed: 0, baselineUrgency: next === 'collective'
      ? state.collective.sectors.find((item) => item.sectorId === 'west')?.urgency ?? null
      : snapshot.baselineUrgency })
    if (next === 'hugin') store.start()
    if (next === 'iscat') store.deployIscat()
  }
  const block = (reason: string) => { store.pause(); set({ status: 'blocked', blockedReason: reason }) }
  const progressFor = (state: MissionSnapshot) => {
    switch (snapshot.scene) {
      case 'emergency': return Math.min(5, snapshot.sceneElapsed)
      case 'hugin': return 5 + state.percent * .25
      case 'munin': return 30 + (state.network.messengerStatus === 'Finalizado' ? 25 : state.network.messenger ? 12 : state.network.failed ? 7 : state.network.started ? 3 : 0)
      case 'iscat': return 55 + state.iscat.deployedCount * 4 + (state.iscat.monitoringStartedAt === null ? 0 : 5) + (state.iscat.indicationCount >= 2 ? 3 : 0)
      case 'collective': return 75 + (state.network.reports.some((report) => report.id === 'RPT-ISCAT-02' && report.status === 'Recibido' && report.location === 'hub') ? 16 : 3)
      case 'closing': return Math.min(99, 92 + snapshot.sceneElapsed)
    }
  }
  return {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    getSnapshot: () => snapshot,
    start: () => {
      if (snapshot.status === 'running' || snapshot.status === 'paused') return
      store.reset()
      snapshot = { status: 'running', scene: 'emergency', elapsed: 0, sceneElapsed: 0,
        progress: 0, blockedReason: null, isolatedReportId: null, baselineUrgency: null }
      lastPublishedAt = 0
      publish()
    },
    pause: () => { if (snapshot.status === 'running') { store.pause(); set({ status: 'paused' }) } },
    resume: () => { if (snapshot.status === 'paused') { store.resume(); set({ status: 'running' }) } },
    cancel: () => {
      if (snapshot.status === 'paused' || snapshot.status === 'blocked') store.resume()
      set({ status: 'idle', blockedReason: null })
    },
    repeat: () => {
      store.reset()
      snapshot = { status: 'running', scene: 'emergency', elapsed: 0, sceneElapsed: 0,
        progress: 0, blockedReason: null, isolatedReportId: null, baselineUrgency: null }
      lastPublishedAt = 0
      publish()
    },
    advance: (delta: number) => {
      if (snapshot.status !== 'running') return
      const step = Math.min(delta, .5)
      snapshot = { ...snapshot, elapsed: snapshot.elapsed + step, sceneElapsed: snapshot.sceneElapsed + step }
      const state = store.getSnapshot()
      if (snapshot.sceneElapsed > SCENE_LIMITS[snapshot.scene]) {
        block(`La escena ${snapshot.scene} no alcanzó su hito esperado. Podés repetir o volver al modo interactivo.`)
        return
      }
      if (snapshot.scene === 'emergency' && snapshot.sceneElapsed >= 5) scene('hugin')
      else if (snapshot.scene === 'hugin' && state.recognizedIds.includes('north') && snapshot.sceneElapsed >= 10) scene('munin')
      else if (snapshot.scene === 'munin') {
        if (!state.network.started && state.network.reports.length) store.startNetwork()
        else if (state.network.started && !state.network.failed && state.recognizedIds.includes('west')) store.failLink()
        const current = store.getSnapshot()
        const isolated = current.network.reports.find((report) => report.sectorId === 'west' && report.status !== 'Recibido' && report.location === 'munin-05')
        if (!snapshot.isolatedReportId && isolated) set({ isolatedReportId: isolated.id })
        const delivered = snapshot.isolatedReportId && current.network.reports.some((report) => report.id === snapshot.isolatedReportId && report.status === 'Recibido' && report.location === 'hub' && report.receivedAt !== null)
        if (delivered && current.network.messengerStatus === 'Finalizado' && current.elapsed >= 42 && current.recognizedIds.length === 5) scene('iscat')
      } else if (snapshot.scene === 'iscat') {
        if (state.iscat.deployedCount === 3 && state.iscat.monitoringStartedAt === null) store.startIscatMonitoring()
        const acoustic = store.getSnapshot().network.reports.find((report) => report.id === 'RPT-ISCAT-02')
        const environmental = store.getSnapshot().network.reports.find((report) => report.id === 'RPT-ISCAT-03')
        if (acoustic?.requiresVerification && environmental && acoustic.status !== 'Recibido') scene('collective')
      } else if (snapshot.scene === 'collective') {
        const acoustic = state.network.reports.find((report) => report.id === 'RPT-ISCAT-02')
        const changed = state.collective.changes.some((change) => change.reportId === acoustic?.id && change.note === 'Recomendación recalculada tras la entrega.')
        const west = state.collective.sectors.find((item) => item.sectorId === 'west')
        if (acoustic?.status === 'Recibido' && acoustic.location === 'hub' && acoustic.receivedAt !== null
          && changed && west?.urgency !== snapshot.baselineUrgency && snapshot.sceneElapsed >= 6) scene('closing')
      } else if (snapshot.scene === 'closing' && snapshot.sceneElapsed >= 7) {
        set({ status: 'finished', progress: 100 })
        return
      }
      const progress = Math.max(snapshot.progress, progressFor(store.getSnapshot()))
      if (snapshot.elapsed - lastPublishedAt >= .2 || progress > snapshot.progress + .4) {
        lastPublishedAt = snapshot.elapsed
        set({ progress })
      } else snapshot = { ...snapshot, progress }
    },
  }
}
