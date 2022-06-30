import { AfterViewInit, Component } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { distance } from '@turf/turf'
import { PlaygroundService } from '../service/playground-service/playground.service'
import {
  Playground,
  PlaygroundResult,
} from '../service/playground-service/playground'
import { TabRoute } from '../tabs/tabs.page'

@Component({
  selector: 'app-list',
  templateUrl: 'list.page.html',
  styleUrls: ['list.page.scss'],
})
export class ListPage implements AfterViewInit {
  playgroundResult: PlaygroundResult
  constructor(
    private playgroundService: PlaygroundService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngAfterViewInit(): void {
    this.playgroundResult = this.playgroundService.loadCachedPlaygroundResult()
  }

  sortedPlaygrounds(): Playground[] {
    if (this.playgroundResult) {
      return this.playgroundResult.playgrounds.sort((a, b) => {
        return this.getDistance(a) - this.getDistance(b)
      })
    }
    return []
  }

  getDistanceString(playground: Playground): string {
    if (this.playgroundResult) {
      const distance = this.getDistance(playground)
      return `${distance.toFixed(2)} km`
    }
    return 'N/A'
  }

  private getDistance(playground: Playground): number {
    return distance(
      [this.playgroundResult.lon, this.playgroundResult.lat],
      [playground.lon, playground.lat],
      { units: 'kilometers' }
    )
  }

  showPlayground(playground: Playground) {
    this.router.navigate([`../${TabRoute.map}`], {
      relativeTo: this.activatedRoute,
      state: { center: [playground.lon, playground.lat] },
    })
  }

  showMap() {
    this.router.navigate([`../${TabRoute.map}`], {
      relativeTo: this.activatedRoute,
    })
  }
}
