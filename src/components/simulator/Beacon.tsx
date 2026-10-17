import { memo } from 'react'
import LabelSprite from './LabelSprite'
import type { BeaconPlan, BeaconStatus } from './network'

function Beacon({ data, status, selected, onSelect }: { data: BeaconPlan; status: BeaconStatus; selected: boolean; onSelect: (id: string) => void }) {
  const color = status === 'Aislada' ? '#ff996f' : status === 'Conectada' ? '#70eced' : '#9aadb6'
  return <group position={[data.x, 0, data.z]} onClick={(event) => { event.stopPropagation(); onSelect(data.id) }}
    onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
    onPointerOut={() => { document.body.style.cursor = '' }}>
    <mesh position={[0,.15,0]}><cylinderGeometry args={[.53,.68,.3,8]} /><meshStandardMaterial color="#254c5b" metalness={.35} /></mesh>
    <mesh position={[0,.7,0]} castShadow><cylinderGeometry args={[.26,.38,.9,8]} /><meshStandardMaterial color="#a7d2d5" roughness={.48} metalness={.24} /></mesh>
    <mesh position={[0,1.21,0]}><cylinderGeometry args={[.32,.32,.16,8]} /><meshStandardMaterial color="#244b5b" metalness={.5} /></mesh>
    <mesh position={[0,1.67,0]}><cylinderGeometry args={[.035,.055,.82,6]} /><meshStandardMaterial color="#d8eeea" metalness={.48} /></mesh>
    <mesh position={[0,2.12,0]}><sphereGeometry args={[.13,10,8]} /><meshBasicMaterial color={color} /></mesh>
    <mesh position={[0,.16,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[2.25,.032,5,44]} /><meshBasicMaterial color={color} transparent opacity={status === 'Inactiva' ? .16 : .4} depthWrite={false} /></mesh>
    <mesh position={[0,.17,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[selected ? .95 : .68,.045,6,32]} /><meshBasicMaterial color={selected ? '#ffba8c' : color} transparent opacity={.8} /></mesh>
    <LabelSprite text={data.name} position={[0,2.95,0]} width={2.6} accent={color} />
  </group>
}

export default memo(Beacon)
