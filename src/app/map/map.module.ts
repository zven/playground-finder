import { IonicModule } from '@ionic/angular'
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { MapPage } from './map.page'

import { MapPageRoutingModule } from './map-routing.module'
import { PlaygroundService } from '../service/playground-service/playground.service'
import { HttpClientModule } from '@angular/common/http'
import { ReverseGeocodingService } from '../service/reverse-geocoding/reverse-geocoding.service'

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    MapPageRoutingModule,
    HttpClientModule,
  ],
  providers: [PlaygroundService, ReverseGeocodingService],
  declarations: [MapPage],
})
export class Tab1PageModule {}
