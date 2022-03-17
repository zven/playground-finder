import { IonicModule } from '@ionic/angular'
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { MapPage } from './map.page'
import { MapPageRoutingModule } from './map-routing.module'
import { PlaygroundDetailComponent } from '../playground-detail/playground-detail.component'
import { MapViewComponent } from './map-view/map-view/map-view.component'

@NgModule({
  imports: [IonicModule, CommonModule, FormsModule, MapPageRoutingModule],
  providers: [],
  declarations: [MapPage, MapViewComponent, PlaygroundDetailComponent],
})
export class MapModule {}
