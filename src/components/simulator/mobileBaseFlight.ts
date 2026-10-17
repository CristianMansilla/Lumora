import { DRONE_PLANS, flightAt, type FlightPose } from './mission'
import {
  HATCH_OPEN_DURATION, MOBILE_BASE_DRONE_HEIGHT, MOBILE_BASE_PAD_X,
  MOBILE_BASE_PAD_Z, MOBILE_BASE_POSITION,
} from './mobileBaseConfig'

const altitude = DRONE_PLANS.map((plan, index) => flightAt(index, plan.takeoffEnd).position.y)
const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

// Only the local deployment and recovery are visualized here. flightAt remains
// the source of truth for recognition routes, timings, scanning and mission state.
export function mobileBaseFlightAt(index: number, elapsed: number): FlightPose {
  const plan = DRONE_PLANS[index]
  const pose = flightAt(index, elapsed)
  const deckX = MOBILE_BASE_POSITION[0] + MOBILE_BASE_PAD_X[index]
  const deckZ = MOBILE_BASE_POSITION[2] + MOBILE_BASE_PAD_Z

  if (elapsed < plan.start || elapsed >= plan.landEnd) {
    pose.position.set(deckX, MOBILE_BASE_DRONE_HEIGHT, deckZ)
  } else if (elapsed < plan.takeoffEnd) {
    const liftStart = index === 0 ? HATCH_OPEN_DURATION : plan.start
    const progress = (elapsed - liftStart) / (plan.takeoffEnd - liftStart)
    const ascent = ease(progress / .68)
    const transfer = ease((progress - .65) / .35)
    pose.position.set(
      deckX + (plan.launch[0] - deckX) * transfer,
      MOBILE_BASE_DRONE_HEIGHT + (altitude[index] - MOBILE_BASE_DRONE_HEIGHT) * ascent,
      deckZ + (plan.launch[1] - deckZ) * transfer,
    )
  } else if (elapsed >= plan.returnEnd) {
    const progress = (elapsed - plan.returnEnd) / (plan.landEnd - plan.returnEnd)
    const transfer = ease(progress / .35)
    const descent = ease((progress - .35) / .65)
    pose.position.set(
      plan.launch[0] + (deckX - plan.launch[0]) * transfer,
      altitude[index] + (MOBILE_BASE_DRONE_HEIGHT - altitude[index]) * descent,
      plan.launch[1] + (deckZ - plan.launch[1]) * transfer,
    )
  }

  return pose
}
