import { IonicModule } from '@ionic/angular'
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { MapPage } from './map.page'

import { MapPageRoutingModule } from './map-routing.module'
import { PlaygroundService } from '../service/playground-service/playground.service'
import { HttpClientModule } from '@angular/common/http'

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    MapPageRoutingModule,
    HttpClientModule,
  ],
  providers: [PlaygroundService],
  declarations: [MapPage],
})
export class Tab1PageModule {}
