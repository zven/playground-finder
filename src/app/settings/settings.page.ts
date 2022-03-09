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
}
