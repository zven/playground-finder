import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { TabsPage, TabRoute } from './tabs.page'

const routes: Routes = [
  {
    path: TabRoute.root,
    component: TabsPage,
    children: [
      {
        path: TabRoute.map,
        loadChildren: () =>
          import('../map/map.module').then((m) => m.MapModule),
      },
      {
        path: TabRoute.list,
        loadChildren: () =>
          import('../list/list.module').then((m) => m.ListModule),
      },
      {
        path: TabRoute.settings,
        loadChildren: () =>
          import('../settings/settings.module').then((m) => m.SettingsModule),
      },
      {
        path: '',
        redirectTo: TabRoute.map,
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: TabRoute.root,
    pathMatch: 'full',
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
