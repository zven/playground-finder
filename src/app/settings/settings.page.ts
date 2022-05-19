import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { TabRoute } from '../tabs/tabs.page'

export enum SettingsRoute {
  mainSettings = '',
  locationPrivacySettings = 'location-privacy',
}

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
})
export class SettingsPage {
  constructor(private router: Router) {}

  async openLocationPrivacySettings() {
    this.router.navigate([
      `${TabRoute.root}/${TabRoute.settings}/${SettingsRoute.locationPrivacySettings}`,
    ])
  }
}
