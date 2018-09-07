import { Component, Inject, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { SetValueDialogComponent } from './dialogs/set-value-dialog.component';
import { MatDialog, MatIconRegistry } from '@angular/material';
import { AngularFireDatabase } from 'angularfire2/database';
import {DomSanitizer} from '@angular/platform-browser';
import { Observable, Subscription } from 'rxjs';
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

  // Add Item Dialog Props
  itemName = '';
  quantity = this.defaultQuantity;

  // Selected List Props
  selectedList: AngularFirestoreDocument<ShoppingList>;
  selectedListId: string;
  selectedListName = MyGlobals.DEFAULT_LIST_TITLE;
  selectedListItems: any[] = [];
  selectedListSubscription: Subscription;

  editMode = false;
  listLoading = false;

  listsObject: any = {};
  listsArray: any[] = [];

  itemCollection: AngularFirestoreCollection<any>;

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
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer
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

    this.itemCollection.snapshotChanges().subscribe(changes => {
      changes.forEach(change => {
        const listId = change.payload.doc.id;
        this.listsObject[listId] = change.payload.doc.data().name;
        this.listsArray.push(
          {
            id: listId,
            data: change.payload.doc.data().name
          }
        );
      });

      console.log('listsObject:', this.listsObject);
      console.log('listsArray:', this.listsArray);
    });

    this.setSelectedListAndSubscribe('testList');
  }

  openSetTitleDialog(): void {
    const dialogRef = this.dialog.open(SetValueDialogComponent, {
      width: '250px',
      data: {
        title: 'Rename List',
        defaultValue: this.selectedListName,
        actionButtonLabel: 'Rename'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedListName = result;
        this.setDocument(this.selectedListId, this.selectedListName, this.selectedListItems);
      }
    });
  }

  openAddListDialog(): void {
    const dialogRef = this.dialog.open(SetValueDialogComponent, {
      width: '250px',
      data: {
        title: 'Add New List',
        defaultValue: '',
        actionButtonLabel: 'Add List'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createDocument(result, []);
      }
    });
  }

  onAddItem(): void {
    this.listLoading = true;

    const tempList = this.selectedListItems.concat();
    tempList.push({ name: this.itemName, quantity: this.quantity });

    this.setDocument(this.selectedListId, this.selectedListName, tempList)
    .then(() => {
      this.resetAddItemFields();
      this.listLoading = false;
    });
  }

  private setDocument(id: string, listName: string, items: any[]): Promise<void> {
    return this.itemCollection.doc(id).set({
      list: items,
      name: listName
    });
  }

  private createDocument(listName: string, items: any[]) {
    // TODO: add loading indicator on top level
    const id = this.afs.createId();
    this.setDocument(id, listName, items).then(() => {
      // reset top level loading indicator
      this.setSelectedListAndSubscribe(id);
    });
  }

  private setSelectedListAndSubscribe(listId: string): void {
    if (this.selectedListSubscription) {
      this.selectedListSubscription.unsubscribe();
    }

    this.selectedList = this.itemCollection.doc(listId);

    this.selectedListSubscription = this.selectedList.valueChanges().subscribe(list => {
      if (list) {
        this.selectedListName = list.name;
        this.selectedListId = listId;
        this.selectedListItems = list.list;
      }
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
    this.selectedList = this.afs.doc('lists/testList');

    if (this.selectedList) {
      this.selectedListName = MyGlobals.DEFAULT_LIST_TITLE;
      this.selectedListItems = [];
      this.selectedList.delete();
    }
  }

  formatItemString(item: any): string {
    return `${item.quantity}x ${item.name}`;
  }
}
