import { Component } from '@angular/core'
import { IonRouterOutlet, ModalController } from '@ionic/angular'
import {
  LocationOption,
  LocationOptionType,
} from '../service/location-management/location-management'
import { LocationManagementService } from '../service/location-management/location-management.service'
import { SettingsDetailComponent } from './settings-detail/settings-detail/settings-detail.component'

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
})
export class SettingsPage {
  locationOptions: LocationOption[]

  constructor(
    private locationManagementService: LocationManagementService,
    private modalController: ModalController,
    private routerOutlet: IonRouterOutlet
  ) {
    this.locationManagementService.locationOptions.subscribe((newOptions) => {
      this.locationOptions = newOptions
    })
  }

  getTitle(type: LocationOptionType): string {
    return LocationOptionType.title(type)
  }

  getSubtitle(type: LocationOptionType): string {
    return LocationOptionType.subtitle(type)
  }

  getDescription(type: LocationOptionType): string {
    return LocationOptionType.description(type)
  }

  getIcon(type: LocationOptionType): string {
    return LocationOptionType.icon(type)
  }

  getType(type: LocationOptionType): string {
    return LocationOptionType.dataType(type)
  }

  getRange(type: LocationOptionType): [number, number] {
    return LocationOptionType.range(type)
  }

  getValueLabel(option: LocationOption): string {
    if (typeof option.value !== 'number') {
      return ''
    }
    switch (option.type) {
      case LocationOptionType.accuracy:
        if (option.value <= 0) {
          return 'Unlimited'
        } else if (option.value < 1000) {
          return `${option.value.toFixed(0)}m`
        }
        return `${(option.value / 1000).toFixed(0)}km`
      case LocationOptionType.interval:
        if (option.value <= 0) {
          return 'Unlimited'
        } else if (option.value < 60) {
          return `${option.value.toFixed(0)}s`
        } else if (option.value >= 60 && option.value < 600) {
          const mins = Math.floor(option.value / 60)
          const secs = (option.value / 60 - mins) * 60
          const secsString = `${secs.toFixed(0)}`
          const leadingZeroForSecs = secsString.length < 2 ? '0' : ''
          return `${mins}:${leadingZeroForSecs}${secsString}min`
        } else if (option.value >= 600 && option.value < 3600) {
          return `${Math.floor(option.value / 60)}min`
        }
        return `${(option.value / 60 / 60).toFixed(0)}h`
      default:
        return ''
    }
  }

  async showDetails(type: LocationOptionType) {
    const modal = await this.modalController.create({
      component: SettingsDetailComponent,
      presentingElement: this.routerOutlet.nativeEl,
      swipeToClose: true,
      cssClass: 'auto-height',
      componentProps: {
        title: this.getTitle(type),
        subtitle: this.getSubtitle(type),
        description: this.getDescription(type),
        icon: this.getIcon(type),
      },
    })
    modal.present()
  }

  onOptionChange() {
    this.locationManagementService.locationOptions.next(this.locationOptions)
  }
}
