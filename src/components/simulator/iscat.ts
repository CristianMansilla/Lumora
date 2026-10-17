import type { Report } from './network'
import { MOBILE_BASE_POSITION } from './mobileBaseConfig'

export type IscatPlan = {
  id: 'ISCAT-01' | 'ISCAT-02' | 'ISCAT-03'
  sectorId: 'north' | 'west' | 'south'
  position: [number, number]
  observationType: string
  observation: string
  requiresVerification: boolean
  delay: number
}

export const ISCAT_PLANS: IscatPlan[] = [
  { id: 'ISCAT-01', sectorId: 'north', position: [-5, -12.7], observationType: 'Condiciones ambientales', observation: 'Lectura ficticia sin anomalías relevantes.', requiresVerification: false, delay: 2 },
  { id: 'ISCAT-02', sectorId: 'west', position: [-17.2, 4.6], observationType: 'Posible patrón acústico', observation: 'Golpes repetitivos simulados; requiere verificación humana en terreno.', requiresVerification: true, delay: 5 },
  { id: 'ISCAT-03', sectorId: 'south', position: [-13.3, 13.65], observationType: 'Anomalía ambiental', observation: 'Anomalía ambiental simulada próxima al área inundada; requiere inspección.', requiresVerification: true, delay: 8 },
]

export const ISCAT_SORTIE_DURATION = 8
export const ISCAT_DEPLOYMENT_DURATION = ISCAT_PLANS.length * ISCAT_SORTIE_DURATION
export const ISCAT_BASE: [number, number, number] = [MOBILE_BASE_POSITION[0] - .7, 1.45, MOBILE_BASE_POSITION[2] + .5]

export type IscatEvent = { time: number; text: string }
export type IscatCapsuleState = { id: IscatPlan['id']; sectorId: IscatPlan['sectorId']; status: string; report: Report | null }
export type IscatSnapshot = {
  deploymentStartedAt: number | null
  monitoringStartedAt: number | null
  paused: boolean
  deployedCount: number
  monitoringCount: number
  indicationCount: number
  pendingCount: number
  receivedAlerts: number
  capsules: IscatCapsuleState[]
  events: IscatEvent[]
}

const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

export function iscatDronePose(time: number, startedAt: number | null) {
  const [bx, by, bz] = ISCAT_BASE
  if (startedAt === null || time - startedAt >= ISCAT_DEPLOYMENT_DURATION) return { position: [bx, by, bz] as [number, number, number], yaw: 0, carrying: -1, flying: false }
  const relative = Math.max(0, time - startedAt)
  const index = Math.min(ISCAT_PLANS.length - 1, Math.floor(relative / ISCAT_SORTIE_DURATION))
  const leg = relative - index * ISCAT_SORTIE_DURATION
  const [tx, tz] = ISCAT_PLANS[index].position
  const high = 9.4
  let x = bx, z = bz
  let y: number
  if (leg < 1) y = by + (high - by) * smooth(leg)
  else if (leg < 3.5) { const u = smooth((leg - 1) / 2.5); x = bx + (tx - bx) * u; z = bz + (tz - bz) * u; y = high }
  else if (leg < 4) { x = tx; z = tz; y = high + (1.05 - high) * smooth((leg - 3.5) / .5) }
  else if (leg < 5.2) { x = tx; z = tz; y = 1.05 + (high - 1.05) * smooth((leg - 4) / 1.2) }
  else if (leg < 7.5) { const u = smooth((leg - 5.2) / 2.3); x = tx + (bx - tx) * u; z = tz + (bz - tz) * u; y = high }
  else y = high + (by - high) * smooth((leg - 7.5) / .5)
  return { position: [x, y, z] as [number, number, number], yaw: leg >= 5.2 ? Math.atan2(bx - tx, bz - tz) : Math.atan2(tx - bx, tz - bz), carrying: leg < 4 ? index : -1, flying: true }
}

export function createIscatModel() {
  let deploymentStartedAt: number | null = null
  let monitoringStartedAt: number | null = null
  let paused = false
  let events: IscatEvent[] = []
  const generated = new Set<string>()
  const log = (time: number, text: string) => { events = [...events, { time, text }] }
  return {
    isActive: () => deploymentStartedAt !== null,
    isPaused: () => paused,
    deploy: (time: number) => {
      if (deploymentStartedAt !== null) return false
      deploymentStartedAt = time
      log(time, 'Dron ISCAT iniciado desde la base móvil; comienza el despliegue secuencial.')
      return true
    },
    monitor: (time: number) => {
      if (deploymentStartedAt === null || time - deploymentStartedAt < ISCAT_DEPLOYMENT_DURATION || monitoringStartedAt !== null) return false
      monitoringStartedAt = time
      log(time, 'Monitoreo conceptual iniciado. Las lecturas son predeterminadas y ficticias.')
      return true
    },
    pause: () => { paused = true },
    resume: () => { paused = false },
    advance: (time: number, addReport: (plan: IscatPlan, time: number) => void) => {
      if (deploymentStartedAt === null || paused) return
      ISCAT_PLANS.forEach((plan, index) => {
        const dropAt = deploymentStartedAt! + index * ISCAT_SORTIE_DURATION + 4
        const key = `drop-${plan.id}`
        if (time >= dropAt && !generated.has(key)) { generated.add(key); log(time, `${plan.id} depositada en el sector ${plan.sectorId}.`) }
      })
      if (monitoringStartedAt === null) return
      ISCAT_PLANS.forEach((plan) => {
        if (time < monitoringStartedAt! + plan.delay || generated.has(plan.id)) return
        generated.add(plan.id)
        addReport(plan, time)
        log(time, plan.requiresVerification ? `${plan.id}: indicio simulado registrado; requiere verificación.` : `${plan.id}: condiciones simuladas normales.`)
      })
    },
    snapshot: (time: number, reports: Report[]): IscatSnapshot => {
      const capsules = ISCAT_PLANS.map((plan, index): IscatCapsuleState => {
        const relative = deploymentStartedAt === null ? -1 : time - deploymentStartedAt
        const dropped = relative >= index * ISCAT_SORTIE_DURATION + 4
        const inFlight = relative >= index * ISCAT_SORTIE_DURATION && !dropped
        const report = reports.find((item) => item.id === `RPT-${plan.id}`) ?? null
        const status = report ? plan.requiresVerification ? 'Indicio registrado' : 'Condiciones normales' : monitoringStartedAt !== null && dropped ? 'Monitoreando' : dropped ? 'Desplegada' : inFlight ? 'En transporte' : 'En base'
        return { id: plan.id, sectorId: plan.sectorId, status, report }
      })
      const ownReports = reports.filter((report) => report.origin.startsWith('ISCAT-'))
      return {
        deploymentStartedAt, monitoringStartedAt, paused,
        deployedCount: capsules.filter((item) => !['En base', 'En transporte'].includes(item.status)).length,
        monitoringCount: capsules.filter((item) => ['Monitoreando', 'Condiciones normales', 'Indicio registrado'].includes(item.status)).length,
        indicationCount: ownReports.filter((report) => report.requiresVerification).length,
        pendingCount: ownReports.filter((report) => report.status !== 'Recibido').length,
        receivedAlerts: ownReports.filter((report) => report.requiresVerification && report.status === 'Recibido').length,
        capsules, events,
      }
    },
  }
}
