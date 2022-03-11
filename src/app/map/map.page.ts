import { Component, OnInit } from '@angular/core'
import { ModalController, ToastButton, ToastController } from '@ionic/angular'
import { PlaygroundService } from '../service/playground-service/playground.service'
import {
  Playground,
  PlaygroundResult,
} from '../service/playground-service/playground'

import * as MapboxGl from 'mapbox-gl'
import * as Turf from '@turf/turf'
import { ReverseGeocodingService } from '../service/reverse-geocoding/reverse-geocoding.service'
import { LocationService } from '../service/location/location.service'
import { MapIcon, MapSource } from './map'
import { PlaygroundDetailComponent } from '../playground-detail/playground-detail.component'

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
})
export class MapPage implements OnInit {
  private mapboxToken = 'API_KEY'
  private map: MapboxGl.Map
  static INITIAL_LON_LAT: [number, number] = [
    7.6277627964892165, 51.963484569674435,
  ]
  static INITIAL_ZOOM = 12

  isInitialLoading: boolean = true
  isLoadingPlaygrounds: boolean = false
  isLoadingMarkerAddress: boolean = false
  isSearchActive: boolean = false
  hasUpdatedSearchParams: boolean = false
  usesCurrentLocation: boolean = false
  searchRange: number = 2000
  markerLngLat: [number, number]
  markerAddress: string

  formattedSearchRange(): string {
    return `${(this.searchRange / 1000).toFixed(1)} km`
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

  mapPadding(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: 100,
      right: 100,
      top: this.isSearchActive ? 300 : 150,
      bottom: 100,
    }
  }

  currentPlaygroundResult: PlaygroundResult = undefined

  constructor(
    private playgroundService: PlaygroundService,
    private locationService: LocationService,
    private geocodingService: ReverseGeocodingService,
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    MapboxGl.accessToken = this.mapboxToken
  }

  ngOnInit() {
    this.map = new MapboxGl.Map({
      container: 'mapbox',
      style: 'mapbox://styles/mapbox/streets-v11',
      zoom: MapPage.INITIAL_ZOOM,
      center: MapPage.INITIAL_LON_LAT,
    })

    this.map.on('load', () => {
      this.map.resize()
      window['map'] = this.map

      this.map.loadImage('assets/balloon.png', (error, image) => {
        if (error) throw error
        this.map.addImage(MapIcon.playgrounds, image)
      })
      this.map.loadImage('assets/balloon-lock.png', (error, image) => {
        if (error) throw error
        this.map.addImage(MapIcon.privatePlaygrounds, image)
      })

      const cachedResult = this.playgroundService.loadCachedPlaygroundResult()
      if (cachedResult) {
        this.markerLngLat = [cachedResult.lon, cachedResult.lat]
        this.searchRange = cachedResult.radiusMeters
        this.addPlaygroundResultToMap(cachedResult)
        this.addPinRadiusToMap()
        this.runGeocoding()
      } else {
        this.markerLngLat = MapPage.INITIAL_LON_LAT
      }

      // playgrounds
      this.map.on(
        'click',
        [MapSource.playgrounds, MapSource.privatePlaygrounds],
        async (e) => {
          this.map.flyTo({
            center: e.features[0].geometry.coordinates,
            zoom: 17,
            speed: 0.75,
            padding: {
              top: 0,
              bottom: window.innerHeight / 2,
              left: 0,
              right: 0,
            },
          })
          this.openPlaygroundDetails(e.features[0].properties.id)
        }
      )
      this.map.on(
        'mouseenter',
        [MapSource.playgrounds, MapSource.privatePlaygrounds],
        () => {
          this.map.getCanvas().style.cursor = 'pointer'
        }
      )
      this.map.on(
        'mouseleave',
        [MapSource.playgrounds, MapSource.privatePlaygrounds],
        () => {
          this.map.getCanvas().style.cursor = ''
        }
      )

      // positional marker
      const marker = new MapboxGl.Marker({
        draggable: true,
        color: '#FFBB01',
      })
        .setLngLat(this.markerLngLat)
        .addTo(this.map)

      marker.on('drag', () => {
        const lngLat = marker.getLngLat()
        this.markerLngLat = [lngLat.lng, lngLat.lat]
        this.addPinRadiusToMap()
      })
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        this.markerLngLat = [lngLat.lng, lngLat.lat]
        this.runGeocoding()
        this.addPinRadiusToMap()
        this.hasUpdatedSearchParams = true
        this.usesCurrentLocation = false
      })
      this.map.on('click', async (e) => {
        let f = this.map.queryRenderedFeatures(e.point, {
          layers: [MapSource.playgrounds, MapSource.privatePlaygrounds],
        })
        if (f.length) {
          return
        }
        this.markerLngLat = [e.lngLat.lng, e.lngLat.lat]
        marker.setLngLat(this.markerLngLat)
        this.runGeocoding()
        this.addPinRadiusToMap()
        this.hasUpdatedSearchParams = true
        this.usesCurrentLocation = false
      })
    })
  }

  ionViewDidEnter() {
    if (history.state.center) {
      this.map.flyTo({
        padding: this.mapPadding,
        zoom: 18,
        center: history.state.center,
        essential: true,
      })
    }
  }

  private async loadPlaygrounds() {
    if (this.isLoadingPlaygrounds || !this.markerLngLat) {
      return
    }
    this.addPinRadiusToMap()
    this.isLoadingPlaygrounds = true
    this.playgroundService.loadPlaygroundWithLatLng(
      this.markerLngLat[1],
      this.markerLngLat[0],
      this.searchRange,
      async (success, result) => {
        this.isLoadingPlaygrounds = false
        this.hasUpdatedSearchParams = false
        if (success && result) {
          this.addPlaygroundResultToMap(result)
          if (result.playgrounds.length === 0) {
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

  private addPlaygroundResultToMap(result: PlaygroundResult) {
    this.currentPlaygroundResult = result
    this.addPlaygroundsBoundsToMap(result.playgrounds, true)
    this.addPlaygroundsToMap(
      result.playgrounds.filter((p) => p.isPrivate),
      true
    )
    this.addPlaygroundsToMap(
      result.playgrounds.filter((p) => !p.isPrivate),
      false
    )
  }

  private addPinRadiusToMap() {
    if (!this.markerLngLat) {
      return
    }
    const radiusData = Turf.circle(
      Turf.point(this.markerLngLat),
      (this.searchRange / 1000) * 1.1,
      {
        steps: 64,
        units: 'kilometers',
      }
    )
    const radiusSource = this.map.getSource(MapSource.markerHalo)
    if (radiusSource) {
      radiusSource.setData(radiusData)
    } else {
      this.map.addSource(MapSource.markerHalo, {
        type: 'geojson',
        data: radiusData,
      })
    }

    if (!this.map.getLayer(MapSource.markerHalo)) {
      this.map.addLayer({
        id: MapSource.markerHalo,
        type: 'fill',
        source: MapSource.markerHalo,
        paint: {
          'fill-color': '#0084db',
          'fill-opacity': 0.1,
        },
      })
      this.map.addLayer({
        id: MapSource.markerHalo + '-outline',
        type: 'line',
        source: MapSource.markerHalo,
        paint: {
          'line-color': '#0084db',
          'line-width': 3,
          'line-opacity': 0.25,
        },
      })
    }
  }

  private addPlaygroundsToMap(playgrounds: Playground[], isPrivate: boolean) {
    const playgroundFeatures = playgrounds.map((playground) => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [playground.lon, playground.lat],
        },
        properties: {
          title: playground.name,
          id: playground.id,
        },
      }
    })
    const playgroundSource = isPrivate
      ? MapSource.privatePlaygrounds
      : MapSource.playgrounds
    const icon = isPrivate ? MapIcon.privatePlaygrounds : MapIcon.playgrounds
    const playgroundsData = {
      type: 'FeatureCollection',
      features: playgroundFeatures,
    }
    const playgroundsSource = this.map.getSource(playgroundSource)
    if (playgroundsSource) {
      playgroundsSource.setData(playgroundsData)
    } else {
      this.map.addSource(playgroundSource, {
        type: 'geojson',
        data: playgroundsData,
      })
    }
    if (!this.map.getLayer(playgroundSource)) {
      this.map.addLayer({
        id: playgroundSource,
        type: 'symbol',
        source: playgroundSource,
        layout: {
          'icon-image': icon,
          'icon-anchor': 'bottom',
          'icon-size': 0.3,
          // get the title name from the source's "title" property
          'text-field': ['get', 'title'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 0.5],
          'text-anchor': 'top',
        },
      })
    }
  }

  private addPlaygroundsBoundsToMap(
    playgrounds: Playground[],
    fitBounds: boolean
  ) {
    const playgroundBoundsFeatures = playgrounds.map((playground) => {
      if (playground.nodes) {
        let nodes = playground.nodes
        nodes.push(nodes[0])
        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [nodes],
          },
        }
      }
    })
    const playgroundsBoundsData = {
      type: 'FeatureCollection',
      features: playgroundBoundsFeatures,
    }
    const playgroundsBoundsSource = this.map.getSource(
      MapSource.playgroundsBounds
    )
    if (playgroundsBoundsSource) {
      playgroundsBoundsSource.setData(playgroundsBoundsData)
    } else {
      this.map.addSource(MapSource.playgroundsBounds, {
        type: 'geojson',
        data: playgroundsBoundsData,
      })
    }
    if (!this.map.getLayer(MapSource.playgroundsBounds)) {
      this.map.addLayer({
        id: MapSource.playgroundsBounds,
        type: 'fill',
        source: MapSource.playgroundsBounds,
        paint: {
          'fill-color': '#FFBB01',
          'fill-opacity': 0.05,
        },
      })
      this.map.addLayer({
        id: MapSource.playgroundsBounds + '-outline',
        type: 'line',
        source: MapSource.playgroundsBounds,
        paint: {
          'line-color': '#FFBB01',
          'line-width': 3,
        },
      })
    }
    const coordinates = playgroundBoundsFeatures[0].geometry.coordinates
    const bounds = new MapboxGl.LngLatBounds(coordinates[0], coordinates[1])
    playgroundBoundsFeatures.forEach((f) => {
      f.geometry.coordinates.forEach((c) => {
        bounds.extend(c)
      })
    })
    this.map.fitBounds(bounds, {
      padding: this.mapPadding,
    })
  }

  private async openPlaygroundDetails(id: number) {
    const playground = this.currentPlaygroundResult.playgrounds.find(
      (p) => p.id === id
    )
    if (playground) {
      const modal = await this.modalController.create({
        component: PlaygroundDetailComponent,
        breakpoints: [0, 0.5],
        initialBreakpoint: 0.5,
        backdropBreakpoint: 0.5,
        swipeToClose: true,
        backdropDismiss: false,
        componentProps: {
          playground,
        },
      })
      await modal.present()
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

  // Click listeners

  async onSearchPlaygroundsClick() {
    await this.loadPlaygrounds()
  }

  onSearchRangeChange() {
    if (this.isInitialLoading) {
      this.isInitialLoading = false
      return
    }
    this.hasUpdatedSearchParams = true
    this.addPinRadiusToMap()
  }

  onSearchToggle() {
    this.isSearchActive = !this.isSearchActive
  }

  async onCurrentLocationClick() {
    const location = await this.locationService.getCurrentLocation()
    this.markerLngLat = [location.coords.longitude, location.coords.latitude]
    this.runGeocoding()
    this.addPinRadiusToMap()
    this.hasUpdatedSearchParams = true
    this.usesCurrentLocation = true
  }
}
