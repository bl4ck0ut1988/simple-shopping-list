import { Component, Inject, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { AngularFirestore, CollectionReference, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import {MatDialog, MatIconRegistry, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { AngularFireDatabase } from 'angularfire2/database';
import {DomSanitizer} from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { MyGlobals } from './myglobals';

interface ShoppingList {
  list: any[];
  name: string;
}

interface SvgIcon {
  name: string;
  path: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  defaultQuantity = 1;

  itemName = '';
  listName = MyGlobals.DEFAULT_LIST_TITLE;
  quantity = this.defaultQuantity;

  editMode = false;
  listLoading = false;

  itemCollection: AngularFirestoreCollection<any>;
  list: AngularFirestoreDocument<ShoppingList>;
  temporaryItems: any[] = [];

  svgIcons: SvgIcon[] = [
    {
      name: 'chicken-drum-stick',
      path: 'food-chicken-drum-stick.svg'
    },
    {
      name: 'nature-plant',
      path: 'nature-plant-1.svg'
    },
  ];

  constructor(
    // private cr: CollectionReference,
    public dialog: MatDialog,
    private afs: AngularFirestore,
    private swUpdate: SwUpdate,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer
  ) {
    this.svgIcons.forEach(icon => {
      iconRegistry.addSvgIcon(
        icon.name,
        sanitizer.bypassSecurityTrustResourceUrl(`/assets/nova_icons/solid/${icon.path}`));
    });
  }

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
        this.listName = lists[0].name;
      } else {
        this.temporaryItems = [];
      }
    });

    this.list = this.afs.doc('lists/testList');

    this.list.valueChanges().subscribe(list => {
      if (list) {
        this.temporaryItems = list.list;
      }
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ChangeTitleDialogComponent, {
      width: '250px',
      data: {title: this.listName}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.listName = result;
      }
    });
  }

  onAddItem(): void {
    this.listLoading = true;
    this.temporaryItems.push({ name: this.itemName, quantity: this.quantity });

    this.itemCollection.doc('testList').set({
      list: this.temporaryItems,
      name: this.listName
    }).then(() => {
      this.resetAddItemFields();
      this.listLoading = false;
    });
  }

  private resetAddItemFields(): void {
    this.itemName = '';
    this.quantity = this.defaultQuantity;
  }

  onEdit(): void {
    this.editMode = true;
  }

  onDismiss(): void {
    this.editMode = false;
  }

  onClose(): void {
    this.editMode = false;
  }

  onDelete(): void {
    this.list = this.afs.doc('lists/testList');

    if (this.list) {
      this.listName = MyGlobals.DEFAULT_LIST_TITLE;
      this.temporaryItems = [];
      this.list.delete();
    }
  }

  formatItemString(item: any): string {
    return `${item.quantity}x ${item.name}`;
  }
}

@Component({
  selector: 'change-title-dialog-component',
  templateUrl: 'change-title-dialog-component.html',
})
export class ChangeTitleDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ChangeTitleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}
