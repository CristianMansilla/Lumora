import { Link2Off, Play, Radio, RotateCcw } from 'lucide-react'
import { BEACONS, type NetworkSnapshot } from './network'

export function NetworkControls({ network, onStart, onFail, onRestore }: { network: NetworkSnapshot; onStart: () => void; onFail: () => void; onRestore: () => void }) {
  return <div className="network-controls" aria-label="Controles de la red MUNIN">
    <div className="mission-control-title"><span>RED MUNIN</span><strong>{network.started ? network.failed ? 'Enlace Oeste interrumpido' : 'Red descentralizada activa' : 'A la espera de reportes'}</strong></div>
    <div className="mission-control-buttons">
      {!network.started && <button type="button" className="network-primary" disabled={!network.reports.length} onClick={onStart}><Play size={15} /> Iniciar misión de red</button>}
      {!network.failed ? <button type="button" disabled={!network.started} onClick={onFail}><Link2Off size={15} /> Simular caída de enlace</button> : <button type="button" onClick={onRestore}><RotateCcw size={15} /> Restaurar conexión</button>}
    </div>
  </div>
}

export default function NetworkPanel({ network, selectedId, onSelect }: { network: NetworkSnapshot; selectedId: string; onSelect: (id: string) => void }) {
  const stored = network.reports.filter((report) => report.status === 'Almacenado').length
  const transit = network.reports.filter((report) => report.status === 'En tránsito').length
  const received = network.reports.filter((report) => report.status === 'Recibido').length
  return <>
    <div className="sidebar-block network-overview">
      <span className="sidebar-label">RED MUNIN <b><Radio size={13} /> {network.started ? 'ACTIVA' : 'EN ESPERA'}</b></span>
      <div className="network-metrics">
        <div><strong>{network.beacons.filter((beacon) => beacon.status !== 'Inactiva').length}/5</strong><span>BALIZAS ACTIVAS</span></div>
        <div><strong>{network.linksAvailable}/5</strong><span>ENLACES DISPONIBLES</span></div>
        <div><strong>{network.connectedSectorIds.length}</strong><span>SECTORES CONECTADOS</span></div>
        <div><strong className={network.isolatedSectorIds.length ? 'network-alert' : ''}>{network.isolatedSectorIds.length}</strong><span>SECTORES AISLADOS</span></div>
      </div>
      <div className="network-report-counts"><span>Almacenados <strong>{stored}</strong></span><span>En tránsito <strong>{transit}</strong></span><span>Recibidos <strong>{received}</strong></span></div>
    </div>
    <div className="sidebar-block network-beacons">
      <span className="sidebar-label">BALIZAS Y MENSAJERO</span>
      <div className="network-node-list">{BEACONS.map((beacon, index) => <button type="button" key={beacon.id} className={selectedId === beacon.id ? 'active' : ''} onClick={() => onSelect(beacon.id)}><span className={network.beacons[index].status === 'Aislada' ? 'network-node-light isolated' : 'network-node-light'} /><strong>{beacon.name}</strong><span>{network.beacons[index].status}</span></button>)}
        <button type="button" className={selectedId === 'messenger' ? 'active' : ''} onClick={() => onSelect('messenger')}><span className="network-node-light messenger-light" /><strong>MUNIN-M1</strong><span>{network.messengerStatus}</span></button>
      </div>
    </div>
    <div className="sidebar-block network-reports">
      <span className="sidebar-label">REPORTES SIMULADOS <b>{network.reports.length}</b></span>
      {network.reports.length ? <div className="network-report-list">{network.reports.map((report) => <details key={report.id}><summary><strong>{report.id}</strong><span>{report.status}</span></summary><p><b>Origen:</b> {report.origin} · {BEACONS.find((beacon) => beacon.sectorId === report.sectorId)?.name} · {report.sectorId}</p><p><b>Tipo:</b> {report.observationType}</p><p><b>Observación:</b> {report.observation}</p><p><b>Verificación:</b> {report.requiresVerification ? 'Requiere revisión humana' : 'Sin indicio previsto'}</p><p><b>Etiqueta local de origen:</b> {report.priority}</p><p><b>Ubicación:</b> {report.location === 'hub' ? 'Centro de operaciones' : report.location === 'messenger' ? 'MUNIN-M1' : BEACONS.find((beacon) => beacon.id === report.location)?.name}</p><ol>{report.history.map((entry, index) => <li key={index}>{entry}</li>)}</ol></details>)}</div> : <p className="network-empty">HUGIN e ISCAT todavía no generaron reportes.</p>}
    </div>
    <div className="sidebar-block network-log"><span className="sidebar-label">COMUNICACIONES <b>{network.events.length}</b></span><div className="mission-events" role="log" aria-label="Eventos de comunicación">{[...network.events].reverse().map((event, index) => <div key={index}><time>{String(Math.floor(event.time / 60)).padStart(2, '0')}:{String(Math.floor(event.time % 60)).padStart(2, '0')}</time><span>{event.text}</span></div>)}{!network.events.length && <p>Aún no hay transferencias.</p>}</div></div>
  </>
}
