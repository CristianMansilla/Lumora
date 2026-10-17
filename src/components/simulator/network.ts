import { sectors } from './scenario'
import type { IscatPlan } from './iscat'

export type BeaconStatus = 'Inactiva' | 'Disponible' | 'Conectada' | 'Aislada'
export type ReportStatus = 'Almacenado' | 'En tránsito' | 'Recibido'
export type MessengerStatus = 'En base' | 'Asignado' | 'Despegando' | 'Hacia nodo aislado' | 'Transferencia local' | 'Transportando' | 'Descarga local' | 'Regresando' | 'Finalizado'
export type NodeId = 'hub' | 'munin-01' | 'munin-02' | 'munin-03' | 'munin-04' | 'munin-05' | 'messenger'
export type BeaconPlan = { id: Exclude<NodeId, 'hub' | 'messenger'>; name: string; sectorId: string; x: number; z: number }
export type LinkPlan = { id: string; from: NodeId; to: NodeId }
export type Transfer = { reportId: string; from: NodeId; to: NodeId; start: number; end: number }
export type Report = { id: string; origin: string; sectorId: string; observationType: string; observation: string; requiresVerification: boolean; priority: string; status: ReportStatus; location: NodeId; history: string[] }
export type MessengerTask = { reportIds: string[]; startedAt: number; phase: MessengerStatus }
export type NetworkSnapshot = {
  started: boolean
  failed: boolean
  beacons: { id: BeaconPlan['id']; status: BeaconStatus }[]
  connectedSectorIds: string[]
  isolatedSectorIds: string[]
  linksAvailable: number
  reports: Report[]
  transfers: Transfer[]
  messenger: MessengerTask | null
  messengerStatus: MessengerStatus
  events: { time: number; text: string }[]
}

export const HUB = { x: 1, z: 4 }
export const BEACONS: BeaconPlan[] = [
  { id: 'munin-01', name: 'MUNIN-01', sectorId: 'center', x: -2.6, z: 2.3 },
  { id: 'munin-02', name: 'MUNIN-02', sectorId: 'north', x: -2.4, z: -12.5 },
  { id: 'munin-03', name: 'MUNIN-03', sectorId: 'east', x: 14.1, z: 2.4 },
  { id: 'munin-04', name: 'MUNIN-04', sectorId: 'south', x: -2.3, z: 12.4 },
  { id: 'munin-05', name: 'MUNIN-05', sectorId: 'west', x: -16.6, z: 2.2 },
]
export const LINKS: LinkPlan[] = [
  { id: 'hub-center', from: 'hub', to: 'munin-01' },
  { id: 'center-north', from: 'munin-01', to: 'munin-02' },
  { id: 'center-east', from: 'munin-01', to: 'munin-03' },
  { id: 'center-south', from: 'munin-01', to: 'munin-04' },
  { id: 'center-west', from: 'munin-01', to: 'munin-05' },
]
export const FAILED_LINK = 'center-west'
export const nodePosition = (id: NodeId) => id === 'hub' ? HUB : BEACONS.find((beacon) => beacon.id === id) ?? HUB
export const beaconForSector = (sectorId: string) => BEACONS.find((beacon) => beacon.sectorId === sectorId)!

export function route(from: NodeId, to: NodeId, failed: boolean): NodeId[] | null {
  if (from === to) return [from]
  const queue: NodeId[][] = [[from]]
  const visited = new Set<NodeId>([from])
  while (queue.length) {
    const path = queue.shift()!
    const current = path.at(-1)!
    for (const link of LINKS) {
      if (failed && link.id === FAILED_LINK) continue
      const next = link.from === current ? link.to : link.to === current ? link.from : null
      if (!next || visited.has(next)) continue
      if (next === to) return [...path, next]
      visited.add(next)
      queue.push([...path, next])
    }
  }
  return null
}

type MutableReport = Report & { hop: { from: NodeId; to: NodeId; start: number; end: number } | null }
const priorityFor = (id: string) => id === 'south' || id === 'west' ? 'Alta (indicativa)' : id === 'north' || id === 'east' ? 'Media (indicativa)' : 'Baja (indicativa)'
const nameOf = (id: NodeId) => id === 'hub' ? 'centro de operaciones' : id === 'messenger' ? 'dron mensajero' : BEACONS.find((beacon) => beacon.id === id)?.name ?? id

export function createNetworkModel() {
  let started = false
  let failed = false
  let reports: MutableReport[] = []
  let events: { time: number; text: string }[] = []
  let messenger: MessengerTask | null = null
  let messengerStatus: MessengerStatus = 'En base'
  let westUpdates = 1
  const log = (time: number, text: string) => { events = [...events, { time, text }] }
  const connected = () => BEACONS.filter((beacon) => route(beacon.id, 'hub', failed))

  const addReport = (sectorId: string, time: number, update = false) => {
    const sector = sectors.find((item) => item.id === sectorId)!
    const beacon = beaconForSector(sectorId)
    const id = 'RPT-' + sectorId.toUpperCase() + '-' + String(update ? ++westUpdates : 1).padStart(2, '0')
    if (reports.some((report) => report.id === id)) return
    reports = [...reports, {
      id, origin: 'HUGIN', sectorId, observationType: 'Relevamiento visual', requiresVerification: true,
      observation: update ? 'Actualización local ficticia tras la caída del enlace.' : sector.observations,
      priority: priorityFor(sectorId), status: 'Almacenado', location: beacon.id, hop: null,
      history: [`${time.toFixed(1)} s · HUGIN generó un reporte simulado de ${sector.name}.`, `${time.toFixed(1)} s · Almacenado en ${beacon.name}.`],
    }]
    log(time, `${id} disponible únicamente en ${beacon.name}.`)
  }
  const setPhase = (phase: MessengerStatus, time: number, text: string) => {
    if (!messenger) return
    messenger = { ...messenger, phase }
    messengerStatus = phase
    log(time, text)
  }
  const scheduleMessenger = (time: number) => {
    if (!started || (messenger && messenger.phase !== 'Finalizado')) return
    const isolated = reports.filter((report) => report.status === 'Almacenado' && report.location === 'munin-05' && !route('munin-05', 'hub', failed))
    if (!isolated.length) return
    messenger = { reportIds: isolated.map((report) => report.id), startedAt: time, phase: 'Asignado' }
    messengerStatus = 'Asignado'
    log(time, `MUNIN-M1 asignado: recoger ${isolated.length} reporte(s) aislado(s) en MUNIN-05.`)
  }
  const advanceMessenger = (time: number) => {
    if (!messenger) return
    const relative = time - messenger.startedAt
    const ids = messenger.reportIds
    if (relative >= 1 && messenger.phase === 'Asignado') setPhase('Despegando', time, 'MUNIN-M1 despegó del centro de operaciones.')
    if (relative >= 3 && messenger.phase === 'Despegando') setPhase('Hacia nodo aislado', time, 'MUNIN-M1 viaja hacia MUNIN-05.')
    if (relative >= 9 && messenger.phase === 'Hacia nodo aislado') setPhase('Transferencia local', time, 'MUNIN-M1 estableció transferencia local junto a MUNIN-05.')
    if (relative >= 11 && messenger.phase === 'Transferencia local') {
      reports = reports.map((report) => ids.includes(report.id) && report.status === 'Almacenado'
        ? { ...report, status: 'En tránsito', location: 'messenger', history: [...report.history, `${time.toFixed(1)} s · Copia local al almacenamiento digital de MUNIN-M1.`] } : report)
      setPhase('Transportando', time, 'MUNIN-M1 recogió los reportes y los transporta en su almacenamiento digital.')
    }
    if (relative >= 18 && messenger.phase === 'Transportando') setPhase('Descarga local', time, 'MUNIN-M1 llegó junto a MUNIN-01 e inició la descarga local.')
    if (relative >= 20 && messenger.phase === 'Descarga local') {
      reports = reports.map((report) => ids.includes(report.id) && report.location === 'messenger'
        ? { ...report, status: 'Almacenado', location: 'munin-01', history: [...report.history, `${time.toFixed(1)} s · Descargado localmente en MUNIN-01.`] } : report)
      setPhase('Regresando', time, 'MUNIN-M1 descargó los reportes en MUNIN-01; la red puede retransmitirlos.')
    }
    if (relative >= 24 && messenger.phase === 'Regresando') setPhase('Finalizado', time, 'MUNIN-M1 regresó al centro de operaciones.')
  }
  const advanceReports = (time: number) => {
    if (!started) return
    for (const report of reports) {
      if (report.hop && time >= report.hop.end) {
        const destination = report.hop.to
        report.location = destination
        report.history = [...report.history, `${time.toFixed(1)} s · Salto confirmado: ${nameOf(report.hop.from)} → ${nameOf(destination)}.`]
        report.hop = null
        if (destination === 'hub') {
          report.status = 'Recibido'
          log(time, `${report.id} recibido en el centro de operaciones.`)
        } else {
          report.status = 'Almacenado'
          log(time, `${report.id} disponible en ${nameOf(destination)}.`)
        }
      }
      if (!report.hop && report.status === 'Almacenado' && report.location !== 'messenger') {
        if (messenger && messenger.reportIds.includes(report.id) && messenger.phase !== 'Finalizado' && report.location === 'munin-05') continue
        const path = route(report.location, 'hub', failed)
        if (path && path.length > 1) {
          report.hop = { from: path[0], to: path[1], start: time, end: time + 1.8 }
          report.status = 'En tránsito'
          report.history = [...report.history, `${time.toFixed(1)} s · Enlace iniciado: ${nameOf(path[0])} → ${nameOf(path[1])}.`]
          log(time, `${report.id} en tránsito: ${nameOf(path[0])} → ${nameOf(path[1])}.`)
        }
      }
    }
  }
  return {
    onRecognized: addReport,
    addIscatReport: (plan: IscatPlan, time: number) => {
      const id = `RPT-${plan.id}`
      if (reports.some((report) => report.id === id)) return
      const beacon = beaconForSector(plan.sectorId)
      reports = [...reports, {
        id, origin: plan.id, sectorId: plan.sectorId, observationType: plan.observationType,
        observation: plan.observation, requiresVerification: plan.requiresVerification,
        priority: 'Sin priorizar', status: 'Almacenado', location: beacon.id, hop: null,
        history: [`${time.toFixed(1)} s · ${plan.id} generó una lectura ficticia.`, `${time.toFixed(1)} s · Almacenado en ${beacon.name}.`],
      }]
      log(time, `${id} disponible únicamente en ${beacon.name}.`)
      if (started) { scheduleMessenger(time); advanceReports(time) }
    },
    start: (time: number) => { if (!started && reports.length) { started = true; log(time, 'Red MUNIN activada; se evalúan las rutas disponibles.'); scheduleMessenger(time); advanceReports(time) } },
    fail: (time: number, westRecognized: boolean) => {
      if (failed) return
      failed = true
      log(time, 'Enlace MUNIN-01 ↔ MUNIN-05 interrumpido. Sector Oeste aislado.')
      for (const report of reports) {
        if (report.hop && ((report.hop.from === 'munin-05' && report.hop.to === 'munin-01') || (report.hop.from === 'munin-01' && report.hop.to === 'munin-05'))) {
          report.location = report.hop.from
          report.hop = null
          report.status = 'Almacenado'
          report.history = [...report.history, `${time.toFixed(1)} s · Transferencia detenida por la caída del enlace.`]
        }
      }
      if (westRecognized && !reports.some((report) => report.sectorId === 'west' && report.location === 'munin-05' && report.status === 'Almacenado')) addReport('west', time, true)
      scheduleMessenger(time)
    },
    restore: (time: number) => { if (failed) { failed = false; log(time, 'Enlace MUNIN-01 ↔ MUNIN-05 restaurado.') } },
    advance: (time: number) => { if (!started) return; advanceMessenger(time); scheduleMessenger(time); advanceReports(time) },
    isSettled: () => !started || (reports.every((report) => report.status === 'Recibido') && (!messenger || messenger.phase === 'Finalizado')),
    snapshot: (): NetworkSnapshot => {
      const connectedBeacons = connected()
      const connectedIds = new Set(connectedBeacons.map((beacon) => beacon.id))
      return {
        started, failed,
        beacons: BEACONS.map((beacon) => ({ id: beacon.id, status: !started ? reports.some((report) => report.sectorId === beacon.sectorId) ? 'Disponible' : 'Inactiva' : connectedIds.has(beacon.id) ? 'Conectada' : failed && beacon.id === 'munin-05' ? 'Aislada' : 'Disponible' })),
        connectedSectorIds: started ? connectedBeacons.map((beacon) => beacon.sectorId) : [],
        isolatedSectorIds: started ? BEACONS.filter((beacon) => !connectedIds.has(beacon.id)).map((beacon) => beacon.sectorId) : [],
        linksAvailable: started ? LINKS.length - Number(failed) : 0,
        reports: reports.map((report) => ({ id: report.id, origin: report.origin, sectorId: report.sectorId, observationType: report.observationType, observation: report.observation, requiresVerification: report.requiresVerification, priority: report.priority, status: report.status, location: report.location, history: [...report.history] })),
        transfers: reports.filter((report) => report.hop).map((report) => ({ reportId: report.id, from: report.hop!.from, to: report.hop!.to, start: report.hop!.start, end: report.hop!.end })),
        messenger: messenger ? { ...messenger, reportIds: [...messenger.reportIds] } : null,
        messengerStatus,
        events,
      }
    },
  }
}
