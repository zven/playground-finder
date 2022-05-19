import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { PrivacyConfigurationComponent } from '@simport/location-privacy-toolkit'
import { SettingsPage, SettingsRoute } from './settings.page'

const routes: Routes = [
  {
    path: SettingsRoute.mainSettings,
    component: SettingsPage,
  },
  {
    path: SettingsRoute.locationPrivacySettings,
    component: PrivacyConfigurationComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class SettingsPageRoutingModule {}
