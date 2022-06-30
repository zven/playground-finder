import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { BehaviorSubject } from 'rxjs'
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

  private expertMode: BehaviorSubject<Boolean> = new BehaviorSubject<Boolean>(
    false
  )

  get isExpertModeActive(): Boolean {
    return this.expertMode.value
  }

  set isExpertModeActive(newValue: Boolean) {
    this.expertMode.next(newValue)
  }

  async openLocationPrivacySettings() {
    this.router.navigate([
      `${TabRoute.root}/${TabRoute.settings}/${SettingsRoute.locationPrivacySettings}`,
    ])
  }
}
