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
import { MapMode, MarkerMode } from './map-view/map-view/map'
import { HeadingService } from '../service/heading/heading.service'
import * as turf from '@turf/turf'

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
})
export class MapPage implements AfterViewInit {
  @ViewChild(MapViewComponent) mapView: MapViewComponent
  @ViewChild('directionsModal') directionsModalView: ElementRef
  @ViewChild('searchModal') searchModalView: ElementRef

  isInitialLoading: boolean = true
  isLoadingPlaygrounds: boolean = false
  isLoadingMarkerAddress: boolean = false
  isSearchActive: boolean = false
  isNavigating: boolean = false
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
    if (this.showLoadingPlaygrounds || this.showDirections) return false
    return this.hasUpdatedSearchParams
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

  get currentMarkerString(): string {
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

  async ngAfterViewInit() {
    this.mapView.markerLngLat.subscribe(() => {
      this.runGeocoding()
      this.invalidateSearchParams()
    })
    const cachedResult = this.playgroundService.loadCachedPlaygroundResult()
    if (cachedResult) {
      this.currentPlaygroundResult = cachedResult
      this.searchRadius = cachedResult.radiusMeters
      this.mapView.addResult(cachedResult)
    }
    // enable user location, if available
    await this.toggleUserLocation(false)
  }

  ionViewDidEnter() {
    if (history.state.center) {
      this.mapView.flyTo(history.state.center)
    }
  }

  private invalidateSearchParams() {
    if (this.currentPlaygroundResult) {
      const isNewRadius =
        Math.abs(
          this.currentPlaygroundResult.radiusMeters - this.searchRadius
        ) > 0.01
      const from = turf.point([
        this.currentPlaygroundResult.lon,
        this.currentPlaygroundResult.lat,
      ])
      const to = turf.point(this.markerLngLat)
      const isNewCoords = turf.distance(from, to, { units: 'meters' }) > 5
      this.hasUpdatedSearchParams = isNewRadius || isNewCoords
    } else {
      this.hasUpdatedSearchParams = true
    }
  }

  private async loadPlaygrounds() {
    if (this.isLoadingPlaygrounds || !this.markerLngLat) {
      return
    }
    this.mapView.updateUI(false)
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
      modal.onDidDismiss().then((data) => {
        this.mapView.flyTo([playground.lon, playground.lat], 16, 0, 0, {
          bottom: 0,
        })
        const directions: Directions = data.data
        if (directions && directions.routes && directions.routes.length) {
          this.startDirections(directions.routes[0], playground)
        }
      })
      this.mapView.flyTo([playground.lon, playground.lat], 17, 45, 0, {
        bottom: window.innerHeight / 2,
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

  private startDirections(route: DirectionRoute, playground: Playground) {
    this.currentRouteDirection = route
    const routeCoords = route.geometry.coordinates
    this.mapView.addRoute(routeCoords)
    this.currentPlayground = playground

    this.locationService.registerListener((location) => {
      if (!location || !location.coords) return
      this.mapView.userPosition.next(location)
    })

    const offset = this.directionsModalView.nativeElement
      ? this.directionsModalView.nativeElement.offsetHeight
      : 150
    this.mapView.additionalTopMapPadding.next(offset)
  }

  private async toggleUserLocation(requestPermission: boolean) {
    this.usesCurrentLocation = !this.usesCurrentLocation
    if (this.usesCurrentLocation) {
      const canUseLocation = await this.locationService.canUseLocation(
        requestPermission
      )
      if (!canUseLocation) {
        this.usesCurrentLocation = false
        return
      }
      const location = await this.locationService.getCurrentLocation()
      if (location && location.coords) {
        this.mapView.updateMarkerMode(MarkerMode.userLocation)
        this.mapView.userPosition.next(location)
        this.markerLngLat = [
          location.coords.longitude,
          location.coords.latitude,
        ]
        this.mapView.flyTo(this.markerLngLat)
        this.headingService.registerListener((heading) => {
          this.mapView.userHeading.next(heading)
        })
      }
    } else {
      this.headingService.removeListener()
      this.mapView.updateMarkerMode(MarkerMode.marker)
    }
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
    this.invalidateSearchParams()
    this.mapView.updateUI()
  }

  onSearchToggle() {
    this.isSearchActive = !this.isSearchActive
    const h = this.isSearchActive
      ? this.searchModalView.nativeElement.offsetHeight
      : 0
    this.mapView.additionalTopMapPadding.next(h)
  }

  onDirectionClear() {
    this.currentRouteDirection = undefined
    this.isNavigating = false
    this.mapView.updateMapMode(MapMode.search)
    this.locationService.removeListener()
  }

  onNavigateToggle() {
    this.isNavigating = !this.isNavigating
    const mode = this.isNavigating ? MapMode.navigateRoute : MapMode.route
    this.mapView.updateMapMode(mode)
  }

  onInstructionClick(i: number) {
    if (!this.mapView.isMapInteractionEnabled.value) return
    const maneuvers = this.directionManuevers
    if (maneuvers && maneuvers.length > i) {
      const m = maneuvers[i]
      this.mapView.additionalTopMapPadding.next(
        this.directionsModalView.nativeElement.offsetHeight
      )
      this.mapView.flyTo(m.location, 18, 50, m.bearing_before)
    }
  }

  async onCurrentLocationToggle() {
    await this.toggleUserLocation(true)
  }
}
