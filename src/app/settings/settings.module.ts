import { IonicModule } from '@ionic/angular'
import { RouterModule } from '@angular/router'
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { SettingsPage } from './settings.page'

import { SettingsPageRoutingModule } from './settings-routing.module'
import { TranslateModule } from '@ngx-translate/core'
import { SettingsDetailComponent } from './settings-detail/settings-detail/settings-detail.component'

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: SettingsPage }]),
    SettingsPageRoutingModule,
    TranslateModule,
  ],
  declarations: [SettingsPage, SettingsDetailComponent],
})
export class SettingsModule {}
