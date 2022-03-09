import { Injectable } from '@angular/core'
import { Geolocation, Position } from '@capacitor/geolocation'
import { LocationManagementService } from '../location-management/location-management.service'

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private lastLocationRequestTimestamp = 0
  private cachedPosition: Position

  constructor(private locationManagementService: LocationManagementService) {}

  async getCurrentLocation(): Promise<Position> {
    const timestamp = Date.now() / 1000
    const lastTimestamp = this.lastLocationRequestTimestamp
    this.lastLocationRequestTimestamp = timestamp
    /*const locationInterval =
      this.locationManagementService.locationIntervalSeconds.getValue()
    if (this.cachedPosition && lastTimestamp > 0 && locationInterval > 0) {
      if (timestamp - lastTimestamp < locationInterval) {
        // return cached position if eligible
        return this.cachedPosition
      }
    }*/
    const position = await Geolocation.getCurrentPosition()
    this.cachedPosition = position
    return position
  }
}
