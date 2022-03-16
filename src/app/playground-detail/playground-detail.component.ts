import { Component, Input, OnInit } from '@angular/core'
import { ModalController, ToastButton, ToastController } from '@ionic/angular'
import { DirectionService } from '../service/direction/direction.service'
import { LocationService } from '../service/location/location.service'
import { Playground } from '../service/playground-service/playground'
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
    private reverseGeocoding: ReverseGeocodingService,
    private locationService: LocationService,
    private directionService: DirectionService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    // TODO: check if allowed
    if (!this.playground.codedAddress) {
      this.isLoadingAddress = true
      const latLng: [number, number] = [
        this.playground.lat,
        this.playground.lon,
      ]
      this.reverseGeocoding.reverseGeocode(latLng, (success, geocoding) => {
        this.isLoadingAddress = false
        if (success) {
          this.playground.codedAddress = geocoding.addressDisplayName
          this.playground.codedLatLon = geocoding.codedLatLon
        }
      })
    }
  }

  async onNavigateClick() {
    const location = await this.locationService.getCurrentLocation()
    if (location && location.coords) {
      const playgroundLonLat: [number, number] = this.playground.codedLatLon
        ? [this.playground.codedLatLon[1], this.playground.codedLatLon[0]]
        : [this.playground.lon, this.playground.lat]
      this.directionService.loadDirections(
        [location.coords.longitude, location.coords.latitude],
        playgroundLonLat,
        async (success, directions) => {
          if (success) {
            this.modalController.dismiss(directions)
          } else if (directions && directions.message) {
            await this.showErrorToast(directions.message)
          } else {
            await this.showNoDirectionsToast()
          }
        }
      )
    } else {
      await this.showNoLocationToast()
    }
  }

  onShareClick() {
    alert('share')
  }

  onCloseClick() {
    this.modalController.dismiss()
  }

  private async showNoLocationToast() {
    const message = 'Unable to retrieve location…'
    const button: ToastButton = {
      icon: 'repeat',
      side: 'end',
      handler: this.onNavigateClick,
    }
    await this.showErrorToast(message, [button])
  }

  private async showNoDirectionsToast() {
    await this.showErrorToast('No route to playground found…')
  }

  private async showErrorToast(message: string, buttons: ToastButton[] = []) {
    const toast = await this.toastController.create({
      icon: 'warning',
      message,
      color: 'danger',
      buttons: buttons,
      duration: 5000,
    })
    await toast.present()
  }
}
