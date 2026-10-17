import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Info, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import type { CameraCommand } from './simulator/SimulatorCanvas'
import { sectors, type Selection } from './simulator/scenario'
import './simulator/Simulator.css'

const SimulatorCanvas = lazy(() => import('./simulator/SimulatorCanvas'))

export default function SimulatorSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [selected, setSelected] = useState<Selection>(sectors[4])
  const [resetKey, setResetKey] = useState(0)
  const [command, setCommand] = useState<CameraCommand>({ type: 'left', key: 0 })
  const issue = (type: CameraCommand['type']) => setCommand((current) => ({ type, key: current.key + 1 }))

  useEffect(() => {
    const section = sectionRef.current
    if (!section || !('IntersectionObserver' in window)) { setSceneReady(true); return }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSceneReady(true); observer.disconnect() }
    }, { rootMargin: '450px 0px' })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return <section className="simulator-section" id="simulador" ref={sectionRef}>
    <div className="container">
      <div className="sim-heading reveal">
        <div className="section-kicker"><span>05</span><i />SIMULADOR</div>
        <span className="sim-concept-badge"><span /> SIMULACIÓN CONCEPTUAL</span>
      </div>
      <div className="simulator-intro reveal">
        <div><span className="sim-overline">ESCENARIO FICTICIO / CIUDAD 3D</span><h2>Simulación de <em>emergencia.</em></h2><p>Explorá una ciudad afectada y seleccioná sectores o edificios para consultar su estado simulado.</p></div>
        <div className="sim-sector-count"><strong>05</strong><span>SECTORES<br />EXPLORABLES</span></div>
      </div>
      <div className="simulator-shell reveal">
        <div className="simulator-main">
          <div className="scene-frame">
            {sceneReady ? <Suspense fallback={<div className="scene-loading">Preparando ciudad 3D…</div>}><SimulatorCanvas selectedId={selected.id} onSelect={setSelected} resetKey={resetKey} command={command} /></Suspense> : <div className="scene-loading">Preparando ciudad 3D…</div>}
            <div className="scene-topline" aria-hidden="true"><span>H&M / ESCENARIO 01</span><span>VISTA ORBITAL</span></div>
            <div className="scene-bottomline" aria-hidden="true">ARRASTRÁ PARA ROTAR · RUEDA O PELLIZCO PARA ACERCAR</div>
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
          <div className="sidebar-block sector-picker">
            <span className="sidebar-label">SECTORES <b>05 / 05</b></span>
            <div className="sector-buttons">{sectors.map((sector) => <button type="button" key={sector.id} className={selected.id === sector.id ? 'active' : ''} onClick={() => setSelected(sector)}>{sector.name.replace('Sector ', '')}</button>)}</div>
          </div>
          <div className="sidebar-block status-block" aria-live="polite">
            <div className="sidebar-label">ELEMENTO SELECCIONADO <span className="selection-kind">{selected.kind.toUpperCase()}</span></div>
            <h3>{selected.name}</h3>
            <div className="status-rows">
              <div><span>Estado simulado</span><strong>{selected.status}</strong></div>
              <div><span>Daño estimado</span><strong className={'damage-' + selected.damage.toLowerCase()}><i />{selected.damage}</strong></div>
              <div><span>Comunicaciones</span><strong>{selected.communications}</strong></div>
            </div>
            <div className="status-observation"><span>OBSERVACIONES</span><p>{selected.observations}</p></div>
          </div>
          <div className="sidebar-block legend-block">
            <span className="sidebar-label">LEYENDA DEL ESCENARIO</span>
            <div><i className="legend-low" /> Daño bajo</div><div><i className="legend-medium" /> Daño moderado</div><div><i className="legend-high" /> Daño alto / escombros</div><div><i className="legend-flood" /> Zona inundada</div>
          </div>
          <p className="sim-disclaimer"><Info size={16} /> Datos y situación ficticios. Esta maqueta explora una propuesta conceptual; no representa una respuesta operativa validada.</p>
        </aside>
      </div>
    </div>
  </section>
}
