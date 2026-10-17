import { AlertTriangle, Pause, Play, RotateCcw, X } from 'lucide-react'
import type { MissionSnapshot } from './mission'
import type { PresentationSnapshot } from './presentation'

const titles = {
  emergency: '01 / Emergencia', hugin: '02 / Base LUMORA y HUGIN',
  munin: '03 / Comunicaciones MUNIN', iscat: '04 / Sensores ISCAT',
  collective: '05 / Conciencia Colectiva', closing: '06 / Coordinación',
} as const

export default function PresentationHud({ presentation, mission, onPause, onResume, onCancel, onRepeat }: {
  presentation: PresentationSnapshot
  mission: MissionSnapshot
  onPause: () => void
  onResume: () => void
  onCancel: () => void
  onRepeat: () => void
}) {
  const acoustic = mission.network.reports.find((report) => report.id === 'RPT-ISCAT-02')
  const receivedAcoustic = acoustic?.status === 'Recibido' && acoustic.location === 'hub' && acoustic.receivedAt !== null
  const west = mission.collective.sectors.find((sector) => sector.sectorId === 'west')
  const suggested = mission.collective.resources.find((resource) => resource.sectorId === 'west')
  const recommendation = mission.collective.changes.find((change) => change.reportId === acoustic?.id)
  const narrative = presentation.scene === 'emergency' ? 'Cuando ocurre una catástrofe, cada decisión cuenta.'
    : presentation.scene === 'hugin' ? `La base móvil conceptual despliega HUGIN. Reconocimiento real de la simulación: ${mission.recognizedIds.length}/5 sectores.`
      : presentation.scene === 'munin' ? mission.network.messengerStatus === 'Finalizado'
        ? 'MUNIN-M1 regresó. La entrega se confirma únicamente en el registro del centro.'
        : mission.network.failed ? `Enlace Oeste interrumpido. MUNIN-M1: ${mission.network.messengerStatus.toLowerCase()}.`
          : 'MUNIN activa enlaces temporales para trasladar los reportes de HUGIN.'
        : presentation.scene === 'iscat' ? acoustic
          ? `ISCAT-02 registró un posible indicio acústico ficticio. Reporte: ${acoustic.status.toLowerCase()}; requiere verificación humana.`
          : `Despliegue de cápsulas: ${mission.iscat.deployedCount}/3. Las lecturas se generan al iniciar el monitoreo.`
          : presentation.scene === 'collective' ? receivedAcoustic
            ? 'El centro recibió el indicio. La recomendación se recalculó con información efectivamente entregada.'
            : 'El indicio sigue fuera del centro: todavía no modifica la recomendación central.'
            : 'LUMORA — De información fragmentada a decisiones coordinadas.'

  return <div className="presentation-hud" aria-live="polite">
    <div className="presentation-top">
      <div><span className="presentation-eyebrow">LUMORA / DEMOSTRACIÓN AUTOMÁTICA</span><h3>{titles[presentation.scene]}</h3><small>SIMULACIÓN CONCEPTUAL · ESCENARIO FICTICIO</small></div>
      <div className="presentation-progress"><span>{Math.floor(presentation.progress)}% · {Math.floor(presentation.elapsed)} s</span><div role="progressbar" aria-label="Progreso de la demostración" aria-valuenow={Math.floor(presentation.progress)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${presentation.progress}%` }} /></div></div>
    </div>
    <div className="presentation-bottom">
      <div className="presentation-story">
        <p>{narrative}</p>
        {presentation.scene === 'munin' && <small>{mission.network.reports.filter((report) => report.status === 'Recibido').length} recibidos · {mission.network.reports.filter((report) => report.status !== 'Recibido').length} pendientes · {mission.network.isolatedSectorIds.length} sectores aislados</small>}
        {presentation.scene === 'iscat' && <small>{mission.iscat.monitoringCount}/3 monitoreando · {mission.iscat.indicationCount} posibles indicios · {mission.iscat.receivedAlerts} alertas recibidas</small>}
        {presentation.scene === 'collective' && <div className="presentation-decision"><strong>{receivedAcoustic ? 'RECOMENDACIÓN ACTUALIZADA' : 'INFORMACIÓN PENDIENTE'}</strong><span>Sector Oeste · {receivedAcoustic ? acoustic.observation : 'Indicio local aún no entregado al centro'}</span><span>Urgencia: {west?.urgency ?? 'No evaluable'} · Verificación: {west?.verification ?? 'Relevar'}</span>{receivedAcoustic && <><span>Recurso sugerido: {suggested?.id ?? 'Sin asignación'}. No se ejecuta ningún despacho.</span><small>{recommendation?.before} → {recommendation?.after}. {west?.factors.find((factor) => factor.includes('posible patrón de auxilio'))}</small></>}</div>}
        {presentation.scene === 'closing' && <div className="presentation-summary"><span>{mission.recognizedIds.length}/5 sectores reconocidos</span><span>{mission.collective.receivedCount} reportes recibidos</span><span>{mission.iscat.deployedCount}/3 cápsulas desplegadas</span><span>{mission.collective.sectors.filter((sector) => sector.urgencyPoints !== null).length} recomendaciones con datos recibidos</span></div>}
        {presentation.status === 'blocked' && <div className="presentation-blocked"><AlertTriangle size={15} />{presentation.blockedReason}</div>}
      </div>
      <div className="presentation-actions">
        {presentation.status === 'running' && <button type="button" onClick={onPause}><Pause size={15} /> Pausar</button>}
        {presentation.status === 'paused' && <button type="button" onClick={onResume}><Play size={15} /> Continuar</button>}
        {(presentation.status === 'running' || presentation.status === 'paused') && <button type="button" onClick={onCancel}><X size={15} /> Cancelar</button>}
        {(presentation.status === 'blocked' || presentation.status === 'finished') && <><button type="button" onClick={onRepeat}><RotateCcw size={15} /> Repetir demostración</button><button type="button" onClick={onCancel}><X size={15} /> Explorar simulador</button></>}
      </div>
    </div>
  </div>
}
