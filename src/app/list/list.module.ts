import { IonicModule } from '@ionic/angular'
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ListPage } from './list.page'
import { ListPageRoutingModule } from './list-routing.module'

@NgModule({
  imports: [IonicModule, CommonModule, FormsModule, ListPageRoutingModule],
  providers: [],
  declarations: [ListPage],
})
export class ListModule {}
