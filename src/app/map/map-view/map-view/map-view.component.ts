import { Component, Input, OnInit } from '@angular/core'
import {
  Playground,
  PlaygroundResult,
} from '../../../service/playground-service/playground'
import { MapIcon, MapMode, MapSource } from './map'
import { Constants } from 'src/app/utils/constants'

import * as MapboxGl from 'mapbox-gl'
import * as Turf from '@turf/turf'
import { BehaviorSubject } from 'rxjs'

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
  @Input() parent: any

  hasUpdatedSearchParams: boolean = false
  usesCurrentLocation: boolean = false
  markerLngLat: BehaviorSubject<[number, number]> = new BehaviorSubject<
    [number, number]
  >(MapViewComponent.INITIAL_LON_LAT)
  showMarker: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true)
  markerAddress: string
  currentPlaygroundResult: PlaygroundResult = undefined
  currentRoute: any = undefined

  mapMode: MapMode = MapMode.marker

  get mapPadding(): {
    left: number
    right: number
    top: number
    bottom: number
  } {
    return {
      left: 100,
      right: 100,
      top: 100,
      bottom: 100,
    }
  }

  get verticalSheetPadding(): number {
    return window.innerHeight / 2 - 100
  }

  constructor() {
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

      this.loadImage('assets/balloon.png', MapIcon.playgrounds)
      this.loadImage('assets/balloon-lock.png', MapIcon.privatePlaygrounds)
      this.loadImage('assets/start.png', MapIcon.routeStart)
      this.loadImage('assets/stop.png', MapIcon.routeEnd)

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
              bottom: this.verticalSheetPadding,
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
      }).setLngLat(this.markerLngLat.value)

      this.markerLngLat.subscribe((lngLat) => {
        if (marker) marker.setLngLat(lngLat)
      })
      this.showMarker.subscribe((show) => {
        if (show) {
          marker.addTo(this.map)
        } else {
          marker.remove()
        }
      })
      marker.on('drag', () => {
        const lngLat = marker.getLngLat()
        this.addPinRadius([lngLat.lng, lngLat.lat])
      })
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        this.movedMarker([lngLat.lng, lngLat.lat])
      })
      this.map.on('click', async (e) => {
        if (!this.showMarker.value) return
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

  private loadImage(path: string, name: string) {
    this.map.loadImage(path, (error, image) => {
      if (error) console.log(`loading image failed: ${error}`)
      this.map.addImage(name, image)
    })
  }

  updateUI() {
    this.toggleUIMode(this.mapMode)
  }

  toggleUIMode(mode: MapMode) {
    this.mapMode = mode
    switch (mode) {
      case MapMode.marker:
        this.showMarker.next(true)
        this.addPinRadius(this.markerLngLat.value)
        this.addPlaygroundResultToMap()
        this.removeLayersAndSources([
          MapSource.route,
          MapSource.routeStart,
          MapSource.routeEnd,
        ])
        this.zoomToPlaygrounds()
        break
      case MapMode.route:
        this.addRouteToMap()
        this.addRouteIcon(true)
        this.addRouteIcon(false)
        this.showMarker.next(false)
        this.removeLayersAndSources([
          MapSource.markerHalo,
          MapSource.markerHaloOutline,
          MapSource.playgrounds,
          MapSource.privatePlaygrounds,
          MapSource.playgroundsBoundsOutline,
          MapSource.playgroundsBounds,
        ])
        this.zoomToRoute()
        break
    }
  }
  private removeLayersAndSources(layersAndSources: string[]) {
    layersAndSources.forEach((l) => {
      try {
        this.map.removeLayer(l)
      } catch (e) {}
    })
    layersAndSources.forEach((s) => {
      try {
        this.map.removeSource(s)
      } catch (e) {}
    })
  }

  movedMarker(lngLat: [number, number]) {
    this.markerLngLat.next(lngLat)
    this.addPinRadius()
    this.hasUpdatedSearchParams = true
    this.usesCurrentLocation = false
  }

  addResult(result: PlaygroundResult) {
    if (this.map) {
      this.currentPlaygroundResult = result
      this.map.once('idle', () => {
        if (result && result.lon && result.lat) {
          this.markerLngLat.next([result.lon, result.lat])
          this.addPlaygroundResultToMap()
          this.addPinRadius()
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

  private addPlaygroundResultToMap() {
    const result = this.currentPlaygroundResult
    if (!result || !result.lon || !result.lat) return

    this.addPlaygroundsBounds(result.playgrounds)
    this.addPlaygrounds(
      result.playgrounds.filter((p) => p.isPrivate),
      true
    )
    this.addPlaygrounds(
      result.playgrounds.filter((p) => !p.isPrivate),
      false
    )
  }

  private addPinRadius(lngLat: [number, number] = undefined) {
    if (!this.showMarker.value) return
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
        id: MapSource.markerHaloOutline,
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

  private addPlaygrounds(playgrounds: Playground[], isPrivate: boolean) {
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

  private addPlaygroundsBounds(playgrounds: Playground[]) {
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
        id: MapSource.playgroundsBoundsOutline,
        type: 'line',
        source: MapSource.playgroundsBounds,
        paint: {
          'line-color': '#FFBB01',
          'line-width': 3,
        },
      })
    }
    this.zoomToPlaygrounds()
  }

  private zoomToPlaygrounds() {
    try {
      const playgroundsBoundsSource = this.map.getSource(
        MapSource.playgroundsBounds
      )
      if (!playgroundsBoundsSource) return
      const playgroundBoundsFeatures = playgroundsBoundsSource.getData()
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

  addRoute(route: any) {
    this.currentRoute = route
    this.toggleUIMode(MapMode.route)
  }

  private async addRouteToMap() {
    const route = this.currentRoute
    if (!route) return
    const geojson = {
      type: 'Feature',
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
        'line-color': '#3887de',
        'line-width': 6,
        'line-opacity': 0.75,
      },
    })
  }

  private addRouteIcon(isStartIcon: boolean) {
    const route = this.currentRoute
    if (!route) return
    const coordinates = isStartIcon ? route[0] : route[route.length - 1]
    const geojson = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates,
      },
    }
    const iconSource = isStartIcon ? MapSource.routeStart : MapSource.routeEnd
    const source = this.map.getSource(iconSource)
    if (source) {
      source.setData(geojson)
    }
    this.map.addLayer({
      id: iconSource,
      type: 'symbol',
      source: {
        type: 'geojson',
        data: geojson,
      },
      layout: {
        'icon-image': isStartIcon ? MapIcon.routeStart : MapIcon.routeEnd,
        'icon-anchor': 'center',
        'icon-size': 0.2,
      },
    })
  }

  private zoomToRoute() {
    const route = this.currentRoute
    if (!route) return
    var bounds = route.reduce(function (bounds, coord) {
      return bounds.extend(coord)
    }, new MapboxGl.LngLatBounds(route[0], route[1]))
    this.map.fitBounds(bounds, {
      padding: {
        top: this.verticalSheetPadding,
        bottom: 0,
        left: 0,
        right: 0,
      },
    })
  }

  private async openPlaygroundDetails(id: number) {
    const playground = this.currentPlaygroundResult.playgrounds.find(
      (p) => p.id === id
    )
    if (playground) {
      this.parent.openPlaygroundDetails(playground)
    }
  }
}
