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
  { id: 'north', name: 'Sector Norte', kind: 'Sector', x: -1, z: -12, status: 'Acceso limitado', damage: 'Alto', communications: 'Parciales', observations: 'Daño estructural grave ilustrado; vías secundarias bajo revisión visual.' },
  { id: 'south', name: 'Sector Sur', kind: 'Sector', x: -1, z: 12, status: 'Zona inundada', damage: 'Alto', communications: 'Interrumpidas', observations: 'Acumulación de agua simulada en dos manzanas.' },
  { id: 'east', name: 'Sector Este', kind: 'Sector', x: 15.5, z: 0, status: 'Edificios afectados', damage: 'Alto', communications: 'Parciales', observations: 'Edificios parcialmente colapsados; se debe verificar el acceso al puente.' },
  { id: 'west', name: 'Sector Oeste', kind: 'Sector', x: -16.5, z: 0, status: 'Daño moderado', damage: 'Moderado', communications: 'Interrumpidas', observations: 'Fachadas afectadas y comunicaciones interrumpidas en este escenario ficticio.' },
  { id: 'center', name: 'Sector Centro', kind: 'Sector', x: 0, z: 0, status: 'Centro de coordinación', damage: 'Bajo', communications: 'Disponibles', observations: 'Punto conceptual de reunión de información.' },
]

const columns = [-14, -7, -4.5, 1, 9.5, 16]
const rows = [-10, -3.5, 4, 10.5]
const palette = ['#91b9c3', '#729cab', '#a9c5c9', '#6e9aa9', '#c4d8d4', '#7aabba']
const styles: BuildingData['style'][] = ['residential', 'tower', 'industrial', 'residential', 'civic', 'tower']

export const buildings: BuildingData[] = rows.flatMap((z, row) => columns.map((x, col) => {
  const index = row * columns.length + col
  const damaged = (row === 0 && [0, 2, 3].includes(col)) || (col === 5 && [1, 2].includes(row)) || (row === 1 && col === 4)
  const flooded = row === 3 && (col <= 1 || col >= 4)
  const hospital = row === 1 && col === 1
  const operations = row === 2 && col === 3
  const name = hospital ? 'Hospital de campaña' : operations ? 'Centro de operaciones' : 'Edificio ' + String(index + 1).padStart(2, '0')
  const damage: Damage = damaged ? 'Alto' : flooded || col === 0 && [1, 2].includes(row) || row === 2 && col === 2 ? 'Moderado' : 'Bajo'
  return {
    id: 'building-' + index,
    name,
    kind: 'Edificio' as const,
    x, z,
    width: hospital || operations ? 2.8 : index % 3 === 0 ? 2.35 : 1.9,
    depth: hospital || operations ? 2.5 : index % 4 === 0 ? 2.25 : 1.8,
    height: hospital ? 2.5 : operations ? 3.1 : damaged ? 2.8 + (index % 2) * 0.9 : 2.2 + (index % 5) * 0.85,
    color: hospital ? '#dce9e7' : operations ? '#4bb5c1' : damaged ? '#b48c7f' : palette[index % palette.length],
    style: hospital || operations ? 'civic' as const : styles[index % styles.length],
    damaged, flooded, hospital, operations,
    status: damaged ? 'Colapso parcial ilustrado' : flooded ? 'Entorno inundado' : damage === 'Moderado' ? 'Fachada afectada' : hospital ? 'Punto de atención' : operations ? 'Coordinación activa' : 'Inspección simulada',
    damage,
    communications: col === 0 && [1, 2].includes(row) ? 'Interrumpidas' : damaged ? 'Parciales' : flooded ? 'Parciales' : hospital || operations ? 'Disponibles' : index % 4 === 0 ? 'Parciales' : 'Disponibles',
    observations: damaged ? 'Fachada y cubierta parcialmente colapsadas, con escombros ilustrativos; requiere verificación presencial.' : flooded ? 'Agua acumulada en el entorno inmediato.' : damage === 'Moderado' ? 'Grietas y cubierta afectada en esta representación ficticia.' : hospital ? 'Referencia visual para atención de emergencia.' : operations ? 'Punto central del escenario ficticio.' : 'Evaluación ilustrativa sin datos de campo.',
  }
}))
