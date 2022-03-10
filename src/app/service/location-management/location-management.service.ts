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
        value: true,
      },
      {
        type: LocationOptionType.navigation,
        value: false,
      },
      {
        type: LocationOptionType.addresses,
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
      await Storage.set({
        key: LocationManagementService.LOCATION_OPTIONS_STORAGE_KEY,
        value: JSON.stringify(newOptions),
      })
      console.log(JSON.stringify(newOptions))
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
    return this.locationOptions.getValue().find((o) => {
      o.type === type
    })
  }
}
