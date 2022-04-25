import { Component } from '@angular/core'
import { IonRouterOutlet, ModalController } from '@ionic/angular'
import {
  LocationOption,
  LocationOptionType,
  LocationPrivacyLevel,
  LocationQualityLevel,
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

  get currentPrivacyLevel(): LocationPrivacyLevel {
    return LocationOption.combinedPrivacyLevel(this.locationOptions)
  }

  get currentQualityLevel(): LocationQualityLevel {
    return LocationOption.combinedQualityLevel(this.locationOptions)
  }

  get privacyRatingCssClass(): string {
    switch (Math.floor(this.currentPrivacyLevel)) {
      case LocationPrivacyLevel.high:
        return 'icon-high'
      case LocationPrivacyLevel.mediumHigh:
        return 'icon-medium-high'
      case LocationPrivacyLevel.mediumLow:
        return 'icon-medium-low'
      case LocationPrivacyLevel.low:
        return 'icon-low'
    }
  }

  get qualityRatingCssClass(): string {
    switch (Math.floor(this.currentQualityLevel)) {
      case LocationQualityLevel.high:
        return 'icon-high'
      case LocationQualityLevel.mediumHigh:
        return 'icon-medium-high'
      case LocationQualityLevel.mediumLow:
        return 'icon-medium-low'
      case LocationQualityLevel.low:
        return 'icon-low'
    }
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

  getOptionDescription(type: LocationOptionType): string {
    return LocationOptionType.optionDescription(type)
  }

  getIcon(type: LocationOptionType): string {
    return LocationOptionType.icon(type)
  }

  getMinIcon(type: LocationOptionType): string {
    return LocationOptionType.minIcon(type)
  }

  getMaxIcon(type: LocationOptionType): string {
    return LocationOptionType.maxIcon(type)
  }

  getMinLabel(type: LocationOptionType): string {
    const labels = LocationOptionType.stepLabels(type)
    return labels.length > 0 ? LocationOptionType.stepLabels(type)[0] : ''
  }

  getMaxLabel(type: LocationOptionType): string {
    const labels = LocationOptionType.stepLabels(type)
    return labels.length > 0
      ? LocationOptionType.stepLabels(type)[labels.length - 1]
      : ''
  }

  getType(type: LocationOptionType): string {
    return LocationOptionType.dataType(type)
  }

  getSteps(type: LocationOptionType): number[] {
    return LocationOptionType.steps(type)
  }

  getValueLabel(option: LocationOption): string {
    if (typeof option.value !== 'number') {
      return ''
    }
    switch (option.type) {
      case LocationOptionType.accuracy:
      case LocationOptionType.interval:
        return LocationOptionType.stepLabels(option.type)[option.value]
    }
    return ''
  }

  async showLocationOptionDetails(type: LocationOptionType) {
    await this.showDetails(
      this.getTitle(type),
      this.getSubtitle(type),
      this.getDescription(type),
      this.getOptionDescription(type),
      this.getIcon(type)
    )
  }

  private async showRatingDetails(
    baseString: string,
    icon: string,
    iconClass?: string
  ) {
    await this.showDetails(
      `location-option.rating.${baseString}.title`,
      `location-option.rating.${baseString}.subtitle`,
      `location-option.rating.${baseString}.description`,
      `location-option.rating.${baseString}.detailDescription`,
      icon,
      iconClass
    )
  }

  private async showDetails(
    title: string,
    subtitle: string,
    description: string,
    detailDescription: string,
    icon: string,
    iconClass?: string
  ) {
    const modal = await this.modalController.create({
      component: SettingsDetailComponent,
      presentingElement: this.routerOutlet.nativeEl,
      swipeToClose: true,
      cssClass: 'auto-height',
      componentProps: {
        title,
        subtitle,
        description,
        detailDescription,
        icon,
        iconClass,
      },
    })
    await modal.present()
  }

  onOptionChange() {
    this.locationManagementService.locationOptions.next(this.locationOptions)
  }

  async onPrivacyRatingDetailsClick() {
    await this.showRatingDetails(
      'privacy',
      'shield',
      this.privacyRatingCssClass
    )
  }

  async onQualityRatingDetailsClick() {
    await this.showRatingDetails(
      'quality',
      'diamond',
      this.qualityRatingCssClass
    )
  }
}
