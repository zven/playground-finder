import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { ReverseGeocoding } from './reverse-geocoding'

@Injectable({
  providedIn: 'root',
})
export class ReverseGeocodingService {
  private static readonly REVERSE_GEOCODING_URL =
    'https://nominatim.openstreetmap.org/reverse'
  private static readonly REVERSE_GEOCODE_FORMAT = 'jsonv2'
  // limited to 'an absolute maximum of 1 request per second'
  // see https://operations.osmfoundation.org/policies/nominatim/

  constructor(private http: HttpClient) {}

  async reverseGeocode(
    latLng: [number, number],
    callback: (success: boolean, geocoding: ReverseGeocoding) => void
  ): Promise<any> {
    if (latLng && latLng.length && latLng[0] && latLng[1]) {
      const request = this.createReverseGeocodingRequestUrl(...latLng)
      const headers = new HttpHeaders()
        .set('content-type', 'application/json')
        .set('Access-Control-Allow-Origin', '*')
      this.http.get(request, { headers }).subscribe(
        async (response) => {
          const geocoding = ReverseGeocoding.fromApiObject(response, latLng)
          callback(true, geocoding)
        },
        (error) => {
          console.error(`reverse-geocoding failed: ${JSON.stringify(error)}`)
          callback(false, undefined)
        }
      )
    }
  }

  private createReverseGeocodingRequestUrl(lat: number, lon: number): string {
    return `${ReverseGeocodingService.REVERSE_GEOCODING_URL}?lat=${lat}&lon=${lon}&format=${ReverseGeocodingService.REVERSE_GEOCODE_FORMAT}`
  }
}
