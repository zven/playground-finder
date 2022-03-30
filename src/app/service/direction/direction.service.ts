import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { environment } from 'src/environments/environment'
import { Directions, DirectionsCode } from './direction'

@Injectable({
  providedIn: 'root',
})
export class DirectionService {
  private static API_BASE_URL = 'https://api.mapbox.com/directions/v5/'
  private static API_WALKING_PROFILE = 'mapbox/walking'
  private static API_TOKEN_PARAM = `access_token=${environment.mapbox.token}`
  private static API_GEOM_GEOJSON_PARAM = 'geometries=geojson'
  private static API_TBT_PARAM = 'steps=true'
  private static API_LANG_PARAM = 'language=en'
  private static COORD_DECIMALS = 6

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
        callback(false, undefined)
        console.error(`request failed: ${JSON.stringify(error)}`)
      }
    )
  }

  private createRequestUrl(
    fromLonLat: [number, number],
    toLonLat: [number, number]
  ): string {
    const path = `${DirectionService.API_BASE_URL}${DirectionService.API_WALKING_PROFILE}`
    const from = `${fromLonLat[0].toFixed(
      DirectionService.COORD_DECIMALS
    )},${fromLonLat[1].toFixed(DirectionService.COORD_DECIMALS)}`
    const to = `${toLonLat[0].toFixed(
      DirectionService.COORD_DECIMALS
    )},${toLonLat[1].toFixed(DirectionService.COORD_DECIMALS)}`
    const coordinates = `${from};${to}`
    const params = `${DirectionService.API_GEOM_GEOJSON_PARAM}&${DirectionService.API_TBT_PARAM}&${DirectionService.API_LANG_PARAM}&${DirectionService.API_TOKEN_PARAM}`
    return `${path}/${coordinates}?${params}`
  }
}
