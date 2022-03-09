import { Component, Input } from '@angular/core'
import { ModalController } from '@ionic/angular'

@Component({
  selector: 'app-settings-detail',
  templateUrl: './settings-detail.component.html',
  styleUrls: ['./settings-detail.component.scss'],
})
export class SettingsDetailComponent {
  @Input() title: string
  @Input() subtitle: string
  @Input() description: string
  @Input() icon: string

  constructor(private modalController: ModalController) {}

  async onCloseClick() {
    await this.modalController.dismiss()
  }
}
