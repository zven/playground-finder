export class Playground {
  id: number
  lat: number
  lon: number
  name: string
  address: string
  isPrivate: boolean
  nodes: [number, number][]
}

export class PlaygroundResult {
  playgrounds: Playground[]
  lat: number
  lon: number
  radiusMeters: number
  address?: string
}

export type PlaygroundsResponse = {
  version: number
  generator: string
  elements: [PlaygroundResponseWay | PlaygroundResponseNode]
}

export type PlaygroundResponseWay = {
  type: string
  id: number
  center: { lat: number; lon: number }
  tags: { access: string; name: string }
  nodes?: number[]
}

export type PlaygroundResponseNode = {
  type: string
  id: number
  lat: number
  lon: number
}

export enum PlaygroundResponseType {
  node = 'node',
  way = 'way',
}
