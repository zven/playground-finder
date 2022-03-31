import { Injectable } from '@angular/core'
import {
  DeviceOrientation,
  DeviceOrientationCompassHeading,
} from '@awesome-cordova-plugins/device-orientation/ngx'
import { Subscription } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class HeadingService {
  private subscription: Subscription
  private lastHeadingTimestamp: number = 0
  private static HEADING_REPORT_INTERVAL = 50

  constructor(private deviceOrientation: DeviceOrientation) {}

  async registerListener(callback: (heading: number) => void) {
    if (this.subscription) return
    this.subscription = this.deviceOrientation
      .watchHeading()
      .subscribe((data: DeviceOrientationCompassHeading) => {
        const timestamp = Date.now()
        if (
          timestamp - this.lastHeadingTimestamp >
          HeadingService.HEADING_REPORT_INTERVAL
        ) {
          this.lastHeadingTimestamp = timestamp
          callback(data.trueHeading)
        }
      })
  }

  // Remove all listeners
  removeListener() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = undefined
    }
  }
}
