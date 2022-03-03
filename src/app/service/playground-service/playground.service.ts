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

export class PlaygroundResult {
  playgrounds: Playground[]
  lat: number
  lon: number
  searchRange: number
  boundingBox?: BBox
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
  static PLAYGROUNDS_CACHE = 'playgrounds_cache'

  constructor(private httpClient: HttpClient) {}

  loadPlaygroundWithLatLng(
    lat: number,
    lon: number,
    searchRange: number,
    callback: (success: boolean, result: PlaygroundResult) => void
  ) {
    const p = point([lon, lat])
    const pointBuffer = buffer(p, searchRange, { units: 'meters' })
    const boundingBox = bbox(pointBuffer)
    this.loadPlaygroundsWithBoundingBox(
      lat,
      lon,
      searchRange,
      boundingBox,
      callback
    )
  }

  private loadPlaygroundsWithBoundingBox(
    lat: number,
    lon: number,
    searchRange: number,
    boundingBox: BBox,
    callback: (success: boolean, result: PlaygroundResult) => void
  ) {
    const request = this.createRequestUrl(boundingBox)
    this.httpClient.get(request).subscribe(
      async (response) => {
        const playgrounds = this.getPlaygroundFromJSON(response)
        const playgroundResult = {
          playgrounds,
          lat,
          lon,
          searchRange,
          boundingBox,
        }
        callback(true, playgroundResult)
        this.cachePlaygroundResult(playgroundResult)
      },
      (error) => {
        console.error(`request failed: ${JSON.stringify(error)}`)
        callback(false, { playgrounds: [], lat, lon, searchRange, boundingBox })
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

  private cachePlaygroundResult(playgroundResult: PlaygroundResult) {
    localStorage.setItem(
      PlaygroundService.PLAYGROUNDS_CACHE,
      JSON.stringify(playgroundResult)
    )
  }

  loadCachedPlaygroundResult(): PlaygroundResult {
    let result = localStorage.getItem(PlaygroundService.PLAYGROUNDS_CACHE)
    try {
      return JSON.parse(result) as PlaygroundResult
    } catch (error) {
      return undefined
    }
  }
}
