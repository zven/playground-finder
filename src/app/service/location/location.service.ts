import { Injectable } from '@angular/core'
import { Geolocation, Position } from '@capacitor/geolocation'
import { LocationOptionType } from '../location-management/location-management'
import { LocationManagementService } from '../location-management/location-management.service'
import { point } from '@turf/helpers'
import { randomPoint } from '@turf/random'
import buffer from '@turf/buffer'
import bbox from '@turf/bbox'
import transformTranslate from '@turf/transform-translate'

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private cachedPosition: Position

  constructor(private locationManagementService: LocationManagementService) {}

  private async shouldUseCachedPosition(): Promise<boolean> {
    const locationInterval = (
      await this.locationManagementService.loadLocationOption(
        LocationOptionType.interval
      )
    ).value
    if (this.cachedPosition) {
      const timestamp = Date.now() / 1000
      return timestamp - this.cachedPosition.timestamp < locationInterval
    }
    return false
  }

  private async filterPositionWithAccuracy(
    position: Position
  ): Promise<Position> {
    const locationAccuracy = (
      await this.locationManagementService.loadLocationOption(
        LocationOptionType.accuracy
      )
    ).value
    if (
      position.coords &&
      position.coords.accuracy &&
      position.coords.accuracy > locationAccuracy
    ) {
      // original accuracy already fits
      return position
    }
    // calculate buffer around requested location
    const positionBuffer = buffer(
      point([position.coords.longitude, position.coords.latitude]),
      locationAccuracy,
      {
        units: 'meters',
      }
    )

    // translating buffer to random distance and direction
    // + 0.2 so that there is always some offset
    const randomDistance = Math.floor((Math.random() + 0.2) * locationAccuracy)
    const randomDirection = Math.floor(Math.random() * 360)
    const translatedBuffer = transformTranslate(
      positionBuffer,
      randomDistance,
      randomDirection,
      {
        units: 'meters',
      }
    )

    // create bbox from buffer
    const posBbox = bbox(translatedBuffer)

    // generate random points in bbox
    const randomPoints = randomPoint(1, { bbox: posBbox })
    const randomPointCoord = randomPoints[0].geometry.coordinates
    position.coords.latitude = randomPointCoord[1]
    position.coords.longitude = randomPointCoord[0]
    position.coords.accuracy = locationAccuracy

    return position
  }

  private async checkForPermissions() {
    try {
      await Geolocation.requestPermissions()
    } catch (e) {}
  }

  async getCurrentLocation(): Promise<Position> {
    await this.checkForPermissions()
    if (this.shouldUseCachedPosition()) {
      // return cached position if eligible
      return this.filterPositionWithAccuracy(this.cachedPosition)
    }
    const position = await Geolocation.getCurrentPosition()
    if (position) {
      this.cachedPosition = await this.filterPositionWithAccuracy(position)
      return this.cachedPosition
    }
    return undefined
  }
}
