import { useFrame } from '@react-three/fiber'
import { memo, useRef } from 'react'
import type { Group } from 'three'
import LabelSprite from './LabelSprite'
import { MISSION_DURATION, type MissionStore } from './mission'
import { HATCH_OPEN_DURATION, MOBILE_BASE_PAD_X, MOBILE_BASE_PAD_Z, MOBILE_BASE_POSITION } from './mobileBaseConfig'

const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

function MobileCommandBase({ store, selected, onSelect }: {
  store: MissionStore
  selected: boolean
  onSelect: () => void
}) {
  const leftHatch = useRef<Group>(null)
  const rightHatch = useRef<Group>(null)
  const ramp = useRef<Group>(null)
  const completedCloseTime = useRef(0)

  useFrame((_, delta) => {
    const time = store.getTime()
    const phase = store.getSnapshot().phase
    if (time < MISSION_DURATION) completedCloseTime.current = 0
    else if (phase === 'complete') completedCloseTime.current += Math.min(delta, .1)
    const opening = phase === 'idle' ? 0 : ease(time / HATCH_OPEN_DURATION)
    const closing = ease((Math.max(0, time - MISSION_DURATION) + completedCloseTime.current) / 1.3)
    const deployed = opening * (1 - closing)
    if (leftHatch.current) leftHatch.current.rotation.z = deployed * 1.08
    if (rightHatch.current) rightHatch.current.rotation.z = -deployed * 1.08
    if (ramp.current) ramp.current.rotation.z = 1.35 - deployed * 1.55
  })

  return <group position={MOBILE_BASE_POSITION} onClick={(event) => { event.stopPropagation(); onSelect() }}
    onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
    onPointerOut={() => { document.body.style.cursor = '' }}>
    <mesh position={[0, .055, .52]} scale={[1, 1, .45]} receiveShadow>
      <cylinderGeometry args={[1.72, 1.82, .11, 20]} />
      <meshStandardMaterial color="#304b50" roughness={.92} />
    </mesh>
    {[-1, 1].map((side) => <group key={side} position={[side * 1.48, .2, .56]}>
      <mesh castShadow><boxGeometry args={[.5, .38, 1.23]} /><meshStandardMaterial color="#172b35" roughness={.9} /></mesh>
      {[-.43, .43].map((z) => <mesh key={z} position={[side * .27, -.015, z]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[.22, .22, .12, 12]} /><meshStandardMaterial color="#445b60" metalness={.2} roughness={.75} />
      </mesh>)}
      {[-.42, -.14, .14, .42].map((z) => <mesh key={'tread' + z} position={[side * .3, -.17, z]}>
        <boxGeometry args={[.12, .065, .13]} /><meshStandardMaterial color="#718083" roughness={.85} />
      </mesh>)}
    </group>)}
    <mesh position={[0, .29, .12]} scale={[1.14, 1, .64]} castShadow>
      <cylinderGeometry args={[1.88, 1.8, .28, 28]} /><meshStandardMaterial color="#d7a522" metalness={.28} roughness={.52} />
    </mesh>
    <mesh position={[0, .44, MOBILE_BASE_PAD_Z]} scale={[1.2, 1, .55]} receiveShadow>
      <cylinderGeometry args={[1.94, 1.94, .06, 28]} /><meshStandardMaterial color="#f1c749" metalness={.22} roughness={.5} />
    </mesh>
    <mesh position={[0, .48, MOBILE_BASE_PAD_Z]} rotation={[Math.PI / 2, 0, 0]} scale={[1.2, .55, 1]}>
      <torusGeometry args={[1.94, .045, 6, 40]} /><meshStandardMaterial color="#314c55" metalness={.35} roughness={.48} />
    </mesh>
    <group position={[0, .73, .94]}>
      <mesh castShadow><boxGeometry args={[.8, .42, .58]} /><meshStandardMaterial color="#e4af2f" metalness={.25} roughness={.5} /></mesh>
      <mesh position={[0, .055, -.3]}><boxGeometry args={[.62, .22, .025]} /><meshStandardMaterial color="#174b62" metalness={.3} roughness={.25} /></mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[side * .41, .045, 0]}><boxGeometry args={[.025, .19, .32]} /><meshStandardMaterial color="#24586a" metalness={.3} roughness={.3} /></mesh>)}
      <mesh position={[0, .23, 0]} castShadow><boxGeometry args={[.94, .055, .7]} /><meshStandardMaterial color="#f3cc55" metalness={.24} roughness={.48} /></mesh>
    </group>
    {MOBILE_BASE_PAD_X.map((x) => <group key={x} position={[x, .485, MOBILE_BASE_PAD_Z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.48, .035, 5, 24]} /><meshBasicMaterial color="#eaf8ec" /></mesh>
      <mesh position={[0, -.005, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.34, 20]} /><meshBasicMaterial color="#274b55" transparent opacity={.7} /></mesh>
    </group>)}
    {[-1, 1].map((side) => <group key={'door' + side} ref={side < 0 ? leftHatch : rightHatch} position={[side * 1.02, .51, .76]}>
      <mesh position={[-side * .48, 0, 0]} castShadow>
        <boxGeometry args={[.96, .075, .42]} /><meshStandardMaterial color="#f4cd5a" metalness={.3} roughness={.46} side={2} />
      </mesh>
      <mesh position={[-side * .48, .045, 0]}>
        <boxGeometry args={[.68, .012, .2]} /><meshStandardMaterial color="#24444f" metalness={.36} />
      </mesh>
      <mesh position={[0, 0, 0]}><cylinderGeometry args={[.055, .055, .49, 8]} /><meshStandardMaterial color="#354d54" /></mesh>
    </group>)}
    <group ref={ramp} position={[1.48, .44, .44]} rotation={[0, 0, 1.35]}>
      <mesh position={[.36, 0, 0]} castShadow><boxGeometry args={[.72, .065, .72]} /><meshStandardMaterial color="#e9b73b" metalness={.26} roughness={.55} side={2} /></mesh>
      {[.1, .29, .48, .65].map((x) => <mesh key={x} position={[x, .04, 0]}><boxGeometry args={[.045, .015, .62]} /><meshStandardMaterial color="#485c60" /></mesh>)}
    </group>
    <mesh position={[-1.27, .92, .55]}><cylinderGeometry args={[.035, .05, .78, 8]} /><meshStandardMaterial color="#eaf4e8" metalness={.45} /></mesh>
    <mesh position={[-1.27, 1.34, .55]}><sphereGeometry args={[.095, 10, 8]} /><meshBasicMaterial color="#66e8ee" /></mesh>
    <mesh position={[1.22, .71, 1.02]}><cylinderGeometry args={[.035, .05, .41, 8]} /><meshStandardMaterial color="#eaf4e8" metalness={.45} /></mesh>
    <mesh position={[1.22, .95, 1.02]}><sphereGeometry args={[.08, 10, 8]} /><meshBasicMaterial color="#ff9b5f" /></mesh>
    {[-1, 1].map((side) => <mesh key={'light' + side} position={[side * 1.15, .33, -1.01]}>
      <boxGeometry args={[.27, .11, .045]} /><meshBasicMaterial color={side < 0 ? '#8af6ed' : '#fff7d5'} />
    </mesh>)}
    <LabelSprite text="LUMORA · BASE MÓVIL" position={[0, 1.85, 1.06]} accent="#ffd462" width={3.2} />
    {selected && <mesh position={[0, .095, .03]} rotation={[Math.PI / 2, 0, 0]} scale={[1.15, .62, 1]}>
      <torusGeometry args={[2.08, .045, 6, 36]} /><meshBasicMaterial color="#ff9b68" />
    </mesh>}
  </group>
}

export default memo(MobileCommandBase)
