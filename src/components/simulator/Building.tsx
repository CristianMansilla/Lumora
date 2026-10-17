import type { ThreeEvent } from '@react-three/fiber'
import LabelSprite from './LabelSprite'
import type { BuildingData } from './scenario'

type Props = {
  data: BuildingData
  selected: boolean
  onSelect: (item: BuildingData) => void
}

export default function Building({ data, selected, onSelect }: Props) {
  const { width: w, depth: d, height: h } = data
  const windows = Array.from({ length: Math.min(4, Math.max(2, Math.floor(h / 1.2))) }, (_, i) => i)
  const onClick = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onSelect(data) }
  const windowColor = data.damaged ? '#263844' : '#225c6f'
  return <group position={[data.x, 0, data.z]} onClick={onClick}
    onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
    onPointerOut={() => { document.body.style.cursor = '' }}>
    <mesh position={[0, 0.1, 0]} receiveShadow>
      <boxGeometry args={[w + .65, .2, d + .65]} />
      <meshStandardMaterial color={selected ? '#70e7e9' : '#8daeb4'} roughness={.9} />
    </mesh>
    <mesh position={[0, h / 2 + .2, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={data.color} roughness={.72} metalness={.08} />
    </mesh>
    <mesh position={[0, h + .27, 0]} castShadow>
      <boxGeometry args={[w + .14, .16, d + .14]} />
      <meshStandardMaterial color={data.damaged ? '#765e5b' : data.hospital ? '#f3f5ef' : '#d3e2df'} roughness={.78} />
    </mesh>
    {data.style === 'tower' && <mesh position={[0, h + .51, 0]} castShadow>
      <boxGeometry args={[w * .55, .42, d * .55]} /><meshStandardMaterial color="#bed5d6" />
    </mesh>}
    {data.style === 'industrial' && <mesh position={[w * .18, h + .53, 0]} castShadow>
      <boxGeometry args={[w * .32, .55, d * .58]} /><meshStandardMaterial color="#618697" />
    </mesh>}
    {data.style === 'residential' && <mesh position={[0, h + .39, 0]} castShadow>
      <boxGeometry args={[w * .7, .22, d * .7]} /><meshStandardMaterial color="#678d9c" />
    </mesh>}
    {windows.map((floor) => {
      const y = .8 + floor * (h - .65) / windows.length
      return <group key={floor}>
        <mesh position={[-w * .25, y, d / 2 + .012]}><boxGeometry args={[w * .19, .32, .025]} /><meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={.13} /></mesh>
        <mesh position={[w * .25, y, d / 2 + .012]}><boxGeometry args={[w * .19, .32, .025]} /><meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={.13} /></mesh>
        <mesh position={[w / 2 + .012, y, -d * .24]}><boxGeometry args={[.025, .32, d * .19]} /><meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={.13} /></mesh>
        <mesh position={[w / 2 + .012, y, d * .24]}><boxGeometry args={[.025, .32, d * .19]} /><meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={.13} /></mesh>
      </group>
    })}
    {data.hospital && <group position={[0, h + .38, 0]}>
      <mesh><boxGeometry args={[1.1, .055, .34]} /><meshStandardMaterial color="#eb665d" /></mesh>
      <mesh><boxGeometry args={[.34, .06, 1.1]} /><meshStandardMaterial color="#eb665d" /></mesh>
    </group>}
    {data.operations && <group position={[0, h + .5, 0]}>
      <mesh><cylinderGeometry args={[.06, .08, .65, 8]} /><meshStandardMaterial color="#e5f7f3" /></mesh>
      <mesh position={[0, .38, 0]}><sphereGeometry args={[.13, 10, 8]} /><meshStandardMaterial color="#70eff2" emissive="#3bc7d2" emissiveIntensity={1} /></mesh>
    </group>}
    {data.damaged && <group>
      <mesh position={[w * .18, h + .33, 0]} rotation={[0, .3, .17]} castShadow><boxGeometry args={[w * .7, .15, d * .7]} /><meshStandardMaterial color="#826961" /></mesh>
      {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[w * .7 + (i % 2) * .32, .12 + (i % 3) * .08, -d * .45 + i * .23]} rotation={[i * .4, i * .7, i * .25]} castShadow>
        <boxGeometry args={[.28 + i * .035, .18, .24]} /><meshStandardMaterial color={i % 2 ? '#a88778' : '#74838a'} />
      </mesh>)}
    </group>}
    {(data.hospital || data.operations) && <LabelSprite text={data.hospital ? '+ HOSPITAL' : 'OPERACIONES'} position={[0, h + 1.3, 0]} accent={data.hospital ? '#ff9c79' : '#70e9ea'} width={data.hospital ? 3.6 : 3.8} />}
  </group>
}
