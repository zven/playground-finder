import { Injectable } from '@angular/core'
import { Geolocation, Position } from '@capacitor/geolocation'
import { Platform } from '@ionic/angular'
import { LocationOptionType } from '../location-management/location-management'
import { LocationManagementService } from '../location-management/location-management.service'

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private callbackID: string = undefined

  constructor(
    private locationManagementService: LocationManagementService,
    private platform: Platform
  ) {
    this.locationManagementService.locationOptions.subscribe(
      async (newOptions) => {
        if (!newOptions || !newOptions.length) return
        const canUseNavigation =
          await this.locationManagementService.loadLocationOption(
            LocationOptionType.navigation
          )
        if (!canUseNavigation) {
          this.removeListener()
        }
      }
    )
  }

  async canUseLocation(requestPermission: boolean = false): Promise<Boolean> {
    if (
      (
        await this.locationManagementService.loadLocationOption(
          LocationOptionType.playgrounds
        )
      ).value
    ) {
      try {
        var status = await Geolocation.checkPermissions()
        if (
          requestPermission &&
          (status.location === 'prompt' || status.coarseLocation === 'prompt')
        ) {
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
    return false
  }

  async registerListener(callback: (location: Position) => void) {
    if (
      (
        await this.locationManagementService.loadLocationOption(
          LocationOptionType.navigation
        )
      ).value
    ) {
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
