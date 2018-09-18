import { Component, Inject, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { SetValueDialogComponent } from '../dialogs/set-value-dialog.component';
import { SelectValueDialogComponent } from '../dialogs/select-value-dialog.component';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog.component';
import { MatDialog, MatIconRegistry, MatListOption } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, Subscription, forkJoin, combineLatest } from 'rxjs';
import { MyGlobals } from '../myglobals';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { User } from 'firebase';
import { AddOwnerDialogComponent } from './../dialogs/add-owner-dialog.component';

interface CheckList {
  list: any[];
  name: string;
  showQuantityInputs: boolean;
  roles: any;
}

interface SvgIcon {
  name: string;
  path: string;
}

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss']
})
export class ListViewComponent implements OnInit {
  defaultQuantity = '1';

  // Add Item Dialog Props
  itemName = '';
  quantity = this.defaultQuantity;

  // Selected List Props
  public selectedListDocument: AngularFirestoreDocument<CheckList>;
  public selectedList: CheckList;

  selectedListId: string;
  selectedListSubscription: Subscription;
  selectedListUserKeys: string[];

  maxQuantity = 10;

  numbers: string[] = [];

  editMode = false;
  listLoading = false;

  objectRef = Object;

  listsObject: any = {};
  listsArray: any[] = [];
  usersArray: any[] = [];

  private signedInUser: User;

  itemCollection: AngularFirestoreCollection<any>;
  userCollection: AngularFirestoreCollection<any>;

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
    private sanitizer: DomSanitizer,
    private auth: AuthService,
    private router: Router
  ) {
    this.svgIcons.forEach(icon => {
      iconRegistry.addSvgIcon(
        icon.name,
        sanitizer.bypassSecurityTrustResourceUrl(`/assets/nova_icons/solid/${icon.path}`));
    });
  }

  ngOnInit(): void {
    for (let i = 1; i < this.maxQuantity + 1; i++) {
      this.numbers.push(`${i}`);
    }

    this.swUpdate.available.subscribe(() => { });

    this.itemCollection = this.afs.collection('lists');
    this.userCollection = this.afs.collection('users');

    this.userCollection.snapshotChanges().subscribe(changes => {
      changes.forEach(change => {
        this.usersArray.push(
          {
            id: change.payload.doc.id,
            username: change.payload.doc.data().username,
            email: change.payload.doc.data().email
          }
        );
      });

      console.log('usersarray', this.usersArray);
    });

    combineLatest(
      this.itemCollection.snapshotChanges(),
      this.auth.getUser()
    ).subscribe(([snapshotChanges, user]) => {
      this.signedInUser = user;
      console.log('USER', user);

      if (user.uid) {
        this.listsArray = [];
        console.log('CHanges', snapshotChanges);
        snapshotChanges.forEach(change => {
          const roles = change.payload.doc.data().roles;
          if (Object.keys(roles).some(key => {
            return key === user.uid && roles[key] === 'owner';
          })) {
            this.listsArray.push(
              {
                id: change.payload.doc.id,
                name: change.payload.doc.data().name,
                roles: change.payload.doc.data().roles
              }
            );
          }
        });
      }

      console.log('listsArray:', this.listsArray);
    });
  }

  openSetTitleDialog(): void {
    const dialogRef = this.dialog.open(SetValueDialogComponent, {
      width: '250px',
      data: {
        isAddListDialog: false,
        title: 'Rename List',
        placeholder: 'List Title',
        defaultValue: this.selectedList.name,
        actionButtonLabel: 'Rename',
        quantityChecked: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedList.name = result.defaultValue;
        this.setDocument(
          this.selectedListId,
          this.selectedList.name,
          this.selectedList.showQuantityInputs,
          this.selectedList.list,
          this.selectedList.roles);
      }
    });
  }

  openAddListDialog(): void {
    const dialogRef = this.dialog.open(SetValueDialogComponent, {
      width: '250px',
      data: {
        isAddListDialog: true,
        title: 'Add New List',
        placeholder: 'List Title',
        defaultValue: '',
        actionButtonLabel: 'Add List',
        quantityChecked: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const roles = {};
        roles[this.signedInUser.uid] = 'owner';
        this.createDocument(result.defaultValue, result.quantityChecked, [], roles);
      }
    });
  }

  openSelectListDialog(): void {
    const dialogRef = this.dialog.open(SelectValueDialogComponent, {
      width: '250px',
      data: {
        title: 'Select List',
        placeholder: 'List',
        lists: this.listsArray,
        actionButtonLabel: 'Select'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.setSelectedListAndSubscribe(result.id);
      }
    });
  }

  openAddOwnerDialog(): void {
    const dialogRef = this.dialog.open(AddOwnerDialogComponent, {
      width: '250px',
      data: {
        placeholder: 'Username',
        selectedList: this.selectedList,
        users: this.usersArray,
        actionButtonLabel: 'Add'
      }
    });

    dialogRef.afterClosed().subscribe(user => {
      if (user) {
        this.listLoading = true;
        console.log(user);
        this.selectedList.roles[user.id] = 'owner';

        this.setDocument(
          this.selectedListId,
          this.selectedList.name,
          this.selectedList.showQuantityInputs,
          this.selectedList.list,
          this.selectedList.roles)
          .then(() => {
            this.listLoading = false;
          });
      }
    });
  }

  private setDocument(id: string, listName: string, showQuantityInputs: boolean, items: any[], roles: any): Promise<void> {
    return this.itemCollection.doc(id).set({
      list: items,
      name: listName,
      showQuantityInputs: showQuantityInputs,
      roles: roles
    });
  }

  private createDocument(listName: string, showQuantityInputs: boolean, items: any[], roles: any) {
    // TODO: add loading indicator on top level
    const id = this.afs.createId();
    this.setDocument(id, listName, showQuantityInputs, items, roles)
      .then(() => {
        // reset top level loading indicator
        this.setSelectedListAndSubscribe(id);
      })
      .catch(error => {
        console.log('Could not create Document', error);
      });
  }

  private setSelectedListAndSubscribe(listId: string): void {
    if (this.selectedListSubscription) {
      this.selectedListSubscription.unsubscribe();
    }

    this.selectedListDocument = this.itemCollection.doc(listId);

    this.selectedListSubscription = this.selectedListDocument.valueChanges().subscribe(list => {
      if (list) {
        this.selectedListId = listId;
        this.selectedList = list;
      }
    });
  }

  private resetAddItemFields(): void {
    this.itemName = '';
    this.quantity = this.defaultQuantity ? this.defaultQuantity : '1';
  }

  onSelectionChange(event): void {
    const currentOptionsState: MatListOption[] = event.option.selectionList.options._results;
    const tempList = this.selectedList.list.concat();

    if (currentOptionsState) {
      this.listLoading = true;

      // TODO: Check why this isn't working...
      // for (const [index, value] of currentOptionsState.entries()) {
      //   tempList[index].checked = value.selected;
      // }

      for (let i = 0; i < currentOptionsState.length; i++) {
        tempList[i].checked = currentOptionsState[i].selected;
      }

      this.setDocument(
        this.selectedListId,
        this.selectedList.name,
        this.selectedList.showQuantityInputs,
        tempList,
        this.selectedList.roles)
        .then(() => {
          this.listLoading = false;
        });
    }
  }

  onAddItem(): void {
    this.listLoading = true;

    const tempList = this.selectedList.list.concat();
    tempList.push({ name: this.itemName, quantity: this.quantity, checked: false });

    this.setDocument(
      this.selectedListId,
      this.selectedList.name,
      this.selectedList.showQuantityInputs,
      tempList,
      this.selectedList.roles)
      .then(() => {
        this.resetAddItemFields();
        this.listLoading = false;
      });
  }

  moveItemUp(index: number): void {
    this.listLoading = true;

    const tempList = this.selectedList.list.concat();
    const stored = tempList.splice(index, 1);
    tempList.splice(index - 1, 0, stored[0]);

    this.setDocument(
      this.selectedListId,
      this.selectedList.name,
      this.selectedList.showQuantityInputs,
      tempList,
      this.selectedList.roles)
      .then(() => {
        this.listLoading = false;
      });
  }

  moveItemDown(index: number): void {
    this.listLoading = true;

    const tempList = this.selectedList.list.concat();
    const stored = tempList.splice(index, 1);
    tempList.splice(index + 1, 0, stored[0]);

    this.setDocument(
      this.selectedListId,
      this.selectedList.name,
      this.selectedList.showQuantityInputs,
      tempList,
      this.selectedList.roles)
      .then(() => {
        this.listLoading = false;
      });
  }

  onDeleteItem(index: number): void {
    this.listLoading = true;

    const tempList = this.selectedList.list.concat();
    tempList.splice(index, 1);

    this.setDocument(
      this.selectedListId,
      this.selectedList.name,
      this.selectedList.showQuantityInputs,
      tempList,
      this.selectedList.roles)
      .then(() => {
        this.listLoading = false;
      });
  }

  onEditList(): void {
    this.editMode = true;
  }

  onDeleteList(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '250px',
      data: {
        title: 'Really delete this List ?',
        actionButtonLabel: 'Delete',
        buttonColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedListDocument) {
        this.selectedListDocument.delete();
        this.selectedListDocument = null;
        this.selectedList = null;
      }
    });
  }

  onDismiss(): void {
    this.editMode = false;
  }

  onClose(): void {
    this.editMode = false;
  }

  formatItemString(item: any): string {
    if (this.selectedList.showQuantityInputs) {
      return `${item.quantity}x ${item.name}`;
    } else {
      return item.name;
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getUsernameById(id: string): string {
    return this.usersArray.filter(user => {
      return user.id === id;
    })[0].username;
  }
}
