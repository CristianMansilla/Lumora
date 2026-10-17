import { lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ChevronLeft, ChevronRight, Info, Pause, Play, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import type { CameraCommand } from './simulator/SimulatorCanvas'
import { createMissionStore, DRONE_PLANS, MISSION_DURATION } from './simulator/mission'
import NetworkPanel, { NetworkControls } from './simulator/NetworkPanel'
import IscatPanel, { IscatControls } from './simulator/IscatPanel'
import CollectivePanel from './simulator/CollectivePanel'
import { ISCAT_PLANS } from './simulator/iscat'
import { BEACONS } from './simulator/network'
import { sectors, type Selection } from './simulator/scenario'
import './simulator/Simulator.css'

const SimulatorCanvas = lazy(() => import('./simulator/SimulatorCanvas'))
type DroneSelection = { kind: 'Dron'; id: string; name: string }
type NetworkSelection = { kind: 'Baliza' | 'Mensajero'; id: string; name: string }
type BaseSelection = { kind: 'Base móvil'; id: 'mobile-base'; name: 'Base móvil LUMORA' }
type IscatSelection = { kind: 'ISCAT'; id: string; name: string }

export default function SimulatorSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [store] = useState(createMissionStore)
  const mission = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const [selected, setSelected] = useState<Selection | DroneSelection | NetworkSelection | BaseSelection | IscatSelection>(sectors[4])
  const [resetKey, setResetKey] = useState(0)
  const [mode, setMode] = useState<'operation' | 'collective'>('operation')
  const [command, setCommand] = useState<CameraCommand>({ type: 'left', key: 0 })
  const issue = (type: CameraCommand['type']) => setCommand((current) => ({ type, key: current.key + 1 }))
  const selectDrone = useCallback((id: string) => setSelected({ kind: 'Dron', id, name: id }), [])
  const selectNetwork = useCallback((id: string) => setSelected({ kind: id === 'messenger' ? 'Mensajero' : 'Baliza', id, name: id === 'messenger' ? 'MUNIN-M1' : BEACONS.find((beacon) => beacon.id === id)?.name ?? id }), [])
  const selectIscat = useCallback((id: string) => setSelected({ kind: 'ISCAT', id, name: id }), [])
  const selectBase = useCallback(() => {
    setSelected({ kind: 'Base móvil', id: 'mobile-base', name: 'Base móvil LUMORA' })
    setCommand((current) => ({ type: 'base', key: current.key + 1 }))
  }, [])
  const restart = () => { store.reset(); setSelected(sectors[4]) }

  useEffect(() => {
    const section = sectionRef.current
    if (!section || !('IntersectionObserver' in window)) { setSceneReady(true); return }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSceneReady(true); observer.disconnect() }
    }, { rootMargin: '450px 0px' })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  const selectedDrone = selected.kind === 'Dron' ? DRONE_PLANS.find((plan) => plan.id === selected.id) : undefined
  const selectedBeacon = selected.kind === 'Baliza' ? BEACONS.find((beacon) => beacon.id === selected.id) : undefined
  const selectedIscat = selected.kind === 'ISCAT' ? ISCAT_PLANS.find((plan) => plan.id === selected.id) : undefined
  const iscatState = selectedIscat ? mission.iscat.capsules[ISCAT_PLANS.indexOf(selectedIscat)] : undefined
  const droneIndex = selectedDrone ? DRONE_PLANS.indexOf(selectedDrone) : -1
  const unverified = selected.kind === 'Sector' && !mission.recognizedIds.includes(selected.id)
  const baseStatus = mission.phase === 'idle' ? 'Lista para despliegue' : mission.phase === 'paused' ? 'Despliegue pausado' : mission.elapsed >= MISSION_DURATION ? 'Drones replegados' : 'Desplegando HUGIN'

  return <section className={`simulator-section${mode === 'collective' ? ' collective-mode' : ''}`} id="simulador" ref={sectionRef}>
    <div className="container">
      <div className="sim-heading reveal">
        <div className="section-kicker"><span>05</span><i />SIMULADOR</div>
        <span className="sim-concept-badge"><span /> SIMULACIÓN CONCEPTUAL</span>
      </div>
      <div className="simulator-intro reveal">
        <div><span className="sim-overline">ESCENARIO FICTICIO / CIUDAD 3D</span><h2>Simulación de <em>emergencia.</em></h2><p>Explorá LUMORA: desplegá HUGIN e ISCAT desde la base móvil conceptual y seguí los reportes por la red MUNIN.</p></div>
        <div className="sim-sector-count"><strong>05</strong><span>SECTORES<br />EXPLORABLES</span></div>
      </div>
      <div className="simulator-shell reveal">
        <div className="simulator-main">
          <div className="scene-frame">
            {sceneReady ? <Suspense fallback={<div className="scene-loading">Preparando ciudad 3D…</div>}><SimulatorCanvas selectedId={selected.kind === 'Sector' || selected.kind === 'Edificio' ? selected.id : ''} selectedDroneId={selected.kind === 'Dron' ? selected.id : null} selectedNetworkId={selected.kind === 'Baliza' || selected.kind === 'Mensajero' ? selected.id : null} selectedIscatId={selected.kind === 'ISCAT' ? selected.id : null} selectedBase={selected.kind === 'Base móvil'} onSelect={setSelected} onSelectDrone={selectDrone} onSelectNetwork={selectNetwork} onSelectIscat={selectIscat} onSelectBase={selectBase} recognizedIds={mission.recognizedIds} network={mission.network} store={store} resetKey={resetKey} command={command} /></Suspense> : <div className="scene-loading">Preparando ciudad 3D…</div>}
            <div className="scene-topline" aria-hidden="true"><span>LUMORA / ESCENARIO 01</span><span>VISTA ORBITAL</span></div>
            <div className="scene-bottomline" aria-hidden="true">ARRASTRÁ PARA ROTAR · RUEDA O PELLIZCO PARA ACERCAR</div>
          </div>
          <div className="mission-controls" aria-label="Controles de reconocimiento">
            <div className="mission-control-title"><span>OPERACIÓN HUGIN</span><strong>{mission.phase === 'idle' ? 'En espera' : mission.phase === 'paused' ? 'Simulación pausada' : mission.phase === 'complete' ? 'Misión finalizada' : mission.percent === 100 ? 'HUGIN completo · MUNIN en curso' : 'Reconocimiento en curso'}</strong></div>
            <div className="mission-control-buttons">
              {(mission.phase === 'idle' || mission.phase === 'complete') && <button type="button" className="mission-primary" onClick={store.start}><Play size={16} /> Iniciar reconocimiento</button>}
              {(mission.phase === 'running' || mission.iscat.deploymentStartedAt !== null && !mission.iscat.paused) && <button type="button" onClick={store.pause}><Pause size={16} /> Pausar</button>}
              {(mission.phase === 'paused' || mission.iscat.paused) && <button type="button" className="mission-primary" onClick={store.resume}><Play size={16} /> Continuar</button>}
              <button type="button" onClick={restart}><RotateCcw size={16} /> Reiniciar</button>
            </div>
          </div>
          <NetworkControls network={mission.network} onStart={store.startNetwork} onFail={store.failLink} onRestore={store.restoreLink} />
          <IscatControls iscat={mission.iscat} clock={store.getClock()} onDeploy={store.deployIscat} onMonitor={store.startIscatMonitoring} />
          <div className="sim-controls" aria-label="Controles de cámara">
            <span>CONTROL DE CÁMARA</span>
            <div className="sim-control-buttons">
              <button type="button" onClick={() => issue('left')} aria-label="Rotar a la izquierda" title="Rotar a la izquierda"><ChevronLeft size={20} /></button>
              <button type="button" onClick={() => issue('right')} aria-label="Rotar a la derecha" title="Rotar a la derecha"><ChevronRight size={20} /></button>
              <button type="button" onClick={() => issue('zoom-in')} aria-label="Acercar" title="Acercar"><ZoomIn size={19} /></button>
              <button type="button" onClick={() => issue('zoom-out')} aria-label="Alejar" title="Alejar"><ZoomOut size={19} /></button>
              <button type="button" className="reset-camera" onClick={() => { setResetKey((key) => key + 1); issue('home') }}><RotateCcw size={17} /><span>REINICIAR VISTA</span></button>
            </div>
          </div>
        </div>
        <aside className="simulator-sidebar" aria-label="Estado del escenario">
          <div className="sim-mode-tabs" role="tablist" aria-label="Modo del simulador">
            <button type="button" role="tab" aria-selected={mode === 'operation'} className={mode === 'operation' ? 'active' : ''} onClick={() => setMode('operation')}>Operación</button>
            <button type="button" role="tab" aria-selected={mode === 'collective'} className={mode === 'collective' ? 'active' : ''} onClick={() => setMode('collective')}>Conciencia Colectiva</button>
          </div>
          {mode === 'operation' ? <>
          <div className="sidebar-block mission-status">
            <span className="sidebar-label">RECONOCIMIENTO HUGIN <b>{mission.percent}%</b></span>
            <div className="mission-progress" role="progressbar" aria-valuenow={mission.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de misión"><span style={{ width: `${mission.percent}%` }} /></div>
            <div className="mission-metrics"><div><strong>{mission.activeCount}/3</strong><span>DRONES ACTIVOS</span></div><div><strong>{mission.recognizedIds.length}/5</strong><span>SECTORES RECONOCIDOS</span></div></div>
            <p className="mission-current">Inspección actual: <strong>{mission.currentSector}</strong></p>
          </div>
          <div className="sidebar-block sector-picker">
            <span className="sidebar-label">SECTORES <b>{String(mission.recognizedIds.length).padStart(2, '0')} / 05</b></span>
            <div className="sector-buttons">{sectors.map((sector) => <button type="button" key={sector.id} className={(selected.id === sector.id ? 'active ' : '') + (mission.recognizedIds.includes(sector.id) ? 'recognized' : '')} onClick={() => setSelected(sector)}>{sector.name.replace('Sector ', '')}</button>)}</div>
          </div>
          <div className="sidebar-block drone-picker"><span className="sidebar-label">DESPLIEGUE <b>CONFIGURACIÓN FUTURA</b></span><div className="drone-buttons"><button type="button" className={selected.kind === 'Base móvil' ? 'active' : ''} onClick={selectBase}><span className="drone-dot" style={{ background: '#f4c95c', color: '#f4c95c' }} /><strong>BASE MÓVIL LUMORA</strong><span>{baseStatus}</span></button></div></div>
          <div className="sidebar-block drone-picker"><span className="sidebar-label">FLOTA AÉREA <b>03 UNIDADES</b></span><div className="drone-buttons">{DRONE_PLANS.map((plan, index) => <button type="button" key={plan.id} className={selected.id === plan.id ? 'active' : ''} onClick={() => selectDrone(plan.id)}><span className="drone-dot" style={{ background: plan.color }} /><strong>{plan.id}</strong><span>{mission.droneStatuses[index]}</span></button>)}</div></div>
          <div className="sidebar-block status-block" aria-live="polite">
            <div className="sidebar-label">ELEMENTO SELECCIONADO <span className="selection-kind">{selected.kind.toUpperCase()}</span></div>
            <h3>{selected.name}</h3>
            <div className="status-rows">
              {selectedDrone ? <><div><span>Estado simulado</span><strong>{mission.droneStatuses[droneIndex]}</strong></div><div><span>Unidad</span><strong>Reconocimiento aéreo</strong></div><div><span>Base</span><strong>Base móvil LUMORA</strong></div></> : selectedIscat && iscatState ? <><div><span>Estado</span><strong>{iscatState.status}</strong></div><div><span>Sector</span><strong>{sectors.find((sector) => sector.id === selectedIscat.sectorId)?.name}</strong></div><div><span>Baliza asociada</span><strong>{BEACONS.find((beacon) => beacon.sectorId === selectedIscat.sectorId)?.name}</strong></div><div><span>Reporte</span><strong>{iscatState.report?.status ?? 'Sin generar'}</strong></div><div><span>Verificación</span><strong>{selectedIscat.requiresVerification ? 'Necesaria si aparece indicio' : 'Sin indicio previsto'}</strong></div></> : selectedBeacon ? <><div><span>Estado</span><strong>{mission.network.beacons[BEACONS.indexOf(selectedBeacon)].status}</strong></div><div><span>Sector</span><strong>{sectors.find((sector) => sector.id === selectedBeacon.sectorId)?.name}</strong></div><div><span>Reportes locales</span><strong>{mission.network.reports.filter((report) => report.location === selectedBeacon.id).length}</strong></div></> : selected.kind === 'Mensajero' ? <><div><span>Estado</span><strong>{mission.network.messengerStatus}</strong></div><div><span>Carga digital</span><strong>{mission.network.reports.filter((report) => report.location === 'messenger').length} reportes</strong></div><div><span>Función</span><strong>Almacenar y transportar</strong></div></> : selected.kind === 'Base móvil' ? <><div><span>Estado conceptual</span><strong>{baseStatus}</strong></div><div><span>Capacidad ilustrada</span><strong>Despliegue HUGIN e ISCAT</strong></div><div><span>Unidad</span><strong>Centro móvil de coordinación</strong></div></> : selected.kind === 'Sector' || selected.kind === 'Edificio' ? <><div><span>Estado simulado</span><strong>{unverified ? 'Sin verificar' : selected.status}</strong></div><div><span>Daño estimado</span><strong className={!unverified ? 'damage-' + selected.damage.toLowerCase() : ''}>{!unverified && <i />}{unverified ? 'Pendiente' : selected.damage}</strong></div><div><span>Comunicaciones</span><strong>{unverified ? 'Sin verificar' : selected.communications}</strong></div></> : null}
            </div>
            <div className="status-observation"><span>{selectedDrone || selected.kind === 'Mensajero' ? 'MISIÓN' : 'OBSERVACIONES'}</span><p>{selectedDrone ? selectedDrone.mission : selectedIscat ? iscatState?.report?.observation ?? 'Cápsula sensora conceptual. Su lectura ficticia se genera al iniciar el monitoreo y requiere verificación humana si registra un indicio.' : selectedBeacon ? 'Nodo local de la red mesh conceptual. Sus enlaces y reportes dependen del estado de la misión.' : selected.kind === 'Mensajero' ? 'Recoge datos junto a un nodo aislado, los lleva a un nodo conectado y regresa a base.' : selected.kind === 'Base móvil' ? 'Posible configuración futura para desplegar HUGIN e ISCAT y apoyar la coordinación. El vehículo, sus compuertas y su rampa son una representación conceptual; no se ha fabricado ni validado.' : unverified ? 'El reconocimiento visual simulado aún no llegó a este sector.' : selected.kind === 'Sector' || selected.kind === 'Edificio' ? selected.observations : ''}</p></div>
          </div>
          <div className="sidebar-block mission-log"><span className="sidebar-label">REGISTRO DE EVENTOS <b>{mission.events.length}</b></span><div className="mission-events" role="log" aria-label="Eventos de la misión">{mission.events.length ? [...mission.events].reverse().map((event, index) => <div key={`${event.time}-${index}`}><time>{String(Math.floor(event.time / 60)).padStart(2, '0')}:{String(Math.floor(event.time % 60)).padStart(2, '0')}</time><span>{event.text}</span></div>) : <p>La misión aún no comenzó.</p>}</div></div>
          <IscatPanel iscat={mission.iscat} network={mission.network} selectedId={selected.id} onSelect={selectIscat} />
          <NetworkPanel network={mission.network} selectedId={selected.id} onSelect={selectNetwork} />
          <div className="sidebar-block legend-block">
            <span className="sidebar-label">LEYENDA DEL ESCENARIO</span>
            <div><i className="legend-low" /> Daño bajo</div><div><i className="legend-medium" /> Daño moderado</div><div><i className="legend-high" /> Daño alto / escombros</div><div><i className="legend-flood" /> Zona inundada</div><div><i className="legend-link" /> Enlace disponible</div><div><i className="legend-broken" /> Enlace interrumpido / nodo aislado</div>
          </div>
          <p className="sim-disclaimer"><Info size={16} /> Datos, lecturas, rutas y enlaces predeterminados y ficticios. ISCAT no usa sensores ni micrófonos reales; la conectividad y la respuesta operativa no han sido validadas.</p>
          </> : <CollectivePanel data={mission.collective} clock={mission.clock} selectedId={selected.id} onSelectSector={(sectorId) => { const sector = sectors.find((item) => item.id === sectorId); if (sector) setSelected(sector) }} />}
        </aside>
      </div>
    </div>
  </section>
}
