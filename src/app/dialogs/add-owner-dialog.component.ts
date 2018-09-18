import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'add-owner-dialog.component',
    templateUrl: 'add-owner-dialog.component.html',
  })
export class AddOwnerDialogComponent {

    selectedUser: any;
    availableUsers: any[];

    constructor(
        public dialogRef: MatDialogRef<AddOwnerDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
            this.availableUsers = data.users.filter(user => {
                return !data.selectedList.roles[user.id];
            });
        }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
