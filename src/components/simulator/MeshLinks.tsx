import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { memo, useRef } from 'react'
import { type Group } from 'three'
import { FAILED_LINK, LINKS, nodePosition, type NetworkSnapshot } from './network'
import type { MissionStore } from './mission'

function MeshLinks({ network, store }: { network: NetworkSnapshot; store: MissionStore }) {
  const pulses = useRef<Group>(null)
  useFrame(() => {
    if (!pulses.current) return
    network.transfers.forEach((transfer, index) => {
      const child = pulses.current?.children[index]
      if (!child) return
      const from = nodePosition(transfer.from)
      const to = nodePosition(transfer.to)
      const progress = Math.min(1, Math.max(0, (store.getTime() - transfer.start) / (transfer.end - transfer.start)))
      child.position.set(from.x + (to.x - from.x) * progress, 2.45, from.z + (to.z - from.z) * progress)
    })
  })
  return <group>
    {LINKS.map((link) => {
      const from = nodePosition(link.from)
      const to = nodePosition(link.to)
      const broken = network.failed && link.id === FAILED_LINK
      return <Line key={link.id} points={[[from.x,2.4,from.z],[to.x,2.4,to.z]]}
        color={!network.started ? '#758e98' : broken ? '#ff855e' : '#69e3e9'}
        transparent opacity={!network.started ? .25 : broken ? .36 : .65}
        lineWidth={broken ? 1 : 1.5} dashed={broken} dashSize={.4} gapSize={.25} />
    })}
    <group ref={pulses}>{network.transfers.map((transfer) => <mesh key={transfer.reportId} position={[0,2.45,0]}>
      <sphereGeometry args={[.19,10,8]} /><meshBasicMaterial color="#eafff4" />
    </mesh>)}</group>
  </group>
}

export default memo(MeshLinks)
