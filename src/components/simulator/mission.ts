import { CatmullRomCurve3, Vector3 } from 'three'
import { sectors } from './scenario'
import { createNetworkModel, type NetworkSnapshot } from './network'
import { createIscatModel, type IscatSnapshot } from './iscat'
import { deriveCollective, type CollectiveSnapshot } from './collective'

export type MissionPhase = 'idle' | 'running' | 'paused' | 'complete'
export type DroneStatus = 'En base' | 'Despegando' | 'En ruta' | 'Inspeccionando' | 'Regresando' | 'Aterrizando' | 'Finalizado'
export type MissionEvent = { time: number; text: string }
export type DroneStop = { sectorId: string; x: number; z: number; arrive: number; depart: number }
export type DronePlan = {
  id: string
  launch: [number, number]
  start: number
  takeoffEnd: number
  stops: DroneStop[]
  returnEnd: number
  landEnd: number
  color: string
  mission: string
}

const altitude = 8.6
const baseHeight = .92
export const MISSION_DURATION = 42
export const DRONE_PLANS: DronePlan[] = [
  { id: 'HUGIN-01', launch: [-.3, 7.7], start: 0, takeoffEnd: 3, stops: [
    { sectorId: 'north', x: -1, z: -12, arrive: 9, depart: 12 },
    { sectorId: 'west', x: -16.2, z: 0, arrive: 22, depart: 25 },
  ], returnEnd: 37, landEnd: 40, color: '#74eaf0', mission: 'Reconocimiento de los sectores Norte y Oeste.' },
  { id: 'HUGIN-02', launch: [1.1, 7.7], start: 2, takeoffEnd: 5, stops: [
    { sectorId: 'east', x: 15.5, z: 0, arrive: 15, depart: 18 },
    { sectorId: 'center', x: 0, z: 0, arrive: 27, depart: 30 },
  ], returnEnd: 39, landEnd: 42, color: '#ffaf7f', mission: 'Reconocimiento de los sectores Este y Centro.' },
  { id: 'HUGIN-03', launch: [2.5, 7.7], start: 4, takeoffEnd: 7, stops: [
    { sectorId: 'south', x: -1, z: 12, arrive: 19, depart: 23 },
  ], returnEnd: 37, landEnd: 40, color: '#d6f5ee', mission: 'Reconocimiento del sector Sur y zonas inundadas.' },
]

const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}
const point = (x: number, z: number, y = altitude) => new Vector3(x, y, z)
const curveBetween = (from: Vector3, to: Vector3, lateral: number) => {
  const mid = from.clone().lerp(to, .5)
  mid.x += lateral
  mid.z -= lateral * .35
  return new CatmullRomCurve3([from, from.clone().lerp(mid, .55), mid, mid.clone().lerp(to, .55), to])
}

const routes = DRONE_PLANS.map((plan, index) => {
  const stops = plan.stops.map((stop) => point(stop.x, stop.z))
  const launch = point(...plan.launch)
  const legs = [launch, ...stops, launch].slice(0, -1).map((from, leg) =>
    curveBetween(from, [...stops, launch][leg], (index - 1) * 1.3 + (leg % 2 ? -.8 : .8)))
  return { launch, stops, legs }
})

export type FlightPose = {
  position: Vector3
  yaw: number
  status: DroneStatus
  scanningSectorId: string | null
}

function travel(curve: CatmullRomCurve3, time: number, start: number, end: number, status: DroneStatus): FlightPose {
  const u = ease((time - start) / (end - start))
  const position = curve.getPoint(u)
  const tangent = curve.getTangent(Math.max(.015, Math.min(.985, u)))
  return { position, yaw: Math.atan2(tangent.x, tangent.z), status, scanningSectorId: null }
}

export function flightAt(index: number, elapsed: number): FlightPose {
  const plan = DRONE_PLANS[index]
  const route = routes[index]
  const [x, z] = plan.launch
  if (elapsed < plan.start) return { position: point(x, z, baseHeight), yaw: 0, status: 'En base', scanningSectorId: null }
  if (elapsed < plan.takeoffEnd) {
    const y = baseHeight + (altitude - baseHeight) * ease((elapsed - plan.start) / (plan.takeoffEnd - plan.start))
    return { position: point(x, z, y), yaw: .15 * Math.sin(elapsed * 2), status: 'Despegando', scanningSectorId: null }
  }
  let travelStart = plan.takeoffEnd
  for (let stopIndex = 0; stopIndex < plan.stops.length; stopIndex++) {
    const stop = plan.stops[stopIndex]
    if (elapsed < stop.arrive) return travel(route.legs[stopIndex], elapsed, travelStart, stop.arrive, 'En ruta')
    if (elapsed < stop.depart) {
      const hover = .14 * Math.sin((elapsed - stop.arrive) * 2.3)
      return { position: point(stop.x, stop.z, altitude + hover), yaw: .16 * Math.sin(elapsed), status: 'Inspeccionando', scanningSectorId: stop.sectorId }
    }
    travelStart = stop.depart
  }
  if (elapsed < plan.returnEnd) return travel(route.legs[plan.stops.length], elapsed, travelStart, plan.returnEnd, 'Regresando')
  if (elapsed < plan.landEnd) {
    const y = altitude - (altitude - baseHeight) * ease((elapsed - plan.returnEnd) / (plan.landEnd - plan.returnEnd))
    return { position: point(x, z, y), yaw: 0, status: 'Aterrizando', scanningSectorId: null }
  }
  return { position: point(x, z, baseHeight), yaw: 0, status: 'Finalizado', scanningSectorId: null }
}

const recognitionTimes = DRONE_PLANS.flatMap((plan) => plan.stops.map((stop) => ({
  time: stop.arrive + 1.25,
  sectorId: stop.sectorId,
  text: plan.id + ' completó el reconocimiento de ' + sectors.find((sector) => sector.id === stop.sectorId)?.name + '.',
}))).sort((a, b) => a.time - b.time)

const milestones: MissionEvent[] = [
  ...DRONE_PLANS.slice(1).map((plan) => ({ time: plan.start, text: plan.id + ' despegó del centro de operaciones.' })),
  ...recognitionTimes.map(({ time, text }) => ({ time, text })),
  ...DRONE_PLANS.map((plan) => ({ time: plan.stops.at(-1)!.depart, text: plan.id + ' inicia el regreso a base.' })),
  ...DRONE_PLANS.map((plan) => ({ time: plan.landEnd, text: plan.id + ' aterrizó en el centro de operaciones.' })),
].sort((a, b) => a.time - b.time)

export type MissionSnapshot = {
  phase: MissionPhase
  elapsed: number
  clock: number
  percent: number
  activeCount: number
  recognizedIds: string[]
  currentSector: string
  droneStatuses: DroneStatus[]
  events: MissionEvent[]
  network: NetworkSnapshot
  iscat: IscatSnapshot
  collective: CollectiveSnapshot
}

export type MissionStore = ReturnType<typeof createMissionStore>

export function createMissionStore() {
  let elapsed = 0
  let clock = 0
  let phase: MissionPhase = 'idle'
  let lastPublish = 0
  let events: MissionEvent[] = []
  let recognizedIds: string[] = []
  let network = createNetworkModel()
  let iscat = createIscatModel()
  let huginFinished = false
  const listeners = new Set<() => void>()
  const derive = (): MissionSnapshot => {
    const nextRecognized = recognitionTimes.filter((entry) => entry.time <= elapsed).map((entry) => entry.sectorId)
    if (nextRecognized.join('|') !== recognizedIds.join('|')) recognizedIds = nextRecognized
    const poses = DRONE_PLANS.map((_, index) => flightAt(index, Math.min(elapsed, MISSION_DURATION)))
    const inspecting = poses.map((pose) => pose.scanningSectorId).filter((id): id is string => Boolean(id))
    const networkSnapshot = network.snapshot()
    return {
      phase, elapsed, clock, percent: Math.min(100, Math.round(elapsed / MISSION_DURATION * 100)),
      activeCount: phase === 'idle' ? 0 : poses.filter((pose) => pose.status !== 'En base' && pose.status !== 'Finalizado').length,
      recognizedIds,
      currentSector: inspecting.length ? inspecting.map((id) => sectors.find((sector) => sector.id === id)?.name ?? id).join(' · ') : 'Ninguno',
      droneStatuses: poses.map((pose) => phase === 'idle' ? 'En base' : pose.status),
      events, network: networkSnapshot, iscat: iscat.snapshot(clock, networkSnapshot.reports), collective: deriveCollective(networkSnapshot),
    }
  }
  let snapshot = derive()
  const publish = () => { snapshot = derive(); listeners.forEach((listener) => listener()) }
  return {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    getSnapshot: () => snapshot,
    getTime: () => elapsed,
    getClock: () => clock,
    advance: (delta: number) => {
      if (iscat.isPaused() || (phase !== 'running' && !iscat.isActive())) return
      const step = Math.min(delta, .5)
      clock += step
      const previous = elapsed
      const previousPhase = phase
      let reached: MissionEvent[] = []
      if (phase === 'running') {
        elapsed += step
        reached = milestones.filter((entry) => entry.time > previous && entry.time <= elapsed)
        if (reached.length) events = [...events, ...reached]
        for (const entry of recognitionTimes.filter((item) => item.time > previous && item.time <= elapsed)) network.onRecognized(entry.sectorId, clock)
        if (elapsed >= MISSION_DURATION && !huginFinished) {
          huginFinished = true
          events = [...events, { time: MISSION_DURATION, text: 'Reconocimiento finalizado. Los tres drones regresaron a base.' }]
        }
      }
      iscat.advance(clock, network.addIscatReport)
      network.advance(clock)
      if (huginFinished && network.isSettled()) phase = 'complete'
      if (clock - lastPublish >= .15 || reached.length || phase !== previousPhase) { lastPublish = clock; publish() }
    },
    start: () => {
      elapsed = 0; lastPublish = clock; phase = 'running'; huginFinished = false
      if (!iscat.isActive()) { network = createNetworkModel(); clock = 0; lastPublish = 0 }
      iscat.resume()
      events = [{ time: 0, text: 'Reconocimiento iniciado. HUGIN-01 despegó del centro de operaciones.' }]
      publish()
    },
    pause: () => { if (phase === 'running' || iscat.isActive() && !iscat.isPaused()) { if (phase === 'running') phase = 'paused'; iscat.pause(); events = [...events, { time: elapsed, text: 'Misión pausada.' }]; publish() } },
    resume: () => { if (phase === 'paused' || iscat.isPaused()) { if (phase === 'paused') phase = 'running'; iscat.resume(); events = [...events, { time: elapsed, text: 'Misión reanudada.' }]; publish() } },
    deployIscat: () => { if (iscat.deploy(clock)) publish() },
    startIscatMonitoring: () => { if (iscat.monitor(clock)) publish() },
    startNetwork: () => { network.start(clock); if (network.snapshot().started) { if (phase === 'complete') phase = 'running'; publish() } },
    failLink: () => { network.fail(clock, recognizedIds.includes('west')); if (phase === 'complete' && !network.isSettled()) phase = 'running'; publish() },
    restoreLink: () => { network.restore(clock); publish() },
    reset: () => { elapsed = 0; clock = 0; lastPublish = 0; phase = 'idle'; huginFinished = false; events = []; recognizedIds = []; network = createNetworkModel(); iscat = createIscatModel(); publish() },
  }
}
