import { IonicModule } from '@ionic/angular'
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ListPage } from './list.page'

import { ListPageRoutingModule } from './list-routing.module'
import { PlaygroundService } from '../service/playground-service/playground.service'
import { HttpClientModule } from '@angular/common/http'

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ListPageRoutingModule,
    HttpClientModule,
  ],
  providers: [PlaygroundService],
  declarations: [ListPage],
})
export class Tab2PageModule {}
