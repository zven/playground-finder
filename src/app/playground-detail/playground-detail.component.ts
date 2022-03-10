import { Component, Input } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { Playground } from '../service/playground-service/playground.service'

@Component({
  selector: 'app-playground-detail',
  templateUrl: './playground-detail.component.html',
  styleUrls: ['./playground-detail.component.scss'],
})
export class PlaygroundDetailComponent {
  @Input() playground: Playground

  constructor(private modalController: ModalController) {}

  onCloseClick() {
    this.modalController.dismiss()
  }
}
