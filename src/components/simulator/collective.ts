import { sectors, type Damage } from './scenario'
import type { NetworkSnapshot, Report } from './network'

export type Urgency = 'No evaluable' | 'Baja estimada' | 'Media estimada' | 'Alta estimada'
export type VerificationNeed = 'Relevar' | 'Necesaria' | 'Prioritaria' | 'Inmediata'
export type SectorDecision = {
  sectorId: string
  name: string
  order: number | null
  urgency: Urgency
  urgencyPoints: number | null
  verification: VerificationNeed
  information: string
  access: string
  factors: string[]
  receivedIds: string[]
  latestReceivedAt: number | null
  latestCreatedAt: number | null
}
export type ResourceSuggestion = {
  id: string
  kind: string
  sectorId: string | null
  reason: string
  limitation: string
}
export type DecisionChange = {
  time: number
  reportId: string
  sectorId: string
  before: string
  after: string
  note: string
}
export type CollectiveSnapshot = {
  sectors: SectorDecision[]
  resources: ResourceSuggestion[]
  changes: DecisionChange[]
  receivedCount: number
  localCount: number
  transitCount: number
  pendingVerificationCount: number
  unknownCount: number
}

// Pesos ordinales editables del escenario ficticio. No son probabilidades ni IA entrenada.
export const PRIORITY_RULES = {
  damage: { Alto: 4, Moderado: 2, Bajo: 0 } satisfies Record<Damage, number>,
  possibleHelp: 5,
  environmentalRisk: 2,
  mediumAt: 2,
  highAt: 4,
  verification: { base: 1, singleSource: 1, possibleHelp: 3, environmentalRisk: 1, highDamage: 1, priorityAt: 3, immediateAt: 5 },
} as const

const delivered = (report: Report) => report.status === 'Recibido' && report.location === 'hub' && report.receivedAt !== null
const sourceKind = (report: Report) => report.origin === 'HUGIN' ? 'HUGIN' : report.origin.startsWith('ISCAT-') ? 'ISCAT' : report.origin
const labelFor = (points: number): Urgency => points >= PRIORITY_RULES.highAt ? 'Alta estimada' : points >= PRIORITY_RULES.mediumAt ? 'Media estimada' : 'Baja estimada'

function rankSectors(received: Report[]): SectorDecision[] {
  const decisions = sectors.map((sector): SectorDecision => {
    const reports = received.filter((report) => report.sectorId === sector.id)
    if (!reports.length) return {
      sectorId: sector.id, name: sector.name, order: null, urgency: 'No evaluable', urgencyPoints: null,
      verification: 'Relevar', information: 'Sin información recibida; el riesgo es desconocido.',
      access: 'Acceso no verificado', factors: ['Sin reportes entregados al centro: no se estima urgencia ni se descarta riesgo.'],
      receivedIds: [], latestReceivedAt: null, latestCreatedAt: null,
    }
    const hugin = reports.filter((report) => sourceKind(report) === 'HUGIN')
    const damageOrder: Damage[] = ['Bajo', 'Moderado', 'Alto']
    const damage = hugin.map((report) => report.signals.damage).filter((value): value is Damage => value !== undefined)
      .sort((a, b) => damageOrder.indexOf(b) - damageOrder.indexOf(a))[0]
    const help = reports.some((report) => report.signals.possibleHelp)
    const environment = reports.some((report) => report.signals.environmentalRisk)
    const limitedAccess = hugin.some((report) => report.signals.accessLimited)
    const sourceKinds = new Set(reports.map(sourceKind))
    const factors: string[] = []
    let points = 0
    if (damage) { points += PRIORITY_RULES.damage[damage]; factors.push(`Daño ${damage.toLowerCase()} reportado por HUGIN: +${PRIORITY_RULES.damage[damage]}.`) }
    if (help) { points += PRIORITY_RULES.possibleHelp; factors.push(`ISCAT reportó un posible patrón de auxilio, sin confirmación: +${PRIORITY_RULES.possibleHelp}.`) }
    if (environment) { points += PRIORITY_RULES.environmentalRisk; factors.push(`Riesgo ambiental reportado: +${PRIORITY_RULES.environmentalRisk}.`) }
    if (!damage && !help && !environment) factors.push('Lectura recibida sin daños ni indicios reportados; no descarta otros riesgos.')
    factors.push(sourceKinds.size === 1 ? 'Una clase de fuente simulada; falta corroboración independiente.' : 'HUGIN e ISCAT aportaron datos distintos; falta verificación humana.')
    factors.push('Vulnerabilidad de la población no definida en este escenario; no suma puntos.')
    const verificationPoints = PRIORITY_RULES.verification.base
      + (sourceKinds.size === 1 ? PRIORITY_RULES.verification.singleSource : 0)
      + (help ? PRIORITY_RULES.verification.possibleHelp : 0)
      + (environment ? PRIORITY_RULES.verification.environmentalRisk : 0)
      + (damage === 'Alto' ? PRIORITY_RULES.verification.highDamage : 0)
    const verification: VerificationNeed = verificationPoints >= PRIORITY_RULES.verification.immediateAt ? 'Inmediata'
      : verificationPoints >= PRIORITY_RULES.verification.priorityAt ? 'Prioritaria' : 'Necesaria'
    return {
      sectorId: sector.id, name: sector.name, order: null, urgency: labelFor(points), urgencyPoints: points,
      verification, information: `${reports.length} reporte${reports.length === 1 ? '' : 's'} recibido${reports.length === 1 ? '' : 's'} · ${sourceKinds.size} clase${sourceKinds.size === 1 ? '' : 's'} de fuente · sin validación de campo`,
      access: limitedAccess ? 'Acceso limitado según HUGIN; ruta no verificada' : 'Acceso no verificado',
      factors, receivedIds: reports.map((report) => report.id),
      latestReceivedAt: Math.max(...reports.map((report) => report.receivedAt!)),
      latestCreatedAt: Math.max(...reports.map((report) => report.createdAt)),
    }
  })
  decisions.sort((a, b) => (b.urgencyPoints ?? -1) - (a.urgencyPoints ?? -1)
    || (b.verification === 'Inmediata' ? 1 : 0) - (a.verification === 'Inmediata' ? 1 : 0)
    || sectors.findIndex((sector) => sector.id === a.sectorId) - sectors.findIndex((sector) => sector.id === b.sectorId))
  let order = 0
  return decisions.map((decision) => ({ ...decision, order: decision.urgencyPoints === null ? null : ++order }))
}

function planResources(ranked: SectorDecision[]): ResourceSuggestion[] {
  const urgent = ranked.filter((sector) => sector.urgencyPoints !== null && sector.urgencyPoints >= PRIORITY_RULES.highAt)
  const usedSectors = new Set<string>()
  const rescue = ['RESCATE-01', 'RESCATE-02'].map((id): ResourceSuggestion => {
    const candidate = urgent.find((sector) => !usedSectors.has(sector.sectorId))
    if (!candidate) return { id, kind: 'Equipo de rescate', sectorId: null, reason: 'Sin asignación sugerida con los datos recibidos.', limitation: 'Disponible; no se ejecutó ningún despacho.' }
    usedSectors.add(candidate.sectorId)
    return { id, kind: 'Equipo de rescate', sectorId: candidate.sectorId, reason: `Evaluar intervención en ${candidate.name} por urgencia ${candidate.urgency.toLowerCase()}.`, limitation: `${candidate.access}. Verificar acceso antes de cualquier despacho.` }
  })
  const helpSector = ranked.find((sector) => sector.factors.some((factor) => factor.includes('posible patrón de auxilio')))
  const medical: ResourceSuggestion = helpSector
    ? { id: 'MÉDICA-01', kind: 'Unidad médica', sectorId: helpSector.sectorId, reason: `Preparar evaluación para ${helpSector.name} si se confirma el indicio acústico.`, limitation: `${helpSector.access}. No se confirma presencia de personas ni ruta transitable.` }
    : { id: 'MÉDICA-01', kind: 'Unidad médica', sectorId: null, reason: 'En reserva hasta contar con un indicio recibido que justifique evaluación.', limitation: 'Disponible; no se ejecutó ningún despacho.' }
  const reconSector = ranked.find((sector) => sector.urgencyPoints === null)
    ?? ranked.find((sector) => sector.verification === 'Inmediata' || sector.verification === 'Prioritaria')
  const reconnaissance: ResourceSuggestion = reconSector
    ? { id: 'RECON-01', kind: 'Equipo de reconocimiento', sectorId: reconSector.sectorId, reason: reconSector.urgencyPoints === null ? `Relevar ${reconSector.name}: no hay datos recibidos.` : `Verificar en campo los indicios de ${reconSector.name}.`, limitation: `${reconSector.access}. No se confirma ruta transitable.` }
    : { id: 'RECON-01', kind: 'Equipo de reconocimiento', sectorId: null, reason: 'Sin tarea sugerida con la información actual.', limitation: 'Disponible; no se ejecutó ningún despacho.' }
  return [...rescue, medical, reconnaissance]
}

function changeHistory(received: Report[]): DecisionChange[] {
  const ordered = [...received].sort((a, b) => a.receivedAt! - b.receivedAt! || a.id.localeCompare(b.id))
  const included: Report[] = []
  return ordered.map((report) => {
    const before = rankSectors(included).find((sector) => sector.sectorId === report.sectorId)!
    included.push(report)
    const after = rankSectors(included).find((sector) => sector.sectorId === report.sectorId)!
    const changed = before.urgency !== after.urgency || before.verification !== after.verification || before.order !== after.order
    return {
      time: report.receivedAt!, reportId: report.id, sectorId: report.sectorId,
      before: `${before.urgency} · ${before.verification}${before.order ? ` · #${before.order}` : ''}`,
      after: `${after.urgency} · ${after.verification}${after.order ? ` · #${after.order}` : ''}`,
      note: changed ? 'Recomendación recalculada tras la entrega.' : 'Sin cambio de nivel; se incorporó información recibida.',
    }
  })
}

export function deriveCollective(network: NetworkSnapshot): CollectiveSnapshot {
  const received = network.reports.filter(delivered)
  const ranked = rankSectors(received)
  return {
    sectors: ranked,
    resources: planResources(ranked),
    changes: changeHistory(received),
    receivedCount: received.length,
    localCount: network.reports.filter((report) => report.status === 'Almacenado').length,
    transitCount: network.reports.filter((report) => report.status === 'En tránsito').length,
    pendingVerificationCount: received.filter((report) => report.requiresVerification).length,
    unknownCount: ranked.filter((sector) => sector.urgencyPoints === null).length,
  }
}
