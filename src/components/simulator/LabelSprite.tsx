import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, LinearFilter, type Sprite } from 'three'
import { cameraProfile } from './cameraProfile'
import { isPriorityLabel, useLabelVisibility } from './labelVisibility'

export default function LabelSprite({ text, position, accent = '#70e9ea', width = 2.9 }: {
  text: string
  position: [number, number, number]
  accent?: string
  width?: number
}) {
  const sprite = useRef<Sprite>(null)
  const { size } = useThree()
  const labels = useLabelVisibility()
  const { portrait, overviewZoom } = cameraProfile(size.width, size.height)
  const priority = labels ? isPriorityLabel(text, labels) : true
  useFrame(({ camera }) => {
    if (sprite.current) sprite.current.visible = !portrait || priority || (!labels?.presentationActive && camera.zoom > overviewZoom * 1.7 && text.startsWith('SECTOR '))
  })
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 140
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = 'rgba(8, 37, 50, 0.94)'
      context.fillRect(3, 3, 506, 134)
      context.strokeStyle = accent
      context.lineWidth = 5
      context.strokeRect(3, 3, 506, 134)
      context.fillStyle = '#e9f8f7'
      context.font = 'bold 72px Arial'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(text, 256, 72, 478)
    }
    const map = new CanvasTexture(canvas)
    map.minFilter = LinearFilter
    map.magFilter = LinearFilter
    map.needsUpdate = true
    return map
  }, [text, accent])

  useEffect(() => () => texture.dispose(), [texture])

  return <sprite ref={sprite} position={position} scale={[width, width * .273, 1]} renderOrder={10} visible={!portrait || priority}>
    <spriteMaterial map={texture} transparent depthWrite={false} depthTest={false} />
  </sprite>
}
