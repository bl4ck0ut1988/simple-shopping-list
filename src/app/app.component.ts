import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { AngularFirestore, CollectionReference } from 'angularfire2/firestore';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'simple-shopping-list';

  itemName = '';
  quantity = null;
  items: Observable<any[]>;
  // test 123

  constructor(
    private db: AngularFirestore,
    // private cr: CollectionReference,
    private swUpdate: SwUpdate
  ) {
    swUpdate.available.subscribe(() => {});
    this.items = db.collection('items').valueChanges();
  }

  onSubmit(): void {
    // this.db.collection('/items').push({ content: this.itemValue });
    this.db.collection('items').add({name: this.itemName, quantity: this.quantity});
    this.itemName = '';
    this.quantity = null;
  }

  onDelete(): void {
    // TODO: Delete collection
  }
}
