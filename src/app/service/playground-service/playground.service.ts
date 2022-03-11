import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import {
  Playground,
  PlaygroundResponseNode,
  PlaygroundResponseType,
  PlaygroundResponseWay,
  PlaygroundResult,
  PlaygroundsResponse,
} from './playground'

@Injectable({
  providedIn: 'root',
})
export class PlaygroundService {
  static API_BASE_URL = 'https://overpass-api.de/api/interpreter'
  static API_DATA_PARAM = 'data'
  static API_DATA_JSON = '[out:json];'
  static API_DATA_CENTER_OUT = 'out center;'
  static API_DATA_OUT = 'out;'
  static PLAYGROUNDS_CACHE = 'playgrounds_cache'

  constructor(private httpClient: HttpClient) {}

  loadPlaygroundWithLatLng(
    lat: number,
    lon: number,
    radiusMeters: number,
    callback: (success: boolean, result: PlaygroundResult) => void
  ) {
    const request = this.createRequestUrl(lon, lat, radiusMeters, true)
    this.httpClient.get(request).subscribe(
      async (response) => {
        const playgrounds = this.getPlaygroundFromJSON(response)
        const playgroundResult = {
          playgrounds,
          lat,
          lon,
          radiusMeters,
        }
        callback(true, playgroundResult)
        this.cachePlaygroundResult(playgroundResult)
      },
      (error) => {
        console.error(`request failed: ${JSON.stringify(error)}`)
        callback(false, { playgrounds: [], lat, lon, radiusMeters })
      }
    )
  }

  private createRequestUrl(
    lon: number,
    lat: number,
    radiusMeters: number,
    includeNodes: boolean
  ): string {
    const baseUrl = `${PlaygroundService.API_BASE_URL}?${PlaygroundService.API_DATA_PARAM}=${PlaygroundService.API_DATA_JSON}`
    const queryParams = `(way["leisure"="playground"](around:${radiusMeters},${lat},${lon}););`
    let request = `${baseUrl}${queryParams}${PlaygroundService.API_DATA_CENTER_OUT}`
    if (includeNodes) {
      request = `${request}node(around:${radiusMeters},${lat},${lon});way(bn)["leisure"="playground"];node(w)(around:${radiusMeters},${lat},${lon});${PlaygroundService.API_DATA_OUT}`
    }
    return request
  }

  private getPlaygroundFromJSON(jsonData: any): Playground[] {
    const response: PlaygroundsResponse = jsonData
    const ways = response.elements.filter(
      (el) => (el.type as PlaygroundResponseType) === PlaygroundResponseType.way
    )
    const nodes = response.elements.filter(
      (el) =>
        (el.type as PlaygroundResponseType) === PlaygroundResponseType.node
    )
    return ways.map((w) => {
      const playground = w as PlaygroundResponseWay
      if (playground) {
        let p = new Playground()
        p.id = playground.id
        p.lat = playground.center.lat
        p.lon = playground.center.lon
        p.name = playground.tags.name || 'Playground'
        p.isPrivate = playground.tags.access === 'private'
        let pNodes = []
        playground.nodes.map((pNode) => {
          const node = nodes.find(
            (node) => node.id === pNode
          ) as PlaygroundResponseNode
          if (node) {
            pNodes.push([node.lon, node.lat])
          }
        })
        p.nodes = pNodes

        return p
      }
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
