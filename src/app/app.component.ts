import { Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { AngularFirestore, CollectionReference, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs';

interface ShoppingList {
  list: any[];
  name: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'simple-shopping-list';

  itemName = '';
  quantity = null;

  itemCollection: AngularFirestoreCollection<any>;
  list: AngularFirestoreDocument<ShoppingList>;
  temporaryItems: any[] = [];
  // test 123

  constructor(
    // private cr: CollectionReference,
    private afs: AngularFirestore,
    private swUpdate: SwUpdate
  ) {}

  ngOnInit(): void {
    this.swUpdate.available.subscribe(() => {});

    this.itemCollection = this.afs.collection('lists');

    // this.itemCollection = this.afs.collection('lists', ref => {
    //   // use query on collection
    //   return ref.where('name', '==', 'firstList');
    // });

    this.itemCollection.valueChanges().subscribe(lists => {
      // this.items = lists[0].list;
      if (lists.length >= 1) {
        this.temporaryItems = lists[0].list;
      } else {
        this.temporaryItems = [];
      }
    });

    this.list = this.afs.doc('lists/testList');

    this.list.valueChanges().subscribe(list => {
      this.temporaryItems = list.list;
    });
  }

  onAddItem(): void {
    this.temporaryItems.push({ name: this.itemName, quantity: this.quantity });
    this.itemName = '';
    this.quantity = null;
  }

  onSave(): void {
    this.itemCollection.doc('testList').set({
      list: this.temporaryItems,
      name: 'testList'
    });
  }

  onDelete(): void {
    this.list = this.afs.doc('lists/testList');

    if (this.list) {
      this.temporaryItems = [];
      this.list.delete();
    }
  }
}
