import { IonicModule } from '@ionic/angular'
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { SettingsPage } from './settings.page'
import { SettingsPageRoutingModule } from './settings-routing.module'
import { TranslateModule } from '@ngx-translate/core'

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    SettingsPageRoutingModule,
  ],
  declarations: [SettingsPage],
})
export class SettingsModule {}
