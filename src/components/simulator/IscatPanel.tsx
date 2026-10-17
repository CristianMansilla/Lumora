import { Radio, Send } from 'lucide-react'
import { ISCAT_DEPLOYMENT_DURATION, ISCAT_PLANS, type IscatSnapshot } from './iscat'
import type { NetworkSnapshot } from './network'

export function IscatControls({ iscat, clock, onDeploy, onMonitor }: { iscat: IscatSnapshot; clock: number; onDeploy: () => void; onMonitor: () => void }) {
  const deploying = iscat.deploymentStartedAt !== null && clock - iscat.deploymentStartedAt < ISCAT_DEPLOYMENT_DURATION
  return <div className="iscat-controls" aria-label="Controles ISCAT">
    <div className="mission-control-title"><span>ISCAT / FEROMONAS DIGITALES</span><strong>{iscat.monitoringStartedAt !== null ? 'Monitoreo conceptual activo' : deploying ? 'Despliegue en curso' : iscat.deployedCount === 3 ? 'Cápsulas listas para monitoreo' : 'Tres cápsulas en espera'}</strong></div>
    <div className="mission-control-buttons">
      <button type="button" className="iscat-primary" disabled={iscat.deploymentStartedAt !== null} onClick={onDeploy}><Send size={15} /> Desplegar ISCAT</button>
      <button type="button" disabled={iscat.deployedCount < 3 || deploying || iscat.monitoringStartedAt !== null} onClick={onMonitor}><Radio size={15} /> Iniciar monitoreo</button>
    </div>
  </div>
}

export default function IscatPanel({ iscat, network, selectedId, onSelect }: { iscat: IscatSnapshot; network: NetworkSnapshot; selectedId: string; onSelect: (id: string) => void }) {
  return <details className="sidebar-block iscat-panel" open>
    <summary className="sidebar-label">ISCAT / FEROMONAS DIGITALES <b>{iscat.deployedCount}/3</b></summary>
    <div className="iscat-metrics">
      <div><strong>{iscat.deployedCount}/3</strong><span>DESPLEGADAS</span></div>
      <div><strong>{iscat.monitoringCount}/3</strong><span>MONITOREANDO</span></div>
      <div><strong className="iscat-alert">{iscat.indicationCount}</strong><span>POSIBLES INDICIOS</span></div>
      <div><strong>{iscat.pendingCount}</strong><span>REPORTES PENDIENTES</span></div>
      <div><strong className="iscat-alert">{iscat.receivedAlerts}</strong><span>ALERTAS RECIBIDAS</span></div>
    </div>
    <div className="iscat-list">{ISCAT_PLANS.map((plan, index) => <button key={plan.id} type="button" className={selectedId === plan.id ? 'active' : ''} onClick={() => onSelect(plan.id)}><i className={iscat.capsules[index].report?.requiresVerification ? 'alert' : ''} /><strong>{plan.id}</strong><span>{iscat.capsules[index].status}</span></button>)}</div>
    {iscat.pendingCount > 0 && !network.started && <p className="iscat-hint">Los reportes locales esperan la activación de la red MUNIN.</p>}
    <div className="iscat-log"><span className="sidebar-label">EVENTOS <b>{iscat.events.length}</b></span><div className="mission-events" role="log" aria-label="Eventos ISCAT">{[...iscat.events].reverse().map((event, index) => <div key={`${event.time}-${index}`}><time>{String(Math.floor(event.time / 60)).padStart(2, '0')}:{String(Math.floor(event.time % 60)).padStart(2, '0')}</time><span>{event.text}</span></div>)}{!iscat.events.length && <p>Aún no se desplegaron cápsulas.</p>}</div></div>
  </details>
}
