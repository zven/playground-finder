import { AfterViewInit, Component } from '@angular/core'
import { distance } from '@turf/turf'
import {
  Playground,
  PlaygroundResult,
  PlaygroundService,
} from '../service/playground-service/playground.service'

@Component({
  selector: 'app-list',
  templateUrl: 'list.page.html',
  styleUrls: ['list.page.scss'],
})
export class ListPage implements AfterViewInit {
  playgroundResult: PlaygroundResult
  constructor(private playgroundService: PlaygroundService) {}

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
}
