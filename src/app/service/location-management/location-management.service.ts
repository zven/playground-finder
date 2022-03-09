import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { Storage } from '@capacitor/storage'
import { LocationOption, LocationOptionType } from './location-management'

@Injectable({
  providedIn: 'root',
})
export class LocationManagementService {
  locationOptions: BehaviorSubject<LocationOption[]> = new BehaviorSubject<
    LocationOption[]
  >([])

  static LOCATION_OPTIONS_STORAGE_KEY = 'location_options_storage'

  get defaultOptions(): LocationOption[] {
    return [
      {
        type: LocationOptionType.playgrounds,
        default: true,
      },
      {
        type: LocationOptionType.navigation,
        default: false,
      },
      {
        type: LocationOptionType.addresses,
        default: false,
      },
      {
        type: LocationOptionType.accuracy,
        default: 0,
        range: [0, 10000],
      },
      {
        type: LocationOptionType.interval,
        default: 0,
        range: [0, 86400],
      },
    ]
  }

  constructor() {
    this.locationOptions.subscribe(async (newOptions) => {
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
}
