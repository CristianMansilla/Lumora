import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, Suspense } from 'react'
import { OrthographicCamera, Vector3 } from 'three'
import CityScene from './CityScene'
import Drone from './Drone'
import Beacon from './Beacon'
import MeshLinks from './MeshLinks'
import MessengerDrone from './MessengerDrone'
import MobileCommandBase from './MobileCommandBase'
import IscatCapsule from './IscatCapsule'
import IscatDeploymentDrone from './IscatDeploymentDrone'
import { ISCAT_PLANS } from './iscat'
import { MOBILE_BASE_POSITION } from './mobileBaseConfig'
import { DRONE_PLANS, type MissionStore } from './mission'
import { BEACONS, type NetworkSnapshot } from './network'
import type { PresentationStore } from './presentation'
import { mobileBaseFlightAt } from './mobileBaseFlight'
import type { Selection } from './scenario'

export type CameraCommand = { type: 'left' | 'right' | 'zoom-in' | 'zoom-out' | 'base' | 'home'; key: number }

function CameraControls({ resetKey, command, store, presentation, presentationActive }: { resetKey: number; command: CameraCommand; store: MissionStore; presentation: PresentationStore; presentationActive: boolean }) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const { size, invalidate } = useThree()
  const fitZoom = Math.min(30, size.width / 48, size.height / 36)
  const previous = useRef({ initialized: false, resetKey, fitZoom, commandKey: 0 })

  useEffect(() => {
    if (presentationActive) return
    const camera = controls.current?.object
    if (!(camera instanceof OrthographicCamera)) return
    const focusBase = () => {
      const target = new Vector3(...MOBILE_BASE_POSITION)
      target.y = .4
      camera.position.copy(target).add(new Vector3(34, 32, 37))
      camera.zoom = fitZoom * 2.1
      camera.lookAt(target)
      controls.current?.target.copy(target)
      camera.updateProjectionMatrix()
    }
    const resetRequested = previous.current.resetKey !== resetKey
    if (!previous.current.initialized || resetRequested || previous.current.fitZoom !== fitZoom) {
      camera.position.set(34, 32, 37)
      camera.zoom = fitZoom
      camera.near = .1
      camera.far = 180
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
      controls.current?.target.set(0, 0, 0)
      if (!resetRequested && command.type === 'base' && command.key > 0) focusBase()
    } else if (command.key !== previous.current.commandKey) {
      if (command.type === 'base') {
        focusBase()
      } else if (command.type === 'home') {
        camera.position.set(34, 32, 37)
        camera.zoom = fitZoom
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()
        controls.current?.target.set(0, 0, 0)
      } else if (command.type === 'left' || command.type === 'right') {
        const target = controls.current?.target ?? new Vector3()
        camera.position.sub(target).applyAxisAngle(new Vector3(0, 1, 0), command.type === 'left' ? -.3 : .3).add(target)
      } else {
        const factor = command.type === 'zoom-in' ? 1.22 : 1 / 1.22
        camera.zoom = Math.min(fitZoom * 2.45, Math.max(fitZoom * .72, camera.zoom * factor))
        camera.updateProjectionMatrix()
      }
    } else {
      return
    }
    previous.current = { initialized: true, resetKey, fitZoom, commandKey: command.key }
    controls.current?.update()
    invalidate()
  }, [command, fitZoom, resetKey, invalidate, presentationActive])

  return <>
    <OrbitControls ref={controls} makeDefault enabled={!presentationActive} enableDamping dampingFactor={.08} enablePan={false}
      minPolarAngle={.35} maxPolarAngle={1.33} minZoom={fitZoom * .72} maxZoom={fitZoom * 2.45}
      rotateSpeed={.65} zoomSpeed={.8} />
    <PresentationCamera store={store} presentation={presentation} />
  </>
}

function PresentationCamera({ store, presentation }: { store: MissionStore; presentation: PresentationStore }) {
  const { size, invalidate } = useThree()
  const fitZoom = Math.min(30, size.width / 48, size.height / 36)
  const shotTarget = useRef(new Vector3())
  const shotPosition = useRef(new Vector3())
  useFrame((frame, delta) => {
    const playback = presentation.getSnapshot()
    if (playback.status !== 'running') return
    const camera = frame.camera
    if (!(camera instanceof OrthographicCamera)) return
    const orbit = frame.controls as React.ComponentRef<typeof OrbitControls> | null
    const target = shotTarget.current
    let zoom = fitZoom
    if (playback.scene === 'hugin') {
      if (playback.sceneElapsed < 3) {
        target.set(MOBILE_BASE_POSITION[0], .8, MOBILE_BASE_POSITION[2])
        zoom *= 1.55
      } else {
        const drone = mobileBaseFlightAt(0, store.getTime()).position
        target.set(drone.x, Math.min(3.5, drone.y * .35), drone.z)
        zoom *= 1.26
      }
    } else if (playback.scene === 'munin') {
      target.set(-8, .6, 1)
      zoom *= 1.16
    } else if (playback.scene === 'iscat') {
      target.set(-9, .5, 8)
      zoom *= 1.24
    } else if (playback.scene === 'collective') {
      target.set(-11, .5, 1)
      zoom *= 1.27
    } else target.set(0, 0, 0)
    if (size.width < 650) zoom = Math.min(zoom, fitZoom * 1.18)
    shotPosition.current.set(target.x + 34, target.y + 32, target.z + 37)
    const factor = 1 - Math.exp(-Math.min(delta, .1) * 1.45)
    camera.position.lerp(shotPosition.current, factor)
    orbit?.target.lerp(target, factor)
    camera.zoom += (zoom - camera.zoom) * factor
    camera.updateProjectionMatrix()
    orbit?.update()
    invalidate()
  })

  return null
}

function MissionTicker({ store, presentation }: { store: MissionStore; presentation: PresentationStore }) {
  useFrame((_, delta) => { store.advance(delta); presentation.advance(delta) })
  return null
}

export default function SimulatorCanvas({ selectedId, selectedDroneId, selectedNetworkId, selectedIscatId, selectedBase, onSelect, onSelectDrone, onSelectNetwork, onSelectIscat, onSelectBase, recognizedIds, network, store, presentation, presentationActive, resetKey, command }: { selectedId: string; selectedDroneId: string | null; selectedNetworkId: string | null; selectedIscatId: string | null; selectedBase: boolean; onSelect: (item: Selection) => void; onSelectDrone: (id: string) => void; onSelectNetwork: (id: string) => void; onSelectIscat: (id: string) => void; onSelectBase: () => void; recognizedIds: string[]; network: NetworkSnapshot; store: MissionStore; presentation: PresentationStore; presentationActive: boolean; resetKey: number; command: CameraCommand }) {
  return <Canvas className="sim-canvas" orthographic camera={{ position: [34,32,37], zoom: 20, near: .1, far: 180 }}
    shadows="basic" dpr={presentationActive && typeof window !== 'undefined' && window.innerWidth < 650 ? [1,1] : [1,1.6]} gl={{ antialias: true, powerPreference: 'high-performance' }}
    fallback={<div className="sim-webgl-fallback">La visualización 3D requiere un navegador con WebGL.</div>}>
    <Suspense fallback={null}>
      <CityScene selectedId={selectedId} onSelect={onSelect} recognizedIds={recognizedIds} />
      <MobileCommandBase store={store} selected={selectedBase} onSelect={onSelectBase} />
      <IscatDeploymentDrone store={store} />
      {ISCAT_PLANS.map((plan, index) => <IscatCapsule key={plan.id} index={index} store={store} selected={selectedIscatId === plan.id} onSelect={onSelectIscat} />)}
      <MeshLinks network={network} store={store} />
      {BEACONS.map((beacon, index) => <Beacon key={beacon.id} data={beacon} status={network.beacons[index].status} selected={selectedNetworkId === beacon.id} onSelect={onSelectNetwork} />)}
      {DRONE_PLANS.map((plan, index) => <Drone key={plan.id} index={index} store={store} selected={selectedDroneId === plan.id} onSelect={onSelectDrone} />)}
      <MessengerDrone store={store} task={network.messenger} selected={selectedNetworkId === 'messenger'} onSelect={() => onSelectNetwork('messenger')} />
      <MissionTicker store={store} presentation={presentation} />
      <CameraControls resetKey={resetKey} command={command} store={store} presentation={presentation} presentationActive={presentationActive} />
    </Suspense>
  </Canvas>
}
