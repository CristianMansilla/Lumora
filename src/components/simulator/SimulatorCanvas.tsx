import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, Suspense } from 'react'
import { OrthographicCamera, Vector3 } from 'three'
import CityScene from './CityScene'
import Drone from './Drone'
import { DRONE_PLANS, type MissionStore } from './mission'
import type { Selection } from './scenario'

export type CameraCommand = { type: 'left' | 'right' | 'zoom-in' | 'zoom-out'; key: number }

function CameraControls({ resetKey, command }: { resetKey: number; command: CameraCommand }) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const { size, invalidate } = useThree()
  const fitZoom = Math.min(30, size.width / 48, size.height / 36)
  const previous = useRef({ initialized: false, resetKey, fitZoom, commandKey: 0 })

  useEffect(() => {
    const camera = controls.current?.object
    if (!(camera instanceof OrthographicCamera)) return
    if (!previous.current.initialized || previous.current.resetKey !== resetKey || previous.current.fitZoom !== fitZoom) {
      camera.position.set(34, 32, 37)
      camera.zoom = fitZoom
      camera.near = .1
      camera.far = 180
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
      controls.current?.target.set(0, 0, 0)
    } else if (command.key !== previous.current.commandKey) {
      if (command.type === 'left' || command.type === 'right') {
        camera.position.applyAxisAngle(new Vector3(0, 1, 0), command.type === 'left' ? -.3 : .3)
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
  }, [command, fitZoom, resetKey, invalidate])

  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.08} enablePan={false}
    minPolarAngle={.35} maxPolarAngle={1.33} minZoom={fitZoom * .72} maxZoom={fitZoom * 2.45}
    rotateSpeed={.65} zoomSpeed={.8} />
}

function MissionTicker({ store }: { store: MissionStore }) {
  useFrame((_, delta) => store.advance(delta))
  return null
}

export default function SimulatorCanvas({ selectedId, selectedDroneId, onSelect, onSelectDrone, recognizedIds, store, resetKey, command }: { selectedId: string; selectedDroneId: string | null; onSelect: (item: Selection) => void; onSelectDrone: (id: string) => void; recognizedIds: string[]; store: MissionStore; resetKey: number; command: CameraCommand }) {
  return <Canvas className="sim-canvas" orthographic camera={{ position: [34,32,37], zoom: 20, near: .1, far: 180 }}
    shadows="basic" dpr={[1,1.6]} gl={{ antialias: true, powerPreference: 'high-performance' }}
    fallback={<div className="sim-webgl-fallback">La visualización 3D requiere un navegador con WebGL.</div>}>
    <Suspense fallback={null}>
      <CityScene selectedId={selectedId} onSelect={onSelect} recognizedIds={recognizedIds} />
      {DRONE_PLANS.map((plan, index) => <Drone key={plan.id} index={index} store={store} selected={selectedDroneId === plan.id} onSelect={onSelectDrone} />)}
      <MissionTicker store={store} />
      <CameraControls resetKey={resetKey} command={command} />
    </Suspense>
  </Canvas>
}
