import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { HeadingService } from './heading/heading.service'
import { LocationService } from '@simport/location-privacy-toolkit'
import { PlaygroundService } from './playground-service/playground.service'
import { ReverseGeocodingService } from './reverse-geocoding/reverse-geocoding.service'

@NgModule({
  providers: [
    // service dependencies
    PlaygroundService,
    ReverseGeocodingService,
    LocationService,
    HeadingService,
  ],
  imports: [CommonModule, HttpClientModule],
})
export class ServicesModule {}
