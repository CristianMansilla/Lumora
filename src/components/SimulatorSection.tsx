import { lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ChevronLeft, ChevronRight, Info, Pause, Play, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import type { CameraCommand } from './simulator/SimulatorCanvas'
import { createMissionStore, DRONE_PLANS } from './simulator/mission'
import { sectors, type Selection } from './simulator/scenario'
import './simulator/Simulator.css'

const SimulatorCanvas = lazy(() => import('./simulator/SimulatorCanvas'))
type DroneSelection = { kind: 'Dron'; id: string; name: string }

export default function SimulatorSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [store] = useState(createMissionStore)
  const mission = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const [selected, setSelected] = useState<Selection | DroneSelection>(sectors[4])
  const [resetKey, setResetKey] = useState(0)
  const [command, setCommand] = useState<CameraCommand>({ type: 'left', key: 0 })
  const issue = (type: CameraCommand['type']) => setCommand((current) => ({ type, key: current.key + 1 }))
  const selectDrone = useCallback((id: string) => setSelected({ kind: 'Dron', id, name: id }), [])
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
  const droneIndex = selectedDrone ? DRONE_PLANS.indexOf(selectedDrone) : -1
  const unverified = selected.kind === 'Sector' && !mission.recognizedIds.includes(selected.id)

  return <section className="simulator-section" id="simulador" ref={sectionRef}>
    <div className="container">
      <div className="sim-heading reveal">
        <div className="section-kicker"><span>05</span><i />SIMULADOR</div>
        <span className="sim-concept-badge"><span /> SIMULACIÓN CONCEPTUAL</span>
      </div>
      <div className="simulator-intro reveal">
        <div><span className="sim-overline">ESCENARIO FICTICIO / CIUDAD 3D</span><h2>Simulación de <em>emergencia.</em></h2><p>Iniciá el reconocimiento HUGIN y observá cómo tres drones actualizan la información simulada de cinco sectores.</p></div>
        <div className="sim-sector-count"><strong>05</strong><span>SECTORES<br />EXPLORABLES</span></div>
      </div>
      <div className="simulator-shell reveal">
        <div className="simulator-main">
          <div className="scene-frame">
            {sceneReady ? <Suspense fallback={<div className="scene-loading">Preparando ciudad 3D…</div>}><SimulatorCanvas selectedId={selected.kind === 'Dron' ? '' : selected.id} selectedDroneId={selected.kind === 'Dron' ? selected.id : null} onSelect={setSelected} onSelectDrone={selectDrone} recognizedIds={mission.recognizedIds} store={store} resetKey={resetKey} command={command} /></Suspense> : <div className="scene-loading">Preparando ciudad 3D…</div>}
            <div className="scene-topline" aria-hidden="true"><span>H&M / ESCENARIO 01</span><span>VISTA ORBITAL</span></div>
            <div className="scene-bottomline" aria-hidden="true">ARRASTRÁ PARA ROTAR · RUEDA O PELLIZCO PARA ACERCAR</div>
          </div>
          <div className="mission-controls" aria-label="Controles de reconocimiento">
            <div className="mission-control-title"><span>OPERACIÓN HUGIN</span><strong>{mission.phase === 'idle' ? 'En espera' : mission.phase === 'running' ? 'Reconocimiento en curso' : mission.phase === 'paused' ? 'Misión pausada' : 'Misión finalizada'}</strong></div>
            <div className="mission-control-buttons">
              {(mission.phase === 'idle' || mission.phase === 'complete') && <button type="button" className="mission-primary" onClick={store.start}><Play size={16} /> Iniciar reconocimiento</button>}
              {mission.phase === 'running' && <button type="button" onClick={store.pause}><Pause size={16} /> Pausar</button>}
              {mission.phase === 'paused' && <button type="button" className="mission-primary" onClick={store.resume}><Play size={16} /> Continuar</button>}
              <button type="button" onClick={restart}><RotateCcw size={16} /> Reiniciar</button>
            </div>
          </div>
          <div className="sim-controls" aria-label="Controles de cámara">
            <span>CONTROL DE CÁMARA</span>
            <div className="sim-control-buttons">
              <button type="button" onClick={() => issue('left')} aria-label="Rotar a la izquierda" title="Rotar a la izquierda"><ChevronLeft size={20} /></button>
              <button type="button" onClick={() => issue('right')} aria-label="Rotar a la derecha" title="Rotar a la derecha"><ChevronRight size={20} /></button>
              <button type="button" onClick={() => issue('zoom-in')} aria-label="Acercar" title="Acercar"><ZoomIn size={19} /></button>
              <button type="button" onClick={() => issue('zoom-out')} aria-label="Alejar" title="Alejar"><ZoomOut size={19} /></button>
              <button type="button" className="reset-camera" onClick={() => setResetKey((key) => key + 1)}><RotateCcw size={17} /><span>REINICIAR VISTA</span></button>
            </div>
          </div>
        </div>
        <aside className="simulator-sidebar" aria-label="Estado del escenario">
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
          <div className="sidebar-block drone-picker"><span className="sidebar-label">FLOTA AÉREA <b>03 UNIDADES</b></span><div className="drone-buttons">{DRONE_PLANS.map((plan, index) => <button type="button" key={plan.id} className={selected.id === plan.id ? 'active' : ''} onClick={() => selectDrone(plan.id)}><span className="drone-dot" style={{ background: plan.color }} /><strong>{plan.id}</strong><span>{mission.droneStatuses[index]}</span></button>)}</div></div>
          <div className="sidebar-block status-block" aria-live="polite">
            <div className="sidebar-label">ELEMENTO SELECCIONADO <span className="selection-kind">{selected.kind.toUpperCase()}</span></div>
            <h3>{selected.name}</h3>
            <div className="status-rows">
              {selectedDrone ? <><div><span>Estado simulado</span><strong>{mission.droneStatuses[droneIndex]}</strong></div><div><span>Unidad</span><strong>Reconocimiento aéreo</strong></div><div><span>Base</span><strong>Centro de operaciones</strong></div></> : <><div><span>Estado simulado</span><strong>{unverified ? 'Sin verificar' : selected.kind !== 'Dron' ? selected.status : ''}</strong></div><div><span>Daño estimado</span><strong className={!unverified && selected.kind !== 'Dron' ? 'damage-' + selected.damage.toLowerCase() : ''}>{!unverified && selected.kind !== 'Dron' && <i />}{unverified ? 'Pendiente' : selected.kind !== 'Dron' ? selected.damage : ''}</strong></div><div><span>Comunicaciones</span><strong>{unverified ? 'Sin verificar' : selected.kind !== 'Dron' ? selected.communications : ''}</strong></div></>}
            </div>
            <div className="status-observation"><span>{selectedDrone ? 'MISIÓN' : 'OBSERVACIONES'}</span><p>{selectedDrone ? selectedDrone.mission : unverified ? 'El reconocimiento visual simulado aún no llegó a este sector.' : selected.kind !== 'Dron' ? selected.observations : ''}</p></div>
          </div>
          <div className="sidebar-block mission-log"><span className="sidebar-label">REGISTRO DE EVENTOS <b>{mission.events.length}</b></span><div className="mission-events" role="log" aria-label="Eventos de la misión">{mission.events.length ? [...mission.events].reverse().map((event, index) => <div key={`${event.time}-${index}`}><time>{String(Math.floor(event.time / 60)).padStart(2, '0')}:{String(Math.floor(event.time % 60)).padStart(2, '0')}</time><span>{event.text}</span></div>) : <p>La misión aún no comenzó.</p>}</div></div>
          <div className="sidebar-block legend-block">
            <span className="sidebar-label">LEYENDA DEL ESCENARIO</span>
            <div><i className="legend-low" /> Daño bajo</div><div><i className="legend-medium" /> Daño moderado</div><div><i className="legend-high" /> Daño alto / escombros</div><div><i className="legend-flood" /> Zona inundada</div>
          </div>
          <p className="sim-disclaimer"><Info size={16} /> Datos, rutas y resultados predeterminados y ficticios. Esta maqueta explora una propuesta conceptual; no representa una respuesta operativa validada.</p>
        </aside>
      </div>
    </div>
  </section>
}
