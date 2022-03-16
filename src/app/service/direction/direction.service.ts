import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Constants } from 'src/app/utils/constants'
import { Directions, DirectionsCode } from './direction'

@Injectable({
  providedIn: 'root',
})
export class DirectionService {
  static API_BASE_URL = 'https://api.mapbox.com/directions/v5/'
  static API_WALKING_PROFILE = 'mapbox/walking'
  static API_TOKEN_PARAM = 'access_token'
  static API_GEOM_GEOJSON_PARAM = 'geometries=geojson'

  constructor(private httpClient: HttpClient) {}

  loadDirections(
    fromLonLat: [number, number],
    toLonLat: [number, number],
    callback: (success: boolean, directions: Directions) => void
  ) {
    const request = this.createRequestUrl(fromLonLat, toLonLat)
    this.httpClient.get(request).subscribe(
      async (response: any) => {
        try {
          const directions: Directions = response
          callback(directions.code === DirectionsCode.ok, directions)
        } catch (e) {
          callback(false, undefined)
        }
      },
      (error) => {
        console.error(`request failed: ${JSON.stringify(error)}`)
      }
    )
  }

  private createRequestUrl(
    fromLonLat: [number, number],
    toLonLat: [number, number]
  ): string {
    const path = `${DirectionService.API_BASE_URL}${DirectionService.API_WALKING_PROFILE}`
    const coordDecs = 6
    const coordinates = `${fromLonLat[0].toFixed(
      coordDecs
    )},${fromLonLat[1].toFixed(coordDecs)};${toLonLat[0].toFixed(
      coordDecs
    )},${toLonLat[1].toFixed(coordDecs)}`
    const params = `${DirectionService.API_GEOM_GEOJSON_PARAM}&${DirectionService.API_TOKEN_PARAM}=${Constants.MAPBOX_TOKEN}`
    return `${path}/${coordinates}?${params}`
  }
}
