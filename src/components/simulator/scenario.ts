export type Damage = 'Bajo' | 'Moderado' | 'Alto'
export type Selection = {
  id: string
  name: string
  kind: 'Sector' | 'Edificio'
  status: string
  damage: Damage
  communications: string
  observations: string
}

export type BuildingData = Selection & {
  x: number
  z: number
  height: number
  width: number
  depth: number
  color: string
  style: 'tower' | 'residential' | 'industrial' | 'civic'
  flooded?: boolean
  damaged?: boolean
  hospital?: boolean
  operations?: boolean
}

export const sectors: (Selection & { x: number; z: number })[] = [
  { id: 'north', name: 'Sector Norte', kind: 'Sector', x: -1, z: -12, status: 'Acceso limitado', damage: 'Moderado', communications: 'Parciales', observations: 'Vías secundarias bajo revisión visual.' },
  { id: 'south', name: 'Sector Sur', kind: 'Sector', x: -1, z: 12, status: 'Zona inundada', damage: 'Alto', communications: 'Interrumpidas', observations: 'Acumulación de agua simulada en dos manzanas.' },
  { id: 'east', name: 'Sector Este', kind: 'Sector', x: 15.5, z: 0, status: 'Evaluación pendiente', damage: 'Moderado', communications: 'Parciales', observations: 'Se prioriza verificar el acceso al puente.' },
  { id: 'west', name: 'Sector Oeste', kind: 'Sector', x: -16.5, z: 0, status: 'Edificios afectados', damage: 'Alto', communications: 'Interrumpidas', observations: 'Daños estructurales representados de forma ilustrativa.' },
  { id: 'center', name: 'Sector Centro', kind: 'Sector', x: 0, z: 0, status: 'Centro de coordinación', damage: 'Bajo', communications: 'Disponibles', observations: 'Punto conceptual de reunión de información.' },
]

const columns = [-14, -7, -4.5, 1, 9.5, 16]
const rows = [-10, -3.5, 4, 10.5]
const palette = ['#91b9c3', '#729cab', '#a9c5c9', '#6e9aa9', '#c4d8d4', '#7aabba']
const styles: BuildingData['style'][] = ['residential', 'tower', 'industrial', 'residential', 'civic', 'tower']

export const buildings: BuildingData[] = rows.flatMap((z, row) => columns.map((x, col) => {
  const index = row * columns.length + col
  const damaged = (row === 2 && col === 0) || (row === 1 && col === 5) || (row === 3 && col === 2)
  const flooded = (row === 3 && col <= 1) || (row === 0 && col >= 4)
  const hospital = row === 1 && col === 1
  const operations = row === 2 && col === 3
  const name = hospital ? 'Hospital de campaña' : operations ? 'Centro de operaciones' : 'Edificio ' + String(index + 1).padStart(2, '0')
  const damage: Damage = damaged ? 'Alto' : flooded ? 'Moderado' : index % 5 === 0 ? 'Moderado' : 'Bajo'
  return {
    id: 'building-' + index,
    name,
    kind: 'Edificio' as const,
    x, z,
    width: hospital || operations ? 2.8 : index % 3 === 0 ? 2.35 : 1.9,
    depth: hospital || operations ? 2.5 : index % 4 === 0 ? 2.25 : 1.8,
    height: hospital ? 2.5 : operations ? 3.1 : damaged ? 1.7 + (index % 2) * 0.8 : 2.2 + (index % 5) * 0.85,
    color: hospital ? '#dce9e7' : operations ? '#4bb5c1' : damaged ? '#a9867c' : palette[index % palette.length],
    style: hospital || operations ? 'civic' as const : styles[index % styles.length],
    damaged, flooded, hospital, operations,
    status: damaged ? 'Estructura afectada' : flooded ? 'Entorno inundado' : hospital ? 'Punto de atención' : operations ? 'Coordinación activa' : 'Inspección simulada',
    damage,
    communications: damaged ? 'Interrumpidas' : flooded ? 'Parciales' : hospital || operations ? 'Disponibles' : index % 4 === 0 ? 'Parciales' : 'Disponibles',
    observations: damaged ? 'Escombros visibles; requiere verificación presencial.' : flooded ? 'Agua acumulada en el entorno inmediato.' : hospital ? 'Referencia visual para atención de emergencia.' : operations ? 'Punto central del escenario ficticio.' : 'Evaluación ilustrativa sin datos de campo.',
  }
}))
