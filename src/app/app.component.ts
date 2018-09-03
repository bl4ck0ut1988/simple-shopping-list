import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'simple-shopping-list';
  update = false;

  constructor(swUpdate: SwUpdate) {
    swUpdate.available.subscribe(() => {});
  }
}
