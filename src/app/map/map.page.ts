import { Component, OnInit } from '@angular/core'
import { ToastButton, ToastController } from '@ionic/angular'
import {
  Playground,
  PlaygroundResult,
  PlaygroundService,
} from '../service/playground-service/playground.service'

import * as MapboxGl from 'mapbox-gl'
import * as Turf from '@turf/turf'
import { ReverseGeocodingService } from '../service/reverse-geocoding/reverse-geocoding.service'

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

  currentPlaygroundResult: PlaygroundResult = undefined

  constructor(
    private playgroundService: PlaygroundService,
    private geocodingService: ReverseGeocodingService,
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
        this.map.addImage('playground-icon', image)
      })
      this.map.loadImage('assets/balloon-lock.png', (error, image) => {
        if (error) throw error
        this.map.addImage('private-playground-icon', image)
      })
      this.map.loadImage('assets/bounding-box.png', (error, image) => {
        if (error) throw error
        this.map.addImage('bounding-box', image)
      })

      const cachedResult = this.playgroundService.loadCachedPlaygroundResult()
      if (cachedResult) {
        this.markerLngLat = [cachedResult.lon, cachedResult.lat]
        this.searchRange = cachedResult.searchRange
        this.addPlaygroundResultToMap(cachedResult)
        this.addPinRadiusToMap()
        this.runGeocoding()
      } else {
        this.markerLngLat = MapPage.INITIAL_LON_LAT
      }

      const marker = new MapboxGl.Marker({
        draggable: true,
        color: '#FFBB01',
      })
        .setLngLat(this.markerLngLat)
        .addTo(this.map)

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        this.markerLngLat = [lngLat.lng, lngLat.lat]
        this.runGeocoding()
        this.addPinRadiusToMap()
        this.hasUpdatedSearchParams = true
      })

      this.map.on('click', async (e) => {
        this.markerLngLat = [e.lngLat.lng, e.lngLat.lat]
        marker.setLngLat(this.markerLngLat)
        this.runGeocoding()
        this.addPinRadiusToMap()
        this.hasUpdatedSearchParams = true
      })
    })
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
    this.addPlaygroundsToMap(
      result.playgrounds.filter((p) => p.isPrivate),
      true
    )
    this.addPlaygroundsToMap(
      result.playgrounds.filter((p) => !p.isPrivate),
      false
    )
    const padding = {
      left: 50,
      right: 50,
      top: this.isSearchActive ? 250 : 100,
      bottom: 100,
    }
    this.map.fitBounds(result.boundingBox, {
      padding,
    })
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
    const radiusSource = this.map.getSource('pin-radius')
    if (radiusSource) {
      radiusSource.setData(radiusData)
    } else {
      this.map.addSource('pin-radius', {
        type: 'geojson',
        data: radiusData,
      })
    }

    if (!this.map.getLayer('pin-radius')) {
      this.map.addLayer({
        id: 'pin-radius',
        type: 'fill',
        source: 'pin-radius',
        paint: {
          'fill-color': '#0084db',
          'fill-opacity': 0.1,
        },
      })
      this.map.addLayer({
        id: 'pin-radius-outline',
        type: 'line',
        source: 'pin-radius',
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
        },
      }
    })
    const source = isPrivate ? 'private-playgrounds' : 'playgrounds'
    const icon = isPrivate ? 'private-playground-icon' : 'playground-icon'
    const playgroundsData = {
      type: 'FeatureCollection',
      features: playgroundFeatures,
    }
    const playgroundsSource = this.map.getSource(source)
    if (playgroundsSource) {
      playgroundsSource.setData(playgroundsData)
    } else {
      this.map.addSource(source, {
        type: 'geojson',
        data: playgroundsData,
      })
    }
    if (!this.map.getLayer(source)) {
      this.map.addLayer({
        id: source,
        type: 'symbol',
        source: source,
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

  async didTapSearchPlaygrounds() {
    await this.loadPlaygrounds()
  }

  didChangeSearchRange() {
    if (this.isInitialLoading) {
      this.isInitialLoading = false
      return
    }
    this.hasUpdatedSearchParams = true
    this.addPinRadiusToMap()
  }

  didToggleSearch() {
    this.isSearchActive = !this.isSearchActive
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
}
