import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core'
import { ModalController, ToastButton, ToastController } from '@ionic/angular'
import { PlaygroundService } from '../service/playground-service/playground.service'
import {
  Playground,
  PlaygroundResult,
} from '../service/playground-service/playground'

import { ReverseGeocodingService } from '../service/reverse-geocoding/reverse-geocoding.service'
import { LocationService } from '../service/location/location.service'
import { MapViewComponent } from './map-view/map-view/map-view.component'
import { PlaygroundDetailComponent } from '../playground-detail/playground-detail.component'
import {
  DirectionRoute,
  DirectionRouteManeuver,
  Directions,
} from '../service/direction/direction'
import { MapMode } from './map-view/map-view/map'
import { HeadingService } from '../service/heading/heading.service'

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
})
export class MapPage implements AfterViewInit {
  @ViewChild(MapViewComponent) mapView: MapViewComponent
  @ViewChild('directionsModal') directionsModalView: ElementRef

  isInitialLoading: boolean = true
  isLoadingPlaygrounds: boolean = false
  isLoadingMarkerAddress: boolean = false
  isSearchActive: boolean = false
  showDirectionInstructions: boolean = false
  hasUpdatedSearchParams: boolean = false
  usesCurrentLocation: boolean = false
  searchRadius: number = 2000
  markerAddress: string

  currentPlaygroundResult: PlaygroundResult = undefined
  currentPlayground: Playground = undefined
  currentRouteDirection: DirectionRoute = undefined

  constructor(
    private playgroundService: PlaygroundService,
    private locationService: LocationService,
    private geocodingService: ReverseGeocodingService,
    private headingService: HeadingService,
    private toastController: ToastController,
    private modalController: ModalController
  ) {}

  formattedSearchRadius(): string {
    return `${(this.searchRadius / 1000).toFixed(1)} km`
  }

  get showDirections(): boolean {
    return this.currentRouteDirection && !this.showLoadingPlaygrounds
  }

  get showSearch(): boolean {
    return (
      this.isSearchActive &&
      !this.showDirections &&
      !this.showLoadingPlaygrounds
    )
  }

  get showLoadingPlaygrounds(): boolean {
    return this.isLoadingPlaygrounds
  }

  get showSearchModalButton(): boolean {
    return (
      !this.showSearch && !this.showDirections && !this.showLoadingPlaygrounds
    )
  }

  get showSearchPlaygroundsButton(): boolean {
    return (
      this.hasUpdatedSearchParams &&
      !this.showLoadingPlaygrounds &&
      !this.showDirections
    )
  }

  get markerLngLat(): [number, number] {
    return this.mapView.markerLngLat.value
  }
  set markerLngLat(lngLat) {
    this.mapView.markerLngLat.next(lngLat)
  }

  get formattedDirectionDistance(): string {
    if (this.currentRouteDirection) {
      if (this.currentRouteDirection.distance < 1000) {
        return `${this.currentRouteDirection.distance.toFixed(0)} m`
      }
      return `${(this.currentRouteDirection.distance / 1000).toFixed(1)} km`
    }
    return ''
  }

  get formattedDirectionDuration(): string {
    if (this.currentRouteDirection) {
      return `${(this.currentRouteDirection.duration / 60).toFixed(0)} minutes`
    }
    return ''
  }

  get directionManuevers(): DirectionRouteManeuver[] {
    if (this.currentRouteDirection && this.currentRouteDirection.legs) {
      return this.currentRouteDirection.legs[0].steps.map((s) => {
        return s.maneuver
      })
    }
    return []
  }

  get directionInstructions(): string[] {
    const maneuvers = this.directionManuevers
    if (maneuvers && maneuvers.length) {
      return maneuvers.map((m) => m.instruction)
    }
    return []
  }

  currentMarkerString(): string {
    if (this.markerAddress) {
      return this.markerAddress
    }
    if (this.markerLngLat) {
      return `${this.markerLngLat[1].toFixed(
        3
      )} /  ${this.markerLngLat[0].toFixed(3)}`
    }
    return ''
  }

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
    this.mapView.updateUI()
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

  async openPlaygroundDetails(playground: Playground) {
    this.currentPlayground = undefined
    if (playground) {
      const modal = await this.modalController.create({
        component: PlaygroundDetailComponent,
        breakpoints: [0, 0.5],
        initialBreakpoint: 0.5,
        backdropBreakpoint: 0.5,
        swipeToClose: true,
        backdropDismiss: true,
        componentProps: {
          playground,
          markerLngLat: this.markerLngLat,
        },
      })
      modal.onDidDismiss().then(async (data) => {
        const directions: Directions = data.data
        if (directions && directions.routes && directions.routes.length) {
          this.currentRouteDirection = directions.routes[0]
          const route = directions.routes[0].geometry.coordinates
          await this.mapView.addRoute(route)
          this.currentPlayground = playground
        }
      })
      await modal.present()
    }
    this.isSearchActive = false
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
    this.mapView.updateUI()
  }

  onSearchToggle() {
    this.isSearchActive = !this.isSearchActive
  }

  onDirectionToggle() {
    this.currentRouteDirection = undefined
    this.mapView.toggleUIMode(MapMode.marker)
  }

  onInstructionClick(i: number) {
    const maneuvers = this.directionManuevers
    if (maneuvers && maneuvers.length > i) {
      const m = maneuvers[i]
      const padding = {
        left: 0,
        right: 0,
        top: this.directionsModalView.nativeElement.offsetHeight,
        bottom: 0,
      }
      this.mapView.flyTo(m.location, 18, 50, m.bearing_before, padding)
    }
  }

  async onCurrentLocationClick() {
    this.headingService.registerListener((heading) => {
      this.mapView.userHeading.next(heading)
    })
    const location = await this.locationService.getCurrentLocation()
    this.markerLngLat = [location.coords.longitude, location.coords.latitude]
    this.runGeocoding()
    this.mapView.userPosition.next(location)
    this.mapView.toggleUIMode(MapMode.userLocation)
    this.hasUpdatedSearchParams = true
    this.usesCurrentLocation = true
  }
}
