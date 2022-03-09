import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { TabsPage } from './tabs.page'

export enum Tab {
  Map = 'map',
  List = 'list',
  Settings = 'settings',
}

const routes: Routes = [
  {
    path: Tab.Map,
    component: TabsPage,
    children: [
      {
        path: Tab.Map,
        loadChildren: () =>
          import('../map/map.module').then((m) => m.MapModule),
      },
      {
        path: Tab.List,
        loadChildren: () =>
          import('../list/list.module').then((m) => m.ListModule),
      },
      {
        path: Tab.Settings,
        loadChildren: () =>
          import('../settings/settings.module').then((m) => m.SettingsModule),
      },
      {
        path: '',
        redirectTo: Tab.Map,
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: Tab.Map,
    pathMatch: 'full',
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
