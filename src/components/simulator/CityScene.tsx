import { useLayoutEffect, useRef } from 'react'
import { Object3D, type InstancedMesh } from 'three'
import Building from './Building'
import LabelSprite from './LabelSprite'
import { buildings, sectors, type Selection } from './scenario'

const treePositions: [number, number][] = [
  [-17,-12],[-16,-8],[-13,-6],[-8,-12],[-6,-6],[-1,-12],[2,-8],
  [-17,11],[-15,7],[-11,12],[-8,8],[-5,11],[-1,9],[2,12],
  [8,-12],[11,-8],[15,-12],[17,-7],[8,5],[11,11],[15,8],[17,12],
  [-12,1],[-6,1],[0,-1],[10,-1],[16,2],
]

function Trees() {
  const trunks = useRef<InstancedMesh>(null)
  const crowns = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const marker = new Object3D()
    treePositions.forEach(([x,z], index) => {
      marker.position.set(x, .46, z)
      marker.scale.setScalar(1)
      marker.updateMatrix()
      trunks.current?.setMatrixAt(index, marker.matrix)
      marker.position.set(x, 1.05, z)
      marker.scale.set(1 + index % 3 * .12, 1 + index % 2 * .15, 1 + index % 3 * .12)
      marker.updateMatrix()
      crowns.current?.setMatrixAt(index, marker.matrix)
    })
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true
    if (crowns.current) crowns.current.instanceMatrix.needsUpdate = true
  }, [])
  return <>
    <instancedMesh ref={trunks} args={[undefined, undefined, treePositions.length]} castShadow>
      <cylinderGeometry args={[.075,.11,.75,6]} /><meshStandardMaterial color="#586f6a" />
    </instancedMesh>
    <instancedMesh ref={crowns} args={[undefined, undefined, treePositions.length]} castShadow>
      <coneGeometry args={[.43,1.15,7]} /><meshStandardMaterial color="#74a79a" roughness={.95} />
    </instancedMesh>
  </>
}

function Roads() {
  return <group>
    {[-10,-2,12.5].map((x) => <group key={'v'+x}>
      <mesh position={[x,.035,0]} receiveShadow><boxGeometry args={[1.55,.07,28]} /><meshStandardMaterial color="#203f4e" /></mesh>
      {[-11,-5,3,10].map((z) => <mesh key={z} position={[x,.078,z]}><boxGeometry args={[.045,.008,1.4]} /><meshBasicMaterial color="#a3b7b8" /></mesh>)}
    </group>)}
    {[-7,7].map((z) => <group key={'h'+z}>
      <mesh position={[-6,.04,z]} receiveShadow><boxGeometry args={[21,.08,1.5]} /><meshStandardMaterial color="#203f4e" /></mesh>
      <mesh position={[12,.04,z]} receiveShadow><boxGeometry args={[12,.08,1.5]} /><meshStandardMaterial color="#203f4e" /></mesh>
      {[-14,-7,0,9,16].map((x) => <mesh key={x} position={[x,.085,z]}><boxGeometry args={[1.5,.008,.05]} /><meshBasicMaterial color="#a3b7b8" /></mesh>)}
    </group>)}
    <mesh position={[-.4,.05,0]} receiveShadow><boxGeometry args={[34,.09,1.65]} /><meshStandardMaterial color="#203f4e" /></mesh>
    {[-14,-8,-3,1,10,16].map((x) => <mesh key={'lane'+x} position={[x,.099,0]}><boxGeometry args={[1.5,.008,.055]} /><meshBasicMaterial color="#a3b7b8" /></mesh>)}
    {[-9.2,-2.8,11.7].flatMap((x) => [-.55,-.33,-.11,.11,.33,.55].map((z,index) => <mesh key={x+'-'+index} position={[x,.103,z]}><boxGeometry args={[.13,.009,.1]} /><meshBasicMaterial color="#d9e8e5" /></mesh>))}
  </group>
}

function RiverAndFloods() {
  return <group>
    <mesh position={[5.4,-.005,0]}><boxGeometry args={[4.1,.045,29]} /><meshStandardMaterial color="#477a8e" /></mesh>
    <mesh position={[5.4,.029,0]}><boxGeometry args={[3.45,.025,29]} /><meshStandardMaterial color="#4ca4bf" metalness={.32} roughness={.32} transparent opacity={.92} /></mesh>
    {[3.3,7.5].map((x) => <mesh key={x} position={[x,.08,0]}><boxGeometry args={[.18,.14,29]} /><meshStandardMaterial color="#9ec0bb" /></mesh>)}
    <mesh position={[5.4,.27,0]} castShadow receiveShadow><boxGeometry args={[4.4,.32,2.05]} /><meshStandardMaterial color="#688d96" /></mesh>
    <mesh position={[5.4,.45,0]}><boxGeometry args={[4.4,.05,1.62]} /><meshStandardMaterial color="#223e4b" /></mesh>
    {[-1.02,1.02].map((z) => <mesh key={z} position={[5.4,.72,z]}><boxGeometry args={[4.55,.14,.13]} /><meshStandardMaterial color="#d5e9e6" /></mesh>)}
    {[-10,10].map((z) => <mesh key={z} position={[5.4,.055,z]}><boxGeometry args={[3.6,.02,.06]} /><meshBasicMaterial color="#b2edf1" transparent opacity={.5} /></mesh>)}
    <mesh position={[-11.8,.17,10.2]} rotation={[0,.18,0]}><boxGeometry args={[7.2,.035,5.3]} /><meshStandardMaterial color="#58a4bb" transparent opacity={.72} metalness={.2} roughness={.28} /></mesh>
    <mesh position={[12.8,.17,-10]} rotation={[0,-.14,0]}><boxGeometry args={[7.6,.035,5.25]} /><meshStandardMaterial color="#58a4bb" transparent opacity={.72} metalness={.2} roughness={.28} /></mesh>
    {[[-11.8,10.2],[12.8,-10]].map(([x,z],index) => <mesh key={index} position={[x,.19,z]}><torusGeometry args={[1.55,.02,6,36]} /><meshBasicMaterial color="#b1f3f2" transparent opacity={.35} /></mesh>)}
  </group>
}

function SectorMarker({ sector, selected, onSelect }: { sector: typeof sectors[number]; selected: boolean; onSelect: (item: Selection) => void }) {
  return <group position={[sector.x,0,sector.z]} onClick={(event) => { event.stopPropagation(); onSelect(sector) }}
    onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
    onPointerOut={() => { document.body.style.cursor = '' }}>
    <mesh position={[0,.2,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.48,.065,8,28]} /><meshBasicMaterial color={selected ? '#f89a6f' : '#71e9ed'} /></mesh>
    <mesh position={[0,.45,0]}><cylinderGeometry args={[.05,.05,.9,8]} /><meshStandardMaterial color="#bde7e6" /></mesh>
    <mesh position={[0,.97,0]}><octahedronGeometry args={[.23,0]} /><meshStandardMaterial color={selected ? '#ff986e' : '#72eaf1'} emissive={selected ? '#ff986e' : '#3bbecb'} emissiveIntensity={.7} /></mesh>
    <LabelSprite text={sector.name.toUpperCase()} position={[0,1.68,0]} accent={selected ? '#ffab81' : '#70e9ea'} width={3.7} />
  </group>
}

export default function CityScene({ selectedId, onSelect }: { selectedId: string; onSelect: (item: Selection) => void }) {
  return <>
    <color attach="background" args={['#112f3d']} />
    <ambientLight intensity={1.7} />
    <hemisphereLight args={['#d8f9f8','#395666',2]} />
    <directionalLight position={[-13,25,17]} intensity={2.6} color="#fff3df" castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-23} shadow-camera-right={23} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-bias={-.0003} />
    <mesh position={[0,-.19,0]} receiveShadow><boxGeometry args={[38,.3,29]} /><meshStandardMaterial color="#59827f" roughness={1} /></mesh>
    <mesh position={[0,-.38,0]}><boxGeometry args={[38.5,.13,29.5]} /><meshStandardMaterial color="#153a49" /></mesh>
    <Roads />
    <RiverAndFloods />
    <Trees />
    {buildings.map((building) => <Building key={building.id} data={building} selected={selectedId===building.id} onSelect={onSelect} />)}
    {sectors.map((sector) => <SectorMarker key={sector.id} sector={sector} selected={selectedId===sector.id} onSelect={onSelect} />)}
    <mesh position={[-16.5,.015,-3]}><boxGeometry args={[2.2,.035,2.2]} /><meshStandardMaterial color="#6b9e91" /></mesh>
    <mesh position={[16.5,.015,4]}><boxGeometry args={[2.2,.035,2.2]} /><meshStandardMaterial color="#6b9e91" /></mesh>
  </>
}
