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
  const windowColor = data.damage === 'Alto' ? '#263844' : '#225c6f'
  const affected = data.damage !== 'Bajo' && !data.hospital && !data.operations
  return <group position={[data.x, 0, data.z]} onClick={onClick}
    onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
    onPointerOut={() => { document.body.style.cursor = '' }}>
    <mesh position={[0, 0.1, 0]} receiveShadow>
      <boxGeometry args={[w + .65, .2, d + .65]} />
      <meshStandardMaterial color={selected ? '#70e7e9' : '#8daeb4'} roughness={.9} />
    </mesh>
    {data.damaged ? <group>
      <mesh position={[0, h * .29 + .2, 0]} castShadow receiveShadow><boxGeometry args={[w, h * .58, d]} /><meshStandardMaterial color={data.color} roughness={.82} /></mesh>
      <mesh position={[0, h * .58 + .25, 0]} castShadow><boxGeometry args={[w + .08, .12, d + .08]} /><meshStandardMaterial color="#9a8f82" /></mesh>
      <mesh position={[-w * .37, h * .79 + .2, 0]} castShadow><boxGeometry args={[w * .26, h * .43, d]} /><meshStandardMaterial color={data.color} roughness={.85} /></mesh>
      <mesh position={[w * .26, h * .73 + .2, -d * .35]} castShadow><boxGeometry args={[w * .48, h * .31, d * .28]} /><meshStandardMaterial color={data.color} roughness={.85} /></mesh>
      <mesh position={[w * .2, h * .62 + .25, d * .3]} rotation={[.14,0,-.23]} castShadow><boxGeometry args={[w * .53,.15,d * .48]} /><meshStandardMaterial color="#705f5b" /></mesh>
      <mesh position={[w * .13,h * .59 + .26,0]}><boxGeometry args={[w * .5,.025,d * .55]} /><meshStandardMaterial color="#283c45" /></mesh>
    </group> : <>
      <mesh position={[0, h / 2 + .2, 0]} castShadow receiveShadow><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={data.color} roughness={.72} metalness={.08} /></mesh>
      <mesh position={[0, h + .27, 0]} castShadow rotation={affected ? [.03,0,-.055] : [0,0,0]}><boxGeometry args={[w + .14, .16, d + .14]} /><meshStandardMaterial color={data.hospital ? '#f3f5ef' : affected ? '#b6aea0' : '#d3e2df'} roughness={.78} /></mesh>
    </>}
    {!data.damaged && data.style === 'tower' && <mesh position={[0, h + .51, 0]} castShadow>
      <boxGeometry args={[w * .55, .42, d * .55]} /><meshStandardMaterial color="#bed5d6" />
    </mesh>}
    {!data.damaged && data.style === 'industrial' && <mesh position={[w * .18, h + .53, 0]} castShadow>
      <boxGeometry args={[w * .32, .55, d * .58]} /><meshStandardMaterial color="#618697" />
    </mesh>}
    {!data.damaged && data.style === 'residential' && <mesh position={[0, h + .39, 0]} castShadow>
      <boxGeometry args={[w * .7, .22, d * .7]} /><meshStandardMaterial color="#678d9c" />
    </mesh>}
    {windows.map((floor) => {
      const y = .8 + floor * (h - .65) / windows.length
      if (data.damaged && y > h * .53) return null
      return <group key={floor}>
        <mesh position={[-w * .25, y, d / 2 + .012]}><boxGeometry args={[w * .19, .32, .025]} /><meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={.13} /></mesh>
        {!(affected && floor === 1) && <mesh position={[w * .25, y, d / 2 + .012]}><boxGeometry args={[w * .19, .32, .025]} /><meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={.13} /></mesh>}
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
    {affected && <group>
      {[0,1,2].map((i) => <mesh key={'crack-'+i} position={[-w * .15 + i * .18, Math.min(h * .72, 1.1 + i * .22), d / 2 + .025]} rotation={[0,0,i % 2 ? -.65 : .55]}><boxGeometry args={[.035,.53,.02]} /><meshStandardMaterial color="#35434a" /></mesh>)}
      {[0,1,2].map((i) => <mesh key={'side-crack-'+i} position={[w / 2 + .024, .85 + i * .32, -d * .2 + i * .16]} rotation={[0,i % 2 ? .5 : -.5,0]}><boxGeometry args={[.02,.39,.035]} /><meshStandardMaterial color="#35434a" /></mesh>)}
      {Array.from({length:data.damaged ? 9 : 3}, (_, i) => <mesh key={'rubble-'+i} position={[w * .43 + i % 3 * .18, .18 + i % 3 * .06, -d * .38 + Math.floor(i / 3) * .3]} rotation={[i * .27, i * .7, i * .19]} castShadow><boxGeometry args={[.25 + i % 3 * .07, .13 + i % 2 * .09, .2 + i % 2 * .07]} /><meshStandardMaterial color={i % 2 ? '#a88778' : '#74838a'} /></mesh>)}
    </group>}
    {(data.hospital || data.operations) && <LabelSprite text={data.hospital ? '+ HOSPITAL' : 'OPERACIONES'} position={[0, h + 1.3, 0]} accent={data.hospital ? '#ff9c79' : '#70e9ea'} width={data.hospital ? 3.6 : 3.8} />}
  </group>
}
