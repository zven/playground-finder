import { Component, OnInit } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { SearchComponent } from '../search/search.component'
import {
  Playground,
  PlaygroundService,
} from '../service/playground-service/playground.service'

import * as MapboxGl from 'mapbox-gl'
import { BBox } from '@turf/helpers'

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
})
export class MapPage implements OnInit {
  private mapboxToken = 'API_KEY'
  private map: MapboxGl.Map
  private currentModal: HTMLIonModalElement

  isLoading: boolean = false
  isSearchActive: boolean = false

  constructor(
    private playgroundService: PlaygroundService,
    private modalController: ModalController
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
    })

    this.map.on('click', async (e) => {
      if (this.isLoading) {
        return
      }
      this.addPinToMap(e.lngLat.lng, e.lngLat.lat)
      this.isLoading = true
      this.playgroundService.loadPlaygroundWithLatLng(
        e.lngLat.lng,
        e.lngLat.lat,
        500,
        async (success, result, boundingBox) => {
          this.isLoading = false
          if (success && result) {
            this.addBoundingBoxPolygon(boundingBox)
            this.addPlaygroundsToMap(
              result.filter((p) => p.isPrivate),
              true
            )
            this.addPlaygroundsToMap(
              result.filter((p) => !p.isPrivate),
              false
            )
            this.map.fitBounds(boundingBox, {
              padding: 20,
            })
          }
        }
      )
    })
  }

  private addPinToMap(lon: number, lat: number) {
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
  }

  private addBoundingBoxPolygon(boundingBox: BBox) {
    const boundingBoxData = [
      [boundingBox[0], boundingBox[1]],
      [boundingBox[2], boundingBox[1]],
      [boundingBox[2], boundingBox[3]],
      [boundingBox[0], boundingBox[3]],
    ]
    const boundingBoxSource = this.map.getSource('playgrounds-bounding-box')
    if (boundingBoxSource) {
      boundingBoxSource.setCoordinates(boundingBoxData)
    } else {
      this.map.addSource('playgrounds-bounding-box', {
        type: 'image',
        url: 'assets/bounding-box.png',
        coordinates: boundingBoxData,
      })
    }
    if (!this.map.getLayer('playgrounds-bounding-box')) {
      // Add a new layer to visualize the polygon.
      this.map.addLayer({
        id: 'playgrounds-bounding-box',
        type: 'raster',
        source: 'playgrounds-bounding-box',
        layout: {},
        paint: {
          'raster-fade-duration': 0,
          'raster-opacity': 0.05,
          'raster-contrast': 0.75,
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
    if (this.isSearchActive) {
      await this.openSearchModal()
    }
  }

  didTapCancelSearch() {
    this.isSearchActive = false
    if (this.currentModal) this.currentModal.dismiss()
  }

  async openSearchModal() {
    const modal = await this.modalController.create({
      component: SearchComponent,
      cssClass: 'auto-height',
      swipeToClose: true,
      breakpoints: [0, 0.9],
      initialBreakpoint: 0.9,
    })
    modal.present()

    this.currentModal = modal
  }
}
