import { Component } from '@angular/core'

export enum TabRoute {
  root = 'tabs',
  map = 'map',
  list = 'list',
  settings = 'settings',
}

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage {
  constructor() {}
}
