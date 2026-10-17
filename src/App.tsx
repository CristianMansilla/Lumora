import { useEffect, useState } from 'react'
import { Activity, ArrowRight, ArrowUpRight, Boxes, ChevronDown, CircleAlert, Cpu, Crosshair, Eye, Layers3, Map, Menu, Network, Radio, Radar, Satellite, ScanSearch, Shield, SignalZero, Waypoints, X } from 'lucide-react'
import SimulatorSection from './components/SimulatorSection'
import './App.css'

const nav = [['Inicio', '#inicio'], ['Problema', '#problema'], ['Solución', '#solucion'], ['Tecnología', '#tecnologia'], ['Simulador', '#simulador'], ['Impacto', '#impacto']]
const problems = [
  { icon: SignalZero, title: 'Comunicaciones interrumpidas', text: 'La caída de redes convencionales dificulta conectar equipos de respuesta, autoridades y comunidades.' },
  { icon: ScanSearch, title: 'Zonas sin información', text: 'Los reportes llegan incompletos o tarde. Algunas áreas permanecen fuera del panorama operativo.' },
  { icon: CircleAlert, title: 'Recursos limitados', text: 'Con necesidades simultáneas, decidir dónde actuar primero exige una visión compartida y actualizada.' },
]
const modules = [
  { name: 'HUGIN', type: 'RECONOCIMIENTO', icon: Eye, text: 'Drones aéreos exploran zonas afectadas, registran daños y generan insumos para mapas visuales.' },
  { name: 'MUNIN', type: 'COMUNICACIÓN', icon: Waypoints, text: 'Nodos temporales y drones mensajeros trasladan información entre sectores desconectados.' },
  { name: 'ISCAT', type: 'DETECCIÓN', icon: Radar, text: 'Cápsulas desplegables con sensores identifican posibles señales de auxilio para su verificación.' },
  { name: 'CONCIENCIA COLECTIVA', type: 'DECISIÓN', icon: Layers3, text: 'Integra reportes, señala incertidumbre y propone prioridades para quienes coordinan la emergencia.' },
]
const steps = [
  { title: 'Catástrofe', text: 'La infraestructura crítica se ve afectada.', icon: Activity },
  { title: 'Reconocimiento', text: 'HUGIN observa y documenta el territorio.', icon: Eye },
  { title: 'Comunicaciones', text: 'MUNIN enlaza sectores desconectados.', icon: Radio },
  { title: 'Sensores', text: 'ISCAT detecta indicios para verificar.', icon: Radar },
  { title: 'Análisis', text: 'Los datos se reúnen con su incertidumbre.', icon: Cpu },
  { title: 'Coordinación', text: 'Responsables humanos priorizan la respuesta.', icon: Crosshair },
]
const technologies = [
  { icon: Satellite, label: 'Drones aéreos' }, { icon: Network, label: 'Comunicaciones resilientes' },
  { icon: Boxes, label: 'Nodos IoT' }, { icon: Radar, label: 'Sensores ambientales' },
  { icon: Map, label: 'Reconstrucción visual' }, { icon: Cpu, label: 'Análisis de datos' },
]

function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return <header className={'site-header' + (scrolled ? ' scrolled' : '')}>
    <div className="container header-inner">
      <a href="#inicio" className="brand" aria-label="HUGIN y MUNIN, ir al inicio" onClick={() => setOpen(false)}><img className="brand-mark" src="/favicon.png" alt="" width="32" height="32" />HUGIN <em>&</em> MUNIN</a>
      <nav className={'nav' + (open ? ' nav-open' : '')} aria-label="Navegación principal">{nav.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}</nav>
      <span className="header-index">RLI / 2026</span>
      <button className="menu-toggle" type="button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={23} /> : <Menu size={23} />}</button>
    </div>
  </header>
}

function OperationsMap() {
  return <div className="operations-map" role="img" aria-label="Mapa conceptual de drones, sensores y enlaces de comunicación">
    <div className="map-grid" />
    <svg className="map-terrain" viewBox="0 0 700 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M-60 142 120 90 220 132 340 43 483 68 602-18 750 50M-60 206 110 178 206 222 335 144 482 153 582 100 756 154M-28 342 114 268 242 305 316 254 470 294 544 215 739 242M-28 462 126 391 200 422 314 352 459 408 567 347 745 396M-27 565 100 518 258 552 366 472 490 511 628 448 741 493" />
      <path d="M87-40 141 107 113 265 173 420 132 672M239-30 225 135 263 314 236 477 298 678M397-22 349 155 404 292 360 471 419 676M563-34 524 155 560 312 534 506 588 678" />
      <path className="map-river" d="M707 110C580 156 643 262 507 318S435 462 299 475 187 539 14 625" />
      <path className="map-route" d="M130 432 290 332 454 224 568 294" />
      <path className="map-route dashed" d="M290 332 382 472 537 466" />
      <circle className="map-range" cx="290" cy="332" r="102" /><circle className="map-range" cx="290" cy="332" r="164" /><circle className="map-range" cx="454" cy="224" r="76" />
    </svg>
    <span className="map-coordinate top-left">SECTOR 09<br />MAPA / CONCEPTUAL</span><span className="map-coordinate top-right">CAPA ACTIVA<br />RED HÍBRIDA</span>
    <span className="map-coordinate bottom-left">ESCANEO TERRITORIAL <b className="blink">●</b></span><span className="map-coordinate bottom-right">01 / 04</span>
    <span className="map-node node-a"><i /><span>HUGIN <small>RECONOCIMIENTO</small></span></span>
    <span className="map-node node-b"><i /><span>MUNIN <small>ENLACE TEMPORAL</small></span></span>
    <span className="map-node node-c warning"><i /><span>ISCAT <small>SEÑAL POR VERIFICAR</small></span></span>
    <span className="map-node node-d"><i /></span><span className="map-cross cross-one">+</span><span className="map-cross cross-two">+</span><div className="map-scanline" />
  </div>
}

function SectionHeading({ number, eyebrow, title, children }: { number: string; eyebrow: string; title: string; children?: React.ReactNode }) {
  return <div className="section-heading reveal"><div className="section-kicker"><span>{number}</span><i />{eyebrow}</div><h2>{title}</h2>{children && <p>{children}</p>}</div>
}

function App() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('.reveal')
    if (!('IntersectionObserver' in window)) { targets.forEach((item) => item.classList.add('visible')); return }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target) } }), { threshold: 0.12, rootMargin: '0px 0px -35px 0px' })
    targets.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  return <>
    <Header />
    <main>
      <section id="inicio" className="hero-section">
        <div className="hero-ambient" />
        <div className="container hero-layout">
          <div className="hero-copy">
            <div className="eyebrow hero-eyebrow"><i /> RALLY LATINOAMERICANO DE INNOVACIÓN 2026 <b>/</b> DESAFÍO 09</div>
            <h1>Cuando todo se<br /><span>desconecta,</span><br />la inteligencia<br /><em>se conecta.</em></h1>
            <p className="hero-description">Una red híbrida de drones, balizas y sensores para recuperar información, reconectar sectores aislados y apoyar decisiones en la post-emergencia.</p>
            <div className="hero-actions"><a className="button button-primary" href="#simulador">Explorar simulación <ArrowUpRight size={18} /></a><a className="button button-ghost" href="#problema">Conocer el proyecto <ArrowRight size={18} /></a></div>
            <a className="scroll-cue" href="#problema">DESPLAZAR PARA EXPLORAR <ChevronDown size={17} /></a>
          </div>
          <div className="hero-visual"><div className="visual-topbar"><span><i /> RED DE RESPUESTA / VISIÓN CONCEPTUAL</span><span>H&M—09</span></div><OperationsMap /><div className="visual-footer"><span>CAPA 01 <strong>RECONOCIMIENTO</strong></span><span>CAPA 02 <strong>COMUNICACIÓN</strong></span><span>CAPA 03 <strong>DETECCIÓN</strong></span></div></div>
        </div>
        <div className="container hero-bottom"><span>RED DESCENTRALIZADA <b>+</b> INFORMACIÓN COMPARTIDA <b>+</b> DECISIÓN HUMANA</span><span>01 — 06</span></div>
      </section>

      <section className="section problem-section" id="problema"><div className="container">
        <div className="problem-intro"><SectionHeading number="01" eyebrow="EL DESAFÍO" title="Una emergencia no espera a que vuelva la señal.">Cuando las comunicaciones colapsan, la información se fragmenta justo cuando más se necesita una visión común de lo que sucede.</SectionHeading><div className="problem-aside reveal"><SignalZero size={29} strokeWidth={1.3} /><span>FALLA DE RED<br />≠<br />FALTA DE NECESIDAD</span></div></div>
        <div className="problem-grid">{problems.map((problem, index) => <article className="problem-card reveal" key={problem.title}><div className="problem-card-top"><span>0{index + 1} / PROBLEMA</span><problem.icon size={27} strokeWidth={1.4} /></div><h3>{problem.title}</h3><p>{problem.text}</p><ArrowUpRight className="card-corner" size={20} /></article>)}</div>
      </div></section>

      <section className="section solution-section" id="solucion"><div className="container">
        <SectionHeading number="02" eyebrow="LA SOLUCIÓN" title="Cuatro capacidades. Una lectura compartida.">HUGIN & MUNIN conecta observación, comunicación y señales de auxilio en una arquitectura conceptual para apoyar la coordinación.</SectionHeading>
        <div className="solution-layout"><div className="system-diagram reveal" aria-label="Arquitectura conceptual de cuatro componentes conectados"><div className="diagram-rings" /><div className="diagram-lines" /><span className="diagram-satellite sat-one"><Eye size={19} /></span><span className="diagram-satellite sat-two"><Waypoints size={19} /></span><span className="diagram-satellite sat-three"><Radar size={19} /></span><span className="diagram-satellite sat-four"><Layers3 size={19} /></span><div className="diagram-core"><span className="core-mark">✦</span><strong>HUGIN<br /><em>&</em> MUNIN</strong><small>RED HÍBRIDA</small></div><span className="diagram-caption">ARQUITECTURA / CONCEPTUAL</span></div>
          <div className="components-list">{modules.map((item, index) => <article className="component-row reveal" key={item.name}><span className="component-index">0{index + 1}</span><span className="component-icon"><item.icon size={23} strokeWidth={1.5} /></span><div className="component-copy"><span>{item.type}</span><h3>{item.name}</h3><p>{item.text}</p></div><ArrowUpRight className="component-arrow" size={18} /></article>)}</div></div>
      </div></section>

      <section className="section process-section" id="funcionamiento"><div className="container"><div className="process-header"><SectionHeading number="03" eyebrow="CÓMO FUNCIONA" title="Del territorio a la decisión." /><p className="reveal">Una secuencia de respuesta propuesta. Cada etapa alimenta la siguiente; la priorización final permanece en manos de los equipos responsables.</p></div><div className="timeline">{steps.map((step, index) => <article className="timeline-step reveal" key={step.title}><div className="timeline-marker"><span>{String(index + 1).padStart(2, '0')}</span><step.icon size={23} strokeWidth={1.5} /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></div></section>

      <section className="section technology-section" id="tecnologia"><div className="container tech-layout"><div className="tech-copy"><SectionHeading number="04" eyebrow="TECNOLOGÍA" title="Diseñada para pensar en escenarios sin infraestructura.">La propuesta combina herramientas de exploración, transmisión y análisis para construir una imagen operativa más completa.</SectionHeading><div className="concept-note reveal"><Shield size={23} /><p><strong>Estado del proyecto</strong><br />HUGIN & MUNIN es una propuesta conceptual. Sus componentes y resultados aún no fueron desarrollados ni validados en campo.</p></div></div><div className="tech-list reveal">{technologies.map((item, index) => <div className="tech-item" key={item.label}><span>{String(index + 1).padStart(2, '0')}</span><item.icon size={25} strokeWidth={1.45} /><strong>{item.label}</strong><ArrowUpRight size={17} /></div>)}</div></div></section>

      <SimulatorSection />

      <section className="section impact-section" id="impacto"><div className="container"><SectionHeading number="06" eyebrow="IMPACTO POTENCIAL" title="Más claridad para actuar cuando cada decisión cuenta.">La intención es ofrecer continuidad de información y un mejor panorama para coordinar esfuerzos en la post-emergencia.</SectionHeading><div className="impact-grid"><div className="impact-lead reveal"><span className="impact-orbit"><i /></span><strong>INFORMACIÓN<br />QUE ENCUENTRA<br />SU CAMINO.</strong><small>HUGIN & MUNIN / VISIÓN</small></div><div className="impact-points">{[{ title: 'Coordinar rescates', text: 'Reunir indicios y reportes para que los equipos evalúen dónde concentrar su atención.' }, { title: 'Sostener el flujo de información', text: 'Explorar vías temporales para trasladar datos entre sectores sin conectividad.' }, { title: 'Acompañar comunidades aisladas', text: 'Dar visibilidad a necesidades que podrían quedar fuera de los canales habituales.' }].map((item, index) => <article className="impact-point reveal" key={item.title}><span>0{index + 1}</span><div><h3>{item.title}</h3><p>{item.text}</p></div><ArrowUpRight size={19} /></article>)}</div></div></div></section>
    </main>
    <footer className="footer"><div className="container footer-main"><div><img className="footer-logo" src="/logo-hugin-munin.png" alt="HUGIN & MUNIN" width="260" height="116" loading="lazy" /><p>Inteligencia conectada para la post-emergencia.</p><p className="footer-team">Desarrollado por <strong>INGESIST</strong></p></div><a href="#inicio" className="back-top">VOLVER ARRIBA <ArrowUpRight size={18} /></a></div><div className="container footer-bottom"><span>PROPUESTA PARA EL RALLY LATINOAMERICANO DE INNOVACIÓN 2026</span><span>DESAFÍO 09 · OPTIMIZACIÓN Y PRIORIZACIÓN DE RECURSOS Y ESFUERZOS EN LA POST-EMERGENCIA</span></div></footer>
  </>
}

export default App
