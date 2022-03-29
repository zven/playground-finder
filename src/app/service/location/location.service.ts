import { Injectable } from '@angular/core'
import { Geolocation, Position } from '@capacitor/geolocation'
import { Platform } from '@ionic/angular'
import { LocationManagementService } from '../location-management/location-management.service'

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private callbackID: string = undefined

  constructor(
    private locationManagementService: LocationManagementService,
    private platform: Platform
  ) {}

  async canUseLocation(): Promise<Boolean> {
    try {
      var status = await Geolocation.checkPermissions()
      if (status.location === 'prompt' || status.coarseLocation === 'prompt') {
        status = await Geolocation.requestPermissions()
      }
      return (
        status.location === 'granted' || status.coarseLocation === 'granted'
      )
    } catch (e) {
      const isApp = this.platform.is('android') || this.platform.is('ios')
      return !isApp
    }
  }

  async registerListener(callback: (location: Position) => void) {
    if (this.callbackID) return
    this.callbackID = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
      },
      async (position: Position | null, err?: any) => {
        const processedPosition =
          await this.locationManagementService.processLocation(position)
        if (processedPosition) {
          callback(processedPosition)
        }
      }
    )
  }

  async getCurrentLocation(): Promise<Position> {
    if (this.canUseLocation()) {
      const position = await Geolocation.getCurrentPosition()
      return await this.locationManagementService.processLocation(position)
    }
    return undefined
  }

  // Remove all listeners
  removeListener() {
    if (!this.callbackID) return
    Geolocation.clearWatch({ id: this.callbackID })
    this.callbackID = undefined
  }
}
