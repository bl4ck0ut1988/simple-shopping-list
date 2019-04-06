import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { SetValueDialogComponent } from '../dialogs/set-value-dialog.component';
import { SelectValueDialogComponent } from '../dialogs/select-value-dialog.component';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog.component';
import { MatDialog, MatIconRegistry, MatListOption, MatSelectionList } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, Subscription, forkJoin, combineLatest } from 'rxjs';
import { MyGlobals } from '../myglobals';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { User } from 'firebase';
import { AddFriendDialogComponent } from './../dialogs/add-friend-dialog.component';

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

enum Roles {
  Owner = 'owner',
  Friend = 'friend'
}

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss']
})
export class ListViewComponent implements OnInit {
  defaultQuantity = '1';

  ownerRole = Roles.Owner;

  // Add Item Dialog Props
  itemName = '';
  quantity = this.defaultQuantity;

  // Selected List Props
  public selectedListDocument: AngularFirestoreDocument<CheckList>;
  public selectedList: CheckList;

  selectedListId: string;
  selectedListOwnerId: string;
  selectedListSubscription: Subscription;
  selectedListUserKeys: string[];

  selectAllChecked: boolean;

  maxQuantity = 10;

  numbers: string[] = [];

  editMode = false;
  listLoading = false;
  isListOfSignedInUser = false;

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

  @ViewChild(MatSelectionList) selectionListItems: MatSelectionList;

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

  toggleMassSelection(): void {
    const fakeEvent = {
      option: {
        selectionList: {
          options: {
            _results: []
          }
        }
      }
    };

    if (this.selectAllChecked) {
      fakeEvent.option.selectionList.options._results = this.selectedList.list.concat().map(entry => {
        return {selected: false};
      });
      this.selectionListItems.deselectAll();
    } else {
      fakeEvent.option.selectionList.options._results = this.selectedList.list.concat().map(entry => {
        return {selected: true};
      });
      this.selectionListItems.selectAll();
    }

    this.onSelectionChange(fakeEvent);
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
      // console.log('USER', user);

      if (user.uid) {
        this.listsArray = [];
        // console.log('CHanges', snapshotChanges);
        snapshotChanges.forEach(change => {
          const roles = change.payload.doc.data().roles;
          if (Object.keys(roles).some(key => {
            const isOwnerKey = roles[key] === Roles.Owner;

            if (isOwnerKey) {
              this.selectedListOwnerId = key;
            }

            return key === user.uid && (isOwnerKey || roles[key] === Roles.Friend );
          })) {
            this.listsArray.push(
              {
                id: change.payload.doc.id,
                name: change.payload.doc.data().name,
                roles: change.payload.doc.data().roles,
                list: change.payload.doc.data().list
              }
            );
          }
        });
      }
    });
  }

  setIsListOfSignedInUser(): void {
    setTimeout(() => {
      console.log('selectedListOwnerId', this.selectedListOwnerId);
      console.log('signedInUser.uid', this.signedInUser.uid);
      this.isListOfSignedInUser = this.selectedListOwnerId === this.signedInUser.uid;
    }, 1000);
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
        roles[this.signedInUser.uid] = Roles.Owner;
        this.createDocument(result.defaultValue, result.quantityChecked, [], roles);
      }
    });
  }

  openSelectListDialog(): void {
    this.resetSelectedList();
  }

  openAddFriendDialog(): void {
    const dialogRef = this.dialog.open(AddFriendDialogComponent, {
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
        this.selectedList.roles[user.id] = Roles.Friend;

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

  getUncheckedItems(selectedList: CheckList): number {
    let selectedItems = 0;
    selectedList.list.forEach(entry => {
      if (entry.checked) {
        selectedItems++;
      }
    });
    return selectedList.list.length - selectedItems;
  }

  editQuantityChanged(event: any): void {
    this.listLoading = true;
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
    this.selectAllChecked = false;

    if (this.selectedListSubscription) {
      this.selectedListSubscription.unsubscribe();
    }

    this.selectedListDocument = this.itemCollection.doc(listId);

    this.selectedListSubscription = this.selectedListDocument.valueChanges().subscribe(list => {
      if (list) {
        this.selectedListId = listId;
        this.selectedList = list;
        this.setIsListOfSignedInUser();
      }
    });
  }

  private resetSelectedList(): void {
    this.selectedListSubscription.unsubscribe();
    this.selectedListSubscription = null;
    this.selectedListId = null;
    this.selectedList = null;
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
        this.resetSelectedList();
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

  sortRoles(roles: any): string[] {
    const sortedRoles = [];
    let owner = '';

    Object.keys(roles).map(role => {
      if (roles[role] === Roles.Owner) {
        owner = role;
      } else {
        sortedRoles.push(role);
      }
    });

    sortedRoles.push(owner);
    return sortedRoles;
  }

  getUsernameById(id: string, list: CheckList): string {
    const userName = this.usersArray.filter(user => {
      return user.id === id;
    })[0].username;

    if (list && Object.keys(list.roles).length > 2) {
      return userName.substring(0, 2);
    }
    return userName;
  }
}
