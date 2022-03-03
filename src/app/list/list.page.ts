import { AfterViewInit, Component } from '@angular/core'
import {
  Playground,
  PlaygroundService,
} from '../service/playground-service/playground.service'

@Component({
  selector: 'app-list',
  templateUrl: 'list.page.html',
  styleUrls: ['list.page.scss'],
})
export class ListPage implements AfterViewInit {
  playgrounds: Playground[] = []
  constructor(private playgroundService: PlaygroundService) {}

  ngAfterViewInit(): void {
    const cachedResult = this.playgroundService.loadCachedPlaygroundResult()
    if (cachedResult) {
      this.playgrounds = cachedResult.playgrounds
    }
  }
}
