export class Directions {
  uuid?: string
  code: string
  message?: string
  routes: DirectionRoute[]
  waypoints?: DirectionWaypoint[]
}

export class DirectionRoute {
  geometry: any
  legs: DirectionRouteLeg[]
  weight_name: string
  weight: number
  distance: number
  duration: number
}

export class DirectionWaypoint {
  distance: number
  name: string
  location: [number, number]
}

export class DirectionRouteLeg {
  summary: string
  weight: number
  duration: number
  steps: DirectionRouteStep[]
  distance: number
}

export class DirectionRouteStep {
  name: string
  driving_side: string
  weight: number
  mode: string
  intersections: any[]
  maneuver: DirectionRouteManeuver
  duration: number
  distance: number
  geometry: any
}

export class DirectionRouteManeuver {
  type: string
  instruction: string
  bearing_after: number
  bearing_before: number
  location: [number, number]
}

export enum DirectionsCode {
  ok = 'Ok',
  noRoute = 'NoRoute',
  noSegment = 'NoSegment',
  forbidden = 'Forbidden',
  profileNotFound = 'ProfileNotFound',
  invalidInput = 'InvalidInput',
}
