import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { point, BBox } from '@turf/helpers'
import buffer from '@turf/buffer'
import bbox from '@turf/bbox'

export class Playground {
  lat: number
  lon: number
  name: string
  address: string
  isPrivate: boolean
}

type PlaygroundsResponse = {
  version: number
  generator: string
  elements: [
    {
      type: string
      id: number
      center: { lat: number; lon: number }
      tags: { access: string; name: string }
    }
  ]
}

@Injectable({
  providedIn: 'root',
})
export class PlaygroundService {
  static API_BASE_URL = 'https://overpass-api.de/api/interpreter'
  static API_DATA_PARAM = 'data'
  static API_DATA_JSON = '[out:json];'

  constructor(private httpClient: HttpClient) {}

  loadPlaygroundWithLatLng(
    lng: number,
    lat: number,
    radiusMeters: number,
    callback: (
      success: boolean,
      result: Playground[],
      boundingBox: BBox
    ) => void
  ) {
    const p = point([lng, lat])
    const pointBuffer = buffer(p, radiusMeters, { units: 'meters' })
    const boundingBox = bbox(pointBuffer)
    this.loadPlaygroundsWithBoundingBox(boundingBox, callback)
  }

  loadPlaygroundsWithBoundingBox(
    boundingBox: BBox,
    callback: (
      success: boolean,
      result: Playground[],
      boundingBox: BBox
    ) => void
  ) {
    const request = this.createRequestUrl(boundingBox)
    this.httpClient.get(request).subscribe(
      async (response) => {
        const playgrounds = this.getPlaygroundFromJSON(response)
        callback(true, playgrounds, boundingBox)
      },
      (error) => {
        console.error(`request failed: ${JSON.stringify(error)}`)
        callback(false, undefined, boundingBox)
      }
    )
  }

  private createRequestUrl(boundingBox: BBox): string {
    const baseUrl = `${PlaygroundService.API_BASE_URL}?${PlaygroundService.API_DATA_PARAM}=${PlaygroundService.API_DATA_JSON}`
    const queryParams = `(way["leisure"="playground"](${boundingBox[1]},${boundingBox[0]},${boundingBox[3]},${boundingBox[2]}););`
    return `${baseUrl}${queryParams}out center;`
  }

  private getPlaygroundFromJSON(jsonData: any): Playground[] {
    const response: PlaygroundsResponse = jsonData
    return response.elements.map((playground) => {
      let p = new Playground()
      p.lat = playground.center.lat
      p.lon = playground.center.lon
      p.name = playground.tags.name || 'Playground'
      p.isPrivate = playground.tags.access === 'private'
      return p
    })
  }
}
