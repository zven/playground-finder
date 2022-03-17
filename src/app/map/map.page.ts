import { AfterViewInit, Component, ViewChild } from '@angular/core'
import { ToastButton, ToastController } from '@ionic/angular'
import { PlaygroundService } from '../service/playground-service/playground.service'
import { PlaygroundResult } from '../service/playground-service/playground'

import { ReverseGeocodingService } from '../service/reverse-geocoding/reverse-geocoding.service'
import { LocationService } from '../service/location/location.service'
import { MapViewComponent } from './map-view/map-view/map-view.component'

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
})
export class MapPage implements AfterViewInit {
  @ViewChild(MapViewComponent) mapView: MapViewComponent

  isInitialLoading: boolean = true
  isLoadingPlaygrounds: boolean = false
  isLoadingMarkerAddress: boolean = false
  isSearchActive: boolean = false
  hasUpdatedSearchParams: boolean = false
  usesCurrentLocation: boolean = false
  searchRadius: number = 2000
  markerAddress: string

  formattedSearchRadius(): string {
    return `${(this.searchRadius / 1000).toFixed(1)} km`
  }

  get markerLngLat(): [number, number] {
    return this.mapView.markerLngLat.value
  }
  set markerLngLat(lngLat) {
    this.mapView.markerLngLat.next(lngLat)
  }

  currentMarkerString(): string {
    if (this.markerAddress) {
      return this.markerAddress
    }
    console.log(this.markerLngLat)
    if (this.markerLngLat) {
      return `${this.markerLngLat[1].toFixed(
        3
      )} /  ${this.markerLngLat[0].toFixed(3)}`
    }
    return ''
  }

  currentPlaygroundResult: PlaygroundResult = undefined

  constructor(
    private playgroundService: PlaygroundService,
    private locationService: LocationService,
    private geocodingService: ReverseGeocodingService,
    private toastController: ToastController
  ) {}

  ngAfterViewInit() {
    this.mapView.markerLngLat.subscribe(() => {
      this.runGeocoding()
      this.hasUpdatedSearchParams = true
    })
    const cachedResult = this.playgroundService.loadCachedPlaygroundResult()
    if (cachedResult) {
      this.searchRadius = cachedResult.radiusMeters
      this.mapView.addResult(cachedResult)
    }
  }

  ionViewDidEnter() {
    if (history.state.center) {
      this.mapView.flyTo(history.state.center)
    }
  }

  private async loadPlaygrounds() {
    if (this.isLoadingPlaygrounds || !this.markerLngLat) {
      return
    }
    this.mapView.addPinRadiusToMap()
    this.isLoadingPlaygrounds = true
    this.playgroundService.loadPlaygroundWithLatLng(
      this.markerLngLat[1],
      this.markerLngLat[0],
      this.searchRadius,
      async (success, result) => {
        this.isLoadingPlaygrounds = false
        this.hasUpdatedSearchParams = false
        if (success && result) {
          this.mapView.addResult(result)
          if (!result.playgrounds.length) {
            await this.showNoPlaygroundsToast()
          }
        } else {
          await this.showRequestFailedToast(async () => {
            await this.loadPlaygrounds()
          })
        }
      }
    )
  }

  private runGeocoding() {
    if (this.markerLngLat) {
      this.isLoadingMarkerAddress = true
      this.geocodingService.reverseGeocode(
        [this.markerLngLat[1], this.markerLngLat[0]],
        (success, geocoding) => {
          this.isLoadingMarkerAddress = false
          if (success && geocoding) {
            this.markerAddress = geocoding.addressDisplayName
          }
        }
      )
    }
  }

  private async showRequestFailedToast(repeatHandler: () => void) {
    const button: ToastButton = {
      icon: 'repeat',
      side: 'end',
      handler: repeatHandler,
    }
    const toast = await this.toastController.create({
      icon: 'warning',
      message: 'Failed to find playgrounds…',
      color: 'danger',
      buttons: [button],
      duration: 10000,
    })
    await toast.present()
  }

  private async showNoPlaygroundsToast() {
    const toast = await this.toastController.create({
      icon: 'search',
      message: 'Looks like there are no playgrounds around here…',
      color: 'warning',
      duration: 5000,
    })
    await toast.present()
  }

  // Click listeners
  async onSearchPlaygroundsClick() {
    await this.loadPlaygrounds()
  }

  onSearchRadiusChange() {
    if (this.isInitialLoading) {
      this.isInitialLoading = false
      return
    }
    this.hasUpdatedSearchParams = true
    this.mapView.addPinRadiusToMap()
  }

  onSearchToggle() {
    this.isSearchActive = !this.isSearchActive
  }

  async onCurrentLocationClick() {
    const location = await this.locationService.getCurrentLocation()
    this.markerLngLat = [location.coords.longitude, location.coords.latitude]
    this.runGeocoding()
    this.mapView.addPinRadiusToMap()
    this.hasUpdatedSearchParams = true
    this.usesCurrentLocation = true
  }
}
