import { useFrame } from '@react-three/fiber'
import { memo, useRef } from 'react'
import { CatmullRomCurve3, Vector3, type Group } from 'three'
import LabelSprite from './LabelSprite'
import { BEACONS, type MessengerTask } from './network'
import type { MissionStore } from './mission'

const base = new Vector3(3.7,.85,7.6)
const west = new Vector3(BEACONS[4].x,6.7,BEACONS[4].z)
const center = new Vector3(BEACONS[0].x,6.7,BEACONS[0].z)
const curve = (from: Vector3, to: Vector3) => new CatmullRomCurve3([from,from.clone().lerp(to,.35).add(new Vector3(0,1.2,0)),from.clone().lerp(to,.7),to])
const outward = curve(new Vector3(base.x,6.7,base.z),west)
const carrying = curve(west,center)
const home = curve(center,new Vector3(base.x,6.7,base.z))
const ease = (v: number) => { const t = Math.max(0,Math.min(1,v)); return t*t*(3-2*t) }

function messengerPose(task: MessengerTask | null, time: number) {
  if (!task) return { position: base, yaw: 0 }
  const t = time - task.startedAt
  if (t < 1) return { position: base, yaw: 0 }
  if (t < 3) return { position: new Vector3(base.x,base.y + (6.7-base.y)*ease((t-1)/2),base.z), yaw: 0 }
  if (t < 9) return { position: outward.getPoint(ease((t-3)/6)), yaw: -.8 }
  if (t < 11) return { position: west, yaw: -.8 }
  if (t < 18) return { position: carrying.getPoint(ease((t-11)/7)), yaw: 1.5 }
  if (t < 20) return { position: center, yaw: 1.5 }
  if (t < 24) return { position: home.getPoint(ease((t-20)/4)), yaw: .8 }
  return { position: base, yaw: 0 }
}

function MessengerDrone({ store, task, selected, onSelect }: { store: MissionStore; task: MessengerTask | null; selected: boolean; onSelect: () => void }) {
  const body = useRef<Group>(null)
  const left = useRef<Group>(null)
  const right = useRef<Group>(null)
  useFrame(() => {
    const pose = messengerPose(task, store.getTime())
    if (body.current) { body.current.position.copy(pose.position); body.current.rotation.y = pose.yaw }
    if (left.current) left.current.rotation.y = store.getTime()*25
    if (right.current) right.current.rotation.y = -store.getTime()*25
  })
  return <group ref={body} position={base.toArray()} onClick={(event) => { event.stopPropagation(); onSelect() }}
    onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
    onPointerOut={() => { document.body.style.cursor = '' }}>
    <mesh castShadow><boxGeometry args={[.9,.32,1.25]} /><meshStandardMaterial color="#f2ba8d" metalness={.24} roughness={.43} /></mesh>
    <mesh position={[0,-.29,0]}><boxGeometry args={[.68,.29,.78]} /><meshStandardMaterial color="#203d4d" metalness={.4} /></mesh>
    <mesh position={[0,-.48,.43]}><boxGeometry args={[.48,.12,.08]} /><meshBasicMaterial color="#ffab70" /></mesh>
    {[-1,1].map((side) => <group key={side} position={[side*.88,.13,0]}>
      <mesh position={[-side*.43,0,0]}><boxGeometry args={[.9,.1,.14]} /><meshStandardMaterial color="#d9e9e7" metalness={.33} /></mesh>
      <mesh rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.42,.05,8,28]} /><meshStandardMaterial color="#f1a879" metalness={.3} /></mesh>
      <group ref={side < 0 ? left : right} position={[0,.11,0]}><mesh><boxGeometry args={[.72,.025,.08]} /><meshBasicMaterial color="#f9eee1" /></mesh><mesh><boxGeometry args={[.08,.025,.72]} /><meshBasicMaterial color="#f9eee1" /></mesh></group>
      <mesh position={[0,-.17,0]}><sphereGeometry args={[.08,8,6]} /><meshBasicMaterial color={side < 0 ? '#74edef' : '#ff8e69'} /></mesh>
    </group>)}
    {selected && <LabelSprite text="MUNIN-M1" position={[0,1.2,0]} width={2.65} accent="#ffb78a" />}
  </group>
}

export default memo(MessengerDrone)
