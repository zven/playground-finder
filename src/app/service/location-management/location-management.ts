export class LocationOption {
  type: LocationOptionType
  value: any
}

export namespace LocationOptionType {
  export function title(type: LocationOptionType): string {
    return `location-option.${type}.title`
  }

  export function subtitle(type: LocationOptionType): string {
    return `location-option.${type}.subtitle`
  }

  export function description(type: LocationOptionType): string {
    return `location-option.${type}.description`
  }

  export function icon(type: LocationOptionType): string {
    switch (type) {
      case LocationOptionType.accuracy:
        return 'pin-outline'
      case LocationOptionType.interval:
        return 'timer-outline'
      case LocationOptionType.playgrounds:
        return 'balloon-outline'
      case LocationOptionType.navigation:
        return 'navigate-outline'
      case LocationOptionType.addresses:
        return 'book-outline'
    }
  }

  export function group(type: LocationOptionType): LocationOptionGroup {
    switch (type) {
      case LocationOptionType.accuracy:
      case LocationOptionType.interval:
        return LocationOptionGroup.preference
      case LocationOptionType.playgrounds:
      case LocationOptionType.navigation:
      case LocationOptionType.addresses:
        return LocationOptionGroup.useCase
    }
  }

  export function dataType(type: LocationOptionType): LocationOptionDataType {
    switch (type) {
      case LocationOptionType.accuracy:
      case LocationOptionType.interval:
        return LocationOptionDataType.number
      case LocationOptionType.playgrounds:
      case LocationOptionType.navigation:
      case LocationOptionType.addresses:
        return LocationOptionDataType.boolean
    }
  }

  export function range(type: LocationOptionType): [number, number] {
    switch (type) {
      case LocationOptionType.accuracy:
        return [0, 1000]

      case LocationOptionType.interval:
        return [0, 1800]
      case LocationOptionType.playgrounds:
      case LocationOptionType.navigation:
      case LocationOptionType.addresses:
        return [0, 0]
    }
  }
}

export enum LocationOptionType {
  accuracy = 'accuracy',
  interval = 'interval',
  playgrounds = 'playgrounds',
  navigation = 'navigation',
  addresses = 'addresses',
}

export enum LocationOptionDataType {
  boolean = 'boolean',
  number = 'number',
}

enum LocationOptionGroup {
  useCase = 'useCase',
  preference = 'preference',
}
