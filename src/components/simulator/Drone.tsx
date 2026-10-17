import { useFrame } from '@react-three/fiber'
import { memo, useRef } from 'react'
import { DoubleSide, type Group, type Mesh, type MeshBasicMaterial } from 'three'
import LabelSprite from './LabelSprite'
import { DRONE_PLANS, flightAt, type MissionStore } from './mission'

type Props = {
  index: number
  store: MissionStore
  selected: boolean
  onSelect: (id: string) => void
}

function Drone({ index, store, selected, onSelect }: Props) {
  const plan = DRONE_PLANS[index]
  const drone = useRef<Group>(null)
  const rotorA = useRef<Group>(null)
  const rotorB = useRef<Group>(null)
  const rotorC = useRef<Group>(null)
  const rotorD = useRef<Group>(null)
  const scan = useRef<Group>(null)
  const pulseA = useRef<Mesh>(null)
  const pulseB = useRef<Mesh>(null)
  const pulseMatA = useRef<MeshBasicMaterial>(null)
  const pulseMatB = useRef<MeshBasicMaterial>(null)

  useFrame(() => {
    const time = store.getTime()
    const pose = flightAt(index, time)
    if (drone.current) {
      drone.current.position.copy(pose.position)
      drone.current.rotation.y = pose.yaw
      drone.current.rotation.z = pose.status === 'En ruta' || pose.status === 'Regresando' ? .045 * Math.sin(time * 1.8 + index) : 0
    }
    ;[rotorA, rotorB, rotorC, rotorD].forEach((rotor, rotorIndex) => {
      if (rotor.current) rotor.current.rotation.y = time * 21 * (rotorIndex % 2 ? -1 : 1)
    })
    const scanning = Boolean(pose.scanningSectorId)
    if (scan.current) scan.current.visible = scanning
    if (scanning) {
      const phases = [(time * 1.1) % 1, (time * 1.1 + .5) % 1]
      ;[pulseA, pulseB].forEach((pulse, pulseIndex) => {
        if (!pulse.current) return
        pulse.current.position.y = -pose.position.y + .24
        pulse.current.scale.setScalar(.7 + phases[pulseIndex] * 2.2)
      })
      if (pulseMatA.current) pulseMatA.current.opacity = (1 - phases[0]) * .65
      if (pulseMatB.current) pulseMatB.current.opacity = (1 - phases[1]) * .65
    }
  })

  const rotors = [
    { x: -.72, z: -.72, ref: rotorA }, { x: .72, z: -.72, ref: rotorB },
    { x: -.72, z: .72, ref: rotorC }, { x: .72, z: .72, ref: rotorD },
  ]
  return <group ref={drone} position={[plan.launch[0], .92, plan.launch[1]]}
    onClick={(event) => { event.stopPropagation(); onSelect(plan.id) }}
    onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
    onPointerOut={() => { document.body.style.cursor = '' }}>
    <mesh castShadow scale={[1.25,.52,1]}>
      <sphereGeometry args={[.43,16,10]} /><meshStandardMaterial color="#d9f0ef" roughness={.45} metalness={.28} />
    </mesh>
    <mesh position={[0,.19,0]} castShadow>
      <boxGeometry args={[.57,.1,.68]} /><meshStandardMaterial color="#1a4656" metalness={.5} roughness={.36} />
    </mesh>
    <mesh position={[0,-.2,0]} castShadow>
      <sphereGeometry args={[.31,12,8]} /><meshStandardMaterial color="#224858" metalness={.35} />
    </mesh>
    {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sz], arm) => <mesh key={arm} position={[sx*.38,0,sz*.38]} rotation={[0,-sx*sz*Math.PI/4,0]} castShadow>
      <boxGeometry args={[.98,.13,.15]} /><meshStandardMaterial color={arm % 2 ? '#77aab3' : '#a9d5d5'} metalness={.36} roughness={.43} />
    </mesh>)}
    {rotors.map((rotor, rotorIndex) => <group key={rotorIndex} position={[rotor.x,.045,rotor.z]}>
      <mesh rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.32,.035,7,24]} /><meshStandardMaterial color="#c5e4e3" metalness={.35} /></mesh>
      <mesh><cylinderGeometry args={[.105,.11,.13,10]} /><meshStandardMaterial color="#244b59" metalness={.5} /></mesh>
      <group ref={rotor.ref} position={[0,.12,0]}>
        <mesh><boxGeometry args={[.55,.025,.07]} /><meshStandardMaterial color="#e8f4ef" roughness={.25} /></mesh>
        <mesh><boxGeometry args={[.07,.025,.55]} /><meshStandardMaterial color="#e8f4ef" roughness={.25} /></mesh>
      </group>
      <mesh position={[0,-.09,0]}><sphereGeometry args={[.065,8,6]} /><meshBasicMaterial color={rotorIndex < 2 ? plan.color : '#ff9364'} /></mesh>
    </group>)}
    <group position={[0,-.29,.34]}>
      <mesh><sphereGeometry args={[.18,12,8]} /><meshStandardMaterial color="#193947" metalness={.45} /></mesh>
      <mesh position={[0,0,.16]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.095,.12,.09,12]} /><meshStandardMaterial color="#101f2b" metalness={.42} /></mesh>
      <mesh position={[0,0,.215]}><circleGeometry args={[.064,12]} /><meshBasicMaterial color="#77e6eb" /></mesh>
    </group>
    <mesh position={[0,.37,0]}><sphereGeometry args={[.065,8,6]} /><meshBasicMaterial color={plan.color} /></mesh>
    {selected && <mesh position={[0,-.49,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[1.12,.045,7,32]} /><meshBasicMaterial color="#ffb07d" /></mesh>}
    {selected && <LabelSprite text={plan.id} position={[0,1.25,0]} width={2.65} accent="#ffb07d" />}
    <group ref={scan} visible={false}>
      <mesh position={[0,-4.3,0]}>
        <coneGeometry args={[2.35,7.8,18,1,true]} />
        <meshBasicMaterial color={plan.color} side={DoubleSide} transparent opacity={.105} depthWrite={false} />
      </mesh>
      <mesh ref={pulseA} rotation={[-Math.PI/2,0,0]}>
        <torusGeometry args={[.72,.035,6,36]} /><meshBasicMaterial ref={pulseMatA} color={plan.color} transparent opacity={.5} depthWrite={false} />
      </mesh>
      <mesh ref={pulseB} rotation={[-Math.PI/2,0,0]}>
        <torusGeometry args={[.72,.035,6,36]} /><meshBasicMaterial ref={pulseMatB} color={plan.color} transparent opacity={.5} depthWrite={false} />
      </mesh>
    </group>
  </group>
}

export default memo(Drone)
