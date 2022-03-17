import { Component, Input, OnInit } from '@angular/core'
import {
  Playground,
  PlaygroundResult,
} from '../../../service/playground-service/playground'
import { MapIcon, MapSource } from './map'
import { Constants } from 'src/app/utils/constants'

import * as MapboxGl from 'mapbox-gl'
import * as Turf from '@turf/turf'
import { BehaviorSubject } from 'rxjs'
import { PlaygroundDetailComponent } from 'src/app/playground-detail/playground-detail.component'
import { Directions } from 'src/app/service/direction/direction'
import { ModalController } from '@ionic/angular'

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss'],
})
export class MapViewComponent implements OnInit {
  private map: MapboxGl.Map
  static INITIAL_LON_LAT: [number, number] = [
    7.6277627964892165, 51.963484569674435,
  ]
  static INITIAL_ZOOM = 12
  @Input() searchRadius: number

  currentPlaygroundResult: PlaygroundResult = undefined
  isInitialLoading: boolean = true
  isLoadingPlaygrounds: boolean = false
  isLoadingMarkerAddress: boolean = false
  isSearchActive: boolean = false
  hasUpdatedSearchParams: boolean = false
  usesCurrentLocation: boolean = false
  markerLngLat: BehaviorSubject<[number, number]> = new BehaviorSubject<
    [number, number]
  >(MapViewComponent.INITIAL_LON_LAT)
  markerAddress: string

  mapPadding(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: 100,
      right: 100,
      top: 100,
      bottom: 100,
    }
  }

  constructor(private modalController: ModalController) {
    MapboxGl.accessToken = Constants.MAPBOX_TOKEN
  }

  ngOnInit() {
    this.map = new MapboxGl.Map({
      container: 'mapbox',
      style: 'mapbox://styles/mapbox/streets-v11',
      zoom: MapViewComponent.INITIAL_ZOOM,
      center: MapViewComponent.INITIAL_LON_LAT,
    })

    this.map.on('load', () => {
      this.map.resize()
      window['map'] = this.map

      this.map.loadImage('assets/balloon.png', (error, image) => {
        if (error) console.log(`loading image failed: ${error}`)
        this.map.addImage(MapIcon.playgrounds, image)
      })
      this.map.loadImage('assets/balloon-lock.png', (error, image) => {
        if (error) console.log(`loading image failed: ${error}`)
        this.map.addImage(MapIcon.privatePlaygrounds, image)
      })

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
              bottom: window.innerHeight / 2 - 100,
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

      this.markerLngLat.subscribe((lngLat) => {
        console.log(lngLat)
        if (marker) marker.setLngLat(lngLat)
      })

      // positional marker
      const marker = new MapboxGl.Marker({
        draggable: true,
        color: '#FFBB01',
      })
        .setLngLat(this.markerLngLat.value)
        .addTo(this.map)

      marker.on('drag', () => {
        const lngLat = marker.getLngLat()
        this.addPinRadiusToMap([lngLat.lng, lngLat.lat])
      })
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        this.movedMarker([lngLat.lng, lngLat.lat])
      })
      this.map.on('click', async (e) => {
        let f = this.map.queryRenderedFeatures(e.point, {
          layers: [MapSource.playgrounds, MapSource.privatePlaygrounds],
        })
        if (f.length) {
          return
        }
        const lngLat = marker.getLngLat()
        this.movedMarker([lngLat.lng, lngLat.lat])
      })
    })
  }

  movedMarker(lngLat: [number, number]) {
    this.markerLngLat.next(lngLat)
    this.addPinRadiusToMap()
    this.hasUpdatedSearchParams = true
    this.usesCurrentLocation = false
  }

  addResult(result: PlaygroundResult) {
    if (this.map) {
      this.map.once('idle', () => {
        if (result && result.lon && result.lat) {
          this.markerLngLat.next([result.lon, result.lat])
          console.log([result.lon, result.lat])
          console.log(this.markerLngLat.getValue())
          this.addPlaygroundResultToMap(result)
          this.addPinRadiusToMap()
        }
      })
    }
  }

  flyTo(center: any, zoom: number = 18) {
    this.map.flyTo({
      padding: this.mapPadding,
      zoom: zoom,
      center: center,
      essential: true,
    })
  }

  addPlaygroundResultToMap(result: PlaygroundResult) {
    this.currentPlaygroundResult = result
    this.addPlaygroundsBoundsToMap(result.playgrounds)
    this.addPlaygroundsToMap(
      result.playgrounds.filter((p) => p.isPrivate),
      true
    )
    this.addPlaygroundsToMap(
      result.playgrounds.filter((p) => !p.isPrivate),
      false
    )
  }

  addPinRadiusToMap(lngLat: [number, number] = undefined) {
    const markerLngLat = lngLat ?? this.markerLngLat.value
    if (!markerLngLat) {
      return
    }
    const radiusData = Turf.circle(
      Turf.point(markerLngLat),
      (this.searchRadius / 1000) * 1.1,
      {
        steps: 64,
        units: 'kilometers',
      }
    )
    const radiusSource = this.map.getSource(MapSource.markerHalo)
    if (radiusSource) {
      radiusSource.setData(radiusData)
    }

    if (!this.map.getLayer(MapSource.markerHalo)) {
      this.map.addLayer({
        id: MapSource.markerHalo,
        type: 'fill',
        source: {
          type: 'geojson',
          data: radiusData,
        },
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

  addPlaygroundsToMap(playgrounds: Playground[], isPrivate: boolean) {
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
    }
    if (!this.map.getLayer(playgroundSource)) {
      this.map.addLayer({
        id: playgroundSource,
        type: 'symbol',
        source: {
          type: 'geojson',
          data: playgroundsData,
        },
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

  addPlaygroundsBoundsToMap(playgrounds: Playground[]) {
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
    }
    if (!this.map.getLayer(MapSource.playgroundsBounds)) {
      this.map.addLayer({
        id: MapSource.playgroundsBounds,
        type: 'fill',
        source: {
          type: 'geojson',
          data: playgroundsBoundsData,
        },
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
    try {
      const coordinates = playgroundBoundsFeatures.find((f) => {
        return f.geometry.coordinates.length >= 2
      }).geometry.coordinates
      const bounds = new MapboxGl.LngLatBounds(coordinates[0], coordinates[1])
      playgroundBoundsFeatures.forEach((f) => {
        f.geometry.coordinates.forEach((c) => {
          bounds.extend(c)
        })
      })
      this.map.fitBounds(bounds, {
        padding: this.mapPadding,
      })
    } catch (e) {}
  }

  async addRouteToMap(route: string) {
    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: route,
      },
    }
    const routeSource = this.map.getSource(MapSource.route)
    if (routeSource) {
      routeSource.setData(geojson)
    }
    this.map.addLayer({
      id: MapSource.route,
      type: 'line',
      source: {
        type: 'geojson',
        data: geojson,
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#3887be',
        'line-width': 5,
        'line-opacity': 0.75,
      },
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
        backdropDismiss: true,
        componentProps: {
          playground,
        },
      })
      modal.onDidDismiss().then(async (data) => {
        const directions: Directions = data.data
        if (directions && directions.routes && directions.routes.length) {
          const route = directions.routes[0].geometry.coordinates
          await this.addRouteToMap(route)
        } else {
          this.flyTo([playground.lon, playground.lat])
        }
      })
      await modal.present()
    }
    this.isSearchActive = false
  }
}
