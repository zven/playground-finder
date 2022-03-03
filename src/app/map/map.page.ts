import { Component, OnInit } from '@angular/core'
import { ToastButton, ToastController } from '@ionic/angular'
import {
  Playground,
  PlaygroundResult,
  PlaygroundService,
} from '../service/playground-service/playground.service'

import * as MapboxGl from 'mapbox-gl'
import * as Turf from '@turf/turf'

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
})
export class MapPage implements OnInit {
  private mapboxToken = 'API_KEY'
  private map: MapboxGl.Map

  isLoading: boolean = false
  isSearchActive: boolean = true
  searchRange: number = 2000

  formattedSearchRange(): string {
    return `${(this.searchRange / 1000).toFixed(1)} km`
  }

  currentLatLngString(): string {
    if (this.currentPlaygroundResult) {
      return `${this.currentPlaygroundResult.lat.toFixed(3)} /
        ${this.currentPlaygroundResult.lon.toFixed(3)}`
    }
    return ''
  }

  currentPlaygroundResult: PlaygroundResult = undefined

  constructor(
    private playgroundService: PlaygroundService,
    private toastController: ToastController
  ) {
    MapboxGl.accessToken = this.mapboxToken
  }

  ngOnInit() {
    this.map = new MapboxGl.Map({
      container: 'mapbox',
      style: 'mapbox://styles/mapbox/streets-v11',
      zoom: 12,
      center: [7.6277627964892165, 51.963484569674435],
    })

    this.map.on('load', () => {
      this.map.resize()
      window['map'] = this.map

      this.map.loadImage('assets/pin.png', (error, image) => {
        if (error) throw error
        this.map.addImage('pin-icon', image)
      })
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
        this.searchRange = cachedResult.searchRange
        this.addPlaygroundResultToMap(cachedResult)
      }
    })

    this.map.on('click', async (e) => {
      await this.loadPlaygrounds(e.lngLat.lat, e.lngLat.lng)
    })
  }

  private async loadPlaygrounds(lat: number, lon: number) {
    if (this.isLoading) {
      return
    }
    this.addPinToMap(lat, lon)
    this.isLoading = true
    this.playgroundService.loadPlaygroundWithLatLng(
      lat,
      lon,
      this.searchRange,
      async (success, result) => {
        this.isLoading = false
        if (success && result) {
          this.addPlaygroundResultToMap(result)
          if (result.playgrounds.length === 0) {
            await this.showNoPlaygroundsToast()
          }
        } else {
          await this.showRequestFailedToast(async () => {
            await this.loadPlaygrounds(lat, lon)
          })
        }
      }
    )
  }

  private addPlaygroundResultToMap(result: PlaygroundResult) {
    this.currentPlaygroundResult = result
    this.addPinToMap(result.lat, result.lon)
    this.addPlaygroundsToMap(
      result.playgrounds.filter((p) => p.isPrivate),
      true
    )
    this.addPlaygroundsToMap(
      result.playgrounds.filter((p) => !p.isPrivate),
      false
    )
    this.map.fitBounds(result.boundingBox, {
      padding: 20,
    })
  }

  private addPinToMap(lat: number, lon: number) {
    const pinSource = this.map.getSource('pin')
    const pinData = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat],
      },
    }
    if (pinSource) {
      pinSource.setData(pinData)
    } else {
      this.map.addSource('pin', {
        type: 'geojson',
        data: pinData,
      })
    }
    if (!this.map.getLayer('pin')) {
      this.map.addLayer({
        id: 'pin',
        type: 'symbol',
        source: 'pin',
        layout: {
          'icon-image': 'pin-icon',
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
          'icon-size': 0.3,
        },
      })
    }

    const radiusData = Turf.circle(
      Turf.point([lon, lat]),
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

  async didTapSearch() {
    this.isSearchActive = !this.isSearchActive
  }

  didTapCancelSearch() {
    this.isSearchActive = false
  }

  didChangeSearchRange() {
    if (this.currentPlaygroundResult) {
      this.addPinToMap(
        this.currentPlaygroundResult.lat,
        this.currentPlaygroundResult.lon
      )
    }
  }

  private async showRequestFailedToast(repeatHandler: () => void) {
    const button: ToastButton = {
      text: 'Retry',
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
}
