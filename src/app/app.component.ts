import { Component, OnInit, ViewEncapsulation } from '@angular/core'
import { LocationService } from './service/location/location.service'
import SwiperCore, { Pagination, Navigation } from 'swiper'

SwiperCore.use([Pagination, Navigation])

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
  showIntroduction: Boolean = false

  constructor(private locationService: LocationService) {}

  async ngOnInit() {
    await this.requestUserLocation()
  }

  private async requestUserLocation() {
    this.showIntroduction =
      await this.locationService.needsLocationAccessRequest()
  }

  async closeIntroduction() {
    await this.locationService.requestLocationAccess()
    this.showIntroduction = false
  }
}
