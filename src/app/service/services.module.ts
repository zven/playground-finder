import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { LocationManagementService } from './location-management/location-management.service'
import { LocationService } from './location/location.service'
import { PlaygroundService } from './playground-service/playground.service'
import { ReverseGeocodingService } from './reverse-geocoding/reverse-geocoding.service'

@NgModule({
  providers: [
    // service dependencies
    PlaygroundService,
    ReverseGeocodingService,
    LocationService,
    LocationManagementService,
  ],
  imports: [CommonModule, HttpClientModule],
})
export class ServicesModule {}
