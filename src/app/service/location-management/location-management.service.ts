import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { Storage } from '@capacitor/storage'
import { LocationOption, LocationOptionType } from './location-management'
import { Position } from '@capacitor/geolocation'
import { point } from '@turf/helpers'
import { randomPoint } from '@turf/random'
import buffer from '@turf/buffer'
import bbox from '@turf/bbox'
import transformTranslate from '@turf/transform-translate'

@Injectable({
  providedIn: 'root',
})
export class LocationManagementService {
  locationOptions: BehaviorSubject<LocationOption[]> = new BehaviorSubject<
    LocationOption[]
  >([])
  private cachedPosition: Position = undefined

  static LOCATION_OPTIONS_STORAGE_KEY = 'location_options_storage'

  get defaultOptions(): LocationOption[] {
    return [
      {
        type: LocationOptionType.playgrounds,
        value: true,
      },
      {
        type: LocationOptionType.navigation,
        value: false,
      },
      {
        type: LocationOptionType.accuracy,
        value: 0,
      },
      {
        type: LocationOptionType.interval,
        value: 0,
      },
    ]
  }

  constructor() {
    this.locationOptions.subscribe(async (newOptions) => {
      if (!newOptions || !newOptions.length) return
      await Storage.set({
        key: LocationManagementService.LOCATION_OPTIONS_STORAGE_KEY,
        value: JSON.stringify(newOptions),
      })
    })
    this.initLocationOptions()
  }

  async initLocationOptions() {
    const { value } = await Storage.get({
      key: LocationManagementService.LOCATION_OPTIONS_STORAGE_KEY,
    })
    if (value && value.length > 0) {
      try {
        const options = JSON.parse(value) as LocationOption[]
        if (options.length > 0) {
          this.locationOptions.next(options)
          return
        }
      } catch (error) {}
    }
    this.locationOptions.next(this.defaultOptions)
  }

  async loadLocationOption(type: LocationOptionType): Promise<LocationOption> {
    if (!this.locationOptions) {
      await this.initLocationOptions()
    }
    return this.locationOptions
      .getValue()
      .find((o) => (o.type as LocationOptionType) === type)
  }

  async processLocation(position: Position): Promise<Position> {
    try {
      if (await this.shouldUseCachedPosition()) {
        // return cached position if eligible
        return this.filterPositionWithAccuracy(this.cachedPosition)
      }
      if (position) {
        this.cachedPosition = await this.filterPositionWithAccuracy(position)
        return this.cachedPosition
      }
      return undefined
    } catch (e) {
      return undefined
    }
  }

  private async shouldUseCachedPosition(): Promise<boolean> {
    const locationInterval = (
      await this.loadLocationOption(LocationOptionType.interval)
    ).value
    if (this.cachedPosition && this.cachedPosition.coords) {
      const timestamp = Date.now()
      const timeDiff = timestamp - this.cachedPosition.timestamp
      return timeDiff < locationInterval * 1000
    }
    return false
  }

  private async filterPositionWithAccuracy(
    position: Position
  ): Promise<Position> {
    const locationAccuracy = (
      await this.loadLocationOption(LocationOptionType.accuracy)
    ).value
    if (!position || !position.coords) {
      return undefined
    } else if (
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
    const randomPointCoord = randomPoints.features[0].geometry.coordinates

    // create new less accurate position from randomPoint
    const newPosition: Position = {
      timestamp: position.timestamp,
      coords: {
        latitude: randomPointCoord[1],
        longitude: randomPointCoord[0],
        accuracy: locationAccuracy + position.coords.accuracy,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        altitude: position.coords.altitude,
        speed: position.coords.speed,
        heading: position.coords.heading,
      },
    }

    return newPosition
  }
}
