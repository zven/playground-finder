export enum MapMode {
  search,
  route,
  navigateRoute,
}

export enum MarkerMode {
  marker,
  userLocation,
}

export enum MapSource {
  playgrounds = 'playgrounds-source',
  privatePlaygrounds = 'private-playgrounds-source',
  playgroundsBounds = 'playgrounds-bounds-source',
  playgroundsBoundsOutline = 'playgrounds-bounds-outline-source',
  markerHalo = 'marker-halo-source',
  markerHaloOutline = 'marker-halo-outline-source',
  route = 'route-source',
  routeStart = 'route-start-source',
  routeEnd = 'route-end-source',
  userLocation = 'user-location-source',
  userLocationHalo = 'user-location-halo-source',
}

export enum MapIcon {
  playgrounds = 'playgrounds-icon',
  privatePlaygrounds = 'private-playgrounds-icon',
  routeStart = 'route-start-icon',
  routeEnd = 'route-end-icon',
  userLocation = 'user-location-icon',
  userLocationDirection = 'user-location-direction-icon',
}
