import { Component, Input, OnInit } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { Playground } from '../service/playground-service/playground.service'
import { ReverseGeocodingService } from '../service/reverse-geocoding/reverse-geocoding.service'

@Component({
  selector: 'app-playground-detail',
  templateUrl: './playground-detail.component.html',
  styleUrls: ['./playground-detail.component.scss'],
})
export class PlaygroundDetailComponent implements OnInit {
  @Input() playground: Playground

  isLoadingAddress = false

  constructor(
    private modalController: ModalController,
    private reverseGeocoding: ReverseGeocodingService
  ) {}

  async ngOnInit() {
    // TODO: check if allowed
    if (!this.playground.address) {
      this.isLoadingAddress = true
      const latLng: [number, number] = [
        this.playground.lat,
        this.playground.lon,
      ]
      this.reverseGeocoding.reverseGeocode(latLng, (success, geocoding) => {
        this.isLoadingAddress = false
        if (success) {
          this.playground.address = geocoding.addressDisplayName
        }
      })
    }
  }

  onNavigateClick() {
    alert('navigation')
  }

  onBookmarkClick() {
    alert('bookmark')
  }

  onShareClick() {
    alert('share')
  }

  onCloseClick() {
    this.modalController.dismiss()
  }
}
