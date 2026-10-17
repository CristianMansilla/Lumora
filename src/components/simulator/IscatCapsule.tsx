import { useFrame } from '@react-three/fiber'
import { memo, useRef } from 'react'
import { type Group, type MeshBasicMaterial } from 'three'
import { ISCAT_PLANS, iscatDronePose } from './iscat'
import LabelSprite from './LabelSprite'
import type { MissionStore } from './mission'

function IscatCapsule({ index, store, selected, onSelect }: { index: number; store: MissionStore; selected: boolean; onSelect: (id: string) => void }) {
  const plan = ISCAT_PLANS[index]
  const capsule = useRef<Group>(null)
  const pulse = useRef<Group>(null)
  const led = useRef<Group>(null)
  const ledMaterial = useRef<MeshBasicMaterial>(null)
  const pulseMaterial = useRef<MeshBasicMaterial>(null)
  useFrame(() => {
    const root = capsule.current
    if (!root) return
    const time = store.getClock()
    const { deploymentStartedAt, monitoringStartedAt } = store.getSnapshot().iscat
    const relative = deploymentStartedAt === null ? -1 : time - deploymentStartedAt
    const sortie = index * 8
    const carried = relative >= sortie && relative < sortie + 4
    const deployed = relative >= sortie + 4
    root.visible = carried || deployed
    if (!root.visible) return
    if (carried) {
      const pose = iscatDronePose(time, deploymentStartedAt)
      root.position.set(pose.position[0], pose.position[1] - .65, pose.position[2])
    } else root.position.set(plan.position[0], .37, plan.position[1])
    const report = store.getSnapshot().network.reports.find((item) => item.id === `RPT-${plan.id}`)
    const alert = Boolean(report?.requiresVerification)
    ledMaterial.current?.color.set(alert ? '#ff8f49' : '#79f4e8')
    pulseMaterial.current?.color.set(alert ? '#ff9a54' : '#77e6e5')
    if (pulseMaterial.current) pulseMaterial.current.opacity = alert ? .82 : .42
    if (led.current) led.current.scale.setScalar(alert ? 1 + .18 * Math.sin(time * 8) : 1 + .08 * Math.sin(time * 4))
    if (pulse.current) {
      pulse.current.visible = deployed && monitoringStartedAt !== null
      const cycle = (time * (alert ? 1.5 : .8) + index * .31) % 1
      pulse.current.scale.setScalar(.75 + cycle * (alert ? 1.9 : 1.5))
    }
  })
  return <group ref={capsule} visible={false} onClick={(event) => { event.stopPropagation(); onSelect(plan.id) }}
    onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = '' }}>
    <mesh castShadow><sphereGeometry args={[.32, 16, 12]} /><meshStandardMaterial color="#e7b735" roughness={.44} metalness={.25} /></mesh>
    <mesh scale={[1.025, .43, 1.025]}><sphereGeometry args={[.32, 16, 12]} /><meshStandardMaterial color="#142d36" roughness={.56} metalness={.27} /></mesh>
    <mesh position={[0, -.29, 0]}><cylinderGeometry args={[.19, .25, .12, 12]} /><meshStandardMaterial color="#182d36" roughness={.7} /></mesh>
    <mesh position={[0, .27, 0]}><cylinderGeometry args={[.15, .17, .12, 12]} /><meshStandardMaterial color="#1a323b" metalness={.4} roughness={.4} /></mesh>
    <mesh position={[0, .45, 0]}><cylinderGeometry args={[.023, .035, .27, 8]} /><meshStandardMaterial color="#dee9d9" metalness={.48} /></mesh>
    <mesh position={[0, .6, 0]}><sphereGeometry args={[.055, 8, 6]} /><meshBasicMaterial color="#75e6e6" /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * .245, .07, .09]} rotation={[0, 0, side * .35]}><boxGeometry args={[.14, .19, .22]} /><meshStandardMaterial color="#263e44" metalness={.35} roughness={.42} /></mesh>)}
    <group ref={led} position={[0, .045, -.319]}><mesh><sphereGeometry args={[.082, 10, 8]} /><meshBasicMaterial ref={ledMaterial} color="#79f4e8" /></mesh></group>
    <group ref={pulse} position={[0, -.335, 0]} visible={false}><mesh rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[.42, .025, 5, 24]} /><meshBasicMaterial ref={pulseMaterial} color="#77e6e5" transparent opacity={.42} depthWrite={false} /></mesh></group>
    <LabelSprite text={plan.id} position={[0, 1.05, 0]} accent="#f0c65b" width={1.9} />
    {selected && <mesh position={[0, -.33, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[.5, .04, 6, 24]} /><meshBasicMaterial color="#fff0af" /></mesh>}
  </group>
}

export default memo(IscatCapsule)
