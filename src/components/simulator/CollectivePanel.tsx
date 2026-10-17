import { ArrowUpRight, Info, Radio, ShieldAlert } from 'lucide-react'
import { PRIORITY_RULES, type CollectiveSnapshot } from './collective'
import { sectors } from './scenario'

const since = (clock: number, at: number | null) => at === null ? 'sin dato' : `hace ${Math.max(0, Math.floor(clock - at))} s simulados`
const stamp = (time: number) => `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(Math.floor(time % 60)).padStart(2, '0')}`

export default function CollectivePanel({ data, clock, selectedId, onSelectSector }: {
  data: CollectiveSnapshot
  clock: number
  selectedId: string
  onSelectSector: (sectorId: string) => void
}) {
  return <div className="collective-panel">
    <div className="collective-head">
      <span className="sidebar-label">CENTRO DE DECISIONES / DESAFÍO 09</span>
      <h3>Conciencia <em>Colectiva</em></h3>
      <p>Vista del centro de operaciones basada únicamente en reportes entregados por MUNIN. Las propuestas no ejecutan recursos.</p>
      <div className="collective-warning"><ShieldAlert size={17} /> SIMULACIÓN CONCEPTUAL. DECISIONES SUJETAS A VERIFICACIÓN HUMANA.</div>
    </div>

    <div className="collective-block">
      <span className="sidebar-label">RESUMEN DE LA EMERGENCIA</span>
      <div className="collective-summary">
        <div><strong>{data.receivedCount}</strong><span>RECIBIDOS EN EL CENTRO</span></div>
        <div><strong>{data.unknownCount}/5</strong><span>SECTORES SIN INFORMACIÓN</span></div>
        <div><strong>{data.pendingVerificationCount}</strong><span>REPORTES POR VERIFICAR</span></div>
      </div>
      <div className="collective-flow"><span><i /> {data.localCount} locales</span><span><i /> {data.transitCount} en tránsito</span><span><i /> {data.receivedCount} recibidos</span></div>
      <p className="collective-note"><Info size={14} /> Los reportes locales y en tránsito figuran solo como conteo de la simulación; su contenido no interviene en estas recomendaciones. Sin datos no significa sin riesgo.</p>
    </div>

    <div className="collective-block">
      <span className="sidebar-label">PRIORIDAD SUGERIDA <b>REVISIÓN HUMANA</b></span>
      <div className="collective-sectors">{data.sectors.map((sector) => <article key={sector.sectorId} className={`collective-sector${selectedId === sector.sectorId ? ' selected' : ''}${sector.urgencyPoints === null ? ' unknown' : ''}`}>
        <button className="collective-sector-title" type="button" onClick={() => onSelectSector(sector.sectorId)} title={`Resaltar ${sector.name} en la ciudad`}><span className="collective-rank">{sector.order ? String(sector.order).padStart(2, '0') : '—'}</span><strong>{sector.name}</strong><ArrowUpRight size={15} /></button>
        <div className="collective-badges"><span className={sector.urgencyPoints === null ? 'unknown' : sector.urgencyPoints >= PRIORITY_RULES.highAt ? 'high' : 'medium'}>Urgencia: {sector.urgency}</span><span>Verificación: {sector.verification}</span></div>
        <p className="collective-information">{sector.information}</p>
        {sector.latestReceivedAt !== null && <p className="collective-age">Último reporte: generado {since(clock, sector.latestCreatedAt)} · recibido {since(clock, sector.latestReceivedAt)}</p>}
        <ul>{sector.factors.map((factor) => <li key={factor}>{factor}</li>)}</ul>
        <div className="collective-evidence"><span>{sector.receivedIds.length ? `Evidencia recibida: ${sector.receivedIds.join(' · ')}` : 'Sin evidencia entregada'}</span><span>{sector.access}</span></div>
      </article>)}</div>
    </div>

    <div className="collective-block">
      <span className="sidebar-label">RECURSOS FICTICIOS <b>SOLO PROPUESTA</b></span>
      <div className="collective-resources">{data.resources.map((resource) => <article key={resource.id}>
        <div><strong>{resource.id}</strong><span>{resource.kind}</span></div>
        <b>{resource.sectorId ? sectors.find((sector) => sector.id === resource.sectorId)?.name : 'Disponible / en reserva'}</b>
        <p>{resource.reason}</p><small>{resource.limitation}</small>
      </article>)}</div>
    </div>

    <div className="collective-block">
      <span className="sidebar-label">CAMBIOS AL RECIBIR REPORTES <b>{data.changes.length}</b></span>
      <div className="collective-history" role="log" aria-label="Cambios de recomendaciones">{[...data.changes].reverse().map((change) => <div key={change.reportId}><time>{stamp(change.time)}</time><div><strong>{change.reportId}</strong><p>{change.before} → {change.after}</p><small>{change.note}</small></div></div>)}{!data.changes.length && <p className="collective-empty"><Radio size={15} /> El centro aún no recibió reportes. Las prioridades no se pueden evaluar.</p>}</div>
    </div>

    <details className="collective-method"><summary>Cómo se calcula la sugerencia</summary><p>Reglas ordinales editables del escenario: daño alto +{PRIORITY_RULES.damage.Alto}, moderado +{PRIORITY_RULES.damage.Moderado}; posible indicio acústico +{PRIORITY_RULES.possibleHelp}; riesgo ambiental +{PRIORITY_RULES.environmentalRisk}. La falta de datos no recibe cero: queda sin evaluación. La verificación tiene reglas separadas: fuente única, daño alto, indicio y riesgo ambiental elevan la revisión necesaria; ninguna lectura sustituye la inspección humana. No hay porcentajes de certeza, rutas validadas ni IA entrenada.</p></details>
  </div>
}
