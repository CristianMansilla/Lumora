import { useFrame } from '@react-three/fiber'
import { memo, useRef } from 'react'
import { type Group } from 'three'
import { iscatDronePose } from './iscat'
import type { MissionStore } from './mission'

const rotorSites: [number, number][] = [[-.47, -.47], [-.47, .47], [.47, -.47], [.47, .47]]

function IscatDeploymentDrone({ store }: { store: MissionStore }) {
  const root = useRef<Group>(null)
  const propellers = useRef<Group[]>([])
  useFrame(() => {
    const time = store.getClock()
    const pose = iscatDronePose(time, store.getSnapshot().iscat.deploymentStartedAt)
    if (root.current) { root.current.position.set(...pose.position); root.current.rotation.y = pose.yaw }
    propellers.current.forEach((rotor, index) => { if (rotor) rotor.rotation.y = (index % 2 ? -1 : 1) * time * (pose.flying ? 32 : 2) })
  })
  return <group ref={root}>
    <mesh castShadow><sphereGeometry args={[.27, 12, 8]} /><meshStandardMaterial color="#eac34f" metalness={.35} roughness={.4} /></mesh>
    <mesh position={[0, -.08, 0]}><boxGeometry args={[.36, .17, .44]} /><meshStandardMaterial color="#182e39" metalness={.45} /></mesh>
    {rotorSites.map(([x, z], index) => <group key={index} position={[x, .035, z]}>
      <mesh position={[-x * .5, 0, -z * .5]} rotation={[0, Math.atan2(x, z), 0]}><boxGeometry args={[.075, .07, .68]} /><meshStandardMaterial color="#263f46" metalness={.35} /></mesh>
      <mesh position={[0, .035, 0]}><cylinderGeometry args={[.105, .12, .12, 10]} /><meshStandardMaterial color="#151f28" metalness={.4} /></mesh>
      <group ref={(node) => { if (node) propellers.current[index] = node }} position={[0, .11, 0]}>
        <mesh><boxGeometry args={[.62, .022, .065]} /><meshStandardMaterial color="#c8e1df" transparent opacity={.82} /></mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[.62, .022, .065]} /><meshStandardMaterial color="#c8e1df" transparent opacity={.82} /></mesh>
      </group>
      <mesh position={[0, -.045, 0]}><sphereGeometry args={[.052, 8, 6]} /><meshBasicMaterial color={index < 2 ? '#75e9e5' : '#ffac62'} /></mesh>
    </group>)}
    <mesh position={[0, -.25, 0]}><cylinderGeometry args={[.18, .18, .06, 12]} /><meshStandardMaterial color="#354b4e" metalness={.4} /></mesh>
    <mesh position={[0, -.39, 0]}><torusGeometry args={[.2, .025, 5, 16]} /><meshStandardMaterial color="#ecc34d" /></mesh>
  </group>
}

export default memo(IscatDeploymentDrone)
